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

// Apply the active org's branding to the whole app shell (tab title, favicon, accent color).
// Overriding the existing --gold variable (rather than a separate one) means every view that
// already reads var(--gold) — plus everything retrofitted from hardcoded #C9A84C — picks this up.
watchEffect(() => {
  const org = activeOrg.value
  document.title = org?.name || DEFAULT_NAME
  const iconLink = document.querySelector('link[rel="icon"]')
  if (iconLink) iconLink.href = org?.faviconUrl || DEFAULT_FAVICON
  document.documentElement.style.setProperty('--gold', org?.accentColor || DEFAULT_ACCENT)
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
