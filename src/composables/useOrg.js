import { ref, computed, watchEffect } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, doc, getDoc, updateDoc, addDoc,
  query, where, onSnapshot, arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore'

const DEFAULT_NAME = 'Haflaway'
const DEFAULT_FAVICON = '/src/assets/favicon.ico'
const DEFAULT_ACCENT = '#C9A84C'
const DEFAULT_SECONDARY = '#3B82F6'

// Perceptual luminance (WCAG relative luminance) → pick black or white text
// so any org-chosen color (including dark ones) stays legible.
function contrastColor(hex) {
  const clean = (hex || '').replace('#', '')
  if (clean.length !== 6) return '#070707'
  const [r, g, b] = [0, 2, 4].map(i => parseInt(clean.slice(i, i + 2), 16) / 255)
  const lin = c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return luminance > 0.45 ? '#070707' : '#f5f5f5'
}

// Optional surface overrides — org left them unset means "keep whatever the
// light/dark theme already renders there" (each field maps to a background var
// and, where text sits directly on that surface, a companion contrast-text var).
const SURFACE_TOKENS = [
  ['sidebarColor', '--org-sidebar-bg', '--org-sidebar-text'],
  ['topbarColor', '--org-topbar-bg', '--org-topbar-text'],
  ['pageBackgroundColor', '--org-page-bg', null],
]

const currentUser = ref(null)
const orgs = ref([])
const activeOrgId = ref(null)
const loading = ref(true)

let unsubOrgs = null

function resetOrgs() {
  if (unsubOrgs) { unsubOrgs(); unsubOrgs = null }
  orgs.value = []
  activeOrgId.value = null
}

async function loadOrgsFor(uid) {
  resetOrgs()
  const q = query(collection(db, 'organizations'), where('memberIds', 'array-contains', uid))
  unsubOrgs = onSnapshot(q, snap => {
    orgs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
  const userSnap = await getDoc(doc(db, 'users', uid))
  activeOrgId.value = userSnap.exists() ? (userSnap.data().activeOrgId ?? null) : null
}

onAuthStateChanged(auth, async (user) => {
  currentUser.value = user
  loading.value = true
  if (user) {
    await loadOrgsFor(user.uid)
  } else {
    resetOrgs()
  }
  loading.value = false
})

const activeOrg = computed(() => {
  if (activeOrgId.value) {
    const found = orgs.value.find(o => o.id === activeOrgId.value)
    if (found) return found
  }
  return orgs.value[0] ?? null
})

const isOwner = computed(() =>
  !!activeOrg.value && !!currentUser.value && activeOrg.value.ownerId === currentUser.value.uid
)

// Apply the active org's branding to the whole app shell (tab title, favicon, colors).
// Overriding the existing --gold variable (rather than a separate one) means every view that
// already reads var(--gold) — plus everything retrofitted from hardcoded #C9A84C — picks this up.
// --gold-contrast / --org-secondary-contrast are computed so text stays legible no matter
// which color (light or dark) an org picks.
watchEffect(() => {
  const org = activeOrg.value
  document.title = org?.name || DEFAULT_NAME
  const iconLink = document.querySelector('link[rel="icon"]')
  if (iconLink) iconLink.href = org?.faviconUrl || DEFAULT_FAVICON

  const primary = org?.accentColor || DEFAULT_ACCENT
  const secondary = org?.secondaryColor || DEFAULT_SECONDARY
  const root = document.documentElement.style
  root.setProperty('--gold', primary)
  root.setProperty('--gold-contrast', contrastColor(primary))
  root.setProperty('--org-secondary', secondary)
  root.setProperty('--org-secondary-contrast', contrastColor(secondary))

  for (const [field, bgVar, textVar] of SURFACE_TOKENS) {
    const value = org?.[field]
    if (value) {
      root.setProperty(bgVar, value)
      if (textVar) root.setProperty(textVar, contrastColor(value))
    } else {
      root.removeProperty(bgVar)
      if (textVar) root.removeProperty(textVar)
    }
  }
})

async function setActiveOrg(orgId) {
  activeOrgId.value = orgId
  const uid = currentUser.value?.uid
  if (!uid) return
  await updateDoc(doc(db, 'users', uid), { activeOrgId: orgId })
}

async function createOrg(name) {
  const uid = currentUser.value?.uid
  if (!uid || !name?.trim()) return null
  const orgRef = await addDoc(collection(db, 'organizations'), {
    name: name.trim(),
    logoUrl: '',
    faviconUrl: '',
    accentColor: DEFAULT_ACCENT,
    secondaryColor: DEFAULT_SECONDARY,
    ownerId: uid,
    memberIds: [uid],
    createdAt: serverTimestamp(),
  })
  await setActiveOrg(orgRef.id)
  return orgRef.id
}

async function updateBranding(orgId, fields) {
  await updateDoc(doc(db, 'organizations', orgId), fields)
}

async function addMember(orgId, uid) {
  await updateDoc(doc(db, 'organizations', orgId), { memberIds: arrayUnion(uid) })
}

async function removeMember(orgId, uid) {
  await updateDoc(doc(db, 'organizations', orgId), { memberIds: arrayRemove(uid) })
}

export function useOrg() {
  return {
    currentUser,
    orgs,
    activeOrg,
    activeOrgId,
    isOwner,
    loading,
    setActiveOrg,
    createOrg,
    updateBranding,
    addMember,
    removeMember,
  }
}

export { contrastColor, DEFAULT_ACCENT, DEFAULT_SECONDARY }
