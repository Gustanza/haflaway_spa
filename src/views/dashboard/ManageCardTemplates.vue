<template>
  <div class="page">

    <!-- Page header -->
    <div class="page-header">
      <div class="filter-tabs">
        <button
          v-for="f in filterOptions"
          :key="f.value"
          :class="['tab', filter === f.value && 'tab--active']"
          @click="filter = f.value"
        >{{ f.label }}</button>
      </div>
      <button class="upload-btn" @click="openCreate">
        <PlusIcon class="btn-icon" />
        Upload Template
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-center">
      <div class="spinner" />
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="state-center">
      <div class="empty-icon-wrap">
        <RectangleStackIcon class="empty-icon" />
      </div>
      <p class="empty-title">No templates yet</p>
      <p class="empty-sub">Upload your first card template using the button above.</p>
    </div>

    <!-- Grid -->
    <div v-else class="templates-grid">
      <div v-for="t in paginated" :key="t.id" class="card">
        <div class="card-img-wrap">
          <img :src="t.imageUrl" :alt="t.name" class="card-img" />

          <!-- Hover actions: trash + pencil top-left -->
          <div class="card-actions">
            <button class="action-btn action-btn--delete" @click="deleteTemplate(t)" title="Delete">
              <TrashIcon class="action-icon" />
            </button>
            <button class="action-btn action-btn--edit" @click="openEdit(t)" title="Edit">
              <PencilSquareIcon class="action-icon" />
            </button>
          </div>

          <!-- Star top-right -->
          <button
            :class="['star-btn', t.featured && 'star-btn--on']"
            @click="toggleFeatured(t)"
            title="Toggle featured"
          >
            <StarSolidIcon v-if="t.featured" class="star-icon" />
            <StarIcon v-else class="star-icon" />
          </button>

          <!-- Type badge bottom-left -->
          <span :class="['type-badge', `type-badge--${t.type}`]">{{ t.type }}</span>
        </div>

        <div class="card-footer">
          <span class="card-name">{{ t.name }}</span>
          <button
            :class="['active-pill', t.active && 'active-pill--on']"
            @click="toggleActive(t)"
          >{{ t.active ? 'Active' : 'Inactive' }}</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        class="pg-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        <ChevronLeftIcon class="pg-arrow" />
      </button>

      <template v-for="p in pageNumbers" :key="p">
        <span v-if="p === '…'" class="pg-ellipsis">…</span>
        <button
          v-else
          :class="['pg-btn', currentPage === p && 'pg-btn--active']"
          @click="currentPage = p"
        >{{ p }}</button>
      </template>

      <button
        class="pg-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        <ChevronRightIcon class="pg-arrow" />
      </button>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal" class="backdrop" @click.self="closeModal">
          <div class="modal">

            <div class="modal-header">
              <span class="modal-title">{{ editingTemplate ? 'Edit Template' : 'Upload Template' }}</span>
              <button class="close-btn" @click="closeModal">
                <XMarkIcon class="close-icon" />
              </button>
            </div>

            <!-- Drop zone -->
            <div
              :class="['dropzone', preview && 'dropzone--filled']"
              @click="fileInput.click()"
              @dragover.prevent
              @drop.prevent="onDrop"
            >
              <template v-if="preview">
                <img :src="preview" class="preview-img" />
                <div class="dz-replace-hint">Click to replace image</div>
              </template>
              <template v-else>
                <ArrowUpTrayIcon class="dz-icon" />
                <p class="dz-hint">Click or drag an image here</p>
                <p class="dz-sub">PNG, JPG, WEBP · max 5 MB</p>
              </template>
            </div>
            <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />

            <!-- Name -->
            <div class="field">
              <label class="field-label">Name</label>
              <input
                v-model="form.name"
                class="field-input"
                placeholder="e.g. Gold Floral Invite"
                maxlength="60"
              />
            </div>

            <!-- Type -->
            <div class="field">
              <label class="field-label">Type</label>
              <div class="type-row">
                <button
                  v-for="t in ['invitation', 'contribution']"
                  :key="t"
                  :class="['type-opt', form.type === t && 'type-opt--active']"
                  @click="form.type = t"
                >{{ t }}</button>
              </div>
            </div>

            <!-- Toggles -->
            <div class="toggles-row">
              <div class="toggle-item">
                <div class="toggle-text">
                  <span class="toggle-label">Featured</span>
                  <span class="toggle-sub">Pinned at the top for users</span>
                </div>
                <button
                  :class="['toggle', form.featured && 'toggle--on']"
                  @click="form.featured = !form.featured"
                />
              </div>
              <div class="toggle-item">
                <div class="toggle-text">
                  <span class="toggle-label">Active</span>
                  <span class="toggle-sub">Visible to event creators</span>
                </div>
                <button
                  :class="['toggle', form.active && 'toggle--on']"
                  @click="form.active = !form.active"
                />
              </div>
            </div>

            <!-- Error -->
            <p v-if="uploadError" class="error-msg">{{ uploadError }}</p>

            <!-- Progress -->
            <div v-if="uploading" class="progress-wrap">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: uploadProgress + '%' }" />
              </div>
              <span class="progress-pct">{{ uploadProgress }}%</span>
            </div>

            <button
              class="submit-btn"
              :disabled="uploading || (!editingTemplate && !form.file) || !form.name.trim()"
              @click="submit"
            >
              <span v-if="uploading">{{ editingTemplate ? 'Saving...' : 'Uploading...' }}</span>
              <span v-else>{{ editingTemplate ? 'Save Changes' : 'Upload Template' }}</span>
            </button>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { db, storage } from '../../firebase.js'
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import {
  collection, addDoc, getDocs, updateDoc,
  deleteDoc, doc, serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import {
  PlusIcon, TrashIcon, StarIcon, XMarkIcon,
  ArrowUpTrayIcon, RectangleStackIcon, PencilSquareIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'

const COL       = 'cardTemplates'
const PAGE_SIZE = 12

// ── State ──────────────────────────────────────────────────────────────────

const templates       = ref([])
const loading         = ref(true)
const filter          = ref('all')
const currentPage     = ref(1)
const showModal       = ref(false)
const editingTemplate = ref(null)

const fileInput      = ref(null)
const preview        = ref(null)
const uploading      = ref(false)
const uploadProgress = ref(0)
const uploadError    = ref('')

const filterOptions = [
  { label: 'All',          value: 'all' },
  { label: 'Invitation',   value: 'invitation' },
  { label: 'Contribution', value: 'contribution' },
]

const defaultForm = () => ({ file: null, name: '', type: 'invitation', featured: false, active: true })
const form = ref(defaultForm())

// ── Computed ───────────────────────────────────────────────────────────────

const filtered = computed(() =>
  filter.value === 'all'
    ? templates.value
    : templates.value.filter(t => t.type === filter.value)
)

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

watch(filter, () => { currentPage.value = 1 })

// ── Data ───────────────────────────────────────────────────────────────────

async function fetchTemplates() {
  loading.value = true
  try {
    const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
    templates.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } finally {
    loading.value = false
  }
}

// ── File handling ──────────────────────────────────────────────────────────

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) setFile(file)
  e.target.value = ''
}

function onDrop(e) {
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) setFile(file)
}

function setFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'File exceeds 5 MB limit.'
    return
  }
  uploadError.value = ''
  form.value.file = file
  preview.value = URL.createObjectURL(file)
}

// ── Storage upload helper ──────────────────────────────────────────────────

async function uploadFile(file) {
  const ext  = file.name.split('.').pop()
  const path = `cardTemplates/${Date.now()}.${ext}`
  const sRef = storageRef(storage, path)
  const task = uploadBytesResumable(sRef, file)

  await new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      snap => { uploadProgress.value = Math.round((snap.bytesTransferred / snap.totalBytes) * 100) },
      reject,
      resolve,
    )
  })

  const imageUrl = await getDownloadURL(sRef)
  return { path, imageUrl }
}

// ── Create ─────────────────────────────────────────────────────────────────

async function createTemplate() {
  uploading.value = true
  uploadProgress.value = 0
  uploadError.value = ''
  try {
    const { path, imageUrl } = await uploadFile(form.value.file)
    await addDoc(collection(db, COL), {
      name:        form.value.name.trim(),
      imageUrl,
      storagePath: path,
      type:        form.value.type,
      featured:    form.value.featured,
      active:      form.value.active,
      createdAt:   serverTimestamp(),
    })
    await fetchTemplates()
    uploading.value = false
    resetModal()
  } catch (e) {
    uploadError.value = 'Upload failed. Please try again.'
    uploading.value = false
    console.error(e)
  }
}

// ── Edit / save ────────────────────────────────────────────────────────────

async function saveTemplate() {
  const t = editingTemplate.value
  uploading.value = true
  uploadProgress.value = 0
  uploadError.value = ''
  try {
    let imageUrl    = t.imageUrl
    let storagePath = t.storagePath

    if (form.value.file) {
      const result = await uploadFile(form.value.file)
      imageUrl    = result.imageUrl
      storagePath = result.path
      if (t.storagePath) {
        try { await deleteObject(storageRef(storage, t.storagePath)) } catch (_) {}
      }
    }

    await updateDoc(doc(db, COL, t.id), {
      name:        form.value.name.trim(),
      type:        form.value.type,
      featured:    form.value.featured,
      active:      form.value.active,
      imageUrl,
      storagePath,
    })
    await fetchTemplates()
    uploading.value = false
    resetModal()
  } catch (e) {
    uploadError.value = 'Save failed. Please try again.'
    uploading.value = false
    console.error(e)
  }
}

function submit() {
  editingTemplate.value ? saveTemplate() : createTemplate()
}

// ── Inline toggles ─────────────────────────────────────────────────────────

async function toggleFeatured(t) {
  t.featured = !t.featured
  await updateDoc(doc(db, COL, t.id), { featured: t.featured })
}

async function toggleActive(t) {
  t.active = !t.active
  await updateDoc(doc(db, COL, t.id), { active: t.active })
}

// ── Delete ─────────────────────────────────────────────────────────────────

async function deleteTemplate(t) {
  if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return
  try {
    if (t.storagePath) await deleteObject(storageRef(storage, t.storagePath))
    await deleteDoc(doc(db, COL, t.id))
    templates.value = templates.value.filter(x => x.id !== t.id)
  } catch (e) {
    console.error(e)
  }
}

// ── Modal open/close ───────────────────────────────────────────────────────

function openCreate() {
  editingTemplate.value = null
  form.value = defaultForm()
  preview.value = null
  showModal.value = true
}

function openEdit(t) {
  editingTemplate.value = t
  form.value = { file: null, name: t.name, type: t.type, featured: t.featured, active: t.active }
  preview.value = t.imageUrl
  uploadError.value = ''
  showModal.value = true
}

function resetModal() {
  showModal.value       = false
  editingTemplate.value = null
  form.value            = defaultForm()
  preview.value         = null
  uploadError.value     = ''
  uploadProgress.value  = 0
}

function closeModal() {
  if (uploading.value) return
  resetModal()
}

onMounted(fetchTemplates)
</script>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────────────────── */
.page {
  padding: 28px 28px 48px;
  min-height: 100%;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #EEEEF0;
  box-sizing: border-box;
}

/* ── Page header ─────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 12px;
  padding: 4px;
}

.tab {
  padding: 7px 16px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms, color 150ms;
  font-family: inherit;
}
.tab:hover { color: #AEAEB2; }
.tab--active { background: #2A2210; color: #C9A84C; }

.upload-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 12px;
  border: 0.8px solid rgba(201, 168, 76, 0.35);
  background: #2A2210;
  color: #C9A84C;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
}
.upload-btn:hover { opacity: 0.8; }
.btn-icon { width: 16px; height: 16px; }

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
.empty-sub   { font-size: 13px; color: #8E8E93; margin: 0; text-align: center; max-width: 280px; }

/* ── Grid ────────────────────────────────────────────────────────────────── */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.card {
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 16px;
  overflow: hidden;
}

.card-img-wrap {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #28282C;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* hover action row — top-left */
.card-actions {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 150ms;
}
.card-img-wrap:hover .card-actions { opacity: 1; }

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(17, 17, 20, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #AEAEB2;
  transition: color 150ms;
}
.action-btn--delete:hover { color: #FF453A; }
.action-btn--edit:hover   { color: #C9A84C; }
.action-icon { width: 14px; height: 14px; }

/* star — top-right */
.star-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(17, 17, 20, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #48484A;
  transition: color 150ms;
}
.star-btn:hover { color: #C9A84C; }
.star-btn--on   { color: #C9A84C; }
.star-icon { width: 15px; height: 15px; }

/* type badge */
.type-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}
.type-badge--invitation   { background: #2A2210; color: #C9A84C; border: 0.6px solid rgba(201,168,76,0.3); }
.type-badge--contribution { background: #1C2A1C; color: #30D158; border: 0.6px solid rgba(48,209,88,0.3); }

/* card footer */
.card-footer {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-name {
  font-size: 13px;
  font-weight: 500;
  color: #EEEEF0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.active-pill {
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: 6px;
  border: 0.6px solid #2C2C2E;
  background: #28282C;
  color: #48484A;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 150ms;
}
.active-pill--on {
  background: #1C2A1C;
  border-color: rgba(48,209,88,0.3);
  color: #30D158;
}

/* ── Pagination ──────────────────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 36px;
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
.pg-btn:hover:not(:disabled):not(.pg-btn--active) {
  background: #28282C;
  color: #EEEEF0;
}
.pg-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.pg-btn--active {
  background: #2A2210;
  border-color: rgba(201, 168, 76, 0.4);
  color: #C9A84C;
  cursor: default;
}

.pg-arrow { width: 14px; height: 14px; }

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

/* ── Backdrop & Modal ────────────────────────────────────────────────────── */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
  box-sizing: border-box;
}

.modal {
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #EEEEF0;
  letter-spacing: -0.3px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 0.8px solid #2C2C2E;
  background: #28282C;
  color: #8E8E93;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 150ms;
  flex-shrink: 0;
  padding: 0;
  box-sizing: border-box;
}
.close-btn:hover { color: #EEEEF0; }
.close-icon { width: 15px; height: 15px; }

/* drop zone */
.dropzone {
  border: 1.5px dashed #2C2C2E;
  border-radius: 14px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: border-color 150ms;
  overflow: hidden;
  position: relative;
}
.dropzone:hover { border-color: #C9A84C; }
.dropzone--filled { border-style: solid; border-color: rgba(201,168,76,0.35); }

.preview-img {
  width: 100%;
  object-fit: contain;
  display: block;
  max-height: 240px;
}

.dz-replace-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: rgba(17, 17, 20, 0.72);
  font-size: 12px;
  font-weight: 500;
  color: #AEAEB2;
  text-align: center;
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 150ms;
}
.dropzone:hover .dz-replace-hint { opacity: 1; }

.dz-icon { width: 28px; height: 28px; color: #48484A; }
.dz-hint { font-size: 13px; font-weight: 500; color: #8E8E93; margin: 0; }
.dz-sub  { font-size: 11px; color: #48484A; margin: 0; }

/* fields */
.field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 12px; font-weight: 600; color: #8E8E93; letter-spacing: 0.5px; }

.field-input {
  background: #28282C;
  border: 0.8px solid #2C2C2E;
  border-radius: 12px;
  padding: 11px 14px;
  font-size: 14px;
  color: #EEEEF0;
  font-family: inherit;
  outline: none;
  transition: border-color 150ms;
  box-sizing: border-box;
  width: 100%;
}
.field-input::placeholder { color: #48484A; }
.field-input:focus { border-color: #C9A84C; }

/* type selector */
.type-row { display: flex; gap: 8px; }
.type-opt {
  flex: 1;
  padding: 10px;
  border-radius: 11px;
  border: 0.8px solid #2C2C2E;
  background: #28282C;
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
  text-transform: capitalize;
  cursor: pointer;
  font-family: inherit;
  transition: all 150ms;
  box-sizing: border-box;
}
.type-opt--active {
  background: #2A2210;
  border-color: rgba(201,168,76,0.4);
  color: #C9A84C;
}

/* toggles — no overflow:hidden to avoid clipping */
.toggles-row {
  display: flex;
  flex-direction: column;
  border: 0.8px solid #2C2C2E;
  border-radius: 14px;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 16px;
  box-sizing: border-box;
}
.toggle-item:first-child { border-radius: 14px 14px 0 0; }
.toggle-item:last-child  { border-radius: 0 0 14px 14px; }
.toggle-item + .toggle-item { border-top: 0.8px solid #2C2C2E; }

.toggle-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.toggle-label { font-size: 14px; font-weight: 500; color: #EEEEF0; }
.toggle-sub   { font-size: 12px; color: #8E8E93; }

.toggle {
  width: 42px;
  height: 26px;
  border-radius: 13px;
  border: none;
  background: #3A3A3C;
  cursor: pointer;
  position: relative;
  transition: background 200ms;
  flex-shrink: 0;
  padding: 0;
  box-sizing: border-box;
}
.toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 200ms;
}
.toggle--on { background: #C9A84C; }
.toggle--on::after { transform: translateX(16px); }

/* error, progress, submit */
.error-msg {
  font-size: 13px;
  color: #FF453A;
  margin: 0;
  padding: 10px 14px;
  background: rgba(255, 69, 58, 0.08);
  border-radius: 10px;
  border: 0.8px solid rgba(255, 69, 58, 0.2);
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.progress-track {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: #2C2C2E;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: #C9A84C;
  transition: width 150ms;
}
.progress-pct { font-size: 12px; color: #8E8E93; min-width: 32px; text-align: right; }

.submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 13px;
  border: none;
  background: #C9A84C;
  color: #111114;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
  box-sizing: border-box;
}
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.submit-btn:not(:disabled):hover { opacity: 0.88; }

/* ── Modal transition ────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 180ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
