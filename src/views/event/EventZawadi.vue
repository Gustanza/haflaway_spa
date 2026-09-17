<template>
  <div class="ez-root">

    <div class="ez-sticky-head">
      <div class="ez-panel-hd">
        <button type="button" class="ez-hd-burger" title="Menu" @click="navDrawer.open()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="ez-hd-sep" />
        <div class="ez-hd-badge" @click="$router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="ez-hd-brand-logo" />
          <span v-else class="ez-hd-brand-script">.joy</span>
        </div>
        <div class="ez-hd-sep" />
        <div class="ez-hd-title-group">
          <h1 class="ez-hub-title">Gifts of Love</h1>
          <span class="ez-hub-count">{{ items.length }}</span>
        </div>

        <div class="ez-search-wrap">
          <svg class="ez-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQ" class="ez-search" placeholder="Filter by name" />
          <button v-if="searchQ" type="button" class="ez-search-clear" @click="searchQ = ''" aria-label="Clear">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <button type="button" class="ez-add-btn" @click="openItemForm(null)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Item
        </button>
        <button type="button" class="ez-hd-gear" title="Settings" @click="$router.push(`/event/${eventId}/settings`)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div class="ez-toolbar2">
        <button
          v-for="f in STATUS_FILTERS" :key="f.val" type="button"
          class="ez-tb2-btn" :class="{ 'ez-tb2-btn--active': statusFilter === f.val }"
          @click="statusFilter = f.val"
        >
          <span class="ez-tb2-lbl">
            {{ f.label }}
            <span class="ez-tb2-cnt">{{ statusCount(f.val) }}</span>
          </span>
        </button>
        <div class="ez-tb2-divider" />
        <span class="ez-tb2-stat">Target TZS {{ fmtAmt(totalTarget) }}</span>
        <span class="ez-tb2-stat">Funded TZS {{ fmtAmt(totalFunded) }}</span>
        <span class="ez-tb2-stat">{{ totalContribs }} {{ totalContribs === 1 ? 'gift' : 'gifts' }}</span>
      </div>
    </div>

    <div class="ez-split">
      <div class="ez-editor">
        <p class="ez-crumb">Website / Gifts of Love</p>

        <div v-if="loading && !items.length" class="ez-empty">
          <p class="ez-empty-kicker">Registry</p>
          <h2 class="ez-empty-title">Loading…</h2>
        </div>

        <div v-else-if="!filteredItems.length" class="ez-empty">
          <p class="ez-empty-kicker">The registry</p>
          <h2 class="ez-empty-title">{{ searchQ || statusFilter !== 'all' ? 'Nothing matches' : 'Still unwritten' }}</h2>
          <p class="ez-empty-lede">{{ searchQ || statusFilter !== 'all' ? 'Try another search or filter.' : 'Honeymoon, home, the first year — add a wish and guests give toward it on the website.' }}</p>
          <button v-if="!searchQ && statusFilter === 'all'" type="button" class="ez-empty-row" @click="openItemForm(null)">
            <span class="ez-empty-plus">+</span>
            <span class="ez-empty-row-copy">
              <span class="ez-empty-row-title">Add a wish</span>
              <span class="ez-empty-row-sub">It lands in the preview on the right</span>
            </span>
          </button>
        </div>

        <div v-else class="ez-list">
          <div
            v-for="item in filteredItems" :key="item.id"
            class="ez-item"
            :class="{ 'ez-item--on': selectedItem?.id === item.id }"
            @click="selectItem(item)"
          >
            <div class="ez-item-copy">
              <span class="ez-item-title">{{ item.title }}</span>
              <span v-if="item.description" class="ez-item-sub">{{ item.description }}</span>
              <div class="ez-bar">
                <div class="ez-bar-fill" :style="{ width: `${itemPct(item) * 100}%` }" />
              </div>
              <span class="ez-item-meta">
                TZS {{ fmtAmt(item.totalFunded) }} / {{ fmtAmt(item.targetAmount) }}
                · {{ item.contributorCount ?? 0 }} {{ (item.contributorCount ?? 0) === 1 ? 'gift' : 'gifts' }}
              </span>
            </div>
            <div class="ez-item-acts" @click.stop>
              <template v-if="confirmDeleteId === item.id">
                <span class="ez-del-lbl">Delete?</span>
                <button type="button" class="ez-chip-btn ez-chip-btn--danger" @click="deleteItem(item)">
                  {{ deletingId === item.id ? '…' : 'Yes' }}
                </button>
                <button type="button" class="ez-chip-btn" @click="confirmDeleteId = null">No</button>
              </template>
              <template v-else>
                <button type="button" class="ez-chip-btn" @click="openItemForm(item)">Edit</button>
                <button type="button" class="ez-chip-btn" @click="confirmDeleteId = item.id">Delete</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <aside class="ez-preview">
        <div class="ez-preview-bar">
          <span class="ez-preview-kicker">Guest website</span>
          <button v-if="selectedItem" type="button" class="ez-preview-edit" @click="openItemForm(selectedItem)">Edit</button>
        </div>

        <div class="ez-preview-stage">
          <div v-if="!selectedItem" class="ez-site">
            <p class="ez-site-kicker">Gifts of Love</p>
            <h2 class="ez-site-title">Pick a wish</h2>
            <p class="ez-site-lede">Guests see this registry on the event website. Choose an item on the left.</p>
          </div>

          <div v-else class="ez-site">
            <p class="ez-site-kicker">Gifts of Love</p>
            <h2 class="ez-site-title">{{ selectedItem.title }}</h2>
            <p v-if="selectedItem.description" class="ez-site-lede">{{ selectedItem.description }}</p>

            <div class="ez-site-amt">
              <span class="ez-site-pct">{{ (itemPct(selectedItem) * 100).toFixed(0) }}%</span>
              <span class="ez-site-amt-copy">
                TZS {{ fmtAmt(selectedItem.totalFunded) }} of {{ fmtAmt(selectedItem.targetAmount) }}
              </span>
            </div>
            <div class="ez-bar ez-bar--site">
              <div class="ez-bar-fill" :style="{ width: `${itemPct(selectedItem) * 100}%` }" />
            </div>
            <p v-if="itemPct(selectedItem) >= 1" class="ez-site-done">This wish is fully given.</p>

            <p class="ez-site-people-lbl">From your people</p>
            <div v-if="loadingContribs" class="ez-site-muted">Loading gifts…</div>
            <div v-else-if="!contributions.length" class="ez-site-muted">No gifts yet — they appear here when a guest contributes.</div>
            <div v-else class="ez-people">
              <div v-for="c in contributions" :key="c.id" class="ez-person">
                <div class="ez-person-av" :style="{ background: avatarBg(c.attendeeInitial), color: avatarFg(c.attendeeInitial) }">
                  {{ c.attendeeInitial || '?' }}
                </div>
                <div class="ez-person-copy">
                  <span class="ez-person-name">{{ c.attendeeName }}</span>
                  <span v-if="c.note" class="ez-person-note">“{{ c.note }}”</span>
                  <span class="ez-person-when">{{ formatDate(c.paidAt) }}</span>
                </div>
                <span class="ez-person-amt">TZS {{ fmtAmt(c.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <Teleport to="body">
      <div v-if="showItemForm" class="ez-joy-overlay" @pointerdown.self="showItemForm = false">
        <div class="ez-dialog" role="dialog" aria-modal="true" @pointerdown.stop>
          <div class="ez-dialog-hd">
            <h3 class="ez-dialog-title">{{ editingItem ? 'Edit wish' : 'Add a wish' }}</h3>
            <button type="button" class="ez-dialog-x" aria-label="Close" @click="showItemForm = false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="ez-dialog-body">
            <p class="ez-dialog-sub">{{ editingItem ? 'Update this gift for guests.' : 'Guests contribute toward this on the website.' }}</p>
            <label class="ez-field-label">Name</label>
            <input
              ref="titleInputRef"
              v-model="formTitle"
              class="ez-input"
              :class="{ 'ez-input--err': formErrors.title }"
              placeholder="e.g. Honeymoon to Zanzibar"
              @keydown.enter="saveItem"
            />
            <p v-if="formErrors.title" class="ez-field-err">{{ formErrors.title }}</p>
            <label class="ez-field-label">Note <span class="ez-opt">optional</span></label>
            <textarea v-model="formDesc" class="ez-textarea" rows="3" placeholder="A line guests will read…" />
            <label class="ez-field-label">Target (TZS)</label>
            <input
              v-model="formAmount"
              class="ez-input"
              :class="{ 'ez-input--err': formErrors.amount }"
              type="number" min="1"
              placeholder="e.g. 500000"
              @keydown.enter="saveItem"
            />
            <p v-if="formErrors.amount" class="ez-field-err">{{ formErrors.amount }}</p>
          </div>
          <div class="ez-dialog-foot">
            <button type="button" class="ez-dialog-cancel" @click="showItemForm = false">Cancel</button>
            <button type="button" class="ez-dialog-save" :disabled="savingItem" @click="saveItem">
              {{ savingItem ? 'Saving…' : (editingItem ? 'Save' : 'Add item') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../../firebase'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore'
import { useOrg } from '../../composables/useOrg.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'

const props   = defineProps({ event: Object, eventId: String })
const route   = useRoute()
const eventId = computed(() => props.eventId ?? route.params.eventId)
const { brandName, brandLogoUrl } = useOrg()
const navDrawer = useNavDrawer()

const STATUS_FILTERS = [
  { val: 'all',     label: 'All' },
  { val: 'open',    label: 'In progress' },
  { val: 'funded',  label: 'Funded' },
]

const items        = ref([])
const loading      = ref(false)
const searchQ      = ref('')
const statusFilter = ref('all')

const selectedItem    = ref(null)
const contributions   = ref([])
const loadingContribs = ref(false)

const showItemForm  = ref(false)
const editingItem   = ref(null)
const formTitle     = ref('')
const formDesc      = ref('')
const formAmount    = ref('')
const formErrors    = ref({})
const savingItem    = ref(false)
const titleInputRef = ref(null)

const confirmDeleteId = ref(null)
const deletingId      = ref(null)

function itemPct(item) {
  return item.targetAmount > 0
    ? Math.min(1, (item.totalFunded ?? 0) / item.targetAmount)
    : 0
}

function statusCount(val) {
  if (val === 'all') return items.value.length
  if (val === 'funded') return items.value.filter(i => itemPct(i) >= 1).length
  return items.value.filter(i => itemPct(i) < 1).length
}

const filteredItems = computed(() => {
  let list = items.value
  const q = searchQ.value.trim().toLowerCase()
  if (q) list = list.filter(i => (i.title ?? '').toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q))
  if (statusFilter.value === 'funded') list = list.filter(i => itemPct(i) >= 1)
  if (statusFilter.value === 'open') list = list.filter(i => itemPct(i) < 1)
  return list
})

const totalTarget   = computed(() => items.value.reduce((s, i) => s + (i.targetAmount ?? 0), 0))
const totalFunded   = computed(() => items.value.reduce((s, i) => s + (i.totalFunded ?? 0), 0))
const totalContribs = computed(() => items.value.reduce((s, i) => s + (i.contributorCount ?? 0), 0))

async function loadItems() {
  if (!eventId.value) return
  loading.value = true
  try {
    const snap = await getDocs(
      query(collection(db, 'events', eventId.value, 'zawadiItems'), orderBy('order'))
    )
    items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Failed to load zawadi items', e)
  } finally {
    loading.value = false
  }
}

async function loadContributions(item) {
  loadingContribs.value = true
  contributions.value   = []
  try {
    const snap = await getDocs(
      query(
        collection(db, 'events', eventId.value, 'zawadiContributions'),
        where('itemId', '==', item.id),
        where('status', '==', 'PAID'),
        orderBy('paidAt', 'desc')
      )
    )
    contributions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Failed to load contributions', e)
  } finally {
    loadingContribs.value = false
  }
}

function selectItem(item) {
  if (selectedItem.value?.id === item.id) return
  selectedItem.value = item
  confirmDeleteId.value = null
  loadContributions(item)
}

watch(filteredItems, (list) => {
  if (!list.length) {
    selectedItem.value = null
    contributions.value = []
    return
  }
  if (!selectedItem.value || !list.some(i => i.id === selectedItem.value.id)) {
    selectItem(list[0])
  }
})

function openItemForm(item) {
  editingItem.value = item
  formTitle.value   = item?.title ?? ''
  formDesc.value    = item?.description ?? ''
  formAmount.value  = item ? String(item.targetAmount ?? '') : ''
  formErrors.value  = {}
  showItemForm.value = true
  nextTick(() => titleInputRef.value?.focus())
}

async function saveItem() {
  const errors = {}
  if (!formTitle.value.trim()) errors.title = 'Name is required'
  const amt = parseFloat(String(formAmount.value ?? ''))
  if (!String(formAmount.value ?? '').trim()) errors.amount = 'Amount is required'
  else if (isNaN(amt) || amt <= 0) errors.amount = 'Enter a valid positive number'
  formErrors.value = errors
  if (Object.keys(errors).length) return

  savingItem.value = true
  try {
    const data = {
      title:        formTitle.value.trim(),
      description:  formDesc.value.trim(),
      targetAmount: amt,
      currency:     'TZS',
      isActive:     true,
    }

    if (editingItem.value) {
      await updateDoc(doc(db, 'events', eventId.value, 'zawadiItems', editingItem.value.id), data)
      const idx = items.value.findIndex(i => i.id === editingItem.value.id)
      if (idx !== -1) items.value[idx] = { ...items.value[idx], ...data }
      if (selectedItem.value?.id === editingItem.value.id) {
        selectedItem.value = { ...selectedItem.value, ...data }
      }
    } else {
      const newData = {
        ...data,
        totalFunded:      0,
        contributorCount: 0,
        order:            Date.now(),
        createdAt:        serverTimestamp(),
      }
      const ref = await addDoc(collection(db, 'events', eventId.value, 'zawadiItems'), newData)
      const created = { id: ref.id, ...newData }
      items.value.push(created)
      selectItem(created)
    }
    showItemForm.value = false
  } catch (e) {
    console.error('Failed to save item', e)
  } finally {
    savingItem.value = false
  }
}

async function deleteItem(item) {
  if (deletingId.value) return
  deletingId.value = item.id
  try {
    await deleteDoc(doc(db, 'events', eventId.value, 'zawadiItems', item.id))
    items.value = items.value.filter(i => i.id !== item.id)
    confirmDeleteId.value = null
    if (selectedItem.value?.id === item.id) {
      selectedItem.value = null
      contributions.value = []
    }
  } catch (e) {
    console.error('Failed to delete item', e)
  } finally {
    deletingId.value = null
  }
}

function fmtAmt(v) {
  const n = v ?? 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`
  return Math.round(n).toLocaleString()
}

function formatDate(val) {
  if (!val) return '—'
  try {
    const d = val.toDate ? val.toDate() : new Date(val)
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

const AVATAR_PALETTE = [
  ['#f3f4f6', '#374151'], ['#e5e7eb', '#1f2937'], ['#f1f5f9', '#334155'],
  ['#eeeef0', '#111827'], ['#e9eaee', '#4b5563'], ['#f8fafc', '#1f2937'],
]
function avatarBg(init) { return AVATAR_PALETTE[(init?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length][0] }
function avatarFg(init) { return AVATAR_PALETTE[(init?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length][1] }

function onKey(e) {
  if (e.key === 'Escape' && showItemForm.value) showItemForm.value = false
}

onMounted(() => {
  loadItems()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.ez-root {
  min-height: 100vh; height: 100%;
  display: flex; flex-direction: column;
  background: #fff; color: #1f2937;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
}
.ez-sticky-head { position: sticky; top: 0; z-index: 20; background: #fff; }
.ez-panel-hd {
  display: flex; align-items: center; height: 92px; padding: 0 36px; gap: 14px;
  border-bottom: 1px solid #f1f3f5;
}
.ez-hd-burger {
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff;
  color: #4b5563; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.ez-hd-burger:hover { background: #f8fafc; color: #18181b; border-color: #d1d5db; }
.ez-hd-sep { width: 1px; height: 16px; background: #e5e7eb; flex-shrink: 0; margin: 0 4px; }
.ez-hd-badge {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e7eb;
  overflow: hidden; background: #fff; flex-shrink: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.ez-hd-brand-logo { width: 100%; height: 100%; object-fit: cover; }
.ez-hd-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-size: 18px; font-weight: 700;
  color: #111827; letter-spacing: -0.04em; line-height: 1;
}
.ez-hd-title-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ez-hub-title { margin: 0; font-size: 22px; font-weight: 600; color: #18181b; letter-spacing: -0.015em; white-space: nowrap; }
.ez-hub-count {
  font-size: 12.5px; font-weight: 600; color: #4b5563;
  background: #f1f3f5; border-radius: 9999px; padding: 2px 10px;
}
.ez-search-wrap {
  position: relative; display: flex; align-items: center;
  flex: 1 1 0; margin: 0 20px; min-width: 220px;
}
.ez-search-icon { position: absolute; left: 16px; color: #9ca3af; pointer-events: none; }
.ez-search {
  width: 100%; height: 44px; padding: 0 44px 0 44px;
  background: #f3f4f6; border: none; border-radius: 9999px;
  font-size: 15px; color: #111827; outline: none; font-family: inherit;
}
.ez-search:focus { background: #eeeeef; }
.ez-search::placeholder { color: #9ca3af; }
.ez-search-clear {
  position: absolute; right: 10px; width: 32px; height: 32px;
  border: none; background: none; color: #9ca3af; cursor: pointer;
  display: flex; align-items: center; justify-content: center; border-radius: 50%;
}
.ez-add-btn {
  display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
  height: 40px; padding: 0 20px; border: 1px solid #e5e7eb; border-radius: 9999px;
  background: #fff; color: #111827; font-family: inherit;
  font-size: 13.5px; font-weight: 600; cursor: pointer;
}
.ez-add-btn:hover { background: #f8fafc; border-color: #d1d5db; }
.ez-hd-gear {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.ez-hd-gear:hover { background: #f8fafc; color: #0f172a; }

.ez-toolbar2 {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 36px; border-bottom: 1px solid #f1f3f5;
}
.ez-tb2-btn {
  display: flex; align-items: center;
  min-height: 34px; padding: 6px 14px;
  border: 1px solid #e2e8f0; border-radius: 9999px; background: #fff;
  cursor: pointer; font-family: inherit;
}
.ez-tb2-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
.ez-tb2-btn--active { background: #f1f5f9; border-color: #cbd5e1; }
.ez-tb2-lbl { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #475569; white-space: nowrap; }
.ez-tb2-btn--active .ez-tb2-lbl { color: #0f172a; font-weight: 600; }
.ez-tb2-cnt {
  min-width: 18px; padding: 1px 6px; border-radius: 9999px;
  background: #f1f5f9; font-size: 10.5px; font-weight: 700; color: #475569;
}
.ez-tb2-divider { width: 1px; height: 16px; background: #e5e7eb; margin: 0 4px; }
.ez-tb2-stat { font-size: 12.5px; font-weight: 600; color: #64748b; }

.ez-split { flex: 1; display: flex; align-items: stretch; min-height: 0; background: #f7f7f8; }
.ez-editor {
  flex: 1 1 50%; width: 50%; min-width: 0;
  background: #fff; border-right: 1px solid #f0f0f2;
  overflow-y: auto; padding: 22px 32px 48px;
}
.ez-crumb { margin: 0 0 18px; font-size: 12.5px; font-weight: 500; color: #94a3b8; }
.ez-empty { padding: 8px 2px 0; }
.ez-empty-kicker {
  margin: 0 0 6px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase; color: #94a3b8;
}
.ez-empty-title {
  margin: 0 0 10px;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400; font-style: italic; font-size: 28px; color: #1a1a1a;
}
.ez-empty-lede { margin: 0 0 22px; max-width: 42ch; font-size: 14px; color: #64748b; line-height: 1.55; }
.ez-empty-row {
  width: min(420px, 100%); display: flex; align-items: center; gap: 14px;
  padding: 16px 14px; border: 1px dashed #d1d5db; border-radius: 14px;
  background: #fafafa; cursor: pointer; text-align: left; font-family: inherit;
}
.ez-empty-row:hover { border-color: #c4c4c8; background: #fff; }
.ez-empty-plus {
  width: 36px; height: 36px; border-radius: 50%;
  background: #fff; color: #374151; border: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.ez-empty-row-copy { display: flex; flex-direction: column; gap: 2px; }
.ez-empty-row-title { font-size: 15px; font-weight: 600; color: #111827; }
.ez-empty-row-sub { font-size: 13px; color: #64748b; }

.ez-list { display: flex; flex-direction: column; }
.ez-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 16px 4px 18px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
}
.ez-item:hover { background: #fafafa; }
.ez-item--on { background: #f7f7f8; }
.ez-item-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.ez-item-title { font-size: 15px; font-weight: 600; color: #111827; }
.ez-item-sub {
  font-size: 13px; color: #64748b;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.ez-item-meta { font-size: 12.5px; color: #64748b; }
.ez-bar { height: 4px; border-radius: 9999px; background: #f1f3f5; overflow: hidden; }
.ez-bar-fill { height: 100%; background: #111827; width: 0; }
.ez-bar--site { margin: 12px 0 8px; height: 5px; }
.ez-item-acts { opacity: 0; pointer-events: none; display: flex; gap: 6px; align-items: center; flex-shrink: 0; padding-top: 2px; }
.ez-item:hover .ez-item-acts, .ez-item--on .ez-item-acts { opacity: 1; pointer-events: auto; }
.ez-del-lbl { font-size: 12px; font-weight: 600; color: #111827; }
.ez-chip-btn {
  height: 28px; padding: 0 10px; border-radius: 9999px;
  border: 1px solid #e5e7eb; background: #fff; color: #374151;
  font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
}
.ez-chip-btn:hover { background: #f8fafc; }
.ez-chip-btn--danger { color: #9f1239; border-color: #fecdd3; }

.ez-preview {
  flex: 1 1 50%; width: 50%; min-width: 0;
  display: flex; flex-direction: column; background: #f4f4f5;
}
.ez-preview-bar {
  height: 48px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 18px; background: #fff; border-bottom: 1px solid #f0f0f2; flex-shrink: 0;
}
.ez-preview-kicker {
  font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #94a3b8;
}
.ez-preview-edit {
  border: none; background: none; font-size: 12.5px; font-weight: 600;
  color: #374151; cursor: pointer; font-family: inherit;
}
.ez-preview-edit:hover { color: #111827; }
.ez-preview-stage {
  flex: 1; min-height: 0; overflow: auto;
  padding: 28px 24px 40px;
  display: flex; justify-content: center; align-items: flex-start;
}
.ez-site {
  width: min(420px, 100%);
  background: #FAF6EF; color: #241F18;
  border-radius: 4px; box-shadow: 0 18px 50px rgba(36, 31, 24, 0.08);
  padding: 40px 36px 44px;
}
.ez-site-kicker {
  margin: 0 0 10px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase; color: #8a8178;
}
.ez-site-title {
  margin: 0 0 10px;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400; font-size: 28px; color: #241F18; line-height: 1.2;
}
.ez-site-lede { margin: 0 0 22px; font-size: 14px; color: #6b645c; line-height: 1.55; }
.ez-site-amt { display: flex; align-items: baseline; gap: 12px; }
.ez-site-pct {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 32px; font-weight: 400; color: #241F18;
}
.ez-site-amt-copy { font-size: 13px; color: #8a8178; }
.ez-site-done { margin: 10px 0 0; font-size: 13px; font-weight: 600; color: #374151; }
.ez-site-people-lbl {
  margin: 28px 0 12px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase; color: #8a8178;
}
.ez-site-muted { margin: 0; font-size: 13.5px; color: #8a8178; }
.ez-people { display: flex; flex-direction: column; gap: 12px; }
.ez-person { display: flex; align-items: flex-start; gap: 10px; }
.ez-person-av {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.ez-person-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ez-person-name { font-size: 13.5px; font-weight: 600; color: #241F18; }
.ez-person-note { font-size: 13px; font-style: italic; color: #6b645c; }
.ez-person-when { font-size: 12px; color: #8a8178; }
.ez-person-amt { font-size: 12.5px; font-weight: 600; color: #241F18; flex-shrink: 0; }

.ez-input, .ez-textarea {
  width: 100%; box-sizing: border-box;
  border: 1px solid #e5e7eb; border-radius: 12px;
  font-size: 15px; font-family: inherit; color: #111827; outline: none;
  padding: 0 14px;
}
.ez-input { height: 44px; }
.ez-textarea { padding: 12px 14px; resize: vertical; }
.ez-input--err { border-color: #fecdd3; }
.ez-field-err { margin: 6px 0 0; font-size: 12.5px; color: #9f1239; }
.ez-opt { font-weight: 500; color: #94a3b8; }

@media (max-width: 980px) {
  .ez-split { flex-direction: column; }
  .ez-editor, .ez-preview { width: 100%; flex-basis: auto; }
  .ez-editor { border-right: none; border-bottom: 1px solid #f0f0f2; max-height: 46vh; }
  .ez-preview { min-height: 54vh; }
  .ez-item-acts { opacity: 1; pointer-events: auto; }
}
@media (max-width: 900px) {
  .ez-panel-hd { height: auto; flex-wrap: wrap; padding: 12px 16px; gap: 10px; }
  .ez-search-wrap { flex: 1 1 100%; margin: 8px 0 0; order: 8; }
  .ez-hd-sep { display: none; }
  .ez-toolbar2 { padding-left: 16px; padding-right: 16px; }
  .ez-editor { padding: 16px; }
}
</style>

<style>
html .ez-joy-overlay {
  position: fixed; inset: 0; z-index: 1600;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.32) !important;
  backdrop-filter: none !important;
}
html .ez-dialog {
  width: min(480px, calc(100vw - 32px));
  background: #fff; color: #111827; border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
html .ez-dialog-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 10px 24px;
}
html .ez-dialog-title { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #111827; }
html .ez-dialog-x {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: #f8fafc; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
html .ez-dialog-body { padding: 4px 24px 12px; }
html .ez-dialog-sub { margin: 0 0 18px; font-size: 14px; color: #64748b; line-height: 1.5; }
html .ez-field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin: 14px 0 8px; }
html .ez-dialog-body .ez-field-label:first-of-type { margin-top: 0; }
html .ez-dialog-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid #f0f0f2;
}
html .ez-dialog-cancel {
  height: 40px; padding: 0 16px; border: none; background: none;
  font-size: 14px; font-weight: 600; color: #111827; cursor: pointer; font-family: inherit;
}
html .ez-dialog-save {
  height: 40px; padding: 0 18px; border: 1px solid #e5e7eb; border-radius: 9999px;
  background: #fff; color: #111827; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
}
html .ez-dialog-save:disabled { opacity: 0.45; cursor: default; }
</style>
