import { ref, computed, watch } from 'vue'
import { db, functions } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import { doc, getDocs, collection, query, where, onSnapshot } from 'firebase/firestore'
import { useOrg } from './useOrg.js'

const { activeOrg } = useOrg()

const orgBalance = computed(() => activeOrg.value ? (activeOrg.value.balance ?? 0) : null)

function formatBalance(n) {
  if (n == null) return '—'
  return 'TZS ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const topUpAmount = ref(null)
const topUpPhone = ref('')
const topUpStatus = ref('') // '' | 'pending' | 'timeout' | 'success' | 'failed'
const topUpError = ref('')
const topUpOrderRef = ref('')
const checkingStatus = ref(false)
let unsubTopUp = null
let topUpTimeoutId = null

// This is module-level singleton state (same pattern as useOrg/useTheme), not
// per-component — so a top-up started from the dashboard stays tracked if the
// user navigates into an event page, and vice versa, without a second listener.

// ClickPesa's webhook for this channel (HALOPESA USSD push) has been observed
// taking around 5 minutes to land, even for a normal approval/decline — not
// the few seconds you'd expect. 90s was declaring timeout while the payment
// was still legitimately in flight, which just drove people to retry into a
// second concurrent attempt. Give it real headroom before giving up (the
// listener stays attached regardless, so a late arrival still resolves it).
const TOPUP_WAIT_MS = 6 * 60_000

function clearTopUpTimer() {
  if (topUpTimeoutId) { clearTimeout(topUpTimeoutId); topUpTimeoutId = null }
}
// Arms the timeout against the payment's actual start time (not "now"), so a
// page reload or navigation doesn't hand out a fresh window for a payment
// that's already been sitting there for minutes.
function armTopUpTimer(startedAtMs) {
  clearTopUpTimer()
  const remaining = TOPUP_WAIT_MS - (Date.now() - startedAtMs)
  if (remaining <= 0) {
    topUpStatus.value = 'timeout'
    return
  }
  topUpTimeoutId = setTimeout(() => {
    if (topUpStatus.value === 'pending') topUpStatus.value = 'timeout'
  }, remaining)
}

const canTopUp = computed(() =>
  !!activeOrg.value &&
  Number(topUpAmount.value) > 0 &&
  topUpPhone.value.trim().length > 0 &&
  topUpStatus.value !== 'pending'
)

async function handleTopUp() {
  if (!activeOrg.value || !canTopUp.value) return
  topUpError.value = ''
  topUpStatus.value = 'pending'
  try {
    const initiateOrgTopUp = httpsCallable(functions, 'initiateOrgTopUp')
    const result = await initiateOrgTopUp({
      orgId: activeOrg.value.id,
      amount: Number(topUpAmount.value),
      phoneNumber: `255${topUpPhone.value.trim()}`,
    })
    topUpOrderRef.value = result.data.orderReference
    listenForTopUp(result.data.orderReference)
    armTopUpTimer(Date.now())
  } catch (e) {
    topUpStatus.value = 'failed'
    topUpError.value = e?.message || 'Failed to start top-up. Please try again.'
  }
}

// Abandoned USSD pushes (user never approves/declines the phone prompt) often
// never get a terminal webhook from ClickPesa at all — the record just sits
// at PROCESSING forever. Without this, recovery would resurrect the same dead
// "waiting for confirmation" card on every load with no way out. Dismissal is
// local-only: it doesn't change anything server-side, it just stops this
// client from re-surfacing an order the user has already given up on.
const DISMISSED_TOPUPS_KEY = 'haflaway:dismissedTopUps'
function getDismissedTopUps() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_TOPUPS_KEY) ?? '[]')) }
  catch { return new Set() }
}
function dismissTopUp(orderReference) {
  const dismissed = getDismissedTopUps()
  dismissed.add(orderReference)
  localStorage.setItem(DISMISSED_TOPUPS_KEY, JSON.stringify([...dismissed]))
}

// Recovers an in-flight top-up after a page reload/navigation.
async function recoverPendingTopUp(orgId) {
  if (!orgId) return
  try {
    const dismissed = getDismissedTopUps()
    const snap = await getDocs(query(
      collection(db, 'clickpesaPayments'),
      where('orgId', '==', orgId),
      where('status', '==', 'PROCESSING'),
    ))
    if (snap.empty) return
    const mostRecent = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => !dismissed.has(p.id))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))[0]
    if (!mostRecent) return
    topUpOrderRef.value = mostRecent.id
    topUpStatus.value = 'pending'
    topUpAmount.value = mostRecent.amount ?? null
    topUpPhone.value = mostRecent.phoneNumber ? String(mostRecent.phoneNumber).replace(/^255/, '') : ''
    listenForTopUp(mostRecent.id)
    armTopUpTimer(mostRecent.createdAt?.toMillis?.() ?? Date.now())
  } catch (e) {
    console.error('recoverPendingTopUp:', e)
  }
}
// Module-level (not per-component onMounted), so it fires exactly once per
// org switch regardless of how many components use this composable.
let recoveredForOrgId = null
watch(() => activeOrg.value?.id, (orgId) => {
  if (orgId && orgId !== recoveredForOrgId) {
    recoveredForOrgId = orgId
    recoverPendingTopUp(orgId)
  }
}, { immediate: true })

function listenForTopUp(orderReference) {
  if (unsubTopUp) unsubTopUp()
  unsubTopUp = onSnapshot(doc(db, 'clickpesaPayments', orderReference), (snap) => {
    if (!snap.exists()) return
    const status = snap.data().status
    if (status === 'SUCCESS' || status === 'SETTLED') {
      topUpStatus.value = 'success'
      clearTopUpTimer()
      unsubTopUp?.(); unsubTopUp = null
    } else if (status === 'FAILED') {
      topUpStatus.value = 'failed'
      clearTopUpTimer()
      unsubTopUp?.(); unsubTopUp = null
    }
    // PROCESSING — keep waiting for the webhook to land.
  })
}

// Fallback for when the webhook fails or is delayed: independently asks
// ClickPesa (not the client) whether the payment actually succeeded.
async function handleCheckStatus() {
  if (!topUpOrderRef.value || checkingStatus.value) return
  checkingStatus.value = true
  topUpError.value = ''
  try {
    const reconcileOrgTopUp = httpsCallable(functions, 'reconcileOrgTopUp')
    const result = await reconcileOrgTopUp({ orderReference: topUpOrderRef.value })
    const status = result.data.status
    if (status === 'SUCCESS' || status === 'SETTLED') {
      topUpStatus.value = 'success'
      clearTopUpTimer()
      unsubTopUp?.(); unsubTopUp = null
    } else if (status === 'FAILED') {
      topUpStatus.value = 'failed'
      clearTopUpTimer()
      unsubTopUp?.(); unsubTopUp = null
    } else {
      topUpError.value = `ClickPesa reports this payment is still ${status?.toLowerCase() ?? 'pending'}.`
    }
  } catch (e) {
    topUpError.value = e?.message || 'Could not check status. Please try again.'
  } finally {
    checkingStatus.value = false
  }
}

// Lets the user give up on a stuck/timed-out attempt and start clean, instead
// of being stuck re-seeing "waiting for confirmation" on every load.
function handleStartNewTopUp() {
  if (topUpOrderRef.value) dismissTopUp(topUpOrderRef.value)
  unsubTopUp?.(); unsubTopUp = null
  clearTopUpTimer()
  topUpOrderRef.value = ''
  topUpStatus.value = ''
  topUpError.value = ''
  topUpAmount.value = null
  topUpPhone.value = ''
}

export function useTopUp() {
  return {
    orgBalance,
    formatBalance,
    topUpAmount,
    topUpPhone,
    topUpStatus,
    topUpError,
    checkingStatus,
    canTopUp,
    handleTopUp,
    handleCheckStatus,
    handleStartNewTopUp,
  }
}
