<template>
  <div class="ep-root">

    <div class="ep-sticky-head">
      <div class="ep-panel-hd">
        <button type="button" class="ep-hd-burger" title="Menu" @click="navDrawer.open()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="ep-hd-sep" />
        <div class="ep-hd-badge" @click="$router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="ep-hd-brand-logo" />
          <span v-else class="ep-hd-brand-script">.joy</span>
        </div>
        <div class="ep-hd-sep" />
        <div class="ep-hd-title-group">
          <h1 class="ep-hub-title">Payments</h1>
          <span class="ep-hub-count">{{ transactions.length }}</span>
        </div>

        <div class="ep-search-wrap">
          <svg class="ep-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQ" class="ep-search" placeholder="Filter by name" />
          <button v-if="searchQ" type="button" class="ep-search-clear" @click="searchQ = ''" aria-label="Clear">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <button type="button" class="ep-ghost-btn" @click="refresh" :disabled="loading">
          <svg :class="{ 'ep-spin': loading }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
        <button type="button" class="ep-hd-gear" title="Settings" @click="$router.push(`/event/${eventId}/settings`)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div class="ep-toolbar2">
        <button
          v-for="f in TYPE_FILTERS" :key="f.val" type="button"
          class="ep-tb2-btn" :class="{ 'ep-tb2-btn--active': typeFilter === f.val }"
          @click="typeFilter = f.val; currentPage = 1"
        >
          <span class="ep-tb2-lbl">
            {{ f.label }}
            <span class="ep-tb2-cnt">{{ typeCount(f.val) }}</span>
          </span>
        </button>
        <div class="ep-tb2-divider" />
        <span class="ep-tb2-stat">Charged TZS {{ formatMoney(Math.abs(totalAmount)) }}</span>
        <span class="ep-tb2-stat">Latest {{ latestDate }}</span>
      </div>

      <div class="ep-row-grid ep-col-head" v-if="!loading && paginated.length">
        <button type="button" class="ep-col-btn" @click="toggleSort">
          Reason
          <svg class="ep-sort-icon" :class="{ 'ep-sort-icon--desc': sortDesc }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <span class="ep-col-lbl">Reference</span>
        <button type="button" class="ep-col-btn ep-col-btn--right" @click="toggleSort">Amount</button>
        <span class="ep-col-lbl">Status</span>
        <span class="ep-col-lbl">Date</span>
      </div>
    </div>

    <div class="ep-table-wrap">
      <div v-if="loading && !transactions.length" class="ep-list">
        <div v-for="n in 8" :key="n" class="ep-row-grid ep-row ep-row--sk">
          <div class="ep-sk-bar ep-sk-bar--lg" />
          <div class="ep-sk-bar ep-sk-bar--md" />
          <div class="ep-sk-bar ep-sk-bar--sm" />
          <div class="ep-sk-bar ep-sk-bar--sm" />
          <div class="ep-sk-bar ep-sk-bar--sm" />
        </div>
      </div>

      <div v-else-if="loadError" class="ep-empty">
        <p class="ep-empty-kicker">Error</p>
        <h2 class="ep-empty-title">Couldn’t load payments</h2>
        <p class="ep-empty-lede">{{ loadError }}</p>
      </div>

      <div v-else-if="!filtered.length" class="ep-empty">
        <p class="ep-empty-kicker">The ledger</p>
        <h2 class="ep-empty-title">{{ searchQ || typeFilter !== 'all' ? 'Nothing matches' : 'Still quiet' }}</h2>
        <p class="ep-empty-lede">{{ searchQ || typeFilter !== 'all' ? 'Try another search or filter.' : 'Card creation, SMS, and other platform charges land here as they happen.' }}</p>
      </div>

      <div v-else class="ep-list">
        <div v-for="trn in paginated" :key="trn.id" class="ep-row-grid ep-row">
          <span class="ep-cell-name" :title="trn.reason">{{ trn.reason || '—' }}</span>
          <span class="ep-cell-muted" :title="trn.eventId">{{ trn.eventId ?? '—' }}</span>
          <span class="ep-cell-amt" :class="{ 'ep-cell-amt--debit': (trn.amount ?? 0) < 0 }">
            TZS {{ formatMoney(trn.amount) }}
          </span>
          <span class="ep-badge" :class="`ep-badge--${statusClass(trn)}`">{{ statusLabel(trn) }}</span>
          <span class="ep-cell-muted">{{ formatDate(trn.createdAt) }}</span>
        </div>
      </div>

      <div class="ep-table-footer" v-if="!loading && !loadError">
        <span class="ep-range-lbl">
          {{ filtered.length
              ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)}`
              : '0'
          }} of {{ filtered.length }}
        </span>
        <div class="ep-paginator" :class="{ 'ep-paginator--off': totalPages <= 1 }">
          <button type="button" class="ep-page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <template v-for="p in pageNumbers" :key="String(p)">
            <span v-if="p === '…'" class="ep-page-ellipsis">…</span>
            <button v-else type="button" class="ep-page-btn" :class="{ 'ep-page-btn--on': currentPage === p }" @click="goToPage(p)">{{ p }}</button>
          </template>
          <button type="button" class="ep-page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db, auth } from '../../firebase'
import { collection, query, where, limit, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useOrg } from '../../composables/useOrg.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'

const route = useRoute()
const eventId = computed(() => route.params.eventId)
const { brandName, brandLogoUrl } = useOrg()
const navDrawer = useNavDrawer()

const PAGE_SIZE = 20
const TYPE_FILTERS = [
  { val: 'all',    label: 'All' },
  { val: 'debit',  label: 'Debits' },
  { val: 'credit', label: 'Credits' },
  { val: 'failed', label: 'Failed' },
]

const loading   = ref(true)
const loadError = ref('')
const transactions = ref([])
const searchQ   = ref('')
const typeFilter = ref('all')
const sortDesc  = ref(true)
const currentPage = ref(1)

function refresh() { if (auth.currentUser) load(auth.currentUser.uid) }

function toMs(val) {
  if (!val) return 0
  if (typeof val.toDate === 'function') return val.toDate().getTime()
  const d = new Date(val)
  return isNaN(d) ? 0 : d.getTime()
}

function formatMoney(n) {
  if (n == null) return '0'
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatDate(val) {
  if (!val) return '—'
  const d = typeof val.toDate === 'function' ? val.toDate() : new Date(val)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusClass(trn) {
  const amt = trn.amount ?? 0
  if (trn.status === 'pending') return 'pending'
  if (trn.status === 'failed') return 'failed'
  if (trn.status === 'refunded') return 'refunded'
  if (amt < 0) return 'completed'
  return 'completed'
}

function statusLabel(trn) {
  const cls = statusClass(trn)
  return cls.charAt(0).toUpperCase() + cls.slice(1)
}

function typeCount(val) {
  if (val === 'all') return transactions.value.length
  if (val === 'debit') return transactions.value.filter(t => (t.amount ?? 0) < 0).length
  if (val === 'credit') return transactions.value.filter(t => (t.amount ?? 0) >= 0).length
  return transactions.value.filter(t => t.status === 'failed').length
}

const sorted = computed(() => {
  const list = [...transactions.value]
  list.sort((a, b) => sortDesc.value ? toMs(b.createdAt) - toMs(a.createdAt) : toMs(a.createdAt) - toMs(b.createdAt))
  return list
})

const filtered = computed(() => {
  let list = sorted.value
  const q = searchQ.value.trim().toLowerCase()
  if (q) {
    list = list.filter(t =>
      (t.reason ?? '').toLowerCase().includes(q) ||
      (t.eventId ?? '').toLowerCase().includes(q)
    )
  }
  if (typeFilter.value === 'debit') list = list.filter(t => (t.amount ?? 0) < 0)
  if (typeFilter.value === 'credit') list = list.filter(t => (t.amount ?? 0) >= 0)
  if (typeFilter.value === 'failed') list = list.filter(t => t.status === 'failed')
  return list
})

const totalAmount = computed(() => transactions.value.reduce((s, t) => s + (t.amount ?? 0), 0))

const latestDate = computed(() => {
  if (!transactions.value.length) return '—'
  const ms = Math.max(...transactions.value.map(t => toMs(t.createdAt)))
  return formatDate(new Date(ms))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (cur > 3) pages.push('…')
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (cur < total - 2) pages.push('…')
  if (total > 1) pages.push(total)
  return pages
})

function goToPage(n) {
  if (n < 1 || n > totalPages.value) return
  currentPage.value = n
}

function toggleSort() { sortDesc.value = !sortDesc.value; currentPage.value = 1 }

async function load(uid) {
  loading.value = true
  loadError.value = ''
  try {
    const q = query(
      collection(db, 'userTransactions'),
      where('authorId', '==', uid),
      limit(200),
    )
    const snap = await getDocs(q)
    transactions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('EventPayments:', e)
    loadError.value = e.message ?? 'Failed to load transactions'
  } finally {
    loading.value = false
  }
}

watch(searchQ, () => { currentPage.value = 1 })

onMounted(() => {
  if (auth.currentUser) {
    load(auth.currentUser.uid)
  } else {
    const unsub = onAuthStateChanged(auth, user => {
      unsub()
      if (user) load(user.uid)
      else loading.value = false
    })
  }
})
</script>

<style scoped>
.ep-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #1f2937;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.ep-sticky-head { position: sticky; top: 0; z-index: 20; background: #fff; }
.ep-panel-hd {
  display: flex; align-items: center; height: 92px; padding: 0 36px; gap: 14px;
  border-bottom: 1px solid #f1f3f5;
}
.ep-hd-burger {
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff;
  color: #4b5563; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.ep-hd-burger:hover { background: #f8fafc; color: #18181b; border-color: #d1d5db; }
.ep-hd-sep { width: 1px; height: 16px; background: #e5e7eb; flex-shrink: 0; margin: 0 4px; }
.ep-hd-badge {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e7eb;
  overflow: hidden; background: #fff; flex-shrink: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.ep-hd-brand-logo { width: 100%; height: 100%; object-fit: cover; }
.ep-hd-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-size: 18px; font-weight: 700;
  color: #111827; letter-spacing: -0.04em; line-height: 1;
}
.ep-hd-title-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ep-hub-title { margin: 0; font-size: 22px; font-weight: 600; color: #18181b; letter-spacing: -0.015em; white-space: nowrap; }
.ep-hub-count {
  font-size: 12.5px; font-weight: 600; color: #4b5563;
  background: #f1f3f5; border-radius: 9999px; padding: 2px 10px;
}
.ep-search-wrap {
  position: relative; display: flex; align-items: center;
  flex: 1 1 0; margin: 0 20px; min-width: 220px;
}
.ep-search-icon { position: absolute; left: 16px; color: #9ca3af; pointer-events: none; }
.ep-search {
  width: 100%; height: 44px; padding: 0 44px 0 44px;
  background: #f3f4f6; border: none; border-radius: 9999px;
  font-size: 15px; color: #111827; outline: none; font-family: inherit;
}
.ep-search:focus { background: #eeeeef; }
.ep-search::placeholder { color: #9ca3af; }
.ep-search-clear {
  position: absolute; right: 10px; width: 32px; height: 32px;
  border: none; background: none; color: #9ca3af; cursor: pointer;
  display: flex; align-items: center; justify-content: center; border-radius: 50%;
}
.ep-ghost-btn {
  display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
  height: 40px; padding: 0 16px; border: 1px solid #e5e7eb; border-radius: 9999px;
  background: #fff; color: #374151; font-family: inherit;
  font-size: 13.5px; font-weight: 600; cursor: pointer;
}
.ep-ghost-btn:hover:not(:disabled) { background: #f8fafc; }
.ep-ghost-btn:disabled { opacity: 0.5; cursor: default; }
.ep-hd-gear {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.ep-hd-gear:hover { background: #f8fafc; color: #0f172a; }
.ep-spin { animation: ep-spin-anim 1.1s linear infinite; }
@keyframes ep-spin-anim { to { transform: rotate(360deg); } }

.ep-toolbar2 {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 36px; border-bottom: 1px solid #f1f3f5;
}
.ep-tb2-btn {
  display: flex; align-items: center;
  min-height: 34px; padding: 6px 14px;
  border: 1px solid #e2e8f0; border-radius: 9999px; background: #fff;
  cursor: pointer; font-family: inherit;
}
.ep-tb2-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
.ep-tb2-btn--active { background: #f1f5f9; border-color: #cbd5e1; }
.ep-tb2-lbl { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #475569; white-space: nowrap; }
.ep-tb2-btn--active .ep-tb2-lbl { color: #0f172a; font-weight: 600; }
.ep-tb2-cnt {
  min-width: 18px; padding: 1px 6px; border-radius: 9999px;
  background: #f1f5f9; font-size: 10.5px; font-weight: 700; color: #475569;
}
.ep-tb2-divider { width: 1px; height: 16px; background: #e5e7eb; margin: 0 4px; }
.ep-tb2-stat { font-size: 12.5px; font-weight: 600; color: #64748b; }

.ep-row-grid {
  display: grid;
  grid-template-columns: minmax(180px, 2fr) minmax(140px, 1.2fr) 120px 110px 120px;
  align-items: center; gap: 16px;
}
.ep-col-head { padding: 14px 36px; border-bottom: 1px solid #f1f3f5; background: #fff; }
.ep-col-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; padding: 0; cursor: pointer; font-family: inherit;
  font-size: 13px; font-weight: 700; color: #111827; justify-self: start;
}
.ep-col-btn--right { justify-self: end; }
.ep-col-lbl { font-size: 13px; font-weight: 700; color: #111827; }
.ep-sort-icon { opacity: 0.28; }
.ep-sort-icon--desc { transform: rotate(180deg); opacity: 1; }

.ep-table-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.ep-list { display: flex; flex-direction: column; }
.ep-empty { padding: 48px 36px; }
.ep-empty-kicker {
  margin: 0 0 6px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase; color: #94a3b8;
}
.ep-empty-title {
  margin: 0 0 10px;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400; font-style: italic; font-size: 28px; color: #1a1a1a;
}
.ep-empty-lede { margin: 0; max-width: 42ch; font-size: 14px; color: #64748b; line-height: 1.55; }

.ep-row { padding: 14px 36px; border-bottom: 1px solid #f1f3f5; }
.ep-row:hover:not(.ep-row--sk) { background: #f9fafb; }
.ep-row--sk { pointer-events: none; }
.ep-cell-name { font-size: 14px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ep-cell-muted { font-size: 13px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ep-cell-amt { font-size: 13.5px; font-weight: 600; color: #111827; text-align: right; font-variant-numeric: tabular-nums; }
.ep-cell-amt--debit { color: #111827; }
.ep-badge {
  display: inline-flex; align-items: center; justify-self: start;
  height: 22px; padding: 0 10px; border-radius: 9999px;
  font-size: 11.5px; font-weight: 600; background: #f3f4f6; color: #4b5563;
}
.ep-badge--completed { background: #111827; color: #fff; }
.ep-badge--pending { background: #e9eaee; color: #111827; }
.ep-badge--failed { background: #fef2f2; color: #9f1239; }
.ep-badge--refunded { background: #f3f4f6; color: #4b5563; }

.ep-table-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 36px; border-top: 1px solid #f1f3f5; gap: 12px; flex-wrap: wrap;
}
.ep-range-lbl { font-size: 12.5px; color: #64748b; font-weight: 500; }
.ep-paginator { display: flex; align-items: center; gap: 4px; }
.ep-paginator--off { opacity: 0.4; pointer-events: none; }
.ep-page-btn {
  min-width: 32px; height: 32px; padding: 0 6px;
  border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;
  font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: inherit;
}
.ep-page-btn:hover:not(:disabled):not(.ep-page-btn--on) { background: #f8fafc; color: #111827; }
.ep-page-btn--on { background: #f1f5f9; color: #111827; font-weight: 600; cursor: default; }
.ep-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.ep-page-ellipsis { min-width: 28px; height: 32px; display: flex; align-items: center; justify-content: center; color: #94a3b8; }

@keyframes ep-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.ep-sk-bar { height: 12px; border-radius: 6px; background: #f1f5f9; animation: ep-pulse 1.4s ease-in-out infinite; }
.ep-sk-bar--lg { width: 160px; }
.ep-sk-bar--md { width: 90px; }
.ep-sk-bar--sm { width: 64px; }

@media (max-width: 900px) {
  .ep-panel-hd { height: auto; flex-wrap: wrap; padding: 12px 16px; gap: 10px; }
  .ep-toolbar2, .ep-col-head, .ep-row, .ep-empty, .ep-table-footer { padding-left: 16px; padding-right: 16px; }
  .ep-search-wrap { flex: 1 1 100%; margin: 8px 0 0; order: 8; }
  .ep-hd-sep { display: none; }
  .ep-row-grid { grid-template-columns: minmax(140px, 1.6fr) minmax(80px, 1fr) 90px 90px 90px; gap: 10px; }
}
@media (max-width: 720px) {
  .ep-col-head { display: none; }
  .ep-row-grid { grid-template-columns: 1fr auto auto; }
  .ep-row > :nth-child(2),
  .ep-row > :nth-child(5) { display: none; }
}
</style>
