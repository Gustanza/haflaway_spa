<template>
  <div class="el-root">

    <!-- ── Mobile backdrop ── -->
    <div v-if="showMobileNav" class="el-mobile-backdrop" @click="showMobileNav = false" />

    <!-- ── Sidebar ── -->
    <aside class="el-sidebar" :class="{ 'el-sidebar--open': showMobileNav }">

      <!-- Mobile close button -->
      <button class="el-sidebar-close" @click="showMobileNav = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <!-- Brand -->
      <div class="el-brand" @click="$router.push('/')">
        <img v-if="activeOrg?.logoUrl" :src="activeOrg.logoUrl" class="el-brand-logo" />
        <span v-else class="el-brand-glyph">✦</span>
        <span class="el-brand-name">{{ activeOrg?.name || 'Haflaway' }}</span>
      </div>

      <!-- Back link -->
      <button class="el-back-btn" @click="goAllEvents">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        All Events
      </button>

      <!-- Nav -->
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

    <!-- ── Main ── -->
    <div class="el-main">

      <!-- Topbar -->
      <header class="el-topbar">
        <div class="el-topbar-left">
          <button class="el-hamburger" @click="showMobileNav = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span class="el-event-title">{{ event?.title ?? '…' }}</span>
        </div>
        <div class="el-topbar-right">
          <!-- Theme toggle -->
          <button class="theme-toggle-btn el-theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light' : 'Switch to dark'">
            <svg v-if="isDark" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <div class="el-balance-wrap" ref="balanceWrapRef" v-if="orgBalance !== null">
            <button class="el-balance-pill" @click="showTopUp = !showTopUp">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
              </svg>
              {{ formatBalance(orgBalance) }}
              <svg class="el-balance-chevron" :class="{ 'el-balance-chevron--open': showTopUp }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <div v-if="showTopUp" class="el-balance-dropdown">
              <div class="el-tu-hd">
                <span class="el-tu-title">Top up wallet</span>
                <span class="el-tu-balance">{{ formatBalance(orgBalance) }}</span>
              </div>

              <label class="el-tu-label">Amount (TZS)</label>
              <input
                v-model.number="topUpAmount"
                class="el-tu-input"
                type="number"
                min="1"
                placeholder="e.g. 10000"
                :disabled="topUpStatus === 'pending'"
              />

              <label class="el-tu-label">Phone Number</label>
              <div class="el-tu-phone-row">
                <span class="el-tu-phone-prefix">+255</span>
                <input
                  v-model="topUpPhone"
                  class="el-tu-input el-tu-phone-input"
                  type="tel"
                  placeholder="712345678"
                  :disabled="topUpStatus === 'pending'"
                  @input="topUpPhone = topUpPhone.replace(/\D/g, '').replace(/^0+/, '')"
                />
              </div>

              <button class="el-tu-submit" :disabled="!canTopUp" @click="handleTopUp">
                {{ topUpStatus === 'pending' ? 'Waiting for confirmation…' : 'Top Up via ClickPesa' }}
              </button>

              <p v-if="topUpStatus === 'pending'" class="el-tu-hint">Check your phone and approve the mobile money prompt. This can take a few minutes to confirm — no need to retry immediately.</p>
              <p v-if="topUpStatus === 'timeout'" class="el-tu-status el-tu-status--warn">Still no confirmation after several minutes. Check status below, or start a new top-up.</p>
              <button v-if="topUpStatus === 'pending' || topUpStatus === 'timeout'" class="el-tu-check" :disabled="checkingStatus" @click="handleCheckStatus">
                {{ checkingStatus ? 'Checking…' : "Already paid? Check status" }}
              </button>
              <button v-if="topUpStatus === 'timeout'" class="el-tu-check" @click="handleStartNewTopUp">
                Start a new top-up
              </button>
              <p v-if="topUpStatus === 'success'" class="el-tu-status el-tu-status--ok">✓ Balance updated</p>
              <p v-if="topUpStatus === 'failed'" class="el-tu-status el-tu-status--err">Payment failed or was cancelled. Try again.</p>
              <p v-if="topUpError" class="el-tu-error">{{ topUpError }}</p>
            </div>
          </div>
          <div class="el-status-pill" :class="`el-status-pill--${eventStatus}`">
            <span class="el-status-dot" />
            {{ statusLabel }}
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="el-content">
        <RouterView :event="event" :eventId="eventId" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useTheme } from '../../composables/useTheme.js'
import { useOrg } from '../../composables/useOrg.js'
import { useTopUp } from '../../composables/useTopUp.js'

const { isDark, toggleTheme } = useTheme()
const { activeOrg } = useOrg()
const {
  orgBalance, formatBalance, topUpAmount, topUpPhone, topUpStatus, topUpError,
  checkingStatus, canTopUp, handleTopUp, handleCheckStatus, handleStartNewTopUp,
} = useTopUp()

const route = useRoute()
const router = useRouter()
const eventId = computed(() => route.params.eventId)
const event = ref(null)
const showMobileNav = ref(false)

watch(() => route.path, () => { showMobileNav.value = false })

// ── Wallet top-up (ClickPesa) — state/logic shared via useTopUp.js so the
// same in-flight top-up is tracked whether you're on an event page or the
// dashboard topbar.
const showTopUp = ref(false)
const balanceWrapRef = ref(null)

function onClickOutsideBalance(e) {
  if (balanceWrapRef.value && !balanceWrapRef.value.contains(e.target)) {
    showTopUp.value = false
  }
}
onMounted(() => document.addEventListener('click', onClickOutsideBalance))
onUnmounted(() => document.removeEventListener('click', onClickOutsideBalance))

const navItems = [
  {
    label: 'Overview',
    to: 'overview',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>`,
  },
  {
    label: 'Budget',
    to: 'budget',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>`,
  },
  {
    label: 'Invitees',
    to: 'attendees',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
  },
  {
    label: 'Contacts',
    to: 'contacts',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>`,
  },
  {
    label: 'Check-ins',
    to: 'checkins',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`,
  },
  {
    label: 'Cards',
    to: 'cards',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>`,
  },
  {
    label: 'Invitations',
    to: 'invitations',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`,
  },
  {
    label: 'Bulk Messages',
    to: 'bulk-messages',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>`,
  },
  {
    label: 'Templates',
    to: 'templates',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>`,
  },
  {
    label: 'Gallery',
    to: 'gallery',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`,
  },
  {
    label: 'Gifts of Love',
    to: 'zawadi',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5" rx="1"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>`,
  },
  {
    label: 'Payments',
    to: 'payments',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>`,
  },
  {
    label: 'Team',
    to: 'team',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>`,
  },
  {
    label: 'Settings',
    to: 'settings',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,
  },
]

function resolvedTo(segment) {
  return `/event/${eventId.value}/${segment}`
}

// Restores whichever My Events page the user was on (see MyEvents.vue's
// currentPage watcher) — this is a fresh navigation, not a history pop, so
// the target route's query isn't otherwise available to us here.
function goAllEvents() {
  const page = parseInt(localStorage.getItem('haflaway:myEventsPage'))
  router.push({ path: '/', query: page > 1 ? { page } : {} })
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
/* ── Tokens ── */
.el-root {
  --ink: #f0ece6;
  --ink-soft: #d4cfc8;
  --ink-muted: #888;
  --ink-dim: #505050;
  --line: #242424;
  --line-soft: #1e1e1e;
  --line-strong: #2e2e2e;
  --paper-soft: #1a1a1a;
  --emerald: #34d399;
  --emerald-soft: rgba(52,211,153,0.12);

  /* ── Layout tokens (overridden by global light-theme CSS; org can override the
     surface color itself via --org-*-bg, set in useOrg.js's watchEffect) ── */
  --el-sidebar-bg: var(--org-sidebar-bg, #111111);
  --el-topbar-bg:  var(--org-topbar-bg, rgba(7,7,7,0.92));
  --el-content-bg: var(--org-page-bg, #070707);

  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--el-content-bg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--ink);
}

/* ── Sidebar ── */
.el-sidebar {
  width: 224px;
  flex-shrink: 0;
  background: var(--el-sidebar-bg);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 0;
  z-index: 10;
  overflow-y: auto;
  box-shadow: 2px 0 20px rgba(0,0,0,0.4);
}

/* Brand — same vertical padding as topbar so the divider lines align */
.el-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 28px 18px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  flex-shrink: 0;
}
.el-brand-glyph {
  font-size: 16px;
  color: var(--gold);
  line-height: 1;
  flex-shrink: 0;
}
.el-brand-logo {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.el-brand-name {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 19px;
  font-weight: 400;
  color: var(--org-sidebar-text, var(--ink));
  letter-spacing: -0.3px;
}

/* Back button */
.el-back-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--org-sidebar-text, var(--ink-muted));
  cursor: pointer;
  padding: 9px 8px;
  border-radius: 10px;
  margin: 8px 10px 4px;
  transition: color 130ms, background 130ms;
  font-family: inherit;
  white-space: nowrap;
}
.el-back-btn:hover { color: var(--org-sidebar-text, var(--ink)); background: var(--paper-soft); }

/* Nav */
.el-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
}
.el-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 8px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--org-sidebar-text, var(--ink-muted));
  font-size: 13.5px;
  font-weight: 500;
  min-height: 38px;
  transition: background 130ms, color 130ms;
}
.el-nav-item:hover {
  background: var(--paper-soft);
  color: var(--org-sidebar-text, var(--ink));
}
.el-nav-item--active {
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.10);
  color: var(--org-sidebar-text, #e2e8f0);
  font-weight: 600;
}
.el-nav-item--active:hover { background: rgba(255,255,255,0.13); }

/* smooth theme transitions across sidebar */
.el-sidebar,
.el-brand,
.el-nav-item,
.el-back-btn {
  transition: background 300ms ease, color 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}
.el-nav-icon {
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.7;
}
.el-nav-item--active .el-nav-icon { opacity: 1; }
.el-nav-label { flex: 1; }

/* ── Main ── */
.el-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* Topbar */
.el-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 32px;
  background: var(--el-topbar-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 1px 0 rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3);
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}
.el-topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.el-event-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--org-topbar-text, var(--ink));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}
.el-topbar-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Wallet balance pill */
.el-balance-wrap { position: relative; flex-shrink: 0; }
.el-balance-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px 5px 12px;
  border-radius: 20px;
  background: rgb(from var(--gold) r g b / 0.08);
  color: var(--gold);
  letter-spacing: 0.1px;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms;
}
.el-balance-pill:hover { background: rgb(from var(--gold) r g b / 0.14); }
.el-balance-chevron { transition: transform 180ms ease; flex-shrink: 0; }
.el-balance-chevron--open { transform: rotate(180deg); }

/* Top-up dropdown */
.el-balance-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  max-width: calc(100vw - 32px);
  background: var(--paper-soft);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.2), 0 16px 40px rgba(0,0,0,0.35);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 200;
}
.el-tu-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; gap: 8px; }
.el-tu-title { font-size: 13px; font-weight: 700; color: var(--ink); }
.el-tu-balance { font-size: 13px; font-weight: 700; color: var(--gold); white-space: nowrap; }
.el-tu-label { font-size: 11px; font-weight: 600; color: var(--ink-muted); margin-top: 4px; }
.el-tu-input {
  padding: 8px 10px; border-radius: 9px; border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.03); color: var(--ink); font-size: 12.5px; font-family: inherit;
  outline: none; width: 100%; box-sizing: border-box;
}
.el-tu-input:disabled { opacity: 0.6; cursor: not-allowed; }
.el-tu-input:focus { border-color: rgb(from var(--gold) r g b / 0.5); }
.el-tu-phone-row { display: flex; align-items: center; gap: 6px; }
.el-tu-phone-prefix {
  flex-shrink: 0; padding: 8px 8px; border: 1px solid var(--line-strong); border-radius: 9px;
  background: rgba(255,255,255,0.04); font-size: 12.5px; font-weight: 600; color: var(--ink-muted);
}
.el-tu-phone-input { flex: 1; min-width: 0; }
.el-tu-submit {
  margin-top: 4px; background: var(--gold); color: var(--gold-contrast); border: none;
  border-radius: 9px; padding: 9px 12px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit;
}
.el-tu-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.el-tu-check {
  background: transparent; border: 1px solid var(--line-strong); color: var(--ink);
  border-radius: 9px; padding: 8px 12px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.el-tu-hint { font-size: 11px; color: var(--ink-muted); margin: 0; line-height: 1.4; }
.el-tu-status { font-size: 12px; font-weight: 600; margin: 0; line-height: 1.4; }
.el-tu-status--ok { color: #34d399; }
.el-tu-status--err { color: #FF453A; }
.el-tu-status--warn { color: #eab308; }
.el-tu-error { font-size: 11.5px; color: #FF453A; margin: 0; }

/* Status pill */
.el-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
  letter-spacing: 0.1px;
}
.el-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.el-status-pill--upcoming {
  background: var(--paper-soft);
  color: var(--ink-muted);
}
.el-status-pill--upcoming .el-status-dot { background: var(--ink-dim); }
.el-status-pill--ongoing {
  background: rgb(from var(--gold) r g b / 0.10);
  color: var(--gold);
}
.el-status-pill--ongoing .el-status-dot {
  background: var(--gold);
  animation: pulse-dot 1.6s ease-in-out infinite;
}
.el-status-pill--completed {
  background: var(--paper-soft);
  color: var(--ink-dim);
}
.el-status-pill--completed .el-status-dot { background: var(--ink-dim); }
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.7); }
}

/* Content */
.el-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--el-content-bg);
  transition: background 300ms ease;
}

/* ── Theme toggle ── */
.el-theme-toggle {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--line-strong);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 130ms, color 130ms, border-color 130ms, box-shadow 130ms;
  flex-shrink: 0;
}

/* ── Mobile nav ── */
.el-hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-muted);
  padding: 6px;
  border-radius: 8px;
  flex-shrink: 0;
  transition: background 130ms, color 130ms;
}
.el-hamburger:hover { background: var(--paper-soft); color: var(--ink); }

.el-sidebar-close {
  display: none;
  position: absolute;
  top: 14px;
  right: 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-muted);
  padding: 6px;
  border-radius: 8px;
  transition: background 130ms, color 130ms;
}
.el-sidebar-close:hover { background: var(--paper-soft); color: var(--ink); }

.el-mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 150;
}

@media (max-width: 767px) {
  .el-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    transform: translateX(-100%);
    transition: transform 280ms cubic-bezier(.2, .7, .2, 1);
    z-index: 200;
  }
  .el-sidebar--open {
    transform: translateX(0);
  }
  .el-sidebar-close { display: flex; }
  .el-hamburger { display: flex; }

  .el-topbar { padding: 14px 16px; }
  .el-event-title { font-size: 15px; max-width: 55vw; }
}
</style>
