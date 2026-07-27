import { ref, computed, watchEffect } from 'vue'
import { auth, db, functions } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import {
  collection, doc, getDoc, updateDoc, addDoc,
  query, where, onSnapshot, arrayUnion, arrayRemove, serverTimestamp, deleteField,
} from 'firebase/firestore'
import DEFAULT_LOGO_URL from '../assets/icon-512.png'

const DEFAULT_NAME = 'Haflaway'
// What recipients see as the SMS originator until an org has its own approved
// alphanumeric sender ID. Mirrors functions/utils/senderId.js — the two SPAs
// and the functions package don't share a module tree.
const DEFAULT_SENDER_ID = 'HAFLAWAY'
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
  // Prefer a non-archived org when falling back to a default — an archived org
  // shouldn't silently become someone's working context just because it's first
  // in the list. If every org they're in is archived, fall back to one anyway.
  return orgs.value.find(o => !o.archived) ?? orgs.value[0] ?? null
})

const isOwner = computed(() =>
  !!activeOrg.value && !!currentUser.value && activeOrg.value.ownerId === currentUser.value.uid
)

// Whether the active org has been manually vetted to customize the app shell
// (title/favicon/colors) — see the watchEffect below. Set by hand in Firestore,
// not through any in-app flow.
const isBrandingApproved = computed(() => activeOrg.value?.brandingApproved === true)

// The org's own name/logo shown as the app-shell wordmark (topbar, sidebar) —
// same gate as the watchEffect below, exposed here so every view's brand
// markup reads one source of truth instead of re-deriving "approved ? org.x :
// default" inline (and risking a spot that forgets the check).
const brandName = computed(() => (isBrandingApproved.value && activeOrg.value?.name) || DEFAULT_NAME)
const brandLogoUrl = computed(() => (isBrandingApproved.value && activeOrg.value?.logoUrl) || DEFAULT_LOGO_URL)

// ── SMS sender IDs ──────────────────────────────────────────────────────────
// An org owns a set of these, one document each under organizations/{id}/senderIds,
// keyed by the value itself: { value, status, isDefault, requestedAt/By,
// reviewedAt/By, approvedAt, rejectionReason }. Status is pending | approved |
// rejected | revoked.
const senderIds = ref([])
let unsubSenderIds = null

// Scoped to whichever org is active — switching orgs tears the old listener
// down so a stale org's IDs can never show under a different one.
watchEffect(() => {
  const orgId = activeOrg.value?.id
  if (unsubSenderIds) { unsubSenderIds(); unsubSenderIds = null }
  if (!orgId) { senderIds.value = []; return }

  unsubSenderIds = onSnapshot(
    collection(db, 'organizations', orgId, 'senderIds'),
    snap => { senderIds.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
    () => { senderIds.value = [] },
  )
})

const approvedSenderIds = computed(() => senderIds.value.filter(s => s.status === 'approved'))
const pendingSenderIds  = computed(() => senderIds.value.filter(s => s.status === 'pending'))

// Mirrors sortForDefault() in functions/utils/senderId.js — oldest approved
// first, value as tiebreak — so the "(default)" the UI marks is the same one
// the dispatch path would actually choose when nothing is flagged.
function sortForDefault(list) {
  const ms = (v) => {
    if (!v) return Number.MAX_SAFE_INTEGER
    if (typeof v.toMillis === 'function') return v.toMillis()
    const p = Date.parse(v)
    return Number.isNaN(p) ? Number.MAX_SAFE_INTEGER : p
  }
  return [...list].sort((a, b) =>
    (ms(a.approvedAt) - ms(b.approvedAt)) || String(a.value).localeCompare(String(b.value))
  )
}

// The org's effective default — the flagged one, else the deterministic pick.
const defaultSenderId = computed(() => {
  const approved = approvedSenderIds.value
  if (!approved.length) return null
  return (approved.find(s => s.isDefault === true) ?? sortForDefault(approved)[0]).value
})

// What an event sends as when it hasn't pinned one of its own.
const activeSenderId = computed(() => defaultSenderId.value || DEFAULT_SENDER_ID)
const hasCustomSenderId = computed(() => activeSenderId.value !== DEFAULT_SENDER_ID)

// Owner-only, enforced server-side. The callables also re-validate, so the
// client-side checks in the forms are a convenience, not the guard.
async function requestSenderId(orgId, senderId) {
  const res = await httpsCallable(functions, 'requestOrgSenderId')({ orgId, senderId })
  return res.data
}
async function setDefaultSenderId(orgId, senderId) {
  const res = await httpsCallable(functions, 'setOrgDefaultSenderId')({ orgId, senderId })
  return res.data
}
// senderId null/'' clears the pin so the event follows the org default.
async function setEventSenderId(eventId, senderId) {
  const res = await httpsCallable(functions, 'setEventSenderId')({ eventId, senderId })
  return res.data
}

// Per-member capabilities live in the org's `memberPerms` map, keyed by uid:
//   { [uid]: { canCreate: true, ... } }
// The owner is implicitly all-true and never appears in the map. Adding a
// member grants nothing — every capability is an explicit grant.

// Does the current user have permission to create events in the active org?
// (i.e. spend the org's wallet balance via an event) — owner always; otherwise
// only if the owner has explicitly granted canCreate.
const canCreateEvents = computed(() => {
  if (isOwner.value) return true
  const uid = currentUser.value?.uid
  const perms = activeOrg.value?.memberPerms ?? {}
  return !!(uid && perms[uid]?.canCreate)
})

// Read a specific member's capability flag (used by the owner's management UI).
function memberCan(memberUid, key) {
  if (memberUid && activeOrg.value?.ownerId === memberUid) return true
  return !!(activeOrg.value?.memberPerms?.[memberUid]?.[key])
}

// Owner-only: grant/revoke one capability for one member. Writes only the
// nested field so other members' permissions are left untouched.
async function setMemberPermission(orgId, memberUid, key, value) {
  await updateDoc(doc(db, 'organizations', orgId), {
    [`memberPerms.${memberUid}.${key}`]: value,
  })
}

// Apply the active org's branding to the whole app shell (tab title, favicon, colors).
// Overriding the existing --gold variable (rather than a separate one) means every view that
// already reads var(--gold) — plus everything retrofitted from hardcoded #C9A84C — picks this up.
// --gold-contrast / --org-secondary-contrast are computed so text stays legible no matter
// which color (light or dark) an org picks.
//
// Gated on `brandingApproved`: any org can save branding fields (see updateBranding /
// OrganizationSettings.vue), but they only take effect once we've manually vetted the org
// and set that flag — self-signup shouldn't be enough to repaint the whole app shell for
// every visitor. There's no in-app way to grant this on purpose; it's flipped by hand in
// the Firestore console per org.
watchEffect(() => {
  const org = activeOrg.value
  const approved = org?.brandingApproved === true

  document.title = (approved && org?.name) || DEFAULT_NAME
  const iconLink = document.querySelector('link[rel="icon"]')
  if (iconLink) iconLink.href = (approved && org?.faviconUrl) || DEFAULT_FAVICON

  const primary = (approved && org?.accentColor) || DEFAULT_ACCENT
  const secondary = (approved && org?.secondaryColor) || DEFAULT_SECONDARY
  const root = document.documentElement.style
  root.setProperty('--gold', primary)
  root.setProperty('--gold-contrast', contrastColor(primary))
  root.setProperty('--org-secondary', secondary)
  root.setProperty('--org-secondary-contrast', contrastColor(secondary))

  for (const [field, bgVar, textVar] of SURFACE_TOKENS) {
    const value = approved && org?.[field]
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
    archived: false,
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
  await updateDoc(doc(db, 'organizations', orgId), {
    memberIds: arrayRemove(uid),
    [`memberPerms.${uid}`]: deleteField(),
  })
}

// Owner-only: hides the org, blocks new events, keeps all data intact. Real
// deletion is staff-only (see firestore.rules) since an org can own events,
// members, and a wallet balance — too much blast radius for self-service.
async function archiveOrg(orgId) {
  await updateDoc(doc(db, 'organizations', orgId), { archived: true, archivedAt: serverTimestamp() })
}

async function unarchiveOrg(orgId) {
  await updateDoc(doc(db, 'organizations', orgId), { archived: false, archivedAt: null })
}

// A non-owner member's self-service way out (owners archive instead — an
// owner leaving their own org isn't supported without transferring ownership
// first, which doesn't exist yet). The Firestore rule only allows this exact
// shape of update (removing your own uid from memberIds, nothing else).
async function leaveOrg(orgId) {
  const uid = currentUser.value?.uid
  if (!uid) return
  await updateDoc(doc(db, 'organizations', orgId), { memberIds: arrayRemove(uid) })
  if (activeOrgId.value === orgId) {
    const next = orgs.value.find(o => o.id !== orgId && !o.archived) ?? orgs.value.find(o => o.id !== orgId) ?? null
    await setActiveOrg(next?.id ?? null)
  }
}

export function useOrg() {
  return {
    currentUser,
    orgs,
    activeOrg,
    activeOrgId,
    isOwner,
    isBrandingApproved,
    brandName,
    brandLogoUrl,
    senderIds,
    approvedSenderIds,
    pendingSenderIds,
    defaultSenderId,
    activeSenderId,
    hasCustomSenderId,
    requestSenderId,
    setDefaultSenderId,
    setEventSenderId,
    canCreateEvents,
    memberCan,
    setMemberPermission,
    loading,
    setActiveOrg,
    createOrg,
    updateBranding,
    addMember,
    removeMember,
    archiveOrg,
    unarchiveOrg,
    leaveOrg,
  }
}

export { contrastColor, DEFAULT_ACCENT, DEFAULT_SECONDARY, DEFAULT_SENDER_ID }
