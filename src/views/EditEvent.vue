<template>
  <div class="ce-root">

    <!-- Nav -->
    <nav class="ce-nav">
      <div class="ce-nav-inner">
        <div class="ce-nav-left">
          <div class="ce-brand" @click="$router.push('/events')">
            <img :src="brandLogoUrl" class="ce-brand-logo" />
            <span class="ce-brand-name">{{ brandName }}</span>
          </div>
          <div class="ce-breadcrumb">
            <span class="ce-sep">/</span>
            <span class="ce-crumb" @click="$router.push('/events')">My Events</span>
            <span class="ce-sep">/</span>
            <span class="ce-crumb ce-crumb--event" @click="$router.push(`/event/${eventId}/overview`)">{{ form.title || '…' }}</span>
            <span class="ce-sep">/</span>
            <span class="ce-crumb ce-crumb--page">Edit Event</span>
          </div>
        </div>
        <div class="ce-nav-right">
          <div class="ce-avatar-pill">
            <span class="ce-avatar-dot" />
            <span class="ce-avatar-label">Admin &middot; {{ userDisplayName }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Loading skeleton -->
    <div v-if="loadingEvent" class="ce-body">
      <div class="ce-skeleton-section" v-for="i in 4" :key="i" />
    </div>

    <!-- Form body -->
    <div v-else class="ce-body">
      <form class="ce-form" @submit.prevent="handleSubmit" novalidate>

        <!-- Thumbnail -->
        <div class="ce-section">
          <div class="ce-section-label">Event Thumbnail</div>
          <div
            class="ce-thumb-drop"
            :class="{ 'ce-thumb-drop--has': thumbPreview }"
            @click="$refs.thumbInput.click()"
            @dragover.prevent
            @drop.prevent="onThumbDrop"
          >
            <img v-if="thumbPreview" :src="thumbPreview" class="ce-thumb-preview" />
            <div v-else class="ce-thumb-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p class="ce-thumb-hint">Click or drag to replace thumbnail</p>
              <p class="ce-thumb-sub">Recommended: 16:9, at least 800×450px</p>
            </div>
            <input ref="thumbInput" type="file" accept="image/*" class="ce-hidden" @change="onThumbChange" />
          </div>
        </div>

        <!-- Basic info -->
        <div class="ce-section">
          <div class="ce-section-label">Basic Information</div>
          <div class="ce-fields">

            <div class="ce-field" :class="{ 'ce-field--error': errors.title }">
              <label class="ce-label">Event Title <span class="ce-req">*</span></label>
              <input v-model="form.title" type="text" class="ce-input" placeholder="e.g. Gatsby Night" @input="errors.title = ''" />
              <span v-if="errors.title" class="ce-field-error">{{ errors.title }}</span>
            </div>

            <div class="ce-field" :class="{ 'ce-field--error': errors.category }">
              <label class="ce-label">Category <span class="ce-req">*</span></label>
              <button type="button" class="ce-select-btn" @click="showCatPicker = true" :class="{ 'ce-select-btn--empty': !form.categoryId }">
                <span>{{ form.categoryName || 'Select a category' }}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <span v-if="errors.category" class="ce-field-error">{{ errors.category }}</span>
            </div>

            <div class="ce-field ce-field--full" :class="{ 'ce-field--error': errors.description }">
              <label class="ce-label">Description <span class="ce-req">*</span></label>
              <textarea v-model="form.description" class="ce-textarea" rows="4" placeholder="Tell us more about the event…" @input="errors.description = ''" />
              <span v-if="errors.description" class="ce-field-error">{{ errors.description }}</span>
            </div>

          </div>
        </div>

        <!-- Date & Time -->
        <div class="ce-section">
          <div class="ce-section-label">Date &amp; Time</div>
          <div class="ce-fields">

            <div class="ce-field" :class="{ 'ce-field--error': errors.startDate }">
              <label class="ce-label">Start Date &amp; Time <span class="ce-req">*</span></label>
              <input v-model="form.startDate" type="datetime-local" class="ce-input" @change="errors.startDate = ''" />
              <span v-if="errors.startDate" class="ce-field-error">{{ errors.startDate }}</span>
            </div>

            <div class="ce-field">
              <label class="ce-label">End Date &amp; Time</label>
              <input v-model="form.endDate" type="datetime-local" class="ce-input" />
            </div>

          </div>
        </div>

        <!-- Additional details -->
        <div class="ce-section">
          <div class="ce-section-label">Additional Details</div>
          <div class="ce-fields">

            <div class="ce-field">
              <label class="ce-label">Place of Worship <span class="ce-optional">(optional)</span></label>
              <div class="ce-search-wrap">
                <svg class="ce-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  v-model="form.worshipLocation"
                  type="text"
                  class="ce-input ce-input--search"
                  placeholder="e.g. church, mosque, or temple name"
                  autocomplete="off"
                  @input="form.worshipLocationLat = null; form.worshipLocationLng = null; form.worshipLocationAddress = ''; worshipPlace.search(form.worshipLocation)"
                  @keydown.down.prevent="worshipPlace.cursor.value = Math.min(worshipPlace.cursor.value + 1, worshipPlace.suggestions.value.length - 1)"
                  @keydown.up.prevent="worshipPlace.cursor.value = Math.max(worshipPlace.cursor.value - 1, 0)"
                  @keydown.enter.prevent="worshipPlace.cursor.value >= 0 && pickWorship(worshipPlace.suggestions.value[worshipPlace.cursor.value])"
                  @keydown.escape="worshipPlace.clear()"
                />
                <svg v-if="worshipPlace.loading.value" class="ce-search-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                <ul v-if="worshipPlace.suggestions.value.length" class="ce-suggestions">
                  <li
                    v-for="(s, i) in worshipPlace.suggestions.value"
                    :key="s.place"
                    class="ce-suggestion"
                    :class="{ 'ce-suggestion--active': i === worshipPlace.cursor.value }"
                    @mousedown.prevent="pickWorship(s)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round" style="flex-shrink:0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div class="ce-suggestion-text">
                      <span class="ce-suggestion-main">{{ s.structuredFormat?.mainText?.text }}</span>
                      <span class="ce-suggestion-sub">{{ s.structuredFormat?.secondaryText?.text }}</span>
                    </div>
                  </li>
                </ul>
              </div>
              <span v-if="form.worshipLocationLat" class="ce-map-hint">&#128205; Matched on map &middot; {{ Number(form.worshipLocationLat).toFixed(4) }}, {{ Number(form.worshipLocationLng).toFixed(4) }}</span>
              <div class="ce-subrow">
                <div class="ce-subfield">
                  <label class="ce-sublabel">Start Time</label>
                  <input v-model="form.worshipStartTime" type="time" class="ce-input" />
                </div>
                <div class="ce-subfield">
                  <label class="ce-sublabel">End Time</label>
                  <input v-model="form.worshipEndTime" type="time" class="ce-input" />
                </div>
              </div>
              <button type="button" class="ce-manual-toggle" @click="worshipPlace.toggleManual()">Can't find it on the map?</button>
              <div v-if="worshipPlace.showManual.value" class="ce-manual-box">
                <button type="button" class="ce-manual-btn" :disabled="worshipPlace.manualBusy.value" @click="applyWorshipLocation">
                  &#128205; Use my current location
                </button>
                <div class="ce-manual-link-row">
                  <input
                    v-model="worshipPlace.linkInput.value"
                    type="text"
                    class="ce-input ce-manual-link-input"
                    placeholder="Paste a Google Maps link"
                    @keydown.enter.prevent="applyWorshipLink"
                  />
                  <button type="button" class="ce-manual-apply" :disabled="worshipPlace.manualBusy.value" @click="applyWorshipLink">Apply</button>
                </div>
                <span v-if="worshipPlace.manualError.value" class="ce-field-error">{{ worshipPlace.manualError.value }}</span>
              </div>
            </div>

            <div class="ce-field" :class="{ 'ce-field--error': errors.location }">
              <label class="ce-label">Venue <span class="ce-req">*</span></label>
              <div class="ce-search-wrap">
                <svg class="ce-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  v-model="form.location"
                  type="text"
                  class="ce-input ce-input--search"
                  placeholder="e.g. Mlimani City Hall"
                  autocomplete="off"
                  @input="form.locationLat = null; form.locationLng = null; form.locationAddress = ''; errors.location = ''; venuePlace.search(form.location)"
                  @keydown.down.prevent="venuePlace.cursor.value = Math.min(venuePlace.cursor.value + 1, venuePlace.suggestions.value.length - 1)"
                  @keydown.up.prevent="venuePlace.cursor.value = Math.max(venuePlace.cursor.value - 1, 0)"
                  @keydown.enter.prevent="venuePlace.cursor.value >= 0 && pickVenue(venuePlace.suggestions.value[venuePlace.cursor.value])"
                  @keydown.escape="venuePlace.clear()"
                />
                <svg v-if="venuePlace.loading.value" class="ce-search-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                <ul v-if="venuePlace.suggestions.value.length" class="ce-suggestions">
                  <li
                    v-for="(s, i) in venuePlace.suggestions.value"
                    :key="s.place"
                    class="ce-suggestion"
                    :class="{ 'ce-suggestion--active': i === venuePlace.cursor.value }"
                    @mousedown.prevent="pickVenue(s)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round" style="flex-shrink:0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div class="ce-suggestion-text">
                      <span class="ce-suggestion-main">{{ s.structuredFormat?.mainText?.text }}</span>
                      <span class="ce-suggestion-sub">{{ s.structuredFormat?.secondaryText?.text }}</span>
                    </div>
                  </li>
                </ul>
              </div>
              <span v-if="form.locationLat" class="ce-map-hint">&#128205; Matched on map &middot; {{ Number(form.locationLat).toFixed(4) }}, {{ Number(form.locationLng).toFixed(4) }}</span>
              <span v-if="errors.location" class="ce-field-error">{{ errors.location }}</span>
              <div class="ce-subrow">
                <div class="ce-subfield">
                  <label class="ce-sublabel">Start Time</label>
                  <input v-model="form.venueStartTime" type="time" class="ce-input" />
                </div>
                <div class="ce-subfield">
                  <label class="ce-sublabel">End Time</label>
                  <input v-model="form.venueEndTime" type="time" class="ce-input" />
                </div>
              </div>
              <button type="button" class="ce-manual-toggle" @click="venuePlace.toggleManual()">Can't find it on the map?</button>
              <div v-if="venuePlace.showManual.value" class="ce-manual-box">
                <button type="button" class="ce-manual-btn" :disabled="venuePlace.manualBusy.value" @click="applyVenueLocation">
                  &#128205; Use my current location
                </button>
                <div class="ce-manual-link-row">
                  <input
                    v-model="venuePlace.linkInput.value"
                    type="text"
                    class="ce-input ce-manual-link-input"
                    placeholder="Paste a Google Maps link"
                    @keydown.enter.prevent="applyVenueLink"
                  />
                  <button type="button" class="ce-manual-apply" :disabled="venuePlace.manualBusy.value" @click="applyVenueLink">Apply</button>
                </div>
                <span v-if="venuePlace.manualError.value" class="ce-field-error">{{ venuePlace.manualError.value }}</span>
              </div>
            </div>

            <div class="ce-field" :class="{ 'ce-field--error': errors.supportPhone }">
              <label class="ce-label">Support Number <span class="ce-req">*</span></label>
              <input v-model="form.supportPhone" type="tel" class="ce-input" placeholder="+255 7XX XXX XXX" @input="errors.supportPhone = ''" />
              <span v-if="errors.supportPhone" class="ce-field-error">{{ errors.supportPhone }}</span>
            </div>

            <div class="ce-field">
              <label class="ce-label">Event Plan <span class="ce-optional">(optional)</span></label>
              <button type="button" class="ce-select-btn" @click="showPlanPicker = true" :class="{ 'ce-select-btn--empty': !form.eventPlanId }">
                <span>{{ form.eventPlanName || 'Select a plan' }}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>

            <div class="ce-field">
              <label class="ce-label">Language</label>
              <div class="ce-radio-row">
                <label class="ce-radio-opt" :class="{ 'ce-radio-opt--active': form.language === 'sw' }">
                  <input type="radio" v-model="form.language" value="sw" class="ce-hidden" /> Kiswahili
                </label>
                <label class="ce-radio-opt" :class="{ 'ce-radio-opt--active': form.language === 'en' }">
                  <input type="radio" v-model="form.language" value="en" class="ce-hidden" /> English
                </label>
              </div>
            </div>

          </div>
        </div>

        <!-- Global error -->
        <div v-if="submitError" class="ce-submit-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ submitError }}
        </div>

        <!-- Actions -->
        <div class="ce-actions">
          <button type="button" class="ce-cancel-btn" @click="$router.push('/events')">Cancel</button>
          <button type="submit" class="ce-submit-btn" :disabled="saving">
            <span v-if="saving" class="ce-spinner" />
            <span v-else>Save Changes</span>
          </button>
        </div>

      </form>
    </div>

    <!-- Category picker -->
    <Transition name="fade">
      <div v-if="showCatPicker" class="ce-modal-backdrop" @click.self="showCatPicker = false">
        <div class="ce-modal">
          <div class="ce-modal-head">
            <span class="ce-modal-title">Select Category</span>
            <button class="ce-modal-close" @click="showCatPicker = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="ce-modal-list">
            <div v-if="loadingCats" class="ce-modal-loading">Loading…</div>
            <button v-for="cat in categories" :key="cat.id" type="button" class="ce-modal-item" :class="{ 'ce-modal-item--active': form.categoryId === cat.id }" @click="selectCategory(cat)">
              {{ cat.name }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Plan picker -->
    <Transition name="fade">
      <div v-if="showPlanPicker" class="ce-modal-backdrop" @click.self="showPlanPicker = false">
        <div class="ce-modal">
          <div class="ce-modal-head">
            <span class="ce-modal-title">Select Plan</span>
            <button class="ce-modal-close" @click="showPlanPicker = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="ce-modal-list">
            <div v-if="loadingPlans" class="ce-modal-loading">Loading…</div>
            <button v-for="plan in availablePlans" :key="plan.id" type="button" class="ce-modal-item" :class="{ 'ce-modal-item--active': form.eventPlanId === plan.id }" @click="selectPlan(plan)">
              ★ {{ plan.name }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { db, auth, storage } from '../firebase'
import { doc, getDoc, setDoc, getDocs, collection, query, orderBy } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { toStoredEventDate, toDatetimeLocal } from '../utils/eventDates.js'
import { useOrg } from '../composables/useOrg.js'
import { usePlaceSearch } from '../composables/usePlaceSearch.js'
import { visiblePlansFor } from '../utils/planVisibility.js'

const venuePlace = usePlaceSearch()
const worshipPlace = usePlaceSearch()

async function pickVenue(suggestion) {
  const r = await venuePlace.resolve(suggestion)
  form.value.location = r.text
  form.value.locationAddress = r.address
  form.value.locationLat = r.lat
  form.value.locationLng = r.lng
  errors.value.location = ''
}

async function pickWorship(suggestion) {
  const r = await worshipPlace.resolve(suggestion)
  form.value.worshipLocation = r.text
  form.value.worshipLocationAddress = r.address
  form.value.worshipLocationLat = r.lat
  form.value.worshipLocationLng = r.lng
}

// Manual fallbacks — venue name stays whatever the admin typed; only the
// coordinates come from the device or the pasted link.
async function applyVenueLocation() {
  const r = await venuePlace.useMyLocation()
  if (!r) return
  form.value.locationLat = r.lat
  form.value.locationLng = r.lng
  form.value.locationAddress = ''
}
async function applyVenueLink() {
  const r = await venuePlace.useLinkInput()
  if (!r) return
  form.value.locationLat = r.lat
  form.value.locationLng = r.lng
  form.value.locationAddress = ''
}
async function applyWorshipLocation() {
  const r = await worshipPlace.useMyLocation()
  if (!r) return
  form.value.worshipLocationLat = r.lat
  form.value.worshipLocationLng = r.lng
  form.value.worshipLocationAddress = ''
}
async function applyWorshipLink() {
  const r = await worshipPlace.useLinkInput()
  if (!r) return
  form.value.worshipLocationLat = r.lat
  form.value.worshipLocationLng = r.lng
  form.value.worshipLocationAddress = ''
}

const router = useRouter()
const route = useRoute()
const eventId = route.params.eventId
const uid = auth.currentUser?.uid

const loadingEvent = ref(true)
const saving = ref(false)
const submitError = ref('')
const errors = ref({})

const thumbFile = ref(null)
const thumbPreview = ref('')
const existingThumbUrl = ref('')

const { activeOrg, brandName, brandLogoUrl } = useOrg()

const userDisplayName = computed(() => {
  const u = auth.currentUser
  if (!u) return 'Admin'
  return u.displayName || u.email?.split('@')[0] || 'Admin'
})

const categories = ref([])
const plans = ref([])

// The plan already on this event stays listed even if the org can no longer
// choose it — restricting a package must never blank out an event that's
// already using it. Entitlement governs what can be picked, not what's held.
const availablePlans = computed(() =>
  visiblePlansFor(activeOrg.value, plans.value, { keepPlanId: form.value.eventPlanId })
)
const loadingCats = ref(false)
const loadingPlans = ref(false)
const showCatPicker = ref(false)
const showPlanPicker = ref(false)

const form = ref({
  title: '',
  categoryId: '',
  categoryName: '',
  categoryLevel: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  locationAddress: '',
  locationLat: null,
  locationLng: null,
  venueStartTime: '',
  venueEndTime: '',
  worshipLocation: '',
  worshipLocationAddress: '',
  worshipLocationLat: null,
  worshipLocationLng: null,
  worshipStartTime: '',
  worshipEndTime: '',
  supportPhone: '',
  eventPlanId: null,
  eventPlanName: '',
  language: 'sw',
})


// ── Load existing event ────────────────────────────────────────────────────

onMounted(async () => {
  loadingCats.value = true
  loadingPlans.value = true

  try {
    const [eventSnap, catSnap, planSnap] = await Promise.all([
      getDoc(doc(db, 'events', eventId)),
      getDocs(collection(db, 'eventCategories')),
      getDocs(query(collection(db, 'eventPlans'), orderBy('rank', 'asc'))),
    ])

    categories.value = catSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    plans.value = planSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    if (eventSnap.exists()) {
      const e = eventSnap.data()
      existingThumbUrl.value = e.eventThumbnail ?? ''
      thumbPreview.value = e.eventThumbnail ?? ''

      // Resolve category name from loaded categories
      const cat = categories.value.find(c => c.id === e.categoryId)
      const plan = plans.value.find(p => p.id === e.eventPlanId)

      form.value = {
        title: e.title ?? '',
        categoryId: e.categoryId ?? '',
        categoryName: cat?.name ?? e.categoryId ?? '',
        categoryLevel: e.categoryLevel ?? '',
        description: e.description ?? '',
        startDate: toDatetimeLocal(e.startDate),
        endDate: toDatetimeLocal(e.endDate),
        location: e.location ?? '',
        locationAddress: e.locationAddress ?? '',
        locationLat: e.locationLat ?? null,
        locationLng: e.locationLng ?? null,
        venueStartTime: e.venueStartTime ?? '',
        venueEndTime: e.venueEndTime ?? '',
        worshipLocation: e.worshipLocation ?? '',
        worshipLocationAddress: e.worshipLocationAddress ?? '',
        worshipLocationLat: e.worshipLocationLat ?? null,
        worshipLocationLng: e.worshipLocationLng ?? null,
        worshipStartTime: e.worshipStartTime ?? '',
        worshipEndTime: e.worshipEndTime ?? '',
        supportPhone: e.supportPhone ?? '',
        eventPlanId: e.eventPlanId ?? null,
        eventPlanName: plan?.name ?? '',
        language: e.language ?? 'sw',
      }
    }
  } catch (e) {
    console.error('Failed to load event:', e)
  } finally {
    loadingEvent.value = false
    loadingCats.value = false
    loadingPlans.value = false
  }
})

// ── Thumbnail ──────────────────────────────────────────────────────────────

function onThumbChange(e) {
  const file = e.target.files[0]
  if (!file) return
  thumbFile.value = file
  thumbPreview.value = URL.createObjectURL(file)
}

function onThumbDrop(e) {
  const file = e.dataTransfer.files[0]
  if (!file || !file.type.startsWith('image/')) return
  thumbFile.value = file
  thumbPreview.value = URL.createObjectURL(file)
}

// ── Pickers ────────────────────────────────────────────────────────────────

function selectCategory(cat) {
  form.value.categoryId = cat.id
  form.value.categoryName = cat.name
  form.value.categoryLevel = cat.level ?? ''
  errors.value.category = ''
  showCatPicker.value = false
}

function selectPlan(plan) {
  form.value.eventPlanId = plan.id
  form.value.eventPlanName = plan.name
  showPlanPicker.value = false
}

// ── Validation ─────────────────────────────────────────────────────────────

function validate() {
  const e = {}
  if (!form.value.title.trim())       e.title       = 'Event title is required.'
  if (!form.value.categoryId)         e.category    = 'Please select a category.'
  if (!form.value.description.trim()) e.description = 'Description is required.'
  if (!form.value.startDate)          e.startDate   = 'Start date is required.'
  if (!form.value.location.trim())    e.location    = 'Location is required.'
  if (!form.value.supportPhone.trim()) e.supportPhone = 'Support number is required.'
  errors.value = e
  return Object.keys(e).length === 0
}

// ── Submit ─────────────────────────────────────────────────────────────────

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  submitError.value = ''
  try {
    // Upload new thumbnail only if user picked one
    let thumbnailUrl = existingThumbUrl.value
    if (thumbFile.value) {
      const timestamp = Date.now()
      const sRef = storageRef(storage, `Event-Thumbnails/${uid}?=${timestamp}?=${thumbFile.value.name}`)
      await uploadBytes(sRef, thumbFile.value)
      thumbnailUrl = await getDownloadURL(sRef)
    }

    const title = form.value.title.trim()
    await setDoc(doc(db, 'events', eventId), {
      title,
      titleLower: title.toLowerCase(),
      categoryId: form.value.categoryId,
      categoryLevel: form.value.categoryLevel,
      description: form.value.description.trim(),
      location: form.value.location.trim(),
      locationAddress: form.value.locationAddress,
      locationLat: form.value.locationLat,
      locationLng: form.value.locationLng,
      venueStartTime: form.value.venueStartTime,
      venueEndTime: form.value.venueEndTime,
      worshipLocation: form.value.worshipLocation.trim(),
      worshipLocationAddress: form.value.worshipLocationAddress,
      worshipLocationLat: form.value.worshipLocationLat,
      worshipLocationLng: form.value.worshipLocationLng,
      worshipStartTime: form.value.worshipStartTime,
      worshipEndTime: form.value.worshipEndTime,
      eventThumbnail: thumbnailUrl,
      eventPlanId: form.value.eventPlanId ?? null,
      // Naive local wall-clock, matching the Flutter app's format — NOT
      // toISOString(). See utils/eventDates.js.
      startDate: toStoredEventDate(form.value.startDate),
      endDate: toStoredEventDate(form.value.endDate),
      supportPhone: form.value.supportPhone.trim(),
      language: form.value.language,
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    router.push('/events')
  } catch (e) {
    console.error('Edit event error:', e)
    submitError.value = 'Failed to save changes. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ce-root {
  min-height: 100vh;
  /* flow-root establishes a BFC so the nav's 32px top margin is contained
     here instead of collapsing through the root and exposing the page
     background as a band at the very top edge. */
  display: flow-root;
  background: var(--org-page-bg, #070707);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.ce-nav {
  position: sticky;
  top: 32px;
  z-index: 100;
  max-width: 860px;
  margin: 32px auto 0;
  padding: 0 36px;
  box-sizing: border-box;
}
.ce-nav-inner {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 14px;
  background: #141414;
  border: 1px solid #2a2a2a;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.ce-nav-inner:hover {
  border-color: #3a3a3a;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.ce-nav-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.ce-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; min-width: 0; }
.ce-brand-logo { width: 20px; height: 20px; border-radius: 6px; object-fit: cover; }
.ce-brand-name { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 20px; font-weight: 700; color: #f0f0ec; letter-spacing: -0.1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ce-breadcrumb { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ce-sep { font-size: 15px; color: #3a3a3a; font-weight: 300; }
.ce-crumb { font-size: 14px; font-weight: 500; color: #888; cursor: pointer; transition: color 130ms; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.ce-crumb:hover { color: var(--gold); }
.ce-crumb--event { max-width: 160px; }
.ce-crumb--page { font-weight: 600; color: #f0f0ec; cursor: default; max-width: none; }
.ce-crumb--page:hover { color: #f0f0ec; }
.ce-avatar-pill { display: flex; align-items: center; gap: 7px; padding: 6px 12px 6px 14px; border-radius: 20px; border: 1px solid #2a2a2a; background: #070707; flex-shrink: 0; }
.ce-avatar-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--emerald); flex-shrink: 0; }
.ce-avatar-label { font-size: 12.5px; font-weight: 500; color: #d4cfc8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

.ce-body { max-width: 860px; margin: 0 auto; padding: 36px 36px 80px; }
.ce-form { display: flex; flex-direction: column; gap: 24px; }

/* Skeleton */
.ce-skeleton-section {
  height: 160px;
  border-radius: 16px;
  background: linear-gradient(90deg, #141414 25%, #1e1e1e 50%, #141414 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.ce-section { background: #141414; border: 1px solid #2a2a2a; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 16px; }
.ce-section-label { font-size: 13px; font-weight: 700; color: #888; letter-spacing: 0.2px; text-transform: uppercase; }

.ce-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ce-field { display: flex; flex-direction: column; gap: 6px; }
.ce-field--full { grid-column: 1 / -1; }
.ce-label { font-size: 12px; font-weight: 600; color: #888; }
.ce-req { color: var(--gold); }
.ce-optional { color: #555; font-weight: 400; }

.ce-input, .ce-textarea {
  padding: 10px 13px; border: 0.8px solid #2a2a2a; border-radius: 10px; background: #070707;
  box-shadow: inset 0 1px 4px rgba(0,0,0,0.5);
  font-size: 14px; color: #f0f0ec; outline: none; font-family: inherit;
  transition: border-color 140ms, box-shadow 140ms; box-sizing: border-box; width: 100%;
}
.ce-input::placeholder, .ce-textarea::placeholder { color: #555; }
.ce-input:focus, .ce-textarea:focus { border-color: var(--gold); box-shadow: inset 0 1px 4px rgba(0,0,0,0.5), 0 0 0 3px rgb(from var(--gold) r g b / 0.12); }
.ce-textarea { resize: vertical; min-height: 100px; }
.ce-field--error .ce-input, .ce-field--error .ce-textarea { border-color: rgba(255,59,48,0.45); }
.ce-field-error { font-size: 11px; color: #FF453A; font-weight: 500; }

.ce-search-wrap { position: relative; }
.ce-input--search { padding-left: 36px; }
.ce-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.ce-search-spin { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); animation: ce-rotate 0.8s linear infinite; }
@keyframes ce-rotate { to { transform: translateY(-50%) rotate(360deg); } }
.ce-suggestions {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 200;
  background: #141414; border: 1px solid #2a2a2a; border-radius: 14px; overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4); list-style: none; margin: 0; padding: 4px;
}
.ce-suggestion { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: background 120ms; }
.ce-suggestion:hover, .ce-suggestion--active { background: rgba(255,255,255,0.06); }
.ce-suggestion-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ce-suggestion-main { font-size: 13.5px; font-weight: 600; color: #f0f0ec; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ce-suggestion-sub { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ce-map-hint { font-size: 11px; color: var(--gold); font-weight: 500; display: flex; align-items: center; gap: 4px; }

.ce-subrow { display: flex; gap: 8px; margin-top: 2px; }
.ce-subfield { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.ce-sublabel { font-size: 11px; font-weight: 600; color: #666; }

.ce-manual-toggle { align-self: flex-start; background: none; border: none; padding: 0; font-size: 11px; color: #555; text-decoration: underline; cursor: pointer; font-family: inherit; transition: color 130ms; }
.ce-manual-toggle:hover { color: #888; }
.ce-manual-box { display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px dashed #2a2a2a; border-radius: 10px; }
.ce-manual-btn {
  padding: 8px 12px; border: 0.8px solid #2a2a2a; border-radius: 8px; background: #111111;
  font-size: 12.5px; font-weight: 600; color: #f0f0ec; cursor: pointer; font-family: inherit;
  transition: border-color 140ms; text-align: left; width: fit-content;
}
.ce-manual-btn:hover:not(:disabled) { border-color: rgb(from var(--gold) r g b / 0.45); }
.ce-manual-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ce-manual-link-row { display: flex; gap: 8px; }
.ce-manual-link-input { flex: 1; padding: 8px 12px; font-size: 12.5px; }
.ce-manual-apply {
  padding: 8px 16px; border: none; border-radius: 8px; background: var(--gold); color: var(--gold-contrast);
  font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity 140ms; flex-shrink: 0;
}
.ce-manual-apply:hover:not(:disabled) { opacity: 0.88; }
.ce-manual-apply:disabled { opacity: 0.6; cursor: not-allowed; }

.ce-select-btn {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 13px; border: 0.8px solid #2a2a2a; border-radius: 10px; background: #070707;
  box-shadow: inset 0 1px 4px rgba(0,0,0,0.5);
  font-size: 14px; color: #f0f0ec; cursor: pointer; font-family: inherit;
  transition: border-color 140ms; text-align: left; width: 100%;
}
.ce-select-btn--empty { color: #555; }
.ce-select-btn:hover { border-color: rgb(from var(--gold) r g b / 0.45); }

.ce-radio-row { display: flex; gap: 8px; }
.ce-radio-opt { flex: 1; text-align: center; padding: 9px 12px; border: 0.8px solid #2a2a2a; border-radius: 10px; font-size: 13px; font-weight: 500; color: #888; cursor: pointer; transition: all 130ms; background: #070707; box-shadow: inset 0 1px 4px rgba(0,0,0,0.5); }
.ce-radio-opt--active { background: rgb(from var(--gold) r g b / 0.08); border-color: rgb(from var(--gold) r g b / 0.4); color: var(--gold); font-weight: 600; box-shadow: none; }

.ce-thumb-drop { border: 1.5px dashed #2a2a2a; border-radius: 14px; min-height: 180px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; transition: border-color 150ms; position: relative; background: #070707; box-shadow: inset 0 1px 4px rgba(0,0,0,0.5); }
.ce-thumb-drop:hover { border-color: rgb(from var(--gold) r g b / 0.5); }
.ce-thumb-drop--has { border-style: solid; border-color: #2a2a2a; }
.ce-thumb-preview { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.ce-thumb-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; }
.ce-thumb-hint { font-size: 14px; font-weight: 600; color: #888; margin: 0; }
.ce-thumb-sub { font-size: 12px; color: #555; margin: 0; }
.ce-hidden { display: none; }

.ce-submit-error { display: flex; align-items: center; gap: 8px; background: rgba(255,59,48,0.07); border: 0.8px solid rgba(255,59,48,0.2); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #FF453A; }

.ce-actions { display: flex; justify-content: flex-end; gap: 10px; }
.ce-cancel-btn { padding: 11px 24px; border: 1px solid #3a3a3a; border-radius: 10px; background: transparent; font-size: 14px; font-weight: 600; color: #888; cursor: pointer; font-family: inherit; transition: background 130ms; }
.ce-cancel-btn:hover { background: #1e1e1e; }
.ce-submit-btn { padding: 11px 28px; border: none; border-radius: 10px; background: var(--gold); font-size: 14px; font-weight: 700; color: var(--gold-contrast); cursor: pointer; font-family: inherit; transition: opacity 140ms; display: flex; align-items: center; gap: 8px; min-width: 140px; justify-content: center; }
.ce-submit-btn:hover:not(:disabled) { opacity: 0.88; }
.ce-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ce-spinner { width: 15px; height: 15px; border: 2px solid rgb(from currentColor r g b / 0.35); border-top-color: currentColor; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.ce-modal-backdrop { position: fixed; inset: 0; background: var(--overlay-bg); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
.ce-modal { background: #141414; border: 1px solid #2a2a2a; border-radius: 18px; width: 100%; max-width: 400px; max-height: 70vh; display: flex; flex-direction: column; box-shadow: 4px 8px 0 rgba(0,0,0,0.4); overflow: hidden; }
.ce-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 0.8px solid #2a2a2a; flex-shrink: 0; }
.ce-modal-title { font-size: 15px; font-weight: 700; color: #f0f0ec; }
.ce-modal-close { background: none; border: none; cursor: pointer; color: #888; display: flex; align-items: center; padding: 4px; }
.ce-modal-list { overflow-y: auto; padding: 10px 12px 14px; display: flex; flex-direction: column; gap: 2px; }
.ce-modal-loading { padding: 20px; text-align: center; color: #888; font-size: 13px; }
.ce-modal-item { display: flex; align-items: center; padding: 11px 12px; border-radius: 10px; border: none; background: none; font-size: 14px; font-weight: 500; color: #f0f0ec; cursor: pointer; text-align: left; font-family: inherit; transition: background 120ms; }
.ce-modal-item:hover { background: #1e1e1e; }
.ce-modal-item--active { background: rgb(from var(--gold) r g b / 0.08); color: var(--gold); font-weight: 600; }

.fade-enter-active, .fade-leave-active { transition: opacity 180ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .ce-nav { top: 16px; margin-top: 16px; padding: 0 14px; }
  .ce-nav-inner { padding: 14px 16px; }
  .ce-brand-name { font-size: 18px; }
  .ce-crumb--event { display: none; }
  .ce-body { padding: 20px 16px 60px; }
  .ce-fields { grid-template-columns: 1fr; }
  .ce-field--full { grid-column: 1; }
  .ce-actions { flex-direction: column-reverse; }
  .ce-cancel-btn, .ce-submit-btn { width: 100%; justify-content: center; }
}
</style>
