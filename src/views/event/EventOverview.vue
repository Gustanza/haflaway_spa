<template>
  <div class="eo-root">
    <!-- KPI row -->
    <div class="eo-kpi-row">
      <div class="eo-kpi-card">
        <div class="eo-kpi-top">
          <span class="eo-kpi-label">Attendees</span>
          <div class="eo-kpi-icon eo-kpi-icon--blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
        </div>
        <span class="eo-kpi-num">{{ stats.attendees }}</span>
        <span class="eo-kpi-sub">Total invited</span>
      </div>

      <div class="eo-kpi-card">
        <div class="eo-kpi-top">
          <span class="eo-kpi-label">Check-ins</span>
          <div class="eo-kpi-icon eo-kpi-icon--green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <span class="eo-kpi-num">{{ stats.checkins }}</span>
        <span class="eo-kpi-sub">{{ checkinRate }}% check-in rate</span>
      </div>

      <div class="eo-kpi-card">
        <div class="eo-kpi-top">
          <span class="eo-kpi-label">Contributions</span>
          <div class="eo-kpi-icon eo-kpi-icon--gold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>
        <span class="eo-kpi-num">{{ formatMoney(stats.totalContributions) }}</span>
        <span class="eo-kpi-sub">Total collected</span>
      </div>

      <div class="eo-kpi-card">
        <div class="eo-kpi-top">
          <span class="eo-kpi-label">Team</span>
          <div class="eo-kpi-icon eo-kpi-icon--purple">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
        </div>
        <span class="eo-kpi-num">{{ stats.admins }}</span>
        <span class="eo-kpi-sub">Admins &amp; scanners</span>
      </div>
    </div>

    <!-- Contributions progress + Event date -->
    <div class="eo-mid-row">
      <!-- Contributions progress -->
      <div class="eo-panel eo-panel--contributions">
        <div class="eo-panel-head">
          <span class="eo-panel-title">Contributions Goal</span>
          <span class="eo-panel-badge">{{ formatMoney(stats.totalContributions) }} / {{ formatMoney(event?.contributionGoal ?? 0) }}</span>
        </div>
        <div class="eo-progress-track">
          <div class="eo-progress-fill" :style="{ width: progressPct + '%' }" />
        </div>
        <p class="eo-progress-sub">{{ progressPct }}% of goal reached</p>
      </div>

      <!-- Event date countdown / info -->
      <div class="eo-panel eo-panel--date">
        <div class="eo-date-badge-big">
          <span class="eo-date-month">{{ formatMonth(event?.eventDate) }}</span>
          <span class="eo-date-day">{{ formatDay(event?.eventDate) }}</span>
          <span class="eo-date-year">{{ formatYear(event?.eventDate) }}</span>
        </div>
        <div class="eo-date-info">
          <p class="eo-date-label">{{ event?.eventName ?? '…' }}</p>
          <p class="eo-date-loc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {{ event?.location ?? 'Location TBD' }}
          </p>
          <p class="eo-date-countdown" v-if="daysUntil !== null">
            {{ daysUntil > 0 ? `${daysUntil} days away` : daysUntil === 0 ? 'Today!' : `${Math.abs(daysUntil)} days ago` }}
          </p>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="eo-section-title">Quick Access</div>
    <div class="eo-quick-grid">
      <button v-for="action in quickActions" :key="action.label" class="eo-quick-card" @click="$router.push(action.to)">
        <div class="eo-quick-icon" :style="{ background: action.bg }">
          <span v-html="action.icon" />
        </div>
        <span class="eo-quick-label">{{ action.label }}</span>
        <svg class="eo-quick-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../../firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

const props = defineProps({
  event: Object,
  eventId: String,
})

const route = useRoute()
const router = useRouter()
const id = computed(() => props.eventId ?? route.params.eventId)

const stats = ref({ attendees: 0, checkins: 0, totalContributions: 0, admins: 0 })

const checkinRate = computed(() => {
  if (!stats.value.attendees) return 0
  return Math.round((stats.value.checkins / stats.value.attendees) * 100)
})

const progressPct = computed(() => {
  const goal = props.event?.contributionGoal ?? 0
  if (!goal) return 0
  return Math.min(100, Math.round((stats.value.totalContributions / goal) * 100))
})

const daysUntil = computed(() => {
  if (!props.event?.eventDate) return null
  const d = props.event.eventDate.toDate ? props.event.eventDate.toDate() : new Date(props.event.eventDate)
  const now = new Date()
  return Math.round((d - now) / 86400000)
})

function formatMoney(n) {
  if (!n) return 'TZS 0'
  return 'TZS ' + Number(n).toLocaleString()
}
function formatMonth(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en', { month: 'short' }).toUpperCase()
}
function formatDay(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.getDate()
}
function formatYear(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.getFullYear()
}

const quickActions = computed(() => [
  {
    label: 'Attendees',
    to: `/event/${id.value}/attendees`,
    bg: 'rgba(0,122,255,0.1)',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
  },
  {
    label: 'Check-ins',
    to: `/event/${id.value}/checkins`,
    bg: 'rgba(52,199,89,0.1)',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`,
  },
  {
    label: 'Payments',
    to: `/event/${id.value}/payments`,
    bg: 'rgba(201,168,76,0.12)',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>`,
  },
  {
    label: 'Messages',
    to: `/event/${id.value}/messages`,
    bg: 'rgba(255,149,0,0.1)',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`,
  },
  {
    label: 'Gallery',
    to: `/event/${id.value}/gallery`,
    bg: 'rgba(175,82,222,0.1)',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AF52DE" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`,
  },
  {
    label: 'Team',
    to: `/event/${id.value}/team`,
    bg: 'rgba(255,59,48,0.08)',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>`,
  },
])

async function loadStats() {
  if (!id.value) return
  try {
    const [invSnap, checkinSnap, paySnap] = await Promise.all([
      getDocs(query(collection(db, 'events', id.value, 'invitations'))),
      getDocs(query(collection(db, 'events', id.value, 'checkIns'))),
      getDocs(query(collection(db, 'events', id.value, 'contributions'))),
    ])
    const total = paySnap.docs.reduce((sum, d) => sum + (d.data().amount ?? 0), 0)
    const adminCount = props.event?.adminsIds?.length ?? 1
    stats.value = {
      attendees: invSnap.size,
      checkins: checkinSnap.size,
      totalContributions: total,
      admins: adminCount,
    }
  } catch (e) {
    console.error('Failed to load overview stats', e)
  }
}

onMounted(loadStats)
watch(() => props.event, loadStats)
</script>

<style scoped>
.eo-root {
  padding: 28px 28px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1080px;
}

/* ── KPI row ── */
.eo-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.eo-kpi-card {
  background: #FFFFFF;
  border: 0.8px solid #EBEBEA;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.eo-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.eo-kpi-label {
  font-size: 12px;
  font-weight: 500;
  color: #8A8580;
}
.eo-kpi-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.eo-kpi-icon--blue  { background: rgba(0,122,255,0.1);  color: #007AFF; }
.eo-kpi-icon--green { background: rgba(52,199,89,0.1);  color: #34C759; }
.eo-kpi-icon--gold  { background: rgba(201,168,76,0.12); color: #C9A84C; }
.eo-kpi-icon--purple{ background: rgba(175,82,222,0.1); color: #AF52DE; }

.eo-kpi-num {
  font-size: 26px;
  font-weight: 800;
  color: #1C1A18;
  letter-spacing: -0.5px;
  line-height: 1;
}
.eo-kpi-sub {
  font-size: 11px;
  color: #B5B0A8;
  margin: 0;
}

/* ── Mid row ── */
.eo-mid-row {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 14px;
}
.eo-panel {
  background: #FFFFFF;
  border: 0.8px solid #EBEBEA;
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.eo-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.eo-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #1C1A18;
}
.eo-panel-badge {
  font-size: 12px;
  color: #8A8580;
}
.eo-progress-track {
  height: 8px;
  background: #F2F2F0;
  border-radius: 4px;
  overflow: hidden;
}
.eo-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #C9A84C, #E8C86A);
  border-radius: 4px;
  transition: width 600ms ease;
}
.eo-progress-sub {
  font-size: 12px;
  color: #8A8580;
  margin: 8px 0 0;
}

/* Date panel */
.eo-panel--date {
  display: flex;
  align-items: center;
  gap: 16px;
}
.eo-date-badge-big {
  background: #FFF8EC;
  border: 0.8px solid rgba(201,168,76,0.25);
  border-radius: 12px;
  padding: 12px 14px;
  text-align: center;
  flex-shrink: 0;
}
.eo-date-month {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #C9A84C;
  letter-spacing: 0.5px;
}
.eo-date-day {
  display: block;
  font-size: 28px;
  font-weight: 900;
  color: #1C1A18;
  line-height: 1;
}
.eo-date-year {
  display: block;
  font-size: 11px;
  color: #8A8580;
  margin-top: 2px;
}
.eo-date-info {}
.eo-date-label {
  font-size: 14px;
  font-weight: 700;
  color: #1C1A18;
  margin: 0 0 4px;
}
.eo-date-loc {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8A8580;
  margin: 0 0 6px;
}
.eo-date-countdown {
  font-size: 12px;
  font-weight: 600;
  color: #C9A84C;
  margin: 0;
}

/* ── Quick access ── */
.eo-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #6B6A68;
  letter-spacing: 0.2px;
}
.eo-quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.eo-quick-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #FFFFFF;
  border: 0.8px solid #EBEBEA;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: box-shadow 150ms, transform 150ms;
  text-align: left;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.eo-quick-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}
.eo-quick-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.eo-quick-label {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #1C1A18;
}
.eo-quick-arrow {
  color: #B5B0A8;
  flex-shrink: 0;
}
</style>
