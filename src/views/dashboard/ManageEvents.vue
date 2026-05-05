<template>
  <div class="page">

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <span class="stat-num">{{ events.length }}</span>
        <span class="stat-label">Total Events</span>
      </div>
      <div class="stat-card">
        <span class="stat-num stat-num--gold">{{ publishedCount }}</span>
        <span class="stat-label">Published</span>
      </div>
      <div class="stat-card">
        <span class="stat-num stat-num--muted">{{ draftCount }}</span>
        <span class="stat-label">Draft</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <MagnifyingGlassIcon class="search-icon" />
        <input v-model="searchQuery" class="search-input" placeholder="Search by event title…" />
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

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="th">Event</th>
            <th class="th">Admin</th>
            <th class="th">Dates</th>
            <th class="th">Status</th>
            <th class="th">Team</th>
            <th class="th">Created</th>
            <th class="th th--end"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in paginated" :key="e.id" class="row">

            <!-- Event cell -->
            <td class="td">
              <div class="event-cell">
                <div class="thumb-wrap">
                  <img v-if="e.eventThumbnail" :src="e.eventThumbnail" class="thumb-img" @error="ev => ev.target.style.display='none'" />
                  <CalendarDaysIcon v-else class="thumb-fallback" />
                </div>
                <div class="event-meta">
                  <span class="event-title">{{ e.title || 'Untitled Event' }}</span>
                  <span class="event-location">{{ e.location || '—' }}</span>
                </div>
              </div>
            </td>

            <!-- Admin email -->
            <td class="td">
              <span class="admin-email">{{ authorEmails[e.authorId] || '—' }}</span>
            </td>

            <!-- Dates -->
            <td class="td td--secondary">
              <span class="date-range">{{ formatDateRange(e.startDate, e.endDate) }}</span>
            </td>

            <!-- Status -->
            <td class="td">
              <button
                :class="['status-badge', isPublished(e.status) ? 'status-badge--pub' : 'status-badge--draft']"
                @click="toggleStatus(e)"
              >
                {{ isPublished(e.status) ? 'Published' : 'Draft' }}
              </button>
            </td>

            <!-- Team -->
            <td class="td td--secondary">{{ teamCount(e) }}</td>

            <!-- Created -->
            <td class="td td--secondary">{{ formatDate(e.createdAt) }}</td>

            <!-- Actions -->
            <td class="td">
              <div class="row-actions">
                <button class="icon-btn" title="View" @click="() => {}">
                  <EyeIcon class="ib-svg" />
                </button>
                <button class="icon-btn" title="Edit" @click="() => {}">
                  <PencilSquareIcon class="ib-svg" />
                </button>
                <button class="icon-btn icon-btn--del" title="Delete" @click="() => {}">
                  <TrashIcon class="ib-svg" />
                </button>
              </div>
            </td>

          </tr>
        </tbody>
      </table>
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
  color: #EEEEF0;
  box-sizing: border-box;
}

/* ── Stats ───────────────────────────────────────────────────────────────── */
.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 14px;
  padding: 16px 20px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #EEEEF0;
  letter-spacing: -1px;
  line-height: 1;
}
.stat-num--gold  { color: #C9A84C; }
.stat-num--muted { color: #8E8E93; }

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
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
  width: 16px;
  height: 16px;
  color: #48484A;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 36px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 12px;
  color: #EEEEF0;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 150ms;
}
.search-input::placeholder { color: #48484A; }
.search-input:focus { border-color: rgba(201, 168, 76, 0.5); }

.search-clear {
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: #28282C;
  color: #8E8E93;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.search-clear:hover { color: #EEEEF0; }
.search-clear-icon { width: 12px; height: 12px; }

.filter-tabs {
  display: flex;
  gap: 4px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 12px;
  padding: 4px;
}

.tab {
  padding: 7px 14px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms, color 150ms;
  font-family: inherit;
  white-space: nowrap;
}
.tab:hover   { color: #AEAEB2; }
.tab--active { background: #2A2210; color: #C9A84C; }

/* ── States ──────────────────────────────────────────────────────────────── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  gap: 12px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #2C2C2E;
  border-top-color: #C9A84C;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: #2A2210;
  border: 0.8px solid rgba(201, 168, 76, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-icon  { width: 28px; height: 28px; color: #C9A84C; }
.empty-title { font-size: 16px; font-weight: 600; color: #EEEEF0; margin: 0; }
.empty-sub   { font-size: 13px; color: #8E8E93; margin: 0; text-align: center; max-width: 300px; }

/* ── Table ───────────────────────────────────────────────────────────────── */
.table-wrap {
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 16px;
  overflow: hidden;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

.th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #8E8E93;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  border-bottom: 0.8px solid #2C2C2E;
  white-space: nowrap;
  background: #1C1C1E;
}

.row { transition: background 100ms; }
.row:hover { background: #28282C; }
.row:not(:last-child) .td { border-bottom: 0.8px solid #2C2C2E; }

.td {
  padding: 12px 16px;
  font-size: 13px;
  color: #AEAEB2;
  vertical-align: middle;
  white-space: nowrap;
}
.td--secondary { color: #8E8E93; font-size: 12px; }

/* Event cell */
.event-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
}

.thumb-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #28282C;
  border: 0.8px solid #2C2C2E;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-fallback { width: 20px; height: 20px; color: #48484A; }

.event-meta   { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.event-title  { font-size: 13px; font-weight: 600; color: #EEEEF0; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.event-location { font-size: 11px; color: #8E8E93; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }

/* Date range */
.date-range { font-variant-numeric: tabular-nums; }

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
}
.status-badge:hover { opacity: 0.75; }
.status-badge--pub   { background: #2A2210; color: #C9A84C; border: 0.6px solid rgba(201,168,76,.3); }
.status-badge--draft { background: #28282C; color: #8E8E93; border: 0.6px solid #2C2C2E; }

/* Admin email */
.admin-email {
  font-size: 12px;
  color: #AEAEB2;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* Row actions */
.th--end { width: 96px; }

.row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 0.8px solid #2C2C2E;
  background: #28282C;
  color: #8E8E93;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 150ms, background 150ms, border-color 150ms;
  padding: 0;
  box-sizing: border-box;
}
.icon-btn:hover      { color: #C9A84C; background: #2A2210; border-color: rgba(201,168,76,.3); }
.icon-btn--del:hover { color: #FF453A; background: rgba(255,69,58,.1); border-color: rgba(255,69,58,.25); }
.ib-svg { width: 14px; height: 14px; }

/* ── Pagination ──────────────────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 28px;
}

.pg-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-radius: 9px;
  border: 0.8px solid #2C2C2E;
  background: #1C1C1E;
  color: #AEAEB2;
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
.pg-btn:hover:not(:disabled):not(.pg-btn--active) { background: #28282C; color: #EEEEF0; }
.pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pg-btn--active  { background: #2A2210; border-color: rgba(201,168,76,.4); color: #C9A84C; cursor: default; }
.pg-arrow        { width: 14px; height: 14px; }

.pg-ellipsis {
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #48484A;
  font-size: 13px;
  user-select: none;
}
</style>
