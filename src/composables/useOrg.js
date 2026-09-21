import { ref, computed, watchEffect } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, doc, getDoc, updateDoc, addDoc,
  query, where, onSnapshot, arrayUnion, arrayRemove, serverTimestamp, deleteField,
} from 'firebase/firestore'
import DEFAULT_LOGO_URL from '../assets/icon-512.png'

const DEFAULT_NAME = 'Haflaway'
// What recipients see as the SMS originator until an org has its own approved
// alphanumeric sender ID. Mirrors functions/utils/senderId.js — the two SPAs
// and the functions package don't share a module tree.
const DEFAULT_SENDER_ID = 'HAFLAWAY'
const DEFAULT_FAVICON = '/src/assets/favicon.ico'
const DEFAULT_ACCENT = '#C9A84C'
const DEFAULT_SECONDARY = '#3B82F6'

// Same env var / fallback EventCampaigns.vue uses to reach haflaway_server —
// set VITE_CARD_SERVER_URL once it's deployed somewhere reachable.
const CARD_SERVER_URL = import.meta.env.VITE_CARD_SERVER_URL || 'http://localhost:8080'

async function callOrgServer(path, options = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const idToken = await user.getIdToken()
  const res = await fetch(`${CARD_SERVER_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!data.ok) throw new Error(data.message || `Request failed (HTTP ${res.status}).`)
  return data
}

// Perceptual luminance (WCAG relative luminance) → pick black or white text
// so any org-chosen color (including dark ones) stays legible.
function contrastColor(hex) {
  const clean = (hex || '').replace('#', '')
  if (clean.length !== 6) return '#070707'
  const [r, g, b] = [0, 2, 4].map(i => parseInt(clean.slice(i, i + 2), 16) / 255)
  const lin = c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return luminance > 0.45 ? '#070707' : '#f5f5f5'
}

// "#C9A84C" -> "201, 168, 76", so CSS can drop it straight into rgba(var(--gold-rgb), alpha)
// for glow effects — org-branded buttons glow in the org's own accent color.
function hexToRgb(hex) {
  const clean = (hex || '').replace('#', '')
  if (clean.length !== 6) return '201, 168, 76'
  const [r, g, b] = [0, 2, 4].map(i => parseInt(clean.slice(i, i + 2), 16))
  return `${r}, ${g}, ${b}`
}

// Optional surface overrides — org left them unset means "keep whatever the
// light/dark theme already renders there" (each field maps to a background var
// and, where text sits directly on that surface, a companion contrast-text var).
const SURFACE_TOKENS = [
  ['sidebarColor', '--org-sidebar-bg', '--org-sidebar-text'],
  ['topbarColor', '--org-topbar-bg', '--org-topbar-text'],
  ['pageBackgroundColor', '--org-page-bg', null],
]

const currentUser = ref(null)
const orgs = ref([])
const activeOrgId = ref(null)
const loading = ref(true)

let unsubOrgs = null

function resetOrgs() {
  if (unsubOrgs) { unsubOrgs(); unsubOrgs = null }
  orgs.value = []
  activeOrgId.value = null
}

async function loadOrgsFor(uid) {
  resetOrgs()
  const q = query(collection(db, 'organizations'), where('memberIds', 'array-contains', uid))
  unsubOrgs = onSnapshot(q, snap => {
    orgs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
  const userSnap = await getDoc(doc(db, 'users', uid))
  activeOrgId.value = userSnap.exists() ? (userSnap.data().activeOrgId ?? null) : null
}

onAuthStateChanged(auth, async (user) => {
  currentUser.value = user
  loading.value = true
  if (user) {
    await loadOrgsFor(user.uid)
  } else {
    resetOrgs()
  }
  loading.value = false
})

const activeOrg = computed(() => {
  if (activeOrgId.value) {
    const found = orgs.value.find(o => o.id === activeOrgId.value)
    if (found) return found
  }
  // Prefer a non-archived org when falling back to a default — an archived org
  // shouldn't silently become someone's working context just because it's first
  // in the list. If every org they're in is archived, fall back to one anyway.
  return orgs.value.find(o => !o.archived) ?? orgs.value[0] ?? null
})

const isOwner = computed(() =>
  !!activeOrg.value && !!currentUser.value && activeOrg.value.ownerId === currentUser.value.uid
)

// Whether the active org has been manually vetted to customize the app shell
// (title/favicon/colors) — see the watchEffect below. Set by hand in Firestore,
// not through any in-app flow.
const isBrandingApproved = computed(() => activeOrg.value?.brandingApproved === true)

// The org's own name/logo shown as the app-shell wordmark (topbar, sidebar) —
// same gate as the watchEffect below, exposed here so every view's brand
// markup reads one source of truth instead of re-deriving "approved ? org.x :
// default" inline (and risking a spot that forgets the check).
const brandName = computed(() => (isBrandingApproved.value && activeOrg.value?.name) || DEFAULT_NAME)
const brandLogoUrl = computed(() => (isBrandingApproved.value && activeOrg.value?.logoUrl) || DEFAULT_LOGO_URL)

// ── SMS provider credentials (smtz / wasambazie) + their sender IDs ────────
// Per-organization override for the two providers whose credentials aren't
// baked into env vars shared by every org (see haflaway_server's
// organizations/smsCredentials.js and dispatch/sms.js's
// resolveOrgSmsCredentials). Each provider's status also carries its own
// self-service sender-ID pool — a sender ID only means something against the
// provider account it was registered with, so it lives and dies with that
// provider's credentials rather than as an org-wide, staff-reviewed pool like
// before. An org still on Haflaway's shared account has no pool at all and
// always sends as HAFLAWAY. `configured` is all that's ever exposed about
// the credentials themselves — the actual secret values never round-trip
// back to the client once saved.
const smsCredentialsStatus = ref({ smtz: null, wasambazie: null })
// Whichever provider Haflaway currently routes SMS through platform-wide —
// an org's sender-ID pool only has any effect while its provider is this one.
const activeSmsProvider = ref(null)

// Not a live listener — status comes from haflaway_server, not a Firestore
// read, so this re-fetches on demand (tab open / org switch) rather than
// subscribing. Loads for every member (not just the owner): EventSettings'
// sender-ID picker needs `approvedSenderIds`/`defaultSenderId` below even for
// a non-owner viewing their own event.
async function loadSmsCredentialsStatus(orgId) {
  if (!orgId) {
    smsCredentialsStatus.value = { smtz: null, wasambazie: null }
    activeSmsProvider.value = null
    return smsCredentialsStatus.value
  }
  const { smtz, wasambazie, activeProvider } = await callOrgServer(`/organizations/${orgId}/sms-credentials/status`)
  smsCredentialsStatus.value = { smtz, wasambazie }
  activeSmsProvider.value = activeProvider ?? null
  return smsCredentialsStatus.value
}

// The sender-ID pool that's actually live right now — the active provider's,
// if the org has configured that provider's own credentials. Shaped as
// {id, value} pairs to match the old approved-sender-ID list EventSettings.vue
// already renders.
const approvedSenderIds = computed(() => {
  const entry = activeSmsProvider.value && smsCredentialsStatus.value[activeSmsProvider.value]
  if (!entry?.configured) return []
  return (entry.senderIds ?? []).map(value => ({ id: value, value }))
})
const defaultSenderId = computed(() => {
  const entry = activeSmsProvider.value && smsCredentialsStatus.value[activeSmsProvider.value]
  return (entry?.configured && entry.defaultSenderId) || null
})

// Owner-only self-service — the org registered this directly with the
// provider on their own account, so there's nothing for Haflaway to review.
// Requires that provider's credentials to already be configured.
async function addSenderId(orgId, provider, senderId) {
  const data = await callOrgServer(`/organizations/${orgId}/sms-credentials/${provider}/sender-ids`, {
    method: 'POST',
    body: JSON.stringify({ senderId }),
  })
  await loadSmsCredentialsStatus(orgId)
  return data
}
async function removeSenderId(orgId, provider, senderId) {
  const data = await callOrgServer(`/organizations/${orgId}/sms-credentials/${provider}/sender-ids/${encodeURIComponent(senderId)}`, {
    method: 'DELETE',
  })
  await loadSmsCredentialsStatus(orgId)
  return data
}

// Pins one event to a specific sender ID from the org's currently-active
// provider pool, or clears the pin (senderId null/'') so it follows the org
// default. Server-side so an event can only ever name an ID its own org
// actually owns.
async function setEventSenderId(eventId, senderId) {
  return callOrgServer(`/events/${eventId}/sender-id`, {
    method: 'POST',
    body: JSON.stringify({ senderId }),
  })
}

// Owner-only, enforced server-side (requireOrgOwner in haflaway_server).
// `credentials` is `{ apiKey }` for smtz or `{ publicKey, secretKey }` for
// wasambazie — the org's own account, created directly with that provider,
// so its SMS bills to them instead of Haflaway's shared account.
async function setSmsCredentials(orgId, provider, credentials) {
  const data = await callOrgServer(`/organizations/${orgId}/sms-credentials`, {
    method: 'POST',
    body: JSON.stringify({ provider, credentials }),
  })
  await loadSmsCredentialsStatus(orgId)
  return data
}

// Drops the org's override so dispatch falls back to the platform default —
// the org's very next SMS send bills to Haflaway's shared account again.
async function clearSmsCredentials(orgId, provider) {
  const data = await callOrgServer(`/organizations/${orgId}/sms-credentials/${provider}`, { method: 'DELETE' })
  await loadSmsCredentialsStatus(orgId)
  return data
}

// Per-member capabilities live in the org's `memberPerms` map, keyed by uid:
//   { [uid]: { canCreate: true, ... } }
// The owner is implicitly all-true and never appears in the map. Adding a
// member grants nothing — every capability is an explicit grant.

// Does the current user have permission to create events in the active org?
// (i.e. spend the org's wallet balance via an event) — owner always; otherwise
// only if the owner has explicitly granted canCreate.
const canCreateEvents = computed(() => {
  if (isOwner.value) return true
  const uid = currentUser.value?.uid
  const perms = activeOrg.value?.memberPerms ?? {}
  return !!(uid && perms[uid]?.canCreate)
})

// Read a specific member's capability flag (used by the owner's management UI).
function memberCan(memberUid, key) {
  if (memberUid && activeOrg.value?.ownerId === memberUid) return true
  return !!(activeOrg.value?.memberPerms?.[memberUid]?.[key])
}

// Owner-only: grant/revoke one capability for one member. Writes only the
// nested field so other members' permissions are left untouched.
async function setMemberPermission(orgId, memberUid, key, value) {
  await updateDoc(doc(db, 'organizations', orgId), {
    [`memberPerms.${memberUid}.${key}`]: value,
  })
}

// Apply the active org's branding to the whole app shell (tab title, favicon, colors).
// Overriding the existing --gold variable (rather than a separate one) means every view that
// already reads var(--gold) — plus everything retrofitted from hardcoded #C9A84C — picks this up.
// --gold-contrast / --org-secondary-contrast are computed so text stays legible no matter
// which color (light or dark) an org picks.
//
// Gated on `brandingApproved`: any org can save branding fields (see updateBranding /
// OrganizationSettings.vue), but they only take effect once we've manually vetted the org
// and set that flag — self-signup shouldn't be enough to repaint the whole app shell for
// every visitor. There's no in-app way to grant this on purpose; it's flipped by hand in
// the Firestore console per org.
watchEffect(() => {
  const org = activeOrg.value
  const approved = org?.brandingApproved === true

  document.title = (approved && org?.name) || DEFAULT_NAME
  const iconLink = document.querySelector('link[rel="icon"]')
  if (iconLink) iconLink.href = (approved && org?.faviconUrl) || DEFAULT_FAVICON

  const primary = (approved && org?.accentColor) || DEFAULT_ACCENT
  const secondary = (approved && org?.secondaryColor) || DEFAULT_SECONDARY
  const root = document.documentElement.style
  root.setProperty('--gold', primary)
  root.setProperty('--gold-rgb', hexToRgb(primary))
  root.setProperty('--gold-contrast', contrastColor(primary))
  root.setProperty('--org-secondary', secondary)
  root.setProperty('--org-secondary-contrast', contrastColor(secondary))

  for (const [field, bgVar, textVar] of SURFACE_TOKENS) {
    const value = approved && org?.[field]
    if (value) {
      root.setProperty(bgVar, value)
      if (textVar) root.setProperty(textVar, contrastColor(value))
    } else {
      root.removeProperty(bgVar)
      if (textVar) root.removeProperty(textVar)
    }
  }
})

async function setActiveOrg(orgId) {
  activeOrgId.value = orgId
  const uid = currentUser.value?.uid
  if (!uid) return
  await updateDoc(doc(db, 'users', uid), { activeOrgId: orgId })
}

async function createOrg(name) {
  const uid = currentUser.value?.uid
  if (!uid || !name?.trim()) return null
  const orgRef = await addDoc(collection(db, 'organizations'), {
    name: name.trim(),
    logoUrl: '',
    faviconUrl: '',
    accentColor: DEFAULT_ACCENT,
    secondaryColor: DEFAULT_SECONDARY,
    ownerId: uid,
    memberIds: [uid],
    archived: false,
    createdAt: serverTimestamp(),
  })
  await setActiveOrg(orgRef.id)
  return orgRef.id
}

async function updateBranding(orgId, fields) {
  await updateDoc(doc(db, 'organizations', orgId), fields)
}

async function addMember(orgId, uid) {
  await updateDoc(doc(db, 'organizations', orgId), { memberIds: arrayUnion(uid) })
}

async function removeMember(orgId, uid) {
  await updateDoc(doc(db, 'organizations', orgId), {
    memberIds: arrayRemove(uid),
    [`memberPerms.${uid}`]: deleteField(),
  })
}

// Owner-only: hides the org, blocks new events, keeps all data intact. Real
// deletion is staff-only (see firestore.rules) since an org can own events,
// members, and a wallet balance — too much blast radius for self-service.
async function archiveOrg(orgId) {
  await updateDoc(doc(db, 'organizations', orgId), { archived: true, archivedAt: serverTimestamp() })
}

async function unarchiveOrg(orgId) {
  await updateDoc(doc(db, 'organizations', orgId), { archived: false, archivedAt: null })
}

// A non-owner member's self-service way out (owners archive instead — an
// owner leaving their own org isn't supported without transferring ownership
// first, which doesn't exist yet). The Firestore rule only allows this exact
// shape of update (removing your own uid from memberIds, nothing else).
async function leaveOrg(orgId) {
  const uid = currentUser.value?.uid
  if (!uid) return
  await updateDoc(doc(db, 'organizations', orgId), { memberIds: arrayRemove(uid) })
  if (activeOrgId.value === orgId) {
    const next = orgs.value.find(o => o.id !== orgId && !o.archived) ?? orgs.value.find(o => o.id !== orgId) ?? null
    await setActiveOrg(next?.id ?? null)
  }
}

export function useOrg() {
  return {
    currentUser,
    orgs,
    activeOrg,
    activeOrgId,
    isOwner,
    isBrandingApproved,
    brandName,
    brandLogoUrl,
    approvedSenderIds,
    defaultSenderId,
    setEventSenderId,
    smsCredentialsStatus,
    activeSmsProvider,
    loadSmsCredentialsStatus,
    setSmsCredentials,
    clearSmsCredentials,
    addSenderId,
    removeSenderId,
    canCreateEvents,
    memberCan,
    setMemberPermission,
    loading,
    setActiveOrg,
    createOrg,
    updateBranding,
    addMember,
    removeMember,
    archiveOrg,
    unarchiveOrg,
    leaveOrg,
  }
}

export { contrastColor, DEFAULT_ACCENT, DEFAULT_SECONDARY, DEFAULT_SENDER_ID }
