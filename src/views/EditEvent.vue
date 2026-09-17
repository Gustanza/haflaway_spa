<template>
  <div class="ce-root">

    <!-- Nav -->
    <nav class="ce-nav">
      <div class="ce-nav-inner">
        <div class="ce-brand" @click="$router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="ce-brand-logo" />
          <span v-else class="ce-brand-script">.joy</span>
        </div>
        <div class="ce-hd-sep" />
        <h1 class="ce-hub-title">Edit Event</h1>
        <button type="button" class="ce-crumb" @click="$router.push(`/event/${eventId}/overview`)">{{ form.title || 'Events' }}</button>
        <div class="ce-nav-right">
          <button type="button" class="ce-cancel-btn" @click="$router.push(`/event/${eventId}/overview`)">Cancel</button>
          <button type="submit" form="ce-edit-form" class="ce-submit-btn" :disabled="saving || loadingEvent">
            <span v-if="saving" class="ce-spinner" />
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Loading skeleton -->
    <div v-if="loadingEvent" class="ce-body">
      <div class="ce-skeleton-section" v-for="i in 4" :key="i" />
    </div>

    <!-- Form body -->
    <div v-else class="ce-body">
      <form id="ce-edit-form" class="ce-form" @submit.prevent="handleSubmit" novalidate>

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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
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
                <svg v-if="worshipPlace.loading.value" class="ce-search-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round">
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" style="flex-shrink:0">
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
                <svg v-if="venuePlace.loading.value" class="ce-search-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round">
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" style="flex-shrink:0">
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
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
}

.ce-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: #fff;
  border-bottom: 1px solid #f1f3f5;
}
.ce-nav-inner {
  height: 92px;
  padding: 0 36px;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: none;
  margin: 0;
}
.ce-brand {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e7eb;
  overflow: hidden; background: #fff; flex-shrink: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.ce-brand-logo { width: 100%; height: 100%; object-fit: cover; }
.ce-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-size: 18px; font-weight: 700;
  color: #111827; letter-spacing: -0.04em; line-height: 1;
}
.ce-hd-sep { width: 1px; height: 16px; background: #e5e7eb; flex-shrink: 0; margin: 0 4px; }
.ce-hub-title {
  margin: 0; font-size: 22px; font-weight: 600; color: #18181b;
  letter-spacing: -0.015em; white-space: nowrap;
}
.ce-crumb {
  background: none; border: none; padding: 0;
  min-width: 0; flex: 1; text-align: left;
  font-size: 13.5px; font-weight: 500; color: #64748b;
  font-family: inherit; cursor: pointer;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ce-crumb:hover { color: #111827; }
.ce-nav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-left: auto; }

.ce-body {
  max-width: 860px;
  margin: 0 auto;
  padding: 28px 36px 80px;
}
.ce-form { display: flex; flex-direction: column; gap: 16px; }

.ce-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ce-section-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ce-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.ce-field { display: flex; flex-direction: column; gap: 6px; }
.ce-field--full { grid-column: 1 / -1; }
.ce-label { font-size: 13px; font-weight: 600; color: #374151; }
.ce-req { color: #991b1b; }
.ce-optional { color: #94a3b8; font-weight: 400; }

.ce-input,
.ce-textarea,
.ce-select-btn {
  height: 46px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #fff;
  font-size: 14px;
  color: #111827;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  width: 100%;
}
.ce-textarea {
  height: auto;
  min-height: 100px;
  padding: 12px 16px;
  border-radius: 14px;
  resize: vertical;
  line-height: 1.55;
}
.ce-input::placeholder,
.ce-textarea::placeholder { color: #94a3b8; }
.ce-input:focus,
.ce-textarea:focus,
.ce-select-btn:focus {
  border-color: #111827;
  box-shadow: none;
  background: #fff;
}
.ce-field--error .ce-input,
.ce-field--error .ce-textarea { border-color: #fca5a5; }
.ce-field-error { font-size: 11px; color: #dc2626; font-weight: 500; }

.ce-search-wrap { position: relative; }
.ce-input--search { padding-left: 42px; }
.ce-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #9ca3af; }
.ce-search-spin { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); animation: ce-rotate 0.8s linear infinite; }
@keyframes ce-rotate { to { transform: translateY(-50%) rotate(360deg); } }
.ce-suggestions {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 200;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.12); list-style: none; margin: 0; padding: 4px;
}
.ce-suggestion { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 12px; cursor: pointer; }
.ce-suggestion:hover, .ce-suggestion--active { background: #f7f7f8; }
.ce-suggestion-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ce-suggestion-main { font-size: 13.5px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ce-suggestion-sub { font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ce-map-hint { font-size: 11px; color: #64748b; font-weight: 500; }

.ce-subrow { display: flex; gap: 8px; margin-top: 2px; }
.ce-subfield { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.ce-sublabel { font-size: 11px; font-weight: 600; color: #64748b; }

.ce-manual-toggle {
  align-self: flex-start; background: none; border: none; padding: 0;
  font-size: 12px; color: #64748b; text-decoration: underline; cursor: pointer; font-family: inherit;
}
.ce-manual-toggle:hover { color: #111827; }
.ce-manual-box { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px dashed #e5e7eb; border-radius: 14px; }
.ce-manual-btn {
  height: 40px; padding: 0 14px; border: 1px solid #e5e7eb; border-radius: 9999px; background: #fff;
  font-size: 13px; font-weight: 600; color: #111827; cursor: pointer; font-family: inherit;
  width: fit-content;
}
.ce-manual-btn:hover:not(:disabled) { background: #f8fafc; border-color: #d1d5db; }
.ce-manual-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ce-manual-link-row { display: flex; gap: 8px; }
.ce-manual-link-input { flex: 1; }
.ce-manual-apply {
  height: 46px; padding: 0 18px; border: none; border-radius: 9999px; background: #242424; color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; flex-shrink: 0;
}
.ce-manual-apply:hover:not(:disabled) { background: #000; }
.ce-manual-apply:disabled { opacity: 0.6; cursor: not-allowed; }

.ce-select-btn {
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; text-align: left;
}
.ce-select-btn--empty { color: #94a3b8; }
.ce-select-btn:hover { border-color: #d1d5db; background: #f8fafc; }

.ce-radio-row { display: flex; gap: 8px; }
.ce-radio-opt {
  flex: 1; text-align: center;
  min-height: 40px; display: flex; align-items: center; justify-content: center;
  padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 9999px;
  font-size: 13px; font-weight: 500; color: #475569; cursor: pointer;
  background: #fff;
}
.ce-radio-opt--active {
  background: #f1f5f9; border-color: #cbd5e1; color: #0f172a; font-weight: 600;
}

.ce-thumb-drop {
  border: 1.5px dashed #d1d5db; border-radius: 16px; min-height: 180px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden; position: relative; background: #f8fafc;
}
.ce-thumb-drop:hover { border-color: #9ca3af; background: #f3f4f6; }
.ce-thumb-drop--has { border-style: solid; border-color: #e5e7eb; background: #fff; }
.ce-thumb-preview { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.ce-thumb-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; }
.ce-thumb-hint { font-size: 14px; font-weight: 600; color: #374151; margin: 0; }
.ce-thumb-sub { font-size: 12px; color: #94a3b8; margin: 0; }
.ce-hidden { display: none; }

.ce-submit-error {
  display: flex; align-items: center; gap: 8px;
  background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px;
  padding: 12px 16px; font-size: 13px; color: #991b1b;
}

.ce-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
.ce-cancel-btn {
  height: 40px; padding: 0 18px; border: 1px solid #e5e7eb; border-radius: 9999px;
  background: #fff; font-size: 13.5px; font-weight: 600; color: #374151;
  cursor: pointer; font-family: inherit;
}
.ce-cancel-btn:hover { background: #f8fafc; color: #111827; border-color: #d1d5db; }
.ce-submit-btn {
  height: 40px; padding: 0 22px; border: none; border-radius: 9999px;
  background: #222; font-size: 13.5px; font-weight: 600; color: #fff;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; gap: 8px; min-width: 140px; justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
.ce-submit-btn:hover:not(:disabled) { background: #000; }
.ce-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.ce-spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.ce-modal-backdrop {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.32);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 24px;
}
.ce-modal {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 16px;
  width: 100%; max-width: 400px; max-height: 70vh;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2); overflow: hidden;
}
.ce-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
}
.ce-modal-title { font-size: 16px; font-weight: 700; color: #111827; }
.ce-modal-close {
  width: 32px; height: 32px; border-radius: 50%; background: none; border: 1px solid #e5e7eb;
  cursor: pointer; color: #6b7280; display: flex; align-items: center; justify-content: center; padding: 0;
}
.ce-modal-close:hover { background: #f8fafc; color: #111827; }
.ce-modal-list { overflow-y: auto; padding: 10px 12px 14px; display: flex; flex-direction: column; gap: 2px; }
.ce-modal-loading { padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
.ce-modal-item {
  display: flex; align-items: center; padding: 11px 12px; border-radius: 12px;
  border: none; background: none; font-size: 14px; font-weight: 500; color: #1f2937;
  cursor: pointer; text-align: left; font-family: inherit;
}
.ce-modal-item:hover { background: #f7f7f8; }
.ce-modal-item--active { background: #f3f4f6; color: #111827; font-weight: 600; }

.fade-enter-active, .fade-leave-active { transition: opacity 180ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .ce-nav-inner { height: auto; flex-wrap: wrap; padding: 12px 16px; gap: 10px; }
  .ce-hd-sep { display: none; }
  .ce-crumb { flex: 1 1 100%; order: 8; }
  .ce-body { padding: 20px 16px 60px; }
  .ce-fields { grid-template-columns: 1fr; }
  .ce-field--full { grid-column: 1; }
  .ce-actions { flex-direction: column-reverse; }
  .ce-cancel-btn, .ce-submit-btn { width: 100%; justify-content: center; }
  .ce-nav-right { width: 100%; }
}

.ce-skeleton-section {
  height: 160px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>
