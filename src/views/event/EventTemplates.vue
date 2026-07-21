<template>
  <div class="etp-root">

    <!-- ══ Stats ══ -->
    <div class="etp-stats">
      <div class="etp-stat-card">
        <div class="etp-stat-icon etp-stat-icon--purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div class="etp-stat-body">
          <span class="etp-stat-lbl">Total Templates</span>
          <span class="etp-stat-val">{{ templates.length }}</span>
        </div>
      </div>
      <div class="etp-stat-card">
        <div class="etp-stat-icon etp-stat-icon--gold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        </div>
        <div class="etp-stat-body">
          <span class="etp-stat-lbl">Tagged to a Campaign</span>
          <span class="etp-stat-val">{{ taggedCount }}</span>
        </div>
      </div>
      <div class="etp-stat-card">
        <div class="etp-stat-icon etp-stat-icon--blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div class="etp-stat-body">
          <span class="etp-stat-lbl">General (Any Campaign)</span>
          <span class="etp-stat-val">{{ templates.length - taggedCount }}</span>
        </div>
      </div>
      <div class="etp-stat-card">
        <div class="etp-stat-icon etp-stat-icon--teal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <div class="etp-stat-body">
          <span class="etp-stat-lbl">Imported from Haflaway</span>
          <span class="etp-stat-val">{{ importedCount }}</span>
        </div>
      </div>
    </div>

    <!-- ══ Panel ══ -->
    <div class="etp-panel">
      <div class="etp-panel-hd">
        <h2 class="etp-panel-title">Templates</h2>
        <div class="etp-panel-acts">
          <button class="etp-browse-btn" @click="openBrowse">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Browse Haflaway templates
          </button>
          <button class="etp-refresh-btn" @click="load" :disabled="loading" title="Refresh">
            <svg :class="{ 'etp-spin': loading }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button class="etp-new-btn" @click="openCreate">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Template
          </button>
        </div>
      </div>

      <!-- Use-case filter chips -->
      <div class="etp-chip-row">
        <button class="etp-chip" :class="{ 'etp-chip--on': useCaseFilter === 'all' }" @click="useCaseFilter = 'all'">
          All <span class="etp-chip-cnt">{{ templates.length }}</span>
        </button>
        <button v-for="uc in USE_CASES" :key="uc.id ?? 'general'"
          class="etp-chip" :class="{ 'etp-chip--on': useCaseFilter === (uc.id ?? 'general') }"
          @click="useCaseFilter = uc.id ?? 'general'">
          {{ uc.label }} <span class="etp-chip-cnt">{{ countFor(uc.id) }}</span>
        </button>
      </div>

      <div class="etp-panel-body">

        <!-- Loading -->
        <div v-if="loading" class="etp-empty">
          <svg class="etp-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          <p>Loading templates…</p>
        </div>

        <template v-else>
          <div v-if="filteredTemplates.length" class="etp-tpl-list">
            <div v-for="tpl in filteredTemplates" :key="tpl.id" class="etp-tpl-card">
              <div class="etp-tpl-card-top">
                <span class="etp-tpl-name">{{ tpl.name || 'Untitled template' }}</span>
                <div class="etp-tpl-badges">
                  <span class="etp-badge" :class="tpl.campaignId ? 'etp-badge--tag' : 'etp-badge--general'">
                    {{ campaignLabel(tpl.campaignId) }}
                  </span>
                  <span v-if="tpl.language" class="etp-badge etp-badge--lang">{{ tpl.language.toUpperCase() }}</span>
                  <span v-if="tpl.importedFrom" class="etp-badge etp-badge--imported" title="Imported from Haflaway">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </span>
                </div>
              </div>
              <p class="etp-tpl-content">{{ tpl.content }}</p>
              <div class="etp-tpl-card-acts">
                <button class="etp-tpl-act-btn" @click="openEdit(tpl)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button
                  class="etp-tpl-act-btn etp-tpl-act-btn--del"
                  :class="{ 'etp-tpl-act-btn--confirm': deletingId === tpl.id }"
                  @click="deleteTpl(tpl)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  {{ deletingId === tpl.id ? 'Confirm delete?' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Empty -->
          <div v-else class="etp-empty">
            <div class="etp-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p class="etp-empty-title">{{ useCaseFilter === 'all' ? 'No templates yet' : 'No templates for this use case' }}</p>
            <p class="etp-empty-sub">Create one from scratch, or browse Haflaway's starter templates.</p>
            <button class="etp-new-btn" @click="openCreate">New Template</button>
          </div>
        </template>

      </div>
    </div>

    <!-- ══════════ CREATE / EDIT MODAL ══════════ -->
    <Teleport to="body">
      <div v-if="formOpen" class="etp-form-backdrop" @click.self="closeForm">
        <div class="etp-form-panel">
          <div class="etp-form-hd">
            <span class="etp-form-title">{{ formMode === 'edit' ? 'Edit Template' : 'New Template' }}</span>
            <div class="etp-form-hd-acts">
              <button class="etp-browse-inline-btn" @click="openBrowse">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Browse Haflaway templates
              </button>
              <button class="etp-form-close" @click="closeForm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div class="etp-form-body">
            <label class="etp-field">
              <span class="etp-field-lbl">Name</span>
              <input v-model="formTpl.name" class="etp-input" placeholder="e.g. Wedding invite — Swahili" />
            </label>

            <label class="etp-field">
              <span class="etp-field-lbl">Use case</span>
              <select v-model="formUseCase" class="etp-select">
                <option value="general">General (any campaign)</option>
                <option v-for="uc in USE_CASES" :key="uc.id" :value="uc.id">{{ uc.label }}</option>
              </select>
            </label>

            <label class="etp-field">
              <span class="etp-field-lbl">Language</span>
              <select v-model="formTpl.language" class="etp-select">
                <option value="sw">Swahili</option>
                <option value="en">English</option>
              </select>
            </label>

            <label class="etp-field">
              <span class="etp-field-lbl">Message</span>
              <textarea ref="messageTaRef" v-model="formTpl.content" class="etp-textarea" rows="7"
                placeholder="Habari {{username}}&#10;..." />
              <div class="etp-ph-row">
                <span class="etp-field-hint">Placeholders — click to insert:</span>
                <div class="etp-ph-chips">
                  <button v-for="ph in PLACEHOLDER_TOKENS" :key="ph.key" type="button"
                    class="etp-ph-chip" :title="ph.label" @click="insertPlaceholder(ph.key)">
                    {{ phToken(ph.key) }}
                  </button>
                </div>
              </div>
            </label>
          </div>

          <div class="etp-form-footer">
            <button class="etp-form-cancel" @click="closeForm">Cancel</button>
            <button class="etp-form-save" :disabled="saving || !formTpl.content?.trim()" @click="saveForm">
              {{ saving ? 'Saving…' : (formMode === 'edit' ? 'Save Changes' : 'Create Template') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════ BROWSE HAFLAWAY TEMPLATES ══════════ -->
    <Teleport to="body">
      <div v-if="browseOpen" class="etp-browse-backdrop" @click.self="browseOpen = false">
        <div class="etp-browse-panel">
          <div class="etp-form-hd">
            <span class="etp-form-title">Haflaway Templates</span>
            <button class="etp-form-close" @click="browseOpen = false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="etp-browse-body">
            <p class="etp-browse-sub">Pick a starter template — you'll tag its use case before saving it to this event.</p>
            <div v-if="loadingGlobal" class="etp-empty">
              <svg class="etp-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Loading…
            </div>
            <div v-else-if="!globalTemplates.length" class="etp-empty">
              <p class="etp-empty-sub">No Haflaway templates available right now.</p>
            </div>
            <div v-else class="etp-tpl-list">
              <div v-for="tpl in globalTemplates" :key="tpl.id" class="etp-tpl-card">
                <div class="etp-tpl-card-top">
                  <span class="etp-tpl-name">{{ tpl.name }}</span>
                  <div class="etp-tpl-badges">
                    <span v-if="tpl.language" class="etp-badge etp-badge--lang">{{ tpl.language.toUpperCase() }}</span>
                  </div>
                </div>
                <p class="etp-tpl-content">{{ tpl.body }}</p>
                <div class="etp-tpl-card-acts">
                  <button class="etp-tpl-act-btn" @click="useGlobalTpl(tpl)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Use this template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../../firebase'
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

const props   = defineProps({ event: Object, eventId: String })
const route   = useRoute()
const eventId = computed(() => props.eventId ?? route.params.eventId)

// Use cases mirror the campaign steps shown in Invitations — keeps tagging
// consistent with what the send drawer filters by.
const USE_CASES = [
  { id: 'haflaway-invitation-campaign',          label: 'Invitation' },
  { id: 'haflaway-invitation-reminder-campaign', label: 'Reminder' },
  { id: 'haflaway-save-the-date-campaign',       label: 'Save the Date' },
  { id: 'haflaway-contribution-campaign',        label: 'Contribution' },
  { id: 'haflaway-gratitude-campaign',           label: 'Gratitude' },
]

// Best-effort guess when importing a global template, based on its category —
// organizer can always change it before saving.
const CATEGORY_TO_USE_CASE_GUESS = {
  'invitation':     'haflaway-invitation-campaign',
  'reminder':       'haflaway-invitation-reminder-campaign',
  'save-the-date':  'haflaway-save-the-date-campaign',
  'gratitude':      'haflaway-gratitude-campaign',
}

function campaignLabel(id) {
  if (!id) return 'General'
  return USE_CASES.find(u => u.id === id)?.label ?? 'General'
}

// Matches the token set resolved server-side in functions/sms/indesms.js (refineMessage).
// Both {{key}} and the legacy @key form are substituted on send — {{}} is the form shown here.
const PLACEHOLDER_TOKENS = [
  { key: 'username',  label: 'Recipient name' },
  { key: 'passcode',  label: 'Their unique passcode' },
  { key: 'cname',     label: 'Card name' },
  { key: 'card',      label: 'Card link' },
  { key: 'event',     label: 'Event page link' },
  { key: 'eventname', label: 'Event name' },
  { key: 'venue',     label: 'Venue' },
  { key: 'date',      label: 'Event date' },
  { key: 'time',      label: 'Event time' },
  { key: 'pledge',    label: 'Pledged amount' },
  { key: 'paid',      label: 'Amount paid' },
  { key: 'debt',      label: 'Outstanding balance' },
  { key: 'remit',     label: 'Contribution link' },
]

// ── State ─────────────────────────────────────────────────────────────────
const templates = ref([])
const loading    = ref(false)
const useCaseFilter = ref('all') // 'all' | 'general' | campaignId

const taggedCount   = computed(() => templates.value.filter(t => t.campaignId).length)
const importedCount = computed(() => templates.value.filter(t => t.importedFrom).length)

function countFor(campaignId) {
  if (!campaignId) return templates.value.filter(t => !t.campaignId).length
  return templates.value.filter(t => t.campaignId === campaignId).length
}

const filteredTemplates = computed(() => {
  if (useCaseFilter.value === 'all') return templates.value
  if (useCaseFilter.value === 'general') return templates.value.filter(t => !t.campaignId)
  return templates.value.filter(t => t.campaignId === useCaseFilter.value)
})

async function load() {
  if (!eventId.value) return
  loading.value = true
  try {
    const snap = await getDocs(query(collection(db, 'events', eventId.value, 'messageTemplates'), orderBy('createdAt', 'desc')))
    templates.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Failed to load templates', e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ── Create / Edit form ──────────────────────────────────────────────────────
const formOpen  = ref(false)
const formMode  = ref('create') // 'create' | 'edit'
const formTpl   = ref({ id: null, name: '', content: '', language: 'sw' })
const formUseCase = ref('general')
const saving    = ref(false)
const messageTaRef = ref(null)

function phToken(key) {
  return `{{${key}}}`
}

function insertPlaceholder(key) {
  const token = phToken(key)
  const ta = messageTaRef.value
  const current = formTpl.value.content ?? ''
  if (!ta || document.activeElement !== ta) {
    formTpl.value.content = current + token
    return
  }
  const start = ta.selectionStart ?? current.length
  const end   = ta.selectionEnd ?? current.length
  formTpl.value.content = current.slice(0, start) + token + current.slice(end)
  nextTick(() => {
    const pos = start + token.length
    ta.focus()
    ta.setSelectionRange(pos, pos)
  })
}

function openCreate() {
  formMode.value = 'create'
  formTpl.value = { id: null, name: '', content: '', language: 'sw' }
  formUseCase.value = 'general'
  formOpen.value = true
}

function openEdit(tpl) {
  formMode.value = 'edit'
  formTpl.value = { id: tpl.id, name: tpl.name ?? '', content: tpl.content ?? '', language: tpl.language ?? 'sw' }
  formUseCase.value = tpl.campaignId ?? 'general'
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
}

async function saveForm() {
  if (!eventId.value || !formTpl.value.content?.trim() || saving.value) return
  saving.value = true
  const campaignId = formUseCase.value === 'general' ? null : formUseCase.value
  try {
    if (formMode.value === 'edit') {
      await updateDoc(doc(db, 'events', eventId.value, 'messageTemplates', formTpl.value.id), {
        name: formTpl.value.name.trim(),
        content: formTpl.value.content.trim(),
        language: formTpl.value.language,
        campaignId,
      })
      const idx = templates.value.findIndex(t => t.id === formTpl.value.id)
      if (idx !== -1) {
        templates.value[idx] = { ...templates.value[idx], name: formTpl.value.name.trim(), content: formTpl.value.content.trim(), language: formTpl.value.language, campaignId }
      }
    } else {
      const ref = await addDoc(collection(db, 'events', eventId.value, 'messageTemplates'), {
        name: formTpl.value.name.trim(),
        content: formTpl.value.content.trim(),
        language: formTpl.value.language,
        campaignId,
        channel: 'sms',
        importedFrom: formTpl.value.importedFrom ?? null,
        createdAt: serverTimestamp(),
      })
      templates.value.unshift({ id: ref.id, name: formTpl.value.name.trim(), content: formTpl.value.content.trim(), language: formTpl.value.language, campaignId, channel: 'sms', importedFrom: formTpl.value.importedFrom ?? null })
    }
    closeForm()
  } catch (e) {
    console.error('Failed to save template', e)
  } finally {
    saving.value = false
  }
}

// ── Delete ───────────────────────────────────────────────────────────────
const deletingId = ref(null)
async function deleteTpl(tpl) {
  if (deletingId.value !== tpl.id) {
    deletingId.value = tpl.id
    setTimeout(() => { if (deletingId.value === tpl.id) deletingId.value = null }, 3000)
    return
  }
  try {
    await deleteDoc(doc(db, 'events', eventId.value, 'messageTemplates', tpl.id))
    templates.value = templates.value.filter(t => t.id !== tpl.id)
  } catch (e) {
    console.error('Failed to delete template', e)
  } finally {
    deletingId.value = null
  }
}

// ── Browse Haflaway templates ───────────────────────────────────────────────
const browseOpen     = ref(false)
const globalTemplates = ref([])
const loadingGlobal  = ref(false)

async function openBrowse() {
  browseOpen.value = true
  if (globalTemplates.value.length) return
  loadingGlobal.value = true
  try {
    const snap = await getDocs(query(collection(db, 'smsTemplates'), orderBy('createdAt', 'desc')))
    globalTemplates.value = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.active !== false)
  } catch (e) {
    console.error('Failed to load Haflaway templates', e)
  } finally {
    loadingGlobal.value = false
  }
}

function useGlobalTpl(tpl) {
  browseOpen.value = false
  // If a template form is already open (browsing from inside it), fill it in place
  // rather than discarding whatever the organizer was already editing/creating.
  if (!formOpen.value) {
    formMode.value = 'create'
    formTpl.value = { id: null, name: '', content: '', language: 'sw' }
  }
  formTpl.value = {
    ...formTpl.value,
    name: tpl.name ?? formTpl.value.name,
    content: tpl.body ?? formTpl.value.content,
    language: tpl.language ?? formTpl.value.language ?? 'sw',
    importedFrom: tpl.id,
  }
  formUseCase.value = CATEGORY_TO_USE_CASE_GUESS[tpl.category] ?? formUseCase.value ?? 'general'
  formOpen.value = true
}
</script>

<style scoped>
/* ══ Root ══ */
.etp-root {
  display: flex;
  flex-direction: column;
  padding: 20px 24px 24px;
  gap: 16px;
  --c-bg:     #141414;
  --c-border: #2a2a2a;
  --c-track:  #2a2a2a;
  --c-muted:  #3a3a3a;
  --c-txt:    #f0f0ec;
  --c-txt-2:  #888;
  --c-txt-3:  #555;
  --c-divide: #2a2a2a;
  transition: background 300ms ease;
}

/* ══ Stat cards ══ */
.etp-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.etp-stat-card {
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 12px;
  padding: 20px 20px 18px; display: flex; align-items: flex-start; gap: 16px; min-width: 0;
  transition: background 300ms ease, border-color 300ms ease;
}
.etp-stat-icon {
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0; margin-top: 2px;
  display: flex; align-items: center; justify-content: center;
}
.etp-stat-icon--gold   { background: rgb(from var(--gold) r g b / 0.08); color: var(--gold); }
.etp-stat-icon--blue   { background: rgba(96,165,250,0.08);  color: #60a5fa; }
.etp-stat-icon--teal   { background: rgba(45,212,191,0.08);  color: #2dd4bf; }
.etp-stat-icon--purple { background: rgba(167,139,250,0.08); color: #a78bfa; }
.etp-stat-body { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.etp-stat-lbl  { font-size: 11px; color: var(--c-txt-2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.etp-stat-val  { font-size: 32px; font-weight: 700; color: var(--c-txt); line-height: 1; letter-spacing: -0.5px; }

/* ══ Panel ══ */
.etp-panel {
  display: flex; flex-direction: column;
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 16px; overflow: hidden;
  transition: background 300ms ease, border-color 300ms ease;
}
.etp-panel-hd {
  display: flex; align-items: center;
  padding: 14px 20px; border-bottom: 1px solid var(--c-border); gap: 10px;
}
.etp-panel-title { font-size: 19px; font-weight: 700; color: var(--c-txt); margin: 0; letter-spacing: -0.3px; }
.etp-panel-acts { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.etp-panel-body { display: flex; flex-direction: column; gap: 16px; padding: 16px 20px 24px; }

.etp-refresh-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--c-border); background: rgba(255,255,255,0.04); color: var(--c-txt-2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 140ms;
}
.etp-refresh-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #f0f0ec; }
.etp-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.etp-browse-btn, .etp-new-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 9px; font-size: 12.5px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: all 130ms; white-space: nowrap; border: 1px solid var(--c-border);
}
.etp-browse-btn { background: rgba(255,255,255,0.04); color: var(--c-txt-2); }
.etp-browse-btn:hover { background: rgba(255,255,255,0.08); color: #f0f0ec; }
.etp-new-btn { background: rgb(from var(--gold) r g b / 0.10); color: var(--gold); border-color: rgba(201,168,76,0.3); }
.etp-new-btn:hover { background: rgb(from var(--gold) r g b / 0.16); }

/* ══ Filter chips ══ */
.etp-chip-row { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 20px 0; }
.etp-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; font-family: inherit;
  background: var(--c-bg); border: 1px solid var(--c-border); color: var(--c-txt-2);
  cursor: pointer; transition: all 130ms;
}
.etp-chip:hover { color: var(--c-txt); border-color: var(--c-txt-3); }
.etp-chip--on { background: rgb(from var(--gold) r g b / 0.10); border-color: rgba(201,168,76,0.3); color: var(--gold); }
.etp-chip-cnt { opacity: 0.7; font-weight: 700; }

/* ══ Template cards ══ */
.etp-tpl-list { display: flex; flex-direction: column; gap: 10px; }
.etp-tpl-card {
  border: 1px solid var(--c-border); border-radius: 12px; padding: 14px 16px;
  background: rgba(255,255,255,0.02); display: flex; flex-direction: column; gap: 8px;
  transition: background 300ms ease, border-color 300ms ease;
}
.etp-tpl-card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.etp-tpl-name { font-size: 13.5px; font-weight: 700; color: var(--c-txt); }
.etp-tpl-badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.etp-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 7px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.2px;
}
.etp-badge--tag     { background: rgb(from var(--gold) r g b / 0.10); color: var(--gold); }
.etp-badge--general { background: var(--c-track); color: var(--c-txt-2); }
.etp-badge--lang    { background: rgba(96,165,250,0.10); color: #60a5fa; }
.etp-badge--imported{ background: rgba(45,212,191,0.10); color: #2dd4bf; }
.etp-tpl-content { font-size: 13px; color: var(--c-txt-2); line-height: 1.5; margin: 0; white-space: pre-wrap; }
.etp-tpl-card-acts { display: flex; gap: 8px; margin-top: 2px; }
.etp-tpl-act-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 11px; border-radius: 8px; font-size: 11.5px; font-weight: 600; font-family: inherit;
  background: var(--c-bg); border: 1px solid var(--c-border); color: var(--c-txt-2);
  cursor: pointer; transition: all 130ms;
}
.etp-tpl-act-btn:hover { color: var(--c-txt); border-color: var(--c-txt-3); }
.etp-tpl-act-btn--del:hover { color: #ff6b6b; border-color: rgba(255,69,58,0.35); background: rgba(255,69,58,0.06); }
.etp-tpl-act-btn--confirm { color: #ff6b6b; border-color: rgba(255,69,58,0.4); background: rgba(255,69,58,0.08); }

/* Empty */
.etp-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; min-height: 200px; color: var(--c-txt-3);
}
.etp-empty-icon {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(10,10,11,0.03); border: 1px solid rgba(10,10,11,0.08);
  display: flex; align-items: center; justify-content: center;
}
.etp-empty-title { font-size: 15px; font-weight: 600; color: var(--c-txt-2); margin: 0; }
.etp-empty-sub   { font-size: 13px; color: var(--c-txt-3); margin: 0; text-align: center; }

/* Spin */
.etp-spin { animation: etp-spin-anim 1.1s linear infinite; }
@keyframes etp-spin-anim { to { transform: rotate(360deg); } }

/* ══ Form modal ══ */
.etp-form-backdrop, .etp-browse-backdrop {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.etp-form-backdrop   { z-index: 400; }
.etp-browse-backdrop { z-index: 410; }
.etp-form-panel, .etp-browse-panel {
  width: 100%; max-width: 480px; max-height: 88vh;
  background: #111; border: 1px solid var(--c-border); border-radius: 16px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.etp-browse-panel { max-width: 560px; }
.etp-form-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; border-bottom: 1px solid var(--c-border); flex-shrink: 0;
}
.etp-form-title { font-size: 15px; font-weight: 700; color: var(--c-txt); }
.etp-form-hd-acts { display: flex; align-items: center; gap: 10px; }
.etp-browse-inline-btn {
  display: inline-flex; align-items: center; gap: 5px;
  background: transparent; border: none;
  color: var(--gold); padding: 0;
  font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: opacity 130ms; white-space: nowrap;
}
.etp-browse-inline-btn:hover { opacity: 0.75; }
.etp-form-close {
  width: 28px; height: 28px; border-radius: 8px; border: none;
  background: rgba(255,255,255,0.06); color: var(--c-txt-2);
  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
}
.etp-form-close:hover { background: rgba(255,255,255,0.1); color: var(--c-txt); }

.etp-form-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
.etp-field { display: flex; flex-direction: column; gap: 6px; }
.etp-field-lbl { font-size: 11.5px; font-weight: 700; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.5px; }
.etp-field-hint { font-size: 11px; color: var(--c-txt-3); }

/* Placeholder chips */
.etp-ph-row { display: flex; flex-direction: column; gap: 6px; }
.etp-ph-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.etp-ph-chip {
  font-family: 'SF Mono', 'Consolas', monospace; font-size: 11px; font-weight: 600;
  padding: 4px 9px; border-radius: 7px; border: 1px solid var(--c-border);
  background: rgba(201,168,76,0.06); color: var(--gold);
  cursor: pointer; transition: all 130ms;
}
.etp-ph-chip:hover { background: rgb(from var(--gold) r g b / 0.14); border-color: rgba(201,168,76,0.4); }
.etp-input, .etp-select, .etp-textarea {
  padding: 9px 12px; border-radius: 9px; border: 1px solid var(--c-border);
  background: rgba(255,255,255,0.03); color: var(--c-txt); font-size: 13px; font-family: inherit;
  outline: none; transition: border-color 150ms, box-shadow 150ms;
}
.etp-textarea { resize: vertical; line-height: 1.5; }
.etp-input:focus, .etp-select:focus, .etp-textarea:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(184,146,77,0.10); }

.etp-form-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 18px; border-top: 1px solid var(--c-border); flex-shrink: 0;
}
.etp-form-cancel {
  padding: 9px 16px; border-radius: 9px; font-size: 13px; font-weight: 600; font-family: inherit;
  background: rgba(255,255,255,0.04); border: 1px solid var(--c-border); color: var(--c-txt-2); cursor: pointer;
}
.etp-form-cancel:hover { background: rgba(255,255,255,0.08); }
.etp-form-save {
  padding: 9px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; font-family: inherit;
  background: var(--gold); border: none; color: #1a1608; cursor: pointer; transition: opacity 130ms;
}
.etp-form-save:hover:not(:disabled) { opacity: 0.88; }
.etp-form-save:disabled { opacity: 0.45; cursor: not-allowed; }

.etp-browse-body { padding: 16px 18px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
.etp-browse-sub { font-size: 12.5px; color: var(--c-txt-3); margin: 0; }

/* ── Responsive ── */
@media (max-width: 700px) {
  .etp-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .etp-root  { padding: 12px 14px 20px; gap: 12px; }
  .etp-stat-card { padding: 14px 14px 12px; gap: 12px; min-width: 0; overflow: hidden; }
  .etp-stat-icon { width: 36px; height: 36px; flex-shrink: 0; }
  .etp-stat-val  { font-size: 24px; }
  .etp-stat-body { gap: 6px; min-width: 0; }
  .etp-stat-lbl  { font-size: 10px; letter-spacing: 0; }
  .etp-panel-hd  { flex-wrap: wrap; }
  .etp-panel-acts { width: 100%; margin-left: 0; }
}
</style>
