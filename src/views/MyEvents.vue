<template>
  <div class="me-root">

    <!-- ── Sticky topbar ── -->
    <nav class="me-topbar">
      <div class="me-topbar-inner">
        <div class="me-brand" @click="$router.push('/')">
          <img v-if="activeOrg?.logoUrl" :src="activeOrg.logoUrl" class="me-brand-logo" />
          <span v-else class="me-brand-glyph">✦</span>
          <span class="me-brand-name">{{ activeOrg?.name || 'Haflaway' }}</span>
        </div>
        <div class="me-topbar-right">
          <div class="me-admin-wrap" ref="adminWrapRef">
            <button class="me-admin-pill" @click="showAdminDropdown = !showAdminDropdown">
              <span class="me-admin-dot" />
              <span class="me-admin-label">Admin · {{ userDisplayName }}</span>
              <svg class="me-admin-chevron" :class="{ 'me-admin-chevron--open': showAdminDropdown }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div v-if="showAdminDropdown" class="me-admin-dropdown">
              <div class="me-dropdown-header">
                <span class="me-admin-dot me-dropdown-dot" />
                <div class="me-dropdown-header-text">
                  <span class="me-dropdown-name">{{ userDisplayName }}</span>
                  <span class="me-dropdown-email">{{ userEmail }}</span>
                </div>
              </div>
              <!-- Wallet balance card -->
              <div class="me-dropdown-balance">
                <div class="me-dbal-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
                </div>
                <div class="me-dbal-body">
                  <span class="me-dbal-label">Balance</span>
                  <span class="me-dbal-amount" :class="{ 'me-dbal-amount--loading': orgBalance === null }">
                    {{ orgBalance !== null ? formatBalance(orgBalance) : '—' }}
                  </span>
                </div>
              </div>
              <div class="me-dropdown-divider" />
              <button class="me-dropdown-item" @click="showAdminDropdown = false; $router.push('/organization')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Organization
              </button>
              <button class="me-dropdown-item me-dropdown-item--signout" @click="showAdminDropdown = false; showLogoutModal = true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          </div>
          <!-- Theme toggle -->
          <button class="theme-toggle-btn me-theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light' : 'Switch to dark'">
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
          <button class="me-create-btn" @click="$router.push('/create-event')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span class="me-create-label">Create event</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- ── Logout confirm modal ── -->
    <div v-if="showLogoutModal" class="me-modal-backdrop" @click.self="showLogoutModal = false">
      <div class="me-modal">
        <p class="me-modal-title">Sign out?</p>
        <p class="me-modal-body">You'll need to sign back in to access your events.</p>
        <div class="me-modal-actions">
          <button class="me-modal-cancel" @click="showLogoutModal = false">Cancel</button>
          <button class="me-modal-confirm" @click="logout">Sign out</button>
        </div>
      </div>
    </div>

    <!-- ── Page shell ── -->
    <div class="me-page">

      <!-- ── Page header ── -->
      <header class="me-header">
        <div class="me-header-copy">
          <h1 class="me-greeting">{{ greeting }}, {{ userDisplayName }}.</h1>
          <p class="me-header-sub" v-if="!loading">
            {{ events.length === 0
              ? 'No events yet — create your first one.'
              : `${events.length} event${events.length !== 1 ? 's' : ''} in your workspace.` }}
          </p>
          <p class="me-header-sub me-header-sub--loading" v-else>Loading events…</p>
        </div>
        <div class="me-header-stats" v-if="!loading && events.length > 0">
          <div class="me-hstat">
            <span class="me-hstat-val">{{ events.length }}</span>
            <span class="me-hstat-label">Total</span>
          </div>
          <div class="me-hstat-div"/>
          <div class="me-hstat">
            <span class="me-hstat-val me-hstat-val--gold">{{ upcomingCount }}</span>
            <span class="me-hstat-label">Upcoming</span>
          </div>
          <div class="me-hstat-div"/>
          <div class="me-hstat">
            <span class="me-hstat-val me-hstat-val--green">{{ ongoingCount }}</span>
            <span class="me-hstat-label">Live now</span>
          </div>
        </div>
      </header>

      <!-- Controls -->
      <div class="me-controls">
        <div class="me-tabs">
          <button
            v-for="f in statusFilters"
            :key="f.value"
            class="me-tab"
            :class="{ 'me-tab--active': activeFilter === f.value }"
            @click="activeFilter = f.value; clearSearch()"
          >
            {{ f.label }}
            <span class="me-tab-count" :class="{ 'me-tab-count--active': activeFilter === f.value }">{{ f.count }}</span>
          </button>
        </div>
        <div class="me-controls-right">
          <div class="me-search-wrap">
            <svg class="me-search-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="me-search-input"
              placeholder="Search events…"
              @input="onSearch"
            />
            <button v-if="searchQuery" class="me-search-clear" @click="clearSearch">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <select v-model="activeRole" class="me-fb-select">
            <option v-for="r in roleFilters" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
          <select v-model="activeSort" class="me-fb-select">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A → Z</option>
          </select>
        </div>
      </div>

      <!-- ── Affiliate Earnings Strip (only rendered for affiliates) ── -->
      <div v-if="affiliate" class="me-aff-strip">

        <!-- Header row -->
        <div class="me-aff-header">
          <span class="me-aff-sparkle">✦</span>
          <span class="me-aff-title">Affiliate Earnings</span>
          <span class="me-aff-code">{{ affiliate.referralCode }}</span>
        </div>

        <!-- Stats -->
        <div class="me-aff-stats">
          <div class="me-aff-stat">
            <span class="me-aff-stat-val" :class="totalEarned > 0 ? 'me-aff-stat-val--green' : ''">{{ formatBalance(totalEarned) }}</span>
            <span class="me-aff-stat-label">Paid out</span>
          </div>
          <div class="me-aff-stat">
            <span class="me-aff-stat-val me-aff-stat-val--gold">{{ formatBalance(pendingPayout) }}</span>
            <span class="me-aff-stat-label">Pending</span>
          </div>
          <div class="me-aff-stat">
            <span class="me-aff-stat-val">{{ affiliate.commissionRate ?? 0 }}%</span>
            <span class="me-aff-stat-label">Your rate</span>
          </div>
          <div class="me-aff-stat">
            <span class="me-aff-stat-val">{{ affiliateCommissions.length }}</span>
            <span class="me-aff-stat-label">Commissions</span>
          </div>
        </div>

        <!-- Recent commissions -->
        <template v-if="recentCommissions.length">
          <div class="me-aff-divider"/>
          <div class="me-aff-com-head">Recent commissions</div>
          <div class="me-aff-com-list">
            <div v-for="c in recentCommissions" :key="c.id" class="me-aff-com-row">
              <div class="me-aff-com-left">
                <span class="me-aff-com-dot" :class="`me-aff-com-dot--${c.status}`"/>
                <span class="me-aff-com-event">Event · {{ c.eventId?.slice(0, 8) }}…</span>
              </div>
              <div class="me-aff-com-right">
                <span class="me-aff-com-amount">{{ formatBalance(c.commissionAmount) }}</span>
                <span :class="['me-aff-com-badge', `me-aff-com-badge--${c.status}`]">{{ c.status }}</span>
              </div>
            </div>
          </div>
        </template>

        <div v-else-if="affiliateCommissions.length === 0" class="me-aff-empty">
          No commissions yet — they appear here when your referrals start using the platform.
        </div>

      </div>

      <!-- Loading -->
      <div v-if="loading" class="me-skeleton-list">
        <div class="me-skeleton" v-for="i in 3" :key="i" />
      </div>

      <!-- Empty -->
      <div v-else-if="sourceEvents.length === 0" class="me-empty">
        <span class="me-empty-glyph">✦</span>
        <p class="me-empty-title">{{ searchQuery ? `No results for "${searchQuery}"` : 'No events yet. Create your first.' }}</p>
        <button v-if="!searchQuery" class="me-create-btn me-create-btn--lg" @click="$router.push('/create-event')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create event
        </button>
      </div>

      <template v-else>

        <!-- Featured hero -->
        <div
          v-if="featuredEvent && !searchQuery && activeFilter === 'all'"
          class="me-featured"
          @click="goToEvent(featuredEvent.id)"
        >
          <!-- Left: invitation thumb -->
          <div class="me-feat-thumb-col">
            <div class="me-feat-thumb-outline" />
            <div class="me-feat-thumb" v-html="invitationSvg(featuredEvent)" />
          </div>

          <!-- Middle: content -->
          <div class="me-feat-content">
            <div class="me-feat-eyebrow">
              <span class="me-feat-eyebrow-label">FEATURED · NEXT UP</span>
              <span class="me-feat-eyebrow-sparkle">✦</span>
              <span class="me-feat-eyebrow-line" />
            </div>
            <h2 class="me-feat-title">{{ featuredEvent.title }}</h2>
            <div class="me-feat-meta">
              <div v-if="featuredEvent.startDate" class="me-feat-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span class="me-feat-meta-val">{{ formatFullDate(featuredEvent.startDate) }}</span>
              </div>
              <div v-if="featuredEvent.location" class="me-feat-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span class="me-feat-meta-val">{{ featuredEvent.location }}</span>
              </div>
            </div>
            <div v-if="featuredEvent.contributionGoal" class="me-feat-progress">
              <div class="me-feat-progress-track">
                <div class="me-feat-progress-fill" :style="{ width: Math.min(100, ((featuredEvent.collected || 0) / featuredEvent.contributionGoal) * 100) + '%' }" />
              </div>
              <span class="me-feat-progress-label">Mchango collected · TZS {{ ((featuredEvent.collected || 0) / 1000).toFixed(0) }}k / {{ (featuredEvent.contributionGoal / 1000).toFixed(0) }}k</span>
            </div>
            <div class="me-feat-actions" @click.stop>
              <button class="me-feat-open-btn" @click="goToEvent(featuredEvent.id)">
                Open dashboard
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              <span class="me-status-pill" :class="`me-status-pill--${statusClass(featuredEvent)}`">
                <span class="me-status-dot" />{{ statusLabel(featuredEvent) }}
              </span>
            </div>
          </div>

          <!-- Right: editorial countdown -->
          <div class="me-feat-countdown">
            <span class="me-feat-cd-month">{{ formatMonth(featuredEvent.startDate) }}</span>
            <span class="me-feat-cd-day">{{ formatDay(featuredEvent.startDate) }}</span>
            <span class="me-feat-cd-year">{{ featuredEvent.startDate ? new Date(featuredEvent.startDate).getFullYear() : '' }}</span>
            <div class="me-feat-cd-ticket">
              <span class="me-feat-cd-num">{{ Math.abs(daysAway(featuredEvent.startDate) ?? 0) }}</span>
              <span class="me-feat-cd-words">{{ (daysAway(featuredEvent.startDate) ?? 0) > 0 ? 'days\naway' : 'days\npast' }}</span>
            </div>
          </div>
        </div>

        <!-- Section divider -->
        <div v-if="nonFeaturedDisplayed.length > 0 || (searchQuery || activeFilter !== 'all')" class="me-section-head">
          <span class="me-section-line" />
          <span class="me-section-meta">
            {{ searchQuery
              ? `Results for "${searchQuery}"`
              : activeFilter !== 'all'
                ? statusFilters.find(f => f.value === activeFilter)?.label
                : 'All events' }}
            · {{ sourceEvents.length }}
            <template v-if="totalPages > 1"> · p{{ currentPage }}/{{ totalPages }}</template>
          </span>
          <span class="me-section-line" />
        </div>

        <!-- Hanging event rows -->
        <div class="me-hanging-list">
          <article
            v-for="event in (searchQuery || activeFilter !== 'all' ? displayedEvents : nonFeaturedDisplayed)"
            :key="event.id"
            class="me-row"
            :class="`me-row--${statusClass(event)}`"
            :style="{ background: `linear-gradient(105deg, ${thumbColors(event).bg.replace(/,[\d.]+\)$/, ',0.30)')} 0px, ${thumbColors(event).bg} 118px, ${isDark ? '#141414' : '#ffffff'} 380px)` }"
            @click="goToEvent(event.id)"
          >
            <!-- Left: invitation card (same idea as featured, scaled down) -->
            <div class="me-row-card-col">
              <div class="me-row-card-outline" />
              <div class="me-row-card-inner" v-html="invitationSvg(event)" />
            </div>

            <!-- Middle: content -->
            <div class="me-row-body">
              <div class="me-row-eyebrow">
                <span class="me-role-badge" :class="event.authorId === uid ? 'me-role-badge--owner' : 'me-role-badge--admin'">
                  {{ event.authorId === uid ? 'OWNER' : 'ADMIN' }}
                </span>
                <span class="me-row-eyebrow-spark">✦</span>
                <span class="me-row-eyebrow-line" />
              </div>
              <h3 class="me-row-title">{{ event.title }}</h3>
              <div class="me-row-meta">
                <span class="me-status-pill me-status-pill--inline" :class="`me-status-pill--${statusClass(event)}`">
                  <span class="me-status-dot" />{{ statusLabel(event) }}
                </span>
                <div v-if="event.startDate" class="me-row-meta-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>{{ formatFullDate(event.startDate) }}</span>
                </div>
                <div v-if="event.location" class="me-row-meta-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{{ event.location }}</span>
                </div>
              </div>
            </div>

            <!-- Right: editorial date countdown (like featured, more compact) -->
            <div class="me-row-cd">
              <span class="me-row-cd-year">{{ event.startDate ? new Date(event.startDate).getFullYear() : '' }}</span>
              <span class="me-row-cd-mon">{{ formatMonth(event.startDate) || '—' }}</span>
              <span class="me-row-cd-day" :style="{ color: thumbColors(event).accent }">{{ formatDay(event.startDate) }}</span>
              <div class="me-row-cd-ticket" :class="daysAwayClass(event)">
                <template v-if="statusClass(event) === 'ongoing'">
                  <span class="me-live-dot" />LIVE
                </template>
                <template v-else-if="(daysAway(event.startDate) ?? 0) > 0">
                  {{ daysAway(event.startDate) }}d away
                </template>
                <template v-else>
                  {{ Math.round(Math.abs(daysAway(event.startDate) ?? 0) / 30) }}mo ago
                </template>
              </div>
            </div>

          </article>
        </div>

        <!-- Pagination (hidden if < 10 total) -->
        <div v-if="!loading && totalPages > 1 && sourceEvents.length >= PAGE_SIZE" class="me-pagination">
          <span class="me-pagination-info">
            Showing {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, sourceEvents.length) }} of {{ sourceEvents.length }}
          </span>
          <div class="me-pagination-controls">
            <button class="me-page-btn me-page-btn--nav" :disabled="currentPage === 1" @click="currentPage--">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <template v-for="p in pageRange" :key="p">
              <span v-if="p === '…'" class="me-page-ellipsis">…</span>
              <button v-else class="me-page-btn" :class="{ 'me-page-btn--active': p === currentPage }" @click="currentPage = p">{{ p }}</button>
            </template>
            <button class="me-page-btn me-page-btn--nav" :disabled="currentPage === totalPages" @click="currentPage++">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { db, auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useTheme } from '../composables/useTheme.js'
import { useOrg } from '../composables/useOrg.js'

const { isDark, toggleTheme } = useTheme()
const { activeOrg } = useOrg()
import {
  collection, query, where, orderBy, getDocs, limit,
} from 'firebase/firestore'

const PAGE_SIZE = 10
const router = useRouter()
const route = useRoute()
const uid = auth.currentUser?.uid ?? null

// ── State (unchanged) ──────────────────────────────────────────────────────
const events = ref([])
const loading = ref(true)
const currentPage = ref(1)
const activeFilter = ref('all')
const activeRole = ref('all')
const activeSort = ref('newest')
const searchQuery = ref('')

const rotations = [-0.35, 0.45, -0.25, 0.5, -0.4, 0.3]

const showLogoutModal = ref(false)
const showAdminDropdown = ref(false)
const adminWrapRef = ref(null)
// Balance now lives on the org, not the user, so any team member sees the same
// shared pool — and it updates live since activeOrg is already a realtime listener.
const orgBalance = computed(() => activeOrg.value ? (activeOrg.value.balance ?? 0) : null)

const userDisplayName = computed(() => {
  const u = auth.currentUser
  if (!u) return 'Admin'
  return u.displayName || u.email?.split('@')[0] || 'Admin'
})

const userEmail = computed(() => auth.currentUser?.email ?? '')

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})
const upcomingCount = computed(() => events.value.filter(e => statusClass(e) === 'upcoming').length)
const ongoingCount  = computed(() => events.value.filter(e => statusClass(e) === 'ongoing').length)

function formatBalance(n) {
  if (n == null) return '—'
  return 'TZS ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function onClickOutside(e) {
  if (adminWrapRef.value && !adminWrapRef.value.contains(e.target)) {
    showAdminDropdown.value = false
  }
}

async function logout() {
  showLogoutModal.value = false
  await signOut(auth)
  router.push('/login')
}

// ── Firestore (unchanged) ──────────────────────────────────────────────────
async function loadEvents() {
  if (!uid) { loading.value = false; return }
  loading.value = true
  try {
    const snap = await getDocs(query(
      collection(db, 'events'),
      where('adminsIds', 'array-contains', uid),
      orderBy('startDate', 'desc'),
    ))
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    // Scope to the active organization, but keep legacy/unassigned events
    // (no orgId — created before orgs existed, or shared with you by someone
    // who hasn't set up an org) visible no matter which org is active, so
    // nothing you already had access to silently disappears.
    const orgId = activeOrg.value?.id ?? null
    events.value = all.filter(e => !e.orgId || e.orgId === orgId)
  } catch (e) {
    console.error('loadEvents:', e)
  } finally {
    loading.value = false
  }
}

function fuzzyScore(event, q) {
  const title = (event.title || '').toLowerCase()
  const needle = q.toLowerCase().trim()
  if (!needle) return 0
  if (title.includes(needle)) return 3
  const words = needle.split(/\s+/)
  if (words.every(w => title.includes(w))) return 2
  let ti = 0, qi = 0
  while (ti < title.length && qi < needle.length) {
    if (title[ti] === needle[qi]) qi++
    ti++
  }
  return qi === needle.length ? 1 : 0
}

// ── Status (unchanged) ─────────────────────────────────────────────────────
function statusClass(event) {
  const now = new Date()
  const start = event.startDate ? new Date(event.startDate) : null
  const end = event.endDate
    ? new Date(event.endDate)
    : start ? new Date(start.getTime() + 86400000) : null
  if (!start) return 'upcoming'
  if (now < start) return 'upcoming'
  if (end && now <= end) return 'ongoing'
  return 'completed'
}

function statusLabel(event) {
  return { upcoming: 'Upcoming', ongoing: 'Live', completed: 'Completed' }[statusClass(event)]
}

// ── Filters (unchanged + activeSort) ──────────────────────────────────────
const statusFilters = computed(() => [
  { label: 'All',       value: 'all',       count: events.value.length },
  { label: 'Upcoming',  value: 'upcoming',  count: events.value.filter(e => statusClass(e) === 'upcoming').length },
  { label: 'Ongoing',   value: 'ongoing',   count: events.value.filter(e => statusClass(e) === 'ongoing').length },
  { label: 'Completed', value: 'completed', count: events.value.filter(e => statusClass(e) === 'completed').length },
])

const roleFilters = [
  { label: 'All roles', value: 'all' },
  { label: 'Owner',     value: 'owner' },
  { label: 'Admin',     value: 'admin' },
]

const filteredEvents = computed(() => {
  let list = events.value
  if (activeFilter.value !== 'all') list = list.filter(e => statusClass(e) === activeFilter.value)
  if (activeRole.value === 'owner')  list = list.filter(e => e.authorId === uid)
  if (activeRole.value === 'admin')  list = list.filter(e => e.authorId !== uid)
  if (activeSort.value === 'oldest') list = [...list].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  else if (activeSort.value === 'az') list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
  return list
})

const sourceEvents = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return filteredEvents.value
  return filteredEvents.value
    .map(e => ({ e, score: fuzzyScore(e, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ e }) => e)
})

const totalPages = computed(() => Math.ceil(sourceEvents.value.length / PAGE_SIZE))

const displayedEvents = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sourceEvents.value.slice(start, start + PAGE_SIZE)
})

const pageRange = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (cur > 3) pages.push('…')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2) pages.push('…')
  pages.push(total)
  return pages
})

// ── Featured ───────────────────────────────────────────────────────────────
const featuredEvent = computed(() => {
  const upcoming = events.value.filter(e =>
    statusClass(e) === 'upcoming' && e.status === 'Published'
  )
  if (!upcoming.length) return null
  return [...upcoming].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]
})

const nonFeaturedDisplayed = computed(() =>
  displayedEvents.value.filter(e => e.id !== featuredEvent.value?.id)
)

// ── Helpers ────────────────────────────────────────────────────────────────
function daysAway(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

function daysAwayClass(event) {
  const sc = statusClass(event)
  if (sc === 'ongoing') return 'me-row-days-pill--live'
  const d = daysAway(event.startDate)
  if (d !== null && d > 0 && d < 30) return 'me-row-days-pill--soon'
  if (d !== null && d <= 0) return 'me-row-days-pill--past'
  return ''
}

function thumbColors(event) {
  const cover = coverType(event)
  const map = {
    goldfloral: { bg: 'rgba(201,168,76,0.13)',  accent: '#C9A84C' },
    bridal:     { bg: 'rgba(200,160,180,0.13)', accent: '#C8A0B4' },
    minimal:    { bg: 'rgba(150,150,150,0.08)', accent: '#999' },
    pearl:      { bg: 'rgba(176,168,152,0.11)', accent: '#B0A898' },
    rose:       { bg: 'rgba(200,120,120,0.13)', accent: '#C87878' },
    navy:       { bg: 'rgba(100,130,200,0.13)', accent: '#7090d0' },
  }
  return map[cover] || map.minimal
}

function coverType(event) {
  const styles = ['goldfloral', 'bridal', 'minimal', 'pearl', 'rose', 'navy']
  if (event.cover && styles.includes(event.cover)) return event.cover
  const hash = event.id
    ? [...event.id].reduce((a, c) => a + c.charCodeAt(0), 0) % styles.length
    : 0
  return styles[hash]
}

function invitationSvg(event) {
  const cover = coverType(event)
  const P = {
    goldfloral: { bg: '#FDFAF4', frame: '#C9A84C', text: '#2A1F0A', accent: '#C9A84C', flora: true },
    bridal:     { bg: '#FDF8FB', frame: '#C8A0B4', text: '#2A0F1E', accent: '#C8A0B4', flora: true },
    minimal:    { bg: '#FAFAFA', frame: '#AAAAAA', text: '#111111', accent: '#777777', flora: false },
    pearl:      { bg: '#F9F7F2', frame: '#B0A898', text: '#2A2520', accent: '#B0A898', flora: false },
    rose:       { bg: '#FDF5F5', frame: '#C87878', text: '#2A0A0A', accent: '#C87878', flora: true },
    navy:       { bg: '#F3F5FA', frame: '#2A3A6A', text: '#0A1530', accent: '#2A3A6A', flora: false },
  }
  const p = P[cover] || P.minimal
  const uid_frag = (event.id || 'x').slice(0, 6)
  const title = event.title || 'Untitled'
  const words = title.split(' ')
  const mid = Math.ceil(words.length / 2)
  const line1 = words.slice(0, mid).join(' ')
  const line2 = words.slice(mid).join(' ')
  const shortLine1 = line1.length > 20 ? line1.slice(0, 18) + '…' : line1
  const shortLine2 = line2.length > 20 ? line2.slice(0, 18) + '…' : line2
  const dateNum = event.startDate ? new Date(event.startDate).getDate() : '—'
  const dateMon = event.startDate ? new Date(event.startDate).toLocaleDateString('en', { month: 'short' }).toUpperCase() : ''
  const year = event.startDate ? new Date(event.startDate).getFullYear() : ''
  const venue = (event.location || '').slice(0, 22)
  const cat = (event.categoryId || 'EVENT').toUpperCase().slice(0, 14)

  const flora = p.flora
    ? `<circle cx="150" cy="26" r="5" fill="${p.accent}" opacity="0.45"/>
       <circle cx="133" cy="33" r="3.5" fill="${p.accent}" opacity="0.32"/>
       <circle cx="167" cy="33" r="3.5" fill="${p.accent}" opacity="0.32"/>
       <path d="M143,28 Q137,20 132,24 Q138,29 143,28Z" fill="${p.accent}" opacity="0.38"/>
       <path d="M157,28 Q163,20 168,24 Q162,29 157,28Z" fill="${p.accent}" opacity="0.38"/>
       <line x1="110" y1="44" x2="190" y2="44" stroke="${p.frame}" stroke-width="0.7" opacity="0.28"/>
       <g transform="translate(0,400) scale(1,-1)">
         <circle cx="150" cy="26" r="4" fill="${p.accent}" opacity="0.28"/>
         <circle cx="135" cy="32" r="2.5" fill="${p.accent}" opacity="0.2"/>
         <circle cx="165" cy="32" r="2.5" fill="${p.accent}" opacity="0.2"/>
         <line x1="110" y1="44" x2="190" y2="44" stroke="${p.frame}" stroke-width="0.7" opacity="0.2"/>
       </g>`
    : `<line x1="88" y1="38" x2="212" y2="38" stroke="${p.frame}" stroke-width="0.8" opacity="0.3"/>
       <line x1="88" y1="362" x2="212" y2="362" stroke="${p.frame}" stroke-width="0.8" opacity="0.22"/>`

  const y2 = line2 ? 136 : 120
  const divY = line2 ? 153 : 133
  const numY = line2 ? 193 : 173
  const monY = line2 ? 213 : 193
  const sepY = line2 ? 228 : 208
  const venY = line2 ? 250 : 230
  const ornY = line2 ? 295 : 272

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
  <defs>
    <pattern id="gr-${uid_frag}" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
      <rect width="3" height="3" fill="${p.bg}"/>
      <circle cx="1" cy="1" r="0.45" fill="${p.frame}" opacity="0.05"/>
      <circle cx="2.5" cy="2.5" r="0.35" fill="${p.frame}" opacity="0.04"/>
    </pattern>
  </defs>
  <rect width="300" height="400" fill="${p.bg}"/>
  <rect width="300" height="400" fill="url(#gr-${uid_frag})"/>
  <rect x="11" y="11" width="278" height="378" rx="3" fill="none" stroke="${p.frame}" stroke-width="0.9" opacity="0.42"/>
  <rect x="17" y="17" width="266" height="366" rx="2" fill="none" stroke="${p.frame}" stroke-width="0.4" opacity="0.26"/>
  ${flora}
  <text x="150" y="76" text-anchor="middle" font-family="Inter,sans-serif" font-size="7.5" font-weight="600" letter-spacing="2.5" fill="${p.text}" opacity="0.38">${cat}</text>
  <text x="150" y="112" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-style="italic" fill="${p.text}">${shortLine1}</text>
  ${line2 ? `<text x="150" y="${y2}" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-style="italic" fill="${p.text}">${shortLine2}</text>` : ''}
  <line x1="112" y1="${divY}" x2="138" y2="${divY}" stroke="${p.accent}" stroke-width="0.8" opacity="0.52"/>
  <circle cx="150" cy="${divY}" r="2.5" fill="none" stroke="${p.accent}" stroke-width="0.8" opacity="0.52"/>
  <line x1="162" y1="${divY}" x2="188" y2="${divY}" stroke="${p.accent}" stroke-width="0.8" opacity="0.52"/>
  <text x="150" y="${numY}" text-anchor="middle" font-family="Georgia,serif" font-size="32" fill="${p.text}" letter-spacing="-1">${dateNum}</text>
  <text x="150" y="${monY}" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="600" letter-spacing="2" fill="${p.text}" opacity="0.48">${dateMon} · ${year}</text>
  <line x1="100" y1="${sepY}" x2="200" y2="${sepY}" stroke="${p.frame}" stroke-width="0.5" opacity="0.22"/>
  ${venue ? `<text x="150" y="${venY}" text-anchor="middle" font-family="Inter,sans-serif" font-size="8.5" fill="${p.text}" opacity="0.42" letter-spacing="0.4">${venue}</text>` : ''}
  <text x="150" y="${ornY}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${p.accent}" opacity="0.42">✦</text>
</svg>`
}

// ── Affiliate ──────────────────────────────────────────────────────────────
const affiliate            = ref(null)
const affiliateCommissions = ref([])

async function loadAffiliate() {
  if (!uid) return
  try {
    const snap = await getDocs(query(
      collection(db, 'affiliates'),
      where('userId', '==', uid),
      where('status', '==', 'active'),
      limit(1),
    ))
    if (snap.empty) return
    affiliate.value = { id: snap.docs[0].id, ...snap.docs[0].data() }
    loadAffiliateCommissions(affiliate.value.id)
  } catch (e) {
    console.error('loadAffiliate:', e)
  }
}

async function loadAffiliateCommissions(affiliateId) {
  try {
    const snap = await getDocs(query(
      collection(db, 'affiliateCommissions'),
      where('affiliateId', '==', affiliateId),
      orderBy('calculatedAt', 'desc'),
    ))
    affiliateCommissions.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('loadAffiliateCommissions:', e)
  }
}

const totalEarned = computed(() =>
  affiliateCommissions.value
    .filter(c => c.status === 'paid')
    .reduce((s, c) => s + (c.commissionAmount ?? 0), 0)
)

const pendingPayout = computed(() =>
  affiliateCommissions.value
    .filter(c => c.status === 'pending')
    .reduce((s, c) => s + (c.commissionAmount ?? 0), 0)
)

const recentCommissions = computed(() => affiliateCommissions.value.slice(0, 5))

// ── Interactions (unchanged) ───────────────────────────────────────────────
function onSearch() {
  currentPage.value = 1
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
}

// ── Date formatting (unchanged) ────────────────────────────────────────────
function formatMonth(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en', { month: 'short' }).toUpperCase()
}

function formatDay(iso) {
  if (!iso) return '—'
  return new Date(iso).getDate()
}

function formatFullDate(iso) {
  if (!iso) return 'Date TBD'
  return new Date(iso).toLocaleDateString('en', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

function goToEvent(id) {
  router.push(`/event/${id}`)
}

// Sync page to URL so browser back/forward and "All Events" button preserve position
watch(currentPage, (n) => {
  router.replace({ query: n > 1 ? { page: n } : {} })
})

watch([activeFilter, activeRole, activeSort], () => { currentPage.value = 1 })

onMounted(() => {
  const qPage = parseInt(route.query.page)
  if (qPage > 1) currentPage.value = qPage
  loadEvents()
  loadAffiliate()
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
/* ── Tokens ── */
.me-root {
  --ink: #f0f0ec;
  --ink-soft: #d8d4cd;
  --ink-muted: #888;
  --ink-dim: #555;
  --line: #242424;
  --line-soft: #1e1e1e;
  --line-strong: #2a2a2a;
  --paper-soft: #141414;
  --emerald: #30D158;
  --emerald-soft: rgba(48,209,88,0.12);

  /* ── Layout tokens (overridden by global light-theme CSS; org can override the
     surface color itself via --org-*-bg, set in useOrg.js's watchEffect) ── */
  --me-topbar-bg:   var(--org-topbar-bg, rgba(10,10,11,0.88));
  --me-controls-bg: #111;
  --me-card-bg:     #141414;
  --me-dropdown-bg: #141414;
  --me-page-bg:     var(--org-page-bg, #0a0a0b);

  min-height: 100vh;
  background: var(--me-page-bg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--ink);
  transition: background 300ms ease, color 300ms ease;
}

/* ── Topbar ── */
.me-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--me-topbar-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 1px 0 rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3);
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}
.me-topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.me-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.me-brand-glyph { font-size: 13px; color: var(--gold); line-height: 1; }
.me-brand-logo { width: 20px; height: 20px; border-radius: 6px; object-fit: cover; }
.me-brand-name {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 20px;
  font-weight: 400;
  color: var(--org-topbar-text, var(--ink));
  letter-spacing: -0.3px;
}
.me-bc-sep { font-size: 15px; color: var(--line-strong); font-weight: 300; }
.me-bc-page { font-size: 14px; font-weight: 500; color: var(--ink-muted); }

.me-topbar-right { display: flex; align-items: center; gap: 10px; }

/* Admin dropdown */
.me-admin-wrap { position: relative; }
.me-admin-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--line-strong);
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-muted);
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms, color 130ms;
}
.me-admin-pill:hover { background: var(--paper-soft); color: var(--ink); }
.me-admin-chevron {
  color: var(--ink-dim);
  transition: transform 180ms ease;
  flex-shrink: 0;
}
.me-admin-chevron--open { transform: rotate(180deg); }

.me-admin-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 210px;
  background: var(--me-dropdown-bg);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
  overflow: hidden;
  z-index: 200;
  transition: background 300ms ease, border-color 300ms ease;
}
.me-dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
}
.me-dropdown-dot { flex-shrink: 0; }
.me-dropdown-header-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.me-dropdown-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.me-dropdown-email {
  font-size: 11.5px;
  color: var(--ink-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.me-dropdown-divider { height: 1px; background: var(--line); }
.me-dropdown-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 11px 16px;
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-muted);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background 120ms, color 120ms;
}
.me-dropdown-item:hover { background: var(--paper-soft); color: var(--ink); }
.me-dropdown-item--signout:hover { background: rgba(255,69,58,0.08); color: #FF453A; }
.me-admin-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--line-strong);
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-muted);
}
.me-admin-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--emerald);
  flex-shrink: 0;
}
.me-pill-balance {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgb(from var(--gold) r g b / 0.10);
  border: 1px solid rgb(from var(--gold) r g b / 0.25);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #9A7218;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Wallet card inside dropdown */
.me-dropdown-balance {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 12px;
}
.me-dbal-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgb(from var(--gold) r g b / 0.10);
  border: 1px solid rgb(from var(--gold) r g b / 0.20);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #B8924D;
  flex-shrink: 0;
}
.me-dbal-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.me-dbal-label {
  font-size: 10px;
  font-weight: 700;
  color: #9A9690;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.me-dbal-amount {
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: -0.3px;
}
.me-dbal-amount--loading { color: #4f617a; }

.me-create-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--gold);
  color: var(--gold-contrast);
  border: none;
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms;
  letter-spacing: 0.1px;
}
.me-create-btn:hover { background: #d4b560; }
.me-create-btn--lg {
  padding: 10px 24px;
  font-size: 14px;
  border-radius: 12px;
}

/* ── Page shell ── */
.me-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px 80px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Page header ── */
.me-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.me-header-copy { display: flex; flex-direction: column; gap: 5px; }
.me-greeting {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 40px;
  font-weight: 400;
  letter-spacing: -1px;
  color: var(--ink);
  line-height: 1;
  margin: 0;
}
.me-header-sub {
  font-size: 13px;
  color: var(--ink-muted);
  margin: 0;
  font-weight: 400;
}
.me-header-sub--loading { color: var(--ink-dim); }

.me-header-stats {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.me-hstat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0 22px;
}
.me-hstat-div {
  width: 1px;
  height: 28px;
  background: var(--line);
  flex-shrink: 0;
}
.me-hstat-val {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--ink);
  line-height: 1;
  letter-spacing: -0.5px;
}
.me-hstat-val--gold  { color: var(--gold); }
.me-hstat-val--green { color: var(--emerald); }
.me-hstat-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--ink-dim);
}

/* ── Controls bar ── */
.me-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--me-controls-bg);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  padding: 8px 8px 8px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: background 300ms ease, border-color 300ms ease;
}
.me-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
}
.me-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-muted);
  cursor: pointer;
  font-family: inherit;
  transition: background 120ms, color 120ms;
  white-space: nowrap;
}
.me-tab:hover { background: rgba(255,255,255,0.04); color: var(--ink-soft); }
.me-tab--active {
  background: rgba(240,240,236,0.09);
  color: var(--ink);
  font-weight: 600;
}
.me-tab-count {
  font-size: 10.5px;
  font-weight: 600;
  background: rgba(255,255,255,0.06);
  color: var(--ink-dim);
  padding: 1px 6px;
  border-radius: 6px;
}
.me-tab-count--active {
  background: rgba(240,240,236,0.10);
  color: var(--ink-muted);
}
.me-controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Intro ── (legacy class — kept for compatibility) */
.me-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
}
.me-intro-left { display: flex; flex-direction: column; gap: 10px; }
.me-eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--ink-muted);
  background: var(--paper-soft);
  border: 1px solid var(--line);
  padding: 4px 12px;
  border-radius: 20px;
  width: fit-content;
}
.me-eyebrow-sparkle { color: var(--gold); font-size: 11px; }
.me-headline {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 64px;
  font-weight: 400;
  letter-spacing: -1.5px;
  color: var(--ink);
  margin: 0;
  line-height: 1.0;
}
.me-subtitle { font-size: 15px; color: var(--ink-muted); margin: 0; }

.me-intro-stats {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.me-stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 28px;
}
.me-stat-value {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 38px;
  font-weight: 400;
  color: var(--ink);
  line-height: 1;
  letter-spacing: -1px;
}
.me-stat-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.me-stat-block--emerald .me-stat-value { color: var(--emerald); }
.me-stat-block--dim .me-stat-value { color: var(--ink-dim); }
.me-stat-divider {
  width: 1px;
  height: 44px;
  background: var(--line-strong);
  flex-shrink: 0;
}

/* ── Filter bar ── */
.me-filterbar {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #141414;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  padding: 10px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  flex-wrap: wrap;
}
.me-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 160px;
}
.me-search-icon-svg {
  position: absolute;
  left: 11px;
  color: var(--ink-dim);
  pointer-events: none;
  flex-shrink: 0;
}
.me-search-input {
  width: 100%;
  padding: 8px 30px 8px 34px;
  border: none;
  background: transparent;
  font-size: 13.5px;
  color: var(--ink);
  outline: none;
  font-family: inherit;
}
.me-search-input::placeholder { color: var(--ink-dim); }
.me-search-clear {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-dim);
  display: flex;
  align-items: center;
  padding: 2px;
  transition: color 130ms;
}
.me-search-clear:hover { color: var(--ink-muted); }
.me-fb-divider { width: 1px; height: 28px; background: var(--line-strong); flex-shrink: 0; }

.me-status-chips { display: flex; align-items: center; gap: 4px; }
.me-status-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-muted);
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms, color 130ms;
}
.me-status-chip:hover { background: var(--paper-soft); color: var(--ink); }
.me-status-chip--active {
  background: rgba(226,232,240,0.12);
  border: 1px solid rgba(226,232,240,0.16);
  color: #e2e8f0;
}
.me-chip-count {
  font-size: 10.5px;
  font-weight: 600;
  background: var(--paper-soft);
  color: var(--ink-dim);
  padding: 1px 6px;
  border-radius: 8px;
}
.me-chip-count--active { background: rgba(226,232,240,0.10); color: rgba(226,232,240,0.7); }
.me-fb-select {
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper-soft);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-muted);
  font-family: inherit;
  outline: none;
  cursor: pointer;
}
.me-fb-select:focus { border-color: var(--line-strong); }

/* ── Loading skeletons ── */
.me-skeleton-list { display: flex; flex-direction: column; gap: 20px; padding-top: 8px; }
.me-skeleton {
  height: 160px;
  border-radius: 16px;
  background: linear-gradient(90deg, #141414 25%, #1e1e1e 50%, #141414 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Empty state ── */
.me-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 80px 20px;
  border: 1px dashed var(--line-strong);
  border-radius: 20px;
}
.me-empty-glyph { font-size: 32px; color: var(--gold); opacity: 0.6; }
.me-empty-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; color: var(--ink); margin: 0; text-align: center; }

/* ── Status pills ── */
.me-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.1px;
  white-space: nowrap;
}
.me-status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.me-status-pill--upcoming  { background: var(--paper-soft); color: var(--ink-muted); }
.me-status-pill--upcoming .me-status-dot { background: var(--ink-dim); }
.me-status-pill--ongoing   { background: rgb(from var(--gold) r g b / 0.10); color: var(--gold); }
.me-status-pill--ongoing .me-status-dot { background: var(--gold); animation: pulse-dot 1.6s ease-in-out infinite; }
.me-status-pill--completed { background: var(--paper-soft); color: var(--ink-dim); }
.me-status-pill--completed .me-status-dot { background: var(--ink-dim); }
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.7); }
}
/* draft status treated same as upcoming */
.me-status-pill--draft { background: var(--line-soft); color: var(--ink-muted); }
.me-status-pill--draft .me-status-dot { background: var(--ink-dim); }

/* ── Role badge ── */
.me-role-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 6px;
}
.me-role-badge--owner { background: rgba(226,232,240,0.12); border: 1px solid rgba(226,232,240,0.16); color: #e2e8f0; }
.me-role-badge--admin { background: transparent; border: 1px solid var(--line-strong); color: var(--ink-muted); }

/* ── Featured hero ── */
.me-featured {
  display: grid;
  grid-template-columns: 165px 1fr 180px;
  gap: 24px;
  padding: 20px 22px 20px 18px;
  border: 1px solid #2a2a2a;
  border-top: 1px solid #323232;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 8px 24px -4px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: box-shadow 280ms ease, transform 280ms ease;
  background: linear-gradient(160deg, #181818 0%, #141414 100%);
}
.me-featured:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 16px 40px -6px rgba(0,0,0,0.35);
  transform: translateY(-2px);
}

/* Featured thumb col */
.me-feat-thumb-col {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.me-feat-thumb-outline {
  position: absolute;
  inset: 6px;
  border: 1px solid var(--line);
  border-radius: 10px;
  transform: rotate(-2deg);
  pointer-events: none;
}
.me-feat-thumb {
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  transform: rotate(1deg);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  line-height: 0;
}
.me-feat-thumb :deep(svg) { display: block; width: 100%; height: auto; }

/* Featured content col */
.me-feat-content { display: flex; flex-direction: column; gap: 0; justify-content: center; }
.me-feat-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.me-feat-eyebrow-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--ink-dim);
  white-space: nowrap;
}
.me-feat-eyebrow-sparkle { color: var(--gold); font-size: 10px; flex-shrink: 0; }
.me-feat-eyebrow-line { flex: 1; height: 1px; background: var(--line); }
.me-feat-title {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 40px;
  font-weight: 400;
  color: var(--ink);
  margin: 0 0 16px;
  letter-spacing: -1px;
  line-height: 1.05;
}
.me-feat-meta { display: flex; gap: 6px 20px; flex-wrap: wrap; margin-bottom: 24px; }
.me-feat-meta-item { display: flex; align-items: center; gap: 7px; }
.me-feat-meta-item svg { color: var(--ink-dim); flex-shrink: 0; }
.me-feat-meta-val { font-size: 13px; color: var(--ink-soft); font-weight: 500; }

.me-feat-progress { display: flex; flex-direction: column; gap: 5px; }
.me-feat-progress-track {
  height: 4px;
  background: var(--line);
  border-radius: 4px;
  overflow: hidden;
}
.me-feat-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ink-soft), var(--ink));
  border-radius: 4px;
  transition: width 600ms ease;
}
.me-feat-progress-label { font-size: 11px; color: var(--ink-dim); font-family: 'JetBrains Mono', monospace; }

.me-feat-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.me-feat-open-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--gold);
  color: var(--gold-contrast);
  border: none;
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background 140ms;
}
.me-feat-open-btn:hover { background: #d4b560; }

/* Featured countdown col */
.me-feat-countdown {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 0;
  padding-right: 4px;
}
.me-feat-cd-month {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--ink-dim);
  line-height: 1;
  margin-bottom: 2px;
}
.me-feat-cd-day {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 82px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -4px;
  line-height: 0.85;
  display: block;
}
.me-feat-cd-year {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--ink-dim);
  margin-top: 4px;
  margin-bottom: 10px;
}
.me-feat-cd-ticket {
  background: #191919;
  box-shadow: 0 4px 12px rgba(0,0,0,0.35);
  border: 1px solid var(--line-strong);
  color: var(--ink);
  border-radius: 10px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.me-feat-cd-num {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.5px;
}
.me-feat-cd-words {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.65);
  white-space: pre-line;
  line-height: 1.3;
}

/* ── Section heading ── */
.me-section-head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.me-section-line {
  flex: 1;
  height: 1px;
  background: var(--line-strong);
}
.me-section-meta {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-dim);
  white-space: nowrap;
}

/* ── Event list ── */
.me-hanging-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.me-row {
  display: grid;
  grid-template-columns: 118px 1fr 100px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.07);
  border-left: 4px solid transparent;
  cursor: pointer;
  overflow: hidden;
  min-height: 124px;
  transition: border-color 200ms, box-shadow 200ms, transform 200ms, filter 200ms;
}
.me-row:hover {
  border-color: rgba(255,255,255,0.14);
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  transform: translateY(-2px);
  filter: brightness(1.06);
}
.me-row--upcoming  { border-left-color: rgb(from var(--gold) r g b / 0.8); }
.me-row--ongoing   { border-left-color: rgba(48,209,88,0.85); }
.me-row--completed { border-left-color: rgba(255,255,255,0.12); }
.me-row--draft     { border-left-color: rgba(255,255,255,0.08); }

/* Left: invitation card column */
.me-row-card-col {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 10px;
  border-right: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
  background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 9px 9px;
}
.me-row-card-outline {
  position: absolute;
  inset: 8px 5px;
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 9px;
  transform: rotate(-2.5deg);
  pointer-events: none;
}
.me-row-card-inner {
  position: relative;
  width: 74px;
  border-radius: 6px;
  overflow: hidden;
  transform: rotate(1.5deg);
  box-shadow: 4px 8px 24px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.4);
  line-height: 0;
  z-index: 1;
  transition: transform 240ms ease, box-shadow 240ms ease;
}
.me-row:hover .me-row-card-inner {
  transform: rotate(0.3deg) scale(1.06);
  box-shadow: 6px 12px 32px rgba(0,0,0,0.75), 0 3px 8px rgba(0,0,0,0.5);
}
.me-row-card-inner :deep(svg) { display: block; width: 100%; height: auto; }

/* Middle: body */
.me-row-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  padding: 18px 24px;
}
.me-row-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 11px;
}
.me-row-eyebrow-spark { font-size: 10px; color: var(--gold); flex-shrink: 0; }
.me-row-eyebrow-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgb(from var(--gold) r g b / 0.28) 0%, rgba(255,255,255,0.04) 100%);
}

.me-row-title {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 22px;
  font-weight: 400;
  color: var(--ink);
  margin: 0 0 10px;
  letter-spacing: -0.4px;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.me-row-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.me-row-meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--ink-dim);
}
.me-row-meta-item svg { flex-shrink: 0; }
.me-status-pill--inline { font-size: 10.5px; padding: 2px 8px; border-radius: 20px; }

/* ── Theme toggle ── */
.me-theme-toggle {
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

/* Right: editorial date countdown */
.me-row-cd {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-left: 1px solid var(--line);
  padding: 14px 8px;
  gap: 0;
}
.me-row-cd-year {
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--ink-dim);
  opacity: 0.55;
  line-height: 1;
  margin-bottom: 3px;
}
.me-row-cd-mon {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1;
  margin-bottom: 0;
}
.me-row-cd-day {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 60px;
  font-weight: 400;
  line-height: 0.85;
  letter-spacing: -3px;
  display: block;
}
.me-row-cd-ticket {
  margin-top: 11px;
  background: transparent;
  border: 1px dashed rgba(255,255,255,0.18);
  border-radius: 6px;
  padding: 4px 9px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--ink-dim);
  text-align: center;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.me-row-cd-ticket.me-row-days-pill--live {
  border-style: solid;
  border-color: rgba(48,209,88,0.4);
  background: var(--emerald-soft);
  color: var(--emerald);
}
.me-row-cd-ticket.me-row-days-pill--soon {
  border-color: rgb(from var(--gold) r g b / 0.35);
  color: rgb(from var(--gold) r g b / 0.85);
}
.me-row-cd-ticket.me-row-days-pill--past { opacity: 0.4; }

.me-live-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--emerald);
  animation: pulse-dot 1.6s ease-in-out infinite;
  flex-shrink: 0;
}

/* ── Pagination ── */
.me-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
}
.me-pagination-info { font-size: 13px; color: var(--ink-muted); }
.me-pagination-controls { display: flex; align-items: center; gap: 4px; }
.me-page-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--me-controls-bg);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-muted);
  cursor: pointer;
  font-family: inherit;
  transition: border-color 130ms, color 130ms, background 130ms;
}
.me-page-btn:hover:not(:disabled):not(.me-page-btn--active) {
  border-color: var(--line-strong);
  color: var(--ink);
}
.me-page-btn--active {
  background: rgba(226,232,240,0.12);
  border-color: rgba(226,232,240,0.18);
  color: #e2e8f0;
  font-weight: 700;
}
.me-page-btn--nav { color: var(--ink-dim); }
.me-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.me-page-ellipsis {
  width: 28px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-dim);
  user-select: none;
}

/* ── Logout modal ── */
.me-modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.me-modal {
  background: var(--me-dropdown-bg);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 28px 28px 24px;
  width: 340px;
  box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: background 300ms ease, border-color 300ms ease;
}
.me-modal-title {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 22px;
  font-weight: 400;
  color: var(--ink);
  margin: 0;
  letter-spacing: -0.3px;
}
.me-modal-body {
  font-size: 13.5px;
  color: var(--ink-muted);
  margin: 0 0 8px;
  line-height: 1.5;
}
.me-modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.me-modal-cancel {
  background: transparent;
  border: 1px solid var(--line-strong);
  color: var(--ink-muted);
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms, color 130ms;
}
.me-modal-cancel:hover { background: var(--paper-soft); color: var(--ink); }
.me-modal-confirm {
  background: rgba(255,255,255,0.12);
  color: #e2e8f0;
  border: 1px solid rgba(255,255,255,0.12);
  border: none;
  padding: 8px 18px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 130ms;
}
.me-modal-confirm:hover { opacity: 0.85; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .me-controls { flex-wrap: wrap; gap: 8px; }
  .me-tabs { overflow-x: auto; scrollbar-width: none; }
  .me-tabs::-webkit-scrollbar { display: none; }
  .me-controls-right { flex-shrink: 0; }
  .me-search-wrap { flex-shrink: 0; min-width: 140px; }
  .me-fb-select { flex-shrink: 0; }
  .me-header { flex-direction: column; align-items: flex-start; gap: 20px; }
  .me-header-stats { align-self: flex-start; }
  .me-hstat { padding: 0 20px; }
  .me-hstat:first-child { padding-left: 0; }
}

@media (max-width: 860px) {
  .me-page { padding: 24px 20px 60px; gap: 22px; }
  .me-greeting { font-size: 40px; letter-spacing: -1px; }
  /* Featured: thumb (small) + content, no countdown */
  .me-featured { grid-template-columns: 120px 1fr; gap: 24px; padding: 24px; }
  .me-feat-thumb-col { display: flex; }
  .me-feat-countdown { display: none; }
  .me-feat-title {
    font-size: 26px; letter-spacing: -0.5px; margin-bottom: 12px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .me-feat-eyebrow { margin-bottom: 10px; }
  .me-feat-meta { margin-bottom: 18px; }
}
@media (max-width: 640px) {
  .me-topbar-inner { padding: 12px 16px; }
  .me-admin-pill { display: none; }
  .me-page { padding: 16px 14px 48px; gap: 16px; }
  .me-greeting { font-size: 30px; letter-spacing: -0.6px; }
  .me-header-sub { font-size: 12.5px; }
  .me-header { padding-bottom: 16px; gap: 12px; }
  .me-header-stats { gap: 0; }
  .me-hstat { padding: 0 12px; }
  .me-hstat:first-child { padding-left: 0; }
  .me-hstat-val { font-size: 24px; }
  .me-hstat-div { height: 22px; }
  /* Controls: column layout. Tabs need width:100% so they don't burst the
     container — they scroll internally. Controls-right is a 2-col grid. */
  .me-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 8px;
    overflow: hidden;
  }
  .me-tabs { width: 100%; overflow-x: auto; scrollbar-width: none; gap: 1px; }
  .me-tabs::-webkit-scrollbar { display: none; }
  .me-tab { padding: 6px 10px; font-size: 12px; flex-shrink: 0; }
  .me-controls-right {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .me-search-wrap { grid-column: 1 / -1; min-width: 0; }
  .me-fb-select { font-size: 12px; width: 100%; min-width: 0; box-sizing: border-box; }
  /* Featured card */
  .me-featured { grid-template-columns: 72px 1fr; gap: 12px; padding: 14px 16px; border-radius: 14px; }
  .me-feat-countdown { display: none; }
  /* Thumb: fixed width so it sits INSIDE the outline frame (matches row-card style) */
  .me-feat-thumb { width: 48px; }
  .me-feat-thumb-outline { inset: 5px; border-radius: 9px; }
  .me-feat-title {
    font-size: 18px; letter-spacing: -0.3px; line-height: 1.2; margin-bottom: 10px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .me-feat-eyebrow { margin-bottom: 8px; }
  .me-feat-eyebrow-line { display: none; }
  .me-feat-meta { gap: 5px 10px; margin-bottom: 12px; }
  .me-feat-meta-val { font-size: 12px; }
  .me-feat-actions { flex-wrap: wrap; gap: 6px 8px; align-items: center; }
  .me-feat-open-btn { padding: 7px 13px; font-size: 12px; white-space: nowrap; }
  /* Event rows */
  .me-row { grid-template-columns: 72px 1fr; min-height: 96px; }
  .me-row-cd { display: none; }
  .me-row-card-inner { width: 46px; }
  .me-row-body { padding: 12px 14px; }
  .me-row-title { font-size: 16px; margin-bottom: 6px; }
  .me-row-eyebrow { margin-bottom: 6px; }
}

@media (max-width: 400px) {
  .me-topbar-inner { padding: 10px 14px; }
  .me-create-label { display: none; }
  .me-bc-page { display: none; }
  .me-bc-sep { display: none; }
  .me-page { padding: 12px 12px 40px; gap: 14px; }
  .me-greeting { font-size: 26px; letter-spacing: -0.4px; }
  .me-header-sub { display: none; }
  .me-hstat-val { font-size: 22px; }
  .me-hstat { padding: 0 10px; }
  .me-featured { grid-template-columns: 64px 1fr; gap: 10px; padding: 12px 14px; }
  .me-feat-thumb { width: 42px; }
  .me-feat-thumb-outline { inset: 4px; border-radius: 8px; }
  .me-feat-title { font-size: 16px; -webkit-line-clamp: 2; }
  .me-feat-open-btn { padding: 6px 11px; font-size: 11px; white-space: nowrap; }
  .me-feat-meta-val { font-size: 11px; }
  .me-tab { padding: 5px 8px; font-size: 11.5px; }
}

/* ─────────────────────────────────────────────────────────
   Affiliate Earnings Strip
   Only rendered when the signed-in user is an affiliate.
───────────────────────────────────────────────────────── */
.me-aff-strip {
  background: var(--me-controls-bg);
  border: 1px solid var(--line-strong);
  border-left: 3px solid var(--gold);
  border-radius: 14px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.4);
}

/* Header */
.me-aff-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.me-aff-sparkle {
  font-size: 12px;
  color: var(--gold);
  line-height: 1;
}
.me-aff-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.01em;
  flex: 1;
}
.me-aff-code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--gold);
  background: rgb(from var(--gold) r g b / 0.08);
  border: 1px solid rgb(from var(--gold) r g b / 0.2);
  border-radius: 6px;
  padding: 3px 9px;
}

/* Stats */
.me-aff-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.me-aff-stat {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 16px 18px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-top: 2px solid rgb(from var(--gold) r g b / 0.45);
  border-radius: 10px;
  transition: background 180ms, border-color 180ms;
}
.me-aff-stat:hover {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.11);
}
.me-aff-stat-val {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 30px;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: -0.5px;
  line-height: 1;
}
.me-aff-stat-val--gold  { color: var(--gold); }
.me-aff-stat-val--green { color: #30D158; }
.me-aff-stat-label {
  font-size: 10px;
  color: var(--ink-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

/* Divider between stats and list */
.me-aff-divider {
  height: 1px;
  background: var(--line-soft);
  margin: 0 -2px;
}

/* Commission list */
.me-aff-com-head {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.me-aff-com-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.me-aff-com-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 9px;
  background: rgba(255,255,255,0.02);
  transition: background 0.13s;
}
.me-aff-com-row:hover { background: rgba(255,255,255,0.04); }
.me-aff-com-left {
  display: flex;
  align-items: center;
  gap: 9px;
}
.me-aff-com-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.me-aff-com-dot--pending { background: var(--gold); }
.me-aff-com-dot--paid    { background: #30D158; }
.me-aff-com-event {
  font-size: 12px;
  color: var(--ink-soft);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.me-aff-com-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.me-aff-com-amount {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.me-aff-com-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: capitalize;
  letter-spacing: 0.03em;
}
.me-aff-com-badge--pending {
  background: rgb(from var(--gold) r g b / 0.10);
  color: var(--gold);
}
.me-aff-com-badge--paid {
  background: rgba(48,209,88,0.10);
  color: #30D158;
}

/* Empty state */
.me-aff-empty {
  font-size: 12px;
  color: var(--ink-dim);
  line-height: 1.6;
  padding: 4px 0;
}

@media (max-width: 768px) {
  .me-aff-stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}

@media (max-width: 600px) {
  .me-aff-strip { padding: 14px 16px; gap: 12px; }
  .me-aff-stats { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .me-aff-stat { padding: 10px 8px; border-top-width: 1px; }
  .me-aff-stat-val { font-size: 18px; letter-spacing: -0.3px; }
  .me-aff-stat-label { font-size: 8.5px; letter-spacing: 0.06em; }
}

@media (max-width: 400px) {
  .me-aff-strip { padding: 12px 14px; gap: 10px; }
  .me-aff-stats { grid-template-columns: repeat(2, 1fr); gap: 4px; }
  .me-aff-stat { padding: 8px 6px; }
  .me-aff-stat-val { font-size: 16px; }
  .me-aff-stat-label { font-size: 8px; }
}
</style>
