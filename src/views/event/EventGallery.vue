<template>
  <div class="eg-root">

    <div class="eg-sticky-head">
      <div class="eg-panel-hd">
        <button type="button" class="eg-hd-burger" title="Menu" @click="navDrawer.open()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="eg-hd-sep" />
        <div class="eg-hd-badge" @click="$router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="eg-hd-brand-logo" />
          <span v-else class="eg-hd-brand-script">.joy</span>
        </div>
        <div class="eg-hd-sep" />
        <div class="eg-hd-title-group">
          <h1 class="eg-hub-title">Gallery</h1>
          <span class="eg-hub-count">{{ folders.length }}</span>
        </div>

        <div class="eg-search-wrap">
          <svg class="eg-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQ" class="eg-search" placeholder="Filter albums" />
          <button v-if="searchQ" type="button" class="eg-search-clear" @click="searchQ = ''" aria-label="Clear">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <button type="button" class="eg-add-btn" @click="openCreateFolder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Album
        </button>
        <button type="button" class="eg-hd-gear" title="Settings" @click="$router.push(`/event/${eventId}/settings`)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="eg-split">
      <div class="eg-editor">
        <p class="eg-crumb">Website / Gallery</p>

        <div v-if="loading && !folders.length" class="eg-empty">
          <p class="eg-empty-kicker">Albums</p>
          <h2 class="eg-empty-title">Loading…</h2>
        </div>

        <div v-else-if="!filteredFolders.length" class="eg-empty">
          <p class="eg-empty-kicker">The album</p>
          <h2 class="eg-empty-title">{{ searchQ ? 'Nothing matches' : 'Still unwritten' }}</h2>
          <p class="eg-empty-lede">{{ searchQ ? 'Try another search.' : 'Send-off, pre-wedding, the dance floor — make an album and drop photos on the right.' }}</p>
          <button v-if="!searchQ" type="button" class="eg-empty-row" @click="openCreateFolder">
            <span class="eg-empty-plus">+</span>
            <span class="eg-empty-row-copy">
              <span class="eg-empty-row-title">New album</span>
              <span class="eg-empty-row-sub">It opens as a contact sheet on the right</span>
            </span>
          </button>
        </div>

        <div v-else class="eg-list">
          <div
            v-for="folder in filteredFolders" :key="folder.id"
            class="eg-item"
            :class="{ 'eg-item--on': selectedFolder?.id === folder.id }"
            @click="openFolder(folder)"
          >
            <div class="eg-item-mosaic">
              <template v-if="folder.thumbnails?.length">
                <img
                  v-for="(th, i) in folder.thumbnails.slice(0, 4)"
                  :key="i"
                  :src="th.url"
                  alt=""
                  class="eg-item-mosaic-cell"
                  :class="{ 'eg-item-mosaic-cell--hero': i === 0 && folder.thumbnails.length > 1 }"
                />
              </template>
              <div v-else class="eg-item-mosaic-blank">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            </div>
            <div class="eg-item-copy">
              <span class="eg-item-title">{{ folder.name }}</span>
              <span class="eg-item-sub">{{ folder.mediaCount ?? 0 }} {{ (folder.mediaCount ?? 0) === 1 ? 'frame' : 'frames' }} · {{ formatDate(folder.createdAt) }}</span>
            </div>
            <div class="eg-item-acts" @click.stop>
              <template v-if="confirmDeleteFolderId === folder.id">
                <span class="eg-del-lbl">Delete?</span>
                <button type="button" class="eg-chip-btn eg-chip-btn--danger" @click="deleteFolder(folder)">
                  {{ deletingFolderId === folder.id ? '…' : 'Yes' }}
                </button>
                <button type="button" class="eg-chip-btn" @click="confirmDeleteFolderId = null">No</button>
              </template>
              <button v-else type="button" class="eg-chip-btn" @click="confirmDeleteFolderId = folder.id">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <aside class="eg-preview">
        <div class="eg-preview-bar">
          <div class="eg-preview-title-wrap">
            <span class="eg-preview-kicker">Contact sheet</span>
            <h2 v-if="selectedFolder" class="eg-preview-name">{{ selectedFolder.name }}</h2>
          </div>
          <div v-if="selectedFolder" class="eg-preview-acts">
            <span class="eg-preview-count">{{ folderMedia.length }}</span>
            <button type="button" class="eg-ghost" :disabled="uploading" @click="triggerImageUpload">Photos</button>
            <button type="button" class="eg-ghost" :disabled="uploading" @click="triggerVideoUpload">Video</button>
          </div>
        </div>

        <div
          class="eg-preview-stage"
          :class="{ 'eg-preview-stage--drop': dragOver }"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragEnter"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop"
        >
          <div v-if="!selectedFolder" class="eg-paper">
            <p class="eg-paper-kicker">Memories</p>
            <h2 class="eg-paper-title">Pick an album</h2>
            <p class="eg-paper-lede">The frames live here — a contact sheet, not a dashboard.</p>
          </div>

          <div v-else-if="loadingMedia" class="eg-paper">
            <p class="eg-paper-kicker">{{ selectedFolder.name }}</p>
            <h2 class="eg-paper-title">Loading…</h2>
          </div>

          <div v-else-if="!folderMedia.length && !uploading" class="eg-paper">
            <p class="eg-paper-kicker">{{ selectedFolder.name }}</p>
            <h2 class="eg-paper-title">Drop them in</h2>
            <p class="eg-paper-lede">Drag photos onto this page, or add them from the bar. Guests will see this album on the website.</p>
            <button type="button" class="eg-empty-row" @click="triggerImageUpload">
              <span class="eg-empty-plus">+</span>
              <span class="eg-empty-row-copy">
                <span class="eg-empty-row-title">Add photos</span>
                <span class="eg-empty-row-sub">Images from this computer</span>
              </span>
            </button>
          </div>

          <div v-else class="eg-wall">
            <div v-if="uploading" class="eg-upload">
              <div class="eg-upload-row">
                <span>Placing frames… {{ uploadIndex }} / {{ uploadTotal }}</span>
                <button type="button" class="eg-upload-x" @click="cancelUpload">Cancel</button>
              </div>
              <div class="eg-upload-track">
                <div class="eg-upload-fill" :style="{ width: uploadTotal > 0 ? `${((uploadIndex - 1 + uploadProgress) / uploadTotal) * 100}%` : '0%' }"/>
              </div>
            </div>

            <button
              v-for="(item, idx) in folderMedia" :key="item.id"
              type="button"
              class="eg-wall-tile"
              :class="{ 'eg-wall-tile--hero': idx === 0 && folderMedia.length > 2 }"
              @click="confirmDeleteMediaId === item.id ? null : openLightbox(item)"
            >
              <img v-if="item.type === 'image'" :src="item.url" class="eg-wall-img" loading="lazy" draggable="false" alt="" />
              <div v-else class="eg-wall-video">
                <span class="eg-wall-play">▶</span>
                <span class="eg-wall-vid-lbl">Video</span>
              </div>
              <div class="eg-wall-acts" @click.stop>
                <template v-if="confirmDeleteMediaId === item.id">
                  <span>Delete?</span>
                  <button type="button" class="eg-chip-btn eg-chip-btn--danger" @click="deleteMedia(item)">
                    {{ deletingMediaId === item.id ? '…' : 'Yes' }}
                  </button>
                  <button type="button" class="eg-chip-btn" @click="confirmDeleteMediaId = null">No</button>
                </template>
                <button v-else type="button" class="eg-chip-btn" @click="confirmDeleteMediaId = item.id">Delete</button>
              </div>
            </button>
          </div>
        </div>
      </aside>
    </div>

    <Teleport to="body">
      <div
        v-if="showCreateFolder"
        class="eg-joy-overlay"
        @pointerdown.self="showCreateFolder = false"
      >
        <div class="eg-dialog" role="dialog" aria-modal="true" aria-labelledby="eg-dialog-title" @pointerdown.stop>
          <div class="eg-dialog-hd">
            <h3 id="eg-dialog-title" class="eg-dialog-title">New album</h3>
            <button type="button" class="eg-dialog-x" aria-label="Close" @click="showCreateFolder = false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="eg-dialog-body">
            <p class="eg-dialog-sub">A name guests will recognise — ceremony, dinner, the last dance.</p>
            <label class="eg-field-label">Album name</label>
            <input
              ref="folderNameInputRef"
              v-model="newFolderName"
              class="eg-input"
              placeholder="e.g. Send-off"
              @keydown.enter="createFolder"
              @keydown.esc="showCreateFolder = false"
            />
          </div>
          <div class="eg-dialog-foot">
            <button type="button" class="eg-dialog-cancel" @click="showCreateFolder = false">Cancel</button>
            <button
              type="button"
              class="eg-dialog-save"
              :disabled="creatingFolder || !newFolderName.trim()"
              @click="createFolder"
            >
              {{ creatingFolder ? 'Creating…' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="lightboxItem" class="eg-lightbox" @click.self="lightboxItem = null">
        <button type="button" class="eg-lightbox-close" @click="lightboxItem = null" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button v-if="lightboxIndex > 0" type="button" class="eg-lightbox-nav eg-lightbox-nav--prev" @click.stop="lightboxStep(-1)" aria-label="Previous">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button v-if="lightboxIndex < folderMedia.length - 1" type="button" class="eg-lightbox-nav eg-lightbox-nav--next" @click.stop="lightboxStep(1)" aria-label="Next">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <img v-if="lightboxItem.type === 'image'" :src="lightboxItem.url" class="eg-lightbox-img" @click.stop alt="" />
        <video v-else :src="lightboxItem.url" class="eg-lightbox-video" controls autoplay @click.stop />
      </div>
    </Teleport>

    <input ref="imageInputRef" type="file" accept="image/*" multiple style="display:none" @change="handleImageFiles" />
    <input ref="videoInputRef" type="file" accept="video/*" style="display:none" @change="handleVideoFile" />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { db, storage, auth } from '../../firebase'
import {
  collection, getDocs, addDoc, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore'
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage'
import { useOrg } from '../../composables/useOrg.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'

const props   = defineProps({ event: Object, eventId: String })
const route   = useRoute()
const eventId = computed(() => props.eventId ?? route.params.eventId)
const { brandName, brandLogoUrl } = useOrg()
const navDrawer = useNavDrawer()

const folders             = ref([])
const loading             = ref(false)
const searchQ             = ref('')
const confirmDeleteFolderId = ref(null)
const deletingFolderId    = ref(null)
const totalMediaCount     = ref(0)

const selectedFolder      = ref(null)
const folderMedia         = ref([])
const loadingMedia        = ref(false)
const confirmDeleteMediaId = ref(null)
const deletingMediaId     = ref(null)

const showCreateFolder    = ref(false)
const newFolderName       = ref('')
const creatingFolder      = ref(false)
const folderNameInputRef  = ref(null)

const uploading           = ref(false)
const uploadProgress      = ref(0)
const uploadIndex         = ref(0)
const uploadTotal         = ref(0)
let   uploadCancelled     = false
let   currentUploadTask   = null

const imageInputRef       = ref(null)
const videoInputRef       = ref(null)
const lightboxItem        = ref(null)
const dragOver            = ref(false)
let   dragDepth           = 0

const filteredFolders = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return folders.value
  return folders.value.filter(f => f.name.toLowerCase().includes(q))
})

const lightboxIndex = computed(() => {
  if (!lightboxItem.value) return -1
  return folderMedia.value.findIndex(m => m.id === lightboxItem.value.id)
})

async function loadFolders() {
  if (!eventId.value) return
  loading.value = true
  try {
    const snap = await getDocs(
      query(collection(db, 'events', eventId.value, 'galleryFolders'), orderBy('createdAt'))
    )
    const rawFolders = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    const extras = await Promise.all(
      rawFolders.map(async f => {
        const mediaSnap = await getDocs(
          query(
            collection(db, 'events', eventId.value, 'galleryFolders', f.id, 'media'),
            orderBy('uploadedAt', 'desc')
          )
        )
        const thumbnails = mediaSnap.docs
          .slice(0, 4)
          .map(d => ({ url: d.data().url, type: d.data().type }))
        return { mediaCount: mediaSnap.size, thumbnails }
      })
    )

    folders.value = rawFolders.map((f, i) => ({ ...f, ...extras[i] }))
    totalMediaCount.value = extras.reduce((acc, e) => acc + e.mediaCount, 0)
  } catch (e) {
    console.error('Failed to load gallery folders', e)
  } finally {
    loading.value = false
  }
}

async function loadFolderMedia(folder) {
  loadingMedia.value = true
  folderMedia.value  = []
  try {
    const snap = await getDocs(
      query(
        collection(db, 'events', eventId.value, 'galleryFolders', folder.id, 'media'),
        orderBy('uploadedAt', 'desc')
      )
    )
    folderMedia.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Failed to load folder media', e)
  } finally {
    loadingMedia.value = false
  }
}

function openFolder(folder) {
  if (selectedFolder.value?.id === folder.id) return
  selectedFolder.value        = folder
  confirmDeleteFolderId.value = null
  confirmDeleteMediaId.value  = null
  lightboxItem.value          = null
  loadFolderMedia(folder)
}

watch(filteredFolders, (list) => {
  if (!list.length) {
    selectedFolder.value = null
    folderMedia.value = []
    return
  }
  if (!selectedFolder.value || !list.some(f => f.id === selectedFolder.value.id)) {
    openFolder(list[0])
  }
})

function openCreateFolder() {
  newFolderName.value    = ''
  showCreateFolder.value = true
  nextTick(() => folderNameInputRef.value?.focus())
}

async function createFolder() {
  const name = newFolderName.value.trim()
  if (!name || creatingFolder.value) return
  creatingFolder.value = true
  try {
    const docRef = await addDoc(
      collection(db, 'events', eventId.value, 'galleryFolders'),
      { name, createdAt: new Date().toISOString(), createdBy: auth.currentUser?.uid ?? '' }
    )
    const created = { id: docRef.id, name, createdAt: new Date().toISOString(), mediaCount: 0, thumbnails: [] }
    folders.value.push(created)
    showCreateFolder.value = false
    newFolderName.value    = ''
    openFolder(created)
  } catch (e) {
    console.error('Failed to create folder', e)
  } finally {
    creatingFolder.value = false
  }
}

async function deleteFolder(folder) {
  if (deletingFolderId.value) return
  deletingFolderId.value = folder.id
  try {
    const mediaSnap = await getDocs(
      collection(db, 'events', eventId.value, 'galleryFolders', folder.id, 'media')
    )
    await Promise.allSettled(
      mediaSnap.docs.map(async d => {
        const sp = d.data().storagePath
        if (sp) {
          try { await deleteObject(storageRef(storage, sp)) } catch (_) {}
        }
        await deleteDoc(d.ref)
      })
    )
    await deleteDoc(doc(db, 'events', eventId.value, 'galleryFolders', folder.id))
    folders.value = folders.value.filter(f => f.id !== folder.id)
    confirmDeleteFolderId.value = null
    totalMediaCount.value = Math.max(0, totalMediaCount.value - mediaSnap.size)
    if (selectedFolder.value?.id === folder.id) {
      selectedFolder.value = null
      folderMedia.value = []
    }
  } catch (e) {
    console.error('Failed to delete folder', e)
  } finally {
    deletingFolderId.value = null
  }
}

function triggerImageUpload() {
  imageInputRef.value?.click()
}

function triggerVideoUpload() {
  videoInputRef.value?.click()
}

function handleImageFiles(e) {
  const files = Array.from(e.target.files ?? [])
  e.target.value = ''
  if (!files.length) return
  uploadFiles(files, 'image')
}

function handleVideoFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  uploadFiles([file], 'video')
}

function onDragEnter() {
  if (!selectedFolder.value) return
  dragDepth++
  dragOver.value = true
}
function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragOver.value = false
}
function onDrop(e) {
  dragDepth = 0
  dragOver.value = false
  if (!selectedFolder.value) return
  const files = Array.from(e.dataTransfer?.files ?? [])
  const images = files.filter(f => f.type.startsWith('image/'))
  const videos = files.filter(f => f.type.startsWith('video/'))
  if (images.length) uploadFiles(images, 'image')
  else if (videos.length) uploadFiles(videos.slice(0, 1), 'video')
}

function cancelUpload() {
  uploadCancelled = true
  currentUploadTask?.cancel()
}

async function uploadFiles(files, type) {
  if (!selectedFolder.value) return
  uploading.value       = true
  uploadTotal.value     = files.length
  uploadIndex.value     = 0
  uploadProgress.value  = 0
  uploadCancelled       = false

  try {
    for (let i = 0; i < files.length; i++) {
      if (uploadCancelled) break
      const file = files[i]
      uploadIndex.value    = i + 1
      uploadProgress.value = 0

      const path  = `gallery/${eventId.value}/${selectedFolder.value.id}/${Date.now()}_${file.name}`
      const sRef  = storageRef(storage, path)
      const task  = uploadBytesResumable(sRef, file)
      currentUploadTask = task

      await new Promise((resolve, reject) => {
        task.on(
          'state_changed',
          snap => { uploadProgress.value = snap.bytesTransferred / snap.totalBytes },
          err  => { if (err.code !== 'storage/canceled') { reject(err) } else { resolve() } },
          resolve,
        )
      })

      if (uploadCancelled) break

      const url = await getDownloadURL(sRef)
      const mediaRef = collection(
        db, 'events', eventId.value, 'galleryFolders', selectedFolder.value.id, 'media'
      )
      const now    = new Date().toISOString()
      const docRef = await addDoc(mediaRef, {
        url, storagePath: path, type,
        uploadedAt: now,
        uploadedBy: auth.currentUser?.uid ?? '',
      })
      folderMedia.value.unshift({ id: docRef.id, url, storagePath: path, type, uploadedAt: now })
      totalMediaCount.value++
      const folder = folders.value.find(f => f.id === selectedFolder.value.id)
      if (folder) {
        folder.mediaCount = (folder.mediaCount ?? 0) + 1
        folder.thumbnails = [{ url, type }, ...(folder.thumbnails ?? [])].slice(0, 4)
      }
    }
  } catch (e) {
    if (!uploadCancelled) console.error('Upload failed', e)
  } finally {
    uploading.value       = false
    uploadProgress.value  = 0
    uploadIndex.value     = 0
    uploadTotal.value     = 0
    currentUploadTask     = null
    uploadCancelled       = false
  }
}

async function deleteMedia(item) {
  if (deletingMediaId.value) return
  deletingMediaId.value = item.id
  try {
    if (item.storagePath) {
      try { await deleteObject(storageRef(storage, item.storagePath)) } catch (_) {}
    }
    await deleteDoc(
      doc(db, 'events', eventId.value, 'galleryFolders', selectedFolder.value.id, 'media', item.id)
    )
    folderMedia.value = folderMedia.value.filter(m => m.id !== item.id)
    confirmDeleteMediaId.value = null
    totalMediaCount.value = Math.max(0, totalMediaCount.value - 1)
    const folder = folders.value.find(f => f.id === selectedFolder.value?.id)
    if (folder) {
      folder.mediaCount = Math.max(0, (folder.mediaCount ?? 1) - 1)
      folder.thumbnails = folderMedia.value.slice(0, 4).map(m => ({ url: m.url, type: m.type }))
    }
    if (lightboxItem.value?.id === item.id) lightboxItem.value = folderMedia.value[0] ?? null
  } catch (e) {
    console.error('Failed to delete media', e)
  } finally {
    deletingMediaId.value = null
  }
}

function openLightbox(item) {
  lightboxItem.value = item
}

function lightboxStep(dir) {
  const i = lightboxIndex.value + dir
  if (i < 0 || i >= folderMedia.value.length) return
  lightboxItem.value = folderMedia.value[i]
}

function onKey(e) {
  if (e.key === 'Escape') {
    if (lightboxItem.value) lightboxItem.value = null
    else if (showCreateFolder.value) showCreateFolder.value = false
    return
  }
  if (!lightboxItem.value) return
  if (e.key === 'ArrowLeft') lightboxStep(-1)
  if (e.key === 'ArrowRight') lightboxStep(1)
}

function formatDate(val) {
  if (!val) return '—'
  try {
    const d = val.toDate ? val.toDate() : new Date(val)
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

onMounted(() => {
  loadFolders()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.eg-root {
  min-height: 100vh;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #1f2937;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
}
.eg-sticky-head { position: sticky; top: 0; z-index: 20; background: #fff; }
.eg-panel-hd {
  display: flex; align-items: center; height: 92px; padding: 0 36px; gap: 14px;
  border-bottom: 1px solid #f1f3f5;
}
.eg-hd-burger {
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff;
  color: #4b5563; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.eg-hd-burger:hover { background: #f8fafc; color: #18181b; border-color: #d1d5db; }
.eg-hd-sep { width: 1px; height: 16px; background: #e5e7eb; flex-shrink: 0; margin: 0 4px; }
.eg-hd-badge {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e7eb;
  overflow: hidden; background: #fff; flex-shrink: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.eg-hd-brand-logo { width: 100%; height: 100%; object-fit: cover; }
.eg-hd-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-size: 18px; font-weight: 700;
  color: #111827; letter-spacing: -0.04em; line-height: 1;
}
.eg-hd-title-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.eg-hub-title { margin: 0; font-size: 22px; font-weight: 600; color: #18181b; letter-spacing: -0.015em; white-space: nowrap; }
.eg-hub-count {
  font-size: 12.5px; font-weight: 600; color: #4b5563;
  background: #f1f3f5; border-radius: 9999px; padding: 2px 10px;
}
.eg-search-wrap {
  position: relative; display: flex; align-items: center;
  flex: 1 1 0; margin: 0 20px; min-width: 220px;
}
.eg-search-icon { position: absolute; left: 16px; color: #9ca3af; pointer-events: none; }
.eg-search {
  width: 100%; height: 44px; padding: 0 44px 0 44px;
  background: #f3f4f6; border: none; border-radius: 9999px;
  font-size: 15px; color: #111827; outline: none; font-family: inherit;
}
.eg-search:focus { background: #eeeeef; }
.eg-search::placeholder { color: #9ca3af; }
.eg-search-clear {
  position: absolute; right: 10px; width: 32px; height: 32px;
  border: none; background: none; color: #9ca3af; cursor: pointer;
  display: flex; align-items: center; justify-content: center; border-radius: 50%;
}
.eg-add-btn {
  display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
  height: 40px; padding: 0 20px; border: 1px solid #e5e7eb; border-radius: 9999px;
  background: #fff; color: #111827; font-family: inherit;
  font-size: 13.5px; font-weight: 600; cursor: pointer;
}
.eg-add-btn:hover { background: #f8fafc; border-color: #d1d5db; }
.eg-hd-gear {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.eg-hd-gear:hover { background: #f8fafc; color: #0f172a; }

.eg-split {
  flex: 1; display: flex; align-items: stretch; min-height: 0; background: #f7f7f8;
}
.eg-editor {
  flex: 0 0 38%;
  width: 38%;
  min-width: 280px;
  background: #fff;
  border-right: 1px solid #f0f0f2;
  overflow-y: auto;
  padding: 22px 28px 48px;
}
.eg-crumb { margin: 0 0 18px; font-size: 12.5px; font-weight: 500; color: #94a3b8; }
.eg-empty { padding: 8px 2px 0; }
.eg-empty-kicker {
  margin: 0 0 6px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase; color: #94a3b8;
}
.eg-empty-title {
  margin: 0 0 10px;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400; font-style: italic; font-size: 28px; color: #1a1a1a;
}
.eg-empty-lede { margin: 0 0 22px; max-width: 42ch; font-size: 14px; color: #64748b; line-height: 1.55; }
.eg-empty-row {
  width: min(420px, 100%); display: flex; align-items: center; gap: 14px;
  padding: 16px 14px; border: 1px dashed #d1d5db; border-radius: 14px;
  background: #fafafa; cursor: pointer; text-align: left; font-family: inherit;
}
.eg-empty-row:hover { border-color: #c4c4c8; background: #fff; }
.eg-empty-plus {
  width: 36px; height: 36px; border-radius: 50%;
  background: #fff; color: #374151; border: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.eg-empty-row-copy { display: flex; flex-direction: column; gap: 2px; }
.eg-empty-row-title { font-size: 15px; font-weight: 600; color: #111827; }
.eg-empty-row-sub { font-size: 13px; color: #64748b; }

.eg-list { display: flex; flex-direction: column; }
.eg-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 4px 14px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
}
.eg-item:hover { background: #fafafa; }
.eg-item--on { background: #f7f7f8; }
.eg-item-mosaic {
  width: 64px; height: 64px; flex-shrink: 0;
  border-radius: 8px; overflow: hidden;
  display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 1px;
  background: #faf6ef; border: 1px solid #ececec;
}
.eg-item-mosaic-cell { width: 100%; height: 100%; object-fit: cover; display: block; }
.eg-item-mosaic-cell--hero { grid-row: span 2; }
.eg-item-mosaic:has(img:only-child) img { grid-column: 1 / -1; grid-row: 1 / -1; }
.eg-item-mosaic-blank {
  grid-column: 1 / -1; grid-row: 1 / -1;
  display: flex; align-items: center; justify-content: center; color: #c4b8a8;
}
.eg-item-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.eg-item-title { font-size: 15px; font-weight: 600; color: #111827; }
.eg-item-sub { font-size: 12.5px; color: #64748b; }
.eg-item-acts { opacity: 0; pointer-events: none; display: flex; gap: 6px; align-items: center; }
.eg-item:hover .eg-item-acts, .eg-item--on .eg-item-acts { opacity: 1; pointer-events: auto; }
.eg-del-lbl { font-size: 12px; font-weight: 600; color: #111827; }
.eg-chip-btn {
  height: 28px; padding: 0 10px; border-radius: 9999px;
  border: 1px solid #e5e7eb; background: #fff; color: #374151;
  font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
}
.eg-chip-btn:hover { background: #f8fafc; }
.eg-chip-btn--danger { color: #9f1239; border-color: #fecdd3; }

.eg-preview {
  flex: 1 1 62%; min-width: 0;
  display: flex; flex-direction: column; background: #f4f4f5;
}
.eg-preview-bar {
  min-height: 56px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 8px 18px; background: #fff; border-bottom: 1px solid #f0f0f2; flex-shrink: 0;
}
.eg-preview-title-wrap { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.eg-preview-kicker {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8;
}
.eg-preview-name {
  margin: 0; font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400; font-size: 20px; color: #1a1a1a; letter-spacing: -0.02em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.eg-preview-acts { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.eg-preview-count {
  font-size: 12.5px; font-weight: 600; color: #4b5563;
  background: #f1f3f5; border-radius: 9999px; padding: 2px 10px;
}
.eg-ghost {
  height: 34px; padding: 0 14px; border-radius: 9999px;
  border: 1px solid #e5e7eb; background: #fff; color: #374151;
  font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
}
.eg-ghost:hover:not(:disabled) { background: #f8fafc; }
.eg-ghost:disabled { opacity: 0.45; cursor: default; }

.eg-preview-stage {
  flex: 1; min-height: 0; overflow: auto;
  padding: 24px; position: relative;
}
.eg-preview-stage--drop::after {
  content: 'Drop photos here';
  position: absolute; inset: 16px;
  border: 1.5px dashed #c4c4c8; border-radius: 16px;
  background: rgba(255,255,255,0.72);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 600; color: #374151;
  pointer-events: none;
}
.eg-paper {
  max-width: 440px; margin: 40px auto 0;
  background: #FAF6EF; color: #241F18;
  border-radius: 4px; box-shadow: 0 18px 50px rgba(36, 31, 24, 0.08);
  padding: 40px 36px 48px;
}
.eg-paper-kicker {
  margin: 0 0 10px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase; color: #8a8178;
}
.eg-paper-title {
  margin: 0 0 12px;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400; font-size: 28px; color: #241F18; line-height: 1.2;
}
.eg-paper-lede { margin: 0 0 20px; font-size: 14px; color: #6b645c; line-height: 1.55; max-width: 34ch; }

.eg-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  grid-auto-rows: 120px;
  grid-auto-flow: dense;
  gap: 8px;
}
.eg-wall-tile {
  position: relative; padding: 0; border: none; border-radius: 4px;
  overflow: hidden; cursor: pointer; background: #e7e2d8;
}
.eg-wall-tile--hero { grid-column: span 2; grid-row: span 2; }
.eg-wall-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.eg-wall-video {
  width: 100%; height: 100%;
  background: #ece7dc;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  color: #6b645c;
}
.eg-wall-play { font-size: 18px; }
.eg-wall-vid-lbl { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.eg-wall-acts {
  position: absolute; top: 8px; right: 8px;
  display: flex; align-items: center; gap: 6px;
  opacity: 0; pointer-events: none;
}
.eg-wall-tile:hover .eg-wall-acts { opacity: 1; pointer-events: auto; }
.eg-upload {
  grid-column: 1 / -1;
  background: #fff; border: 1px solid #f0f0f2; border-radius: 12px; padding: 12px 14px;
}
.eg-upload-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #374151; margin-bottom: 8px; }
.eg-upload-x { border: none; background: none; font-size: 12.5px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; }
.eg-upload-track { height: 4px; border-radius: 9999px; background: #f1f3f5; overflow: hidden; }
.eg-upload-fill { height: 100%; background: #111827; width: 0; }

.eg-input {
  width: 100%; height: 44px; padding: 0 14px; box-sizing: border-box;
  border: 1px solid #e5e7eb; border-radius: 12px;
  font-size: 15px; font-family: inherit; color: #111827; outline: none;
}
.eg-input:focus { border-color: #d1d5db; }

@media (max-width: 980px) {
  .eg-split { flex-direction: column; }
  .eg-editor { width: 100%; flex-basis: auto; max-height: 38vh; border-right: none; border-bottom: 1px solid #f0f0f2; }
  .eg-preview { min-height: 54vh; }
  .eg-item-acts { opacity: 1; pointer-events: auto; }
  .eg-wall-tile--hero { grid-column: span 1; grid-row: span 1; }
}
@media (max-width: 900px) {
  .eg-panel-hd { height: auto; flex-wrap: wrap; padding: 12px 16px; gap: 10px; }
  .eg-search-wrap { flex: 1 1 100%; margin: 8px 0 0; order: 8; }
  .eg-hd-sep { display: none; }
  .eg-editor { padding: 16px; }
}
</style>

<style>
html .eg-joy-overlay {
  position: fixed; inset: 0; z-index: 1600;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.32) !important;
  backdrop-filter: none !important;
}
html .eg-dialog {
  width: min(440px, calc(100vw - 32px));
  background: #fff; color: #111827; border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
html .eg-dialog-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 10px 24px;
}
html .eg-dialog-title { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #111827; }
html .eg-dialog-x {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: #f8fafc; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
html .eg-dialog-body { padding: 4px 24px 12px; }
html .eg-dialog-sub { margin: 0 0 18px; font-size: 14px; color: #64748b; line-height: 1.5; }
html .eg-field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 8px; }
html .eg-dialog-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid #f0f0f2;
}
html .eg-dialog-cancel {
  height: 40px; padding: 0 16px; border: none; background: none;
  font-size: 14px; font-weight: 600; color: #111827; cursor: pointer; font-family: inherit;
}
html .eg-dialog-save {
  height: 40px; padding: 0 18px; border: 1px solid #e5e7eb; border-radius: 9999px;
  background: #fff; color: #111827; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
}
html .eg-dialog-save:disabled { opacity: 0.45; cursor: default; }
html .eg-lightbox {
  position: fixed; inset: 0; z-index: 1700;
  background: rgba(24, 24, 27, 0.92) !important;
  display: flex; align-items: center; justify-content: center;
  padding: 48px 72px;
}
html .eg-lightbox-close {
  position: absolute; top: 16px; right: 16px;
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.12); border: none; color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
html .eg-lightbox-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 40px; height: 40px; border-radius: 50%;
  border: none; background: rgba(255,255,255,0.12); color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
html .eg-lightbox-nav--prev { left: 16px; }
html .eg-lightbox-nav--next { right: 16px; }
html .eg-lightbox-img, html .eg-lightbox-video {
  max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px;
}
</style>
