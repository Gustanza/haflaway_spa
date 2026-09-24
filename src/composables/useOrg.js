import { ref, computed, watchEffect } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
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

// Same env var / fallback EventCampaigns.vue uses to reach haflaway_server —
// set VITE_CARD_SERVER_URL once it's deployed somewhere reachable.
const CARD_SERVER_URL = import.meta.env.VITE_CARD_SERVER_URL || 'http://localhost:8080'

async function callOrgServer(path, options = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const idToken = await user.getIdToken()
  const res = await fetch(`${CARD_SERVER_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!data.ok) throw new Error(data.message || `Request failed (HTTP ${res.status}).`)
  return data
}

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

// "#C9A84C" -> "201, 168, 76", so CSS can drop it straight into rgba(var(--gold-rgb), alpha)
// for glow effects — org-branded buttons glow in the org's own accent color.
function hexToRgb(hex) {
  const clean = (hex || '').replace('#', '')
  if (clean.length !== 6) return '201, 168, 76'
  const [r, g, b] = [0, 2, 4].map(i => parseInt(clean.slice(i, i + 2), 16))
  return `${r}, ${g}, ${b}`
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

// ── SMS provider credentials (smtz / wasambazie) + their sender IDs ────────
// Per-organization override for the two providers whose credentials aren't
// baked into env vars shared by every org (see haflaway_server's
// organizations/smsCredentials.js and dispatch/sms.js's
// resolveOrgSmsCredentials). Each provider's status also carries its own
// self-service sender-ID pool — a sender ID only means something against the
// provider account it was registered with, so it lives and dies with that
// provider's credentials rather than as an org-wide, staff-reviewed pool like
// before. An org still on Haflaway's shared account has no pool at all and
// always sends as HAFLAWAY. `configured` is all that's ever exposed about
// the credentials themselves — the actual secret values never round-trip
// back to the client once saved.
const smsCredentialsStatus = ref({ smtz: null, wasambazie: null })
// The provider this org's SMS actually goes out through right now, per its
// staff-set switch (haflaway_server organizations/messagingAccounts.js):
// Haflaway's platform provider on 'haflaway', its own provider on 'own'
// (null if it has none configured — every SMS send is then refused).
const activeSmsProvider = ref(null)
// 'own' | 'haflaway' — set by Haflaway staff only, from the admin console.
const smsMode = ref('haflaway')

// Not a live listener — status comes from haflaway_server, not a Firestore
// read, so this re-fetches on demand (tab open / org switch) rather than
// subscribing. Loads for every member (not just the owner): EventSettings'
// sender-ID picker needs `approvedSenderIds`/`defaultSenderId` below even for
// a non-owner viewing their own event.
async function loadSmsCredentialsStatus(orgId) {
  if (!orgId) {
    smsCredentialsStatus.value = { smtz: null, wasambazie: null }
    activeSmsProvider.value = null
    smsMode.value = 'haflaway'
    return smsCredentialsStatus.value
  }
  const { smtz, wasambazie, activeProvider, mode } = await callOrgServer(`/organizations/${orgId}/sms-credentials/status`)
  smsCredentialsStatus.value = { smtz, wasambazie }
  activeSmsProvider.value = activeProvider ?? null
  smsMode.value = mode === 'own' ? 'own' : 'haflaway'
  return smsCredentialsStatus.value
}

// The sender-ID pool that's actually live right now — the active provider's,
// if the org has configured that provider's own credentials. Shaped as
// {id, value} pairs to match the old approved-sender-ID list EventSettings.vue
// already renders.
// Only on the org's own account — on Haflaway's, every SMS goes out as HAFLAWAY.
const approvedSenderIds = computed(() => {
  if (smsMode.value !== 'own') return []
  const entry = activeSmsProvider.value && smsCredentialsStatus.value[activeSmsProvider.value]
  if (!entry?.configured) return []
  return (entry.senderIds ?? []).map(value => ({ id: value, value }))
})
const defaultSenderId = computed(() => {
  if (smsMode.value !== 'own') return null
  const entry = activeSmsProvider.value && smsCredentialsStatus.value[activeSmsProvider.value]
  return (entry?.configured && entry.defaultSenderId) || null
})

// ── Twilio WhatsApp credentials + org's own approved template mapping ──────
// An org's own Twilio account (own WhatsApp-enabled sender, own Meta-approved
// Content Templates) so their WhatsApp sends bill to that account instead of
// Haflaway's shared one — the same BYO pattern as smtz/wasambazie above, but
// a template's contentSid only exists inside the Twilio account it was
// approved in, so credentials and templates are managed together here.
// `configured`, masked hints (e.g. AC••••a1b2) and the template list are the
// only things ever exposed — secret values never round-trip back to the
// client once saved.
// `mode` ('own' | 'haflaway') is the staff-set switch deciding whose account
// this org's WhatsApp actually goes out on — see smsMode above.
const twilioCredentialsStatus = ref({ configured: false, updatedAt: null, masked: null, templates: [], brandingApproved: false, mode: 'haflaway' })

// The fixed message-purpose taxonomy WhatsApp campaigns send through —
// mirrors server/src/dispatch/whatsappTemplateCategories.js. Kept in sync by
// hand since the SPA and haflaway_server don't share a module tree.
// `vars` is the variable order haflaway_server fills for that message type
// (buildContentVariables in dispatch/whatsapp.js). 'general' covers card-less
// Bulk Messages sends — the organizer's own text rides in variable 8.
const CARD_TEMPLATE_VARS = '1 Guest name · 2 Event title · 3 Date · 4 Venue · 5 Time · 6 Card image path · 7 Event/Attendee ID'
const WHATSAPP_TEMPLATE_CATEGORIES = [
  { purpose: 'invitation', category: 'whatsapp-wedding-invitations', label: 'Invitation', vars: CARD_TEMPLATE_VARS },
  { purpose: 'save_the_date', category: 'whatsapp-wedding-save-the-date', label: 'Save the date', vars: CARD_TEMPLATE_VARS },
  { purpose: 'thank_you', category: 'whatsapp-wedding-thank-you', label: 'Thank you', vars: CARD_TEMPLATE_VARS },
  { purpose: 'enclosure', category: 'whatsapp-wedding-enclosure', label: 'Enclosure', vars: CARD_TEMPLATE_VARS },
  { purpose: 'general', category: 'haflaway-general-campaign', label: 'General (Bulk Messages)', vars: '1 Guest name · 8 Your campaign message (set per campaign in Bulk Messages)' },
]
const WHATSAPP_TEMPLATE_LANGUAGES = [
  { value: 'sw', label: 'Swahili' },
  { value: 'en', label: 'English' },
]

async function loadTwilioCredentialsStatus(orgId) {
  if (!orgId) {
    twilioCredentialsStatus.value = { configured: false, updatedAt: null, masked: null, templates: [], brandingApproved: false, mode: 'haflaway' }
    return twilioCredentialsStatus.value
  }
  const { configured, updatedAt, masked, templates, brandingApproved, mode } = await callOrgServer(`/organizations/${orgId}/twilio-credentials/status`)
  twilioCredentialsStatus.value = {
    configured, updatedAt, masked: masked ?? null, templates: templates ?? [], brandingApproved,
    mode: mode === 'own' ? 'own' : 'haflaway',
  }
  return twilioCredentialsStatus.value
}

// Owner-only, enforced server-side. `credentials` is
// { accountSid, apiKeySid, apiKeySecret, whatsappSender } — a Twilio API Key
// scoped to the org's own account, not the raw Account SID + Auth Token.
async function setTwilioCredentials(orgId, credentials) {
  const data = await callOrgServer(`/organizations/${orgId}/twilio-credentials`, {
    method: 'POST',
    body: JSON.stringify({ credentials }),
  })
  await loadTwilioCredentialsStatus(orgId)
  return data
}

// Also wipes every template registered against these credentials server-side.
// On its own account (mode 'own') that stops its WhatsApp sends until they're
// back — haflaway_server never falls back to Haflaway's account.
async function clearTwilioCredentials(orgId) {
  const data = await callOrgServer(`/organizations/${orgId}/twilio-credentials`, { method: 'DELETE' })
  await loadTwilioCredentialsStatus(orgId)
  return data
}

// `meta` is { name, content, notes, active, previous } — the same descriptive
// fields haflaway_admin_spa's WhatsAppTemplatesView.vue records for the shared
// library. `previous` ({ category, language }) marks an edit of an existing
// entry; if category/language changed, the server moves it to the new slot.
// Without it this is an add, and the server refuses an already-taken slot.
async function setWhatsAppTemplate(orgId, category, language, contentSid, meta = {}) {
  const { name, content, notes, active, previous } = meta
  const data = await callOrgServer(`/organizations/${orgId}/whatsapp-templates`, {
    method: 'POST',
    body: JSON.stringify({ category, language, contentSid, name, content, notes, active, previous }),
  })
  await loadTwilioCredentialsStatus(orgId)
  return data
}

async function removeWhatsAppTemplate(orgId, category, language) {
  const data = await callOrgServer(`/organizations/${orgId}/whatsapp-templates/${encodeURIComponent(category)}/${encodeURIComponent(language)}`, {
    method: 'DELETE',
  })
  await loadTwilioCredentialsStatus(orgId)
  return data
}

// Self-check only — sends a synthetic test message using the org's own
// credentials and its own registered contentSid, bypassing branding approval
// and billing entirely (see the server route). Never touches a real guest.
async function testSendWhatsAppTemplate(orgId, category, language, to) {
  return callOrgServer(`/organizations/${orgId}/whatsapp-templates/${encodeURIComponent(category)}/${encodeURIComponent(language)}/test-send`, {
    method: 'POST',
    body: JSON.stringify({ to }),
  })
}

// Owner-only self-service — the org registered this directly with the
// provider on their own account, so there's nothing for Haflaway to review.
// Requires that provider's credentials to already be configured.
async function addSenderId(orgId, provider, senderId) {
  const data = await callOrgServer(`/organizations/${orgId}/sms-credentials/${provider}/sender-ids`, {
    method: 'POST',
    body: JSON.stringify({ senderId }),
  })
  await loadSmsCredentialsStatus(orgId)
  return data
}
async function removeSenderId(orgId, provider, senderId) {
  const data = await callOrgServer(`/organizations/${orgId}/sms-credentials/${provider}/sender-ids/${encodeURIComponent(senderId)}`, {
    method: 'DELETE',
  })
  await loadSmsCredentialsStatus(orgId)
  return data
}

// Pins one event to a specific sender ID from the org's currently-active
// provider pool, or clears the pin (senderId null/'') so it follows the org
// default. Server-side so an event can only ever name an ID its own org
// actually owns.
async function setEventSenderId(eventId, senderId) {
  return callOrgServer(`/events/${eventId}/sender-id`, {
    method: 'POST',
    body: JSON.stringify({ senderId }),
  })
}

// Owner-only, enforced server-side (requireOrgOwner in haflaway_server).
// `credentials` is `{ apiKey }` for smtz or `{ publicKey, secretKey }` for
// wasambazie — the org's own account, created directly with that provider,
// so its SMS bills to them instead of Haflaway's shared account.
async function setSmsCredentials(orgId, provider, credentials) {
  const data = await callOrgServer(`/organizations/${orgId}/sms-credentials`, {
    method: 'POST',
    body: JSON.stringify({ provider, credentials }),
  })
  await loadSmsCredentialsStatus(orgId)
  return data
}

// Drops the org's saved credentials for this provider. On its own account
// (smsMode 'own') that stops its SMS sends until they're back — haflaway_server
// never falls back to Haflaway's account.
async function clearSmsCredentials(orgId, provider) {
  const data = await callOrgServer(`/organizations/${orgId}/sms-credentials/${provider}`, { method: 'DELETE' })
  await loadSmsCredentialsStatus(orgId)
  return data
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
  root.setProperty('--gold-rgb', hexToRgb(primary))
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
    approvedSenderIds,
    defaultSenderId,
    setEventSenderId,
    smsCredentialsStatus,
    activeSmsProvider,
    smsMode,
    loadSmsCredentialsStatus,
    setSmsCredentials,
    clearSmsCredentials,
    addSenderId,
    removeSenderId,
    twilioCredentialsStatus,
    loadTwilioCredentialsStatus,
    setTwilioCredentials,
    clearTwilioCredentials,
    setWhatsAppTemplate,
    removeWhatsAppTemplate,
    testSendWhatsAppTemplate,
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

export { contrastColor, DEFAULT_ACCENT, DEFAULT_SECONDARY, DEFAULT_SENDER_ID, WHATSAPP_TEMPLATE_CATEGORIES, WHATSAPP_TEMPLATE_LANGUAGES }
