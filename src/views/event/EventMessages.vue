<template>
  <div class="em-root">

    <!-- ── Toolbar ── -->
    <div class="em-toolbar">
      <div class="em-toolbar-left">
        <div class="em-search-wrap">
          <svg class="em-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#8A8580" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQ" class="em-search" placeholder="Search by name or phone…" />
          <button v-if="searchQ" class="em-search-clear" @click="searchQ = ''">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Campaign tabs — only known campaigns that have data -->
        <div class="em-camp-tabs">
          <button
            v-for="c in displayCampaigns" :key="c.id"
            class="em-camp-tab" :class="{ 'em-camp-tab--active': activeCampaign === c.id }"
            @click="activeCampaign = c.id">
            {{ c.label }}
          </button>
        </div>
      </div>

      <button class="em-send-btn" @click="openSendDrawer">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Send
      </button>
    </div>

    <!-- ── Stats ── -->
    <div class="em-stats">
      <div v-for="s in statCards" :key="s.label" class="em-stat">
        <div class="em-stat-n" :style="{ color: s.color }">{{ s.n }}</div>
        <div class="em-stat-lbl">{{ s.label }}</div>
        <div v-if="s.pct != null" class="em-stat-pct">{{ s.pct }}%</div>
      </div>
    </div>

    <!-- ── Table ── -->
    <div class="em-table-wrap">
      <div class="em-table-scroll">
        <table class="em-table">
          <thead>
            <tr>
              <th class="em-th">Name</th>
              <th class="em-th">Phone</th>
              <th class="em-th">
                <div class="em-ch-head">
                  <svg width="11" height="11" viewBox="0 0 448 512" fill="#128C7E">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                  </svg>
                  WhatsApp
                </div>
              </th>
              <th class="em-th">
                <div class="em-ch-head">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="#5856D6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  SMS
                </div>
              </th>
              <th class="em-th">RSVP</th>
              <th class="em-th">Added</th>
            </tr>
          </thead>
          <tbody>

            <!-- Skeleton -->
            <template v-if="loading && !attendees.length">
              <tr v-for="n in 10" :key="`sk-${n}`" class="em-tr em-tr--sk">
                <td class="em-td"><div class="em-sk-name"><div class="em-sk-circle"/><div class="em-sk-bar em-sk-bar--lg"/></div></td>
                <td class="em-td"><div class="em-sk-bar"/></td>
                <td class="em-td"><div class="em-sk-bar em-sk-bar--sm"/></td>
                <td class="em-td"><div class="em-sk-bar em-sk-bar--sm"/></td>
                <td class="em-td"><div class="em-sk-bar em-sk-bar--sm"/></td>
                <td class="em-td"><div class="em-sk-bar"/></td>
              </tr>
            </template>

            <!-- Data rows -->
            <tr v-for="att in pageList" :key="att.id" class="em-tr">
              <td class="em-td">
                <div class="em-name-cell">
                  <div class="em-avatar"
                    :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }">
                    {{ initials(att.fullName) }}
                  </div>
                  <span class="em-name-text">{{ att.fullName }}</span>
                </div>
              </td>
              <td class="em-td em-td--muted">{{ att.phone || '—' }}</td>

              <!-- WhatsApp status -->
              <td class="em-td">
                <span class="em-badge" :class="`em-badge--${wspStatus(att)}`">
                  <svg v-if="wspStatus(att) === 'read'" width="11" height="11" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <polyline points="1 12 5 16 11 6"/><polyline points="9 12 13 16 23 6"/>
                  </svg>
                  <svg v-else-if="wspStatus(att) === 'delivered'" width="11" height="11" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <polyline points="1 12 5 16 11 6"/><polyline points="9 12 13 16 23 6"/>
                  </svg>
                  <svg v-else-if="wspStatus(att) === 'sent'" width="11" height="11" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else-if="wspStatus(att) === 'failed'" width="11" height="11" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {{ STATUS_LABELS[wspStatus(att)] || '—' }}
                </span>
              </td>

              <!-- SMS status -->
              <td class="em-td">
                <span class="em-badge" :class="`em-badge--${smsStatus(att)}`">
                  <svg v-if="['delivered','read'].includes(smsStatus(att))" width="11" height="11"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else-if="smsStatus(att) === 'sent'" width="11" height="11" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else-if="smsStatus(att) === 'failed'" width="11" height="11" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {{ STATUS_LABELS[smsStatus(att)] || '—' }}
                </span>
              </td>

              <!-- RSVP -->
              <td class="em-td">
                <div class="em-rsvp-cell">
                  <span class="em-rsvp-dot" :style="{ background: rsvpColor(att.attendanceStatus) }" />
                  <span class="em-rsvp-text">{{ att.attendanceStatus || 'Not Confirmed' }}</span>
                </div>
              </td>

              <td class="em-td em-td--muted">{{ formatDate(att.createdAt) }}</td>
            </tr>

            <!-- Empty state -->
            <tr v-if="!loading && !filteredList.length">
              <td colspan="6" class="em-td-empty">
                <div class="em-empty">
                  <div class="em-empty-icon">
                    <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="32" fill="#F2F2F0"/>
                      <path d="M44 22H20a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3V25a3 3 0 0 0-3-3z" fill="#DDDBD6"/>
                      <path d="M17 25l15 10 15-10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <p class="em-empty-title">
                    {{ searchQ ? `No results for "${searchQ}"` : 'No messages yet' }}
                  </p>
                  <p class="em-empty-sub">
                    {{ searchQ
                      ? 'Try a different name or phone number.'
                      : 'Send your first invitation and delivery status will appear here in real time.' }}
                  </p>
                  <button v-if="searchQ" class="em-empty-cta" @click="searchQ = ''">Clear search</button>
                  <button v-else class="em-empty-cta em-empty-cta--primary" @click="openSendDrawer">
                    Send Invitations
                  </button>
                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      <!-- Footer / pagination -->
      <div class="em-table-footer" v-if="filteredList.length > PAGE_SIZE">
        <span class="em-range-lbl">
          {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filteredList.length) }}
          of {{ filteredList.length }}
        </span>
        <div class="em-paginator" v-if="totalPages > 1">
          <button class="em-page-btn em-page-btn--nav" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <template v-for="p in pageNumbers" :key="String(p)">
            <span v-if="p === '…'" class="em-page-ellipsis">…</span>
            <button v-else class="em-page-btn" :class="{ 'em-page-btn--active': currentPage === p }" @click="goPage(p)">{{ p }}</button>
          </template>
          <button class="em-page-btn em-page-btn--nav" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         SEND DRAWER
         ══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="em-fade">
        <div v-if="sendDrawerOpen" class="em-overlay" @click.self="closeSendDrawer">
          <Transition name="em-slide-right">
            <div v-if="sendDrawerOpen" class="em-drawer">

              <div class="em-drawer-header">
                <div class="em-drawer-header-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9A84C"
                    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  <span class="em-drawer-title">Send Messages</span>
                </div>
                <button class="em-drawer-close" @click="closeSendDrawer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <!-- Result banner -->
              <div v-if="sendResult" class="em-send-result"
                :class="sendResult.ok ? 'em-send-result--ok' : 'em-send-result--err'">
                <svg v-if="sendResult.ok" width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div>
                  <p class="em-result-title">{{ sendResult.ok ? 'Messages sent!' : 'Something went wrong' }}</p>
                  <p class="em-result-msg">{{ sendResult.message }}</p>
                </div>
                <button class="em-result-dismiss" @click="sendResult = null">Dismiss</button>
              </div>

              <div class="em-drawer-body">

                <!-- Campaign -->
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Campaign</p>
                  <div class="em-camp-grid">
                    <button v-for="c in KNOWN_CAMPAIGNS" :key="c.id"
                      class="em-camp-card" :class="{ 'em-camp-card--active': sendCampaign === c.id }"
                      @click="onCampaignChange(c.id)">
                      <span class="em-camp-card-icon" v-html="c.icon" />
                      <span class="em-camp-card-label">{{ c.label }}</span>
                    </button>
                  </div>
                </div>

                <!-- Channel -->
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Channel</p>
                  <div class="em-send-ch-toggle">
                    <button class="em-send-ch-btn"
                      :class="{ 'em-send-ch-btn--wsp': sendChannel === 'whatsapp' }"
                      @click="onChannelChange('whatsapp')">
                      <svg width="14" height="14" viewBox="0 0 448 512"
                        :fill="sendChannel === 'whatsapp' ? '#fff' : '#128C7E'">
                        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button class="em-send-ch-btn"
                      :class="{ 'em-send-ch-btn--sms': sendChannel === 'sms' }"
                      @click="onChannelChange('sms')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        :stroke="sendChannel === 'sms' ? '#fff' : '#5856D6'"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      SMS
                    </button>
                  </div>
                </div>

                <!-- Recipients -->
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Recipients</p>
                  <div class="em-recip-toggle">
                    <button class="em-recip-btn" :class="{ 'em-recip-btn--active': sendRecipMode === 'unsent' }"
                      @click="sendRecipMode = 'unsent'">
                      Unsent only
                      <span class="em-recip-cnt">{{ unsentCount }}</span>
                    </button>
                    <button class="em-recip-btn" :class="{ 'em-recip-btn--active': sendRecipMode === 'all' }"
                      @click="sendRecipMode = 'all'">
                      All attendees
                      <span class="em-recip-cnt">{{ attendees.length }}</span>
                    </button>
                  </div>
                  <p class="em-recip-hint">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8A8580" stroke-width="2" stroke-linecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {{ sendRecipCount }} recipient{{ sendRecipCount !== 1 ? 's' : '' }} will receive this message
                  </p>
                </div>

                <!-- Template -->
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">
                    Template
                    <span v-if="loadingTemplates" class="em-tpl-loading">
                      <svg class="em-spin" width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Loading…
                    </span>
                  </p>
                  <div v-if="!loadingTemplates && !templates.length" class="em-tpl-empty">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B5B0A8" stroke-width="1.8" stroke-linecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    No templates found for this campaign + channel.
                  </div>
                  <div v-else class="em-tpl-list">
                    <label v-for="tpl in templates" :key="tpl.id"
                      class="em-tpl-item" :class="{ 'em-tpl-item--active': selectedTemplate?.id === tpl.id }"
                      @click="selectedTemplate = tpl">
                      <div class="em-tpl-radio">
                        <div class="em-tpl-radio-dot" v-if="selectedTemplate?.id === tpl.id" />
                      </div>
                      <div class="em-tpl-body">
                        <p class="em-tpl-content">{{ tpl.content }}</p>
                        <p v-if="tpl.language" class="em-tpl-meta">{{ tpl.language.toUpperCase() }}</p>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              <div class="em-drawer-footer">
                <button class="em-drawer-cancel" @click="closeSendDrawer">Cancel</button>
                <button class="em-drawer-send" :disabled="!canSend || sending" @click="executeSend">
                  <template v-if="sending">
                    <svg class="em-spin" width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Sending…
                  </template>
                  <template v-else>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send to {{ sendRecipCount }}
                  </template>
                </button>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db, auth } from '../../firebase'
import { collection, query, orderBy, where, getDocs } from 'firebase/firestore'

const props = defineProps({ event: Object, eventId: String })
const route  = useRoute()
const eventId = computed(() => props.eventId ?? route.params.eventId)

const PAGE_SIZE = 15

const STATUS_LABELS = { unsent: 'Unsent', sent: 'Sent', delivered: 'Delivered', read: 'Read', failed: 'Failed' }
const STATUS_RANK   = { read: 5, delivered: 4, sent: 3, failed: 2, unsent: 1 }

// Only the 5 known campaigns — unknown / custom campaign IDs are never shown in the main view
const KNOWN_CAMPAIGN_IDS = new Set([
  'haflaway-invitation-campaign',
  'haflaway-invitation-reminder-campaign',
  'haflaway-contribution-campaign',
  'haflaway-save-the-date-campaign',
  'haflaway-gratitude-campaign',
  'haflaway-invitation-gratitude-campaign',
])

const CAMPAIGN_LABELS = {
  'haflaway-invitation-campaign':           'Invitation',
  'haflaway-invitation-reminder-campaign':  'Reminder',
  'haflaway-contribution-campaign':         'Contribution',
  'haflaway-save-the-date-campaign':        'Save the Date',
  'haflaway-gratitude-campaign':            'Gratitude',
  'haflaway-invitation-gratitude-campaign': 'Gratitude',
}

const CAMPAIGN_TEMPLATE_CATEGORIES = {
  'haflaway-invitation-campaign':           'whatsapp-wedding-invitations',
  'haflaway-invitation-reminder-campaign':  'haflaway-invitation-reminder-campaign',
  'haflaway-contribution-campaign':         'matrimony-contributions',
  'haflaway-save-the-date-campaign':        'whatsapp-wedding-save-the-date',
  'haflaway-gratitude-campaign':            'haflaway-gratitude-campaign',
  'haflaway-invitation-gratitude-campaign': 'haflaway-invitation-gratitude-campaign',
}

const CAMPAIGN_KARD_TYPE = {
  'haflaway-invitation-campaign':           'invitation',
  'haflaway-invitation-reminder-campaign':  'invitation',
  'haflaway-contribution-campaign':         'contribution',
  'haflaway-save-the-date-campaign':        'invitation',
  'haflaway-gratitude-campaign':            'invitation',
  'haflaway-invitation-gratitude-campaign': 'invitation',
}

const KNOWN_CAMPAIGNS = [
  {
    id: 'haflaway-invitation-campaign', label: 'Invitation',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 9l10 6 10-6"/></svg>`,
  },
  {
    id: 'haflaway-invitation-reminder-campaign', label: 'Reminder',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  },
  {
    id: 'haflaway-save-the-date-campaign', label: 'Save the Date',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  },
  {
    id: 'haflaway-contribution-campaign', label: 'Contribution',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  },
  {
    id: 'haflaway-gratitude-campaign', label: 'Gratitude',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  },
]

const WSP_URL = 'https://sendwhatsappinvitationmessages-frbu33fema-uc.a.run.app'
const SMS_URL = 'https://sendsmsaction-frbu33fema-uc.a.run.app'

// ── Table state ───────────────────────────────────────────────────────────────
const attendees    = ref([])
const loading      = ref(false)
const searchQ      = ref('')
const activeCampaign = ref('haflaway-invitation-campaign')
const currentPage    = ref(1)

// ── Send drawer state ─────────────────────────────────────────────────────────
const sendDrawerOpen   = ref(false)
const sendCampaign     = ref('haflaway-invitation-campaign')
const sendChannel      = ref('whatsapp')
const sendRecipMode    = ref('unsent')
const templates        = ref([])
const selectedTemplate = ref(null)
const loadingTemplates = ref(false)
const sending          = ref(false)
const sendResult       = ref(null)

// ── Firestore ─────────────────────────────────────────────────────────────────
async function load() {
  if (!eventId.value) return
  loading.value = true
  attendees.value = []
  try {
    const snap = await getDocs(
      query(collection(db, 'events', eventId.value, 'attendees'), orderBy('createdAt', 'desc'))
    )
    attendees.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Failed to load attendees', e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(eventId, () => { if (eventId.value) load() })

// ── Parse messageIndex entry ──────────────────────────────────────────────────
// Format: "channel_campaignId_status"  (campaignId uses hyphens, not underscores)
function parseIdx(idx) {
  const firstU = idx.indexOf('_')
  const lastU  = idx.lastIndexOf('_')
  if (firstU === -1 || firstU === lastU) return null
  return {
    channel:    idx.slice(0, firstU),
    campaignId: idx.slice(firstU + 1, lastU),
    status:     idx.slice(lastU + 1),
  }
}

// Get status for an attendee on a given channel.
// Uses activeCampaign if set, otherwise returns the best status across known campaigns only.
function getStatus(att, channel) {
  const indexes = att.messageIndexes ?? []
  if (!indexes.length) return null

  if (activeCampaign.value) {
    for (const idx of indexes) {
      const p = parseIdx(idx)
      if (p && p.channel === channel && p.campaignId === activeCampaign.value) return p.status
    }
    return null
  }

  // Best status across known campaigns only — ignore custom/unknown IDs
  let best = null
  for (const idx of indexes) {
    const p = parseIdx(idx)
    if (!p || p.channel !== channel || !KNOWN_CAMPAIGN_IDS.has(p.campaignId)) continue
    if (!best || (STATUS_RANK[p.status] ?? 0) > (STATUS_RANK[best] ?? 0)) best = p.status
  }
  return best
}

const wspStatus = (att) => getStatus(att, 'whatsapp')
const smsStatus = (att) => getStatus(att, 'sms')

// ── Campaign tabs — only known campaigns that actually have data ───────────────
const displayCampaigns = computed(() => {
  const seen = new Set()
  for (const att of attendees.value) {
    for (const idx of (att.messageIndexes ?? [])) {
      const p = parseIdx(idx)
      if (p && KNOWN_CAMPAIGN_IDS.has(p.campaignId)) seen.add(p.campaignId)
    }
  }
  // Return in fixed order matching KNOWN_CAMPAIGNS, deduplicate gratitude variants
  const result = []
  const addedLabels = new Set()
  for (const c of KNOWN_CAMPAIGNS) {
    const label = c.label
    // Handle both gratitude IDs pointing to the same label
    const hasData = seen.has(c.id) || (c.id === 'haflaway-gratitude-campaign' && seen.has('haflaway-invitation-gratitude-campaign'))
    if (hasData && !addedLabels.has(label)) {
      result.push(c)
      addedLabels.add(label)
    }
  }
  return result
})

// Auto-switch campaign tab if current has no data
watch(displayCampaigns, (camps) => {
  if (camps.length && !camps.find(c => c.id === activeCampaign.value)) {
    activeCampaign.value = camps[0].id
  }
})

// ── Filtering + pagination ────────────────────────────────────────────────────
const filteredList = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return attendees.value
  return attendees.value.filter(a =>
    (a.fullNameLower ?? a.fullName?.toLowerCase() ?? '').includes(q) ||
    (a.phone ?? '').includes(q)
  )
})

watch(searchQ, () => { currentPage.value = 1 })
watch(activeCampaign, () => { currentPage.value = 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / PAGE_SIZE)))
const pageList = computed(() => {
  const s = (currentPage.value - 1) * PAGE_SIZE
  return filteredList.value.slice(s, s + PAGE_SIZE)
})
const pageNumbers = computed(() => {
  const total = totalPages.value, cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (cur > 3) pages.push('…')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('…')
  if (total > 1) pages.push(total)
  return pages
})
function goPage(n) {
  if (n >= 1 && n <= totalPages.value) currentPage.value = n
}

// ── Stats — per-attendee, per-channel, no double counting ────────────────────
const statCards = computed(() => {
  const list = attendees.value
  const total = list.length
  const reached = (ch) => list.filter(a => ['delivered', 'read'].includes(getStatus(a, ch))).length
  const wspR = reached('whatsapp')
  const smsR = reached('sms')
  const wspRead = list.filter(a => getStatus(a, 'whatsapp') === 'read').length
  const confirmed = list.filter(a => a.attendanceStatus === 'Confirmed').length
  const pct = (n) => total ? Math.round(n / total * 100) : 0
  return [
    { label: 'Total',         n: total,    color: '#1C1A18', pct: null },
    { label: 'WA Reached',    n: wspR,     color: '#128C7E', pct: pct(wspR) },
    { label: 'WA Read',       n: wspRead,  color: '#0060A8', pct: pct(wspRead) },
    { label: 'SMS Reached',   n: smsR,     color: '#5856D6', pct: pct(smsR) },
    { label: 'RSVP Confirmed',n: confirmed,color: '#30D158', pct: pct(confirmed) },
  ]
})

// ── Send drawer ───────────────────────────────────────────────────────────────
function openSendDrawer() {
  sendDrawerOpen.value = true
  sendResult.value = null
  // Pre-fill campaign from active tab
  sendCampaign.value = activeCampaign.value ?? 'haflaway-invitation-campaign'
  loadSendTemplates()
}
function closeSendDrawer() { sendDrawerOpen.value = false }

function onCampaignChange(id) { sendCampaign.value = id; selectedTemplate.value = null; loadSendTemplates() }
function onChannelChange(ch)  { sendChannel.value = ch;  selectedTemplate.value = null; loadSendTemplates() }

async function loadSendTemplates() {
  if (!eventId.value) return
  loadingTemplates.value = true
  templates.value = []
  selectedTemplate.value = null
  try {
    if (sendChannel.value === 'whatsapp') {
      const category = CAMPAIGN_TEMPLATE_CATEGORIES[sendCampaign.value]
      const lang = props.event?.language ?? 'sw'
      const snap = await getDocs(
        query(collection(db, 'messageTemplates'), where('category', '==', category), where('language', '==', lang))
      )
      templates.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } else {
      const snap = await getDocs(collection(db, 'events', eventId.value, 'messageTemplates'))
      templates.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }
    if (templates.value.length === 1) selectedTemplate.value = templates.value[0]
  } catch (e) {
    console.error('Failed to load templates', e)
  } finally {
    loadingTemplates.value = false
  }
}

function getStatusForSend(att) {
  const indexes = att.messageIndexes ?? []
  const prefix = `${sendChannel.value}_${sendCampaign.value}_`
  const match = indexes.find(idx => idx.startsWith(prefix))
  return match ? match.split('_').pop() : null
}

const unsentCount = computed(() =>
  attendees.value.filter(a => { const s = getStatusForSend(a); return s === 'unsent' || s === null }).length
)
const sendRecipCount = computed(() =>
  sendRecipMode.value === 'unsent' ? unsentCount.value : attendees.value.length
)
const sendRecipIds = computed(() => {
  if (sendRecipMode.value === 'all') return attendees.value.map(a => a.id)
  return attendees.value.filter(a => { const s = getStatusForSend(a); return s === 'unsent' || s === null }).map(a => a.id)
})
const canSend = computed(() =>
  sendCampaign.value && sendChannel.value && selectedTemplate.value && sendRecipCount.value > 0 && !sending.value
)

async function executeSend() {
  if (!canSend.value) return
  sending.value = true
  sendResult.value = null
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    const token = await user.getIdToken()
    const url = sendChannel.value === 'whatsapp' ? WSP_URL : SMS_URL
    const body = sendChannel.value === 'whatsapp'
      ? { templateId: selectedTemplate.value.id, type: sendCampaign.value, eventId: eventId.value, attendeesIds: sendRecipIds.value, kardType: CAMPAIGN_KARD_TYPE[sendCampaign.value] }
      : { content: selectedTemplate.value.content,  type: sendCampaign.value, eventId: eventId.value, attendeesIds: sendRecipIds.value, kardType: CAMPAIGN_KARD_TYPE[sendCampaign.value] }

    const res  = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
    const data = await res.json()
    sendResult.value = { ok: data.status === true, message: data.message ?? (data.status ? 'Done.' : 'Request failed.') }
    if (data.status) await load()
  } catch (e) {
    sendResult.value = { ok: false, message: e.message }
  } finally {
    sending.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/).filter(Boolean)
  return p.length === 1 ? (p[0][0] ?? '?').toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
function nameHash(s) { let h = 0; for (let i = 0; i < (s?.length ?? 0); i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
function avatarBg(n) { return `hsl(${nameHash(n ?? '') % 360}, 50%, 88%)` }
function avatarFg(n) { return `hsl(${nameHash(n ?? '') % 360}, 50%, 30%)` }
function rsvpColor(s) { return { Confirmed: '#30D158', Declined: '#FF453A', Called: '#64D2FF', Unreachable: '#FF9F0A', 'Not Confirmed': '#8E8E93' }[s] ?? '#8E8E93' }
function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) }
</script>

<style scoped>
.em-root {
  display: flex; flex-direction: column; height: 100%;
  background: #F8F8F6;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Toolbar ── */
.em-toolbar {
  flex-shrink: 0;
  background: #FFFFFF;
  border-bottom: 0.8px solid #EBEBEA;
  padding: 12px 24px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  flex-wrap: wrap;
}
.em-toolbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; min-width: 0; }

.em-search-wrap { position: relative; display: flex; align-items: center; flex-shrink: 0; }
.em-search-icon { position: absolute; left: 10px; pointer-events: none; }
.em-search {
  height: 34px; padding: 0 30px 0 32px; border: 0.8px solid #E5E4E0; border-radius: 8px;
  font-size: 14px; color: #1C1A18; background: #FAFAF9; width: 200px; outline: none;
  transition: border-color 130ms;
}
.em-search:focus { border-color: #C9A84C; }
.em-search-clear { position: absolute; right: 8px; background: none; border: none; cursor: pointer; color: #B5B0A8; display: flex; align-items: center; padding: 0; }

/* Campaign tabs */
.em-camp-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.em-camp-tab {
  height: 30px; padding: 0 12px; border-radius: 8px;
  border: 0.8px solid transparent; background: transparent;
  font-size: 13px; font-weight: 500; color: #8A8580;
  cursor: pointer; transition: all 130ms; white-space: nowrap;
}
.em-camp-tab:hover { background: #F2F2F0; color: #1C1A18; }
.em-camp-tab--active { background: #FFF8EC; color: #C9A84C; border-color: rgba(201,168,76,0.3); font-weight: 600; }

.em-send-btn {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  height: 34px; padding: 0 16px; border-radius: 8px;
  background: #1C1A18; color: #FFFFFF; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: background 130ms;
}
.em-send-btn:hover { background: #C9A84C; }

/* ── Stats ── */
.em-stats { flex-shrink: 0; display: flex; background: #FFFFFF; border-bottom: 0.8px solid #EBEBEA; }
.em-stat {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 14px 8px; border-right: 0.8px solid #F2F2F0; min-width: 0;
}
.em-stat:last-child { border-right: none; }
.em-stat-n { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1; }
.em-stat-lbl { font-size: 10px; color: #8A8580; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; }
.em-stat-pct { font-size: 11px; color: #B5B0A8; margin-top: 2px; }

/* ── Table ── */
.em-table-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.em-table-scroll { flex: 1; overflow: auto; }
.em-table { width: 100%; border-collapse: collapse; }
.em-th {
  padding: 9px 16px; font-size: 11px; font-weight: 700; color: #8A8580;
  text-align: left; background: #FAFAF9; border-bottom: 0.8px solid #EBEBEA;
  white-space: nowrap; position: sticky; top: 0; z-index: 1; text-transform: uppercase; letter-spacing: 0.3px;
}
.em-ch-head { display: flex; align-items: center; gap: 5px; }
.em-tr { transition: background 120ms; }
.em-tr:hover { background: #FAFAF9; }
.em-tr--sk { pointer-events: none; }
.em-td { padding: 11px 16px; font-size: 14px; color: #1C1A18; border-bottom: 0.8px solid #F5F5F3; vertical-align: middle; }
.em-td--muted { color: #8A8580; font-size: 13px; }
.em-td-empty { padding: 0; border: none; }

.em-name-cell { display: flex; align-items: center; gap: 9px; }
.em-avatar {
  width: 32px; height: 32px; border-radius: 8px; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.em-name-text { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

/* Status badges */
.em-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;
}
.em-badge--null, .em-badge--undefined { background: transparent; color: #D0CEC9; }
.em-badge--unsent   { background: #F2F2F0; color: #8A8580; }
.em-badge--sent     { background: rgba(255,159,10,0.12); color: #B36800; }
.em-badge--delivered{ background: rgba(48,209,88,0.12);  color: #1D7A38; }
.em-badge--read     { background: rgba(0,122,255,0.10);  color: #0060A8; }
.em-badge--failed   { background: rgba(255,69,58,0.12);  color: #C41E1E; }

.em-rsvp-cell { display: flex; align-items: center; gap: 6px; }
.em-rsvp-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.em-rsvp-text { font-size: 13px; color: #6B6A68; }

/* Skeletons */
.em-sk-name  { display: flex; align-items: center; gap: 9px; }
.em-sk-circle{ width: 32px; height: 32px; border-radius: 8px; background: #EBEBEA; flex-shrink: 0; animation: em-pulse 1.4s ease-in-out infinite; }
.em-sk-bar   { height: 12px; border-radius: 6px; background: #EBEBEA; width: 90px; animation: em-pulse 1.4s ease-in-out infinite; }
.em-sk-bar--lg{ width: 130px; }
.em-sk-bar--sm{ width: 60px; }
@keyframes em-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Empty */
.em-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; text-align: center; }
.em-empty-icon { margin-bottom: 16px; }
.em-empty-title { font-size: 16px; font-weight: 700; color: #1C1A18; margin: 0 0 6px; }
.em-empty-sub   { font-size: 14px; color: #8A8580; margin: 0 0 16px; max-width: 300px; }
.em-empty-cta   { height: 34px; padding: 0 16px; border-radius: 8px; border: 0.8px solid #E5E4E0; background: #fff; font-size: 14px; font-weight: 500; color: #1C1A18; cursor: pointer; transition: background 130ms; }
.em-empty-cta:hover { background: #F2F2F0; }
.em-empty-cta--primary { background: #1C1A18; color: #fff; border-color: #1C1A18; }
.em-empty-cta--primary:hover { background: #C9A84C; border-color: #C9A84C; }

/* Pagination footer */
.em-table-footer { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: #fff; border-top: 0.8px solid #EBEBEA; }
.em-range-lbl   { font-size: 13px; color: #8A8580; }
.em-paginator   { display: flex; align-items: center; gap: 4px; }
.em-page-btn    { min-width: 32px; height: 32px; padding: 0 8px; border-radius: 8px; border: 0.8px solid #E5E4E0; background: #fff; font-size: 13px; font-weight: 500; color: #6B6A68; cursor: pointer; transition: all 130ms; display: flex; align-items: center; justify-content: center; }
.em-page-btn:hover:not(:disabled) { background: #F2F2F0; }
.em-page-btn:disabled { opacity: 0.4; cursor: default; }
.em-page-btn--active { background: #1C1A18; border-color: #1C1A18; color: #fff; }
.em-page-btn--nav { color: #8A8580; }
.em-page-ellipsis { font-size: 13px; color: #B5B0A8; padding: 0 4px; }

/* ── Send Drawer ── */
.em-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.28); z-index: 1000; display: flex; align-items: stretch; justify-content: flex-end; }
.em-drawer  { width: 400px; max-width: 95vw; height: 100%; background: #fff; display: flex; flex-direction: column; box-shadow: -8px 0 32px rgba(0,0,0,0.12); }

.em-drawer-header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 0.8px solid #EBEBEA; }
.em-drawer-header-left { display: flex; align-items: center; gap: 8px; }
.em-drawer-title { font-size: 16px; font-weight: 700; color: #1C1A18; }
.em-drawer-close { width: 28px; height: 28px; border-radius: 8px; background: #F2F2F0; border: none; cursor: pointer; color: #6B6A68; display: flex; align-items: center; justify-content: center; transition: background 130ms; }
.em-drawer-close:hover { background: #E5E4E0; }

.em-send-result { flex-shrink: 0; display: flex; align-items: flex-start; gap: 10px; padding: 12px 20px; font-size: 13px; }
.em-send-result--ok  { background: rgba(48,209,88,0.08);  color: #1D7A38; border-bottom: 0.8px solid rgba(48,209,88,0.2); }
.em-send-result--err { background: rgba(255,69,58,0.08);  color: #C41E1E; border-bottom: 0.8px solid rgba(255,69,58,0.2); }
.em-result-title { font-weight: 700; margin: 0 0 2px; }
.em-result-msg   { margin: 0; opacity: 0.8; }
.em-result-dismiss { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 12px; opacity: 0.7; color: inherit; flex-shrink: 0; }
.em-result-dismiss:hover { opacity: 1; }

.em-drawer-body { flex: 1; overflow-y: auto; padding: 0 20px 20px; }
.em-drawer-section { padding: 18px 0; border-bottom: 0.8px solid #F2F2F0; }
.em-drawer-section:last-child { border-bottom: none; }
.em-drawer-section-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #8A8580; text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 12px; }

.em-camp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.em-camp-card { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 0.8px solid #E5E4E0; background: #FAFAF9; font-size: 13px; font-weight: 500; color: #6B6A68; cursor: pointer; transition: all 130ms; text-align: left; }
.em-camp-card:hover { border-color: #C9A84C; color: #1C1A18; }
.em-camp-card--active { border-color: #C9A84C; background: #FFF8EC; color: #C9A84C; font-weight: 600; }
.em-camp-card-icon  { display: flex; align-items: center; flex-shrink: 0; }
.em-camp-card-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.em-send-ch-toggle { display: flex; gap: 8px; }
.em-send-ch-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; height: 40px; border-radius: 10px; border: 0.8px solid #E5E4E0; background: #FAFAF9; font-size: 14px; font-weight: 500; color: #6B6A68; cursor: pointer; transition: all 130ms; }
.em-send-ch-btn:hover { border-color: #C9A84C; }
.em-send-ch-btn--wsp { background: #128C7E; color: #fff; border-color: #128C7E; }
.em-send-ch-btn--sms { background: #5856D6; color: #fff; border-color: #5856D6; }

.em-recip-toggle { display: flex; gap: 8px; margin-bottom: 8px; }
.em-recip-btn { flex: 1; display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; border: 0.8px solid #E5E4E0; background: #FAFAF9; font-size: 13px; font-weight: 500; color: #6B6A68; cursor: pointer; transition: all 130ms; }
.em-recip-btn:hover { border-color: #C9A84C; }
.em-recip-btn--active { border-color: #C9A84C; background: #FFF8EC; color: #C9A84C; font-weight: 600; }
.em-recip-cnt { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 18px; padding: 0 5px; border-radius: 9px; background: rgba(201,168,76,0.15); color: #C9A84C; font-size: 11px; font-weight: 700; }
.em-recip-hint { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #8A8580; margin: 0; }

.em-tpl-loading { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #C9A84C; font-weight: 500; text-transform: none; letter-spacing: 0; }
.em-tpl-empty { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #8A8580; padding: 12px; border: 0.8px dashed #E5E4E0; border-radius: 10px; }
.em-tpl-list  { display: flex; flex-direction: column; gap: 8px; }
.em-tpl-item  { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-radius: 10px; border: 0.8px solid #E5E4E0; background: #FAFAF9; cursor: pointer; transition: all 130ms; }
.em-tpl-item:hover { border-color: #C9A84C; }
.em-tpl-item--active { border-color: #C9A84C; background: #FFF8EC; }
.em-tpl-radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #C9A84C; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; }
.em-tpl-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: #C9A84C; }
.em-tpl-body    { flex: 1; min-width: 0; }
.em-tpl-content { font-size: 13px; color: #1C1A18; margin: 0 0 4px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.em-tpl-meta    { font-size: 11px; color: #B5B0A8; margin: 0; }

.em-drawer-footer { flex-shrink: 0; display: flex; gap: 10px; padding: 14px 20px; border-top: 0.8px solid #EBEBEA; background: #fff; }
.em-drawer-cancel { flex: 1; height: 40px; border-radius: 10px; border: 0.8px solid #E5E4E0; background: #fff; font-size: 14px; font-weight: 500; color: #6B6A68; cursor: pointer; transition: background 130ms; }
.em-drawer-cancel:hover { background: #F2F2F0; }
.em-drawer-send { flex: 2; height: 40px; border-radius: 10px; background: #1C1A18; color: #fff; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background 130ms; }
.em-drawer-send:hover:not(:disabled) { background: #C9A84C; }
.em-drawer-send:disabled { opacity: 0.45; cursor: default; }

.em-spin { animation: em-rotate 0.8s linear infinite; }
@keyframes em-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.em-fade-enter-active, .em-fade-leave-active { transition: opacity 180ms; }
.em-fade-enter-from,  .em-fade-leave-to     { opacity: 0; }
.em-slide-right-enter-active, .em-slide-right-leave-active { transition: transform 220ms cubic-bezier(0.4,0,0.2,1); }
.em-slide-right-enter-from,  .em-slide-right-leave-to     { transform: translateX(100%); }
</style>
