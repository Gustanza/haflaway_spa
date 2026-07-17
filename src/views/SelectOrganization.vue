<template>
  <div class="login-root">
    <!-- Ambient orbs -->
    <div class="orb orb--tr" />
    <div class="orb orb--bl" />

    <!-- Card -->
    <div class="login-card">
      <!-- Brand -->
      <div class="login-brand">
        <span class="brand-dot" />
        <span class="brand-name">haflaway</span>
      </div>

      <!-- Header -->
      <div class="login-header">
        <h1 class="login-title">Continue as…</h1>
        <p class="login-sub">Pick the organization you're working in today</p>
      </div>

      <div v-if="loading" class="org-loading">
        <span class="org-spinner" />
      </div>

      <div v-else class="org-list">
        <button
          v-for="org in orgs"
          :key="org.id"
          class="org-chip"
          :disabled="selecting"
          @click="choose(org.id)"
        >
          <span class="org-chip-avatar" :style="chipStyle(org)">
            <img v-if="org.logoUrl" :src="org.logoUrl" class="org-chip-img" />
            <span v-else>{{ (org.name || '?')[0].toUpperCase() }}</span>
          </span>
          <span class="org-chip-name">{{ org.name }}</span>
          <span v-if="org.ownerId === currentUser?.uid" class="org-owner-badge">Owner</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrg, contrastColor, DEFAULT_ACCENT, DEFAULT_SECONDARY } from '../composables/useOrg.js'

const router = useRouter()
const route = useRoute()
const { currentUser, orgs, loading, setActiveOrg } = useOrg()
const selecting = ref(false)

function chipStyle(org) {
  const primary = org.accentColor || DEFAULT_ACCENT
  const secondary = org.secondaryColor || DEFAULT_SECONDARY
  return {
    background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    color: contrastColor(primary),
  }
}

function proceed() {
  router.replace(route.query.redirect || '/')
}

// Direct navigation / refresh safety net — nothing meaningful to choose from.
watch([loading, orgs], ([isLoading, list]) => {
  if (!isLoading && list.length <= 1) proceed()
}, { immediate: true })

async function choose(orgId) {
  if (selecting.value) return
  selecting.value = true
  try {
    await setActiveOrg(orgId)
    proceed()
  } finally {
    selecting.value = false
  }
}
</script>

<style scoped>
.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0e1c;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  padding: 24px;
}

.orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  z-index: 0;
}
.orb--tr { width: 360px; height: 360px; top: -100px; right: -100px; background: rgba(201,168,76,0.10); }
.orb--bl { width: 280px; height: 280px; bottom: -80px; left: -60px; background: rgba(201,168,76,0.06); }

.login-card {
  width: 100%;
  max-width: 420px;
  background: #111827;
  border: 1px solid #1e2d44;
  border-radius: 20px;
  padding: 36px 36px 28px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login-brand { display: flex; align-items: center; gap: 8px; }
.brand-dot { width: 8px; height: 8px; border-radius: 50%; background: #C9A84C; }
.brand-name { font-size: 16px; font-weight: 700; color: #e2e8f0; letter-spacing: -0.3px; }

.login-header {}
.login-title { font-size: 24px; font-weight: 800; color: #e2e8f0; letter-spacing: -0.5px; margin: 0 0 5px; }
.login-sub { font-size: 14px; color: #8892a4; margin: 0; }

.org-loading { display: flex; justify-content: center; padding: 20px 0; }
.org-spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(201,168,76,0.25);
  border-top-color: #C9A84C;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.org-list { display: flex; flex-direction: column; gap: 10px; }
.org-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0d1326;
  border: 0.8px solid #1e2d44;
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color 140ms, background 140ms;
}
.org-chip:hover:not(:disabled) { border-color: rgba(201,168,76,0.5); background: #111827; }
.org-chip:disabled { opacity: 0.6; cursor: not-allowed; }
.org-chip-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}
.org-chip-img { width: 100%; height: 100%; object-fit: cover; }
.org-chip-name { flex: 1; font-size: 14px; font-weight: 600; color: #e2e8f0; }
.org-owner-badge {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  color: #C9A84C; background: rgba(201,168,76,0.12); border-radius: 6px; padding: 3px 7px;
}
</style>
