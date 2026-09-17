<template>
  <div class="el-root">

    <!-- ── Mobile backdrop ── -->
    <div v-if="showMobileNav" class="el-mobile-backdrop" @click="showMobileNav = false" />

    <!-- ── Sidebar ──
         "Hub chrome" pages (Overview, Guest List, …) hide the static rail —
         they're withjoy-style: collapsed by default, opened as an overlay via
         their own hamburger button (shared state in useNavDrawer.js) rather
         than taking up permanent width. Every other event screen still gets
         the classic always-on desktop sidebar / mobile drawer — but if ANY
         page (e.g. a full-screen modal on a non-hub route) explicitly opens
         the drawer via showMobileNav, it also gets drawer treatment for that
         moment, regardless of isHubRoute — otherwise a route whose sidebar is
         normally in-flow (not position:fixed) would have nothing making it
         float as an overlay when something else asks it to open. ── -->
    <aside v-if="!isHubRoute || showMobileNav" class="el-sidebar"
      :class="{ 'el-sidebar--open': showMobileNav, 'el-sidebar--drawer': isHubRoute || showMobileNav }">

      <!-- WithJoy Sidebar Header -->
      <div class="el-sidebar-head">
        <div class="el-sidebar-brand-cluster">
          <div class="el-brand" @click="$router.push('/events')">
            <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" class="el-brand-logo" />
            <span v-else class="el-brand-script">.joy</span>
          </div>
          <button class="el-sidebar-search-btn" title="Search navigation" @click="toggleNavSearch">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>
        <button class="el-sidebar-close" @click="showMobileNav = false" title="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Quick Search Bar (when active) -->
      <div v-if="showNavSearch" class="el-sidebar-search-bar">
        <input v-model="navSearchQ" ref="navSearchInputRef" placeholder="Search menu…" class="el-sidebar-search-input" />
        <button v-if="navSearchQ" class="el-sidebar-search-clear" @click="navSearchQ = ''">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Scrollable Navigation -->
      <div class="el-sidebar-scroll">
        <!-- Event Dashboard (Home) -->
        <RouterLink
          v-if="showDashboardInFilter"
          :to="resolvedTo(navDashboardItem.to)"
          class="el-nav-item el-nav-item--dashboard"
          active-class="el-nav-item--active"
          @click="showMobileNav = false"
        >
          <span class="el-nav-icon" v-html="navDashboardItem.icon" />
          <span class="el-nav-label el-nav-label--dash">{{ navDashboardItem.label }}</span>
        </RouterLink>

        <!-- WithJoy Category Sections -->
        <div v-for="sec in filteredNavSections" :key="sec.title" class="el-nav-section">
          <h3 class="el-section-title">{{ sec.title }}</h3>
          <nav class="el-nav">
            <RouterLink
              v-for="item in sec.items"
              :key="item.to"
              :to="resolvedTo(item.to)"
              class="el-nav-item"
              active-class="el-nav-item--active"
              @click="showMobileNav = false"
            >
              <span class="el-nav-icon" v-html="item.icon" />
              <span class="el-nav-label">{{ item.label }}</span>
            </RouterLink>
          </nav>
        </div>
      </div>

      <!-- WithJoy Bottom Event Switcher Card -->
      <div class="el-sidebar-bottom">
        <button class="el-event-card-btn" @click="goAllEvents" title="All Events / Switch">
          <img v-if="eventCoverImage" :src="eventCoverImage" class="el-event-avatar" />
          <div v-else class="el-event-avatar el-event-avatar--init">
            {{ eventInitials }}
          </div>
          <div class="el-event-meta">
            <span class="el-event-name" :title="event?.title">{{ event?.title || 'Event' }}</span>
            <span class="el-event-date" v-if="sidebarDate">{{ sidebarDate }}</span>
          </div>
          <svg class="el-event-chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      </div>

    </aside>

    <!-- ── Main ── -->
    <div class="el-main">

      <!-- Topbar — hidden on the hub page; EventOverview renders its own
           hero head (back button, title, icon cluster) in its place. -->
      <header v-if="!isHubRoute" class="el-topbar">
        <div class="el-topbar-left">
          <button v-if="!isHubRoute" class="el-hamburger" @click="showMobileNav = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span class="el-event-title">{{ event?.title ?? '…' }}</span>
        </div>
        <div class="el-topbar-right">
          <div class="el-balance-wrap" ref="balanceWrapRef" v-if="orgBalance !== null">
            <button class="el-balance-pill" @click="showTopUp = !showTopUp">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
              </svg>
              <!-- Currency and figure are separate spans so the pill can shed
                   "TZS" at narrow widths before it has to drop the number. -->
              <span class="el-balance-label"><span class="el-balance-cur">TZS </span>{{ balanceAmount }}</span>
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
          <!-- The label sheds on narrow screens but the dot never does — it
               carries the status colour, so a dot-only pill still tells you
               whether the event is upcoming, live or done. -->
          <div class="el-status-pill" :class="`el-status-pill--${eventStatus}`">
            <span class="el-status-dot" />
            <span class="el-status-label">{{ statusLabel }}</span>
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
import { useOrg } from '../../composables/useOrg.js'
import { useTopUp } from '../../composables/useTopUp.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'

const { brandName, brandLogoUrl } = useOrg()
const {
  orgBalance, formatBalance, topUpAmount, topUpPhone, topUpStatus, topUpError,
  checkingStatus, canTopUp, handleTopUp, handleCheckStatus, handleStartNewTopUp,
} = useTopUp()

// The topbar pill renders the currency and the figure separately so it can shed
// "TZS" before dropping the number. formatBalance() still returns the joined
// string everywhere else a balance is shown (including the top-up dropdown).
const balanceAmount = computed(() =>
  orgBalance.value == null
    ? '—'
    : Number(orgBalance.value).toLocaleString('en-US', { maximumFractionDigits: 0 })
)

const route = useRoute()
const router = useRouter()
const eventId = computed(() => route.params.eventId)
const event = ref(null)
// showMobileNav is shared (not a local ref) so hub-chrome pages — which hide
// this component's own hamburger — can open the same drawer via their own button.
const { isOpen: showMobileNav } = useNavDrawer()
const isHubRoute = computed(() => ['EventOverview', 'EventAttendees', 'EventCampaigns', 'EventInvitations', 'EventSchedule', 'EventBudget', 'EventCheckins', 'EventCards', 'EventGallery', 'EventZawadi', 'EventPayments', 'EventSettings'].includes(route.name))

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

const showNavSearch = ref(false)
const navSearchQ = ref('')
const navSearchInputRef = ref(null)

function toggleNavSearch() {
  showNavSearch.value = !showNavSearch.value
  if (showNavSearch.value) {
    setTimeout(() => navSearchInputRef.value?.focus(), 60)
  } else {
    navSearchQ.value = ''
  }
}

const eventCoverImage = computed(() => {
  return event.value?.coverUrl || event.value?.coverImage || event.value?.imageUrl || event.value?.photoUrl || null
})

function initialsOf(str) {
  if (!str) return 'EV'
  const p = str.trim().split(/\s+/).filter(Boolean)
  return p.length === 1 ? (p[0][0] ?? 'E').toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

const eventInitials = computed(() => initialsOf(event.value?.title))

const sidebarDate = computed(() => {
  const d = event.value?.eventDate
  if (!d) return ''
  try {
    const dateObj = d.toDate ? d.toDate() : new Date(d)
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
})

const navDashboardItem = {
  label: 'Event Dashboard',
  to: 'overview',
  icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>`,
}

const navSections = [
  {
    title: 'Guests & Messaging',
    items: [
      {
        label: 'Guest List',
        to: 'attendees',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>`,
      },
      {
        label: 'Invitations',
        to: 'invitations',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>`,
      },
      {
        label: 'Bulk Messages',
        to: 'bulk-messages',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>`,
      },
      {
        label: 'Check-ins',
        to: 'checkins',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>`,
      },
      {
        label: 'Cards',
        to: 'cards',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>
        </svg>`,
      },
    ],
  },
  {
    title: 'Planning & Finance',
    items: [
      {
        label: 'Budget',
        to: 'budget',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
        </svg>`,
      },
      {
        label: 'Payments',
        to: 'payments',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>`,
      },
      {
        label: 'Gifts of Love',
        to: 'zawadi',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5" rx="1"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>`,
      },
    ],
  },
  {
    title: 'Event Details',
    items: [
      {
        label: 'Schedule',
        to: 'schedule',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
        </svg>`,
      },
      {
        label: 'Gallery',
        to: 'gallery',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>`,
      },
      {
        label: 'Settings',
        to: 'settings',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>`,
      },
    ],
  },
]

const filteredNavSections = computed(() => {
  const q = navSearchQ.value.trim().toLowerCase()
  if (!q) return navSections
  return navSections.map(sec => ({
    ...sec,
    items: sec.items.filter(it => it.label.toLowerCase().includes(q))
  })).filter(sec => sec.items.length > 0)
})

const showDashboardInFilter = computed(() => {
  const q = navSearchQ.value.trim().toLowerCase()
  if (!q) return true
  return navDashboardItem.label.toLowerCase().includes(q)
})

function resolvedTo(segment) {
  return `/event/${eventId.value}/${segment}`
}

// Restores whichever My Events page/tab the user was on (see MyEvents.vue's
// currentPage + activeFilter watcher) — this is a fresh navigation, not a
// history pop, so the target route's query isn't otherwise available to us here.
function goAllEvents() {
  const page = parseInt(localStorage.getItem('haflaway:myEventsPage'))
  const filter = localStorage.getItem('haflaway:myEventsFilter')
  const query = {}
  if (page > 1) query.page = page
  if (filter && filter !== 'all') query.filter = filter
  router.push({ path: '/events', query })
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
  --el-content-bg: var(--org-page-bg, #ffffff);

  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--el-content-bg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--ink);
}

/* ── Withjoy-Style Luxury Sidebar Drawer ── */
.el-sidebar {
  width: 272px;
  flex-shrink: 0;
  background: #ffffff !important;
  border-right: 1px solid #f0f1f3;
  display: flex;
  flex-direction: column;
  padding: 0;
  z-index: 1510;
  overflow: hidden;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.05);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Hub-chrome pages: the rail is never in-flow — it's an overlay drawer at
   every viewport width, opened via the page's own hamburger button. */
.el-sidebar--drawer {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  transform: translateX(-100%);
  transition: transform 260ms cubic-bezier(.16, 1, .3, 1);
  z-index: 1510; /* stays above .el-mobile-backdrop */
  box-shadow: 8px 0 36px rgba(0, 0, 0, 0.12);
}
.el-sidebar--drawer.el-sidebar--open {
  transform: translateX(0);
}

/* Top Header */
.el-sidebar-head {
  height: 62px;
  padding: 0 18px 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #ffffff;
  border-bottom: 1px solid #f4f5f7;
}
.el-sidebar-brand-cluster {
  display: flex;
  align-items: center;
  gap: 12px;
}
.el-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.el-brand-logo {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.el-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 24px;
  font-weight: 700;
  font-style: italic;
  color: #18181b;
  letter-spacing: -0.02em;
}
.el-sidebar-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #71717a;
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.el-sidebar-search-btn:hover {
  background: #f4f5f7;
  color: #18181b;
}
.el-sidebar-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #4b5563;
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.el-sidebar-close:hover {
  background: #f4f5f7;
  color: #18181b;
}
@media (min-width: 768px) {
  .el-sidebar:not(.el-sidebar--drawer) .el-sidebar-close {
    display: none;
  }
}

/* Search bar inside drawer (when opened) */
.el-sidebar-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f1f3;
  flex-shrink: 0;
}
.el-sidebar-search-input {
  flex: 1;
  min-width: 0;
  height: 36px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  padding: 0 14px;
  font-size: 13px;
  font-family: inherit;
  color: #18181b;
  background: #fafafa;
  outline: none;
  transition: border-color 130ms, background 130ms;
}
.el-sidebar-search-input:focus {
  border-color: #18181b;
  background: #ffffff;
}
.el-sidebar-search-clear {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.el-sidebar-search-clear:hover { color: #18181b; }

/* Scroll Area */
.el-sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 12px 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}
.el-sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}
.el-sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 9999px;
}
.el-sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

/* Primary Dashboard Item */
.el-nav-item--dashboard {
  padding: 10px 14px !important;
  margin-bottom: 6px;
}
.el-nav-label--dash {
  font-size: 14.5px !important;
  font-weight: 700 !important;
  color: #18181b !important;
  letter-spacing: -0.01em;
}

/* Sections */
.el-nav-section {
  display: flex;
  flex-direction: column;
}
.el-section-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #18181b;
  margin: 18px 0 6px 14px;
  letter-spacing: -0.01em;
}
.el-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0;
}
.el-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  border-radius: 8px;
  text-decoration: none;
  color: #374151;
  font-size: 13.5px;
  font-weight: 500;
  min-height: 38px;
  transition: background 120ms ease, color 120ms ease;
}
.el-nav-item:hover {
  background: #f8fafc;
  color: #18181b;
}
.el-nav-item--active {
  background: #f4f5f7 !important;
  color: #18181b !important;
  font-weight: 600 !important;
}
.el-nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #4b5563;
  opacity: 1;
}
.el-nav-item--active .el-nav-icon {
  color: #18181b;
}
.el-nav-label {
  flex: 1;
  line-height: 1.3;
}

/* Bottom Event Switcher Card */
.el-sidebar-bottom {
  padding: 12px 14px;
  border-top: 1px solid #f0f1f3;
  background: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.02);
}
.el-event-card-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: all 130ms ease;
  font-family: inherit;
}
.el-event-card-btn:hover {
  background: #f8fafc;
  border-color: #e5e7eb;
}
.el-event-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1.5px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.el-event-avatar--init {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: #d1fae5;
  color: #065f46;
}
.el-event-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.el-event-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #18181b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}
.el-event-date {
  font-size: 11.5px;
  color: #71717a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.el-event-chev {
  color: #9ca3af;
  flex-shrink: 0;
}

/* ── Main ── */
.el-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* Topbar */
/* Same glass family as the floating capsules on / and /organization — the sheen,
   the saturation, the hairline and the inset top-lip highlight — but deliberately
   NOT floating. Nothing scrolls beneath this bar (.el-content is its own scroll
   pane, and .el-root is a fixed 100vh shell), so a detached capsule would hover
   over a static backdrop and read as a flat pill; its vertical cost would also
   come straight out of the content pane rather than being absorbed by page
   scroll. The material is shared; the behaviour isn't. */
.el-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 28px 32px;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.015) 100%),
    var(--el-topbar-bg);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border-bottom: 1px solid rgba(255,255,255,0.12);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.16),
    inset 0 -1px 0 rgba(0,0,0,0.22),
    0 4px 16px rgba(0,0,0,0.3),
    0 12px 32px -12px rgba(0,0,0,0.35);
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}
/* flex:1 so the title claims the slack instead of only getting what the
   (non-shrinking) control group leaves behind. */
.el-topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.el-event-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--org-topbar-text, var(--ink));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
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
  top: 16px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-muted);
  align-items: center;
  justify-content: center;
  transition: background 130ms, color 130ms;
}
.el-sidebar-close:hover { background: var(--paper-soft); color: var(--ink); }

.el-mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  /* Above the app's standard full-screen-modal layer (z-index:1000, shared by
     .ea-overlay/.em-overlay/etc. across every event page) so opening the nav
     from inside one of those modals shows this drawer instead of hiding it
     behind whatever's already open — still comfortably below the reserved
     toast/alert layer (9999+). */
  z-index: 1500;
}

@media (max-width: 767px) {
  .el-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    transform: translateX(-100%);
    transition: transform 280ms cubic-bezier(.2, .7, .2, 1);
    /* Matches .el-sidebar--drawer's z-index exactly (not just "high enough")
       so there's no ambiguity from the two same-specificity rules landing on
       the same element at this width — whichever the cascade picks, the
       computed value is identical. */
    z-index: 1510;
  }
  .el-sidebar--open {
    transform: translateX(0);
  }
  .el-sidebar-close { display: flex; }
  .el-hamburger { display: flex; }

  .el-topbar { padding: 14px 16px; }
  /* Drop the fixed cap and let flex govern — the shed ladder below frees the
     width, and a vw cap would just re-impose a limit the bar no longer needs. */
  .el-event-title { font-size: 15px; max-width: none; }
}

/* ── Topbar shed order ───────────────────────────────────────────────────────
   The event title is the primary orientation cue on this screen, and it was
   losing every fight: .el-topbar-right is flex-shrink:0 and at ~412px it held
   about 285px (theme toggle + full "TZS 2,849,540" + "Upcoming"), leaving the
   title roughly 60px — it rendered as "The…". The controls now give ground in
   priority order instead:

     680  status label out  (the dot keeps the colour, so status survives)
     480  "TZS" out         (a figure beside a wallet icon still reads as money)
     380  balance figure out

   Matches the ladder on / and /organization. ── */
@media (max-width: 680px) {
  .el-status-label { display: none; }
  /* Square up once it's a lone 6px dot, or the pill keeps its label-width padding. */
  .el-status-pill { padding: 7px; gap: 0; }
}

@media (max-width: 480px) {
  .el-balance-cur { display: none; }
}

@media (max-width: 380px) {
  .el-balance-label { display: none; }
  .el-balance-pill { padding: 5px 8px 5px 10px; gap: 4px; }
}
</style>
