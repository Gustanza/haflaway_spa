<template>
  <div class="evc-root">

    <!-- ══ Resume-send banner — arrives here via the Guest List's Send flow when
         no card blueprint existed yet for the chosen purpose. Stays up (even
         across a refresh) until the user either continues or dismisses it. ══ -->
    <div v-if="returnToSend" class="evc-resume-banner">
      <div class="evc-resume-text">
        <p class="evc-resume-title">Waiting on a {{ PURPOSE_LABELS[returnToSend] ?? returnToSend }} template</p>
        <p class="evc-resume-sub">
          Create it with the Designer (opens in a new tab), then come back and continue sending.
        </p>
      </div>
      <div class="evc-resume-acts">
        <span v-if="resumeNoCardYet" class="evc-resume-warn">No template found for this purpose yet.</span>
        <button class="evc-resume-continue" :disabled="resumingSend" @click="continueSendFlow">
          {{ resumingSend ? 'Checking…' : 'Continue Sending' }}
        </button>
        <button class="evc-resume-dismiss" @click="dismissResumeBanner" title="Dismiss">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="evc-sticky-head">
      <div class="evc-panel-hd">
        <button type="button" class="evc-hd-burger" title="Menu" @click="navDrawer.open()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="evc-hd-sep" />
        <div class="evc-hd-badge" @click="$router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="evc-hd-brand-logo" />
          <span v-else class="evc-hd-brand-script">.joy</span>
        </div>
        <div class="evc-hd-sep" />
        <div class="evc-hd-title-group">
          <h1 class="evc-hub-title">Cards</h1>
          <span class="evc-hub-count">{{ cards.length }}</span>
        </div>

        <div class="evc-search-wrap">
          <svg class="evc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQ" class="evc-search" placeholder="Filter by name" />
          <button v-if="searchQ" type="button" class="evc-search-clear" @click="searchQ = ''" aria-label="Clear">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <span v-else class="evc-search-filter" title="Filter">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </span>
        </div>

        <a :href="designerCreateUrl" target="_blank" rel="noopener" class="evc-add-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Template
        </a>
        <button type="button" class="evc-hd-gear" title="Settings" @click="$router.push(`/event/${eventId}/settings`)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div class="evc-toolbar2">
        <button
          v-for="f in PURPOSE_FILTERS" :key="f.val" type="button"
          class="evc-tb2-btn" :class="{ 'evc-tb2-btn--active': purposeFilter === f.val }"
          @click="purposeFilter = f.val"
        >
          <span class="evc-tb2-lbl">
            {{ f.label }}
            <span class="evc-tb2-cnt">{{ purposeCount(f.val) }}</span>
          </span>
        </button>
      </div>
    </div>

    <div class="evc-split">
      <div class="evc-editor">
        <p class="evc-crumb">Stationery / Templates</p>

        <div v-if="loading && !cards.length" class="evc-empty">
          <p class="evc-empty-kicker">Templates</p>
          <h2 class="evc-empty-title">Loading…</h2>
        </div>

        <div v-else-if="!filteredCards.length" class="evc-empty">
          <p class="evc-empty-kicker">The stationery</p>
          <h2 class="evc-empty-title">{{ searchQ || purposeFilter !== 'all' ? 'Nothing matches' : 'Still unwritten' }}</h2>
          <p class="evc-empty-lede">{{ searchQ || purposeFilter !== 'all' ? 'Try another search or filter.' : 'Invitation, contribution, save the date — open the designer and the first template lands here.' }}</p>
          <a v-if="!searchQ && purposeFilter === 'all'" :href="designerCreateUrl" target="_blank" rel="noopener" class="evc-empty-row">
            <span class="evc-empty-plus">+</span>
            <span class="evc-empty-row-copy">
              <span class="evc-empty-row-title">New template</span>
              <span class="evc-empty-row-sub">It lands in the preview on the right</span>
            </span>
          </a>
        </div>

        <div v-else class="evc-list">
          <div
            v-for="card in filteredCards" :key="card.id"
            class="evc-item"
            :class="{ 'evc-item--on': selectedCard?.id === card.id }"
            @click="selectCard(card)"
          >
            <div
              class="evc-item-thumb"
              :style="card.templateUrl
                ? { backgroundImage: `url(${card.templateUrl})` }
                : {}"
            >
              <svg v-if="!card.templateUrl" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="M3 10h18"/>
              </svg>
            </div>
            <div class="evc-item-copy">
              <span class="evc-item-title">{{ card.type || 'Untitled' }}</span>
              <span class="evc-item-sub">{{ PURPOSE_LABELS[card.purpose] ?? card.purpose }} · {{ card.capacity ?? '—' }} guests</span>
              <span class="evc-item-chip">{{ (card.clearAt ?? []).length }} checkpoints</span>
            </div>
            <div class="evc-item-acts" @click.stop>
              <template v-if="confirmDeleteId === card.id">
                <span class="evc-del-confirm-lbl">Delete?</span>
                <button type="button" class="evc-action-btn evc-action-btn--danger" @click="deleteCard(card)">
                  {{ deletingId === card.id ? '…' : 'Yes' }}
                </button>
                <button type="button" class="evc-action-btn" @click="confirmDeleteId = null">No</button>
              </template>
              <template v-else>
                <a :href="designerEditUrl(card.id)" target="_blank" rel="noopener" class="evc-action-btn" title="Edit in Designer">Edit</a>
                <button type="button" class="evc-action-btn" @click="confirmDeleteId = card.id">Delete</button>
              </template>
            </div>
            <svg class="evc-item-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <aside class="evc-preview">
        <div class="evc-preview-bar">
          <span class="evc-preview-kicker">Guest card</span>
          <a
            v-if="selectedCard"
            :href="designerEditUrl(selectedCard.id)"
            target="_blank"
            rel="noopener"
            class="evc-preview-edit"
          >Edit in Designer</a>
        </div>

        <div class="evc-preview-stage">
          <div v-if="!selectedCard" class="evc-paper evc-paper--empty">
            <p class="evc-paper-kicker">Stationery</p>
            <h2 class="evc-paper-title">Pick a template</h2>
            <p class="evc-paper-lede">Select a template on the left and guests’ stationery appears here.</p>
          </div>

          <div
            v-else
            class="evc-paper"
            :class="{ 'evc-paper--art': !!selectedCard.templateUrl }"
            :style="paperStyle(selectedCard)"
          >
            <template v-if="!selectedCard.templateUrl">
              <p class="evc-paper-kicker">{{ PURPOSE_LABELS[selectedCard.purpose] ?? selectedCard.purpose }}</p>
              <h2 class="evc-paper-title">{{ selectedCard.type || 'Untitled' }}</h2>
              <p class="evc-paper-lede">Open the designer to paint this card. Until then, this is the blank.</p>
            </template>
          </div>
        </div>
      </aside>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../../firebase'
import { collection, getDocs, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { useOrg } from '../../composables/useOrg.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'

const props   = defineProps({ event: Object, eventId: String })
const route   = useRoute()
const router  = useRouter()
const eventId = computed(() => props.eventId ?? route.params.eventId)
const { brandName, brandLogoUrl } = useOrg()
const navDrawer = useNavDrawer()

// ── Constants ─────────────────────────────────────────────────────────────────
const DESIGNER_BASE = 'https://haflaway-designer.web.app/designer'

const PURPOSE_LABELS = {
  invitation:    'Invitation',
  contribution:  'Contribution',
  save_the_date: 'Save the Date',
  thank_you:     'Thank You',
  enclosure:     'Enclosure',
  contact:       'Contact',
}

// Matches CARD_OPTIONS' titles in EventAttendees.vue's Send modal exactly —
// used only for naming a campaign started from the Continue Sending banner,
// so it reads the same as one started directly from that modal.
const CARD_PURPOSE_TITLES = {
  save_the_date: 'Save the Date',
  invitation:    'Invitation',
  thank_you:     'Thank You Card',
  enclosure:     'Enclosure Card',
}

const PURPOSE_FILTERS = [
  { val: 'all',          label: 'All'          },
  { val: 'invitation',   label: 'Invitation'   },
  { val: 'contribution', label: 'Contribution' },
  { val: 'save_the_date',label: 'Save the Date'},
  { val: 'thank_you',    label: 'Thank You'    },
  { val: 'enclosure',    label: 'Enclosure'    },
]

// ── State ─────────────────────────────────────────────────────────────────────
const cards   = ref([])
const loading = ref(false)

const searchQ       = ref('')
const purposeFilter = ref(route.query.filter || 'all')
const selectedCard  = ref(null)
const confirmDeleteId = ref(null)
const deletingId    = ref(null)

// ── Resume-send banner (arrived here from the Guest List's Send flow because
// no card blueprint existed yet for this purpose) ──────────────────────────────
const returnToSendRaw = route.query.returnToSend
const returnToSend    = ref((Array.isArray(returnToSendRaw) ? returnToSendRaw[0] : returnToSendRaw) || null)
const resumingSend    = ref(false)
const resumeNoCardYet = ref(false)
// Which screen sent us here for this purpose — the Guest List's Send modal
// (default, unchanged) or the Invitations page's own Card tiles — so
// continueSendFlow() below knows where "come back and continue" actually
// means. Same array-safe unwrap as returnToSend above.
const originRaw = route.query.origin
const sendOrigin = (Array.isArray(originRaw) ? originRaw[0] : originRaw) || 'attendees'

// ── URLs ──────────────────────────────────────────────────────────────────────
const designerCreateUrl = computed(() => `${DESIGNER_BASE}/${eventId.value}/create`)
function designerEditUrl(cardId) { return `${DESIGNER_BASE}/${eventId.value}/${cardId}/edit` }

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadData() {
  if (!eventId.value) return
  loading.value = true
  try {
    const cardsSnap = await getDocs(collection(db, 'events', eventId.value, 'cards'))
    const kardList = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Fetch templateUrl from global cards/{id} collection in parallel
    const fullSnaps = await Promise.all(kardList.map(k => getDoc(doc(db, 'cards', k.id))))

    cards.value = kardList.map((k, i) => {
      const full = fullSnaps[i].data() ?? {}
      return {
        ...k,
        templateUrl: full.templateUrl  ?? null,
        cardWidth:   full.cardWidth    ?? null,
        cardHeight:  full.cardHeight   ?? null,
      }
    })
  } catch (e) {
    console.error('Failed to load cards data', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })

function purposeCount(val) {
  if (val === 'all') return cards.value.length
  return cards.value.filter(c => c.purpose === val).length
}

function paperStyle(card) {
  const s = {}
  if (card.templateUrl) s.backgroundImage = `url(${card.templateUrl})`
  if (card.cardWidth && card.cardHeight) s.aspectRatio = `${card.cardWidth} / ${card.cardHeight}`
  return s
}

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredCards = computed(() => {
  let list = cards.value
  if (purposeFilter.value !== 'all') {
    list = list.filter(c => c.purpose === purposeFilter.value)
  }
  const q = searchQ.value.trim().toLowerCase()
  if (q) {
    list = list.filter(c =>
      (c.type ?? '').toLowerCase().includes(q) ||
      (PURPOSE_LABELS[c.purpose] ?? c.purpose ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

watch(filteredCards, (list) => {
  if (!list.length) {
    selectedCard.value = null
    return
  }
  if (!selectedCard.value || !list.some(c => c.id === selectedCard.value.id)) {
    selectedCard.value = list[0]
  }
}, { immediate: true })

// ── Actions ───────────────────────────────────────────────────────────────────
function selectCard(card) {
  selectedCard.value = card
  confirmDeleteId.value = null
}

async function deleteCard(card) {
  if (deletingId.value) return
  deletingId.value = card.id
  try {
    await deleteDoc(doc(db, 'events', eventId.value, 'cards', card.id))
    cards.value = cards.value.filter(c => c.id !== card.id)
    if (selectedCard.value?.id === card.id) selectedCard.value = null
    confirmDeleteId.value = null
  } catch (e) {
    console.error('Failed to delete card', e)
  } finally {
    deletingId.value = null
  }
}

// ── Resume-send banner actions ─────────────────────────────────────────────────
function dismissResumeBanner() {
  returnToSend.value = null
  const { returnToSend: _drop, ...rest } = route.query
  router.replace({ query: rest })
}

// Re-checks for a blueprint under this purpose (a fresh loadData() already ran
// on mount, so `cards` reflects whatever exists right now) and, if one's been
// created in the Designer since we got here, starts the same card-send
// campaign the Guest List's Send flow would have — same shape as
// EventAttendees.vue's selectCardOption for the "blueprint exists" path.
async function continueSendFlow() {
  if (resumingSend.value) return
  const purpose = returnToSend.value
  if (!purpose) return
  resumingSend.value = true
  resumeNoCardYet.value = false
  try {
    // Refresh first — the Designer tab may have just saved a new template,
    // and the in-memory `cards` list from onMounted's loadData() could be
    // stale (or still loading) by the time they click this.
    await loadData()
    // The user may have dismissed the banner (or it changed) while this was
    // refreshing — don't act on a purpose they're no longer waiting on.
    if (returnToSend.value !== purpose) return
    const hasCard = cards.value.some(c => c.purpose === purpose)
    if (!hasCard) {
      resumeNoCardYet.value = true
      return
    }
    // Same deterministic per-(event, purpose) campaign id as
    // EventAttendees.vue's selectCardOption — never a fresh addDoc — so this
    // detour through the Designer rejoins the exact same campaign rather
    // than forking off a second "Invitation" with no memory of who the first
    // one already reached.
    const campaignRef = doc(db, 'events', eventId.value, 'campaigns', `card_${purpose}`)
    const campaignSnap = await getDoc(campaignRef)
    if (!campaignSnap.exists()) {
      await setDoc(campaignRef, {
        // Matches the title CARD_OPTIONS shows in the Send modal (EventAttendees.vue)
        // so a campaign is named the same whether the blueprint existed already
        // or was just created via this Designer detour.
        name: CARD_PURPOSE_TITLES[purpose] ?? PURPOSE_LABELS[purpose] ?? purpose,
        type: purpose,
        // See EventAttendees.vue's selectCardOption — flags this as a card
        // campaign so the composer looks up a purpose-specific WhatsApp
        // template category instead of the generic one.
        kind: 'card',
        whatsappMessage: null,
        smsMessage: null,
        createdAt: new Date().toISOString(),
        status: 'draft',
      })
    }
    // Card campaigns always compose on the Invitations screen now
    // (cardScope:true) — Bulk Messages' own list filters kind:'card' out
    // entirely, so a card campaign deep-linked there would find no match to
    // restore. Only the return path differs by origin: the Guest List's Send
    // modal wants to bounce back there; opened directly from the Invitations
    // tiles, there's nowhere else to go — closing with no returnTo just
    // reveals this same page underneath, which already IS the campaign's home.
    const returnToQs = sendOrigin === 'invitations'
      ? ''
      : `&returnTo=${encodeURIComponent(`/event/${eventId.value}/attendees?reopenCampaigns=1`)}`
    router.push(`/event/${eventId.value}/invitations?campaign=${campaignRef.id}&send=1${returnToQs}`)
  } catch (e) {
    console.error('continueSendFlow:', e)
  } finally {
    resumingSend.value = false
  }
}
</script>
<style scoped>
.evc-root {
  min-height: 100vh;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #1f2937;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
}
.evc-resume-banner {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin: 12px 36px 0; padding: 14px 18px;
  border-radius: 14px; background: #f8fafc; border: 1px solid #e5e7eb;
}
.evc-resume-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.evc-resume-title { font-size: 13.5px; font-weight: 700; color: #111827; margin: 0; }
.evc-resume-sub { font-size: 12.5px; color: #64748b; margin: 0; }
.evc-resume-acts { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.evc-resume-warn { font-size: 12.5px; color: #92400e; font-weight: 500; }
.evc-resume-continue {
  height: 36px; padding: 0 16px; border: 1px solid #e5e7eb; border-radius: 9999px;
  background: #fff; color: #111827; font-size: 13px; font-weight: 600;
  font-family: inherit; cursor: pointer;
}
.evc-resume-continue:hover { background: #f8fafc; border-color: #d1d5db; }
.evc-resume-continue:disabled { opacity: 0.5; cursor: default; }
.evc-resume-dismiss {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: none; color: #94a3b8; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.evc-resume-dismiss:hover { background: #f3f4f6; color: #111827; }

.evc-sticky-head { position: sticky; top: 0; z-index: 20; background: #fff; }
.evc-panel-hd {
  display: flex; align-items: center; height: 92px; padding: 0 36px; gap: 14px;
  border-bottom: 1px solid #f1f3f5;
}
.evc-hd-burger {
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff;
  color: #4b5563; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.evc-hd-burger:hover { background: #f8fafc; color: #18181b; border-color: #d1d5db; }
.evc-hd-sep { width: 1px; height: 16px; background: #e5e7eb; flex-shrink: 0; margin: 0 4px; }
.evc-hd-badge {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e7eb;
  overflow: hidden; background: #fff; flex-shrink: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.evc-hd-brand-logo { width: 100%; height: 100%; object-fit: cover; }
.evc-hd-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-size: 18px; font-weight: 700;
  color: #111827; letter-spacing: -0.04em; line-height: 1;
}
.evc-hd-title-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.evc-hub-title { margin: 0; font-size: 22px; font-weight: 600; color: #18181b; letter-spacing: -0.015em; white-space: nowrap; }
.evc-hub-count {
  font-size: 12.5px; font-weight: 600; color: #4b5563;
  background: #f1f3f5; border-radius: 9999px; padding: 2px 10px;
}
.evc-search-wrap {
  position: relative; display: flex; align-items: center;
  flex: 1 1 0; margin: 0 20px; min-width: 220px;
}
.evc-search-icon { position: absolute; left: 16px; color: #9ca3af; pointer-events: none; }
.evc-search {
  width: 100%; height: 44px; padding: 0 48px 0 44px;
  background: #f3f4f6; border: none; border-radius: 9999px;
  font-size: 15px; color: #111827; outline: none; font-family: inherit;
}
.evc-search:focus { background: #eeeeef; }
.evc-search::placeholder { color: #9ca3af; }
.evc-search-clear {
  position: absolute; right: 10px; width: 32px; height: 32px;
  border: none; background: none; color: #9ca3af; cursor: pointer;
  display: flex; align-items: center; justify-content: center; border-radius: 50%;
}
.evc-search-filter {
  position: absolute; right: 8px; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff; color: #6b7280;
}
.evc-add-btn {
  display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;
  height: 40px; padding: 0 20px; border: 1px solid #e5e7eb; border-radius: 9999px;
  background: #fff; color: #111827; font-family: inherit;
  font-size: 13.5px; font-weight: 600; cursor: pointer; text-decoration: none;
}
.evc-add-btn:hover { background: #f8fafc; border-color: #d1d5db; }
.evc-hd-gear {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.evc-hd-gear:hover { background: #f8fafc; color: #0f172a; }

.evc-toolbar2 {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 36px; border-bottom: 1px solid #f1f3f5;
}
.evc-tb2-btn {
  display: flex; align-items: center;
  min-height: 34px; padding: 6px 14px;
  border: 1px solid #e2e8f0; border-radius: 9999px; background: #fff;
  cursor: pointer; font-family: inherit;
}
.evc-tb2-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
.evc-tb2-btn--active { background: #f1f5f9; border-color: #cbd5e1; }
.evc-tb2-lbl { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #475569; white-space: nowrap; }
.evc-tb2-btn--active .evc-tb2-lbl { color: #0f172a; font-weight: 600; }
.evc-tb2-cnt {
  min-width: 18px; padding: 1px 6px; border-radius: 9999px;
  background: #f1f5f9; font-size: 10.5px; font-weight: 700; color: #475569;
}

.evc-split {
  flex: 1;
  display: flex;
  align-items: stretch;
  min-height: 0;
  background: #f7f7f8;
}
.evc-editor {
  flex: 1 1 50%;
  width: 50%;
  min-width: 0;
  background: #ffffff;
  border-right: 1px solid #f0f0f2;
  overflow-y: auto;
  padding: 22px 32px 48px;
}
.evc-crumb {
  margin: 0 0 18px;
  font-size: 12.5px;
  font-weight: 500;
  color: #94a3b8;
}
.evc-empty { padding: 8px 2px 0; }
.evc-empty-kicker {
  margin: 0 0 6px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase; color: #94a3b8;
}
.evc-empty-title {
  margin: 0 0 10px;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400; font-style: italic; font-size: 28px; color: #1a1a1a;
}
.evc-empty-lede { margin: 0 0 22px; max-width: 42ch; font-size: 14px; color: #64748b; line-height: 1.55; }
.evc-empty-row {
  width: min(420px, 100%); display: flex; align-items: center; gap: 14px;
  padding: 16px 14px; border: 1px dashed #d1d5db; border-radius: 14px;
  background: #fafafa; text-decoration: none; font-family: inherit;
}
.evc-empty-row:hover { border-color: #c4c4c8; background: #fff; }
.evc-empty-plus {
  width: 36px; height: 36px; border-radius: 50%;
  background: #fff; color: #374151; border: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.evc-empty-row-copy { display: flex; flex-direction: column; gap: 2px; }
.evc-empty-row-title { font-size: 15px; font-weight: 600; color: #111827; }
.evc-empty-row-sub { font-size: 13px; color: #64748b; }

.evc-list { display: flex; flex-direction: column; }
.evc-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px 16px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}
.evc-item:hover { background: #fafafa; }
.evc-item--on { background: #f7f7f8; }
.evc-item-thumb {
  width: 52px; height: 68px; flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid #ececec;
  background: #faf6ef center / cover no-repeat;
  color: #9ca3af;
  display: flex; align-items: center; justify-content: center;
}
.evc-item-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.evc-item-title { font-size: 15px; font-weight: 600; color: #111827; }
.evc-item-sub { font-size: 13px; color: #64748b; }
.evc-item-chip {
  display: inline-flex;
  margin-top: 2px;
  height: 22px;
  padding: 0 10px;
  border-radius: 9999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 11.5px;
  font-weight: 600;
  align-items: center;
}
.evc-item-acts {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
}
.evc-item:hover .evc-item-acts,
.evc-item--on .evc-item-acts { opacity: 1; pointer-events: auto; }
.evc-item-chev { color: #9ca3af; flex-shrink: 0; }
.evc-action-btn {
  height: 28px; padding: 0 10px; border-radius: 9999px;
  border: 1px solid #e5e7eb; background: #fff; color: #374151;
  font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
}
.evc-action-btn:hover { background: #f8fafc; border-color: #d1d5db; }
.evc-action-btn--danger { background: #fff; color: #9f1239; border-color: #fecdd3; }
.evc-del-confirm-lbl { font-size: 12px; font-weight: 600; color: #111827; }

.evc-preview {
  flex: 1 1 50%;
  width: 50%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f4f4f5;
}
.evc-preview-bar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f2;
  flex-shrink: 0;
}
.evc-preview-kicker {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #94a3b8;
}
.evc-preview-edit {
  font-size: 12.5px; font-weight: 600; color: #374151; text-decoration: none;
}
.evc-preview-edit:hover { color: #111827; }
.evc-preview-stage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 28px 24px 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.evc-paper {
  width: min(420px, 100%);
  min-height: 280px;
  background: #FAF6EF;
  color: #241F18;
  border-radius: 4px;
  box-shadow: 0 18px 50px rgba(36, 31, 24, 0.08);
  padding: 40px 36px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.evc-paper--art {
  min-height: 0;
  aspect-ratio: 3 / 4;
  padding: 0;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  background-color: #faf6ef;
}
.evc-paper-kicker {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8a8178;
}
.evc-paper-title {
  margin: 0 0 12px;
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 400;
  font-size: 28px;
  color: #241F18;
  line-height: 1.2;
}
.evc-paper-lede {
  margin: 0;
  font-size: 14px;
  color: #6b645c;
  line-height: 1.55;
  max-width: 34ch;
}

@media (max-width: 980px) {
  .evc-split { flex-direction: column; }
  .evc-editor, .evc-preview { width: 100%; flex-basis: auto; }
  .evc-editor { border-right: none; border-bottom: 1px solid #f0f0f2; max-height: 46vh; }
  .evc-preview { min-height: 54vh; }
  .evc-item-acts { opacity: 1; pointer-events: auto; }
}
@media (max-width: 900px) {
  .evc-panel-hd { height: auto; flex-wrap: wrap; padding: 12px 16px; gap: 10px; }
  .evc-search-wrap { flex: 1 1 100%; margin: 8px 0 0; order: 8; }
  .evc-hd-sep { display: none; }
  .evc-toolbar2, .evc-resume-banner { padding-left: 16px; padding-right: 16px; }
  .evc-resume-banner { margin-left: 16px; margin-right: 16px; }
  .evc-editor { padding: 16px; }
}
</style>
