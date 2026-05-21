<template>
  <div class="el-root">
    <!-- Ambient orbs -->
    <div class="orb orb--top-right" />
    <div class="orb orb--bottom-left" />

    <!-- Sidebar -->
    <aside class="el-sidebar">
      <!-- Brand header -->
      <div class="el-sidebar-brand" @click="$router.push('/')">
        <span class="el-sidebar-brand-dot" />
        <span class="el-sidebar-brand-name">Haflaway</span>
      </div>

      <!-- Event identity -->
      <div class="el-sidebar-event">
        <div class="el-event-thumb">
          <img v-if="event?.eventThumbnail" :src="event.eventThumbnail" :alt="event.title" />
          <div v-else class="el-event-thumb-placeholder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.6)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3"/> 
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>
        <div class="el-event-info">
          <p class="el-event-name">{{ event?.title ?? '…' }}</p>
          <p class="el-event-type">{{ event?.categoryId ?? 'Event' }}</p>
        </div>
      </div>

      <!-- Back link -->
      <button class="el-back-btn" @click="$router.push('/my-events')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        All Events
      </button>

      <!-- Nav sections -->
      <nav class="el-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="resolvedTo(item.to)"
          class="el-nav-item"
          active-class="el-nav-item--active"
        >
          <span class="el-nav-icon" v-html="item.icon" />
          <span class="el-nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Main area -->
    <div class="el-main">
      <!-- Top bar -->
      <header class="el-topbar">
        <div class="el-topbar-left">
          <div class="el-brand" @click="$router.push('/')">
            <span class="el-brand-dot" />
            <span class="el-brand-name">Haflaway</span>
          </div>
          <span class="el-sep">/</span>
          <span class="el-crumb" @click="$router.push('/my-events')">My Events</span>
          <span class="el-sep">/</span>
          <span class="el-crumb el-crumb--event" @click="$router.push(`/event/${eventId}/overview`)">{{ event?.title ?? '…' }}</span>
          <span class="el-sep">/</span>
          <span class="el-crumb el-crumb--page">{{ route.meta.title }}</span>
        </div>
        <div class="el-topbar-right">
          <div class="el-status-pill" :class="`el-status-pill--${eventStatus}`">
            <span class="el-status-dot" />
            {{ statusLabel }}
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="el-content">
        <RouterView :event="event" :eventId="eventId" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const eventId = computed(() => route.params.eventId)
const event = ref(null)

const navItems = [
  {
    label: 'Overview',
    to: 'overview',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>`,
  },
  {
    label: 'Attendees',
    to: 'attendees',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
  },
  {
    label: 'Check-ins',
    to: 'checkins',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`,
  },
  {
    label: 'Cards',
    to: 'cards',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>`,
  },
  {
    label: 'Messages',
    to: 'messages',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`,
  },
  {
    label: 'Gallery',
    to: 'gallery',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`,
  },
  {
    label: 'Gifts of Love',
    to: 'zawadi',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5" rx="1"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>`,
  },
  {
    label: 'Payments',
    to: 'payments',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>`,
  },
  {
    label: 'Team',
    to: 'team',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>`,
  },
  {
    label: 'Settings',
    to: 'settings',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,
  },
]

function resolvedTo(segment) {
  return `/event/${eventId.value}/${segment}`
}

const eventStatus = computed(() => {
  if (!event.value?.eventDate) return 'upcoming'
  const now = new Date()
  const d = event.value.eventDate.toDate ? event.value.eventDate.toDate() : new Date(event.value.eventDate)
  const end = event.value.endDate
    ? (event.value.endDate.toDate ? event.value.endDate.toDate() : new Date(event.value.endDate))
    : new Date(d.getTime() + 86400000)
  if (now < d) return 'upcoming'
  if (now <= end) return 'ongoing'
  return 'completed'
})

const statusLabel = computed(() => ({
  upcoming: 'Upcoming',
  ongoing: 'Live',
  completed: 'Completed',
}[eventStatus.value]))

onMounted(async () => {
  try {
    const snap = await getDoc(doc(db, 'events', eventId.value))
    if (snap.exists()) event.value = { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error('Failed to load event', e)
  }
})
</script>

<style scoped>
.el-root {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #F8F8F6;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
}

.orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(80px);
}
.orb--top-right {
  width: 320px; height: 320px;
  top: -80px; right: -80px;
  background: rgba(201,168,76,0.08);
}
.orb--bottom-left {
  width: 260px; height: 260px;
  bottom: -60px; left: 260px;
  background: rgba(201,168,76,0.04);
}

/* ── Sidebar ── */
.el-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #1C1A18;
  border-right: none;
  box-shadow: 2px 0 16px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  padding: 0 12px 20px;
  gap: 0;
  z-index: 1;
  overflow-y: auto;
}

/* Brand header */
.el-sidebar-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 18px 8px 16px;
  border-bottom: 0.8px solid rgba(255,255,255,0.07);
  margin-bottom: 12px;
  cursor: pointer;
  flex-shrink: 0;
}
.el-sidebar-brand-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #C9A84C;
  flex-shrink: 0;
}
.el-sidebar-brand-name {
  font-size: 16px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -0.3px;
}

/* Event identity block */
.el-sidebar-event {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px 12px;
  border-bottom: 0.8px solid rgba(255,255,255,0.07);
  margin-bottom: 10px;
}
.el-event-thumb {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255,255,255,0.1);
}
.el-event-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.el-event-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.el-event-info {
  min-width: 0;
}
.el-event-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.el-event-type {
  font-size: 10.5px;
  color: rgba(255,255,255,0.4);
  margin: 2px 0 0;
  text-transform: capitalize;
}

/* Back button */
.el-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: color 130ms, background 130ms;
  font-family: inherit;
}
.el-back-btn:hover {
  color: #C9A84C;
  background: rgba(201,168,76,0.1);
}

/* Nav */
.el-nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.el-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  text-decoration: none;
  color: rgba(255,255,255,0.48);
  font-size: 13px;
  font-weight: 500;
  transition: background 140ms, color 140ms;
}
.el-nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.82);
}
.el-nav-item--active {
  background: rgba(201,168,76,0.14);
  color: #C9A84C;
  border: 0.8px solid rgba(201,168,76,0.22);
  font-weight: 600;
}
.el-nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* ── Main ── */
.el-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1;
}

/* Topbar */
.el-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #FFFFFF;
  border-bottom: 0.8px solid #EBEBEA;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.el-topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.el-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
}
.el-brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #C9A84C;
  flex-shrink: 0;
}
.el-brand-name {
  font-size: 22px;
  font-weight: 800;
  color: #1C1A18;
  letter-spacing: -0.5px;
}
.el-sep {
  font-size: 16px;
  color: #D0CEC9;
  font-weight: 300;
  flex-shrink: 0;
}
.el-crumb {
  font-size: 15px;
  font-weight: 500;
  color: #8A8580;
  cursor: pointer;
  transition: color 130ms;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.el-crumb:hover { color: #C9A84C; }
.el-crumb--event {
  max-width: 160px;
}
.el-crumb--page {
  font-weight: 600;
  color: #1C1A18;
  cursor: default;
}
.el-crumb--page:hover { color: #1C1A18; }
.el-topbar-right { flex-shrink: 0; }
.el-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
}
.el-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.el-status-pill--upcoming {
  background: #F2F2F0;
  color: #6B6A68;
}
.el-status-pill--upcoming .el-status-dot { background: #B5B0A8; }
.el-status-pill--ongoing {
  background: rgba(52,199,89,0.1);
  color: #1D7A38;
}
.el-status-pill--ongoing .el-status-dot { background: #34C759; }
.el-status-pill--completed {
  background: #F2F2F0;
  color: #8A8580;
}
.el-status-pill--completed .el-status-dot { background: #8A8580; }

/* Content */
.el-content {
  flex: 1;
  overflow-y: auto;
}
</style>
