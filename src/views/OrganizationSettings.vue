<template>
  <div class="os-root">

    <!-- ══ Loading ══ -->
    <div v-if="loading" class="os-empty">
      <svg class="os-spin" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#C9A84C" stroke-width="2.2" stroke-linecap="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <p>Loading organizations…</p>
    </div>

    <template v-else>

      <!-- ══ No orgs yet ══ -->
      <div v-if="!orgs.length" class="os-panel os-create-panel">
        <div class="os-empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C"
            stroke-width="1.4" stroke-linecap="round">
            <rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </div>
        <p class="os-empty-title">No organization yet</p>
        <p class="os-empty-sub">Create one to customize your app name, logo and favicon, and share it with your team.</p>
        <div class="os-create-row">
          <input
            v-model="newOrgName"
            class="os-input"
            type="text"
            placeholder="e.g. Sam Events Co."
            @keydown.enter="handleCreateOrg"
          />
          <button class="os-primary-btn" :disabled="creatingOrg || !newOrgName.trim()" @click="handleCreateOrg">
            {{ creatingOrg ? 'Creating…' : 'Create organization' }}
          </button>
        </div>
      </div>

      <template v-else>

        <!-- ══ Org switcher ══ -->
        <div class="os-panel">
          <div class="os-panel-hd">
            <h2 class="os-panel-title">Your Organizations</h2>
          </div>
          <div class="os-panel-body os-switcher">
            <button
              v-for="org in orgs"
              :key="org.id"
              class="os-org-chip"
              :class="{ 'os-org-chip--active': org.id === activeOrg?.id }"
              @click="setActiveOrg(org.id)"
            >
              <span class="os-org-chip-avatar" :style="{ background: org.accentColor || '#C9A84C' }">
                <img v-if="org.logoUrl" :src="org.logoUrl" class="os-org-chip-img" />
                <span v-else>{{ (org.name || '?')[0].toUpperCase() }}</span>
              </span>
              <span class="os-org-chip-name">{{ org.name }}</span>
              <span v-if="org.ownerId === currentUser?.uid" class="os-owner-badge">Owner</span>
            </button>
          </div>

          <div class="os-panel-body os-create-row os-create-row--inline">
            <input
              v-model="newOrgName"
              class="os-input"
              type="text"
              placeholder="Create another organization…"
              @keydown.enter="handleCreateOrg"
            />
            <button class="os-secondary-btn" :disabled="creatingOrg || !newOrgName.trim()" @click="handleCreateOrg">
              {{ creatingOrg ? 'Creating…' : 'Create' }}
            </button>
          </div>
        </div>

        <div class="os-grid" v-if="activeOrg">

          <!-- ══ Branding panel ══ -->
          <div class="os-panel">
            <div class="os-panel-hd">
              <h2 class="os-panel-title">Branding</h2>
              <span v-if="!isOwner" class="os-readonly-badge">Read only</span>
            </div>
            <div class="os-panel-body">

              <div class="os-brand-row">
                <div class="os-image-picker" :class="{ 'os-image-picker--disabled': !isOwner }" @click="isOwner && logoInput.click()">
                  <img v-if="activeOrg.logoUrl" :src="activeOrg.logoUrl" class="os-image-preview" />
                  <span v-else class="os-image-placeholder">Logo</span>
                  <div v-if="uploadingLogo" class="os-image-overlay">
                    <svg class="os-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  </div>
                  <input ref="logoInput" type="file" accept="image/*" class="os-hidden" @change="e => onImageChange(e, 'logoUrl')" />
                </div>
                <div class="os-image-picker os-image-picker--small" :class="{ 'os-image-picker--disabled': !isOwner }" @click="isOwner && faviconInput.click()">
                  <img v-if="activeOrg.faviconUrl" :src="activeOrg.faviconUrl" class="os-image-preview" />
                  <span v-else class="os-image-placeholder">Favicon</span>
                  <div v-if="uploadingFavicon" class="os-image-overlay">
                    <svg class="os-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  </div>
                  <input ref="faviconInput" type="file" accept="image/*" class="os-hidden" @change="e => onImageChange(e, 'faviconUrl')" />
                </div>
              </div>

              <label class="os-field-label">Organization Name</label>
              <input
                v-model="nameDraft"
                class="os-input"
                type="text"
                :disabled="!isOwner"
                placeholder="Organization name"
              />

              <label class="os-field-label">Accent Color</label>
              <div class="os-color-row">
                <input v-model="accentDraft" type="color" class="os-color-input" :disabled="!isOwner" />
                <span class="os-color-value">{{ accentDraft }}</span>
              </div>

              <button v-if="isOwner" class="os-primary-btn os-save-btn" :disabled="savingDetails" @click="saveBrandingDetails">
                {{ savingDetails ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
          </div>

          <!-- ══ Team panel ══ -->
          <div class="os-panel">
            <div class="os-panel-hd">
              <h2 class="os-panel-title">Team</h2>
              <span class="os-section-cnt">{{ memberProfiles.length }}</span>
            </div>
            <div class="os-panel-body">

              <template v-if="isOwner">
                <p class="os-section-lbl">Add member by email</p>
                <div class="os-search-row">
                  <input
                    v-model="searchEmail"
                    class="os-input"
                    type="email"
                    placeholder="Enter email address…"
                    @keydown.enter="searchUser"
                    @input="searchResult = null; searchError = ''"
                  />
                  <button class="os-secondary-btn" @click="searchUser" :disabled="searchLoading || !searchEmail.trim()">
                    {{ searchLoading ? 'Searching…' : 'Search' }}
                  </button>
                </div>

                <div v-if="searchError" class="os-search-error">{{ searchError }}</div>

                <div v-if="searchResult" class="os-member-card">
                  <div class="os-avatar" :style="avatarStyle(searchResult)">
                    <span>{{ initials(searchResult) }}</span>
                  </div>
                  <div class="os-member-info">
                    <p class="os-member-name">{{ fullName(searchResult) }}</p>
                    <p class="os-member-email">{{ searchResult.email }}</p>
                  </div>
                  <template v-if="alreadyMember(searchResult.id)">
                    <span class="os-already-badge">Already added</span>
                  </template>
                  <button v-else class="os-add-btn" :disabled="addingUid === searchResult.id" @click="handleAddMember(searchResult)">
                    {{ addingUid === searchResult.id ? 'Adding…' : 'Add' }}
                  </button>
                </div>
              </template>

              <div class="os-member-list">
                <div v-for="uid in activeOrg.memberIds" :key="uid" class="os-member-card">
                  <template v-if="memberProfiles.find(u => u.id === uid)">
                    <div class="os-avatar" :style="avatarStyle(memberProfiles.find(u => u.id === uid))">
                      <span>{{ initials(memberProfiles.find(u => u.id === uid)) }}</span>
                    </div>
                    <div class="os-member-info">
                      <p class="os-member-name">{{ fullName(memberProfiles.find(u => u.id === uid)) }}</p>
                      <p class="os-member-email">{{ memberProfiles.find(u => u.id === uid).email }}</p>
                    </div>
                  </template>
                  <template v-else>
                    <div class="os-avatar-skeleton" />
                    <div class="os-member-info">
                      <div class="os-skeleton os-skeleton--name" />
                      <div class="os-skeleton os-skeleton--email" />
                    </div>
                  </template>
                  <span v-if="uid === activeOrg.ownerId" class="os-owner-badge">Owner</span>
                  <template v-else-if="isOwner">
                    <template v-if="confirmRemove === uid">
                      <span class="os-del-lbl">Remove?</span>
                      <button class="os-del-yes" :disabled="removingId === uid" @click="handleRemoveMember(uid)">
                        {{ removingId === uid ? '…' : 'Yes' }}
                      </button>
                      <button class="os-del-no" @click="confirmRemove = null">No</button>
                    </template>
                    <button v-else class="os-remove-btn" title="Remove" @click="confirmRemove = uid">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </template>
                </div>
              </div>

            </div>
          </div>

        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { db, storage } from '../firebase'
import {
  doc, getDoc, getDocs, collection, query, where, limit,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useOrg } from '../composables/useOrg.js'

const {
  currentUser, orgs, activeOrg, isOwner, loading,
  setActiveOrg, createOrg, updateBranding, addMember, removeMember,
} = useOrg()

// ── Create org ───────────────────────────────────────────────────────────────
const newOrgName = ref('')
const creatingOrg = ref(false)

async function handleCreateOrg() {
  if (!newOrgName.value.trim() || creatingOrg.value) return
  creatingOrg.value = true
  try {
    await createOrg(newOrgName.value.trim())
    newOrgName.value = ''
  } finally {
    creatingOrg.value = false
  }
}

// ── Branding ─────────────────────────────────────────────────────────────────
const nameDraft = ref('')
const accentDraft = ref('#C9A84C')
const savingDetails = ref(false)
const uploadingLogo = ref(false)
const uploadingFavicon = ref(false)
const logoInput = ref(null)
const faviconInput = ref(null)

watch(activeOrg, (org) => {
  nameDraft.value = org?.name ?? ''
  accentDraft.value = org?.accentColor ?? '#C9A84C'
}, { immediate: true })

async function saveBrandingDetails() {
  if (!activeOrg.value || !isOwner.value) return
  savingDetails.value = true
  try {
    await updateBranding(activeOrg.value.id, {
      name: nameDraft.value.trim(),
      accentColor: accentDraft.value,
    })
  } finally {
    savingDetails.value = false
  }
}

async function onImageChange(e, field) {
  const file = e.target.files[0]
  if (!file || !activeOrg.value || !isOwner.value) return
  const uploading = field === 'logoUrl' ? uploadingLogo : uploadingFavicon
  uploading.value = true
  try {
    const timestamp = Date.now()
    const folder = field === 'logoUrl' ? 'logo' : 'favicon'
    const sRef = storageRef(storage, `Org-Branding/${activeOrg.value.id}/${folder}?=${timestamp}?=${file.name}`)
    await uploadBytes(sRef, file)
    const url = await getDownloadURL(sRef)
    await updateBranding(activeOrg.value.id, { [field]: url })
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

// ── Team ─────────────────────────────────────────────────────────────────────
const memberProfiles = ref([])
const searchEmail = ref('')
const searchLoading = ref(false)
const searchResult = ref(null)
const searchError = ref('')
const addingUid = ref(null)
const confirmRemove = ref(null)
const removingId = ref(null)

async function loadMemberProfiles() {
  const ids = activeOrg.value?.memberIds ?? []
  if (!ids.length) { memberProfiles.value = []; return }
  const results = await Promise.allSettled(ids.map(uid => getDoc(doc(db, 'users', uid))))
  memberProfiles.value = results
    .filter(r => r.status === 'fulfilled' && r.value.exists())
    .map(r => ({ id: r.value.id, ...r.value.data() }))
}

watch(() => activeOrg.value?.memberIds?.join(','), loadMemberProfiles, { immediate: true })

function alreadyMember(uid) {
  return (activeOrg.value?.memberIds ?? []).includes(uid)
}

async function searchUser() {
  const email = searchEmail.value.trim().toLowerCase()
  if (!email) return
  searchLoading.value = true
  searchResult.value = null
  searchError.value = ''
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email), limit(1)))
    if (snap.empty) {
      searchError.value = `No user found with email "${email}"`
    } else {
      const d = snap.docs[0]
      searchResult.value = { id: d.id, ...d.data() }
    }
  } catch (e) {
    searchError.value = 'Search failed. Please try again.'
  } finally {
    searchLoading.value = false
  }
}

async function handleAddMember(user) {
  if (addingUid.value || !activeOrg.value) return
  addingUid.value = user.id
  try {
    await addMember(activeOrg.value.id, user.id)
    searchEmail.value = ''
    searchResult.value = null
  } finally {
    addingUid.value = null
  }
}

async function handleRemoveMember(uid) {
  if (removingId.value || !activeOrg.value) return
  removingId.value = uid
  try {
    await removeMember(activeOrg.value.id, uid)
    confirmRemove.value = null
  } finally {
    removingId.value = null
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fullName(u) {
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || 'Haflaway User'
}
function initials(u) {
  const f = u.firstName?.[0] ?? u.email?.[0] ?? ''
  const l = u.lastName?.[0] ?? ''
  return (f + l).toUpperCase() || '?'
}
const AVATAR_COLORS = [
  ['#D4E8C2', '#3A6B1A'], ['#C2D8E8', '#1A4B6B'], ['#E8D4C2', '#6B3A1A'],
  ['#D4C2E8', '#3A1A6B'], ['#E8C2D4', '#6B1A3A'], ['#C2E8D4', '#1A6B3A'],
]
function avatarStyle(u) {
  const idx = (u.firstName?.charCodeAt(0) ?? u.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
  return { background: AVATAR_COLORS[idx][0], color: AVATAR_COLORS[idx][1] }
}
</script>

<style scoped>
.os-root {
  display: flex;
  flex-direction: column;
  padding: 28px 32px 64px;
  gap: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --c-bg:     #141414;
  --c-border: #2a2a2a;
  --c-track:  #2a2a2a;
  --c-txt:    #f0f0ec;
  --c-txt-2:  #888;
  --c-txt-3:  #555;
}

.os-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--c-txt-3);
  font-size: 13px;
}
.os-spin { animation: os-spin 0.8s linear infinite; }
@keyframes os-spin { to { transform: rotate(360deg); } }

.os-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 860px) {
  .os-grid { grid-template-columns: 1fr; }
}

.os-panel {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
}
.os-panel-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--c-border);
}
.os-panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-txt);
  margin: 0;
}
.os-panel-body {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.os-readonly-badge, .os-section-cnt {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-txt-3);
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  padding: 3px 9px;
}

.os-create-panel {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}
.os-empty-icon { margin-bottom: 6px; }
.os-empty-title { font-size: 15px; font-weight: 700; color: var(--c-txt); margin: 0; }
.os-empty-sub { font-size: 13px; color: var(--c-txt-3); margin: 0 0 12px; max-width: 340px; }

.os-create-row {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 420px;
}
.os-create-row--inline { max-width: none; margin-top: 4px; }

.os-input {
  flex: 1;
  padding: 10px 12px;
  border: 0.8px solid var(--c-border);
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  font-size: 13px;
  color: var(--c-txt);
  outline: none;
  font-family: inherit;
}
.os-input:disabled { opacity: 0.6; cursor: not-allowed; }
.os-input:focus { border-color: rgb(from var(--gold) r g b / 0.5); }

.os-field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-txt-2);
  margin-top: 6px;
}

.os-primary-btn {
  background: var(--gold);
  color: #070707;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.os-primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.os-secondary-btn {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-txt);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.os-secondary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.os-save-btn { align-self: flex-start; margin-top: 6px; }

.os-switcher { flex-direction: row; flex-wrap: wrap; }
.os-org-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--c-border);
  border-radius: 999px;
  padding: 6px 12px 6px 6px;
  cursor: pointer;
  font-family: inherit;
}
.os-org-chip--active { border-color: var(--gold); background: rgb(from var(--gold) r g b / 0.08); }
.os-org-chip-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #070707;
  overflow: hidden;
}
.os-org-chip-img { width: 100%; height: 100%; object-fit: cover; }
.os-org-chip-name { font-size: 13px; font-weight: 600; color: var(--c-txt); }
.os-owner-badge {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  color: var(--gold); background: rgb(from var(--gold) r g b / 0.12); border-radius: 6px; padding: 2px 6px;
}

.os-brand-row { display: flex; gap: 12px; margin-bottom: 6px; }
.os-image-picker {
  width: 88px; height: 88px;
  border: 1px dashed var(--c-border);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: rgba(255,255,255,0.02);
}
.os-image-picker--small { width: 56px; height: 56px; }
.os-image-picker--disabled { cursor: not-allowed; opacity: 0.6; }
.os-image-preview { width: 100%; height: 100%; object-fit: cover; }
.os-image-placeholder { font-size: 11px; color: var(--c-txt-3); }
.os-image-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
}
.os-hidden { display: none; }

.os-color-row { display: flex; align-items: center; gap: 10px; }
.os-color-input {
  width: 36px; height: 30px;
  border: none; border-radius: 8px;
  background: none; cursor: pointer;
  padding: 0;
}
.os-color-value { font-size: 12px; color: var(--c-txt-3); font-family: 'JetBrains Mono', monospace; }

.os-section-lbl { font-size: 12px; font-weight: 600; color: var(--c-txt-2); margin: 0; }
.os-search-row { display: flex; gap: 8px; }
.os-search-error { font-size: 12px; color: #FF453A; }

.os-member-list { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.os-member-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 9px 12px;
}
.os-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  flex-shrink: 0;
}
.os-avatar-skeleton { width: 32px; height: 32px; border-radius: 50%; background: var(--c-track); flex-shrink: 0; }
.os-member-info { flex: 1; min-width: 0; }
.os-member-name { font-size: 13px; font-weight: 600; color: var(--c-txt); margin: 0; }
.os-member-email { font-size: 12px; color: var(--c-txt-3); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.os-skeleton { height: 10px; border-radius: 4px; background: var(--c-track); margin: 4px 0; }
.os-skeleton--name { width: 100px; }
.os-skeleton--email { width: 140px; }

.os-already-badge { font-size: 11px; color: var(--c-txt-3); }
.os-add-btn {
  background: rgb(from var(--gold) r g b / 0.12); color: var(--gold);
  border: none; border-radius: 8px; padding: 6px 12px;
  font-size: 12px; font-weight: 700; cursor: pointer;
}
.os-add-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.os-remove-btn {
  background: none; border: none; color: var(--c-txt-3);
  cursor: pointer; padding: 6px;
}
.os-remove-btn:hover { color: #FF453A; }
.os-del-lbl { font-size: 12px; color: var(--c-txt-3); }
.os-del-yes { background: #FF453A; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer; }
.os-del-no { background: none; border: 1px solid var(--c-border); color: var(--c-txt-3); border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; }
</style>
