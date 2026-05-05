<template>
  <div class="page">

    <!-- SMS Providers -->
    <div class="section">
      <div class="section-header" @click="smsOpen = !smsOpen">
        <div class="section-left">
          <ChevronDownIcon class="section-caret" :class="smsOpen && 'section-caret--open'" />
          <div class="section-info">
            <h2 class="section-title">SMS Providers</h2>
            <p class="section-sub">Only one provider can be active at a time.</p>
          </div>
        </div>
        <button class="add-btn" @click.stop="openCreate">
          <PlusIcon class="btn-icon" />
          Add Provider
        </button>
      </div>

      <Transition name="collapse">
        <div v-show="smsOpen" class="section-body">
          <div v-if="loading" class="state-center">
            <div class="spinner" />
          </div>

          <div v-else-if="providers.length === 0" class="state-center">
            <div class="empty-icon-wrap">
              <DevicePhoneMobileIcon class="empty-icon" />
            </div>
            <p class="empty-title">No providers yet</p>
            <p class="empty-sub">Add your first SMS gateway provider above.</p>
          </div>

          <div v-else class="providers-list">
            <div v-for="p in providers" :key="p.id" class="provider-card">
              <div class="provider-left">
                <div class="provider-icon-wrap" :class="p.isActive && 'provider-icon-wrap--on'">
                  <DevicePhoneMobileIcon class="provider-icon" />
                </div>
                <span class="provider-name">{{ p.name }}</span>
              </div>
              <div class="provider-right">
                <button
                  :class="['status-pill', p.isActive && 'status-pill--on']"
                  :disabled="p.isActive || activating"
                  @click="setActive(p)"
                >
                  <span class="dot" />{{ p.isActive ? 'Active' : 'Set Active' }}
                </button>
                <button class="icon-btn" @click="openEdit(p)" title="Rename">
                  <PencilSquareIcon class="ib-svg" />
                </button>
                <button class="icon-btn icon-btn--del" @click="confirmDelete(p)" title="Delete">
                  <TrashIcon class="ib-svg" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Delete confirm -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="deletingProvider" class="backdrop" @click.self="deletingProvider = null">
          <div class="confirm-box">
            <div class="warn-icon-wrap">
              <ExclamationTriangleIcon class="warn-icon" />
            </div>
            <p class="confirm-title">Delete provider?</p>
            <p class="confirm-body">
              <strong>{{ deletingProvider.name }}</strong> will be permanently removed.
            </p>
            <div class="confirm-row">
              <button class="cancel-btn" :disabled="deleting" @click="deletingProvider = null">Cancel</button>
              <button class="del-btn" :disabled="deleting" @click="doDelete">
                {{ deleting ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add / Edit modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal" class="backdrop" @click.self="closeModal">
          <div class="modal">
            <div class="modal-header">
              <span class="modal-title">{{ editingProvider ? 'Rename Provider' : 'Add Provider' }}</span>
              <button class="close-btn" @click="closeModal">
                <XMarkIcon class="close-icon" />
              </button>
            </div>

            <div class="field">
              <label class="field-label">Provider Name</label>
              <input
                v-model="form.name"
                class="field-input"
                placeholder="e.g. beem, onfon, africas-talking"
                @keydown.enter="submit"
              />
            </div>

            <p v-if="saveError" class="error-msg">{{ saveError }}</p>

            <button class="submit-btn" :disabled="saving || !form.name.trim()" @click="submit">
              {{ saving ? 'Saving…' : editingProvider ? 'Save Changes' : 'Add Provider' }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../../firebase.js'
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, writeBatch,
} from 'firebase/firestore'
import {
  PlusIcon, TrashIcon, PencilSquareIcon, XMarkIcon,
  ExclamationTriangleIcon, DevicePhoneMobileIcon, ChevronDownIcon,
} from '@heroicons/vue/24/outline'

const COL = 'smsProviders'

const smsOpen          = ref(false)

const providers        = ref([])
const loading          = ref(true)
const activating       = ref(false)
const showModal        = ref(false)
const editingProvider  = ref(null)
const deletingProvider = ref(null)
const deleting         = ref(false)
const saving           = ref(false)
const saveError        = ref('')

const defaultForm = () => ({ name: '' })
const form = ref(defaultForm())

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchProviders() {
  loading.value = true
  try {
    const snap = await getDocs(collection(db, COL))
    providers.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } finally {
    loading.value = false
  }
}

// ── Set active (only one at a time via batch) ──────────────────────────────

async function setActive(provider) {
  if (provider.isActive || activating.value) return
  activating.value = true
  try {
    const batch = writeBatch(db)
    providers.value.forEach(p => batch.update(doc(db, COL, p.id), { isActive: false }))
    batch.update(doc(db, COL, provider.id), { isActive: true })
    await batch.commit()
    providers.value.forEach(p => { p.isActive = p.id === provider.id })
  } catch (e) {
    console.error(e)
  } finally {
    activating.value = false
  }
}

// ── Create ─────────────────────────────────────────────────────────────────

async function createProvider() {
  saving.value    = true
  saveError.value = ''
  try {
    await addDoc(collection(db, COL), { name: form.value.name.trim(), isActive: false })
    await fetchProviders()
    resetModal()
  } catch {
    saveError.value = 'Failed to add provider. Try again.'
  } finally {
    saving.value = false
  }
}

// ── Update ─────────────────────────────────────────────────────────────────

async function saveProvider() {
  saving.value    = true
  saveError.value = ''
  try {
    await updateDoc(doc(db, COL, editingProvider.value.id), { name: form.value.name.trim() })
    await fetchProviders()
    resetModal()
  } catch {
    saveError.value = 'Failed to save changes. Try again.'
  } finally {
    saving.value = false
  }
}

function submit() { editingProvider.value ? saveProvider() : createProvider() }

// ── Delete ─────────────────────────────────────────────────────────────────

function confirmDelete(p) { deletingProvider.value = p }

async function doDelete() {
  deleting.value = true
  try {
    await deleteDoc(doc(db, COL, deletingProvider.value.id))
    providers.value    = providers.value.filter(p => p.id !== deletingProvider.value.id)
    deletingProvider.value = null
  } catch (e) {
    console.error(e)
  } finally {
    deleting.value = false
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────

function openCreate() {
  editingProvider.value = null
  form.value            = defaultForm()
  saveError.value       = ''
  showModal.value       = true
}

function openEdit(p) {
  editingProvider.value = p
  form.value            = { name: p.name }
  saveError.value       = ''
  showModal.value       = true
}

function resetModal() {
  showModal.value       = false
  editingProvider.value = null
  form.value            = defaultForm()
  saveError.value       = ''
}

function closeModal() {
  if (saving.value) return
  resetModal()
}

onMounted(fetchProviders)
</script>

<style scoped>
.page {
  padding: 28px 28px 48px;
  min-height: 100%;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #EEEEF0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Section ─────────────────────────────────────────────────────────────── */
.section {
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 18px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 16px;
  flex-wrap: wrap;
  cursor: pointer;
  user-select: none;
  transition: background 120ms;
}
.section-header:hover { background: rgba(255,255,255,.02); }

.section-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.section-caret {
  width: 16px;
  height: 16px;
  color: #8E8E93;
  flex-shrink: 0;
  transition: transform 220ms ease;
}
.section-caret--open { transform: rotate(180deg); }

.section-title { font-size: 15px; font-weight: 600; color: #EEEEF0; margin: 0; letter-spacing: -0.2px; }
.section-sub   { font-size: 12px; color: #8E8E93; margin: 3px 0 0; }

.section-body { border-top: 0.8px solid #2C2C2E; overflow: hidden; }

/* Collapse transition */
.collapse-enter-active, .collapse-leave-active { transition: opacity 200ms ease; }
.collapse-enter-from,   .collapse-leave-to     { opacity: 0; }

.add-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 0.8px solid rgba(201, 168, 76, 0.35);
  background: #2A2210;
  color: #C9A84C;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
  white-space: nowrap;
}
.add-btn:hover { opacity: 0.8; }
.btn-icon { width: 15px; height: 15px; }

/* ── States ──────────────────────────────────────────────────────────────── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  gap: 10px;
  padding: 24px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #2C2C2E;
  border-top-color: #C9A84C;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #2A2210;
  border: 0.8px solid rgba(201, 168, 76, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-icon  { width: 24px; height: 24px; color: #C9A84C; }
.empty-title { font-size: 15px; font-weight: 600; color: #EEEEF0; margin: 0; }
.empty-sub   { font-size: 13px; color: #8E8E93; margin: 0; }

/* ── Providers list ──────────────────────────────────────────────────────── */
.providers-list { display: flex; flex-direction: column; }

.provider-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  gap: 16px;
  transition: background 100ms;
}
.provider-card:hover { background: rgba(255,255,255,.02); }
.provider-card + .provider-card { border-top: 0.8px solid #2C2C2E; }

.provider-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.provider-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: #28282C;
  border: 0.8px solid #2C2C2E;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 200ms, border-color 200ms;
}
.provider-icon-wrap--on {
  background: #1C2A1C;
  border-color: rgba(48, 209, 88, 0.3);
}
.provider-icon { width: 20px; height: 20px; color: #8E8E93; }
.provider-icon-wrap--on .provider-icon { color: #30D158; }

.provider-name {
  font-size: 15px;
  font-weight: 600;
  color: #EEEEF0;
  text-transform: capitalize;
}

.provider-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Status pill ─────────────────────────────────────────────────────────── */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 0.6px solid #2C2C2E;
  background: #28282C;
  color: #48484A;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 150ms;
  white-space: nowrap;
}
.status-pill:not(:disabled):hover {
  border-color: rgba(48, 209, 88, 0.3);
  color: #30D158;
  background: #1C2A1C;
}
.status-pill--on {
  background: #1C2A1C;
  border-color: rgba(48, 209, 88, 0.3);
  color: #30D158;
  cursor: default;
}
.status-pill:disabled:not(.status-pill--on) { opacity: 0.5; cursor: not-allowed; }
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* ── Icon buttons ────────────────────────────────────────────────────────── */
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

/* ── Backdrop ────────────────────────────────────────────────────────────── */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
  box-sizing: border-box;
}

/* ── Confirm box ─────────────────────────────────────────────────────────── */
.confirm-box {
  width: 100%;
  max-width: 360px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 20px;
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}
.warn-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(255,69,58,.12); border: 0.8px solid rgba(255,69,58,.25);
  display: flex; align-items: center; justify-content: center;
}
.warn-icon     { width: 24px; height: 24px; color: #FF453A; }
.confirm-title { font-size: 18px; font-weight: 700; color: #EEEEF0; margin: 0; letter-spacing: -0.3px; }
.confirm-body  { font-size: 13px; color: #8E8E93; margin: 0; line-height: 1.5; }
.confirm-row   { display: flex; gap: 10px; width: 100%; margin-top: 4px; }

.cancel-btn {
  flex: 1; padding: 12px; border-radius: 12px;
  border: 0.8px solid #2C2C2E; background: #28282C; color: #AEAEB2;
  font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: color 150ms;
}
.cancel-btn:hover:not(:disabled) { color: #EEEEF0; }
.cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.del-btn {
  flex: 1; padding: 12px; border-radius: 12px; border: none;
  background: #FF453A; color: #fff; font-size: 14px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: opacity 150ms;
}
.del-btn:not(:disabled):hover { opacity: 0.85; }
.del-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Modal ───────────────────────────────────────────────────────────────── */
.modal {
  width: 100%;
  max-width: 400px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
}

.modal-header { display: flex; align-items: center; justify-content: space-between; }
.modal-title  { font-size: 18px; font-weight: 700; color: #EEEEF0; letter-spacing: -0.3px; }

.close-btn {
  width: 32px; height: 32px; border-radius: 9px;
  border: 0.8px solid #2C2C2E; background: #28282C; color: #8E8E93;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: color 150ms; padding: 0; box-sizing: border-box; flex-shrink: 0;
}
.close-btn:hover { color: #EEEEF0; }
.close-icon { width: 15px; height: 15px; }

.field { display: flex; flex-direction: column; gap: 7px; }
.field-label {
  font-size: 11px; font-weight: 600; color: #8E8E93;
  letter-spacing: 0.5px; text-transform: uppercase;
}
.field-input {
  background: #28282C; border: 0.8px solid #2C2C2E; border-radius: 11px;
  padding: 11px 13px; font-size: 14px; color: #EEEEF0; font-family: inherit;
  outline: none; transition: border-color 150ms; box-sizing: border-box; width: 100%;
}
.field-input::placeholder { color: #48484A; }
.field-input:focus { border-color: rgba(201,168,76,.5); }

.error-msg {
  font-size: 13px; color: #FF453A; margin: 0;
  padding: 10px 14px; background: rgba(255,69,58,.08);
  border-radius: 10px; border: 0.8px solid rgba(255,69,58,.2);
}

.submit-btn {
  width: 100%; padding: 14px; border-radius: 13px; border: none;
  background: #C9A84C; color: #111114; font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: opacity 150ms; box-sizing: border-box;
}
.submit-btn:disabled             { opacity: 0.4; cursor: not-allowed; }
.submit-btn:not(:disabled):hover { opacity: 0.88; }

.fade-enter-active, .fade-leave-active { transition: opacity 180ms; }
.fade-enter-from,   .fade-leave-to     { opacity: 0; }
</style>
