<template>
  <div class="eo-root">

    <div class="eo-main">
      <div class="eo-main-inner">
        <div class="eo-hub-head">
          <div class="eo-title-row">
            <button class="eo-back-btn" title="All events" @click="goAllEvents">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h1 class="eo-hero-title">{{ event?.title ?? '…' }}</h1>
          </div>
          <div class="eo-hub-icons">
            <button class="eo-icon-bare" title="Search">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button class="eo-avatar-circle" :title="currentUser?.displayName || currentUser?.email || 'Account'" @click="$router.push('/organization')">
              <img v-if="currentUser?.photoURL && !avatarBroken" :src="currentUser.photoURL" alt="" @error="avatarBroken = true" />
              <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
            </button>
            <button class="eo-icon-bare" title="Settings" @click="$router.push(`/event/${id}/settings`)">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0 1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0 1.51 1z"/></svg>
            </button>
          </div>
        </div>

        <div class="eo-hero-pills">
          <span class="eo-pill" v-if="formattedDate">
            <svg class="eo-pill-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ formattedDate }}
          </span>
          <span class="eo-pill" v-if="event?.location">
            <svg class="eo-pill-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ event.location }}
          </span>
          <span class="eo-pill" v-if="event?.contributionGoal">
            <svg class="eo-pill-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {{ formatMoney(event.contributionGoal) }} goal
          </span>
          <button class="eo-icon-sq" title="Copy link" @click="copyGuestLink">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
          <button class="eo-icon-sq" title="Open guest page" @click="openGuestPreview">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        </div>

        <div class="eo-launcher-grid">
          <button v-for="a in launcherItems" :key="a.label" class="eo-launcher-tile" @click="$router.push(a.to)">
            <div class="eo-launcher-ic" :style="{ background: a.bg }">
              <span class="eo-launcher-graphic" v-html="a.icon" />
              <span v-if="a.badge" class="eo-launcher-badge">{{ a.badge }}</span>
            </div>
            <span class="eo-launcher-lbl">
              {{ a.label }}
              <svg v-if="a.hasChevron" class="eo-chevron-down" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </button>
        </div>
      </div>
    </div>

    <aside class="eo-preview">
      <div class="eo-preview-tabs">
        <button
          class="eo-preview-tab"
          :class="{ 'eo-preview-tab--active': previewTab === 'website' }"
          @click="previewTab = 'website'"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Website
        </button>
        <button
          class="eo-preview-tab"
          :class="{ 'eo-preview-tab--active': previewTab === 'invitations' }"
          @click="previewTab = 'invitations'"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 7 12 13 2 7"/></svg>
          Invitations
        </button>
      </div>

      <div class="eo-preview-body">
        <div class="eo-collage" :class="previewTab === 'website' ? 'eo-collage--site' : 'eo-collage--invites'">
          <div class="eo-inv eo-inv--left">
            <span class="eo-inv-kicker">Save the Date</span>
            <span class="eo-inv-names">Our Day</span>
            <span class="eo-inv-orn">✦</span>
          </div>
          <div class="eo-inv eo-inv--mid">
            <span class="eo-inv-kicker">Together with their families</span>
            <span class="eo-inv-names eo-inv-names--lg">You're Invited</span>
            <span class="eo-inv-line" />
            <span class="eo-inv-date">{{ formattedDate || 'The celebration' }}</span>
          </div>
          <div class="eo-inv eo-inv--right">
            <span class="eo-inv-kicker">Details</span>
            <span class="eo-inv-names">RSVP</span>
            <span class="eo-inv-orn">❧</span>
          </div>
          <div class="eo-phone">
            <div class="eo-phone-notch" />
            <div class="eo-phone-screen">
              <span class="eo-phone-kicker">{{ previewTab === 'website' ? 'Website' : 'Invitation' }}</span>
              <span class="eo-phone-title">{{ event?.title ?? 'Haflaway' }}</span>
              <span class="eo-phone-btn">{{ previewTab === 'website' ? 'RSVP' : 'Open' }}</span>
            </div>
          </div>
        </div>

        <template v-if="previewTab === 'website'">
          <h3 class="eo-preview-title">Your Wedding Website, Ready to Share</h3>
          <p class="eo-preview-desc">Every guest gets a personalized RSVP page — view attendance, pledges, and check-ins in real time.</p>
          <button class="eo-preview-cta" @click="openGuestPreview">Preview Website</button>
        </template>
        <template v-else>
          <h3 class="eo-preview-title">Designs for Every Wedding Moment</h3>
          <p class="eo-preview-desc">Create Save the Dates and invitations that match your wedding website, then send them digitally or printed.</p>
          <button class="eo-preview-cta" @click="$router.push(`/event/${id}/invitations`)">Browse Cards</button>
        </template>
      </div>
    </aside>

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

const previewTab = ref('invitations')

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

function formatMoney(n) {
  if (!n) return 'TZS 0'
  return 'TZS ' + Number(n).toLocaleString()
}

const launcherItems = computed(() => [
  {
    label: 'Budget',
    to: `/event/${id.value}/budget`,
    bg: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><rect x="5" y="7" width="20" height="16" rx="3" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><rect x="5" y="7" width="20" height="4" rx="1" fill="#0d9488"/><rect x="17" y="13" width="7" height="4" rx="1" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/><circle cx="19" cy="15" r="1" fill="#ca8a04"/><line x1="8" y1="15" x2="13" y2="15" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="18" x2="11" y2="18" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    label: 'Guest List',
    hasChevron: true,
    to: `/event/${id.value}/attendees`,
    bg: 'linear-gradient(135deg, #5b54fa 0%, #3e38d6 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><rect x="6" y="4" width="18" height="22" rx="3" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><rect x="8" y="6" width="14" height="4.5" rx="1.5" fill="#3e38d6"/><circle cx="10.5" cy="15" r="1.8" fill="#5b54fa"/><rect x="14" y="14" width="7.5" height="2" rx="1" fill="#cbd5e1"/><circle cx="10.5" cy="20" r="1.8" fill="#5b54fa"/><rect x="14" y="19" width="7.5" height="2" rx="1" fill="#cbd5e1"/></svg>`,
  },
  {
    label: 'Contact List',
    to: `/event/${id.value}/contacts`,
    bg: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><rect x="6" y="5" width="18" height="20" rx="3" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><rect x="12" y="3.5" width="6" height="2" rx="1" fill="#cbd5e1"/><circle cx="15" cy="12" r="3.2" fill="#3b82f6"/><path d="M10.5 20c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" fill="#3b82f6"/></svg>`,
  },
  {
    label: 'Check-ins',
    hasChevron: true,
    to: `/event/${id.value}/checkins`,
    bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="10" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><path d="M10.5 15l3.2 3.5 6-7" stroke="#1f2937" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    label: 'Cards',
    hasChevron: true,
    to: `/event/${id.value}/cards`,
    bg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><rect x="10" y="5" width="14" height="17" rx="2" fill="#d1fae5" transform="rotate(7 17 13.5)" stroke="#a7f3d0" stroke-width="0.8"/><rect x="6" y="7" width="15" height="18" rx="2" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><line x1="9" y1="12" x2="18" y2="12" stroke="#059669" stroke-width="1.4" stroke-linecap="round"/><line x1="9" y1="16" x2="16" y2="16" stroke="#6ee7b7" stroke-width="1.2" stroke-linecap="round"/><circle cx="15" cy="20" r="1.2" fill="#059669"/></svg>`,
  },
  {
    label: 'Invitations',
    to: `/event/${id.value}/invitations`,
    bg: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><rect x="5" y="10" width="20" height="14" rx="2" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><rect x="7" y="6" width="16" height="8" rx="1.5" fill="#fef08a" stroke="#facc15" stroke-width="0.8"/><circle cx="15" cy="9" r="1.5" fill="#ca8a04"/><path d="M5 11l10 7 10-7" stroke="#0891b2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    label: 'Bulk Messages',
    hasChevron: true,
    to: `/event/${id.value}/bulk-messages`,
    bg: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><path d="M6 14c0-4.4 4-8 9-8s9 3.6 9 8-4 8-9 8c-1.4 0-2.8-.3-4-.8L6 22l.8-3.4C6.3 17.2 6 15.6 6 14z" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><circle cx="11.5" cy="14" r="1.4" fill="#16a34a"/><circle cx="15" cy="14" r="1.4" fill="#16a34a"/><circle cx="18.5" cy="14" r="1.4" fill="#16a34a"/></svg>`,
  },
  {
    label: 'Gallery',
    to: `/event/${id.value}/gallery`,
    bg: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><rect x="6" y="5" width="18" height="20" rx="2" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><rect x="8" y="7" width="14" height="12" rx="1" fill="#fce7f3"/><circle cx="11" cy="10.5" r="1.5" fill="#fb7185"/><path d="M8 17l4-4 3 3 2-2 5 5H8z" fill="#e11d48"/></svg>`,
  },
  {
    label: 'Gifts of Love',
    to: `/event/${id.value}/zawadi`,
    bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><rect x="6" y="11" width="18" height="14" rx="2" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><rect x="5" y="9" width="20" height="4" rx="1.5" fill="#ffffff" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.08))"/><rect x="13.5" y="9" width="3" height="16" fill="#f43f5e"/><path d="M12.5 7c-1.5-2-3.5 0-1 2 2 1.6 3.5.5 3.5.5s1.5 1.1 3.5-.5c2.5-2 .5-4-1-2-1.3 1.7-2.5 2-2.5 2s-1.2-.3-2.5-2z" fill="#f43f5e"/></svg>`,
  },
  {
    label: 'Payments',
    to: `/event/${id.value}/payments`,
    bg: 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><rect x="5" y="8" width="18" height="12" rx="2" fill="#ffffff" filter="drop-shadow(0 1.5px 3px rgba(0,0,0,0.12))"/><rect x="5" y="11" width="18" height="3" fill="#ca8a04"/><circle cx="19" cy="18" r="5" fill="#fbbf24" stroke="#b45309" stroke-width="0.8" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"/><text x="17.2" y="20.5" font-size="6.5" font-weight="700" fill="#78350f" font-family="sans-serif">$</text></svg>`,
  },
  {
    label: 'Team',
    to: `/event/${id.value}/team`,
    bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    icon: `<svg width="28" height="28" viewBox="0 0 30 30" fill="none"><circle cx="12" cy="11" r="3.5" fill="#ffffff" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.1))"/><path d="M6 21c0-3.3 2.7-5 6-5s6 1.7 6 5" fill="#ffffff" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.1))"/><circle cx="20" cy="12" r="2.8" fill="#ddd6fe"/><path d="M16 21c.3-1.8 1.8-3.2 4-3.2 1.5 0 2.8.7 3.5 1.8" fill="#ddd6fe"/></svg>`,
  },
])

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
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #ffffff;
  color: #1f2937;
}

.eo-main {
  flex: 1;
  min-width: 0;
  padding: 40px 36px 64px 48px;
  display: flex;
  flex-direction: column;
}

.eo-main-inner {
  width: 100%;
  max-width: 580px;
}

.eo-hub-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 14px;
  gap: 12px;
}

.eo-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.eo-hero-title {
  margin: 0;
  font-family: 'Cormorant Garamond', 'Playfair Display', Didot, Georgia, serif;
  font-weight: 500;
  font-size: clamp(20px, 2vw, 28px);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1a1a1a;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eo-back-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: all 130ms ease;
}

.eo-back-btn:hover {
  color: #111827;
  background: #f9fafb;
  border-color: #d1d5db;
}

.eo-hub-icons {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.eo-icon-bare {
  width: 34px;
  height: 34px;
  border: none;
  background: none;
  color: #4b5563;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 0;
  transition: all 130ms ease;
}

.eo-icon-bare:hover {
  color: #111827;
  background: rgba(0, 0, 0, 0.04);
}

.eo-avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: 1.5px solid #e5e7eb;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  transition: all 130ms ease;
}

.eo-avatar-circle:hover {
  border-color: #d1d5db;
}

.eo-avatar-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.eo-hero-pills {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  margin-bottom: 34px;
}

.eo-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 260px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  font-weight: 450;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.eo-pill-icon {
  color: #6b7280;
  flex-shrink: 0;
}

.eo-icon-sq {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: all 130ms ease;
}

.eo-icon-sq:hover {
  color: #111827;
  background: #f9fafb;
  border-color: #d1d5db;
}

.eo-launcher-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  row-gap: 28px;
  column-gap: 20px;
  width: 100%;
  max-width: 580px;
}

.eo-launcher-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 8px;
  background: none;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: background 140ms ease, transform 140ms ease;
}

.eo-launcher-tile:hover {
  background: #f7f7f8;
}

.eo-launcher-ic {
  position: relative;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 160ms ease;
}

.eo-launcher-tile:hover .eo-launcher-ic {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.eo-launcher-graphic {
  display: flex;
  align-items: center;
  justify-content: center;
}

.eo-launcher-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: #2563eb;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
  line-height: 1.2;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
}

.eo-launcher-lbl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13.5px;
  font-weight: 500;
  color: #262626;
  text-align: center;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.eo-chevron-down {
  color: #71717a;
  transition: color 140ms ease;
}

.eo-launcher-tile:hover .eo-chevron-down {
  color: #18181b;
}

.eo-preview {
  width: 45%;
  flex-shrink: 0;
  background: #f8f8f9;
  border-left: 1px solid #f0f0f2;
  padding: 40px 48px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.eo-preview-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 9999px;
  background: #e9eaee;
  margin-bottom: 24px;
}

.eo-preview-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 20px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: #64748b;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 140ms ease;
}

.eo-preview-tab--active {
  background: #ffffff;
  color: #1e293b;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.eo-preview-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  margin-top: auto;
  margin-bottom: auto;
}

.eo-collage {
  position: relative;
  width: 100%;
  max-width: 360px;
  height: 240px;
  margin: 0 auto 24px;
}

.eo-inv {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 4px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
}

.eo-inv--left {
  width: 122px;
  height: 166px;
  left: 3%;
  top: 24px;
  background: #faf7f2;
  border: 1px solid #efe8db;
  color: #5c4d43;
  transform: rotate(-9deg);
  z-index: 1;
}

.eo-inv--mid {
  width: 138px;
  height: 186px;
  left: 48%;
  top: 4px;
  background: #fff5f6;
  border: 1px solid #fee8eb;
  color: #4a2e35;
  transform: translateX(-56%) rotate(2deg);
  z-index: 2;
}

.eo-inv--right {
  width: 114px;
  height: 154px;
  right: 15%;
  top: 32px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #334155;
  transform: rotate(10deg);
  z-index: 1;
}

.eo-inv-kicker {
  font-size: 7.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.7;
}

.eo-inv-names {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 15px;
  font-style: italic;
  line-height: 1.1;
}

.eo-inv-names--lg {
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
}

.eo-inv-orn { font-size: 12px; opacity: 0.45; }
.eo-inv-line { width: 28px; height: 1px; background: rgba(74, 46, 53, 0.22); margin: 3px 0; }
.eo-inv-date { font-size: 8.5px; letter-spacing: 0.04em; opacity: 0.7; }

.eo-phone {
  position: absolute;
  right: 3%;
  bottom: -4px;
  width: 90px;
  height: 176px;
  background: #18181b;
  border-radius: 17px;
  padding: 7px 5px 5px;
  z-index: 4;
  box-shadow: 0 16px 34px rgba(0,0,0,0.18);
}

.eo-phone-notch {
  width: 28px;
  height: 3.5px;
  border-radius: 4px;
  background: #3f3f46;
  margin: 0 auto 5px;
}

.eo-phone-screen {
  height: calc(100% - 9px);
  border-radius: 11px;
  background: linear-gradient(180deg, #faf7f2, #f5efe6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 6px;
  color: #2c241c;
}

.eo-phone-kicker { font-size: 6.5px; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.55; }

.eo-phone-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 9px;
  line-height: 1.2;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.eo-phone-btn {
  margin-top: 3px;
  font-size: 7.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: #18181b;
  color: #fff;
  padding: 3.5px 9px;
  border-radius: 9999px;
}

.eo-preview-title {
  margin: 0 0 10px 0;
  font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  font-size: 26px;
  color: #1a1a1a;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.eo-preview-desc {
  margin: 0 auto 26px auto;
  max-width: 36ch;
  font-size: 14px;
  color: #64748b;
  line-height: 1.55;
}

.eo-preview-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 40px;
  border-radius: 9999px;
  border: none;
  background: #242424;
  color: #ffffff;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transition: all 150ms ease;
}

.eo-preview-cta:hover {
  background: #000000;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
}

@media (max-width: 980px) {
  .eo-root { flex-direction: column; min-height: auto; }
  .eo-preview { width: 100%; order: -1; min-height: auto; padding: 28px 24px 34px; border-left: none; border-bottom: 1px solid #f0f0f2; }
  .eo-main { padding: 24px 20px 48px; }
  .eo-main-inner { max-width: none; }
  .eo-launcher-grid { max-width: none; }
}

@media (max-width: 640px) {
  .eo-hero-title { font-size: 22px; letter-spacing: 0.06em; }
  .eo-launcher-grid { gap: 20px 8px; }
  .eo-launcher-ic { width: 52px; height: 52px; }
  .eo-preview-title { font-size: 20px; }
}

@media (max-width: 380px) {
  .eo-launcher-grid { grid-template-columns: 1fr 1fr; }
}
</style>
