<template>
  <div class="eb-root">

    <div class="eb-sticky-head">
      <div class="eb-panel-hd">
        <button type="button" class="eb-hd-burger" title="Menu" @click="navDrawer.open()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="eb-hd-sep" />
        <div class="eb-hd-badge" @click="$router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="eb-hd-brand-logo" />
          <span v-else class="eb-hd-brand-script">.joy</span>
        </div>
        <div class="eb-hd-sep" />
        <div class="eb-hd-title-group">
          <h1 class="eb-hub-title">Budget</h1>
          <span class="eb-hub-count">{{ items.length }}</span>
        </div>

        <div class="eb-search-wrap">
          <svg class="eb-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQ" class="eb-search" placeholder="Filter by name" />
          <button v-if="searchQ" type="button" class="eb-search-clear" @click="searchQ = ''" aria-label="Clear">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <span v-else class="eb-search-filter" title="Filter">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </span>
        </div>

        <button type="button" class="eb-add-btn" @click="openAdd">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Item
        </button>
        <button type="button" class="eb-hd-gear" title="Settings" @click="$router.push(`/event/${eventId}/settings`)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div class="eb-toolbar2">
        <button
          v-for="f in STATUS_FILTERS" :key="f.val" type="button"
          class="eb-tb2-btn" :class="{ 'eb-tb2-btn--active': statusFilter === f.val }"
          @click="statusFilter = f.val"
        >
          <span class="eb-tb2-lbl">
            {{ f.label }}
            <span class="eb-tb2-cnt">{{ statusCount(f.val) }}</span>
          </span>
        </button>
        <div class="eb-tb2-divider" />
        <span class="eb-tb2-stat">Est. TZS {{ formatMoney(totalEstimated) }}</span>
        <span class="eb-tb2-stat">Spent TZS {{ formatMoney(totalActual) }}</span>
        <span class="eb-tb2-stat" :class="{ 'eb-tb2-stat--over': remaining < 0 }">
          {{ remaining >= 0 ? 'Left' : 'Over' }} TZS {{ formatMoney(Math.abs(remaining)) }}
        </span>
      </div>

      <div class="eb-row-grid eb-col-head" v-if="!loading && filtered.length">
        <button type="button" class="eb-col-btn" @click="toggleSort('name')">
          Item
          <svg class="eb-sort-icon" :class="{ 'eb-sort-icon--active': sortKey === 'name', 'eb-sort-icon--desc': sortKey === 'name' && sortDir === 'desc' }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <span class="eb-col-lbl">Category</span>
        <span class="eb-col-lbl">Vendor</span>
        <button type="button" class="eb-col-btn" @click="toggleSort('status')">
          Status
          <svg class="eb-sort-icon" :class="{ 'eb-sort-icon--active': sortKey === 'status', 'eb-sort-icon--desc': sortKey === 'status' && sortDir === 'desc' }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button type="button" class="eb-col-btn eb-col-btn--right" @click="toggleSort('est')">
          Estimated
          <svg class="eb-sort-icon" :class="{ 'eb-sort-icon--active': sortKey === 'est', 'eb-sort-icon--desc': sortKey === 'est' && sortDir === 'desc' }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button type="button" class="eb-col-btn eb-col-btn--right" @click="toggleSort('spent')">
          Spent
          <svg class="eb-sort-icon" :class="{ 'eb-sort-icon--active': sortKey === 'spent', 'eb-sort-icon--desc': sortKey === 'spent' && sortDir === 'desc' }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <span class="eb-col-actions" />
      </div>
    </div>

    <div class="eb-table-wrap">
      <div v-if="loading && !items.length" class="eb-list">
        <div v-for="n in 6" :key="n" class="eb-row-grid eb-row eb-row--sk">
          <div class="eb-sk-bar eb-sk-bar--lg" />
          <div class="eb-sk-bar eb-sk-bar--sm" />
          <div class="eb-sk-bar eb-sk-bar--md" />
          <div class="eb-sk-bar eb-sk-bar--sm" />
          <div class="eb-sk-bar eb-sk-bar--sm" />
          <div class="eb-sk-bar eb-sk-bar--sm" />
          <span />
        </div>
      </div>

      <div v-else-if="loadError" class="eb-empty">
        <p class="eb-empty-kicker">Error</p>
        <h2 class="eb-empty-title">Couldn’t load the budget</h2>
        <p class="eb-empty-lede">{{ loadError }}</p>
      </div>

      <div v-else-if="!filtered.length" class="eb-empty">
        <p class="eb-empty-kicker">The ledger</p>
        <h2 class="eb-empty-title">{{ searchQ || statusFilter !== 'all' ? 'Nothing matches' : 'Still unwritten' }}</h2>
        <p class="eb-empty-lede">{{ searchQ || statusFilter !== 'all' ? 'Try another search or filter.' : 'Venue, flowers, the band — add a line and estimated, spent, and remaining stay in the bar above.' }}</p>
        <button v-if="!searchQ && statusFilter === 'all'" type="button" class="eb-empty-row" @click="openAdd">
          <span class="eb-empty-plus">+</span>
          <span class="eb-empty-row-copy">
            <span class="eb-empty-row-title">Add a line item</span>
            <span class="eb-empty-row-sub">Estimated now, actual when you pay</span>
          </span>
        </button>
      </div>

      <div v-else class="eb-list">
        <div
          v-for="item in filtered"
          :key="item.id"
          class="eb-row-grid eb-row"
          role="button"
          tabindex="0"
          @click="openEdit(item)"
          @keydown.enter="openEdit(item)"
        >
          <span class="eb-cell-name">{{ item.description }}</span>
          <span class="eb-cell-muted">{{ item.category || '—' }}</span>
          <span class="eb-cell-muted">{{ item.vendor || '—' }}</span>
          <span class="eb-badge" :class="`eb-badge--${item.status}`">{{ STATUS_LABELS[item.status] ?? item.status }}</span>
          <span class="eb-cell-amt">TZS {{ formatMoney(item.estimatedCost) }}</span>
          <span class="eb-cell-amt" :class="{ 'eb-cell-amt--over': item.actualCost != null && item.actualCost > item.estimatedCost }">
            {{ item.actualCost != null ? 'TZS ' + formatMoney(item.actualCost) : '—' }}
          </span>
          <button type="button" class="eb-row-del" title="Delete" @click.stop="deleteItem(item)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="modal.open" class="eb-joy-backdrop" @pointerdown.self="closeModal">
        <div class="eb-dialog" role="dialog" aria-modal="true" @pointerdown.stop>
          <div class="eb-dialog-hd">
            <h3 class="eb-dialog-title">{{ modal.editId ? 'Edit line item' : 'Add line item' }}</h3>
            <button type="button" class="eb-dialog-x" aria-label="Close" @click="closeModal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <form class="eb-dialog-body" @submit.prevent="saveItem">
            <label class="eb-field-label">Category</label>
            <select v-model="modal.form.category" class="eb-input" required>
              <option value="" disabled>Select a category</option>
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
            </select>
            <label class="eb-field-label">Description</label>
            <input v-model="modal.form.description" class="eb-input" placeholder="e.g. Dinner for 300 guests" required />
            <label class="eb-field-label">Vendor <span class="eb-opt">optional</span></label>
            <input v-model="modal.form.vendor" class="eb-input" placeholder="e.g. Royal Catering Co." />
            <label class="eb-field-label">Estimated (TZS)</label>
            <input v-model.number="modal.form.estimatedCost" type="number" min="0" class="eb-input" placeholder="0" required />
            <label class="eb-field-label">Actual (TZS) <span class="eb-opt">optional</span></label>
            <input v-model="modal.form.actualCostStr" type="number" min="0" class="eb-input" placeholder="Leave blank if not yet spent" />
            <label class="eb-field-label">Status</label>
            <select v-model="modal.form.status" class="eb-input">
              <option value="planned">Planned</option>
              <option value="booked">Booked</option>
              <option value="paid">Paid</option>
            </select>
            <label class="eb-field-label">Notes <span class="eb-opt">optional</span></label>
            <textarea v-model="modal.form.notes" class="eb-textarea" rows="3" placeholder="Any extra detail…" />
            <div class="eb-dialog-foot">
              <button type="button" class="eb-dialog-cancel" @click="closeModal" :disabled="modal.saving">Cancel</button>
              <button type="submit" class="eb-dialog-save" :disabled="modal.saving">
                {{ modal.saving ? 'Saving…' : (modal.editId ? 'Save' : 'Add item') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../../firebase'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { useOrg } from '../../composables/useOrg.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'

const route   = useRoute()
const eventId = computed(() => route.params.eventId)
const { brandName, brandLogoUrl } = useOrg()
const navDrawer = useNavDrawer()

const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Music / DJ', 'Decoration',
  'Attire', 'Cake', 'Invitations', 'Transportation', 'Entertainment', 'Other',
]

const STATUS_LABELS = { planned: 'Planned', booked: 'Booked', paid: 'Paid' }
const STATUS_FILTERS = [
  { val: 'all',     label: 'All' },
  { val: 'planned', label: 'Planned' },
  { val: 'booked',  label: 'Booked' },
  { val: 'paid',    label: 'Paid' },
]
const STATUS_SCORE = { paid: 0, booked: 1, planned: 2 }

const loading   = ref(true)
const loadError = ref('')
const items     = ref([])
const searchQ   = ref('')
const statusFilter = ref('all')
const sortKey = ref('name')
const sortDir = ref('asc')

const modal = ref({ open: false, editId: null, saving: false, form: emptyForm() })

function emptyForm() {
  return { category: '', description: '', vendor: '', estimatedCost: '', actualCostStr: '', status: 'planned', notes: '' }
}

const totalEstimated = computed(() => items.value.reduce((s, i) => s + (i.estimatedCost ?? 0), 0))
const totalActual    = computed(() => items.value.reduce((s, i) => s + (i.actualCost ?? 0), 0))
const remaining      = computed(() => totalEstimated.value - totalActual.value)

function statusCount(val) {
  if (val === 'all') return items.value.length
  return items.value.filter(i => (i.status ?? 'planned') === val).length
}

const filtered = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  let list = items.value
  if (q) {
    list = list.filter(i =>
      (i.description ?? '').toLowerCase().includes(q) ||
      (i.category   ?? '').toLowerCase().includes(q) ||
      (i.vendor     ?? '').toLowerCase().includes(q)
    )
  }
  if (statusFilter.value !== 'all') {
    list = list.filter(i => (i.status ?? 'planned') === statusFilter.value)
  }
  const dir = sortDir.value === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    let cmp = 0
    if (sortKey.value === 'name') cmp = (a.description ?? '').localeCompare(b.description ?? '')
    if (sortKey.value === 'status') cmp = (STATUS_SCORE[a.status] ?? 3) - (STATUS_SCORE[b.status] ?? 3)
    if (sortKey.value === 'est') cmp = (a.estimatedCost ?? 0) - (b.estimatedCost ?? 0)
    if (sortKey.value === 'spent') cmp = (a.actualCost ?? -1) - (b.actualCost ?? -1)
    return cmp * dir
  })
})

function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

function formatMoney(n) {
  if (n == null || n === '') return '0'
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

async function load() {
  loading.value   = true
  loadError.value = ''
  try {
    const snap = await getDocs(collection(db, 'events', eventId.value, 'budgetItems'))
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    docs.sort((a, b) => {
      const ta = a.createdAt?.toDate?.()?.getTime() ?? 0
      const tb = b.createdAt?.toDate?.()?.getTime() ?? 0
      return ta - tb
    })
    items.value = docs
  } catch (e) {
    console.error('EventBudget:', e)
    loadError.value = e.message ?? 'Failed to load budget items'
  } finally {
    loading.value = false
  }
}

function openAdd() {
  modal.value = { open: true, editId: null, saving: false, form: emptyForm() }
}

function openEdit(item) {
  modal.value = {
    open: true,
    editId: item.id,
    saving: false,
    form: {
      category:      item.category    ?? '',
      description:   item.description ?? '',
      vendor:        item.vendor      ?? '',
      estimatedCost: item.estimatedCost ?? '',
      actualCostStr: item.actualCost != null ? String(item.actualCost) : '',
      status:        item.status      ?? 'planned',
      notes:         item.notes       ?? '',
    },
  }
}

function closeModal() {
  if (modal.value.saving) return
  modal.value.open = false
}

function onKey(e) {
  if (e.key === 'Escape' && modal.value.open) closeModal()
}

async function saveItem() {
  modal.value.saving = true
  try {
    const f = modal.value.form
    const actualCost = f.actualCostStr === '' || f.actualCostStr == null
      ? null
      : Number(f.actualCostStr)

    const payload = {
      category:      f.category,
      description:   f.description.trim(),
      vendor:        f.vendor.trim(),
      estimatedCost: Number(f.estimatedCost) || 0,
      actualCost,
      status:        f.status,
      notes:         f.notes.trim(),
    }

    if (modal.value.editId) {
      await updateDoc(doc(db, 'events', eventId.value, 'budgetItems', modal.value.editId), payload)
      const idx = items.value.findIndex(i => i.id === modal.value.editId)
      if (idx !== -1) items.value[idx] = { ...items.value[idx], ...payload }
    } else {
      payload.createdAt = serverTimestamp()
      const ref = await addDoc(collection(db, 'events', eventId.value, 'budgetItems'), payload)
      items.value.push({ id: ref.id, ...payload })
    }

    modal.value.open = false
  } catch (e) {
    console.error('EventBudget save:', e)
    alert(e.message ?? 'Failed to save item')
  } finally {
    modal.value.saving = false
  }
}

async function deleteItem(item) {
  if (!confirm(`Delete "${item.description}"?`)) return
  try {
    await deleteDoc(doc(db, 'events', eventId.value, 'budgetItems', item.id))
    items.value = items.value.filter(i => i.id !== item.id)
  } catch (e) {
    console.error('EventBudget delete:', e)
    alert(e.message ?? 'Failed to delete item')
  }
}

onMounted(() => {
  load()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.eb-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #1f2937;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.eb-sticky-head { position: sticky; top: 0; z-index: 20; background: #ffffff; }

.eb-panel-hd {
  display: flex;
  align-items: center;
  height: 92px;
  padding: 0 36px;
  gap: 14px;
  flex-shrink: 0;
  background: #ffffff;
  border-bottom: 1px solid #f1f3f5;
}
.eb-hd-burger {
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff;
  color: #4b5563; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.eb-hd-burger:hover { background: #f8fafc; color: #18181b; border-color: #d1d5db; }
.eb-hd-sep { width: 1px; height: 16px; background: #e5e7eb; flex-shrink: 0; margin: 0 4px; }
.eb-hd-badge {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e7eb;
  overflow: hidden; background: #fff; flex-shrink: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.eb-hd-brand-logo { width: 100%; height: 100%; object-fit: cover; }
.eb-hd-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-size: 18px; font-weight: 700;
  color: #111827; letter-spacing: -0.04em; line-height: 1;
}
.eb-hd-title-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.eb-hub-title {
  margin: 0; font-size: 22px; font-weight: 600; color: #18181b;
  letter-spacing: -0.015em; white-space: nowrap;
}
.eb-hub-count {
  font-size: 12.5px; font-weight: 600; color: #4b5563;
  background: #f1f3f5; border-radius: 9999px; padding: 2px 10px;
}
.eb-search-wrap {
  position: relative; display: flex; align-items: center;
  flex: 1 1 0; margin: 0 20px; min-width: 220px;
}
.eb-search-icon { position: absolute; left: 16px; color: #9ca3af; pointer-events: none; }
.eb-search {
  width: 100%; height: 44px; padding: 0 48px 0 44px;
  background: #f3f4f6; border: none; border-radius: 9999px;
  font-size: 15px; color: #111827; outline: none; font-family: inherit;
}
.eb-search:focus { background: #eeeeef; }
.eb-search::placeholder { color: #9ca3af; font-weight: 400; }
.eb-search-clear {
  position: absolute; right: 10px; width: 32px; height: 32px;
  border: none; background: none; color: #9ca3af;
  cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
}
.eb-search-clear:hover { color: #111827; }
.eb-search-filter {
  position: absolute; right: 8px; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff; color: #6b7280;
}
.eb-add-btn {
  display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
  height: 40px; padding: 0 20px; border: none; border-radius: 9999px;
  background: #222; color: #fff; font-family: inherit;
  font-size: 13.5px; font-weight: 600; cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
.eb-add-btn:hover { background: #000; }
.eb-hd-gear {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.eb-hd-gear:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

.eb-toolbar2 {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 36px; border-bottom: 1px solid #f1f3f5; background: #fff;
}
.eb-tb2-btn {
  display: flex; align-items: center; gap: 8px;
  min-height: 34px; padding: 6px 14px;
  border: 1px solid #e2e8f0; border-radius: 9999px; background: #fff;
  cursor: pointer; font-family: inherit;
}
.eb-tb2-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
.eb-tb2-btn--active { background: #f1f5f9; border-color: #cbd5e1; }
.eb-tb2-lbl { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #475569; white-space: nowrap; }
.eb-tb2-btn--active .eb-tb2-lbl { color: #0f172a; font-weight: 600; }
.eb-tb2-cnt {
  min-width: 18px; padding: 1px 6px; border-radius: 9999px;
  background: #f1f5f9; font-size: 10.5px; font-weight: 700; color: #475569;
  display: inline-flex; align-items: center; justify-content: center;
}
.eb-tb2-divider { width: 1px; height: 20px; background: #e5e7eb; margin: 0 4px; flex-shrink: 0; }
.eb-tb2-stat { font-size: 13px; font-weight: 500; color: #64748b; white-space: nowrap; }
.eb-tb2-stat--over { color: #991b1b; }

.eb-row-grid {
  display: grid;
  grid-template-columns: minmax(180px, 2fr) 120px minmax(120px, 1fr) 110px 130px 120px 40px;
  align-items: center; gap: 16px;
}
.eb-col-head {
  padding: 14px 36px; border-bottom: 1px solid #f1f3f5; background: #fff;
}
.eb-col-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; padding: 0; cursor: pointer; font-family: inherit;
  font-size: 13px; font-weight: 700; color: #111827; justify-self: start;
}
.eb-col-btn--right { justify-self: end; }
.eb-col-lbl { font-size: 13px; font-weight: 700; color: #111827; }
.eb-col-actions { width: 40px; }
.eb-sort-icon { opacity: 0.28; }
.eb-sort-icon--active { opacity: 1; }
.eb-sort-icon--desc { transform: rotate(180deg); }

.eb-table-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.eb-list { display: flex; flex-direction: column; }

.eb-empty { padding: 48px 36px; }
.eb-empty-kicker {
  margin: 0 0 6px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase; color: #94a3b8;
}
.eb-empty-title {
  margin: 0 0 10px;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400; font-style: italic; font-size: 28px; color: #1a1a1a; line-height: 1.15;
}
.eb-empty-lede { margin: 0 0 22px; max-width: 40ch; font-size: 14px; color: #64748b; line-height: 1.55; }
.eb-empty-row {
  width: min(420px, 100%); display: flex; align-items: center; gap: 14px;
  padding: 16px 14px; border: 1px dashed #d1d5db; border-radius: 14px;
  background: #fafafa; cursor: pointer; text-align: left; font-family: inherit;
}
.eb-empty-row:hover { border-color: #111827; background: #fff; }
.eb-empty-plus {
  width: 36px; height: 36px; border-radius: 50%; background: #111827; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.eb-empty-row-copy { display: flex; flex-direction: column; gap: 2px; }
.eb-empty-row-title { font-size: 15px; font-weight: 600; color: #111827; }
.eb-empty-row-sub { font-size: 13px; color: #64748b; }

.eb-row {
  padding: 12px 36px; border-bottom: 1px solid #f1f3f5;
  cursor: pointer; background: none;
}
.eb-row:hover:not(.eb-row--sk) { background: #f9fafb; }
.eb-row--sk { pointer-events: none; }
.eb-cell-name { font-size: 14px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eb-cell-muted { font-size: 13.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eb-cell-amt { font-size: 13.5px; font-weight: 600; color: #111827; text-align: right; font-variant-numeric: tabular-nums; }
.eb-cell-amt--over { color: #991b1b; }
.eb-badge {
  display: inline-flex; align-items: center; justify-self: start;
  height: 22px; padding: 0 10px; border-radius: 9999px;
  font-size: 11.5px; font-weight: 600; background: #f3f4f6; color: #4b5563;
}
.eb-badge--paid { background: #111827; color: #fff; }
.eb-badge--booked { background: #e9eaee; color: #111827; }
.eb-row-del {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: none; color: #94a3b8; cursor: pointer;
  display: flex; align-items: center; justify-content: center; justify-self: end;
}
.eb-row-del:hover { background: #fef2f2; color: #991b1b; }

@keyframes eb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.eb-sk-bar { height: 12px; border-radius: 6px; background: #f1f5f9; animation: eb-pulse 1.4s ease-in-out infinite; }
.eb-sk-bar--lg { width: 160px; }
.eb-sk-bar--md { width: 90px; }
.eb-sk-bar--sm { width: 64px; }

@media (max-width: 900px) {
  .eb-panel-hd { height: auto; flex-wrap: wrap; padding: 12px 16px; gap: 10px; }
  .eb-toolbar2, .eb-col-head, .eb-row, .eb-empty { padding-left: 16px; padding-right: 16px; }
  .eb-search-wrap { flex: 1 1 100%; margin: 8px 0 0; order: 8; }
  .eb-hd-sep { display: none; }
  .eb-row-grid { grid-template-columns: minmax(140px, 1.4fr) 90px minmax(90px, 1fr) 90px 100px 90px 36px; gap: 10px; }
}
@media (max-width: 720px) {
  .eb-col-head { display: none; }
  .eb-row-grid { grid-template-columns: 1fr auto auto; }
  .eb-row > :nth-child(2),
  .eb-row > :nth-child(3),
  .eb-row > :nth-child(5) { display: none; }
}
</style>

<style>
html .eb-joy-backdrop {
  position: fixed; inset: 0; z-index: 1600;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.32) !important;
  backdrop-filter: none !important;
}
html .eb-dialog {
  width: min(480px, calc(100vw - 32px));
  max-height: min(720px, 90vh);
  display: flex; flex-direction: column;
  background: #fff; color: #111827; border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2); overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
html .eb-dialog-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 10px 24px; flex-shrink: 0;
}
html .eb-dialog-title { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #111827; }
html .eb-dialog-x {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: #f8fafc; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
html .eb-dialog-x:hover { background: #f1f5f9; color: #111827; }
html .eb-dialog-body { padding: 4px 24px 0; overflow-y: auto; min-height: 0; }
html .eb-field-label {
  display: block; font-size: 13px; font-weight: 600; color: #374151;
  margin: 0 0 8px;
}
html .eb-opt { font-weight: 500; color: #94a3b8; margin-left: 4px; }
html .eb-input, html .eb-textarea {
  width: 100%; box-sizing: border-box; margin-bottom: 14px;
  background: #fff; border: 1px solid #e5e7eb; color: #111827;
  font-family: inherit; font-size: 14px; outline: none;
}
html .eb-input {
  height: 46px; border-radius: 9999px; padding: 0 16px;
}
html .eb-textarea {
  min-height: 88px; border-radius: 14px; padding: 12px 16px; resize: vertical;
}
html .eb-input:focus, html .eb-textarea:focus { border-color: #d1d5db; }
html .eb-dialog-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 8px 0 18px; background: #fff;
}
html .eb-dialog-cancel {
  height: 40px; padding: 0 18px; border: none; background: none;
  font-size: 14px; font-weight: 600; color: #111827; cursor: pointer; font-family: inherit;
}
html .eb-dialog-save {
  height: 40px; padding: 0 22px; border: none; border-radius: 9999px;
  background: #111827; color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}
html .eb-dialog-save:disabled { opacity: 0.4; cursor: default; }
</style>
