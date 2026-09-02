import { ref } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

// Google Places (New) autocomplete + place-details lookup — same endpoints
// and key already used by EventSettings.vue's venue picker. Factored out
// here because both the Venue and Place of Worship fields need an
// independent instance of this, on both the create and edit event forms.
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Long-form Google Maps URLs (the kind with @lat,lng or ?q=lat,lng already
// in them, e.g. copied from a desktop browser's address bar) carry
// coordinates right in the string — no network call needed. Short links
// (maps.app.goo.gl, from the mobile app's Share button) don't, and are
// handled by the resolveMapsLink Cloud Function instead.
const COORD_PATTERNS = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
]

function extractCoordsFromUrl(url) {
  for (const re of COORD_PATTERNS) {
    const m = url.match(re)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
  }
  return null
}

export function usePlaceSearch() {
  const suggestions = ref([])
  const cursor = ref(-1)
  const loading = ref(false)
  let debounceTimer = null

  function search(q) {
    suggestions.value = []
    cursor.value = -1
    clearTimeout(debounceTimer)
    const query = q.trim()
    if (query.length < 2) return
    debounceTimer = setTimeout(() => fetchSuggestions(query), 280)
  }

  async function fetchSuggestions(query) {
    loading.value = true
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': MAPS_KEY },
        body: JSON.stringify({ input: query, languageCode: 'sw' }),
      })
      const data = await res.json()
      suggestions.value = (data.suggestions ?? []).map(s => s.placePrediction).filter(Boolean)
    } catch {
      suggestions.value = []
    } finally {
      loading.value = false
    }
  }

  // Resolves a picked suggestion to its exact real-world name and
  // coordinates. `text` is the clean place name only — that's what the
  // caller shows in the visible input. The full formatted address rides
  // along as `address`, for the caller to store as background metadata
  // (not shown/editable in the field itself).
  async function resolve(suggestion) {
    suggestions.value = []
    loading.value = true
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/${suggestion.place}?fields=location,displayName,formattedAddress`,
        { headers: { 'X-Goog-Api-Key': MAPS_KEY } }
      )
      const place = await res.json()
      const name = place.displayName?.text?.trim()
      const address = place.formattedAddress?.trim() ?? ''
      return {
        text: name || address || suggestion.text.text,
        address,
        lat: place.location?.latitude ?? null,
        lng: place.location?.longitude ?? null,
      }
    } catch {
      return { text: suggestion.text.text, address: '', lat: null, lng: null }
    } finally {
      loading.value = false
    }
  }

  function clear() {
    suggestions.value = []
    cursor.value = -1
    clearTimeout(debounceTimer)
  }

  // ── Manual fallbacks — for venues Places search can't find ─────────────
  // Two more ways to attach real coordinates without a name match: the
  // admin's own device location, or a Maps link they paste in. Neither
  // touches the visible name text; only lat/lng (the caller decides what
  // to do with the result).
  const showManual = ref(false)
  const linkInput = ref('')
  const manualBusy = ref(false)
  const manualError = ref('')

  function toggleManual() {
    showManual.value = !showManual.value
    manualError.value = ''
  }

  async function useMyLocation() {
    manualError.value = ''
    if (!navigator.geolocation) {
      manualError.value = 'Geolocation is not supported on this device.'
      return null
    }
    manualBusy.value = true
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
      )
      return { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } catch (err) {
      manualError.value = err.code === 1 ? 'Location permission was denied.' : 'Could not get your location.'
      return null
    } finally {
      manualBusy.value = false
    }
  }

  async function useLinkInput() {
    manualError.value = ''
    const url = linkInput.value.trim()
    if (!url) return null

    const direct = extractCoordsFromUrl(url)
    if (direct) {
      linkInput.value = ''
      return direct
    }

    manualBusy.value = true
    try {
      const resolveMapsLink = httpsCallable(functions, 'resolveMapsLink')
      const res = await resolveMapsLink({ url })
      linkInput.value = ''
      return res.data
    } catch (err) {
      manualError.value = err.message || "Couldn't read that link."
      return null
    } finally {
      manualBusy.value = false
    }
  }

  return {
    suggestions, cursor, loading, search, resolve, clear,
    showManual, linkInput, manualBusy, manualError, toggleManual, useMyLocation, useLinkInput,
  }
}
