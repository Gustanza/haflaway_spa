<template>
  <div class="gallery-page">
    <div class="orb orb--tr" />
    <div class="orb orb--bl" />

    <!-- Header -->
    <header class="gallery-header">
      <div class="brand">
        <span class="brand-dot" />
        <span class="brand-name">haflaway</span>
      </div>
      <div class="header-divider" />
      <div class="header-right">
        <h1 class="gallery-title">{{ title }}</h1>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="state-center">
      <div class="spinner" />
    </div>

    <!-- Empty -->
    <div v-else-if="templates.length === 0" class="state-center">
      <p class="empty-text">No templates available yet.</p>
    </div>

    <template v-else>
      <!-- Masonry / list -->
      <div class="masonry">
        <div
          v-for="t in paginated"
          :key="t.id"
          class="masonry-item"
          @click="openLightbox(t)"
        >
          <img :src="t.imageUrl" :alt="t.type" loading="lazy" draggable="false" />
          <div v-if="t.featured" class="featured-badge">
            <StarSolidIcon class="featured-star" />
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="pg-btn" :disabled="currentPage === 1" @click="goTo(currentPage - 1)">
          <ChevronLeftIcon class="pg-arrow" />
        </button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '…'" class="pg-ellipsis">…</span>
          <button
            v-else
            :class="['pg-btn', currentPage === p && 'pg-btn--active']"
            @click="goTo(p)"
          >{{ p }}</button>
        </template>
        <button class="pg-btn" :disabled="currentPage === totalPages" @click="goTo(currentPage + 1)">
          <ChevronRightIcon class="pg-arrow" />
        </button>
      </div>
    </template>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lb-fade">
        <div
          v-if="active"
          class="lightbox"
          @click="closeLightbox"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
        >
          <!-- Close -->
          <button class="lb-close" @click.stop="closeLightbox">
            <XMarkIcon class="lb-close-icon" />
          </button>

          <!-- Hint -->
          <p class="lb-hint">Scroll or pinch to zoom · Drag to pan · Double-click to reset</p>

          <!-- Image -->
          <img
            :src="active.imageUrl"
            class="lb-img"
            :style="{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, cursor: lbCursor }"
            draggable="false"
            @click.stop
            @wheel.prevent="onWheel"
            @mousedown.prevent.stop="onMouseDown"
            @dblclick.stop="onDblClick"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
          />

          <!-- Controls -->
          <div class="lb-controls" @click.stop>
            <button class="lb-ctrl-btn" :disabled="scale <= 1" @click="zoomOut">
              <MinusIcon class="lb-ctrl-icon" />
            </button>
            <span class="lb-scale">{{ Math.round(scale * 100) }}%</span>
            <button class="lb-ctrl-btn" :disabled="scale >= 5" @click="zoomIn">
              <PlusIcon class="lb-ctrl-icon" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '../firebase.js'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({ type: String })

const PAGE_SIZE = 20

// ── Gallery state ──────────────────────────────────────────────────────────
const templates   = ref([])
const loading     = ref(true)
const currentPage = ref(1)

const title = computed(() =>
  props.type === 'invitation' ? 'Invitation Templates' : 'Contribution Templates'
)

const totalPages = computed(() => Math.max(1, Math.ceil(templates.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return templates.value.slice(start, start + PAGE_SIZE)
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

function goTo(page) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function fetchTemplates() {
  loading.value = true
  try {
    const snap = await getDocs(
      query(collection(db, 'cardTemplates'), where('type', '==', props.type), where('active', '==', true))
    )
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    templates.value = docs.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
    })
  } finally {
    loading.value = false
  }
}

// ── Lightbox state ─────────────────────────────────────────────────────────
const active    = ref(null)
const scale     = ref(1)
const tx        = ref(0)
const ty        = ref(0)
const dragging  = ref(false)

let dragStartX     = 0
let dragStartY     = 0
let lastTouchDist  = 0
let lastTouchScale = 1

const lbCursor = computed(() => {
  if (dragging.value)  return 'grabbing'
  if (scale.value > 1) return 'grab'
  return 'zoom-in'
})

function openLightbox(t) {
  active.value = t
  resetView()
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKey)
}

function closeLightbox() {
  active.value             = null
  dragging.value           = false
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
}

function resetView() {
  scale.value = 1
  tx.value    = 0
  ty.value    = 0
}

function onKey(e) { if (e.key === 'Escape') closeLightbox() }

// ── Zoom ───────────────────────────────────────────────────────────────────
function clampScale(v) { return Math.min(5, Math.max(1, v)) }

function applyScale(v) {
  scale.value = clampScale(v)
  if (scale.value === 1) { tx.value = 0; ty.value = 0 }
}

function zoomIn()  { applyScale(scale.value + 0.5) }
function zoomOut() { applyScale(scale.value - 0.5) }

function onWheel(e) { applyScale(scale.value + (e.deltaY < 0 ? 0.15 : -0.15)) }

function onDblClick() {
  scale.value > 1 ? resetView() : applyScale(2.5)
}

// ── Mouse drag ─────────────────────────────────────────────────────────────
function onMouseDown(e) {
  if (scale.value <= 1) return
  dragging.value = true
  dragStartX     = e.clientX - tx.value
  dragStartY     = e.clientY - ty.value
}

function onMouseMove(e) {
  if (!dragging.value) return
  tx.value = e.clientX - dragStartX
  ty.value = e.clientY - dragStartY
}

function onMouseUp() { dragging.value = false }

// ── Touch ──────────────────────────────────────────────────────────────────
function onTouchStart(e) {
  if (e.touches.length === 2) {
    lastTouchDist  = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    )
    lastTouchScale = scale.value
    dragging.value = false
  } else if (e.touches.length === 1 && scale.value > 1) {
    dragging.value = true
    dragStartX     = e.touches[0].clientX - tx.value
    dragStartY     = e.touches[0].clientY - ty.value
  }
}

function onTouchMove(e) {
  if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    )
    applyScale(lastTouchScale * (dist / lastTouchDist))
  } else if (e.touches.length === 1 && dragging.value) {
    tx.value = e.touches[0].clientX - dragStartX
    ty.value = e.touches[0].clientY - dragStartY
  }
}

function onTouchEnd(e) {
  if (e.touches.length < 2) dragging.value = false
}

onMounted(fetchTemplates)
</script>

<style scoped>
/* ── Page ────────────────────────────────────────────────────────────────── */
.gallery-page {
  min-height: 100vh;
  background: #111114;
  font-family: 'Inter', -apple-system, sans-serif;
  padding-bottom: 64px;
  position: relative;
  overflow-x: hidden;
}

/* ── Orbs ────────────────────────────────────────────────────────────────── */
.orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(90px);
}
.orb--tr { width: 300px; height: 300px; top: -80px; right: -80px; background: rgba(201,168,76,0.09); }
.orb--bl { width: 240px; height: 240px; bottom: -60px; left: -60px; background: rgba(201,168,76,0.05); }

/* ── Header ──────────────────────────────────────────────────────────────── */
.gallery-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 16px;
  border-bottom: 0.8px solid #2C2C2E;
  margin-bottom: 16px;
}

.brand { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.brand-dot  { width: 8px; height: 8px; border-radius: 50%; background: #C9A84C; }
.brand-name { font-size: 14px; font-weight: 700; color: #EEEEF0; letter-spacing: -0.3px; }

.header-divider { width: 0.8px; height: 28px; background: #2C2C2E; flex-shrink: 0; }

.header-right { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.gallery-title {
  font-size: 16px; font-weight: 700; color: #EEEEF0;
  letter-spacing: -0.3px; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ── States ──────────────────────────────────────────────────────────────── */
.state-center {
  display: flex; align-items: center; justify-content: center;
  min-height: 40vh; position: relative; z-index: 1;
}
.spinner {
  width: 26px; height: 26px;
  border: 2px solid #2C2C2E; border-top-color: #C9A84C;
  border-radius: 50%; animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-text { font-size: 14px; color: #48484A; }

/* ── Masonry / list ──────────────────────────────────────────────────────── */
.masonry {
  display: flex; flex-direction: column; gap: 10px;
  padding: 0 12px; position: relative; z-index: 1;
}

.masonry-item {
  border-radius: 12px; overflow: hidden;
  position: relative; background: #1C1C1E;
  cursor: pointer; width: 100%;
}
.masonry-item img { width: 100%; height: auto; display: block; transition: filter 250ms; }
.masonry-item:hover img { filter: brightness(0.82); }

/* ── Featured badge ──────────────────────────────────────────────────────── */
.featured-badge {
  position: absolute; top: 7px; right: 7px;
  width: 24px; height: 24px; border-radius: 6px;
  background: rgba(17,17,20,0.72); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
}
.featured-star { width: 12px; height: 12px; color: #C9A84C; }

/* ── Pagination ──────────────────────────────────────────────────────────── */
.pagination {
  display: flex; align-items: center; justify-content: center;
  flex-wrap: wrap; gap: 4px; margin-top: 36px; padding: 0 16px;
  position: relative; z-index: 1;
}

.pg-btn {
  min-width: 40px; height: 40px; padding: 0 12px; border-radius: 10px;
  border: 0.8px solid #2C2C2E; background: #1C1C1E; color: #AEAEB2;
  font-size: 14px; font-weight: 500; font-family: inherit; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 150ms, color 150ms; box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}
.pg-btn:hover:not(:disabled):not(.pg-btn--active) { background: #28282C; color: #EEEEF0; }
.pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pg-btn--active  { background: #2A2210; border-color: rgba(201,168,76,0.4); color: #C9A84C; cursor: default; }
.pg-arrow        { width: 15px; height: 15px; }

.pg-ellipsis {
  min-width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  color: #48484A; font-size: 14px; user-select: none;
}

/* ── Lightbox ────────────────────────────────────────────────────────────── */
.lightbox {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0, 0, 0, 0.93);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(12px);
}

.lb-close {
  position: absolute; top: 16px; right: 16px;
  width: 38px; height: 38px; border-radius: 11px;
  border: 0.8px solid rgba(255,255,255,0.12);
  background: rgba(28,28,30,0.85); backdrop-filter: blur(8px);
  color: #AEAEB2; display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 1; transition: color 150ms;
  -webkit-tap-highlight-color: transparent;
}
.lb-close:hover { color: #EEEEF0; }
.lb-close-icon  { width: 16px; height: 16px; }

.lb-hint {
  position: absolute; bottom: 72px; left: 50%; transform: translateX(-50%);
  font-size: 11px; color: rgba(174,174,178,0.5); white-space: nowrap;
  pointer-events: none; font-family: 'Inter', -apple-system, sans-serif;
  letter-spacing: 0.2px;
}

.lb-img {
  max-width: 92vw; max-height: 88vh;
  object-fit: contain; display: block;
  transform-origin: center center;
  user-select: none; -webkit-user-drag: none;
  will-change: transform;
}

.lb-controls {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 0;
  background: rgba(28,28,30,0.88); backdrop-filter: blur(12px);
  border: 0.8px solid rgba(255,255,255,0.1);
  border-radius: 40px; padding: 5px;
}

.lb-ctrl-btn {
  width: 36px; height: 36px; border-radius: 50%;
  border: none; background: transparent; color: #AEAEB2;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 150ms, color 150ms;
  -webkit-tap-highlight-color: transparent;
}
.lb-ctrl-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #EEEEF0; }
.lb-ctrl-btn:disabled { opacity: 0.3; cursor: default; }
.lb-ctrl-icon { width: 16px; height: 16px; }

.lb-scale {
  min-width: 52px; text-align: center;
  font-size: 13px; font-weight: 600; color: #EEEEF0;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* ── Lightbox transition ─────────────────────────────────────────────────── */
.lb-fade-enter-active, .lb-fade-leave-active { transition: opacity 180ms; }
.lb-fade-enter-from,   .lb-fade-leave-to     { opacity: 0; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (min-width: 520px) {
  .gallery-header { padding: 24px; }
  .gallery-title  { font-size: 18px; }
  .lb-hint        { display: block; }
}

@media (min-width: 768px) {
  .masonry { display: block; columns: 3; column-gap: 10px; padding: 0 24px; }
  .masonry-item { break-inside: avoid; margin-bottom: 10px; }
  .gallery-header { padding: 28px; }
  .gallery-title  { font-size: 20px; }
}

@media (min-width: 1024px) {
  .masonry { columns: 4; column-gap: 12px; padding: 0 32px; }
  .masonry-item { margin-bottom: 12px; }
}

@media (min-width: 1280px) {
  .masonry { columns: 5; }
}

@media (max-width: 519px) {
  .lb-hint { display: none; }
}
</style>
