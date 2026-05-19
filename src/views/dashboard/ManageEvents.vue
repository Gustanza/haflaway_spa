<template>
  <div class="page">

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Total Events</span>
          <div class="stat-icon-wrap stat-icon-wrap--neutral">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>
        <span class="stat-num">{{ events.length }}</span>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Published</span>
          <div class="stat-icon-wrap stat-icon-wrap--gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
        <span class="stat-num stat-num--gold">{{ publishedCount }}</span>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">Draft</span>
          <div class="stat-icon-wrap stat-icon-wrap--muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
        </div>
        <span class="stat-num stat-num--muted">{{ draftCount }}</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <MagnifyingGlassIcon class="search-icon" />
        <input v-model="searchQuery" class="search-input" placeholder="Search events…" />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
          <XMarkIcon class="search-clear-icon" />
        </button>
      </div>
      <div class="filter-tabs">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          :class="['tab', statusFilter === f.value && 'tab--active']"
          @click="statusFilter = f.value"
        >{{ f.label }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-center">
      <div class="spinner" />
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="state-center">
      <div class="empty-icon-wrap">
        <CalendarDaysIcon class="empty-icon" />
      </div>
      <p class="empty-title">{{ searchQuery ? 'No results found' : 'No events yet' }}</p>
      <p class="empty-sub">{{ searchQuery ? 'Try a different search term.' : 'Events created by users will appear here.' }}</p>
    </div>

    <!-- Events panel -->
    <div v-else class="events-panel">

      <!-- Panel header -->
      <div class="panel-head">
        <div class="panel-head-left">
          <span class="panel-title">Events</span>
          <span class="panel-count">{{ filtered.length }}</span>
        </div>
        <div class="panel-cols-label">
          <span>Date</span>
          <span>Status</span>
          <span>Team</span>
          <span>Organizer</span>
          <span></span>
        </div>
      </div>

      <!-- Rows -->
      <div class="events-list">
        <div v-for="e in paginated" :key="e.id" class="er">

          <!-- Thumb + title -->
          <div class="er-main">
            <div class="er-thumb">
              <img v-if="e.eventThumbnail" :src="e.eventThumbnail" class="er-thumb-img" @error="ev => ev.target.style.display='none'" />
              <CalendarDaysIcon v-else class="er-thumb-icon" />
            </div>
            <div class="er-info">
              <span class="er-title">{{ e.title || 'Untitled Event' }}</span>
              <span class="er-location">{{ e.location || '—' }}</span>
            </div>
          </div>

          <!-- Date -->
          <div class="er-cell er-date">{{ formatDateRange(e.startDate, e.endDate) }}</div>

          <!-- Status -->
          <div class="er-cell">
            <button
              :class="['er-status', isPublished(e.status) ? 'er-status--pub' : 'er-status--draft']"
              @click="toggleStatus(e)"
            >
              <span class="er-dot" />
              {{ isPublished(e.status) ? 'Published' : 'Draft' }}
            </button>
          </div>

          <!-- Team -->
          <div class="er-cell er-team">
            <span v-if="teamCount(e) !== '—'" class="team-chip">
              <svg class="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {{ teamCount(e) }}
            </span>
            <span v-else class="er-empty">—</span>
          </div>

          <!-- Organizer -->
          <div class="er-cell er-author">{{ authorEmails[e.authorId] || '—' }}</div>

          <!-- Actions -->
          <div class="er-cell er-actions">
            <button class="icon-btn" title="View"><EyeIcon class="ib-svg" /></button>
            <button class="icon-btn" title="Edit"><PencilSquareIcon class="ib-svg" /></button>
            <button class="icon-btn icon-btn--del" title="Delete"><TrashIcon class="ib-svg" /></button>
          </div>

        </div>
      </div>

    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">
        <ChevronLeftIcon class="pg-arrow" />
      </button>
      <template v-for="p in pageNumbers" :key="p">
        <span v-if="p === '…'" class="pg-ellipsis">…</span>
        <button v-else :class="['pg-btn', currentPage === p && 'pg-btn--active']" @click="currentPage = p">{{ p }}</button>
      </template>
      <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">
        <ChevronRightIcon class="pg-arrow" />
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { db } from '../../firebase.js'
import { collection, getDocs, updateDoc, doc, orderBy, query, where, documentId } from 'firebase/firestore'
import {
  MagnifyingGlassIcon, XMarkIcon, CalendarDaysIcon,
  ChevronLeftIcon, ChevronRightIcon, EyeIcon,
  PencilSquareIcon, TrashIcon,
} from '@heroicons/vue/24/outline'

const COL       = 'events'
const PAGE_SIZE = 10

const events        = ref([])
const authorEmails  = ref({})
const loading       = ref(true)
const searchQuery  = ref('')
const statusFilter = ref('all')
const currentPage  = ref(1)

const statusFilters = [
  { label: 'All',       value: 'all'       },
  { label: 'Published', value: 'published' },
  { label: 'Draft',     value: 'draft'     },
]

// ── Computed ───────────────────────────────────────────────────────────────

const publishedCount = computed(() => events.value.filter(e => isPublished(e.status)).length)
const draftCount     = computed(() => events.value.filter(e => !isPublished(e.status)).length)

const filtered = computed(() => {
  let list = events.value
  if (statusFilter.value === 'published') list = list.filter(e => isPublished(e.status))
  if (statusFilter.value === 'draft')     list = list.filter(e => !isPublished(e.status))
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(e =>
      (e.title      || '').toLowerCase().includes(q) ||
      (e.titleLower || '').includes(q) ||
      (e.location   || '').toLowerCase().includes(q)
    )
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set    = new Set([1, total, cur, cur - 1, cur + 1].filter(p => p >= 1 && p <= total))
  const sorted = [...set].sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
})

watch([searchQuery, statusFilter], () => { currentPage.value = 1 })

// ── Helpers ────────────────────────────────────────────────────────────────

function isPublished(status) {
  return (status || '').toLowerCase() === 'published'
}

async function toggleStatus(e) {
  const next = isPublished(e.status) ? 'draft' : 'published'
  e.status = next
  await updateDoc(doc(db, COL, e.id), { status: next })
}

function teamCount(e) {
  const admins   = e.adminsIds?.length  ?? 0
  const scanners = e.usersIds?.length   ?? 0
  const total    = admins + scanners
  return total === 0 ? '—' : `${total}`
}

function toDate(val) {
  if (!val) return null
  try {
    if (val?.toDate) return val.toDate()
    return new Date(val)
  } catch {
    return null
  }
}

function formatDate(val) {
  const d = toDate(val)
  if (!d || isNaN(d)) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateRange(start, end) {
  const s = toDate(start)
  const e = toDate(end)
  if (!s || isNaN(s)) return '—'

  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  if (!e || isNaN(e) || s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString('en-GB', opts)
  }

  const sameYear  = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()

  if (sameMonth) {
    return `${s.getDate()}–${e.toLocaleDateString('en-GB', opts)}`
  }
  if (sameYear) {
    const sLabel = s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    return `${sLabel} – ${e.toLocaleDateString('en-GB', opts)}`
  }
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', opts)}`
}

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchAuthorEmails(list) {
  const ids = [...new Set(list.map(e => e.authorId).filter(Boolean))]
  if (!ids.length) return
  for (let i = 0; i < ids.length; i += 30) {
    const batch = ids.slice(i, i + 30)
    const snap  = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', batch)))
    snap.docs.forEach(d => { authorEmails.value[d.id] = d.data().email || '—' })
  }
}

async function fetchEvents() {
  loading.value = true
  try {
    const snap = await getDocs(query(collection(db, COL), orderBy('startDate', 'desc')))
    events.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    const snap = await getDocs(collection(db, COL))
    events.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } finally {
    loading.value = false
  }
  await fetchAuthorEmails(events.value)
}

onMounted(fetchEvents)
</script>

<style scoped>
/* ── Page ────────────────────────────────────────────────────────────────── */
.page {
  padding: 28px 28px 48px;
  min-height: 100%;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #1C1A18;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Stats ───────────────────────────────────────────────────────────────── */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.stat-card {
  background: #FFFFFF;
  border: 1px solid #EBEBEA;
  border-radius: 16px;
  padding: 18px 20px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: #8A8580;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon-wrap svg { width: 15px; height: 15px; }
.stat-icon-wrap--neutral { background: #F2F2F0; color: #8A8580; }
.stat-icon-wrap--gold    { background: #FFF8EC; color: #C9A84C; }
.stat-icon-wrap--muted   { background: #F2F2F0; color: #B5B0A8; }

.stat-num {
  font-size: 36px;
  font-weight: 800;
  color: #1C1A18;
  letter-spacing: -1.5px;
  line-height: 1;
}
.stat-num--gold  { color: #C9A84C; }
.stat-num--muted { color: #C4BBAE; }

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-wrap {
  flex: 1;
  min-width: 220px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 15px;
  height: 15px;
  color: #C4BBAE;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 36px;
  background: #FFFFFF;
  border: 1px solid #EBEBEA;
  border-radius: 12px;
  color: #1C1A18;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 150ms, box-shadow 150ms;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.search-input::placeholder { color: #C4BBAE; }
.search-input:focus { border-color: rgba(201,168,76,0.5); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); }

.search-clear {
  position: absolute;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: none;
  background: #F2F2F0;
  color: #8A8580;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.search-clear-icon { width: 11px; height: 11px; }

.filter-tabs {
  display: flex;
  gap: 2px;
  background: #F2F2F0;
  border: 1px solid #EBEBEA;
  border-radius: 10px;
  padding: 3px;
}

.tab {
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #8A8580;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms, color 150ms;
  font-family: inherit;
  white-space: nowrap;
}
.tab:hover   { color: #1C1A18; }
.tab--active { background: #FFFFFF; color: #1C1A18; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

/* ── States ──────────────────────────────────────────────────────────────── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  gap: 12px;
  background: #FFFFFF;
  border: 1px solid #EBEBEA;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.spinner {
  width: 26px;
  height: 26px;
  border: 2px solid #EBEBEA;
  border-top-color: #C9A84C;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #FFF8EC;
  border: 1px solid rgba(201,168,76,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-icon  { width: 26px; height: 26px; color: #C9A84C; }
.empty-title { font-size: 15px; font-weight: 600; color: #1C1A18; margin: 0; }
.empty-sub   { font-size: 13px; color: #8A8580; margin: 0; text-align: center; max-width: 300px; }

/* ── Events panel ────────────────────────────────────────────────────────── */
.events-panel {
  background: #FFFFFF;
  border: 1px solid #EBEBEA;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #EBEBEA;
  background: #FAFAF8;
}

.panel-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #1C1A18;
  letter-spacing: -0.1px;
}

.panel-count {
  font-size: 11px;
  font-weight: 700;
  color: #8A8580;
  background: #F2F2F0;
  border: 1px solid #EBEBEA;
  border-radius: 6px;
  padding: 1px 7px;
}

.panel-cols-label {
  display: grid;
  grid-template-columns: 120px 110px 64px 160px 88px;
  gap: 0;
  text-align: left;
}
.panel-cols-label span {
  font-size: 10px;
  font-weight: 700;
  color: #C4BBAE;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Event rows ──────────────────────────────────────────────────────────── */
.events-list { display: flex; flex-direction: column; }

.er {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 20px;
  min-height: 72px;
  border-bottom: 1px solid #F5F4F2;
  transition: background 120ms;
  position: relative;
}
.er:last-child { border-bottom: none; }
.er:hover { background: #FDFCFA; }
.er::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #C9A84C;
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity 150ms;
}
.er:hover::before { opacity: 1; }

/* Main cell (thumb + title) — flex-1 to take remaining space */
.er-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
  padding-right: 20px;
}

.er-thumb {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #F2F2F0;
  border: 1px solid #EBEBEA;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.er-thumb-img  { width: 100%; height: 100%; object-fit: cover; display: block; }
.er-thumb-icon { width: 20px; height: 20px; color: #C4BBAE; }

.er-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.er-title    { font-size: 14px; font-weight: 600; color: #1C1A18; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.er-location { font-size: 12px; color: #B5B0A8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Aligned data cells */
.er-cell {
  flex-shrink: 0;
  font-size: 12px;
  color: #8A8580;
}
.er-date   { width: 120px; font-variant-numeric: tabular-nums; }
.er-team   { width: 64px; }
.er-author { width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #B5B0A8; font-size: 11px; }
.er-actions { width: 88px; display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
.er-empty  { color: #DEDDD9; }

/* Status pill */
.er-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  border: none;
  transition: opacity 150ms;
  width: 110px;
  white-space: nowrap;
}
.er-status:hover { opacity: 0.75; }
.er-status--pub   { background: #FFF8EC; color: #C9A84C; }
.er-status--draft { background: #F2F2F0; color: #8A8580; }
.er-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

/* Team chip */
.team-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  background: #F2F2F0;
  border: 1px solid #EBEBEA;
  font-size: 11px;
  font-weight: 600;
  color: #8A8580;
}
.chip-icon { width: 11px; height: 11px; flex-shrink: 0; }

/* Action buttons */
.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid #EBEBEA;
  background: #F2F2F0;
  color: #8A8580;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 150ms, background 150ms, border-color 150ms;
  padding: 0;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 150ms, color 150ms, background 150ms;
}
.er:hover .icon-btn { opacity: 1; }
.icon-btn:hover      { color: #C9A84C; background: #FFF8EC; border-color: rgba(201,168,76,.3); }
.icon-btn--del:hover { color: #FF453A; background: rgba(255,69,58,.08); border-color: rgba(255,69,58,.2); }
.ib-svg { width: 13px; height: 13px; }

/* ── Pagination ──────────────────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.pg-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid #EBEBEA;
  background: #FFFFFF;
  color: #6B6A68;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms, color 150ms, border-color 150ms;
  box-sizing: border-box;
}
.pg-btn:hover:not(:disabled):not(.pg-btn--active) { background: #F2F2F0; color: #1C1A18; }
.pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pg-btn--active  { background: #FFF8EC; border-color: rgba(201,168,76,.4); color: #C9A84C; cursor: default; }
.pg-arrow        { width: 14px; height: 14px; }

.pg-ellipsis {
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C4BBAE;
  font-size: 13px;
  user-select: none;
}
</style>
