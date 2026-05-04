<template>
  <div class="dash-root">
    <!-- Ambient orbs -->
    <div class="orb orb--top-right" />
    <div class="orb orb--bottom-left" />

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-dot" />
        <span class="brand-name">haflaway</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="nav-item--active"
        >
          <span class="nav-icon" v-html="item.icon" />
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Right column -->
    <div class="dash-right">
      <!-- Shared top bar -->
      <header class="topbar">
        <div class="topbar-left">
          <span class="topbar-breadcrumb">haflaway</span>
          <span class="topbar-sep">/</span>
          <span class="topbar-title">{{ route.meta.title }}</span>
        </div>
        <div class="topbar-right">
          <div class="avatar-pill">
            <div class="avatar-dot" />
            <span class="avatar-label">Admin</span>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="dash-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  {
    label: 'Manage Events',
    to: '/dashboard/events',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>`,
  },
  {
    label: 'Manage Users',
    to: '/dashboard/users',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>`,
  },
  {
    label: 'Card Templates',
    to: '/dashboard/card-templates',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>`,
  },
  {
    label: 'Settings',
    to: '/dashboard/settings',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>`,
  },
]
</script>

<style scoped>
/* ── Tokens ──────────────────────────────────────────────────────────────── */
:root {
  --bg:      #111114;
  --card:    #1C1C1E;
  --card2:   #28282C;
  --sep:     #2C2C2E;
  --lime:    #C9A84C;
  --limedim: #2A2210;
  --lbl1:    #EEEEF0;
  --lbl2:    #AEAEB2;
  --lbl3:    #8E8E93;
  --lbl4:    #48484A;
}

/* ── Root shell ──────────────────────────────────────────────────────────── */
.dash-root {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #111114;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
}

/* ── Ambient orbs ────────────────────────────────────────────────────────── */
.orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(80px);
}
.orb--top-right {
  width: 320px;
  height: 320px;
  top: -80px;
  right: -80px;
  background: rgba(201, 168, 76, 0.10);
}
.orb--bottom-left {
  width: 260px;
  height: 260px;
  bottom: -60px;
  left: 60px;
  background: rgba(201, 168, 76, 0.05);
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.sidebar {
  width: 232px;
  flex-shrink: 0;
  background: #1C1C1E;
  border-right: 0.8px solid #2C2C2E;
  display: flex;
  flex-direction: column;
  padding: 28px 16px 24px;
  gap: 32px;
  z-index: 1;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 4px;
}

.brand-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #C9A84C;
  flex-shrink: 0;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  color: #EEEEF0;
  letter-spacing: -0.4px;
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none;
  color: #8E8E93;
  font-size: 14px;
  font-weight: 500;
  transition: background 160ms, color 160ms;
}

.nav-item:hover {
  background: #28282C;
  color: #AEAEB2;
}

.nav-item--active {
  background: #2A2210;
  color: #C9A84C;
  border: 0.8px solid rgba(201, 168, 76, 0.25);
}

.nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* ── Right column ────────────────────────────────────────────────────────── */
.dash-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1;
}

/* ── Top bar ─────────────────────────────────────────────────────────────── */
.topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  border-bottom: 0.8px solid #2C2C2E;
  background: #111114;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-breadcrumb {
  font-size: 13px;
  font-weight: 500;
  color: #48484A;
}

.topbar-sep {
  font-size: 13px;
  color: #48484A;
}

.topbar-title {
  font-size: 14px;
  font-weight: 600;
  color: #EEEEF0;
}

.topbar-right {
  display: flex;
  align-items: center;
}

.avatar-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 20px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
}

.avatar-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #C9A84C;
}

.avatar-label {
  font-size: 12px;
  font-weight: 500;
  color: #AEAEB2;
}

/* ── Main content ────────────────────────────────────────────────────────── */
.dash-content {
  flex: 1;
  overflow-y: auto;
}
</style>
