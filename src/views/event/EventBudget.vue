<template>
  <div class="eb-root">

    <!-- ── Stat cards ── -->
    <div class="eb-stats" v-if="!loading && !loadError">
      <div class="eb-stat-card">
        <div class="eb-stat-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
        </div>
        <div class="eb-stat-body">
          <span class="eb-stat-val">TZS {{ formatMoney(totalEstimated) }}</span>
          <span class="eb-stat-lbl">Total Estimated</span>
        </div>
      </div>

      <div class="eb-stat-card">
        <div class="eb-stat-icon eb-stat-icon--gold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="eb-stat-body">
          <span class="eb-stat-val">TZS {{ formatMoney(totalActual) }}</span>
          <span class="eb-stat-lbl">Total Spent</span>
        </div>
      </div>

      <div class="eb-stat-card">
        <div class="eb-stat-icon" :class="remaining >= 0 ? 'eb-stat-icon--green' : 'eb-stat-icon--red'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <template v-if="remaining >= 0">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </template>
            <template v-else>
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
              <polyline points="17 18 23 18 23 12"/>
            </template>
          </svg>
        </div>
        <div class="eb-stat-body">
          <span class="eb-stat-val" :class="remaining < 0 ? 'eb-stat-val--over' : ''">
            TZS {{ formatMoney(Math.abs(remaining)) }}
          </span>
          <span class="eb-stat-lbl">{{ remaining >= 0 ? 'Remaining' : 'Over Budget' }}</span>
        </div>
      </div>

      <div class="eb-stat-card">
        <div class="eb-stat-icon eb-stat-icon--purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </div>
        <div class="eb-stat-body">
          <span class="eb-stat-val">{{ items.length }}</span>
          <span class="eb-stat-lbl">Budget Items</span>
        </div>
      </div>
    </div>

    <!-- ── Toolbar ── -->
    <div class="eb-toolbar">
      <div class="eb-search-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f617a" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="searchQ" class="eb-search" placeholder="Search items…" />
        <button v-if="searchQ" class="eb-search-clear" @click="searchQ = ''">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <span class="eb-toolbar-count" v-if="!loading">{{ filtered.length }} item{{ filtered.length !== 1 ? 's' : '' }}</span>
      <button class="eb-add-btn" @click="openAdd">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Item
      </button>
    </div>

    <!-- ── Loading skeleton ── -->
    <div class="eb-table-wrap" v-if="loading">
      <table class="eb-table">
        <thead><tr>
          <th class="eb-th">#</th><th class="eb-th">Category</th><th class="eb-th">Description</th>
          <th class="eb-th">Vendor</th><th class="eb-th">Estimated</th><th class="eb-th">Actual</th>
          <th class="eb-th">Status</th><th class="eb-th"></th>
        </tr></thead>
        <tbody>
          <tr v-for="i in 5" :key="i" class="eb-tr"><td colspan="8"><div class="eb-skel"/></td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── Error ── -->
    <div v-else-if="loadError" class="eb-empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e55" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="eb-empty-title">Something went wrong</p>
      <p class="eb-empty-sub">{{ loadError }}</p>
    </div>

    <!-- ── Table ── -->
    <div v-else class="eb-table-wrap">
      <table class="eb-table">
        <thead>
          <tr>
            <th class="eb-th eb-th--num">#</th>
            <th class="eb-th">Category</th>
            <th class="eb-th">Description</th>
            <th class="eb-th">Vendor</th>
            <th class="eb-th eb-th--right">Estimated (TZS)</th>
            <th class="eb-th eb-th--right">Actual (TZS)</th>
            <th class="eb-th">Status</th>
            <th class="eb-th eb-th--actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="8">
              <div class="eb-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4f617a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
                <p class="eb-empty-title">{{ searchQ ? 'No matching items' : 'No budget items yet' }}</p>
                <p class="eb-empty-sub">{{ searchQ ? 'Try a different search term' : 'Start planning what you need for your event' }}</p>
                <button v-if="!searchQ" class="eb-add-btn eb-add-btn--lg" @click="openAdd">Add First Item</button>
              </div>
            </td>
          </tr>
          <tr v-for="(item, i) in filtered" :key="item.id" class="eb-tr">
            <td class="eb-td eb-td--num">{{ i + 1 }}</td>
            <td class="eb-td">
              <span class="eb-cat-badge">{{ item.category }}</span>
            </td>
            <td class="eb-td eb-td--desc">{{ item.description }}</td>
            <td class="eb-td eb-td--vendor">{{ item.vendor || '—' }}</td>
            <td class="eb-td eb-td--right eb-td--money">{{ formatMoney(item.estimatedCost) }}</td>
            <td class="eb-td eb-td--right">
              <span v-if="item.actualCost != null" class="eb-td--money" :class="{ 'eb-over': item.actualCost > item.estimatedCost }">
                {{ formatMoney(item.actualCost) }}
              </span>
              <span v-else class="eb-td--muted">—</span>
            </td>
            <td class="eb-td">
              <span class="eb-status" :class="`eb-status--${item.status}`">{{ STATUS_LABELS[item.status] ?? item.status }}</span>
            </td>
            <td class="eb-td eb-td--actions">
              <button class="eb-act-btn" @click="openEdit(item)" title="Edit">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="eb-act-btn eb-act-btn--danger" @click="deleteItem(item)" title="Delete">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filtered.length" class="eb-table-footer">
        <span class="eb-range-label">{{ filtered.length }} item{{ filtered.length !== 1 ? 's' : '' }}</span>
        <span class="eb-range-label">
          Estimated: TZS {{ formatMoney(totalEstimated) }} &nbsp;·&nbsp; Spent: TZS {{ formatMoney(totalActual) }}
        </span>
      </div>
    </div>

    <!-- ── Add/Edit Modal ── -->
    <div v-if="modal.open" class="eb-backdrop" @click.self="closeModal">
      <div class="eb-modal">
        <div class="eb-modal-hd">
          <h2 class="eb-modal-title">{{ modal.editId ? 'Edit Budget Item' : 'Add Budget Item' }}</h2>
          <button class="eb-modal-close" @click="closeModal" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form class="eb-modal-body" @submit.prevent="saveItem">
          <div class="eb-field">
            <label class="eb-label">Category</label>
            <select v-model="modal.form.category" class="eb-input" required>
              <option value="" disabled>Select a category</option>
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="eb-field">
            <label class="eb-label">Description</label>
            <input v-model="modal.form.description" class="eb-input" placeholder="e.g. Dinner for 300 guests" required />
          </div>

          <div class="eb-field">
            <label class="eb-label">Vendor <span class="eb-opt">(optional)</span></label>
            <input v-model="modal.form.vendor" class="eb-input" placeholder="e.g. Royal Catering Co." />
          </div>

          <div class="eb-field-row">
            <div class="eb-field">
              <label class="eb-label">Estimated Cost (TZS)</label>
              <input v-model.number="modal.form.estimatedCost" type="number" min="0" class="eb-input" placeholder="0" required />
            </div>
            <div class="eb-field">
              <label class="eb-label">Actual Cost (TZS) <span class="eb-opt">(optional)</span></label>
              <input v-model="modal.form.actualCostStr" type="number" min="0" class="eb-input" placeholder="leave blank if not yet spent" />
            </div>
          </div>

          <div class="eb-field">
            <label class="eb-label">Status</label>
            <select v-model="modal.form.status" class="eb-input">
              <option value="planned">Planned</option>
              <option value="booked">Booked</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div class="eb-field">
            <label class="eb-label">Notes <span class="eb-opt">(optional)</span></label>
            <textarea v-model="modal.form.notes" class="eb-input eb-textarea" placeholder="Any additional details..." rows="2" />
          </div>

          <div class="eb-modal-ft">
            <button type="button" class="eb-btn eb-btn--ghost" @click="closeModal" :disabled="modal.saving">Cancel</button>
            <button type="submit" class="eb-btn eb-btn--primary" :disabled="modal.saving">
              {{ modal.saving ? 'Saving…' : (modal.editId ? 'Save Changes' : 'Add Item') }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../../firebase'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'

const route   = useRoute()
const eventId = computed(() => route.params.eventId)

const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Music / DJ', 'Decoration',
  'Attire', 'Cake', 'Invitations', 'Transportation', 'Entertainment', 'Other',
]

const STATUS_LABELS = { planned: 'Planned', booked: 'Booked', paid: 'Paid' }

const loading   = ref(true)
const loadError = ref('')
const items     = ref([])
const searchQ   = ref('')

const modal = ref({ open: false, editId: null, saving: false, form: emptyForm() })

function emptyForm() {
  return { category: '', description: '', vendor: '', estimatedCost: '', actualCostStr: '', status: 'planned', notes: '' }
}

// ── Computed ──────────────────────────────────────────────────────────────────

const totalEstimated = computed(() => items.value.reduce((s, i) => s + (i.estimatedCost ?? 0), 0))
const totalActual    = computed(() => items.value.reduce((s, i) => s + (i.actualCost ?? 0), 0))
const remaining      = computed(() => totalEstimated.value - totalActual.value)

const filtered = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(i =>
    (i.description ?? '').toLowerCase().includes(q) ||
    (i.category   ?? '').toLowerCase().includes(q) ||
    (i.vendor     ?? '').toLowerCase().includes(q)
  )
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMoney(n) {
  if (n == null || n === '') return '0'
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── Data ──────────────────────────────────────────────────────────────────────

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

// ── Modal ─────────────────────────────────────────────────────────────────────

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

onMounted(load)
</script>

<style scoped>
.eb-root { padding: 20px 24px 32px; display: flex; flex-direction: column; gap: 16px; }

/* ── Stat cards ── */
.eb-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.eb-stat-card {
  background: #111827; border: 1px solid #1e2d44; border-radius: 12px;
  padding: 16px 18px; display: flex; align-items: center; gap: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.eb-stat-icon {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  background: rgba(201,168,76,0.08); color: #C9A84C;
  display: flex; align-items: center; justify-content: center;
}
.eb-stat-icon--gold   { background: rgba(201,168,76,0.08);  color: #C9A84C; }
.eb-stat-icon--green  { background: rgba(52,211,153,0.10);  color: #34d399; }
.eb-stat-icon--red    { background: rgba(239,68,68,0.10);   color: #f87171; }
.eb-stat-icon--purple { background: rgba(167,139,250,0.10); color: #a78bfa; }
.eb-stat-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.eb-stat-val  { font-size: 17px; font-weight: 700; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eb-stat-val--over { color: #f87171; }
.eb-stat-lbl  { font-size: 11px; color: #8892a4; font-weight: 500; }

/* ── Toolbar ── */
.eb-toolbar { display: flex; align-items: center; gap: 12px; }
.eb-search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: #111827; border: 1px solid #1e2d44; border-radius: 10px;
  padding: 0 12px; height: 36px; flex: 1; max-width: 360px;
  transition: border-color 150ms;
}
.eb-search-wrap:focus-within { border-color: #C9A84C; }
.eb-search { flex: 1; border: none; outline: none; font-size: 13px; color: #e2e8f0; background: transparent; }
.eb-search::placeholder { color: #4f617a; }
.eb-search-clear { background: none; border: none; cursor: pointer; color: #4f617a; display: flex; align-items: center; padding: 0; }
.eb-search-clear:hover { color: #e2e8f0; }
.eb-toolbar-count { font-size: 12px; color: #8892a4; margin-left: auto; }

.eb-add-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.25);
  color: #C9A84C; font-size: 13px; font-weight: 600;
  padding: 0 14px; height: 36px; border-radius: 10px; cursor: pointer;
  transition: background 150ms, border-color 150ms;
  font-family: inherit; white-space: nowrap;
}
.eb-add-btn:hover { background: rgba(201,168,76,0.20); border-color: rgba(201,168,76,0.4); }
.eb-add-btn--lg { margin-top: 8px; height: 40px; padding: 0 20px; }

/* ── Table ── */
.eb-table-wrap { background: #111827; border: 1px solid #1e2d44; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.eb-table { width: 100%; border-collapse: collapse; }

.eb-th {
  padding: 11px 14px; text-align: left;
  font-size: 11px; font-weight: 700; color: #8892a4; letter-spacing: 0.4px; text-transform: uppercase;
  background: #111827; border-bottom: 1px solid #1e2d44; white-space: nowrap;
}
.eb-th--num     { width: 44px; }
.eb-th--right   { text-align: right; }
.eb-th--actions { width: 72px; }

.eb-tr { border-bottom: 1px solid #1a2a3e; transition: background 0.1s; }
.eb-tr:last-child { border-bottom: none; }
.eb-tr:hover { background: rgba(255,255,255,0.02); }

.eb-td { padding: 12px 14px; font-size: 13px; color: #e2e8f0; vertical-align: middle; }
.eb-td--num    { color: #4f617a; font-size: 12px; text-align: center; width: 44px; }
.eb-td--right  { text-align: right; }
.eb-td--desc   { font-weight: 500; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.eb-td--vendor { color: #8892a4; font-size: 12px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.eb-td--money  { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #e2e8f0; }
.eb-td--muted  { color: #4f617a; }
.eb-td--actions { text-align: right; }

.eb-over { color: #f87171; }

/* Category badge */
.eb-cat-badge {
  display: inline-block; padding: 2px 9px; border-radius: 6px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.2px;
  background: rgba(255,255,255,0.06); color: #c8d4e0; border: 1px solid rgba(255,255,255,0.08);
  white-space: nowrap;
}

/* Status badge */
.eb-status {
  display: inline-block; padding: 2px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.2px; white-space: nowrap;
}
.eb-status--planned { background: rgba(148,163,184,0.10); color: #94a3b8; border: 1px solid rgba(148,163,184,0.15); }
.eb-status--booked  { background: rgba(96,165,250,0.10);  color: #60a5fa; border: 1px solid rgba(96,165,250,0.15); }
.eb-status--paid    { background: rgba(52,211,153,0.10);  color: #34d399; border: 1px solid rgba(52,211,153,0.15); }

/* Action buttons */
.eb-act-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 7px;
  background: none; border: none; cursor: pointer;
  color: #4f617a; transition: background 130ms, color 130ms;
}
.eb-act-btn:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }
.eb-act-btn--danger:hover { background: rgba(239,68,68,0.12); color: #f87171; }

/* Table footer */
.eb-table-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 16px; border-top: 1px solid #1e2d44;
  background: #111827; gap: 12px; flex-wrap: wrap;
}
.eb-range-label { font-size: 12px; color: #8892a4; font-weight: 500; white-space: nowrap; }

/* ── Skeleton ── */
.eb-skel {
  height: 20px; border-radius: 6px; background: #1a2a3e; margin: 9px 14px;
  animation: eb-shimmer 1.4s ease-in-out infinite;
}
@keyframes eb-shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ── Empty state ── */
.eb-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 20px; gap: 8px;
}
.eb-empty-title { font-size: 14px; font-weight: 600; color: #8892a4; margin: 4px 0 0; }
.eb-empty-sub   { font-size: 13px; color: #4f617a; margin: 0; }

/* ── Modal ── */
.eb-backdrop {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.eb-modal {
  background: #111827; border: 1px solid #1e2d44; border-radius: 16px;
  width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
}
.eb-modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #1e2d44; flex-shrink: 0;
}
.eb-modal-title { font-size: 16px; font-weight: 700; color: #e2e8f0; margin: 0; }
.eb-modal-close {
  background: none; border: none; cursor: pointer; color: #4f617a;
  display: flex; align-items: center; padding: 4px; border-radius: 6px;
  transition: color 130ms, background 130ms;
}
.eb-modal-close:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }

.eb-modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.eb-modal-ft   { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }

.eb-field     { display: flex; flex-direction: column; gap: 6px; }
.eb-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.eb-label     { font-size: 12px; font-weight: 600; color: #8892a4; letter-spacing: 0.2px; }
.eb-opt       { font-weight: 400; color: #4f617a; }

.eb-input {
  background: #0d1326; border: 1px solid #1e2d44; border-radius: 9px;
  padding: 9px 12px; font-size: 13.5px; color: #e2e8f0; outline: none;
  transition: border-color 150ms; font-family: inherit; width: 100%; box-sizing: border-box;
}
.eb-input:focus  { border-color: #C9A84C; }
.eb-input::placeholder { color: #4f617a; }
.eb-textarea { resize: vertical; min-height: 64px; }

select.eb-input { appearance: none; cursor: pointer; }

/* Buttons */
.eb-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 18px; height: 38px; border-radius: 10px;
  font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: background 150ms, opacity 150ms; border: none;
}
.eb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.eb-btn--ghost   { background: rgba(255,255,255,0.06); color: #8892a4; border: 1px solid #1e2d44; }
.eb-btn--ghost:hover:not(:disabled)   { background: rgba(255,255,255,0.10); color: #e2e8f0; }
.eb-btn--primary { background: rgba(201,168,76,0.15); color: #C9A84C; border: 1px solid rgba(201,168,76,0.3); }
.eb-btn--primary:hover:not(:disabled) { background: rgba(201,168,76,0.25); border-color: rgba(201,168,76,0.5); }

/* ── Responsive ── */
@media (max-width: 900px) {
  .eb-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .eb-root  { padding: 12px 14px 24px; gap: 12px; }
  .eb-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .eb-toolbar { flex-wrap: wrap; gap: 8px; }
  .eb-field-row { grid-template-columns: 1fr; }
  .eb-th--vendor, .eb-td--vendor { display: none; }
}
@media (max-width: 420px) {
  .eb-stats { grid-template-columns: 1fr; }
}
</style>
