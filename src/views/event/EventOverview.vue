<template>
  <div class="eo-root">

    <!-- ══ Hub head: back + title + icon cluster ══ -->
    <div class="eo-hub-head">
      <button class="eo-back-circle" title="All events" @click="goAllEvents">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1 class="eo-hero-title">{{ event?.title ?? '…' }}</h1>
      <div class="eo-hub-icons">
        <button class="eo-icon-circle" title="Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button class="eo-avatar-circle" :title="currentUser?.displayName || currentUser?.email || 'Account'" @click="$router.push('/organization')">
          <img v-if="currentUser?.photoURL && !avatarBroken" :src="currentUser.photoURL" alt="" @error="avatarBroken = true" />
          <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
        </button>
        <button class="eo-icon-circle" title="Settings" @click="$router.push(`/event/${id}/settings`)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </div>

    <!-- ══ Pills + share ══ -->
    <div class="eo-hero-pills">
      <span class="eo-pill" v-if="formattedDate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        {{ formattedDate }}
      </span>
      <span class="eo-pill" v-if="event?.location">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {{ event.location }}
      </span>
      <span class="eo-pill eo-pill--gold" v-if="event?.contributionGoal">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        {{ formatMoney(event.contributionGoal) }} goal
      </span>
      <div class="eo-pills-spacer" />
      <button class="eo-icon-circle" title="Copy link" @click="copyGuestLink">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      </button>
      <button class="eo-icon-circle" title="Open guest page" @click="openGuestPreview">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </button>
    </div>

    <!-- ══ Hub body: launcher grid + preview panel ══ -->
    <div class="eo-hub-body">
      <div class="eo-launcher-grid">
        <button v-for="a in launcherItems" :key="a.label" class="eo-launcher-tile" @click="$router.push(a.to)">
          <div class="eo-launcher-ic" :style="{ background: a.bg }" v-html="a.icon" />
          <span class="eo-launcher-lbl">{{ a.label }}</span>
        </button>
      </div>

      <!-- Preview panel -->
      <div class="eo-preview">
        <div class="eo-preview-tabs">
          <button
            class="eo-preview-tab"
            :class="{ 'eo-preview-tab--active': previewTab === 'website' }"
            @click="previewTab = 'website'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Guest Page
          </button>
          <button
            class="eo-preview-tab"
            :class="{ 'eo-preview-tab--active': previewTab === 'invitations' }"
            @click="previewTab = 'invitations'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Invitations
          </button>
        </div>

        <div class="eo-preview-body">
          <div class="eo-preview-cards">
            <span class="eo-pcard eo-pcard--1" />
            <span class="eo-pcard eo-pcard--2" />
            <span class="eo-pcard eo-pcard--3" />
          </div>

          <template v-if="previewTab === 'website'">
            <h3 class="eo-preview-title">Your Guest Page, Ready to Share</h3>
            <p class="eo-preview-desc">Every guest gets a personal RSVP page — see who's confirmed, pledged and checked in, in real time.</p>
            <button class="eo-preview-cta" @click="openGuestPreview">Preview Guest Page</button>
          </template>
          <template v-else>
            <h3 class="eo-preview-title">Send Beautiful Invitations</h3>
            <p class="eo-preview-desc">Design and send digital invitations by WhatsApp, SMS or link — track opens and RSVPs as they come in.</p>
            <button class="eo-preview-cta" @click="$router.push(`/event/${id}/invitations`)">Open Invitations</button>
          </template>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../../firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { useTheme } from '../../composables/useTheme.js'
import { useOrg } from '../../composables/useOrg.js'

const { isDark } = useTheme()
const { currentUser } = useOrg()
const avatarBroken = ref(false)

const props = defineProps({ event: Object, eventId: String })
const route  = useRoute()
const router = useRouter()
const id = computed(() => props.eventId ?? route.params.eventId)

const stats = ref({ attendees: 0, checkins: 0, totalContributions: 0, totalPledged: 0, admins: 0 })
const rsvp  = ref({ confirmed: 0, pending: 0, declined: 0 })
const firstAttendeeId = ref(null)

// ── Hub head ──────────────────────────────────────────────────────────────────
const previewTab = ref('website')

// Mirrors EventLayout's goAllEvents so the hub page (which hides the sidebar)
// still restores whichever My Events page/tab the admin was on.
function goAllEvents() {
  const page = parseInt(localStorage.getItem('haflaway:myEventsPage'))
  const filter = localStorage.getItem('haflaway:myEventsFilter')
  const query = {}
  if (page > 1) query.page = page
  if (filter && filter !== 'all') query.filter = filter
  router.push({ path: '/events', query })
}

function guestPreviewUrl() {
  if (!firstAttendeeId.value) return null
  return `${window.location.origin}/events/${id.value}/${firstAttendeeId.value}`
}

function openGuestPreview() {
  const url = guestPreviewUrl()
  if (url) window.open(url, '_blank')
  else router.push(`/event/${id.value}/attendees`)
}

async function copyGuestLink() {
  const url = guestPreviewUrl()
  if (!url) { router.push(`/event/${id.value}/attendees`); return }
  try { await navigator.clipboard.writeText(url) } catch (e) { console.error('copyGuestLink:', e) }
}

// ── Computed ──────────────────────────────────────────────────────────────────
const checkinRate = computed(() => {
  if (!stats.value.attendees) return 0
  return Math.min(100, Math.round((stats.value.checkins / stats.value.attendees) * 100))
})

const progressPct = computed(() => {
  const goal = props.event?.contributionGoal ?? 0
  if (!goal) return 0
  return Math.min(100, Math.round((stats.value.totalContributions / goal) * 100))
})

const arcC      = computed(() => 2 * Math.PI * 48)
const arcOffset = computed(() => arcC.value * (1 - progressPct.value / 100))

const formattedDate = computed(() => {
  const d = props.event?.startDate
  if (!d) return null
  const date = d.toDate ? d.toDate() : new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
})

function rsvpPct(n) {
  if (!stats.value.attendees) return 0
  return Math.round((n / stats.value.attendees) * 100)
}

// ── Formatters ────────────────────────────────────────────────────────────────
function formatMoney(n) {
  if (!n) return 'TZS 0'
  return 'TZS ' + Number(n).toLocaleString()
}

// ── Launcher grid ─────────────────────────────────────────────────────────────
// One big colorful icon-tile per section, mirroring a withjoy-style dashboard
// launcher. bg values are gradients so each tile reads as a distinct "app icon."
const launcherItems = computed(() => [
  { label: 'Budget',         to: `/event/${id.value}/budget`,        bg: 'linear-gradient(135deg,#14b8a6,#0d9488)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>` },
  { label: 'Guest List',     to: `/event/${id.value}/attendees`,     bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { label: 'Contact List',   to: `/event/${id.value}/contacts`,      bg: 'linear-gradient(135deg,#f59e0b,#d97706)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
  { label: 'Check-ins',      to: `/event/${id.value}/checkins`,      bg: 'linear-gradient(135deg,#22c55e,#16a34a)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` },
  { label: 'Cards',          to: `/event/${id.value}/cards`,         bg: 'linear-gradient(135deg,#f43f5e,#e11d48)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>` },
  { label: 'Invitations',    to: `/event/${id.value}/invitations`,  bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
  { label: 'Bulk Messages',  to: `/event/${id.value}/bulk-messages`, bg: 'linear-gradient(135deg,#f97316,#ea580c)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>` },
  { label: 'Gallery',        to: `/event/${id.value}/gallery`,       bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>` },
  { label: 'Gifts of Love',  to: `/event/${id.value}/zawadi`,        bg: 'linear-gradient(135deg,#ec4899,#db2777)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5" rx="1"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>` },
  { label: 'Payments',       to: `/event/${id.value}/payments`,      bg: 'linear-gradient(135deg,#dcb862,#C9A84C)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
  { label: 'Team',           to: `/event/${id.value}/team`,          bg: 'linear-gradient(135deg,#6366f1,#4f46e5)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>` },
  { label: 'Settings',       to: `/event/${id.value}/settings`,      bg: 'linear-gradient(135deg,#64748b,#475569)', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
])

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadStats() {
  if (!id.value) return
  try {
    const [attSnap, checkinSnap, paySnap] = await Promise.all([
      getDocs(query(collection(db, 'events', id.value, 'attendees'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'events', id.value, 'checkIns'))),
      getDocs(query(collection(db, 'events', id.value, 'contributions'))),
    ])
    const atts = attSnap.docs.map(d => d.data())
    firstAttendeeId.value = attSnap.docs[0]?.id ?? null
    const confirmed = atts.filter(a => a.attendanceStatus === 'Confirmed').length
    const declined  = atts.filter(a => a.attendanceStatus === 'Declined').length
    const pending   = atts.length - confirmed - declined
    const totalPledged = atts.reduce((s, a) => s + (a.pledgedAmount ?? 0), 0)
    const totalContributions = paySnap.docs.reduce((s, d) => s + (d.data().amount ?? 0), 0)

    rsvp.value = { confirmed, pending, declined }
    stats.value = {
      attendees: atts.length,
      checkins: checkinSnap.size,
      totalContributions,
      totalPledged,
      admins: props.event?.adminsIds?.length ?? 1,
    }
  } catch (e) {
    console.error('loadStats:', e)
  }
}

onMounted(loadStats)
watch(() => props.event, loadStats)
</script>

<style scoped>
.eo-root {
  /* ── Theme tokens (light values applied via global CSS on [data-theme="light"] .eo-root) ── */
  --c-bg:     #141414;
  --c-border: #2a2a2a;
  --c-track:  #2a2a2a;
  --c-muted:  #3a3a3a;
  --c-txt:    #f0f0ec;
  --c-txt-2:  #888;
  --c-txt-3:  #555;
  --c-divide: #2a2a2a;
  --c-arrow:  #3a3a3a;

  padding: 20px 24px 56px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  transition: background 300ms ease;
}

/* ══ Hub head ══ */
.eo-hub-head { display: flex; align-items: center; gap: 14px; padding: 6px 2px 0; }
.eo-hero-title {
  margin: 0; flex: 1; min-width: 0;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 500;
  font-size: 34px;
  letter-spacing: -0.2px;
  color: var(--c-txt);
  line-height: 1.15;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.eo-hub-icons { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.eo-back-circle, .eo-icon-circle, .eo-avatar-circle {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--c-bg); border: 1px solid var(--c-border);
  color: var(--c-txt-2); cursor: pointer; font-family: inherit; padding: 0;
  transition: color 130ms, background 130ms, border-color 130ms;
}
.eo-back-circle:hover, .eo-icon-circle:hover { color: var(--c-txt); background: var(--c-hover, var(--c-bg)); }

.eo-avatar-circle {
  overflow: hidden;
  font-size: 12px; font-weight: 700; color: var(--c-txt-2);
  background: var(--c-track);
}
.eo-avatar-circle img { width: 100%; height: 100%; object-fit: cover; }

/* ══ Pills row ══ */
.eo-hero-pills { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 16px 2px 4px; }
.eo-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 999px;
  background: var(--c-bg); border: 1px solid var(--c-border);
  font-size: 13.5px; font-weight: 500; color: var(--c-txt-2);
}
.eo-pill--gold { color: var(--gold); border-color: rgb(from var(--gold) r g b / 0.3); }
.eo-pills-spacer { flex: 1; }

/* ══ Hub body: launcher grid + preview panel ══ */
.eo-hub-body { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; align-items: stretch; }

.eo-launcher-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
  align-content: start;
}
.eo-launcher-tile {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 20px 10px; background: var(--c-bg); border: 1px solid var(--c-border);
  border-radius: 16px; cursor: pointer; font-family: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: box-shadow 150ms, transform 150ms, background 300ms ease, border-color 300ms ease;
}
.eo-launcher-tile:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  transform: translateY(-2px);
  background: var(--c-hover, var(--c-bg));
}
.eo-launcher-ic {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.18);
}
.eo-launcher-lbl { font-size: 13px; font-weight: 600; color: var(--c-txt); text-align: center; }

/* ══ Preview panel ══ */
.eo-preview {
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 20px;
  padding: 16px; display: flex; flex-direction: column; gap: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.eo-preview-tabs {
  display: flex; gap: 3px; padding: 3px; border-radius: 14px;
  background: var(--c-track);
}
.eo-preview-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 10px; border-radius: 11px; border: none; cursor: pointer;
  background: transparent; color: var(--c-txt-2); font-family: inherit;
  font-size: 12.5px; font-weight: 600; white-space: nowrap;
  transition: background 130ms, color 130ms, box-shadow 130ms;
}
.eo-preview-tab--active {
  background: var(--c-bg); color: var(--c-txt);
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}
.eo-preview-body { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; flex: 1; }
.eo-preview-cards { position: relative; width: 100%; height: 108px; margin-bottom: 6px; }
.eo-pcard {
  position: absolute; top: 6px; left: 50%; width: 92px; height: 100px; border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
}
.eo-pcard--1 { background: linear-gradient(160deg,#fde68a,#f59e0b); transform: translateX(-50%) rotate(-10deg) translateX(-34px); }
.eo-pcard--2 { background: linear-gradient(160deg,#fecdd3,#f43f5e); transform: translateX(-50%) rotate(4deg); z-index: 1; }
.eo-pcard--3 { background: linear-gradient(160deg,#a5b4fc,#6366f1); transform: translateX(-50%) rotate(15deg) translateX(34px); }
.eo-preview-title { margin: 0; font-family: 'Playfair Display', Georgia, serif; font-weight: 600; font-size: 17px; color: var(--c-txt); line-height: 1.3; }
.eo-preview-desc { margin: 0; font-size: 12.5px; color: var(--c-txt-2); line-height: 1.5; }
.eo-preview-cta {
  margin-top: auto; width: 100%; padding: 11px 14px; border-radius: 12px; border: none;
  background: var(--c-txt); color: var(--c-bg); font-family: inherit;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: opacity 130ms;
}
.eo-preview-cta:hover { opacity: 0.85; }

/* ══ Section header ══ */
.eo-section-hd { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
.eo-section-title {
  font-family: 'Playfair Display', Georgia, serif; font-style: italic;
  font-size: 15px; color: var(--c-txt); white-space: nowrap;
}
.eo-nav-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--c-arrow), transparent); }

/* ══ KPI row ══ */
.eo-kpi-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
}
.eo-kpi {
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 14px;
  padding: 16px 18px; display: flex; flex-direction: column; gap: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}
.eo-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.eo-kpi-lbl { font-size: 11px; font-weight: 600; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.6px; }
.eo-kpi-ic {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.eo-kpi-num {
  font-size: 32px; font-weight: 700; color: var(--c-txt); letter-spacing: -0.5px; line-height: 1;
}
.eo-kpi-num--sm { font-size: 22px; letter-spacing: -0.3px; }
.eo-kpi-sub {
  font-size: 11px; color: var(--c-txt-3); display: flex; align-items: center; gap: 5px;
}

/* Segmented bar (guests) */
.eo-kpi-seg-bar {
  display: flex; height: 4px; border-radius: 3px; overflow: hidden; gap: 1.5px; margin: 2px 0;
}
.eo-seg { border-radius: 3px; min-width: 2px; }
.eo-seg--confirmed { background: #34d399; }
.eo-seg--pending   { background: var(--c-muted); }
.eo-seg--declined  { background: #FF453A; }

/* Linear bar (checkins, contributions) */
.eo-kpi-bar-track {
  height: 4px; background: var(--c-track); border-radius: 3px; overflow: hidden; margin: 2px 0;
}
.eo-kpi-bar-fill {
  height: 100%; border-radius: 3px; transition: width 600ms ease; min-width: 2px;
}

/* Status dots */
.eo-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.eo-dot--confirmed { background: #34d399; }
.eo-dot--pending   { background: var(--c-txt-3); }
.eo-dot--declined  { background: #FF453A; }
.eo-dot--checkin   { background: #007AFF; }

.eo-kpi-cta {
  margin-top: 4px; background: none; border: none; padding: 0; font-size: 11.5px;
  font-weight: 600; color: var(--gold); cursor: pointer; font-family: inherit; text-align: left;
  transition: opacity 120ms;
}
.eo-kpi-cta:hover { opacity: 0.7; }

/* ══ Mid row ══ */
.eo-mid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.eo-panel {
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 16px; padding: 22px 22px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}
.eo-panel-hd {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;
}
.eo-panel-title {
  font-size: 16px; font-weight: 700; color: var(--c-txt);
}
.eo-panel-mono {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--c-txt-2);
}

/* Goal arc */
.eo-goal-body { display: flex; align-items: center; gap: 24px; }
.eo-arc-wrap { flex-shrink: 0; width: 130px; }
.eo-arc-svg { width: 100%; display: block; }
.eo-goal-stats { flex: 1; display: flex; flex-direction: column; gap: 0; }
.eo-gstat { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; }
.eo-gstat-lbl { font-size: 11.5px; color: var(--c-txt-2); }
.eo-gstat-val { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: var(--c-txt); }
.eo-gstat-val--gold { color: var(--gold); }
.eo-gstat-divider { height: 1px; background: var(--c-divide); }

/* RSVP panel */
.eo-rsvp-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
.eo-rsvp-row { display: flex; align-items: center; gap: 9px; }
.eo-rsvp-lbl { font-size: 12px; color: var(--c-txt-2); width: 76px; flex-shrink: 0; }
.eo-rsvp-track {
  flex: 1; height: 5px; background: var(--c-track); border-radius: 3px; overflow: hidden;
}
.eo-rsvp-fill { height: 100%; border-radius: 3px; transition: width 600ms ease; min-width: 2px; }
.eo-rsvp-n { font-size: 12px; font-weight: 600; color: var(--c-txt); width: 28px; text-align: right; flex-shrink: 0; }
.eo-rsvp-divider { height: 1px; background: var(--c-divide); margin: 4px 0; }

.eo-stack-bar {
  display: flex; height: 7px; border-radius: 5px; overflow: hidden; gap: 2px;
}
.eo-stack-seg { border-radius: 5px; min-width: 3px; transition: flex 600ms ease; }
.eo-seg--pending-stack { background: #3a3a3a; }

/* ══ Responsive ══ */
@media (max-width: 860px) {
  .eo-kpi-row { grid-template-columns: repeat(2, 1fr); }
  .eo-mid-row { grid-template-columns: 1fr; }
  .eo-hub-body { grid-template-columns: 1fr; }
  .eo-launcher-grid { grid-template-columns: repeat(3, 1fr); order: 2; }
  .eo-preview { order: 1; }
}

@media (max-width: 640px) {
  /* Panel header: wrap when the mono subtitle is long */
  .eo-panel-hd { flex-wrap: wrap; gap: 6px; }
  .eo-panel-title { flex: 1 1 auto; min-width: 0; }
  .eo-panel-mono  { flex: 0 0 auto; }

  /* Goal arc: ensure it never overflows its container */
  .eo-arc-svg { width: 100%; max-width: 100%; }

  /* Section header line needs a floor so it doesn't collapse */
  .eo-nav-line { min-width: 0; }

  .eo-hero-title { font-size: 26px; }
}

@media (max-width: 560px) {
  .eo-root { padding: 14px 14px 40px; gap: 12px; }

  /* KPI cards: tighter padding + smaller numbers */
  .eo-kpi-row { grid-template-columns: 1fr 1fr; gap: 9px; }
  .eo-kpi { padding: 13px 14px; gap: 4px; }
  .eo-kpi-num { font-size: 26px; }
  .eo-kpi-num--sm { font-size: 18px; letter-spacing: -0.2px; }
  .eo-kpi-lbl { font-size: 10px; }
  .eo-kpi-sub { font-size: 10px; }
  .eo-kpi-ic { width: 24px; height: 24px; border-radius: 7px; }
  .eo-kpi-cta { font-size: 11px; }

  /* Mid panels */
  .eo-panel { padding: 15px 14px; }
  .eo-panel-hd { margin-bottom: 14px; }

  /* Goal panel stacked */
  .eo-goal-body { flex-direction: column; align-items: center; gap: 14px; }
  .eo-arc-wrap { width: 110px; }
  .eo-goal-stats { width: 100%; }

  /* RSVP: tighten label column */
  .eo-rsvp-lbl { width: 66px; font-size: 11.5px; }
  .eo-rsvp-n   { font-size: 11.5px; }
  .eo-rsvp-list { gap: 10px; }

  /* Launcher grid */
  .eo-launcher-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .eo-launcher-tile { padding: 15px 8px; gap: 8px; }
  .eo-launcher-ic   { width: 42px; height: 42px; }
  .eo-launcher-lbl  { font-size: 11.5px; }
}

/* Very small phones (iPhone SE, Galaxy A-series) */
@media (max-width: 380px) {
  .eo-root { padding: 10px 10px 36px; gap: 10px; }

  /* Single-column KPI stack */
  .eo-kpi-row { grid-template-columns: 1fr; gap: 8px; }
  .eo-kpi { flex-direction: row; flex-wrap: wrap; align-items: center; padding: 12px 13px; gap: 4px 10px; }
  .eo-kpi-top { width: 100%; }
  .eo-kpi-num { font-size: 28px; }
  .eo-kpi-num--sm { font-size: 20px; }
  .eo-kpi-seg-bar,
  .eo-kpi-bar-track { width: 100%; }
  .eo-kpi-sub { width: 100%; }
  .eo-kpi-cta { width: 100%; }

  /* Launcher: two columns */
  .eo-launcher-grid { grid-template-columns: 1fr 1fr; gap: 7px; }

  /* Panels */
  .eo-panel { padding: 13px 12px; }
  .eo-arc-wrap { width: 100px; }
}
</style>
