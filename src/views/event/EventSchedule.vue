<template>
  <div class="sch-root">

    <!-- ── Loading skeleton ── -->
    <div v-if="!event" class="sch-skeleton">
      <div class="sch-sk-bar" />
      <div class="sch-sk-tile" v-for="n in 3" :key="n" />
    </div>

    <div v-else class="sch-page">

      <div class="sch-hub-hd">
        <div class="sch-hd-main">
          <button type="button" class="sch-hd-burger" title="Menu" @click="navDrawer.open()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="sch-hd-brand" @click="$router.push('/events')" title="All Events">
            <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="sch-hd-brand-logo" />
            <span v-else class="sch-hd-brand-script">.joy</span>
          </div>
          <div class="sch-hd-title-group">
            <h1 class="sch-hub-title">Schedule</h1>
            <span class="sch-hub-count">{{ schedule.length }}</span>
          </div>
        </div>
        <button type="button" class="sch-add-btn" @click="openScheduleModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </button>
      </div>

      <div class="sch-split">
        <div class="sch-editor">
          <p class="sch-crumb">Website / Pages / Schedule</p>

          <div class="sch-layout-card">
            <span class="sch-layout-ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.4" fill="currentColor" stroke="none"/></svg>
            </span>
            <div class="sch-layout-copy">
              <strong>Timeline</strong>
              <span>Events on a vertical timeline</span>
            </div>
          </div>

          <div class="sch-editor-tools">
            <span class="sch-select-ghost">Select…</span>
            <button type="button" class="sch-add-btn sch-add-btn--inline" @click="openScheduleModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add New
            </button>
          </div>

          <div v-if="!schedule.length" class="sch-editor-empty">
            <p class="sch-empty-kicker">The day</p>
            <h2 class="sch-empty-title">Still unwritten</h2>
            <p class="sch-empty-lede">Ceremony, dinner, last dance — add a moment and guests see it on the website as you save.</p>
            <button type="button" class="sch-empty-row" @click="openScheduleModal()">
              <span class="sch-empty-plus" aria-hidden="true">+</span>
              <span class="sch-empty-row-copy">
                <span class="sch-empty-row-title">Add a moment</span>
                <span class="sch-empty-row-sub">It lands in the preview on the right</span>
              </span>
            </button>
          </div>

          <div v-else class="sch-days">
            <section v-for="day in scheduleByDay" :key="day.key" class="sch-day">
              <h2 class="sch-day-lbl">{{ day.label }}</h2>
              <button
                v-for="item in day.items"
                :key="item.id"
                type="button"
                class="sch-item"
                @click="openScheduleModal(item)"
              >
                <div class="sch-item-copy">
                  <span class="sch-item-title">{{ item.title }}</span>
                  <span class="sch-item-time">{{ fmtRange(item) }}</span>
                  <span class="sch-item-chip">All Guests</span>
                </div>
                <svg class="sch-item-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </section>
          </div>
        </div>

        <aside class="sch-preview">
          <div class="sch-preview-bar">
            <div class="sch-devices">
              <button type="button" class="sch-device" :class="{ 'sch-device--on': previewDevice === 'desktop' }" title="Desktop" @click="previewDevice = 'desktop'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>
              </button>
              <button type="button" class="sch-device" :class="{ 'sch-device--on': previewDevice === 'tablet' }" title="Tablet" @click="previewDevice = 'tablet'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/></svg>
              </button>
              <button type="button" class="sch-device" :class="{ 'sch-device--on': previewDevice === 'phone' }" title="Phone" @click="previewDevice = 'phone'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="2" width="10" height="20" rx="2"/></svg>
              </button>
            </div>
            <span class="sch-preview-kicker">Event website</span>
          </div>

          <div class="sch-preview-stage">
            <div class="sch-site" :class="`sch-site--${previewDevice}`">
              <div v-if="heroUrl" class="sch-site-banner" :style="{ backgroundImage: `url(${heroUrl})` }" />
              <div class="sch-site-page">
                <h2 class="sch-site-heading">Schedule</h2>
                <p v-if="!schedule.length" class="sch-site-empty">Your programme will appear here for guests.</p>
                <section v-for="day in scheduleByDay" :key="'pv-'+day.key" class="sch-site-day">
                  <h3 class="sch-site-day-lbl">{{ day.heading }}</h3>
                  <div
                    v-for="(item, idx) in day.items"
                    :key="'pv-'+item.id"
                    class="sch-site-item"
                    :class="{ 'sch-site-item--last': idx === day.items.length - 1 }"
                  >
                    <div class="sch-site-rail" aria-hidden="true"><span /></div>
                    <div class="sch-site-body">
                      <p class="sch-site-when">{{ fmtRange(item) }}</p>
                      <h4 class="sch-site-title">{{ item.title }}</h4>
                      <p v-if="item.location" class="sch-site-loc">{{ item.location }}</p>
                      <p v-if="item.description" class="sch-site-desc">{{ item.description }}</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="scheduleModalOpen"
        class="sch-backdrop"
        @pointerdown.self="closeScheduleModal"
      >
        <div class="sch-dialog" role="dialog" aria-modal="true" aria-labelledby="sch-dialog-title" @pointerdown.stop>
          <div class="sch-dialog-hd">
            <h3 id="sch-dialog-title" class="sch-dialog-title">{{ editingSchedId ? 'Edit programme item' : 'Add programme item' }}</h3>
            <button type="button" class="sch-dialog-x" aria-label="Close" @click="closeScheduleModal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="sch-dialog-body">
            <p class="sch-dialog-sub">{{ editingSchedId ? "Update this item’s details." : "Add an activity to the day’s run of show." }}</p>
            <label class="sch-field-label">Activity</label>
            <input v-model="scheduleForm.title" class="sch-input" placeholder="e.g. Ceremony, Cocktail Hour" />
            <div class="sch-field-row">
              <div>
                <label class="sch-field-label">Starts</label>
                <input v-model="scheduleForm.time" type="datetime-local" class="sch-input sch-input--when" />
              </div>
              <div>
                <label class="sch-field-label">Ends <span class="sch-field-optional">optional</span></label>
                <input v-model="scheduleForm.endTime" type="datetime-local" class="sch-input sch-input--when" />
              </div>
            </div>
            <label class="sch-field-label">Location <span class="sch-field-optional">optional</span></label>
            <input v-model="scheduleForm.location" class="sch-input" placeholder="e.g. JC Hall, Mbezi Beach" />
            <label class="sch-field-label">Note <span class="sch-field-optional">optional</span></label>
            <textarea v-model="scheduleForm.description" class="sch-textarea" rows="3" placeholder="Any extra detail guests should know…"></textarea>
          </div>
          <div class="sch-dialog-foot">
            <button type="button" class="sch-dialog-cancel" @click="closeScheduleModal">Cancel</button>
            <button
              type="button"
              class="sch-dialog-save"
              :disabled="!scheduleForm.title.trim() || !scheduleForm.time || savingSched"
              @click="saveScheduleItem"
            >
              {{ savingSched ? (editingSchedId ? 'Saving…' : 'Adding…') : (editingSchedId ? 'Save' : 'Add item') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="sch-toast">
        <div v-if="toastVisible" class="sch-toast" :class="{ 'sch-toast--err': toastErr }">
          <svg v-if="!toastErr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ toastMsg }}
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../../firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { useOrg } from '../../composables/useOrg.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'

const props = defineProps({ event: Object, eventId: String })
const route  = useRoute()
const eventId = computed(() => props.eventId ?? route.params.eventId)
const { brandName, brandLogoUrl } = useOrg()
const navDrawer = useNavDrawer()

// ── Programme (event.schedule) ────────────────────────────────────────────────
const schedule = ref([])
const sortedSchedule = computed(() => [...schedule.value].sort((a, b) => new Date(a.time) - new Date(b.time)))
const previewDevice = ref('desktop')
const heroUrl = computed(() => props.event?.heroImageUrl || props.event?.coverUrl || props.event?.coverImage || props.event?.imageUrl || props.event?.eventThumbnail || null)

function dayKey(iso) {
  const d = iso ? new Date(iso) : null
  if (!d || isNaN(d)) return 'undated'
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const scheduleByDay = computed(() => {
  const groups = []
  const map = new Map()
  for (const item of sortedSchedule.value) {
    const key = dayKey(item.time)
    if (!map.has(key)) {
      const d = item.time ? new Date(item.time) : null
      const g = {
        key,
        label: d && !isNaN(d)
          ? d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
          : 'Date to be announced',
        heading: d && !isNaN(d)
          ? d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
          : 'DATE TO BE ANNOUNCED',
        items: [],
      }
      map.set(key, g)
      groups.push(g)
    }
    map.get(key).items.push(item)
  }
  return groups
})

watch(() => props.event, (ev) => {
  if (!ev) return
  schedule.value = Array.isArray(ev.schedule) ? [...ev.schedule] : []
}, { immediate: true })

function fmtClock(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch { return '' }
}

function fmtRange(item) {
  const start = fmtClock(item.time)
  const end = fmtClock(item.endTime)
  if (start && end) return `${start} to ${end}`
  return start
}

function eventBaseDate() {
  const d = props.event?.startDate
  const base = !d ? new Date() : (d.toDate ? d.toDate() : new Date(d))
  return new Date(base.getTime())
}

function toLocalInput(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const editingSchedId    = ref(null)
const scheduleForm      = ref({ title: '', time: '', endTime: '', location: '', description: '' })
const scheduleModalOpen = ref(false)
const savingSched       = ref(false)

function openScheduleModal(item = null) {
  if (item) {
    editingSchedId.value = item.id
    scheduleForm.value = {
      title: item.title ?? '',
      time: item.time ?? '',
      endTime: item.endTime ?? '',
      location: item.location ?? '',
      description: item.description ?? '',
    }
  } else {
    editingSchedId.value = null
    const start = toLocalInput(eventBaseDate())
    const endDate = eventBaseDate()
    endDate.setHours(endDate.getHours() + 1)
    scheduleForm.value = { title: '', time: start, endTime: toLocalInput(endDate), location: '', description: '' }
  }
  scheduleModalOpen.value = true
}
function closeScheduleModal() { scheduleModalOpen.value = false; editingSchedId.value = null }

function onSchedKey(e) {
  if (e.key === 'Escape' && scheduleModalOpen.value) closeScheduleModal()
}
onMounted(() => window.addEventListener('keydown', onSchedKey))
onUnmounted(() => window.removeEventListener('keydown', onSchedKey))

async function saveScheduleItem() {
  const title = scheduleForm.value.title.trim()
  const time  = scheduleForm.value.time
  if (!title || !time) return

  const description = scheduleForm.value.description.trim()
  const location = scheduleForm.value.location.trim()
  const endTime = scheduleForm.value.endTime
  const fields = {
    title,
    time,
    ...(endTime ? { endTime } : {}),
    ...(location ? { location } : {}),
    ...(description ? { description } : {}),
  }

  const updated = editingSchedId.value
    ? schedule.value.map(s => s.id === editingSchedId.value ? { id: s.id, ...fields } : s)
    : [...schedule.value, { id: Date.now().toString(), ...fields }]

  savingSched.value = true
  try {
    await updateDoc(doc(db, 'events', eventId.value), { schedule: updated })
    schedule.value = updated
    closeScheduleModal()
    showToast(editingSchedId.value ? 'Programme item updated' : 'Programme item added')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    savingSched.value = false
  }
}

async function removeScheduleItem(item) {
  const updated = schedule.value.filter(s => s.id !== item.id)
  try {
    await updateDoc(doc(db, 'events', eventId.value), { schedule: updated })
    schedule.value = updated
    showToast('Programme item removed')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────
const toastMsg     = ref('')
const toastErr     = ref(false)
const toastVisible = ref(false)
let toastTimer     = null

function showToast(msg, isErr = false) {
  toastMsg.value     = msg
  toastErr.value     = isErr
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3200)
}
</script>

<style scoped>
.sch-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #1f2937;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.sch-skeleton {
  padding: 28px 36px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sch-sk-bar {
  height: 20px; width: 160px; border-radius: 9999px;
  background: #f1f5f9;
}
.sch-sk-tile {
  height: 72px; border-radius: 16px; background: #f8fafc;
}

.sch-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.sch-hub-hd {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 32px;
  background: #ffffff;
  gap: 16px;
}
.sch-hd-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.sch-hd-burger {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; flex-shrink: 0;
  background: none; border: none;
  color: #374151; cursor: pointer; padding: 0;
  border-radius: 50%;
  transition: color 130ms, background 130ms;
}
.sch-hd-burger:hover { background: #f3f4f6; color: #111827; }
.sch-hd-brand {
  display: flex; align-items: center; cursor: pointer; user-select: none;
}
.sch-hd-brand-logo {
  height: 26px; max-width: 110px; object-fit: contain; border-radius: 4px;
}
.sch-hd-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.04em;
  line-height: 1;
}
.sch-hd-title-group { display: flex; align-items: center; gap: 10px; min-width: 0; }
.sch-hub-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.sch-hub-count {
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  background: #f3f4f6;
  border-radius: 9999px;
  padding: 1px 7px;
}

.sch-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 22px;
  border: none;
  border-radius: 9999px;
  background: #111827;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: all 160ms ease;
  flex-shrink: 0;
}
.sch-add-btn:hover {
  background: #000000;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
}


.sch-add-btn--inline { height: 36px; padding: 0 16px; font-size: 13.5px; box-shadow: none; }
.sch-add-btn--inline:hover { transform: none; }

.sch-split {
  flex: 1;
  display: flex;
  align-items: stretch;
  min-height: 0;
  background: #f7f7f8;
}
.sch-editor {
  flex: 1 1 50%;
  width: 50%;
  min-width: 0;
  background: #ffffff;
  border-right: 1px solid #f0f0f2;
  overflow-y: auto;
  padding: 22px 32px 48px;
}
.sch-crumb {
  margin: 0 0 16px;
  font-size: 12.5px;
  font-weight: 500;
  color: #94a3b8;
}
.sch-layout-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  margin-bottom: 18px;
}
.sch-layout-ic {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: #f8fafc;
  color: #111827;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sch-layout-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.sch-layout-copy strong { font-size: 14px; font-weight: 600; color: #111827; }
.sch-layout-copy span { font-size: 12.5px; color: #64748b; }
.sch-editor-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.sch-select-ghost {
  font-size: 13.5px;
  font-weight: 500;
  color: #94a3b8;
}
.sch-editor-empty {
  padding: 8px 2px 0;
}
.sch-empty-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #94a3b8;
}
.sch-empty-title {
  margin: 0 0 10px;
  font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
  font-weight: 400;
  font-style: italic;
  font-size: 28px;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.sch-empty-lede {
  margin: 0 0 22px;
  max-width: 36ch;
  font-size: 14px;
  color: #64748b;
  line-height: 1.55;
}
.sch-empty-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 14px;
  border: 1px dashed #d1d5db;
  border-radius: 14px;
  background: #fafafa;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 140ms ease, background 140ms ease;
}
.sch-empty-row:hover {
  border-color: #111827;
  background: #ffffff;
}
.sch-empty-plus {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: #111827;
  color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
  flex-shrink: 0;
}
.sch-empty-row-copy { display: flex; flex-direction: column; gap: 2px; }
.sch-empty-row-title { font-size: 15px; font-weight: 600; color: #111827; }
.sch-empty-row-sub { font-size: 13px; color: #64748b; }
.sch-day { margin-bottom: 22px; }
.sch-day-lbl {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}
.sch-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 4px 16px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}
.sch-item:hover { background: #fafafa; }
.sch-item-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.sch-item-title { font-size: 15px; font-weight: 600; color: #111827; }
.sch-item-time { font-size: 13px; color: #64748b; }
.sch-item-chip {
  display: inline-flex;
  margin-top: 4px;
  height: 22px;
  padding: 0 10px;
  border-radius: 9999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 11.5px;
  font-weight: 600;
  align-items: center;
}
.sch-item-chev { color: #9ca3af; flex-shrink: 0; }

.sch-preview {
  flex: 1 1 50%;
  width: 50%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f4f4f5;
}
.sch-preview-bar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f2;
  flex-shrink: 0;
}
.sch-devices { display: flex; gap: 4px; }
.sch-device {
  width: 34px; height: 34px;
  border: none; border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.sch-device--on { background: #f3f4f6; color: #111827; }
.sch-preview-kicker {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #94a3b8;
}
.sch-preview-stage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 28px 24px 40px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.sch-site {
  width: min(720px, 100%);
  background: #FAF6EF;
  color: #241F18;
  border-radius: 4px;
  box-shadow: 0 18px 50px rgba(36, 31, 24, 0.12);
  overflow: hidden;
  transition: width 200ms ease;
}
.sch-site--tablet { width: min(480px, 100%); }
.sch-site--phone { width: min(360px, 100%); }
.sch-site-banner {
  height: 88px;
  background-size: cover;
  background-position: center;
}
.sch-site-page { padding: 36px 48px 56px; }
.sch-site--phone .sch-site-page { padding: 28px 22px 40px; }
.sch-site-heading {
  margin: 0 0 36px;
  text-align: center;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400;
  font-size: 28px;
  color: #241F18;
}
.sch-site-empty {
  text-align: center;
  font-size: 14px;
  color: #8a8178;
}
.sch-site-day { margin-bottom: 28px; }
.sch-site-day-lbl {
  margin: 0 0 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: #9C7F32;
}
.sch-site-item {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 14px;
  min-height: 72px;
}
.sch-site-rail {
  position: relative;
  display: flex;
  justify-content: center;
}
.sch-site-rail::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: -8px;
  width: 1px;
  background: rgba(156, 127, 50, 0.35);
}
.sch-site-item--last .sch-site-rail::before { display: none; }
.sch-site-rail span {
  position: relative;
  z-index: 1;
  width: 9px; height: 9px;
  margin-top: 5px;
  border-radius: 50%;
  background: #FAF6EF;
  border: 1.5px solid #9C7F32;
}
.sch-site-body { padding-bottom: 22px; text-align: left; }
.sch-site-when {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 500;
  color: #8a8178;
}
.sch-site-title {
  margin: 0;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 20px;
  font-weight: 400;
  color: #241F18;
  line-height: 1.25;
}
.sch-site-loc {
  margin: 6px 0 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9C7F32;
}
.sch-site-desc {
  margin: 8px 0 0;
  font-size: 13.5px;
  color: #6b645c;
  line-height: 1.5;
  max-width: 48ch;
}

@media (max-width: 980px) {
  .sch-split { flex-direction: column; }
  .sch-editor, .sch-preview { width: 100%; flex-basis: auto; }
  .sch-editor { border-right: none; border-bottom: 1px solid #f0f0f2; max-height: 46vh; }
  .sch-preview { min-height: 54vh; }
  .sch-site-page { padding: 28px 24px 40px; }
}

.sch-toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #111827;
  color: #fff;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  z-index: 10000;
  white-space: nowrap;
}
.sch-toast--err { background: #991b1b; }

.sch-toast-enter-active { transition: opacity 220ms, transform 220ms cubic-bezier(0.34,1.56,0.64,1); }
.sch-toast-leave-active { transition: opacity 180ms, transform 180ms; }
.sch-toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(12px); }
.sch-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

@media (max-width: 640px) {
  .sch-hub-hd { padding: 0 16px; }
}
</style>

<style>
html .sch-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.32) !important;
  backdrop-filter: none !important;
}
html .sch-dialog {
  width: min(520px, calc(100vw - 32px));
  max-height: min(720px, 90vh);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #111827;
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
html .sch-dialog-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 10px 24px;
  flex-shrink: 0;
}
html .sch-dialog-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #111827;
}
html .sch-dialog-x {
  width: 32px; height: 32px;
  border: none; border-radius: 50%;
  background: #f8fafc; color: #64748b;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
html .sch-dialog-x:hover { background: #f1f5f9; color: #111827; }
html .sch-dialog-body {
  padding: 4px 24px 12px;
  overflow-y: auto;
  min-height: 0;
}
html .sch-dialog-sub {
  margin: 0 0 18px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}
html .sch-field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  letter-spacing: -0.01em;
  margin: 0 0 8px;
}
html .sch-field-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}
html .sch-field-row > div { min-width: 0; }
html .sch-field-optional {
  font-weight: 500;
  color: #94a3b8;
  margin-left: 4px;
}
html .sch-input,
html .sch-textarea {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #111827;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  margin-bottom: 14px;
}
html .sch-input {
  height: 46px;
  border-radius: 9999px;
  padding: 0 16px;
  color-scheme: light;
  max-width: 100%;
}
html .sch-input--when {
  height: 48px;
  border-radius: 14px;
  padding: 0 12px;
  font-size: 13px;
  min-width: 0;
}
html .sch-input--when::-webkit-datetime-edit {
  min-width: 0;
  overflow: hidden;
  padding: 0;
}
html .sch-input--when::-webkit-calendar-picker-indicator {
  margin-left: 4px;
  cursor: pointer;
  opacity: 0.55;
}
html .sch-textarea {
  min-height: 96px;
  border-radius: 14px;
  padding: 12px 16px;
  resize: vertical;
  line-height: 1.5;
  margin-bottom: 4px;
}
html .sch-input:focus,
html .sch-textarea:focus {
  border-color: #d1d5db;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
html .sch-input::placeholder,
html .sch-textarea::placeholder { color: #94a3b8; }
html .sch-dialog-foot {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 14px 20px 18px;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
}
html .sch-dialog-cancel {
  height: 40px;
  padding: 0 18px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  font-family: inherit;
}
html .sch-dialog-save {
  height: 40px;
  padding: 0 22px;
  border: none;
  border-radius: 9999px;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
html .sch-dialog-save:disabled { opacity: 0.4; cursor: default; }
</style>
