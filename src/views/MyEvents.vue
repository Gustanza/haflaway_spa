<template>
  <div class="me-root">

    <!-- Brand nav -->
    <nav class="me-nav">
      <div class="me-nav-inner">
        <div class="me-nav-left">
          <div class="me-brand" @click="$router.push('/')">
            <span class="me-brand-dot" />
            <span class="me-brand-name">Haflaway</span>
          </div>
          <div class="me-breadcrumb">
            <span class="me-breadcrumb-sep">/</span>
            <span class="me-breadcrumb-page">My Events</span>
          </div>
        </div>
        <div class="me-nav-right">
          <button class="me-create-btn" @click="$router.push('/create-event')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Event
          </button>
          <div class="me-avatar-pill">
            <div class="me-avatar-dot" />
            <span class="me-avatar-label">Admin</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Body: sidebar + list -->
    <div class="me-body">

      <!-- Sidebar -->
      <aside class="me-sidebar">

        <!-- Search -->
        <div class="me-search-wrap">
          <span class="me-search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            class="me-search-input"
            placeholder="Search events…"
            @input="onSearch"
          />
          <button v-if="searchQuery" class="me-search-clear" @click="clearSearch">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Status filter -->
        <div class="me-filter-section">
          <button class="me-filter-section-head" @click="statusOpen = !statusOpen">
            <span>Status</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: statusOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div v-if="statusOpen" class="me-filter-options">
            <label v-for="f in statusFilters" :key="f.value" class="me-radio-label">
              <input type="radio" :value="f.value" v-model="activeFilter" class="me-radio" @change="clearSearch" />
              <span class="me-radio-custom" :class="{ 'me-radio-custom--active': activeFilter === f.value }" />
              <span class="me-radio-text">{{ f.label }}</span>
              <span class="me-radio-count">{{ f.count }}</span>
            </label>
          </div>
        </div>

        <!-- Role filter -->
        <div class="me-filter-section">
          <button class="me-filter-section-head" @click="roleOpen = !roleOpen">
            <span>Role</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: roleOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div v-if="roleOpen" class="me-filter-options">
            <label v-for="r in roleFilters" :key="r.value" class="me-radio-label">
              <input type="radio" :value="r.value" v-model="activeRole" class="me-radio" />
              <span class="me-radio-custom" :class="{ 'me-radio-custom--active': activeRole === r.value }" />
              <span class="me-radio-text">{{ r.label }}</span>
            </label>
          </div>
        </div>

      </aside>

      <!-- Main list -->
      <div class="me-list-area">

        <!-- Results count -->
        <div class="me-results-bar">
          <span class="me-results-count">
            <template v-if="loading">Loading…</template>
            <template v-else>
              {{ sourceEvents.length }} event{{ sourceEvents.length !== 1 ? 's' : '' }} found
              <span v-if="totalPages > 1" class="me-results-page"> · page {{ currentPage }} of {{ totalPages }}</span>
            </template>
          </span>
        </div>

        <!-- Skeletons -->
        <div v-if="loading" class="me-list">
          <div class="me-row-skeleton" v-for="i in 4" :key="i" />
        </div>

        <!-- Empty -->
        <div v-else-if="displayedEvents.length === 0" class="me-empty">
          <div class="me-empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p class="me-empty-title">{{ searchQuery ? `No results for "${searchQuery}"` : 'No events found' }}</p>
          <p class="me-empty-sub">{{ searchQuery ? 'Try a different search term.' : 'No events match the current filter.' }}</p>
        </div>

        <!-- Event rows -->
        <div v-else class="me-list">
          <div
            v-for="event in displayedEvents"
            :key="event.id"
            class="me-row"
            @click="goToEvent(event.id)"
          >
            <!-- Thumbnail -->
            <div class="me-row-thumb">
              <img v-if="event.eventThumbnail" :src="event.eventThumbnail" :alt="event.title" />
              <div v-else class="me-row-thumb-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.45)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            </div>

            <!-- Content -->
            <div class="me-row-content">
              <div class="me-row-chips">
                <span class="me-row-pub-chip" :class="event.status === 'Published' ? 'me-row-pub-chip--pub' : 'me-row-pub-chip--draft'">
                  {{ event.status === 'Published' ? 'Published' : 'Draft' }}
                </span>
                <span class="me-row-status-chip" :class="`me-row-status-chip--${statusClass(event)}`">
                  {{ statusLabel(event) }}
                </span>
                <span v-if="event.categoryId" class="me-row-cat-chip">{{ event.categoryId }}</span>
                <span class="me-row-role-chip" :class="event.authorId === uid ? 'me-row-role-chip--owner' : ''">
                  {{ event.authorId === uid ? 'Owner' : 'Admin' }}
                </span>
              </div>

              <h3 class="me-row-title">{{ event.title }}</h3>

              <div class="me-row-meta">
                <div class="me-row-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>{{ formatFullDate(event.startDate) }}<template v-if="event.endDate"> – {{ formatFullDate(event.endDate) }}</template></span>
                </div>
                <div v-if="event.location" class="me-row-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{{ event.location }}</span>
                </div>
              </div>

              <div class="me-row-bottom">
                <div class="me-row-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>{{ event.adminsIds?.length ?? 1 }} team member{{ (event.adminsIds?.length ?? 1) !== 1 ? 's' : '' }}</span>
                </div>
                <div class="me-row-actions">
                  <button class="me-row-edit-btn" @click.stop="$router.push(`/edit-event/${event.id}`)" title="Edit event">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button class="me-row-manage-btn" @click.stop="goToEvent(event.id)">
                    Manage →
                  </button>
                </div>
              </div>
            </div>

            <!-- Date badge -->
            <div class="me-row-date-badge">
              <span class="me-row-date-month">{{ formatMonth(event.startDate) }}</span>
              <span class="me-row-date-day">{{ formatDay(event.startDate) }}</span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="!loading && totalPages > 1" class="me-pagination">
          <button class="me-page-btn me-page-btn--nav" :disabled="currentPage === 1" @click="currentPage--">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <template v-for="p in pageRange" :key="p">
            <span v-if="p === '…'" class="me-page-ellipsis">…</span>
            <button
              v-else
              class="me-page-btn"
              :class="{ 'me-page-btn--active': p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</button>
          </template>

          <button class="me-page-btn me-page-btn--nav" :disabled="currentPage === totalPages" @click="currentPage++">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth } from '../firebase'
import {
  collection, query, where, orderBy, getDocs,
} from 'firebase/firestore'

const PAGE_SIZE = 10
const router = useRouter()
const uid = auth.currentUser?.uid ?? null

const events = ref([])
const searchResults = ref([])
const loading = ref(true)
const currentPage = ref(1)
const activeFilter = ref('all')
const activeRole = ref('all')
const searchQuery = ref('')
const statusOpen = ref(true)
const roleOpen = ref(true)
let searchTimer = null

// ── Firestore ──────────────────────────────────────────────────────────────

async function loadEvents() {
  if (!uid) { loading.value = false; return }
  loading.value = true
  try {
    const snap = await getDocs(query(
      collection(db, 'events'),
      where('adminsIds', 'array-contains', uid),
      orderBy('startDate', 'desc'),
    ))
    events.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('loadEvents:', e)
  } finally {
    loading.value = false
  }
}

async function performSearch(key) {
  if (!uid || !key) { searchResults.value = []; return }
  const k = key.toLowerCase()
  try {
    const snap = await getDocs(query(
      collection(db, 'events'),
      where('adminsIds', 'array-contains', uid),
      where('titleLower', '>=', k),
      where('titleLower', '<=', k + ''),
      limit(20),
    ))
    searchResults.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('performSearch:', e)
  }
}

// ── Status ─────────────────────────────────────────────────────────────────

function statusClass(event) {
  const now = new Date()
  const start = event.startDate ? new Date(event.startDate) : null
  const end = event.endDate
    ? new Date(event.endDate)
    : start ? new Date(start.getTime() + 86400000) : null
  if (!start) return 'upcoming'
  if (now < start) return 'upcoming'
  if (end && now <= end) return 'ongoing'
  return 'completed'
}

function statusLabel(event) {
  return { upcoming: 'Upcoming', ongoing: 'Live', completed: 'Completed' }[statusClass(event)]
}

// ── Filters ────────────────────────────────────────────────────────────────

const statusFilters = computed(() => [
  { label: 'All',       value: 'all',       count: events.value.length },
  { label: 'Upcoming',  value: 'upcoming',  count: events.value.filter(e => statusClass(e) === 'upcoming').length },
  { label: 'Ongoing',   value: 'ongoing',   count: events.value.filter(e => statusClass(e) === 'ongoing').length },
  { label: 'Completed', value: 'completed', count: events.value.filter(e => statusClass(e) === 'completed').length },
])

const roleFilters = [
  { label: 'All roles', value: 'all' },
  { label: 'Owner',     value: 'owner' },
  { label: 'Admin',     value: 'admin' },
]

const filteredEvents = computed(() => {
  let list = events.value
  if (activeFilter.value !== 'all') list = list.filter(e => statusClass(e) === activeFilter.value)
  if (activeRole.value === 'owner')  list = list.filter(e => e.authorId === uid)
  if (activeRole.value === 'admin')  list = list.filter(e => e.authorId !== uid)
  return list
})

const sourceEvents = computed(() =>
  searchQuery.value ? searchResults.value : filteredEvents.value
)

const totalPages = computed(() => Math.ceil(sourceEvents.value.length / PAGE_SIZE))

const displayedEvents = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sourceEvents.value.slice(start, start + PAGE_SIZE)
})

const pageRange = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (cur > 3) pages.push('…')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2) pages.push('…')
  pages.push(total)
  return pages
})

// ── Interactions ───────────────────────────────────────────────────────────

function onSearch() {
  clearTimeout(searchTimer)
  currentPage.value = 1
  if (!searchQuery.value.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(() => performSearch(searchQuery.value.trim()), 300)
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  currentPage.value = 1
}

// ── Date formatting ────────────────────────────────────────────────────────


function formatMonth(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en', { month: 'short' }).toUpperCase()
}

function formatDay(iso) {
  if (!iso) return '—'
  return new Date(iso).getDate()
}

function formatFullDate(iso) {
  if (!iso) return 'Date TBD'
  return new Date(iso).toLocaleDateString('en', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

function goToEvent(id) {
  router.push(`/event/${id}`)
}

watch([activeFilter, activeRole], () => { currentPage.value = 1 })

onMounted(loadEvents)
</script>

<style scoped>
.me-root {
  min-height: 100vh;
  background: #F8F8F6;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Brand nav ── */
.me-nav {
  background: #FFFFFF;
  border-bottom: 0.8px solid #EBEBEA;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.me-nav-inner {
  max-width: 1160px;
  margin: 0 auto;
  padding: 28px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.me-nav-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.me-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
}
.me-brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #C9A84C;
  flex-shrink: 0;
}
.me-brand-name {
  font-size: 22px;
  font-weight: 800;
  color: #1C1A18;
  letter-spacing: -0.5px;
}
.me-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}
.me-breadcrumb-sep {
  font-size: 16px;
  color: #D0CEC9;
  font-weight: 300;
}
.me-breadcrumb-page {
  font-size: 15px;
  font-weight: 500;
  color: #8A8580;
}
.me-nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.me-create-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #C9A84C;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 140ms;
  font-family: inherit;
}
.me-create-btn:hover { opacity: 0.88; }
.me-avatar-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  border: 0.8px solid #EBEBEA;
  background: #FFFFFF;
}
.me-avatar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #C9A84C;
}
.me-avatar-label {
  font-size: 12px;
  font-weight: 500;
  color: #6B6A68;
}


/* ── Body layout ── */
.me-body {
  max-width: 1160px;
  margin: 0 auto;
  padding: 32px 36px 64px;
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

/* ── Sidebar ── */
.me-sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: sticky;
  top: 24px;
}

/* Search */
.me-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.me-search-icon {
  position: absolute;
  left: 11px;
  color: #B5B0A8;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.me-search-input {
  width: 100%;
  padding: 9px 32px 9px 34px;
  border: 0.8px solid #EBEBEA;
  border-radius: 10px;
  background: #FFFFFF;
  font-size: 13px;
  color: #1C1A18;
  outline: none;
  font-family: inherit;
  transition: border-color 140ms, box-shadow 140ms;
  box-sizing: border-box;
}
.me-search-input::placeholder { color: #B5B0A8; }
.me-search-input:focus {
  border-color: rgba(201,168,76,0.45);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.09);
}
.me-search-clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: #B5B0A8;
  display: flex;
  align-items: center;
  padding: 2px;
  transition: color 130ms;
}
.me-search-clear:hover { color: #6B6A68; }

/* Filter accordion section */
.me-filter-section {
  background: #FFFFFF;
  border: 0.8px solid #EBEBEA;
  border-radius: 12px;
  overflow: hidden;
}
.me-filter-section-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #1C1A18;
  font-family: inherit;
}
.me-filter-section-head:hover { background: #FAFAF8; }
.me-filter-options {
  border-top: 0.8px solid #F2F2F0;
  padding: 10px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.me-radio-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.me-radio { display: none; }
.me-radio-custom {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #EBEBEA;
  flex-shrink: 0;
  transition: border-color 130ms;
  position: relative;
  background: #FFFFFF;
}
.me-radio-custom--active {
  border-color: #C9A84C;
  border-width: 5px;
}
.me-radio-text {
  font-size: 13px;
  color: #6B6A68;
  flex: 1;
}
.me-radio-count {
  font-size: 11px;
  color: #B5B0A8;
  background: #F2F2F0;
  border-radius: 8px;
  padding: 1px 7px;
  font-weight: 500;
}

/* ── List area ── */
.me-list-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.me-results-bar {
  padding-bottom: 4px;
}
.me-results-count {
  font-size: 14px;
  font-weight: 500;
  color: #6B6A68;
}
.me-results-page {
  color: #B5B0A8;
  font-weight: 400;
}

/* ── Skeletons ── */
.me-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.me-row-skeleton {
  height: 140px;
  border-radius: 14px;
  background: linear-gradient(90deg, #F0EFED 25%, #E8E7E4 50%, #F0EFED 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Empty ── */
.me-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 20px;
  gap: 10px;
  background: #FFFFFF;
  border: 0.8px solid #EBEBEA;
  border-radius: 16px;
}
.me-empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #FFF8EC;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.me-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #1C1A18;
  margin: 0;
}
.me-empty-sub {
  font-size: 13px;
  color: #8A8580;
  margin: 0;
  text-align: center;
}

/* ── Event row ── */
.me-row {
  background: #FFFFFF;
  border: 0.8px solid #EBEBEA;
  border-radius: 14px;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 160ms, border-color 160ms;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.me-row:hover {
  box-shadow: 0 4px 18px rgba(0,0,0,0.09);
  border-color: rgba(201,168,76,0.3);
}

/* Thumbnail */
.me-row-thumb {
  width: 180px;
  flex-shrink: 0;
  background: #F2F2F0;
  position: relative;
  overflow: hidden;
}
.me-row-thumb img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.me-row-thumb-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F5F4F1, #ECEAE5);
}

/* Row content */
.me-row-content {
  flex: 1;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.me-row-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.me-row-status-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
  letter-spacing: 0.2px;
}
.me-row-status-chip--upcoming  { background: #F2F2F0; color: #6B6A68; }
.me-row-status-chip--ongoing   { background: rgba(52,199,89,0.12); color: #1D7A38; border: 0.8px solid rgba(52,199,89,0.25); }
.me-row-status-chip--completed { background: #F2F2F0; color: #8A8580; }

.me-row-cat-chip {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 20px;
  background: rgba(201,168,76,0.1);
  color: #A8841A;
  border: 0.8px solid rgba(201,168,76,0.2);
}
.me-row-role-chip {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: #F2F2F0;
  color: #8A8580;
}
.me-row-role-chip--owner {
  background: #FFF8EC;
  color: #C9A84C;
  border: 0.8px solid rgba(201,168,76,0.25);
}

.me-row-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1A18;
  margin: 2px 0 4px;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.me-row-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.me-row-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8A8580;
}

.me-row-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}

.me-row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.me-row-edit-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 0.8px solid #EBEBEA;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6B6A68;
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms, border-color 130ms, color 130ms;
}
.me-row-edit-btn:hover {
  background: #F2F2F0;
  border-color: #D0CEC9;
  color: #1C1A18;
}
.me-row-manage-btn {
  background: none;
  border: 0.8px solid #EBEBEA;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #C9A84C;
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms, border-color 130ms;
}
.me-row-manage-btn:hover {
  background: #FFF8EC;
  border-color: rgba(201,168,76,0.3);
}

/* Date badge */
.me-row-date-badge {
  width: 72px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-left: 0.8px solid #F2F2F0;
  padding: 16px 8px;
  gap: 2px;
}
.me-row-date-month {
  font-size: 10px;
  font-weight: 700;
  color: #C9A84C;
  letter-spacing: 0.6px;
}
.me-row-date-day {
  font-size: 32px;
  font-weight: 900;
  color: #1C1A18;
  letter-spacing: -1px;
  line-height: 1;
}

/* ── Pagination ── */
.me-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding-top: 8px;
}
.me-page-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.8px solid #EBEBEA;
  border-radius: 8px;
  background: #FFFFFF;
  font-size: 13px;
  font-weight: 500;
  color: #6B6A68;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 130ms, color 130ms, background 130ms;
}
.me-page-btn:hover:not(:disabled):not(.me-page-btn--active) {
  border-color: rgba(201,168,76,0.4);
  color: #C9A84C;
}
.me-page-btn--active {
  background: #C9A84C;
  border-color: #C9A84C;
  color: #FFFFFF;
  font-weight: 700;
}
.me-page-btn--nav {
  color: #8A8580;
}
.me-page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.me-page-ellipsis {
  width: 28px;
  text-align: center;
  font-size: 13px;
  color: #B5B0A8;
  user-select: none;
}

/* Publish status chip */
.me-row-pub-chip {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  letter-spacing: 0.2px;
}
.me-row-pub-chip--pub {
  background: rgba(52,199,89,0.12);
  color: #1D7A38;
  border: 0.8px solid rgba(52,199,89,0.25);
}
.me-row-pub-chip--draft {
  background: rgba(255,149,0,0.1);
  color: #B86800;
  border: 0.8px solid rgba(255,149,0,0.25);
}


/* ── Responsive ── */

/* Tablet: collapse sidebar into horizontal strips */
@media (max-width: 900px) {
  .me-nav-inner { padding: 24px 20px; }

  .me-body {
    flex-direction: column;
    padding: 20px 20px 48px;
    gap: 16px;
  }

  .me-sidebar {
    width: 100%;
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }

  .me-search-wrap {
    flex: 1 1 100%;
    margin-bottom: 0;
  }

  .me-filter-section {
    flex: 1;
    min-width: 160px;
  }
}

/* Mobile: tighten everything up */
@media (max-width: 600px) {
  /* Nav */
  .me-nav-inner { padding: 20px 16px; }
  .me-brand-name { font-size: 18px; }
  .me-breadcrumb-page { font-size: 13px; }
  .me-avatar-label { display: none; }

  /* Body */
  .me-body { padding: 16px 16px 48px; gap: 14px; }

  /* Sidebar: stack filter sections vertically, full width */
  .me-sidebar { flex-direction: column; gap: 8px; }
  .me-filter-section { min-width: unset; flex: unset; }

  /* Skeleton height shorter on mobile */
  .me-row-skeleton { height: 110px; }

  /* Row: hide date badge, shrink thumbnail */
  .me-row-date-badge { display: none; }

  .me-row-thumb { width: 100px; }

  .me-row-content { padding: 12px 14px; gap: 5px; }

  .me-row-title {
    font-size: 14px;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .me-row-chips { gap: 4px; }

  .me-row-meta { gap: 3px; }
  .me-row-meta-item { font-size: 11px; }

  .me-row-manage-btn {
    font-size: 11px;
    padding: 5px 10px;
  }
  .me-row-edit-btn {
    font-size: 11px;
    padding: 5px 10px;
  }

  /* Pagination: tighter */
  .me-pagination { gap: 3px; }
  .me-page-btn { min-width: 30px; height: 30px; font-size: 12px; }
  .me-page-ellipsis { width: 20px; font-size: 12px; }

  /* Results bar */
  .me-results-count { font-size: 13px; }
}

/* Very small phones */
@media (max-width: 380px) {
  .me-row-thumb { width: 80px; }
  .me-row-title { font-size: 13px; }
}
</style>
