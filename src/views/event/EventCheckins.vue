<template>
  <div class="ec-root">

    <div class="ec-sticky-head">
      <div class="ec-panel-hd">
        <button type="button" class="ec-hd-burger" title="Menu" @click="navDrawer.open()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="ec-hd-sep" />
        <div class="ec-hd-badge" @click="$router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="ec-hd-brand-logo" />
          <span v-else class="ec-hd-brand-script">.joy</span>
        </div>
        <div class="ec-hd-sep" />
        <div class="ec-hd-title-group">
          <h1 class="ec-hub-title">Check-ins</h1>
          <span class="ec-hub-count">{{ attendees.length }}</span>
        </div>

        <div class="ec-search-wrap">
          <svg class="ec-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQ" class="ec-search" placeholder="Filter by name" />
          <button v-if="searchQ" type="button" class="ec-search-clear" @click="searchQ = ''" aria-label="Clear">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <span v-else class="ec-search-filter" title="Filter">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </span>
        </div>

        <button type="button" class="ec-ghost-btn" @click="loadData" :disabled="loading">
          <svg :class="{ 'ec-spin': loading }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
        <button type="button" class="ec-hd-gear" title="Settings" @click="$router.push(`/event/${eventId}/settings`)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div class="ec-toolbar2">
        <button
          v-for="f in STATUS_FILTERS" :key="f.val" type="button"
          class="ec-tb2-btn" :class="{ 'ec-tb2-btn--active': statusFilter === f.val }"
          @click="statusFilter = f.val; currentPage = 1"
        >
          <span class="ec-tb2-lbl">
            {{ f.label }}
            <span class="ec-tb2-cnt">{{ statusCount(f.val) }}</span>
          </span>
        </button>
        <div class="ec-tb2-divider" />
        <div v-if="checkpoints.length" class="ec-cp-wrap" v-click-outside="() => showCpMenu = false">
          <button type="button" class="ec-tb2-btn" :class="{ 'ec-tb2-btn--active': cpFilter !== null }" @click="showCpMenu = !showCpMenu">
            <span class="ec-tb2-lbl">
              {{ cpFilter !== null ? (checkpoints.find(c => c.id === cpFilter)?.name ?? 'Checkpoint') : 'Checkpoints' }}
              <span v-if="cpFilter === null" class="ec-tb2-cnt">{{ checkpoints.length }}</span>
            </span>
            <svg class="ec-tb2-chev" :class="{ 'ec-tb2-chev--open': showCpMenu }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div v-if="showCpMenu" class="ec-cp-menu">
            <button type="button" class="ec-cp-item" :class="{ 'ec-cp-item--on': cpFilter === null }"
              @click="cpFilter = null; showCpMenu = false; currentPage = 1">All checkpoints</button>
            <button v-for="cp in checkpoints" :key="cp.id" type="button"
              class="ec-cp-item" :class="{ 'ec-cp-item--on': cpFilter === cp.id }"
              @click="cpFilter = cp.id; showCpMenu = false; currentPage = 1">{{ cp.name }}</button>
          </div>
        </div>
      </div>

      <div class="ec-row-grid ec-col-head" v-if="!loading && pagedList.length">
        <span class="ec-col-avatar" />
        <button type="button" class="ec-col-btn" @click="toggleSort('name')">
          Name
          <svg class="ec-sort-icon" :class="{ 'ec-sort-icon--active': sortKey === 'name', 'ec-sort-icon--desc': sortKey === 'name' && sortDir === 'desc' }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <span class="ec-col-lbl">Phone</span>
        <span class="ec-col-lbl">Type</span>
        <button type="button" class="ec-col-btn" @click="toggleSort('status')">
          Status
          <svg class="ec-sort-icon" :class="{ 'ec-sort-icon--active': sortKey === 'status', 'ec-sort-icon--desc': sortKey === 'status' && sortDir === 'desc' }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <span class="ec-col-lbl">Slots</span>
        <button type="button" class="ec-col-btn" @click="toggleSort('date')">
          Added
          <svg class="ec-sort-icon" :class="{ 'ec-sort-icon--active': sortKey === 'date', 'ec-sort-icon--desc': sortKey === 'date' && sortDir === 'desc' }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
      </div>
    </div>

    <div class="ec-table-wrap">
      <div v-if="loading && !attendees.length" class="ec-list">
        <div v-for="n in 8" :key="n" class="ec-row-grid ec-row ec-row--sk">
          <div class="ec-sk-circle" />
          <div class="ec-sk-bar ec-sk-bar--lg" />
          <div class="ec-sk-bar ec-sk-bar--md" />
          <div class="ec-sk-bar ec-sk-bar--sm" />
          <div class="ec-sk-bar ec-sk-bar--sm" />
          <div class="ec-sk-bar ec-sk-bar--sm" />
          <div class="ec-sk-bar ec-sk-bar--sm" />
        </div>
      </div>

      <div v-else-if="!pagedList.length" class="ec-empty">
        <p class="ec-empty-kicker">The door</p>
        <h2 class="ec-empty-title">{{ searchQ || statusFilter !== 'all' ? 'Nobody here' : 'Still quiet' }}</h2>
        <p class="ec-empty-lede">{{ searchQ || statusFilter !== 'all' ? 'Try another search or filter.' : 'Guests appear here as they check in — tap a name to mark a slot.' }}</p>
      </div>

      <div v-else class="ec-list">
        <button
          v-for="att in pagedList" :key="att.id" type="button"
          class="ec-row-grid ec-row"
          @click="openDetail(att)"
        >
          <div class="ec-card-av-wrap">
            <div class="ec-card-avatar" :style="{ background: avatarBg(att.fullName), color: avatarColor(att.fullName) }">
              {{ initials(att.fullName) }}
            </div>
          </div>
          <span class="ec-card-name" :title="att.fullName">{{ att.fullName }}</span>
          <span class="ec-card-meta">{{ att.phone || '—' }}</span>
          <span class="ec-type-badge">{{ typeLabels[getKardType(att)] }}</span>
          <span class="ec-badge" :class="{
            'ec-badge--checked-in': statusOf(att) === 'checked',
            'ec-badge--pending':    statusOf(att) === 'partial',
            'ec-badge--absent':     statusOf(att) === 'none',
            'ec-badge--default':    statusOf(att) === 'nocard',
          }">{{ statusLabel(att) }}</span>
          <span class="ec-slots-cell">
            <template v-if="(att.checkinStatus ?? []).length">{{ checkedSlots(att) }}/{{ att.checkinStatus.length }}</template>
            <template v-else>—</template>
          </span>
          <span class="ec-card-date">{{ formatDate(att.createdAt) }}</span>
        </button>
      </div>

      <div class="ec-table-footer">
        <span class="ec-range-lbl">
          {{ filteredList.length
              ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredList.length)}`
              : '0'
          }} of {{ filteredList.length }}
          <template v-if="statusFilter !== 'all'">
            ·
            <button type="button" class="ec-filter-clear" @click="statusFilter = 'all'; currentPage = 1">
              {{ STATUS_FILTERS.find(f => f.val === statusFilter)?.label }} ×
            </button>
          </template>
        </span>
        <div class="ec-paginator" :class="{ 'ec-paginator--disabled': totalPages <= 1 }">
          <button type="button" class="ec-page-btn" :disabled="currentPage === 1 || totalPages <= 1" @click="goToPage(currentPage - 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <template v-for="p in pageNumbers" :key="String(p)">
            <span v-if="p === '…'" class="ec-page-ellipsis">…</span>
            <button v-else type="button" class="ec-page-btn" :class="{ 'ec-page-btn--active': currentPage === p }" :disabled="totalPages <= 1" @click="goToPage(p)">{{ p }}</button>
          </template>
          <button type="button" class="ec-page-btn" :disabled="currentPage === totalPages || totalPages <= 1" @click="goToPage(currentPage + 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="ec-fade">
        <div v-if="selectedAtt" class="ec-joy-overlay" @click.self="closeDetail">
          <Transition name="ec-slide">
            <div class="ec-drawer" v-if="selectedAtt">

              <!-- Header -->
              <div class="ec-drawer-header">
                <button class="ec-drawer-back" @click="closeDetail">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Close
                </button>
                <span class="ec-sb" :class="`ec-sb--${statusOf(selectedAtt)}`" style="font-size:11px">
                  <span class="ec-sb-dot"/>{{ statusLabel(selectedAtt) }}
                </span>
              </div>

              <!-- Hero -->
              <div class="ec-drawer-hero">
                <div class="ec-drawer-avatar"
                  :style="{ background: avatarBg(selectedAtt.fullName), color: avatarColor(selectedAtt.fullName) }">
                  {{ initials(selectedAtt.fullName) }}
                </div>
                <p class="ec-drawer-name">{{ selectedAtt.fullName }}</p>
                <p class="ec-drawer-phone">{{ selectedAtt.phone || '—' }}</p>
                <span class="ec-type-badge" :class="`ec-type--${getKardType(selectedAtt)}`">
                  {{ typeLabels[getKardType(selectedAtt)] }}
                </span>
              </div>

              <!-- Body -->
              <div class="ec-drawer-body">

                <!-- No card assigned -->
                <div v-if="!(selectedAtt.checkinStatus ?? []).length" class="ec-drawer-block">
                  <p class="ec-block-lbl">Check-in Status</p>
                  <div class="ec-no-card">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0BAB2"
                      stroke-width="1.5" stroke-linecap="round">
                      <rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    <p>No card assigned.<br>This attendee cannot be checked in.</p>
                  </div>
                </div>

                <!-- Slot rows -->
                <div v-else class="ec-drawer-block">
                  <div class="ec-block-lbl-row">
                    <p class="ec-block-lbl">Check-in Status</p>
                    <span class="ec-slots-summary">
                      {{ checkedSlots(selectedAtt) }}/{{ selectedAtt.checkinStatus.length }} slots
                    </span>
                  </div>

                  <div v-for="(slot, si) in selectedAtt.checkinStatus" :key="si" class="ec-slot">
                    <div class="ec-slot-head">
                      <span class="ec-slot-name">{{ slot.attendee_name || `Slot ${si + 1}` }}</span>
                      <span class="ec-slot-badge"
                        :class="isSlotChecked(slot) ? 'ec-slot-badge--on' : 'ec-slot-badge--off'">
                        {{ isSlotChecked(slot) ? 'Checked In' : 'Not Checked' }}
                      </span>
                    </div>

                    <!-- Checkpoint toggles -->
                    <div class="ec-cp-toggles">
                      <template v-if="checkpoints.length">
                        <button v-for="cp in checkpoints" :key="cp.id"
                          class="ec-cp-toggle"
                          :class="slot.checkpoints?.[cp.id] ? 'ec-cp-toggle--on' : 'ec-cp-toggle--off'"
                          :disabled="togglingKey === `${selectedAtt.id}-${si}-${cp.id}`"
                          @click="toggleSlot(selectedAtt, si, cp.id)">
                          <svg v-if="slot.checkpoints?.[cp.id]" width="11" height="11" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <circle cx="12" cy="12" r="9"/>
                          </svg>
                          {{ cp.name }}
                        </button>
                      </template>
                      <!-- Fallback: no checkpoints in DB — use generic toggle -->
                      <template v-else>
                        <button class="ec-cp-toggle"
                          :class="hasAnyCheckin(slot) ? 'ec-cp-toggle--on' : 'ec-cp-toggle--off'"
                          :disabled="togglingKey === `${selectedAtt.id}-${si}-default`"
                          @click="toggleSlotGeneric(selectedAtt, si)">
                          <svg v-if="hasAnyCheckin(slot)" width="11" height="11" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <circle cx="12" cy="12" r="9"/>
                          </svg>
                          Check In
                        </button>
                      </template>
                    </div>
                  </div>
                </div>

                <p class="ec-drawer-added">Added {{ formatDate(selectedAtt.createdAt) }}</p>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../../firebase'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { useOrg } from '../../composables/useOrg.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'

const props = defineProps({ event: Object, eventId: String })
const route  = useRoute()
const eventId = computed(() => props.eventId ?? route.params.eventId)
const { brandName, brandLogoUrl } = useOrg()
const navDrawer = useNavDrawer()

// ── Custom directive ───────────────────────────────────────────────────────────
const vClickOutside = {
  mounted(el, binding) {
    el._co = e => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el._co)
  },
  unmounted(el) { document.removeEventListener('mousedown', el._co) },
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25

const STATUS_FILTERS = [
  { val: 'all',     label: 'All'         },
  { val: 'checked', label: 'Checked In'  },
  { val: 'partial', label: 'Partial'     },
  { val: 'none',    label: 'Not Checked' },
]

const typeLabels = { invitation: 'Invitation', contribution: 'Contribution', contact: 'Contact' }

// ── State ─────────────────────────────────────────────────────────────────────
const attendees   = ref([])
const checkpoints = ref([])
const loading     = ref(false)

const searchQ      = ref('')
watch(searchQ, () => { currentPage.value = 1 })
const statusFilter = ref('all')
const cpFilter     = ref(null)
const showCpMenu   = ref(false)
const sortKey      = ref('name')
const sortDir      = ref('asc')
const currentPage  = ref(1)

const selectedAtt = ref(null)
const togglingKey = ref(null)

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadData() {
  if (!eventId.value) return
  loading.value = true
  try {
    const [attSnap, cpSnap] = await Promise.all([
      getDocs(query(collection(db, 'events', eventId.value, 'attendees'), orderBy('fullNameLower'))),
      getDocs(collection(db, 'events', eventId.value, 'checkpoints')),
    ])
    attendees.value   = attSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    checkpoints.value = cpSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Failed to load checkins data', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))

function onKey(e) {
  if (e.key === 'Escape') {
    if (selectedAtt.value) closeDetail()
    else if (searchQ.value) searchQ.value = ''
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getKardType(att) {
  const c = att.cards ?? {}
  if (c.invitation   != null) return 'invitation'
  if (c.contribution != null) return 'contribution'
  return 'contact'
}

function isSlotChecked(slot) {
  return Object.values(slot.checkpoints ?? {}).some(v => v === true)
}

function hasAnyCheckin(slot) {
  return isSlotChecked(slot)
}

function checkedSlots(att) {
  return (att.checkinStatus ?? []).filter(isSlotChecked).length
}

function statusOf(att) {
  const slots = att.checkinStatus ?? []
  if (!slots.length) return 'nocard'
  const checkedCount = slots.filter(s => {
    if (cpFilter.value) return s.checkpoints?.[cpFilter.value] === true
    return isSlotChecked(s)
  }).length
  if (checkedCount === 0)           return 'none'
  if (checkedCount === slots.length) return 'checked'
  return 'partial'
}

function statusLabel(att) {
  const s = statusOf(att)
  if (s === 'nocard')  return 'No Card'
  if (s === 'checked') return 'Checked In'
  if (s === 'partial') return `${checkedSlots(att)}/${att.checkinStatus.length} Slots`
  return 'Not Checked'
}

function statusScore(att) {
  const s = statusOf(att)
  if (s === 'checked') return 0
  if (s === 'partial') return 1
  if (s === 'none')    return 2
  return 3
}

function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
  currentPage.value = 1
}

function formatDate(ts) {
  if (!ts) return '—'
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

const AVATAR_COLORS = [
  ['#f3f4f6', '#374151'], ['#e5e7eb', '#1f2937'], ['#f1f5f9', '#334155'],
  ['#eeeef0', '#111827'], ['#e9eaee', '#4b5563'], ['#f8fafc', '#1f2937'],
]
function avatarBg(name)    { return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length][0] }
function avatarColor(name) { return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length][1] }

// ── Computed lists ────────────────────────────────────────────────────────────
const filteredList = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  let list = attendees.value

  if (q) {
    list = list.filter(a =>
      (a.fullNameLower ?? a.fullName?.toLowerCase() ?? '').includes(q) ||
      (a.phone ?? '').includes(q)
    )
  }

  if (statusFilter.value !== 'all') {
    list = list.filter(a => statusOf(a) === statusFilter.value)
  }

  if (cpFilter.value) {
    list = list.filter(a =>
      (a.checkinStatus ?? []).some(s => s.checkpoints?.[cpFilter.value] === true)
    )
  }

  return [...list].sort((a, b) => {
    let cmp = 0
    if (sortKey.value === 'name')   cmp = (a.fullNameLower ?? '').localeCompare(b.fullNameLower ?? '')
    if (sortKey.value === 'status') cmp = statusScore(a) - statusScore(b)
    if (sortKey.value === 'date')   cmp = (a.createdAt ?? '') < (b.createdAt ?? '') ? -1 : 1
    return sortDir.value === 'desc' ? -cmp : cmp
  })
})

const totalPages = computed(() => Math.ceil(filteredList.value.length / PAGE_SIZE) || 1)

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredList.value.slice(start, start + PAGE_SIZE)
})

const checkinStats = computed(() => {
  const list = attendees.value
  return {
    total:   list.length,
    checked: list.filter(a => statusOf(a) === 'checked').length,
    partial: list.filter(a => statusOf(a) === 'partial').length,
    none:    list.filter(a => statusOf(a) === 'none').length,
  }
})

function statusCount(val) {
  if (val === 'all')     return attendees.value.length
  if (val === 'checked') return checkinStats.value.checked
  if (val === 'partial') return checkinStats.value.partial
  if (val === 'none')    return checkinStats.value.none
  return 0
}

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (cur > 3) pages.push('…')
  const start = Math.max(2, cur - 1)
  const end   = Math.min(total - 1, cur + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (cur < total - 2) pages.push('…')
  if (total > 1) pages.push(total)
  return pages
})

function goToPage(n) {
  if (n < 1 || n > totalPages.value) return
  currentPage.value = n
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function openDetail(att) { selectedAtt.value = att }
function closeDetail()   { selectedAtt.value = null }

// ── Toggle checkin ────────────────────────────────────────────────────────────
async function toggleSlot(att, slotIndex, checkpointId) {
  const key = `${att.id}-${slotIndex}-${checkpointId}`
  if (togglingKey.value === key) return
  togglingKey.value = key

  const updatedStatus = att.checkinStatus.map((slot, i) => {
    if (i !== slotIndex) return slot
    const current = slot.checkpoints?.[checkpointId] === true
    return {
      ...slot,
      checkpoints: { ...(slot.checkpoints ?? {}), [checkpointId]: !current },
    }
  })

  try {
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), {
      checkinStatus: updatedStatus,
    })
    const updated = { ...att, checkinStatus: updatedStatus }
    selectedAtt.value = updated
    const idx = attendees.value.findIndex(a => a.id === att.id)
    if (idx !== -1) attendees.value[idx] = updated
  } catch (e) {
    console.error('Failed to toggle slot', e)
  } finally {
    togglingKey.value = null
  }
}

async function toggleSlotGeneric(att, slotIndex) {
  const current = hasAnyCheckin(att.checkinStatus[slotIndex])
  const updatedStatus = att.checkinStatus.map((slot, i) => {
    if (i !== slotIndex) return slot
    return { ...slot, checkpoints: { default: !current } }
  })
  const key = `${att.id}-${slotIndex}-default`
  if (togglingKey.value === key) return
  togglingKey.value = key
  try {
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), {
      checkinStatus: updatedStatus,
    })
    const updated = { ...att, checkinStatus: updatedStatus }
    selectedAtt.value = updated
    const idx = attendees.value.findIndex(a => a.id === att.id)
    if (idx !== -1) attendees.value[idx] = updated
  } catch (e) {
    console.error('Failed to toggle slot', e)
  } finally {
    togglingKey.value = null
  }
}
</script>

<style scoped>
.ec-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #1f2937;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.ec-sticky-head {
  position: sticky; top: 0; z-index: 20; background: #ffffff;
}
.ec-panel-hd {
  display: flex;
  align-items: center;
  height: 92px;
  padding: 0 36px;
  gap: 14px;
  flex-shrink: 0;
  background: #ffffff;
  border-bottom: 1px solid #f1f3f5;
}
.ec-hd-burger {
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff;
  color: #4b5563; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.ec-hd-burger:hover { background: #f8fafc; color: #18181b; border-color: #d1d5db; }
.ec-hd-sep { width: 1px; height: 16px; background: #e5e7eb; flex-shrink: 0; margin: 0 4px; }
.ec-hd-badge {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e7eb;
  overflow: hidden; background: #fff; flex-shrink: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.ec-hd-brand-logo { width: 100%; height: 100%; object-fit: cover; }
.ec-hd-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-size: 18px; font-weight: 700;
  color: #111827; letter-spacing: -0.04em; line-height: 1;
}
.ec-hd-title-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ec-hub-title {
  margin: 0; font-size: 22px; font-weight: 600; color: #18181b; letter-spacing: -0.015em; white-space: nowrap;
}
.ec-hub-count {
  font-size: 12.5px; font-weight: 600; color: #4b5563;
  background: #f1f3f5; border-radius: 9999px; padding: 2px 10px;
}
.ec-search-wrap {
  position: relative; display: flex; align-items: center;
  flex: 1 1 0; margin: 0 20px; min-width: 220px;
}
.ec-search-icon { position: absolute; left: 16px; color: #9ca3af; pointer-events: none; }
.ec-search {
  width: 100%; height: 44px; padding: 0 48px 0 44px;
  background: #f3f4f6; border: none; border-radius: 9999px;
  font-size: 15px; color: #111827; outline: none; font-family: inherit;
}
.ec-search:focus { background: #eeeeef; }
.ec-search::placeholder { color: #9ca3af; font-weight: 400; }
.ec-search-clear {
  position: absolute; right: 10px; width: 32px; height: 32px;
  border: none; background: none; color: #9ca3af;
  cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
}
.ec-search-clear:hover { color: #111827; }
.ec-search-filter {
  position: absolute; right: 8px; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff; color: #6b7280;
}
.ec-ghost-btn {
  display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
  height: 38px; padding: 0 18px; border-radius: 9999px;
  border: 1px solid #e5e7eb; background: #fff; color: #374151;
  font-size: 13.5px; font-weight: 500; font-family: inherit; cursor: pointer;
}
.ec-ghost-btn:hover { background: #f8fafc; color: #111827; border-color: #d1d5db; }
.ec-ghost-btn:disabled { opacity: 0.45; cursor: default; }
.ec-hd-gear {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.ec-hd-gear:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

.ec-toolbar2 {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 36px; border-bottom: 1px solid #f1f3f5; background: #fff;
}
.ec-tb2-btn {
  display: flex; align-items: center; gap: 8px;
  min-height: 34px; padding: 6px 14px;
  border: 1px solid #e2e8f0; border-radius: 9999px; background: #fff;
  cursor: pointer; font-family: inherit;
}
.ec-tb2-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
.ec-tb2-btn--active { background: #f1f5f9; border-color: #cbd5e1; }
.ec-tb2-lbl { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #475569; white-space: nowrap; }
.ec-tb2-btn--active .ec-tb2-lbl { color: #0f172a; font-weight: 600; }
.ec-tb2-cnt {
  min-width: 18px; padding: 1px 6px; border-radius: 9999px;
  background: #f1f5f9; font-size: 10.5px; font-weight: 700; color: #475569;
  display: inline-flex; align-items: center; justify-content: center;
}
.ec-tb2-chev { color: #94a3b8; }
.ec-tb2-chev--open { transform: rotate(180deg); }
.ec-tb2-divider { width: 1px; height: 20px; background: #e5e7eb; margin: 0 4px; flex-shrink: 0; }

.ec-cp-wrap { position: relative; }
.ec-cp-menu {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 40;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.1); padding: 6px; min-width: 200px;
}
.ec-cp-item {
  display: block; width: 100%; text-align: left;
  padding: 9px 12px; border: none; background: none; border-radius: 10px;
  font-size: 13px; font-family: inherit; color: #111827; cursor: pointer;
}
.ec-cp-item:hover { background: #f7f7f8; }
.ec-cp-item--on { font-weight: 600; background: #f3f4f6; }

.ec-row-grid {
  display: grid;
  grid-template-columns: 38px minmax(180px, 2fr) minmax(140px, 1.2fr) 110px 140px 70px 110px;
  align-items: center; gap: 16px;
}
.ec-col-head {
  padding: 14px 36px; border-bottom: 1px solid #f1f3f5; background: #fff;
}
.ec-col-avatar { width: 38px; }
.ec-col-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; padding: 0; cursor: pointer; font-family: inherit;
  font-size: 13px; font-weight: 700; color: #111827; justify-self: start;
}
.ec-col-lbl { font-size: 13px; font-weight: 700; color: #111827; }
.ec-sort-icon { opacity: 0.28; }
.ec-sort-icon--active { opacity: 1; }
.ec-sort-icon--desc { transform: rotate(180deg); }

.ec-table-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.ec-list { display: flex; flex-direction: column; }

.ec-empty { padding: 48px 36px; }
.ec-empty-kicker {
  margin: 0 0 6px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase; color: #94a3b8;
}
.ec-empty-title {
  margin: 0 0 10px;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400; font-style: italic; font-size: 28px; color: #1a1a1a; line-height: 1.15;
}
.ec-empty-lede { margin: 0; max-width: 40ch; font-size: 14px; color: #64748b; line-height: 1.55; }

.ec-row {
  width: 100%; padding: 12px 36px; border: none; border-bottom: 1px solid #f1f3f5;
  background: none; cursor: pointer; text-align: left; font-family: inherit;
}
.ec-row:hover:not(.ec-row--sk) { background: #f9fafb; }
.ec-row--sk { pointer-events: none; }

.ec-card-av-wrap { position: relative; flex-shrink: 0; }
.ec-card-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  font-size: 12px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(0,0,0,0.04);
}
.ec-card-name {
  font-size: 14px; font-weight: 600; color: #111827;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ec-card-meta { font-size: 13.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ec-type-badge, .ec-badge {
  display: inline-flex; align-items: center; justify-self: start;
  height: 22px; padding: 0 10px; border-radius: 9999px;
  font-size: 11.5px; font-weight: 600; white-space: nowrap;
  background: #f3f4f6; color: #4b5563;
}
.ec-badge--checked-in { background: #111827; color: #fff; }
.ec-badge--pending { background: #e9eaee; color: #111827; }
.ec-badge--absent { background: #f3f4f6; color: #6b7280; }
.ec-badge--default { background: #f8fafc; color: #94a3b8; }
.ec-slots-cell { font-size: 13px; font-variant-numeric: tabular-nums; color: #64748b; }
.ec-card-date { font-size: 13px; color: #94a3b8; white-space: nowrap; }

@keyframes ec-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.ec-sk-circle { width: 34px; height: 34px; border-radius: 50%; background: #f1f5f9; animation: ec-pulse 1.4s ease-in-out infinite; }
.ec-sk-bar { height: 12px; border-radius: 6px; background: #f1f5f9; animation: ec-pulse 1.4s ease-in-out infinite; }
.ec-sk-bar--lg { width: 140px; }
.ec-sk-bar--md { width: 100px; }
.ec-sk-bar--sm { width: 64px; }

.ec-table-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 36px 24px; gap: 12px; flex-wrap: wrap;
}
.ec-range-lbl { font-size: 12.5px; color: #64748b; font-weight: 500; }
.ec-filter-clear {
  background: none; border: none; color: #111827;
  font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; padding: 0;
}
.ec-paginator { display: flex; align-items: center; gap: 4px; }
.ec-paginator--disabled { opacity: 0.38; pointer-events: none; }
.ec-page-btn {
  min-width: 32px; height: 32px; padding: 0 6px;
  border: none; border-radius: 50%; background: none;
  font-size: 13px; font-weight: 500; color: #64748b;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-family: inherit;
}
.ec-page-btn:hover:not(:disabled):not(.ec-page-btn--active) { background: #f3f4f6; color: #111827; }
.ec-page-btn--active { background: #111827; color: #fff; font-weight: 600; cursor: default; }
.ec-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.ec-page-ellipsis { min-width: 28px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #94a3b8; }

.ec-sb {
  display: inline-flex; align-items: center; gap: 5px;
  height: 22px; padding: 0 10px; border-radius: 9999px;
  font-size: 11px; font-weight: 600; background: #f3f4f6; color: #4b5563;
}
.ec-sb-dot { width: 6px; height: 6px; border-radius: 50%; background: #d1d5db; }
.ec-sb--checked { background: #111827; color: #fff; }
.ec-sb--checked .ec-sb-dot { background: #fff; }
.ec-sb--partial { background: #e9eaee; color: #111827; }
.ec-sb--partial .ec-sb-dot { background: #6b7280; }
.ec-sb--none .ec-sb-dot { background: #9ca3af; }
.ec-sb--nocard .ec-sb-dot { background: #d1d5db; }

.ec-drawer {
  position: fixed; right: 0; top: 0; bottom: 0;
  width: min(400px, 100vw); background: #fff; color: #111827;
  box-shadow: -8px 0 40px rgba(0,0,0,0.12);
  display: flex; flex-direction: column; overflow-y: auto; z-index: 201;
}
.ec-drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; flex-shrink: 0;
}
.ec-drawer-back {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 9999px; border: none;
  background: #f3f4f6; color: #111827;
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.ec-drawer-back:hover { background: #e5e7eb; }
.ec-drawer-hero {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 24px 24px; gap: 4px; border-bottom: 1px solid #f1f5f9;
}
.ec-drawer-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; margin-bottom: 10px;
}
.ec-drawer-name { font-size: 20px; font-weight: 700; color: #111827; margin: 0; text-align: center; letter-spacing: -0.02em; }
.ec-drawer-phone { font-size: 13.5px; color: #64748b; margin: 0 0 8px; }
.ec-drawer-body { display: flex; flex-direction: column; padding: 6px 0 24px; }
.ec-drawer-block { padding: 18px 24px; }
.ec-block-lbl {
  font-size: 11px; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 14px;
}
.ec-block-lbl-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.ec-block-lbl-row .ec-block-lbl { margin: 0; }
.ec-slots-summary { font-size: 12.5px; color: #64748b; font-weight: 500; }
.ec-drawer-added { font-size: 12.5px; color: #94a3b8; margin: 0; padding: 4px 24px 0; }
.ec-no-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 24px 0; color: #94a3b8; text-align: center;
}
.ec-no-card p { font-size: 13.5px; margin: 0; line-height: 1.5; }
.ec-slot { padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
.ec-slot:last-child { border-bottom: none; }
.ec-slot-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.ec-slot-name { font-size: 14px; font-weight: 600; color: #111827; }
.ec-slot-badge { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 9999px; }
.ec-slot-badge--on  { background: #111827; color: #fff; }
.ec-slot-badge--off { background: #f3f4f6; color: #6b7280; }
.ec-cp-toggles { display: flex; flex-wrap: wrap; gap: 6px; }
.ec-cp-toggle {
  display: inline-flex; align-items: center; gap: 5px;
  height: 32px; padding: 0 12px; border-radius: 9999px;
  font-size: 12.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; border: 1px solid #e5e7eb;
}
.ec-cp-toggle--on  { background: #111827; color: #fff; border-color: #111827; }
.ec-cp-toggle--off { background: #fff; color: #4b5563; }
.ec-cp-toggle--off:hover:not(:disabled) { border-color: #111827; color: #111827; }
.ec-cp-toggle:disabled { opacity: 0.5; cursor: not-allowed; }

.ec-fade-enter-active, .ec-fade-leave-active { transition: opacity 200ms ease; }
.ec-fade-enter-from,   .ec-fade-leave-to     { opacity: 0; }
.ec-slide-enter-active, .ec-slide-leave-active { transition: transform 260ms ease; }
.ec-slide-enter-from,   .ec-slide-leave-to     { transform: translateX(100%); }
.ec-spin { animation: ec-spin-anim 1.1s linear infinite; }
@keyframes ec-spin-anim { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .ec-row-grid { grid-template-columns: 38px minmax(140px, 1.4fr) minmax(110px, 1fr) 90px 110px 56px 90px; gap: 10px; }
  .ec-panel-hd { height: auto; flex-wrap: wrap; padding: 12px 16px; gap: 10px; }
  .ec-toolbar2, .ec-col-head, .ec-row, .ec-table-footer, .ec-empty { padding-left: 16px; padding-right: 16px; }
  .ec-search-wrap { flex: 1 1 100%; margin: 8px 0 0; order: 8; max-width: none; }
  .ec-hd-sep { display: none; }
}
@media (max-width: 720px) {
  .ec-col-head { display: none; }
  .ec-row-grid { grid-template-columns: 38px 1fr auto; }
  .ec-row > :nth-child(n+4) { display: none; }
  .ec-card-date { display: block; }
}
</style>

<style>
html .ec-joy-overlay {
  position: fixed; inset: 0; z-index: 1600;
  background: rgba(15, 23, 42, 0.32) !important;
  backdrop-filter: none !important;
}
</style>
