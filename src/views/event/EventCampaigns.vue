<template>
  <div class="em-root">

    <!-- Deep-linked straight into the composer (?campaign=<id>&send=1, from the
         Guest List send flow). The composer is a teleported, opaque, full-screen
         overlay that is already open on the very first paint — so for as long as
         it owns the screen this page renders none of its own content, not even a
         spinner. The campaign detail view the user never asked to see therefore
         never gets a single frame: not while the campaigns fetch is in flight,
         not behind the drawer's enter transition, and not after a refresh (the
         send/returnTo params are kept in the URL rather than stripped). -->
    <template v-if="!composerOnly">

    <!-- ── Hub header: hamburger + brand badge + title — the sidebar/topbar
         are hidden on this page (see EventLayout's isHubRoute), so this
         hamburger is the only way back into them. Sticky so it stays put
         while the dashboard/campaign panels below it scroll, matching the
         withjoy-style treatment already used on Guest List. ── -->
    <div class="em-hub-hd">
      <div class="em-hd-main">
        <button class="em-hd-burger" title="Menu" @click="navDrawer.open()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div class="em-hd-brand" @click="$router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="em-hd-brand-logo" />
          <span v-else class="em-hd-brand-script">.joy</span>
        </div>

        <div class="em-hd-title-group">
          <h1 class="em-hub-title">{{ cardScope ? 'Invitations' : 'Messaging' }}</h1>
          <span class="em-hub-badge">{{ cardScope ? 'CARDS+' : 'MESSAGING+' }}</span>
        </div>
      </div>

      <!-- withjoy tabs directly in header — stay visible (and correctly
           highlighted) on the campaign detail page too, since that page is
           always reached from within one of these tabs; the breadcrumb +
           title for "which campaign" lives in the page body instead. -->
      <nav class="em-msg-tabs">
        <button class="em-msg-tab" :class="{ 'em-msg-tab--active': msgTab === 'create' }" @click="goToTab('create')">
          Create
        </button>
        <button class="em-msg-tab" :class="{ 'em-msg-tab--active': msgTab === 'drafts' }" @click="goToTab('drafts')">
          Drafts
          <span v-if="draftCampaigns.length" class="em-msg-tab-count">{{ draftCampaigns.length }}</span>
        </button>
        <button class="em-msg-tab" :class="{ 'em-msg-tab--active': msgTab === 'scheduled' }" @click="goToTab('scheduled')">
          Scheduled
        </button>
        <button class="em-msg-tab" :class="{ 'em-msg-tab--active': msgTab === 'sent' }" @click="goToTab('sent')">
          Sent
          <span v-if="sentCampaignGroups.length" class="em-msg-tab-count">{{ sentCampaignGroups.length }}</span>
        </button>
      </nav>

      <!-- Ported from EventMessages.vue (the screen this route used to point
           to) — the only place that could generate/rotate the public
           "undelivered cards" report link (events/{id}.invitationsReportToken).
           /invitations-report/:eventId/:token itself was never touched and
           keeps working for already-issued links; this is what lets one exist
           to issue in the first place. Card-scope only — it's specifically
           about card delivery, not general messaging. -->
      <div v-if="cardScope" class="em-hub-hd-right">
        <div class="em-report-wrap" v-click-outside="() => reportPopoverOpen = false">
          <button class="em-report-btn" :class="{ 'em-report-btn--active': reportToken }"
            title="Share an undelivered-invitations report with your client" @click="reportPopoverOpen = !reportPopoverOpen">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 1 0 .09 4.26L8.91 11.4a3 3 0 1 0 0 1.2l6.18 3.14A3 3 0 1 0 18 8z"/></svg>
            <span class="em-report-label">Share report</span>
          </button>
          <div v-if="reportPopoverOpen" class="em-report-pop">
            <p class="em-report-pop-label">Public link for guests whose card wasn't delivered</p>
            <template v-if="reportUrl">
              <div class="em-report-url">{{ reportUrl }}</div>
              <div class="em-report-pop-acts">
                <button class="em-report-regen" @click="regenerateReportLink">Regenerate</button>
                <button class="em-report-copy" @click="copyReportLink">{{ reportLinkCopied ? 'Copied!' : 'Copy link' }}</button>
              </div>
            </template>
            <template v-else>
              <p class="em-report-pop-hint">Anyone with this link can see the undelivered list and fix wrong numbers — no login needed.</p>
              <button class="em-report-copy" @click="generateReportLink">Generate link</button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         CAMPAIGN LIST (no campaign selected)
         ══════════════════════════════════════════════ -->
    <template v-if="!selectedCustomCamp">

      <div class="em-msg-dash">

        <!-- Create Tab: Withjoy 4 hero tiles + Scheduled preview + Sent preview -->
        <template v-if="msgTab === 'create'">
          <div class="em-msg-section">
            <h2 class="em-sec-title">{{ cardScope ? 'Cards' : 'Messages' }}</h2>
            <div class="em-msg-tiles">
              <template v-if="cardScope">
                <button v-for="tile in CARD_TILES" :key="tile.purpose" class="em-msg-tile"
                  :disabled="checkingCardTile !== null" @click="selectCardTile(tile)">
                  <div class="em-msg-tile-box">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" :stroke="tile.color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" v-html="tile.icon"/>
                  </div>
                  <span class="em-msg-tile-label">{{ tile.label }}</span>
                </button>
              </template>

              <template v-else>
                <!-- Tile 1: General Message (Email message) -->
                <button class="em-msg-tile" :disabled="creatingPresetCamp" @click="createPresetCampaign('General Message')">
                  <div class="em-msg-tile-box">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2.5"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </div>
                  <span class="em-msg-tile-label">General Message</span>
                </button>

                <!-- Tile 2: RSVP Reminder (RSVP message) -->
                <button class="em-msg-tile" :disabled="creatingPresetCamp" @click="createPresetCampaign('RSVP Reminder')">
                  <div class="em-msg-tile-box">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d946ef" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 13V6a2.5 2.5 0 0 0-2.5-2.5H4.5A2.5 2.5 0 0 0 2 6v12a2.5 2.5 0 0 0 2.5 2.5h8"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      <path d="m16 19 2 2 4-4"/>
                    </svg>
                  </div>
                  <span class="em-msg-tile-label">RSVP Reminder</span>
                </button>

                <!-- Tile 3: Pledge Reminder (Collect contacts / pledge) -->
                <button class="em-msg-tile" :disabled="creatingPresetCamp" @click="createPresetCampaign('Pledge Reminder')">
                  <div class="em-msg-tile-box">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="3"/>
                      <circle cx="12" cy="10" r="3.5"/>
                      <path d="M7 18c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
                      <line x1="2" y1="6" x2="4" y2="6" stroke-linecap="round"/>
                      <line x1="2" y1="12" x2="4" y2="12" stroke-linecap="round"/>
                      <line x1="2" y1="18" x2="4" y2="18" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <span class="em-msg-tile-label">Pledge Reminder</span>
                </button>

                <!-- Tile 4: Meeting Reminder (Schedule / hotel) -->
                <button class="em-msg-tile" :disabled="creatingPresetCamp" @click="createPresetCampaign('Meeting Reminder')">
                  <div class="em-msg-tile-box">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="3"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                      <circle cx="12" cy="15" r="3"/>
                      <polyline points="12 13.5 12 15 13.5 15"/>
                    </svg>
                  </div>
                  <span class="em-msg-tile-label">Meeting Reminder</span>
                </button>
              </template>
            </div>
          </div>

          <!-- Bottom 2 columns: Scheduled & Sent -->
          <div class="em-msg-row">
            <!-- Scheduled column -->
            <div class="em-sub-col">
              <div class="em-sub-card">
                <div class="em-sub-card-hd">
                  <h3 class="em-sub-title">Scheduled</h3>
                </div>
                <div class="em-sub-card-body em-sub-card-body--center">
                  <div class="em-empty-cal-icon">
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="3"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                      <circle cx="12" cy="15" r="2.5"/>
                      <polyline points="12 13.5 12 15 13 15"/>
                    </svg>
                  </div>
                  <p class="em-empty-text">{{ cardScope ? 'No scheduled sends' : 'No scheduled messages' }}</p>
                  <button class="em-new-pill-btn" @click="cardScope ? (msgTab = 'create') : createPresetCampaign('General Message')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>New</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Sent column -->
            <div class="em-sub-col">
              <div class="em-sub-card">
                <div class="em-sub-card-hd">
                  <div class="em-sub-hd-title-group">
                    <h3 class="em-sub-title">Sent</h3>
                    <span v-if="sentCampaignGroups.length" class="em-pill-count">{{ sentCampaignGroups.length }}</span>
                  </div>
                  <button v-if="sentCampaignGroups.length > 4" class="em-view-all-btn" @click="msgTab = 'sent'">View All</button>
                </div>
                <div class="em-sub-card-body">
                  <div v-if="loadingCustomCamps" class="em-msg-loading"><p>Loading…</p></div>
                  <div v-else-if="!sentCampaignGroups.length" class="em-sub-card-body--center" style="min-height: 180px;">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2.5"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    <p class="em-empty-text">{{ cardScope ? 'No cards sent yet' : 'No messages sent yet' }}</p>
                  </div>
                  <div v-else class="em-sent-list">
                    <div v-for="camp in sentCampaignGroups.slice(0, 4)" :key="camp.id" class="em-sent-item" @click="selectCustomCamp(camp)">
                      <div class="em-sent-mail-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2.5"/>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                      </div>
                      <span class="em-sent-item-title">{{ camp.name }}</span>
                      <span class="em-sent-item-avatar" :style="{ background: avatarBg(camp.name), color: avatarFg(camp.name) }">
                        {{ initials(camp.name) }}
                      </span>
                      <span class="em-sent-item-date">{{ formatDate(camp.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Drafts Tab -->
        <div class="em-sub-col" v-if="msgTab === 'drafts'">
          <div class="em-sub-card">
            <div class="em-sub-card-hd">
              <div class="em-sub-hd-title-group">
                <h3 class="em-sub-title">Drafts</h3>
                <span v-if="draftCampaigns.length" class="em-pill-count">{{ draftCampaigns.length }}</span>
              </div>
            </div>
            <div class="em-sub-card-body">
              <div v-if="loadingCustomCamps" class="em-msg-loading"><p>Loading…</p></div>
              <div v-else-if="!draftCampaigns.length" class="em-sub-card-body--center" style="min-height: 200px;">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <p class="em-empty-text">No drafts yet</p>
              </div>
              <div v-else class="em-sent-list">
                <div v-for="camp in draftCampaigns" :key="camp.id" class="em-sent-item" @click="selectCustomCamp(camp)">
                  <div class="em-sent-mail-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </div>
                  <span class="em-sent-item-title">{{ camp.name }}</span>
                  <span class="em-sent-item-avatar" :style="{ background: avatarBg(camp.name), color: avatarFg(camp.name) }">
                    {{ initials(camp.name) }}
                  </span>
                  <span class="em-sent-item-date">{{ formatDate(camp.createdAt) }}</span>
                  <div class="em-msg-sent-acts" @click.stop>
                    <button class="em-camp-item-btn" @click="openCampDialog(camp)" title="Edit">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="em-camp-item-btn em-camp-item-btn--del" @click="deleteCustomCampaign(camp)" title="Delete">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scheduled Tab -->
        <div class="em-sub-col" v-if="msgTab === 'scheduled'">
          <div class="em-sub-card">
            <div class="em-sub-card-hd">
              <div class="em-sub-hd-title-group">
                <h3 class="em-sub-title">Scheduled</h3>
              </div>
            </div>
            <div class="em-sub-card-body em-sub-card-body--center" style="min-height: 240px;">
              <div class="em-empty-cal-icon">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <circle cx="12" cy="15" r="2.5"/>
                  <polyline points="12 13.5 12 15 13 15"/>
                </svg>
              </div>
              <p class="em-empty-text">{{ cardScope ? 'No scheduled sends' : 'No scheduled messages' }}</p>
              <button class="em-new-pill-btn" @click="cardScope ? (msgTab = 'create') : createPresetCampaign('General Message')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>New</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Sent Tab (withjoy-style full table: subject, type, recipients, date, sent/failed counts) -->
        <div class="em-sent-page" v-if="msgTab === 'sent'">
          <div class="em-sent-toolbar">
            <div class="em-sent-search-wrap">
              <input v-model="sentSearchQ" class="em-sent-search" placeholder="Search messages…" />
              <button v-if="sentSearchQ" class="em-sent-search-clear" @click="sentSearchQ = ''">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <svg class="em-sent-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div class="em-sent-type-dd">
              <button ref="sentTypeDdTriggerRef" class="em-sent-type-trigger" :class="{ 'em-sent-type-trigger--on': sentTypeFilter }" @click="sentTypeDropOpen = !sentTypeDropOpen">
                <svg class="em-sent-tune-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="9"/>
                  <line x1="7" y1="9.5" x2="17" y2="9.5"/>
                  <line x1="7" y1="14.5" x2="17" y2="14.5"/>
                  <circle cx="10" cy="9.5" r="1.5" fill="currentColor"/>
                  <circle cx="14" cy="14.5" r="1.5" fill="currentColor"/>
                </svg>
                <span>{{ sentTypeFilter ?? 'Type' }}</span>
              </button>
              <div v-if="sentTypeDropOpen" ref="sentTypeDdMenuRef" class="em-sent-type-menu">
                <button class="em-sent-type-item" :class="{ 'em-sent-type-item--on': !sentTypeFilter }" @click="sentTypeFilter = null; sentTypeDropOpen = false">All types</button>
                <button v-for="opt in SENT_TYPE_OPTIONS" :key="opt" class="em-sent-type-item" :class="{ 'em-sent-type-item--on': sentTypeFilter === opt }" @click="sentTypeFilter = opt; sentTypeDropOpen = false">{{ opt }}</button>
              </div>
            </div>
            <button class="em-sent-new-btn" @click="msgTab = 'create'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span>New…</span>
            </button>
          </div>

          <div v-if="loadingCustomCamps" class="em-msg-loading"><p>Loading…</p></div>
          <div v-else-if="!sentCampaignGroups.length" class="em-sub-card-body--center em-sent-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2.5"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <p class="em-empty-text">{{ cardScope ? 'No cards sent yet' : 'No messages sent yet' }}</p>
          </div>
          <div v-else-if="!sentTableRows.length" class="em-sub-card-body--center em-sent-empty">
            <p class="em-empty-text">No messages match your search or filter.</p>
          </div>
          <div v-else class="em-sent-table">
            <div class="em-sent-tbl-hd">
              <span class="em-sent-col em-sent-col--subject">Subject</span>
              <span class="em-sent-col em-sent-col--type">Message Type</span>
              <span class="em-sent-col em-sent-col--recip">Recipients</span>
              <span class="em-sent-col em-sent-col--date">Date Sent</span>
              <span class="em-sent-col em-sent-col--sent">Sent</span>
              <span class="em-sent-col em-sent-col--failed">Failed</span>
              <span class="em-sent-col em-sent-col--chev"></span>
            </div>
            <button v-for="camp in sentTableRows" :key="camp.id" class="em-sent-tbl-row" @click="selectCustomCamp(camp)">
              <span class="em-sent-col em-sent-col--subject em-sent-subject" :title="camp.name">{{ camp.name }}</span>
              <span class="em-sent-col em-sent-col--type" data-label="Message Type">
                <span class="em-sent-type-badge">
                  <span class="em-sent-type-icon" v-html="messageTypeMeta(camp).icon"/>
                  <span class="em-sent-type-label">{{ messageTypeMeta(camp).label }}</span>
                </span>
              </span>
              <span class="em-sent-col em-sent-col--recip" data-label="Recipients">
                <span v-if="campaignStatsMap[camp.id]?.recipients.length" class="em-recip-stack">
                  <span v-for="att in campaignStatsMap[camp.id].recipients.slice(0, 3)" :key="att.id"
                    class="em-recip-avatar" :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }"
                    :title="att.fullName">{{ initials(att.fullName) }}</span>
                  <span v-if="campaignStatsMap[camp.id].recipients.length > 3" class="em-recip-more">+{{ campaignStatsMap[camp.id].recipients.length - 3 }}</span>
                </span>
                <span v-else class="em-recip-none">—</span>
              </span>
              <span class="em-sent-col em-sent-col--date" data-label="Date Sent">{{ formatDate(camp.createdAt) }}</span>
              <span class="em-sent-col em-sent-col--sent em-sent-num--ok" data-label="Sent">{{ campaignStatsMap[camp.id]?.sent ?? 0 }}</span>
              <span class="em-sent-col em-sent-col--failed" data-label="Failed" :class="{ 'em-sent-num--bad': (campaignStatsMap[camp.id]?.failed ?? 0) > 0 }">{{ campaignStatsMap[camp.id]?.failed ?? 0 }}</span>
              <span class="em-sent-col em-sent-col--chev">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </button>
          </div>
        </div>

      </div>
    </template>

    <!-- ══════════════════════════════════════════════
         CAMPAIGN DETAIL (campaign selected)
         ══════════════════════════════════════════════ -->
    <template v-else>

      <div class="em-detail-page">

        <!-- Breadcrumb -->
        <div class="em-detail-crumbs">
          <button class="em-crumb-link" @click="backToCampaignList">{{ cardScope ? 'Invitations' : 'Messaging' }}</button>
          <span class="em-crumb-sep">/</span>
          <span class="em-crumb-current">{{ MSG_TAB_LABELS[msgTab] ?? 'Sent' }}</span>
        </div>

        <!-- Heading -->
        <div class="em-detail-heading">
          <div class="em-detail-heading-main">
            <span class="em-detail-type-badge" :style="{ color: messageTypeMeta(selectedCustomCamp).color }">
              <span class="em-detail-type-icon" v-html="messageTypeMeta(selectedCustomCamp).icon"/>
              {{ messageTypeMeta(selectedCustomCamp).label }}
            </span>
            <h1 class="em-detail-title">{{ selectedCustomCamp.name }}</h1>
          </div>
          <div class="em-detail-heading-acts">
            <button class="em-edit-camp-btn" title="Edit campaign" @click="openCampDialog(selectedCustomCamp)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Templates
            </button>
            <button class="em-send-btn" @click="openCustomSend">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send
            </button>
          </div>
        </div>

        <!-- Stat cards -->
        <div class="em-detail-stats">
          <div class="em-detail-stat-card">
            <div class="em-detail-stat-top">
              <span class="em-detail-stat-val">{{ detailDispatchedCount }}</span>
              <span class="em-detail-stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </span>
            </div>
            <span class="em-detail-stat-lbl">Sent</span>
          </div>
          <div class="em-detail-stat-card em-detail-stat-card--ok">
            <div class="em-detail-stat-top">
              <span class="em-detail-stat-val">{{ customStatusCounts.delivered }}</span>
              <span class="em-detail-stat-icon em-detail-stat-icon--ok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            </div>
            <span class="em-detail-stat-lbl">Delivered</span>
          </div>
          <div v-if="detailChannel === 'whatsapp'" class="em-detail-stat-card">
            <div class="em-detail-stat-top">
              <span class="em-detail-stat-val">{{ customStatusCounts.read }}</span>
              <span class="em-detail-stat-icon em-detail-stat-icon--read">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 6 7 17 2 12"/><polyline points="23 6 12 17 10.5 15.5"/></svg>
              </span>
            </div>
            <span class="em-detail-stat-lbl">Read</span>
          </div>
          <div class="em-detail-stat-card">
            <div class="em-detail-stat-top">
              <span class="em-detail-stat-val">{{ customStatusCounts.failed }}</span>
              <span class="em-detail-stat-icon em-detail-stat-icon--bad">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </span>
            </div>
            <span class="em-detail-stat-lbl">Failed</span>
          </div>
        </div>


        <!-- Toolbar: search + filter -->
        <div class="em-detail-toolbar">
          <div class="em-detail-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="detailSearchQ" class="em-detail-search" placeholder="Search recipients…" />
            <button v-if="detailSearchQ" class="em-sent-search-clear" @click="detailSearchQ = ''">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="em-detail-filter-dd">
            <button ref="detailFilterTriggerRef" class="em-detail-filter-trigger" :class="{ 'em-detail-filter-trigger--on': detailActiveFilterCount > 0 }" @click="detailFilterPopoverOpen = !detailFilterPopoverOpen">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filter
              <span v-if="detailActiveFilterCount" class="em-detail-filter-count">{{ detailActiveFilterCount }}</span>
            </button>
            <div v-if="detailFilterPopoverOpen" ref="detailFilterMenuRef" class="em-detail-filter-menu">
              <div class="em-detail-filter-menu-group">
                <span class="em-detail-filter-menu-lbl">Channel</span>
                <div class="em-detail-ch-toggle">
                  <button class="em-detail-ch-pill" :class="{ 'em-detail-ch-pill--on': detailChannel === 'whatsapp' }" @click="detailChannel = 'whatsapp'">WhatsApp</button>
                  <button class="em-detail-ch-pill" :class="{ 'em-detail-ch-pill--on': detailChannel === 'sms' }" @click="detailChannel = 'sms'">SMS</button>
                </div>
              </div>
              <div class="em-detail-filter-menu-group">
                <span class="em-detail-filter-menu-lbl">Status</span>
                <div class="em-detail-filter-opts">
                  <button v-for="opt in STATUS_OPTIONS" :key="opt.v" class="em-detail-filter-opt" :class="{ 'em-detail-filter-opt--on': customStatus === opt.v }" @click="customStatus = opt.v">
                    <span class="em-stat-dd-dot" :style="{ background: DRAWER_STATUS_COLORS[opt.v]?.fg ?? '#555' }"/>
                    <span class="em-detail-filter-opt-lbl">{{ opt.l }}</span>
                    <span class="em-detail-filter-opt-n">{{ customStatusCounts[opt.v] ?? 0 }}</span>
                  </button>
                </div>
              </div>
              <div class="em-detail-filter-menu-group" v-if="props.event?.labels?.length">
                <span class="em-detail-filter-menu-lbl">List</span>
                <select v-model="customLabelId" class="em-detail-list-select">
                  <option :value="null">All Lists</option>
                  <option v-for="lbl in props.event.labels" :key="lbl.id" :value="lbl.id">{{ lbl.name }}</option>
                </select>
              </div>
              <button v-if="detailActiveFilterCount" class="em-detail-filter-clear" @click="customStatus = 'all'; customLabelId = null">Clear filters</button>
            </div>
          </div>
        </div>

        <!-- Recipients table -->
        <div class="em-detail-table-wrap">
          <!-- Skeleton -->
          <div v-if="loading && !attendees.length" class="em-detail-table">
            <div v-for="n in 6" :key="`csk-${n}`" class="em-detail-tbl-row em-detail-tbl-row--sk">
              <div class="em-sk-circle" style="width:30px;height:30px;border-radius:50%;flex-shrink:0"/>
              <div style="flex:1"><div class="em-sk-bar em-sk-bar--lg"/></div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else-if="!customFilteredAttendees.length" class="em-empty-state em-empty-state--sm">
            <p class="em-empty-title">No recipients match these filters</p>
            <p class="em-empty-sub">Try a different search, status, or list filter.</p>
          </div>

          <!-- Table -->
          <div v-else class="em-detail-table">
            <div class="em-detail-tbl-hd">
              <span class="em-detail-col em-detail-col--name">Recipient Name</span>
              <span class="em-detail-col em-detail-col--delivery">Delivery</span>
              <span class="em-detail-col em-detail-col--status">Status</span>
              <span class="em-detail-col em-detail-col--details">Details</span>
            </div>
            <div v-for="att in pagedDetailAttendees" :key="att.id" class="em-detail-tbl-row">
              <span class="em-detail-col em-detail-col--name">
                <span class="em-detail-avatar" :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }">{{ initials(att.fullName) }}</span>
                <span class="em-detail-name">{{ att.fullName }}</span>
              </span>
              <span class="em-detail-col em-detail-col--delivery">
                <svg v-if="detailChannel === 'whatsapp'" width="13" height="13" viewBox="0 0 448 512" fill="#128C7E"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5856D6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {{ att.phone || '—' }}
              </span>
              <span class="em-detail-col em-detail-col--status">
                <span class="em-detail-status-pill" :class="`em-detail-status-pill--${getCustomStatus(att) ?? 'unsent'}`">
                  <span class="em-detail-status-dot"/>
                  {{ STATUS_LABELS[getCustomStatus(att)] ?? 'Unsent' }}
                </span>
              </span>
              <span class="em-detail-col em-detail-col--details">
                <span class="em-detail-date">{{ formatDate(att.createdAt) }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="em-detail-footer" v-if="customFilteredAttendees.length">
          <span class="em-range-lbl">
            {{ customFilteredAttendees.length === 0 ? '0' : (detailPage - 1) * DETAIL_PAGE_SIZE + 1 }}–{{ Math.min(detailPage * DETAIL_PAGE_SIZE, customFilteredAttendees.length) }}
            of {{ customFilteredAttendees.length }}
          </span>
          <div class="em-paginator" :class="{ 'em-paginator--disabled': detailTotalPages <= 1 }">
            <button class="em-page-btn em-page-btn--nav" :disabled="detailPage === 1 || detailTotalPages <= 1" @click="detailGoPage(detailPage - 1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <template v-for="p in detailPageNumbers" :key="String(p)">
              <span v-if="p === '…'" class="em-page-ellipsis">…</span>
              <button v-else class="em-page-btn" :class="{ 'em-page-btn--active': detailPage === p }" :disabled="detailTotalPages <= 1" @click="detailGoPage(p)">{{ p }}</button>
            </template>
            <button class="em-page-btn em-page-btn--nav" :disabled="detailPage === detailTotalPages || detailTotalPages <= 1" @click="detailGoPage(detailPage + 1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

    </template>
    </template>

    <!-- ══════════════════════════════════════════════
         SEND DRAWER
         ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="em-fade">
        <div v-if="sendDrawerOpen" class="em-overlay" @click.self="closeSendDrawer">
          <Transition name="em-slide-right">
            <div v-if="sendDrawerOpen" class="em-drawer em-drawer--composer">

              <div class="em-drawer-header">
                <div class="em-drawer-header-left">
                  <button class="em-drawer-burger" title="Menu" @click="navDrawer.open()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                  </button>
                  <span class="em-drawer-icon-badge">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </span>
                  <h2 class="em-drawer-title">Send {{ selectedCustomCamp?.name || 'Campaign' }} via {{ sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS' }}</h2>
                </div>
                <button class="em-drawer-close" @click="closeSendDrawer" title="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div class="em-drawer-body">
                <!-- Deep-linked open before the campaigns fetch has landed — the
                     form would otherwise render a nameless campaign and warn that
                     no message is set, which is just the load not having finished. -->
                <div v-if="!selectedCustomCamp" class="em-composer-loading">
                  <svg class="em-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                </div>
                <div v-else class="em-drawer-grid">
                <div class="em-send-form">
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Campaign</p>
                  <div class="em-custom-camp-display">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: var(--cx-muted); flex-shrink: 0;" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {{ selectedCustomCamp?.name }}
                    <span class="em-custom-camp-type">{{ campaignTypeLabel(selectedCustomCamp?.type) }}</span>
                  </div>
                </div>

                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Channel</p>
                  <div class="em-send-ch-toggle">
                    <button class="em-send-ch-btn" :class="{ 'em-send-ch-btn--wsp': sendChannel === 'whatsapp' }" :style="sendChannel === 'whatsapp' ? ACTIVE_CH_STYLE : null" @click="onChannelChange('whatsapp')">
                      <svg width="14" height="14" viewBox="0 0 448 512" fill="#128C7E"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                      WhatsApp
                    </button>
                    <button class="em-send-ch-btn" :class="{ 'em-send-ch-btn--sms': sendChannel === 'sms' }" :style="sendChannel === 'sms' ? ACTIVE_CH_STYLE : null" @click="onChannelChange('sms')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5856D6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      SMS
                    </button>
                  </div>
                </div>

                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">To</p>
                  <button type="button" class="em-to-btn" :class="{ 'em-to-btn--filled': sendRecipCount }" @click="openRecipModal">
                    {{ sendRecipCount ? `${sendRecipCount} recipient${sendRecipCount === 1 ? '' : 's'}` : 'Select Recipients' }}
                  </button>
                </div>

                <div v-if="selectedCustomCamp?.cardPurpose" class="em-drawer-section">
                  <p class="em-drawer-section-label">Card</p>
                  <div class="em-tpl-item em-tpl-item--active" style="cursor: default">
                    <div class="em-tpl-body">
                      <p class="em-tpl-content">
                        Each recipient gets their own card, rendered fresh from the
                        {{ selectedCustomCamp.name }} template at send time — no message to write here.
                      </p>
                    </div>
                  </div>

                  <div v-if="sendRunId" class="em-send-run">
                    <p class="em-send-run-title">
                      <svg v-if="!sendRun?.finishedAt" class="em-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {{ sendRun?.finishedAt ? 'Done' : 'Sending…' }}
                      {{ (sendRun?.counts?.sent ?? 0) + (sendRun?.counts?.renderFailed ?? 0) + (sendRun?.counts?.sendFailed ?? 0) }} / {{ sendRun?.total ?? '…' }}
                    </p>
                    <div class="em-send-run-counts">
                      <span class="em-send-run-count em-send-run-count--ok">{{ sendRun?.counts?.sent ?? 0 }} sent</span>
                      <span v-if="sendRun?.counts?.renderFailed" class="em-send-run-count em-send-run-count--err">{{ sendRun.counts.renderFailed }} render failed</span>
                      <span v-if="sendRun?.counts?.sendFailed" class="em-send-run-count em-send-run-count--err">{{ sendRun.counts.sendFailed }} send failed</span>
                    </div>
                    <div v-if="sendRun?.results" class="em-send-run-log">
                      <div v-for="(r, attId) in sendRun.results" :key="attId" class="em-send-run-row" :class="`em-send-run-row--${r.status}`">
                        <span class="em-send-run-row-name">{{ recipientsById[attId]?.fullName ?? attId }}</span>
                        <span class="em-send-run-row-status">{{ SEND_RUN_STATUS_LABELS[r.status] ?? r.status }}<template v-if="r.error"> — {{ r.error }}</template></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="em-drawer-section">
                  <p class="em-drawer-section-label">
                    {{ sendChannel === 'whatsapp' ? 'Template' : 'Message' }}
                    <span v-if="sendChannel === 'whatsapp' && loadingTemplates" class="em-tpl-loading">
                      <svg class="em-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Loading…
                    </span>
                    <button class="em-browse-tpl-btn" @click="openCampDialog(selectedCustomCamp, sendChannel)">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit message
                    </button>
                  </p>

                  <template v-if="sendChannel === 'whatsapp'">
                    <div v-if="selectedCustomCamp?.kind !== 'card' && !selectedCustomCamp?.whatsappMessage" class="em-msg-missing-warn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>No WhatsApp Custom Message set for this campaign — the template's placeholder will be blank. <button class="em-msg-missing-warn-btn" @click="openCampDialog(selectedCustomCamp, 'whatsapp')">Set it now</button> before sending.</span>
                    </div>
                    <div v-if="!loadingTemplates && !templates.length" class="em-tpl-empty">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B5B5BB" stroke-width="1.8" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span v-if="selectedCustomCamp?.kind === 'card'">No approved WhatsApp template found for {{ campaignTypeLabel(selectedCustomCamp.type) }} ({{ (props.event?.language ?? 'sw').toUpperCase() }}) yet — create one in Message Templates under that category.</span>
                      <span v-else>No general-campaign WhatsApp templates registered yet.</span>
                    </div>
                    <div v-else class="em-tpl-list">
                      <div v-for="tpl in templates" :key="tpl.id"
                        class="em-tpl-item"
                        :class="{ 'em-tpl-item--active': selectedTemplate?.id === tpl.id, 'em-tpl-item--own': tpl.own }"
                        @click="selectedTemplate = tpl">
                        <div class="em-tpl-radio">
                          <div class="em-tpl-radio-dot" v-if="selectedTemplate?.id === tpl.id" />
                        </div>
                        <div class="em-tpl-body">
                          <p class="em-tpl-content">{{ tpl.content }}</p>
                          <p v-if="tpl.own" class="em-tpl-meta em-tpl-meta--own">YOUR TWILIO</p>
                          <p v-else-if="tpl.language" class="em-tpl-meta">{{ tpl.language.toUpperCase() }}</p>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div v-if="selectedCustomCamp?.smsMessage" class="em-tpl-item em-tpl-item--active" style="cursor: default">
                      <div class="em-tpl-body">
                        <p class="em-tpl-content">{{ selectedCustomCamp.smsMessage }}</p>
                      </div>
                    </div>
                    <!-- Card campaigns without a custom smsMessage aren't "blank" —
                         haflaway_server falls back to its own per-purpose default
                         text (with the card link included) — so this is informational,
                         not the same warning a plain campaign gets. -->
                    <div v-else-if="selectedCustomCamp?.kind === 'card'" class="em-tpl-item em-tpl-item--active" style="cursor: default">
                      <div class="em-tpl-body">
                        <p class="em-tpl-content">Using the default {{ selectedCustomCamp.name }} text, with the card link included automatically.</p>
                        <button class="em-msg-missing-warn-btn" @click="openCampDialog(selectedCustomCamp, 'sms')">Customize it</button>
                      </div>
                    </div>
                    <div v-else class="em-msg-missing-warn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>No SMS message set for this campaign — it will be sent blank. <button class="em-msg-missing-warn-btn" @click="openCampDialog(selectedCustomCamp, 'sms')">Set it now</button> before sending.</span>
                    </div>
                  </template>
                </div>
                </div>

                <aside class="em-send-preview">
                  <div class="em-preview-card">
                    <div class="em-preview-head">
                      <span class="em-preview-eyebrow">Live preview</span>
                      <span class="em-preview-channel" :class="sendChannel === 'whatsapp' ? 'em-preview-channel--wsp' : 'em-preview-channel--sms'">
                        <svg v-if="sendChannel === 'whatsapp'" width="12" height="12" viewBox="0 0 448 512" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {{ sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS' }}
                      </span>
                    </div>

                    <div class="em-preview-collage">
                      <div class="em-inv em-inv--left" aria-hidden="true">
                        <span class="em-inv-kicker">Save the Date</span>
                        <span class="em-inv-names">Our Day</span>
                        <span class="em-inv-orn">✦</span>
                      </div>
                      <div class="em-inv em-inv--right" aria-hidden="true">
                        <span class="em-inv-kicker">Details</span>
                        <span class="em-inv-names">RSVP</span>
                        <span class="em-inv-line" />
                        <span class="em-inv-date">{{ previewEventDate }}</span>
                      </div>

                      <div class="em-preview-phone" :class="{ 'em-preview-phone--wsp': sendChannel === 'whatsapp' }">
                        <div class="em-preview-screen">
                          <div class="em-phone-osbar">
                            <span>9:41</span>
                            <span class="em-phone-island" />
                            <span class="em-phone-os-icons">
                              <svg width="28" height="10" viewBox="0 0 28 10" fill="currentColor" aria-hidden="true">
                                <rect x="0" y="6" width="2.2" height="4" rx="0.4"/>
                                <rect x="3.4" y="4.5" width="2.2" height="5.5" rx="0.4"/>
                                <rect x="6.8" y="2.5" width="2.2" height="7.5" rx="0.4"/>
                                <rect x="10.2" y="0.8" width="2.2" height="9.2" rx="0.4"/>
                                <path d="M16.2 3.2c1.4-1.3 3.3-1.3 4.6 0" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
                                <path d="M17.4 4.8c.8-.7 1.8-.7 2.6 0" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
                                <circle cx="18.7" cy="7.2" r="0.85"/>
                                <rect x="22.2" y="2.4" width="5.2" height="5.4" rx="1.1" fill="none" stroke="currentColor" stroke-width="1"/>
                                <rect x="23" y="3.3" width="3.2" height="3.6" rx="0.4"/>
                              </svg>
                            </span>
                          </div>

                          <div class="em-chat-head">
                            <svg class="em-chat-back" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                            <span class="em-chat-avatar">{{ (brandName || 'H').charAt(0) }}</span>
                            <div class="em-chat-who">
                              <span class="em-chat-name">{{ brandName || 'Haflaway' }}</span>
                              <span class="em-chat-status">{{ sendChannel === 'whatsapp' ? 'online' : 'Text Message' }}</span>
                            </div>
                            <svg class="em-chat-tool" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          </div>

                          <div class="em-chat-thread">
                            <span class="em-chat-stamp">Today 10:42 AM</span>
                            <div class="em-preview-bubble" :class="{ 'em-preview-bubble--wsp': sendChannel === 'whatsapp' }" v-if="previewParts.length">
                              <p class="em-preview-bubble-text">
                                <template v-for="(part, i) in previewParts" :key="i">
                                  <span v-if="isVarToken(part)" class="em-preview-token">{{ part }}</span>
                                  <template v-else>{{ part }}</template>
                                </template>
                              </p>
                              <span class="em-preview-ticks">
                                10:42
                                <svg v-if="sendChannel === 'whatsapp'" width="12" height="8" viewBox="0 0 16 11" fill="none" aria-hidden="true">
                                  <path d="M1 6.2l2.4 2.5L8.2 3" stroke="#53bdeb" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                                  <path d="M5.4 6.2l2.4 2.5L13.8 2.2" stroke="#53bdeb" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                              </span>
                            </div>
                            <div class="em-preview-empty-state" v-else>
                              <div class="em-preview-ghost">
                                <span /><span /><span />
                              </div>
                              <p class="em-preview-empty-msg">
                                {{ sendChannel === 'whatsapp' ? 'Pick a template and it appears here as a chat.' : 'Set an SMS and it appears here as a text.' }}
                              </p>
                            </div>
                          </div>

                          <div class="em-chat-dock">
                            <span class="em-chat-plus">+</span>
                            <span class="em-chat-field">{{ sendChannel === 'whatsapp' ? 'Message' : 'Text Message' }}</span>
                            <span class="em-chat-mic" />
                          </div>
                        </div>
                        <div class="em-phone-home" />
                      </div>
                    </div>

                    <div class="em-preview-summary">
                      <h3 class="em-preview-title">Watch it land on their phone</h3>
                      <p class="em-preview-caption">
                        Going to <strong>{{ sendRecipCount }}</strong> recipient{{ sendRecipCount !== 1 ? 's' : '' }} for <strong>{{ selectedCustomCamp?.name }}</strong>
                      </p>
                    </div>
                  </div>
                </aside>
                </div>
              </div>

              <div class="em-drawer-footer">
                <div class="em-drawer-footer-inner">
                  <button class="em-drawer-cancel" @click="closeSendDrawer">Cancel</button>
                  <button class="em-drawer-send" :disabled="!canSend || sending" @click="executeSend">
                    <template v-if="sending">
                      <svg class="em-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Sending…
                    </template>
                    <template v-else>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      Send to {{ sendRecipCount }}
                    </template>
                  </button>
                </div>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <div v-if="sendModalOpen" class="em-sp-backdrop">
        <div class="em-sp" role="dialog" aria-modal="true" aria-labelledby="em-sp-title">
          <template v-if="!sendResult">
            <div class="em-sp-orbit" aria-hidden="true">
              <span /><span /><span />
            </div>
            <p class="em-sp-kicker">{{ sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS' }}</p>
            <h3 id="em-sp-title" class="em-sp-title">{{ selectedCustomCamp?.kind === 'card' ? 'Rendering & sending' : 'Sending' }}</h3>
            <p class="em-sp-sub">{{ selectedCustomCamp?.name || 'Campaign' }}</p>
            <p class="em-sp-pct">{{ activeSendRun && !activeSendRun.finishedAt ? sendRunPct + '%' : '…' }}</p>
            <div class="em-sp-track">
              <div class="em-sp-fill" :class="{ 'em-sp-fill--indeterminate': !activeSendRun || activeSendRun.finishedAt }" :style="activeSendRun && !activeSendRun.finishedAt ? { width: sendRunPct + '%' } : null"/>
            </div>
            <p class="em-sp-meta">
              <template v-if="activeSendRun && !activeSendRun.finishedAt">
                {{ sendRunProcessed }} of {{ activeSendRun.total }} delivered
                <span v-if="sendRunFailedCount"> · {{ sendRunFailedCount }} failed</span>
              </template>
              <template v-else>This usually takes a moment. Keep this tab open.</template>
            </p>
          </template>

          <template v-else>
            <div class="em-sp-result-icon" :class="sendResult.ok ? 'em-sp-result-icon--ok' : 'em-sp-result-icon--err'" aria-hidden="true">
              <svg v-if="sendResult.ok" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p class="em-sp-kicker">{{ sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS' }}</p>
            <h3 id="em-sp-title" class="em-sp-title">{{ sendResult.ok ? 'Messages sent!' : 'Something went wrong' }}</h3>
            <p class="em-sp-sub">{{ selectedCustomCamp?.name || 'Campaign' }}</p>

            <div v-if="sendResult.counts" class="em-sp-stats">
              <div class="em-sp-stat">
                <span class="em-sp-stat-num em-sp-stat-num--ok">{{ sendResult.counts.sent }}</span>
                <span class="em-sp-stat-label">Sent</span>
              </div>
              <div class="em-sp-stat-div" aria-hidden="true" />
              <div class="em-sp-stat">
                <span class="em-sp-stat-num" :class="sendResult.counts.renderFailed ? 'em-sp-stat-num--warn' : 'em-sp-stat-num--muted'">{{ sendResult.counts.renderFailed }}</span>
                <span class="em-sp-stat-label">Render failed</span>
              </div>
              <div class="em-sp-stat-div" aria-hidden="true" />
              <div class="em-sp-stat">
                <span class="em-sp-stat-num" :class="sendResult.counts.sendFailed ? 'em-sp-stat-num--err' : 'em-sp-stat-num--muted'">{{ sendResult.counts.sendFailed }}</span>
                <span class="em-sp-stat-label">Send failed</span>
              </div>
            </div>
            <p v-if="sendResult.counts" class="em-sp-total">of {{ sendResult.counts.total }} recipient{{ sendResult.counts.total === 1 ? '' : 's' }}</p>

            <p v-if="sendResult.message" class="em-sp-meta em-sp-meta--result">{{ sendResult.message }}</p>
            <button type="button" class="em-sp-done-btn" @click="sendResult = null">Done</button>
          </template>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="recipModalOpen" class="em-sg-backdrop" @pointerdown.self="onSgBackdropDown">
        <div class="em-sg" role="dialog" aria-modal="true" aria-labelledby="em-sg-title" @pointerdown.stop>
          <div class="em-sg-head">
            <h3 id="em-sg-title" class="em-sg-title">Select Guests</h3>
            <button type="button" class="em-sg-x" aria-label="Close" @click="closeRecipModal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="em-sg-body">
            <div class="em-sg-col">
              <p class="em-sg-note">{{ sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS' }} sends need a phone number on the guest list.</p>
              <div class="em-sg-search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="recipSearch" class="em-sg-search-input" placeholder="Search by name or group" />
              </div>
              <div class="em-sg-scroll">
                <div class="em-sg-sec-hd">
                  <span>Status</span>
                </div>
                <button
                  v-for="opt in SEND_STATUS_OPTS" :key="opt.v"
                  type="button"
                  class="em-sg-row"
                  :class="{ 'em-sg-row--active': recipStatusFilter === opt.v }"
                  @click="chooseStatus(opt.v)">
                  <span class="em-sg-box" :class="`em-sg-box--${statusStateMap[opt.v] || 'off'}`" />
                  <span class="em-sg-dot" :style="{ background: SG_STATUS_COLORS[opt.v] }" />
                  <span class="em-sg-status-lbl">{{ opt.l }}</span>
                  <span class="em-sg-row-n">{{ sendStatusCounts[opt.v] ?? 0 }}</span>
                </button>

                <template v-if="recipFilteredGroups.length">
                  <div class="em-sg-sec-hd">
                    <span>Groups</span>
                    <span class="em-sg-sec-n">{{ recipFilteredGroups.length }}</span>
                  </div>
                  <button v-for="lbl in recipFilteredGroups" :key="lbl.id" type="button" class="em-sg-row" @click="toggleGroup(lbl.id)">
                    <span class="em-sg-box" :class="`em-sg-box--${groupStateMap[lbl.id] || 'off'}`" />
                    <span class="em-sg-tag" :style="{ color: labelFg(lbl), background: labelBg(lbl) }">{{ lbl.name }}</span>
                    <span class="em-sg-row-n">{{ groupCountMap[lbl.id] || 0 }}</span>
                  </button>
                </template>
                <div class="em-sg-sec-hd em-sg-sec-hd--guests">
                  <span>Guests</span>
                  <span class="em-sg-sec-n">{{ recipFilteredGuests.length }}</span>
                  <button type="button" class="em-sg-select-all" @click="selectAllVisibleGuests">{{ recipVisibleAllSelected ? 'Clear all' : 'Select All' }}</button>
                </div>
                <button v-for="att in recipFilteredGuests" :key="att.id" type="button" class="em-sg-row em-sg-row--guest" @click="toggleDraftGuest(att.id)">
                  <span class="em-sg-box" :class="{ 'em-sg-box--on': recipDraftSet.has(att.id) }" />
                  <span class="em-sg-avatar" :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }">{{ initials(att.fullName) }}</span>
                  <span class="em-sg-guest">
                    <span class="em-sg-guest-name">{{ att.fullName }}</span>
                    <span v-if="!att.phone" class="em-sg-guest-warn">Missing phone number</span>
                  </span>
                  <span class="em-sg-guest-st" :style="{ color: SG_STATUS_COLORS[guestSendStatus(att)] }">{{ STATUS_LABELS[guestSendStatus(att)] ?? 'Unsent' }}</span>
                </button>
                <div v-if="!recipFilteredGuests.length" class="em-sg-empty">No guests found</div>
              </div>
            </div>
            <aside class="em-sg-selected">
              <p class="em-sg-selected-lbl">Selected &nbsp;<strong>{{ recipDraftIds.length }}</strong></p>
              <div class="em-sg-selected-list">
                <p v-for="(att, i) in recipDraftAttendees" :key="att.id" class="em-sg-selected-name">{{ i + 1 }}. {{ att.fullName }}</p>
              </div>
            </aside>
          </div>
          <div class="em-sg-foot">
            <button type="button" class="em-sg-link" @click="goEditGuestList">Edit Guest List</button>
            <div class="em-sg-foot-acts">
              <button type="button" class="em-sg-cancel" @click="closeRecipModal">Cancel</button>
              <button type="button" class="em-sg-done" @click="commitRecipModal">Done</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════
         CAMPAIGN CREATE / EDIT DIALOG
         ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="em-fade">
        <div v-if="campDialogOpen" class="em-sg-backdrop" @pointerdown.self="campDialogOpen = false">
          <div class="em-dialog em-dialog--joy" @pointerdown.stop>
            <div class="em-dialog-header em-sg-head">
              <h3 class="em-dialog-title em-sg-title">{{ editingCamp ? 'Edit Campaign' : 'New Campaign' }}</h3>
              <button type="button" class="em-sg-x" aria-label="Close" @click="campDialogOpen = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="em-dialog-body">
              <label class="em-dialog-lbl">Campaign Name</label>
              <input v-model="campDialogName" class="em-dialog-input" placeholder="e.g. Thank You Messages"
                @keydown.enter="saveCamp" autofocus />
              <template v-if="!editingCamp">
                <label class="em-dialog-lbl" style="margin-top:14px">Type</label>
                <div class="em-dialog-type-row">
                  <button type="button" class="em-dialog-type-btn" :class="{ 'em-dialog-type-btn--on': campDialogType === 'invitation' }" @click="campDialogType = 'invitation'">Invitation</button>
                  <button type="button" class="em-dialog-type-btn" :class="{ 'em-dialog-type-btn--on': campDialogType === 'contribution' }" @click="campDialogType = 'contribution'">Contribution</button>
                  <button type="button" class="em-dialog-type-btn" :class="{ 'em-dialog-type-btn--on': campDialogType === 'contact' }" @click="campDialogType = 'contact'">Contact</button>
                </div>
              </template>
              <label class="em-dialog-lbl" style="margin-top:14px">Custom Message</label>
              <div class="em-send-ch-toggle">
                <button type="button" class="em-send-ch-btn" :class="{ 'em-send-ch-btn--wsp': campDialogMsgTab === 'whatsapp' }" @click="campDialogMsgTab = 'whatsapp'">
                  <svg width="14" height="14" viewBox="0 0 448 512" fill="#128C7E"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                  WhatsApp
                </button>
                <button type="button" class="em-send-ch-btn" :class="{ 'em-send-ch-btn--sms': campDialogMsgTab === 'sms' }" @click="campDialogMsgTab = 'sms'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5856D6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  SMS
                </button>
              </div>

              <template v-if="campDialogMsgTab === 'whatsapp'">
                <label class="em-dialog-lbl" style="margin-top:12px">WhatsApp Custom Message</label>
                <div class="em-dialog-tpl-acts">
                  <select class="em-copy-prev-select" :disabled="!prevCampaignsWithWa.length" @change="copyPrevMessage('whatsapp', $event)">
                    <option value="">{{ prevCampaignsWithWa.length ? 'Copy from previous…' : 'No previous message' }}</option>
                    <option v-for="c in prevCampaignsWithWa" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                  <select class="em-copy-prev-select" :disabled="loadingGlobalTpls || !globalTplsForWa.length" @change="useGlobalTemplate('whatsapp', $event)">
                    <option value="">{{ loadingGlobalTpls ? 'Loading…' : globalTplsForWa.length ? 'Import from library…' : 'No library templates' }}</option>
                    <option v-for="t in globalTplsForWa" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <textarea v-model="campDialogWaMessage" class="em-dialog-textarea" rows="4"
                  placeholder="e.g. Unakumbushwa kuwahi kwenye kikao cha leo saa tisa alasiri."></textarea>
                <p class="em-dialog-hint">Fills the custom message slot in this campaign's shared WhatsApp template. Set once, reused for every send of this campaign.</p>
              </template>

              <template v-else>
                <label class="em-dialog-lbl" style="margin-top:12px">SMS Custom Message</label>
                <div class="em-dialog-tpl-acts">
                  <select class="em-copy-prev-select" :disabled="!prevCampaignsWithSms.length" @change="copyPrevMessage('sms', $event)">
                    <option value="">{{ prevCampaignsWithSms.length ? 'Copy from previous…' : 'No previous message' }}</option>
                    <option v-for="c in prevCampaignsWithSms" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                  <select class="em-copy-prev-select" :disabled="loadingGlobalTpls || !globalTplsForSms.length" @change="useGlobalTemplate('sms', $event)">
                    <option value="">{{ loadingGlobalTpls ? 'Loading…' : globalTplsForSms.length ? 'Import from library…' : 'No library templates' }}</option>
                    <option v-for="t in globalTplsForSms" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <textarea v-model="campDialogSmsMessage" class="em-dialog-textarea" rows="4"
                  placeholder="e.g. Unakumbushwa kuwahi kwenye kikao cha leo saa tisa alasiri."></textarea>
                <p class="em-dialog-hint">Sent as-is to every recipient — no per-send template picking needed.</p>
              </template>
            </div>
            <div class="em-dialog-footer">
              <button type="button" class="em-sg-cancel" @click="campDialogOpen = false">Cancel</button>
              <button type="button" class="em-sg-done" :disabled="!campDialogName.trim() || savingCamp" @click="saveCamp">
                <svg v-if="savingCamp" class="em-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                {{ savingCamp ? 'Saving…' : (editingCamp ? 'Save' : 'Create') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db, auth } from '../../firebase'
import { collection, query, orderBy, where, limit, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { useNavDrawer } from '../../composables/useNavDrawer.js'
import { useOrg } from '../../composables/useOrg.js'

// cardScope: this same page/component doubles as the Invitations screen
// (route: 'invitations', see router/index.js) — Create tab shows card
// purposes instead of message presets, and Drafts/Scheduled/Sent are scoped
// to kind:'card' campaigns instead of everything else.
const props = defineProps({ event: Object, eventId: String, cardScope: { type: Boolean, default: false } })
const route  = useRoute()
const router = useRouter()
const navDrawer = useNavDrawer()
const { brandName, brandLogoUrl, twilioCredentialsStatus, loadTwilioCredentialsStatus } = useOrg()
const eventId = computed(() => props.eventId ?? route.params.eventId)

// Ported from EventMessages.vue — generates/rotates the public token guests'
// undelivered-card report link is keyed on (events/{id}.invitationsReportToken).
// See the header button above for the popover this backs.
const reportToken       = ref(props.event?.invitationsReportToken ?? '')
const reportPopoverOpen = ref(false)
const reportLinkCopied  = ref(false)
// EventLayout fetches `event` with a one-time getDoc, not onSnapshot, and it
// starts out null — on a hard navigation straight to this route, the ref
// above can snapshot before that fetch resolves. Backfill once it arrives,
// but never clobber a token this tab just generated/regenerated locally.
watch(() => props.event?.invitationsReportToken, (val) => {
  if (val && !reportToken.value) reportToken.value = val
})
const reportUrl = computed(() => {
  if (!reportToken.value || !eventId.value) return ''
  return `${window.location.origin}/invitations-report/${eventId.value}/${reportToken.value}`
})
async function generateReportLink() {
  if (!eventId.value) return
  const token = crypto.randomUUID()
  try {
    await updateDoc(doc(db, 'events', eventId.value), { invitationsReportToken: token })
    reportToken.value = token
  } catch (e) { console.error('Failed to generate report link', e) }
}
async function regenerateReportLink() {
  if (!window.confirm("Regenerating invalidates the link you already shared — anyone with the old one loses access. Continue?")) return
  await generateReportLink()
}
async function copyReportLink() {
  if (!reportUrl.value) return
  try {
    await navigator.clipboard.writeText(reportUrl.value)
    reportLinkCopied.value = true
    setTimeout(() => { reportLinkCopied.value = false }, 2000)
  } catch (e) { console.error('Failed to copy report link', e) }
}
const vClickOutside = {
  mounted(el, binding) {
    el._co = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el._co)
  },
  unmounted(el) { document.removeEventListener('mousedown', el._co) }
}

const WSP_URL = 'https://sendwhatsappinvitationmessages-frbu33fema-uc.a.run.app'
const GENERAL_CAMPAIGN_CATEGORY = 'haflaway-general-campaign'

// haflaway_server (standalone VPS backend) — card campaigns (kind:'card')
// send through here instead of the raw Cloud Function URLs above: it renders
// each attendee's card on demand (reusing one already rendered) and only then
// dispatches, still via those same Cloud Functions internally — see that
// server's src/routes/campaigns.js. Defaults to local dev; set
// VITE_CARD_SERVER_URL once it's deployed somewhere reachable.
const CARD_SERVER_URL = import.meta.env.VITE_CARD_SERVER_URL || 'http://localhost:8080'

// Card-send campaigns (kind:'card' — started from the Guest List's Send-a-Card
// flow) need the SAME purpose-specific WhatsApp template category the
// Invitations screen already uses (EventMessages.vue's CAMPAIGN_TEMPLATE_CATEGORIES),
// not the generic one below — those templates are fully pre-authored, unlike
// the general/bulk ones this composer was originally built for. Matches
// haflaway_server/src/routes/campaigns.js's WHATSAPP_TEMPLATE_CATEGORY_BY_PURPOSE;
// thank_you/enclosure are best-guess category names there too (not yet
// confirmed to have an approved template — see that file's comments).
const CARD_PURPOSE_WHATSAPP_CATEGORY = {
  invitation:    'whatsapp-wedding-invitations',
  save_the_date: 'whatsapp-wedding-save-the-date',
  thank_you:     'whatsapp-wedding-thank-you',
  enclosure:     'whatsapp-wedding-enclosure',
}

// `type` reads as raw snake_case for card-purpose campaigns (save_the_date,
// thank_you, enclosure) started from the Guest List's Send-a-Card flow —
// matches the titles CARD_OPTIONS shows there (EventAttendees.vue).
const CAMPAIGN_TYPE_LABELS = {
  invitation: 'Invitation', contribution: 'Contribution', contact: 'Contact',
  save_the_date: 'Save the Date', thank_you: 'Thank You Card', enclosure: 'Enclosure Card',
}
function campaignTypeLabel(type) { return CAMPAIGN_TYPE_LABELS[type] ?? type }

// Inline style wins over any stylesheet cascade oddity — used to force the
// active WhatsApp/SMS tab to render visibly. Sourced from --gold (the live
// org brand accent, set at runtime by useOrg.js) at low opacity, matching
// the tinted-accent treatment used elsewhere (e.g. .em-dialog-type-btn--on).
const ACTIVE_CH_STYLE = {
  background: 'var(--cx-seg-bg)',
  color: 'var(--cx-seg-fg)',
  borderColor: 'transparent',
  boxShadow: 'var(--cx-seg-shadow)',
  fontWeight: 700,
}

// WhatsApp-only (Twilio has no SMS equivalent for read receipts).
const READ_STATUS_OPT = { v: 'read', l: 'Read' }

const SEND_STATUS_OPTS_BASE = [
  { v: 'unsent',    l: 'Unsent'    },
  { v: 'sent',      l: 'Sent'      },
  { v: 'delivered', l: 'Delivered' },
  { v: 'failed',    l: 'Failed'    },
  { v: 'all',       l: 'All'       },
]
const SEND_STATUS_OPTS = computed(() => {
  if (sendChannel.value !== 'whatsapp') return SEND_STATUS_OPTS_BASE
  return [...SEND_STATUS_OPTS_BASE.slice(0, 3), READ_STATUS_OPT, ...SEND_STATUS_OPTS_BASE.slice(3)]
})

const DRAWER_STATUS_COLORS = {
  unsent:    { bg: 'rgba(201,168,76,0.08)',  fg: '#C9A84C', border: 'rgba(201,168,76,0.30)' },
  sent:      { bg: 'rgba(99,179,237,0.10)',  fg: '#63b3ed', border: 'rgba(99,179,237,0.30)' },
  delivered: { bg: 'rgba(52,211,153,0.10)',  fg: '#34d399', border: 'rgba(52,211,153,0.30)' },
  read:      { bg: 'rgba(52,183,241,0.10)',  fg: '#34B7F1', border: 'rgba(52,183,241,0.30)' },
  failed:    { bg: 'rgba(255,69,58,0.10)',   fg: '#ff6b6b', border: 'rgba(255,69,58,0.25)'  },
  all:       { bg: 'rgba(255,255,255,0.05)', fg: '#d4cfc8', border: 'rgba(255,255,255,0.15)' },
}

const STATUS_LABELS = {
  unsent: 'Unsent', sent: 'Sent', delivered: 'Delivered',
  read: 'Read', failed: 'Failed', pending: 'Pending', undelivered: 'Undelivered',
}

const STATUS_OPTIONS_BASE = [
  { v: 'unsent',    l: 'Unsent'    },
  { v: 'sent',      l: 'Sent'      },
  { v: 'delivered', l: 'Delivered' },
  { v: 'failed',    l: 'Failed'    },
  { v: 'all',       l: 'All'       },
]
const STATUS_OPTIONS = computed(() => {
  if (detailChannel.value !== 'whatsapp') return STATUS_OPTIONS_BASE
  return [...STATUS_OPTIONS_BASE.slice(0, 3), READ_STATUS_OPT, ...STATUS_OPTIONS_BASE.slice(3)]
})

// ── Attendees ──────────────────────────────────────────────────────────────────
const attendees = ref([])
const loading   = ref(false)
const recipientsById = computed(() => Object.fromEntries(attendees.value.map(a => [a.id, a])))
const SEND_RUN_STATUS_LABELS = { sent: 'Sent', render_failed: 'Render failed', send_failed: 'Send failed' }

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

// ── Custom campaigns ───────────────────────────────────────────────────────────
const customCampaigns     = ref([])
const loadingCustomCamps  = ref(false)

// withjoy-style tab strip above the dashboard — Create/Drafts/Scheduled/Sent
// are mutually exclusive views, not stacked panels.
const VALID_TABS = ['create', 'drafts', 'scheduled', 'sent']
const initialTab = VALID_TABS.includes(route.query.tab) ? route.query.tab : 'create'
const msgTab = ref(initialTab)
const MSG_TAB_LABELS = { create: 'Create', drafts: 'Drafts', scheduled: 'Scheduled', sent: 'Sent' }

// Tabs stay visible on the campaign detail page (it's always reached from
// inside one of them), so clicking one while a campaign is open must back
// out to that tab's list rather than just relabeling the header underneath it.
function goToTab(tab) {
  msgTab.value = tab
  const { campaign, ...rest } = route.query
  router.replace({ query: { ...rest, tab } })
  if (selectedCustomCamp.value) {
    selectedCustomCamp.value = null
  }
}

// A campaign's own `status` field is only flipped to 'sent' by the send-drawer's
// success handler (see below) — it's absent on campaigns dispatched before that
// existed, or if that write ever failed, so it under-reports. The reliable
// signal is the attendees' own messageIndexes (`${channel}_${campaignId}_${status}`,
// Twilio-webhook driven — same format InvitationsReport.vue parses), which
// records an entry the moment a send is attempted, before any webhook lands.
const dispatchedCampaignIds = computed(() => {
  const ids = new Set()
  for (const att of attendees.value) {
    for (const idx of att.messageIndexes ?? []) {
      const firstU = idx.indexOf('_'), lastU = idx.lastIndexOf('_')
      if (firstU === -1 || firstU === lastU) continue
      ids.add(idx.slice(firstU + 1, lastU))
    }
  }
  return ids
})

// Dispatched at least once — regardless of individual recipients' delivery
// state (sent/delivered/failed) — as opposed to still-draft campaigns.
const sentCampaigns = computed(() =>
  customCampaigns.value.filter(c => c.status === 'sent' || dispatchedCampaignIds.value.has(c.id))
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
)
const draftCampaigns = computed(() =>
  customCampaigns.value.filter(c => c.status !== 'sent' && !dispatchedCampaignIds.value.has(c.id))
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
)

// Card-purpose campaigns are meant to be one per purpose per event — both
// places that create one (EventAttendees.vue's selectCardOption and this
// page's selectCardTile) target the same deterministic `card_<purpose>` doc
// id. Events sent before that dedup existed accumulated separate campaign
// docs for the same purpose instead, so the Sent list showed one row per
// historical duplicate ("Invitation" x5) rather than one row per purpose.
// Group those together here for display. Preset (non-card) campaigns are
// deliberately NOT grouped — clicking "General Message" again is meant to
// start a new, separately-composed send, not merge into a prior one.
const sentCampaignGroups = computed(() => {
  if (!props.cardScope) return sentCampaigns.value.map(c => ({ ...c, mergedIds: [c.id] }))
  const byType = new Map()
  for (const camp of sentCampaigns.value) {
    const key = camp.type ?? camp.name
    if (!byType.has(key)) byType.set(key, [])
    byType.get(key).push(camp)
  }
  const groups = []
  for (const camps of byType.values()) {
    // Prefer the canonical card_<purpose> doc as the representative — it's
    // the one every future send already targets — falling back to the most
    // recently created duplicate for events that predate it entirely.
    const rep = camps.find(c => c.id === `card_${c.type}`) ??
      camps.reduce((latest, c) => new Date(c.createdAt ?? 0) > new Date(latest.createdAt ?? 0) ? c : latest)
    groups.push({ ...rep, mergedIds: camps.map(c => c.id) })
  }
  return groups.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
})

// ── Sent tab: per-message-type icon/label + per-campaign send/fail counts ──────
const PRESET_TYPE_META = {
  'General Message': {
    label: 'General',
    color: '#374151',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  },
  'RSVP Reminder': {
    label: 'RSVP Reminder',
    color: '#374151',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 13V6a2.5 2.5 0 0 0-2.5-2.5H4.5A2.5 2.5 0 0 0 2 6v12a2.5 2.5 0 0 0 2.5 2.5h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/></svg>`,
  },
  'Pledge Reminder': {
    label: 'Pledge Reminder',
    color: '#374151',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="3"/><circle cx="12" cy="10" r="3.5"/><path d="M7 18c0-2.8 2.2-5 5-5s5 2.2 5 5"/><line x1="2" y1="6" x2="4" y2="6"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="2" y1="18" x2="4" y2="18"/></svg>`,
  },
  'Meeting Reminder': {
    label: 'Meeting Reminder',
    color: '#374151',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="3"/><polyline points="12 13.5 12 15 13.5 15"/></svg>`,
  },
}
const DEFAULT_TYPE_META = {
  label: 'General',
  color: '#374151',
  icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
}
// Same shape as PRESET_TYPE_META above, keyed by the exact names CARD_TILES
// (below) creates campaigns with — without this, every card campaign fell
// through to DEFAULT_TYPE_META ("General"/envelope icon) in the Sent table
// and the detail heading badge.
const CARD_TYPE_META = {
  'Save the Date': {
    label: 'Save the Date',
    color: '#0891b2',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2.5"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14.2c-.4-.4-1.1-.4-1.5 0-.4.4-.4 1.1 0 1.5l1.5 1.5 1.5-1.5c.4-.4.4-1.1 0-1.5-.4-.4-1.1-.4-1.5 0z"/></svg>`,
  },
  'Invitation': {
    label: 'Invitation',
    color: '#f97316',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/><line x1="8" y1="7" x2="16" y2="7"/><circle cx="12" cy="13" r="2.2"/><path d="M12 15.2v2.3"/></svg>`,
  },
  'Thank You Card': {
    label: 'Thank You',
    color: '#d946ef',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><polyline points="3 8 12 14 21 8"/><path d="M3 8l5.5-4h7l5.5 4"/><circle cx="12" cy="14" r="2.2"/><path d="M11 14l.7.7 1.5-1.4"/></svg>`,
  },
  'Enclosure Card': {
    label: 'Enclosure',
    color: '#8b5cf6',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="14" height="14" rx="2"/><path d="M3 17V5a2 2 0 0 1 2-2h12"/></svg>`,
  },
}
function messageTypeMeta(camp) { return PRESET_TYPE_META[camp.name] ?? CARD_TYPE_META[camp.name] ?? DEFAULT_TYPE_META }
const SENT_TYPE_OPTIONS = computed(() =>
  props.cardScope ? Object.keys(CARD_TYPE_META) : [...Object.keys(PRESET_TYPE_META), 'Custom']
)

// Every messageIndexes entry that belongs to this campaign, across both
// channels — a guest can have a whatsapp_ and an sms_ entry for the same
// campaign, so this can return more than one per attendee.
function campaignIndexEntries(att, campId) {
  return (att.messageIndexes ?? []).filter(idx => {
    const firstU = idx.indexOf('_'), lastU = idx.lastIndexOf('_')
    if (firstU === -1 || firstU === lastU) return false
    return idx.slice(firstU + 1, lastU) === campId
  })
}

// A selected campaign can be a sentCampaignGroups representative standing in
// for several merged legacy duplicate docs (see sentCampaignGroups above) —
// every place that looks up "has this attendee been messaged for this
// campaign, on this channel" must check every merged id, not just the
// representative's own. Skipping this would under-report stats on the detail
// page AND, worse, make the send drawer think an already-sent guest is still
// "unsent" (because their real send lives under a different merged id),
// risking a duplicate paid send. Ranked so the most-advanced status across
// all merged ids wins, mirroring campaignStatsMap's "any sent/delivered/read
// counts as sent" rule.
const CUSTOM_STATUS_RANK = { read: 0, delivered: 1, sent: 2, failed: 3 }
function bestStatusAcrossIds(att, channel, campIds) {
  let best = null
  let bestRank = Infinity
  for (const campId of campIds) {
    const prefix = `${channel}_${campId}_`
    const match = (att.messageIndexes ?? []).find(idx => idx.startsWith(prefix))
    if (!match) continue
    const s = match.slice(match.lastIndexOf('_') + 1)
    if (s === 'unsent') continue
    const rank = CUSTOM_STATUS_RANK[s] ?? CUSTOM_STATUS_RANK.failed
    if (rank < bestRank) { bestRank = rank; best = s }
  }
  return best
}
function mergedIdsOf(camp) { return camp?.mergedIds ?? (camp ? [camp.id] : []) }

// Recipients + send/fail counts per sent campaign, for the Sent tab table.
// A recipient counts as "sent" if any channel reached sent/delivered/read,
// and "failed" if any attempted channel came back failed and none succeeded.
// NOT `every(s => s === 'failed')` — the onCampaignCreated Cloud Function
// (functions/campaigns/index.js) stamps every attendee with a
// `${channel}_${campaignId}_unsent` placeholder for BOTH sms and whatsapp
// the moment a campaign doc is created, so an attendee sent on only one
// channel always carries a leftover 'unsent' entry for the other.
// `every` treated that mixed [failed, unsent] as "not all failed" and
// silently dropped them from both buckets — real failures undercounted
// (often down to 0) everywhere this map has ever been read, made obvious
// once card campaigns started merging several legacy ids together (more
// merged ids/channels per attendee, near-guaranteeing a stray 'unsent').
const campaignStatsMap = computed(() => {
  const map = {}
  for (const group of sentCampaignGroups.value) {
    const recipients = []
    let sent = 0, failed = 0
    for (const att of attendees.value) {
      const entries = group.mergedIds.flatMap(id => campaignIndexEntries(att, id))
      if (!entries.length) continue
      recipients.push(att)
      const statuses = entries.map(idx => idx.slice(idx.lastIndexOf('_') + 1))
      if (statuses.some(s => s === 'sent' || s === 'delivered' || s === 'read')) sent++
      else if (statuses.some(s => s === 'failed')) failed++
    }
    map[group.id] = { recipients, sent, failed }
  }
  return map
})

const sentSearchQ      = ref('')
const sentTypeFilter   = ref(null)
const sentTypeDropOpen = ref(false)
const sentTypeDdTriggerRef = ref(null)
const sentTypeDdMenuRef    = ref(null)

const sentTableRows = computed(() => {
  const q = sentSearchQ.value.trim().toLowerCase()
  return sentCampaignGroups.value.filter(camp => {
    if (q && !(camp.name ?? '').toLowerCase().includes(q)) return false
    if (sentTypeFilter.value) {
      const isPreset = !!PRESET_TYPE_META[camp.name]
      if (sentTypeFilter.value === 'Custom' ? isPreset : camp.name !== sentTypeFilter.value) return false
    }
    return true
  })
})

const selectedCustomCamp = ref(null)
// Read once, synchronously at setup, before any Firestore round-trip: were we
// deep-linked here to compose rather than to browse? Everything about that flow
// hangs off this — the composer starts *already open* (see sendDrawerOpen) so it
// paints on the first frame with no enter transition to see past, and this page
// suppresses all of its own content (see composerOnly) so the campaign detail
// view never shows through while the fetch is in flight.
const deepLinkSend = route.query.send === '1' && !!route.query.campaign
// The composer owns the whole screen. Stays true until it's closed or the deep
// link turns out to be a dud, never flipped by the fetch merely finishing.
const composerOnly = ref(deepLinkSend)
// One-shot: only the *first* load resolves the deep link. Later reloads (e.g.
// after editing the campaign's message from inside the composer) must not
// re-run the open/abort logic underneath the user.
let deepLinkPending = deepLinkSend
const customStatus       = ref('unsent')
const customLabelId      = ref(null)
const detailChannel      = ref('sms')

function handleFilterDdOutsideClick(e) {
  if (recipDropOpen.value && !recipDdTriggerRef.value?.contains(e.target) && !recipDdMenuRef.value?.contains(e.target)) {
    recipDropOpen.value = false
  }
  if (sentTypeDropOpen.value && !sentTypeDdTriggerRef.value?.contains(e.target) && !sentTypeDdMenuRef.value?.contains(e.target)) {
    sentTypeDropOpen.value = false
  }
  if (detailFilterPopoverOpen.value && !detailFilterTriggerRef.value?.contains(e.target) && !detailFilterMenuRef.value?.contains(e.target)) {
    detailFilterPopoverOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleFilterDdOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleFilterDdOutsideClick))
onUnmounted(() => stopWatchingSendRun())
onUnmounted(() => {
  window.removeEventListener('keydown', onSgKeydown)
  document.body.style.overflow = ''
})

async function loadCustomCampaigns() {
  if (!eventId.value) return
  loadingCustomCamps.value = true
  try {
    const snap = await getDocs(
      query(collection(db, 'events', eventId.value, 'campaigns'), orderBy('createdAt', 'desc'))
    )
    // This same list backs both scopes of this page — card sends (Invitations
    // route) and everything else (Bulk Messages route) — so it's one filter
    // here rather than two separate queries.
    customCampaigns.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(c => props.cardScope ? c.kind === 'card' : c.kind !== 'card')
    // Restore the drilled-into campaign from the URL (e.g. after a refresh)
    // instead of always landing back on the list.
    if (route.query.campaign && !selectedCustomCamp.value) {
      const match = customCampaigns.value.find(c => c.id === route.query.campaign)
      if (match) {
        selectedCustomCamp.value = match
        if (!route.query.tab) {
          const isSent = match.status === 'sent' || dispatchedCampaignIds.value.has(match.id)
          msgTab.value = isSent ? 'sent' : (match.status === 'scheduled' ? 'scheduled' : 'drafts')
        }
        // Deep-linked here from the Guest List "Send" flow, which wants to jump
        // straight into composing rather than landing on the campaign detail
        // view. The drawer is already open — this just fills in the campaign it
        // is composing for and loads its templates. `send`/`returnTo` stay in
        // the URL on purpose: strip them and a refresh drops the user onto that
        // same detail view, and Cancel loses its way back to the Guest List.
        if (deepLinkPending) openCustomSend()
      }
    }
  } catch (e) {
    console.error('Failed to load campaigns', e)
  } finally {
    loadingCustomCamps.value = false
    if (deepLinkPending) {
      deepLinkPending = false
      // Campaign id was stale/invalid, or the fetch failed — there is nothing to
      // compose. Don't strand the user in an empty composer; fall back to the
      // normal page (which is now the honest thing to show).
      if (!selectedCustomCamp.value) exitComposerOnly()
    }
  }
}

// Hand the screen back to this page: close the composer and drop the deep-link
// params so a refresh doesn't reopen it.
function exitComposerOnly() {
  deepLinkPending = false
  composerOnly.value = false
  sendDrawerOpen.value = false
  deepLinkReturnTo.value = null
  const { send, returnTo, ...rest } = route.query
  router.replace({ query: rest })
}

function selectCustomCamp(camp) {
  selectedCustomCamp.value = camp
  customStatus.value = 'unsent'
  customLabelId.value = null
  router.replace({ query: { ...route.query, campaign: camp.id, tab: msgTab.value } })
}

function backToCampaignList() {
  selectedCustomCamp.value = null
  const { campaign, ...rest } = route.query
  router.replace({ query: { ...rest, tab: msgTab.value } })
}

// Keep the active header tab and breadcrumb in sync with the selected campaign
watch([selectedCustomCamp, dispatchedCampaignIds], ([camp, dispatchedIds]) => {
  if (!camp) return
  if (route.query.tab && VALID_TABS.includes(route.query.tab)) {
    msgTab.value = route.query.tab
    return
  }
  const isSent = camp.status === 'sent' || dispatchedIds.has(camp.id)
  if (isSent) {
    msgTab.value = 'sent'
  } else if (camp.status === 'scheduled') {
    msgTab.value = 'scheduled'
  } else {
    msgTab.value = 'drafts'
  }
  if (!route.query.tab) {
    router.replace({ query: { ...route.query, tab: msgTab.value } })
  }
}, { immediate: true })

watch(() => route.query.tab, (newTab) => {
  if (newTab && VALID_TABS.includes(newTab) && msgTab.value !== newTab) {
    msgTab.value = newTab
  }
})

watch(() => route.query.campaign, (newCampId) => {
  if (!newCampId && selectedCustomCamp.value) {
    selectedCustomCamp.value = null
  } else if (newCampId && (!selectedCustomCamp.value || selectedCustomCamp.value.id !== newCampId)) {
    const match = customCampaigns.value.find(c => c.id === newCampId)
    if (match) selectedCustomCamp.value = match
  }
})

// ── Campaign dialog ────────────────────────────────────────────────────────────
const campDialogOpen  = ref(false)
const editingCamp     = ref(null)
const campDialogName       = ref('')
const campDialogType       = ref('invitation')
const campDialogWaMessage  = ref('')
const campDialogSmsMessage = ref('')
const campDialogMsgTab     = ref('whatsapp')
const savingCamp           = ref(false)

// ── Message-intent presets (shown inline in the panel, not behind a "New
// Campaign" step) ────────────────────────────────────────────────────────────
// Fixed set of message intents shown instead of a free-text name/type form —
// picking one auto-creates a draft campaign titled after the pick and jumps
// straight into composing/sending it (mirrors selecting an existing campaign
// then pressing Send — see selectCustomCamp/openCustomSend below).
// Same 4 purposes/titles/icons as EventAttendees.vue's CARD_OPTIONS (the
// Guest List "Send > Card" modal), so this page's tiles read as the same
// thing rather than a second, slightly-different card picker.
const CARD_TILES = [
  {
    purpose: 'save_the_date', label: 'Save the Date', color: '#0891b2',
    icon: `<rect x="3" y="4" width="18" height="18" rx="2.5"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14.2c-.4-.4-1.1-.4-1.5 0-.4.4-.4 1.1 0 1.5l1.5 1.5 1.5-1.5c.4-.4.4-1.1 0-1.5-.4-.4-1.1-.4-1.5 0z"/>`,
  },
  {
    purpose: 'invitation', label: 'Invitation', color: '#f97316',
    icon: `<rect x="5" y="3" width="14" height="18" rx="2.5"/><line x1="8" y1="7" x2="16" y2="7"/><circle cx="12" cy="13" r="2.2"/><path d="M12 15.2v2.3"/>`,
  },
  {
    purpose: 'thank_you', label: 'Thank You Card', color: '#d946ef',
    icon: `<path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><polyline points="3 8 12 14 21 8"/><path d="M3 8l5.5-4h7l5.5 4"/><circle cx="12" cy="14" r="2.2"/><path d="M11 14l.7.7 1.5-1.4"/>`,
  },
  {
    purpose: 'enclosure', label: 'Enclosure Card', color: '#8b5cf6',
    icon: `<rect x="7" y="7" width="14" height="14" rx="2"/><path d="M3 17V5a2 2 0 0 1 2-2h12"/>`,
  },
]
const checkingCardTile = ref(null)

// Mirrors EventAttendees.vue's selectCardOption, adapted to act in-page
// instead of navigating away — this page IS the composer's home, so there's
// nowhere to deep-link back from. Same deterministic card_<purpose> campaign
// id (never a fresh addDoc) so a tile here and the Guest List's Send > Card
// modal always land on the exact same campaign for a given purpose.
async function selectCardTile(tile) {
  if (checkingCardTile.value) return
  checkingCardTile.value = tile.purpose
  try {
    const blueprintSnap = await getDocs(query(
      collection(db, 'events', eventId.value, 'cards'),
      where('purpose', '==', tile.purpose),
      limit(1)
    ))
    if (blueprintSnap.empty) {
      // No template yet — same detour EventAttendees.vue's selectCardOption
      // uses: the Cards tab's empty state points at the Designer, and
      // origin=invitations tells its "Continue Sending" resume flow to come
      // back here instead of the Guest List.
      router.push({
        path: `/event/${eventId.value}/cards`,
        query: { filter: tile.purpose, returnToSend: tile.purpose, origin: 'invitations' },
      })
      return
    }

    const campaignRef = doc(db, 'events', eventId.value, 'campaigns', `card_${tile.purpose}`)
    const campaignSnap = await getDoc(campaignRef)
    if (!campaignSnap.exists()) {
      await setDoc(campaignRef, {
        name: tile.label,
        type: tile.purpose,
        kind: 'card',
        whatsappMessage: null,
        smsMessage: null,
        createdAt: new Date().toISOString(),
        status: 'draft',
      })
      const newCamp = {
        id: campaignRef.id, name: tile.label, type: tile.purpose, kind: 'card',
        whatsappMessage: null, smsMessage: null, createdAt: new Date().toISOString(), status: 'draft',
      }
      customCampaigns.value.unshift(newCamp)
      selectCustomCamp(newCamp)
    } else {
      // Built from this fresh read, not from customCampaigns — that list may
      // not have finished loading yet (a fast click right after page load),
      // and preferring a locally-built draft shape over a real, possibly
      // 'sent' doc would visibly regress its status/content in the drawer.
      selectCustomCamp({ id: campaignSnap.id, ...campaignSnap.data() })
    }
    openCustomSend()
  } catch (e) {
    console.error('selectCardTile:', e)
  } finally {
    checkingCardTile.value = null
  }
}

const PRESET_CAMPAIGNS = ['General Message', 'RSVP Reminder', 'Pledge Reminder', 'Meeting Reminder']
const creatingPresetCamp = ref(false)
async function createPresetCampaign(label) {
  if (creatingPresetCamp.value) return
  creatingPresetCamp.value = true
  try {
    const createdAt = new Date().toISOString()
    const docRef = await addDoc(collection(db, 'events', eventId.value, 'campaigns'), {
      name: label,
      whatsappMessage: null,
      smsMessage: null,
      createdAt,
      status: 'draft',
    })
    const newCamp = { id: docRef.id, name: label, whatsappMessage: null, smsMessage: null, createdAt, status: 'draft' }
    customCampaigns.value.unshift(newCamp)
    selectCustomCamp(newCamp)
    openCustomSend()
  } catch (e) {
    console.error('createPresetCampaign:', e)
  } finally {
    creatingPresetCamp.value = false
  }
}

function openCampDialog(camp, tab) {
  editingCamp.value = camp ?? null
  // Default to whichever channel is actually being composed (e.g. "Set it
  // now"/"Edit message" from the send drawer) rather than always WhatsApp —
  // otherwise a message typed while viewing the SMS warning silently lands
  // in the WhatsApp field instead.
  campDialogMsgTab.value = tab ?? 'whatsapp'
  campDialogName.value = camp?.name ?? ''
  campDialogType.value = camp?.type ?? 'invitation'
  campDialogWaMessage.value = camp?.whatsappMessage ?? ''
  campDialogSmsMessage.value = camp?.smsMessage ?? ''
  campDialogOpen.value = true
  loadGlobalTemplates()
}

// ── Copy message content from a previous campaign ───────────────────────────────
const prevCampaignsForDialog = computed(() =>
  [...customCampaigns.value]
    .filter(c => c.id !== editingCamp.value?.id)
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
)
const prevCampaignsWithWa  = computed(() => prevCampaignsForDialog.value.filter(c => c.whatsappMessage).slice(0, 8))
const prevCampaignsWithSms = computed(() => prevCampaignsForDialog.value.filter(c => c.smsMessage).slice(0, 8))

function copyPrevMessage(channel, e) {
  const id = e.target.value
  e.target.value = ''
  if (!id) return
  const camp = customCampaigns.value.find(c => c.id === id)
  if (!camp) return
  if (channel === 'whatsapp') campDialogWaMessage.value = camp.whatsappMessage ?? ''
  else campDialogSmsMessage.value = camp.smsMessage ?? ''
}

// ── Global template library (superuser-managed, haflaway_admin_spa) ────────────
// Category taxonomy matches campaign `type` 1:1 (invitation/contribution/contact),
// so no mapping is needed here — unlike Invitations' fixed campaign ids.
const globalTemplates      = ref([])
const loadingGlobalTpls    = ref(false)
let globalTplsLoaded = false

async function loadGlobalTemplates() {
  if (globalTplsLoaded) return
  loadingGlobalTpls.value = true
  try {
    const snap = await getDocs(query(collection(db, 'smsTemplates'), orderBy('createdAt', 'desc')))
    globalTemplates.value = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.active !== false)
    globalTplsLoaded = true
  } catch (e) {
    console.error('Failed to load global templates', e)
  } finally {
    loadingGlobalTpls.value = false
  }
}

const globalTplsForWa  = computed(() => globalTemplates.value.filter(t =>
  t.category === campDialogType.value && (t.channel === 'whatsapp' || t.channel === 'both')))
const globalTplsForSms = computed(() => globalTemplates.value.filter(t =>
  t.category === campDialogType.value && (t.channel === 'sms' || t.channel === 'both')))

function useGlobalTemplate(channel, e) {
  const id = e.target.value
  e.target.value = ''
  if (!id) return
  const tpl = globalTemplates.value.find(t => t.id === id)
  if (!tpl) return
  if (channel === 'whatsapp') campDialogWaMessage.value = tpl.body ?? ''
  else campDialogSmsMessage.value = tpl.body ?? ''
}

async function saveCamp() {
  if (!campDialogName.value.trim()) return
  savingCamp.value = true
  try {
    const whatsappMessage = campDialogWaMessage.value.trim() || null
    const smsMessage      = campDialogSmsMessage.value.trim() || null
    if (editingCamp.value) {
      await setDoc(
        doc(db, 'events', eventId.value, 'campaigns', editingCamp.value.id),
        { name: campDialogName.value.trim(), whatsappMessage, smsMessage, updatedAt: new Date().toISOString() },
        { merge: true }
      )
      if (selectedCustomCamp.value?.id === editingCamp.value.id) {
        selectedCustomCamp.value = { ...selectedCustomCamp.value, name: campDialogName.value.trim(), whatsappMessage, smsMessage }
      }
    } else {
      await addDoc(collection(db, 'events', eventId.value, 'campaigns'), {
        name: campDialogName.value.trim(),
        type: campDialogType.value,
        whatsappMessage,
        smsMessage,
        createdAt: new Date().toISOString(),
      })
    }
    campDialogOpen.value = false
    await loadCustomCampaigns()
  } catch (e) {
    console.error('Failed to save campaign', e)
  } finally {
    savingCamp.value = false
  }
}

async function deleteCustomCampaign(camp) {
  if (!confirm(`Delete campaign "${camp.name}"? This cannot be undone.`)) return
  try {
    await deleteDoc(doc(db, 'events', eventId.value, 'campaigns', camp.id))
    if (selectedCustomCamp.value?.id === camp.id) {
      backToCampaignList()
    }
    await loadCustomCampaigns()
  } catch (e) {
    console.error('Failed to delete campaign', e)
  }
}

// ── Filtered attendees ─────────────────────────────────────────────────────────
const detailSearchQ = ref('')

const customFilteredAttendees = computed(() => {
  if (!selectedCustomCamp.value) return []
  const campIds  = mergedIdsOf(selectedCustomCamp.value)
  const status   = customStatus.value
  const labelId  = customLabelId.value
  const cardType = selectedCustomCamp.value.type
  // A canonical card-purpose campaign (see EventAttendees.vue selectCardOption)
  // targets the whole guest list, since it's the one that renders/issues the
  // card in the first place — nobody has att.cards[cardType] set yet. Same for
  // a plain message preset with no type at all (General Message, etc.) — it's
  // not tied to any specific card, so it shouldn't be scoped by card possession.
  const gateByCard = !selectedCustomCamp.value.cardPurpose && !!cardType
  const q        = detailSearchQ.value.trim().toLowerCase()

  return attendees.value.filter(att => {
    // Card campaigns render lazily at send time (see sendRecipPool) — an
    // attendee not having the card yet doesn't mean they're not a candidate.
    if (selectedCustomCamp.value.kind !== 'card' && (!att.cards || att.cards[cardType] == null)) return false
    if (labelId && !(att.labelIds ?? []).includes(labelId)) return false
    if (q && !(att.fullName ?? '').toLowerCase().includes(q) && !(att.phone ?? '').includes(q)) return false
    const s = bestStatusAcrossIds(att, detailChannel.value, campIds)
    if (status === 'all') return true
    if (status === 'unsent') return s === null
    return s === status
  })
})

function getCustomStatus(att, channel = detailChannel.value) {
  if (!selectedCustomCamp.value) return null
  return bestStatusAcrossIds(att, channel, mergedIdsOf(selectedCustomCamp.value))
}

const customStatusCounts = computed(() => {
  if (!selectedCustomCamp.value) return { all: 0, unsent: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
  const campIds  = mergedIdsOf(selectedCustomCamp.value)
  const cardType = selectedCustomCamp.value.type
  const gateByCard = !selectedCustomCamp.value.cardPurpose && !!cardType
  const labelId  = customLabelId.value
  const base = attendees.value.filter(att => {
    if (selectedCustomCamp.value.kind !== 'card' && (!att.cards || att.cards[cardType] == null)) return false
    if (labelId && !(att.labelIds ?? []).includes(labelId)) return false
    return true
  })
  const counts = { all: base.length, unsent: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
  for (const att of base) {
    const s = bestStatusAcrossIds(att, detailChannel.value, campIds)
    if (!s) counts.unsent++
    else if (counts[s] !== undefined) counts[s]++
  }
  return counts
})

// "Sent" in the detail header means total dispatched (attempted), not the
// narrower 'sent-but-not-yet-delivered' bucket — everyone who isn't still
// sitting unsent for this channel.
const detailDispatchedCount = computed(() => customStatusCounts.value.all - customStatusCounts.value.unsent)

const detailFilterPopoverOpen = ref(false)
const detailFilterTriggerRef  = ref(null)
const detailFilterMenuRef     = ref(null)
const detailActiveFilterCount = computed(() =>
  (customStatus.value !== 'all' ? 1 : 0) + (customLabelId.value ? 1 : 0)
)

// ── Detail pagination ──────────────────────────────────────────────────────────
const detailPage       = ref(1)
const DETAIL_PAGE_SIZE = 10

const detailTotalPages = computed(() => Math.max(1, Math.ceil(customFilteredAttendees.value.length / DETAIL_PAGE_SIZE)))
const pagedDetailAttendees = computed(() => {
  const start = (detailPage.value - 1) * DETAIL_PAGE_SIZE
  return customFilteredAttendees.value.slice(start, start + DETAIL_PAGE_SIZE)
})
const detailPageNumbers = computed(() => {
  const total = detailTotalPages.value, cur = detailPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (cur > 3) pages.push('…')
  const start = Math.max(2, cur - 1)
  const end   = Math.min(total - 1, cur + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (cur < total - 2) pages.push('…')
  if (total > 1) pages.push(total)
  return pages
})
function detailGoPage(n) { if (n >= 1 && n <= detailTotalPages.value) detailPage.value = n }
watch(customFilteredAttendees, () => { detailPage.value = 1 })

// ── Drawer recipient model ────────────────────────────────────────────────────
// null = nothing chosen yet — the safe default. A bulk mode like 'unsent' is
// a genuinely heavy action (every unsent recipient, no confirmation beyond
// the Send button itself) and shouldn't be pre-armed just from opening the
// drawer; the organizer has to actually pick a status (or specific
// attendees) before sendRecipients below resolves to anyone at all.
const sendRecipMode    = ref(null)
// undefined = "not chosen yet" (the safe default, forces a deliberate pick
// before anyone's included); null = the explicit, deliberate "All Groups"
// choice — a real option in the dropdown, not the implicit starting state.
const sendLabelId      = ref(undefined)
const recipDropOpen    = ref(false)
// Teleported to <body> — the drawer otherwise clips/dims it via its own
// overflow and transform, which is what made this dropdown look transparent
// in place. Once teleported, the menu is no longer a DOM descendant of
// .em-recip-dd, so a generic v-click-outside on that wrapper would treat
// every click inside the menu as "outside" and close it on mousedown before
// the option's own click handler ever runs — tracked via an explicit menu
// ref instead. See handleFilterDdOutsideClick below.
const recipDdTriggerRef = ref(null)
const recipDdMenuRef    = ref(null)
const recipDdPos        = ref({ top: 0, left: 0, width: 0 })
function toggleRecipDd() {
  if (!recipDropOpen.value) {
    const r = recipDdTriggerRef.value.getBoundingClientRect()
    recipDdPos.value = { top: r.bottom + 4, left: r.left, width: r.width }
  }
  recipDropOpen.value = !recipDropOpen.value
}
const pickOpen         = ref(false)
const drawerPickList   = ref([])
const drawerPickSearch = ref('')
const recipModalOpen   = ref(false)
const recipDraftIds    = ref([])
const recipSearch      = ref('')
const recipStatusFilter = ref('all')
const recipDraftSet    = computed(() => new Set(recipDraftIds.value))

const sendRecipPool = computed(() => {
  if (!selectedCustomCamp.value) return []
  // Every send path now either renders a card on demand server-side at
  // send time (kind:'card', or a cardPurpose campaign — see executeSend)
  // or sends genuinely card-less plain text (the Pledge/RSVP/Meeting/
  // General Reminder presets — see executeSendPlainSms / routes/
  // campaigns.js's purpose-optional handling). Neither case requires an
  // attendee to already have some unrelated card pre-rendered, so there's
  // nothing left to filter the pool by here.
  return attendees.value
})

const sendStatusCounts = computed(() => {
  const counts = { all: 0, unsent: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
  if (!selectedCustomCamp.value) return counts
  const campIds = mergedIdsOf(selectedCustomCamp.value)
  const pool = sendRecipPool.value
  counts.all = pool.length
  for (const att of pool) {
    const s = bestStatusAcrossIds(att, sendChannel.value, campIds)
    if (!s) counts.unsent++
    else if (counts[s] !== undefined) counts[s]++
  }
  return counts
})

function guestSendStatus(att) {
  if (!selectedCustomCamp.value) return 'unsent'
  return bestStatusAcrossIds(att, sendChannel.value, mergedIdsOf(selectedCustomCamp.value)) || 'unsent'
}

const drawerPickFiltered = computed(() => {
  const q = drawerPickSearch.value.trim().toLowerCase()
  if (!q) return sendRecipPool.value
  return sendRecipPool.value.filter(a =>
    (a.fullName ?? '').toLowerCase().includes(q) || (a.phone ?? '').includes(q)
  )
})

const sendRecipients = computed(() => {
  if (!drawerPickList.value.length) return []
  const ids = new Set(drawerPickList.value)
  return sendRecipPool.value.filter(a => ids.has(a.id))
})

const sendRecipCount = computed(() => sendRecipients.value.length)

function drawerPickToggle(att) {
  const i = drawerPickList.value.indexOf(att.id)
  if (i === -1) drawerPickList.value.push(att.id)
  else drawerPickList.value.splice(i, 1)
}
function drawerPickSelectAll() {
  const ids = drawerPickFiltered.value.map(a => a.id)
  const allIn = ids.every(id => drawerPickList.value.includes(id)) && ids.length > 0
  if (allIn) drawerPickList.value = drawerPickList.value.filter(id => !ids.includes(id))
  else ids.forEach(id => { if (!drawerPickList.value.includes(id)) drawerPickList.value.push(id) })
}

const recipFilteredGroups = computed(() => {
  const labels = props.event?.labels ?? []
  const q = recipSearch.value.trim().toLowerCase()
  if (!q) return labels
  return labels.filter(l => (l.name ?? '').toLowerCase().includes(q))
})
const recipFilteredGuests = computed(() => {
  const q = recipSearch.value.trim().toLowerCase()
  const labels = props.event?.labels ?? []
  const filter = recipStatusFilter.value
  return sendRecipPool.value.filter(a => {
    if (filter !== 'all' && guestSendStatus(a) !== filter) return false
    if (!q) return true
    if ((a.fullName ?? '').toLowerCase().includes(q) || (a.phone ?? '').includes(q)) return true
    return (a.labelIds ?? []).some(id => (labels.find(l => l.id === id)?.name ?? '').toLowerCase().includes(q))
  })
})
const recipDraftAttendees = computed(() => sendRecipPool.value.filter(a => recipDraftSet.value.has(a.id)))
const recipVisibleAllSelected = computed(() => {
  const list = recipFilteredGuests.value
  return list.length > 0 && list.every(a => recipDraftSet.value.has(a.id))
})
const groupIdsByLabel = computed(() => {
  const map = {}
  for (const a of sendRecipPool.value) {
    for (const id of a.labelIds ?? []) (map[id] ??= []).push(a.id)
  }
  return map
})
const groupCountMap = computed(() => {
  const map = {}
  for (const [id, ids] of Object.entries(groupIdsByLabel.value)) map[id] = ids.length
  return map
})
const groupStateMap = computed(() => {
  const selected = recipDraftSet.value
  const map = {}
  for (const [labelId, ids] of Object.entries(groupIdsByLabel.value)) {
    const n = ids.filter(id => selected.has(id)).length
    map[labelId] = n === 0 ? 'off' : n === ids.length ? 'on' : 'mixed'
  }
  return map
})
const statusIdsByKey = computed(() => {
  const map = { all: sendRecipPool.value.map(a => a.id), unsent: [], sent: [], delivered: [], read: [], failed: [] }
  if (!selectedCustomCamp.value) return map
  const campIds = mergedIdsOf(selectedCustomCamp.value)
  for (const att of sendRecipPool.value) {
    const s = bestStatusAcrossIds(att, sendChannel.value, campIds) || 'unsent'
    if (map[s]) map[s].push(att.id)
  }
  return map
})
const statusStateMap = computed(() => {
  const selected = recipDraftSet.value
  const map = {}
  for (const [key, ids] of Object.entries(statusIdsByKey.value)) {
    if (!ids.length) { map[key] = 'off'; continue }
    const n = ids.filter(id => selected.has(id)).length
    map[key] = n === 0 ? 'off' : n === ids.length ? 'on' : 'mixed'
  }
  return map
})
const SG_STATUS_COLORS = {
  unsent: '#C9A84C', sent: '#3b82f6', delivered: '#10b981',
  read: '#0ea5e9', failed: '#ef4444', all: '#64748b',
}
function toggleGroup(labelId) {
  const ids = groupIdsByLabel.value[labelId] ?? []
  if (groupStateMap.value[labelId] === 'on') {
    const drop = new Set(ids)
    recipDraftIds.value = recipDraftIds.value.filter(id => !drop.has(id))
  } else {
    recipDraftIds.value = [...new Set([...recipDraftIds.value, ...ids])]
  }
}
function chooseStatus(key) {
  recipStatusFilter.value = key
  const ids = statusIdsByKey.value[key] ?? []
  if (!ids.length) return
  if (statusStateMap.value[key] === 'on') {
    const drop = new Set(ids)
    recipDraftIds.value = recipDraftIds.value.filter(id => !drop.has(id))
  } else {
    recipDraftIds.value = [...new Set([...recipDraftIds.value, ...ids])]
  }
}
function toggleDraftGuest(id) {
  if (recipDraftSet.value.has(id)) recipDraftIds.value = recipDraftIds.value.filter(x => x !== id)
  else recipDraftIds.value = [...recipDraftIds.value, id]
}
function selectAllVisibleGuests() {
  const ids = recipFilteredGuests.value.map(a => a.id)
  if (recipVisibleAllSelected.value) {
    const drop = new Set(ids)
    recipDraftIds.value = recipDraftIds.value.filter(id => !drop.has(id))
  } else {
    recipDraftIds.value = [...new Set([...recipDraftIds.value, ...ids])]
  }
}
function openRecipModal() {
  recipDraftIds.value = [...drawerPickList.value]
  recipSearch.value = ''
  recipStatusFilter.value = 'all'
  recipModalOpen.value = true
}
function closeRecipModal() { recipModalOpen.value = false }
function commitRecipModal() {
  drawerPickList.value = [...recipDraftIds.value]
  recipModalOpen.value = false
}
function goEditGuestList() {
  recipModalOpen.value = false
  router.push(`/event/${eventId.value}/attendees`)
}
function onSgBackdropDown(e) {
  if (e.target === e.currentTarget) closeRecipModal()
}
function onSgKeydown(e) {
  if (e.key === 'Escape' && recipModalOpen.value) closeRecipModal()
}
watch(recipModalOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) window.addEventListener('keydown', onSgKeydown)
  else window.removeEventListener('keydown', onSgKeydown)
})
function labelFg(lbl) {
  const v = lbl?.colorValue
  if (!v) return '#475569'
  if (typeof v === 'string') return v
  return `rgb(${(v >> 16) & 0xFF},${(v >> 8) & 0xFF},${v & 0xFF})`
}
function labelBg(lbl) {
  const v = lbl?.colorValue
  if (!v) return '#f1f5f9'
  if (typeof v === 'string') return v + '22'
  return `rgba(${(v >> 16) & 0xFF},${(v >> 8) & 0xFF},${v & 0xFF},0.12)`
}

// ── Send drawer ────────────────────────────────────────────────────────────────
// Deep-linked in? Then this is open before the first paint. <Transition> does
// not animate on initial render, so the composer simply *is* the screen from
// frame one — no fade/slide window for the page behind it to show through.
const sendDrawerOpen   = ref(deepLinkSend)
const sendCampaign     = ref(null)
const sendChannel      = ref('sms')
const templates        = ref([])
const selectedTemplate = ref(null)
const loadingTemplates = ref(false)
const sending          = ref(false)
const sendResult       = ref(null)
// Live progress for a card-campaign send (kind:'card') — haflaway_server
// responds immediately with a runId and keeps rendering+dispatching in the
// background, streaming counts into this sendRuns doc as it goes.
const activeSendRun    = ref(null)
let unsubSendRun = null
function stopWatchingSendRun() {
  if (unsubSendRun) { unsubSendRun(); unsubSendRun = null }
  activeSendRun.value = null
}
const sendRunFailedCount = computed(() => {
  const c = activeSendRun.value?.counts ?? {}
  return (c.renderFailed ?? 0) + (c.sendFailed ?? 0)
})
const sendRunProcessed = computed(() => (activeSendRun.value?.counts?.sent ?? 0) + sendRunFailedCount.value)
const sendRunPct = computed(() => {
  const total = activeSendRun.value?.total ?? 0
  return total ? Math.min(100, Math.round((sendRunProcessed.value / total) * 100)) : 0
})
const sendProgressOpen = computed(() =>
  sending.value || !!(activeSendRun.value && !activeSendRun.value.finishedAt)
)
// Keeps the same modal open once a send finishes instead of dropping straight
// back to the drawer underneath — the result (sendResult) is rendered as a
// second state inside that modal (see the em-sp Teleport below) rather than
// as a separate inline banner in the drawer body.
const sendModalOpen = computed(() => sendProgressOpen.value || !!sendResult.value)

// Set only when this drawer was deep-linked open from elsewhere (e.g. the
// Guest List "Send" flow) — closing it should then hand the user back to
// where they came from instead of stranding them on this campaign's detail
// view, which they never asked to visit.
const deepLinkReturnTo = ref(deepLinkSend ? (route.query.returnTo ?? null) : null)

const canSend = computed(() => {
  if (sending.value || sendRecipCount.value === 0) return false
  if (sendChannel.value === 'whatsapp') {
    // Card templates are fully pre-authored (the card image IS the content) —
    // no separate custom message to fill in, unlike the general/bulk templates
    // this composer was built for.
    if (selectedCustomCamp.value?.kind === 'card') return !!selectedTemplate.value
    return !!selectedTemplate.value && !!selectedCustomCamp.value?.whatsappMessage
  }
  // Same exception for SMS: haflaway_server falls back to its own
  // DEFAULT_SMS_CONTENT_BY_PURPOSE when a card campaign has no smsMessage set
  // (which is always true unless someone's used "Edit message" to override
  // it) — it is never actually "sent blank" the way a plain campaign's would be.
  if (selectedCustomCamp.value?.kind === 'card') return true
  return !!selectedCustomCamp.value?.smsMessage
})

// Live preview — mirrors exactly what executeSend() actually transmits per
// channel (see the `body` it builds), so what's shown here never drifts from
// what gets sent.
const previewMessage = computed(() => {
  if (sendChannel.value === 'whatsapp') return selectedTemplate.value?.content ?? ''
  return selectedCustomCamp.value?.smsMessage ?? ''
})
const previewParts = computed(() => previewMessage.value.split(/(\{\{[^}]+\}\})/g).filter(Boolean))
function isVarToken(part) { return /^\{\{[^}]+\}\}$/.test(part) }

const previewEventDate = computed(() => {
  const d = props.event?.startDate
  if (!d) return 'The celebration'
  const date = d.toDate ? d.toDate() : new Date(d)
  if (Number.isNaN(date.getTime())) return 'The celebration'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

async function openCustomSend() {
  sendCampaign.value = selectedCustomCamp.value.id
  sendChannel.value  = 'sms'
  sendResult.value   = null
  sendRecipMode.value = null
  sendLabelId.value = undefined
  pickOpen.value = false
  drawerPickList.value = []
  drawerPickSearch.value = ''
  sendDrawerOpen.value = true

  // Resume an in-flight run for this campaign if one exists — e.g. the tab
  // was closed or the connection dropped mid-send — instead of showing a
  // blank compose form over a batch that's still actually running
  // server-side.
  if (selectedCustomCamp.value?.kind === 'card') {
    try {
      const runsCol = collection(db, 'events', eventId.value, 'campaigns', sendCampaign.value, 'sendRuns')
      const snap = await getDocs(query(runsCol, where('finishedAt', '==', null), limit(1)))
      if (!snap.empty) {
        const run = snap.docs[0]
        sendChannel.value = run.data().channel ?? sendChannel.value
        sending.value = true
        watchSendRun(run.id)
        return
      }
    } catch (e) {
      console.error('Failed to check for an in-flight send run', e)
    }
  }

  loadSendTemplates()
}

function onChannelChange(ch) {
  sendChannel.value = ch
  selectedTemplate.value = null
  loadSendTemplates()
}

function closeSendDrawer() {
  // Stop listening — the server-side run (if any) keeps going and still marks
  // the campaign 'sent' on its own; this only drops this tab's live updates.
  stopWatchingSendRun()
  // The deep link is spent either way — otherwise an in-flight campaigns fetch
  // that lands after this close would walk back in and re-open the composer.
  deepLinkPending = false
  const target = safeReturnTo(deepLinkReturnTo.value)
  if (target) {
    deepLinkReturnTo.value = null
    // Deliberately leave composerOnly/sendDrawerOpen set: router.push is async
    // (lazy route chunk + async guard), so clearing them here would commit this
    // page's detail view to the DOM and leave it on screen for the whole
    // navigation. Letting the unmount take the teleported drawer with it means
    // nothing of this page ever paints.
    router.push(target)
    return
  }
  deepLinkReturnTo.value = null
  sendDrawerOpen.value = false
  // Deep-linked without a usable returnTo (hand-typed URL): this campaign's
  // detail view is the only sensible destination, so reveal it and clear params.
  if (composerOnly.value) exitComposerOnly()
}

// `returnTo` is attacker-controllable (it's just a query param) and can arrive as
// an array if the key is repeated, which would throw inside router.push. Only
// same-origin app paths are worth honouring.
function safeReturnTo(v) {
  return typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : null
}

async function loadSendTemplates() {
  if (!eventId.value || sendChannel.value !== 'whatsapp') {
    templates.value = []
    selectedTemplate.value = null
    return
  }
  loadingTemplates.value = true
  templates.value = []
  selectedTemplate.value = null
  try {
    // WhatsApp templates are pre-approved and admin-managed (read only here).
    // A card-send campaign (kind:'card') needs its purpose's own
    // invitation-lifecycle category — same one the Invitations screen uses —
    // since those templates are fully pre-authored with the card baked in.
    // Anything else (the plain Message flow) stays on the general/bulk
    // category this composer was originally built for.
    const lang = props.event?.language ?? 'sw'
    const isCard = selectedCustomCamp.value?.kind === 'card'
    const category = isCard
      ? (CARD_PURPOSE_WHATSAPP_CATEGORY[selectedCustomCamp.value.type] ?? GENERAL_CAMPAIGN_CATEGORY)
      : GENERAL_CAMPAIGN_CATEGORY

    const [snap] = await Promise.all([
      getDocs(query(collection(db, 'messageTemplates'), where('category', '==', category), where('language', '==', lang))),
      // Loaded fresh per drawer-open (not cached) so a credential/approval
      // change on the Organization screen is reflected the next time this
      // drawer opens, same as smsCredentialsStatus elsewhere.
      props.event?.orgId ? loadTwilioCredentialsStatus(props.event.orgId) : Promise.resolve(),
    ])
    const globalTpls = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.active !== false)

    // If this org has its own approved Twilio credentials AND a template
    // registered for this exact category+language, surface it as an extra,
    // clearly-marked option — picking it sends `templateId` as that
    // contentSid, which haflaway_server's campaigns.js matches against the
    // org's own registration to decide whether to send through the org's
    // Twilio account instead of Haflaway's shared one. This is purely a UI
    // convenience for surfacing the choice; the server re-derives the match
    // itself rather than trusting a flag from here.
    const ownTpl = isCard && twilioCredentialsStatus.value.brandingApproved
      ? twilioCredentialsStatus.value.templates.find(t => t.category === category && t.language === lang)
      : null
    // Once this org has its own approved template for this exact
    // category+language, its own account is the only sensible choice for it
    // — same "org's own always wins" precedent as the SMS provider
    // resolution (resolveEffectiveProvider). Haflaway's shared-library
    // options for this category+language are hidden rather than offered
    // alongside it, so there's no ambiguity about which account a send
    // actually goes out on.
    if (ownTpl) {
      templates.value = [{
        id: ownTpl.contentSid,
        content: `Your own ${campaignTypeLabel(selectedCustomCamp.value.type)} template — sent via your Twilio account`,
        language: lang,
        own: true,
      }]
    } else {
      templates.value = globalTpls
    }
    if (templates.value.length === 1) selectedTemplate.value = templates.value[0]
  } catch (e) {
    console.error('Failed to load templates', e)
  } finally {
    loadingTemplates.value = false
  }
}

async function executeSendCard() {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const idToken = await user.getIdToken()
  const campaignId = selectedCustomCamp.value.id
  const res = await fetch(
    `${CARD_SERVER_URL}/events/${eventId.value}/campaigns/${campaignId}/send`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attendeeIds: sendRecipients.value.map(a => a.id),
        channel: sendChannel.value,
        purpose: selectedCustomCamp.value.cardPurpose,
      }),
    }
  )
  const data = await res.json()
  if (res.status === 409 && data.runId) {
    // Another click/tab already has a run going for this campaign — attach to
    // it instead of erroring, so progress still shows correctly.
    watchSendRun(campaignId, data.runId)
    return
  }
  if (!res.ok || !data.ok) {
    sendResult.value = { ok: false, message: data.message ?? `Request failed (${res.status}).` }
    return
  }
  // The batch keeps running on the card server after this returns — progress
  // streams in live via the sendRuns doc this now starts watching, the same
  // way Sent/Unsent counts elsewhere on this screen stay live off Firestore.
  watchSendRun(campaignId, data.runId)
  drawerPickList.value = []
}

async function executeSend() {
  if (!canSend.value) return
  if (selectedCustomCamp.value?.kind === 'card') {
    await executeCardSend()
    return
  }
  // A plain SMS blast (no cardPurpose) now goes through haflaway_server too
  // — same as executeCardSend/executeSendCard — so it gets the org-aware
  // provider/credential resolution and self-service sender IDs instead of
  // always sending through Haflaway's shared account via the legacy
  // sendSMSAction Cloud Function. WhatsApp's card-less path stays on that
  // legacy function below — there's no BYO-credential concept for WhatsApp,
  // so there was nothing to fix there.
  if (!selectedCustomCamp.value?.cardPurpose && sendChannel.value === 'sms') {
    await executeSendPlainSms()
    return
  }
  sending.value = true
  sendResult.value = null
  try {
    if (selectedCustomCamp.value?.cardPurpose) {
      await executeSendCard()
      return
    }
    // Only WhatsApp with no cardPurpose can reach here — the SMS case was
    // routed to executeSendPlainSms() above, and executeSendCard() handles
    // any cardPurpose campaign on either channel.
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    const body = { templateId: selectedTemplate.value.id, type: sendCampaign.value, eventId: eventId.value, attendeesIds: sendRecipients.value.map(a => a.id), kardType: null }
    const res  = await fetch(WSP_URL, { method: 'POST', headers: { Authorization: `Bearer ${user.uid}` }, body: JSON.stringify(body) })
    const data = await res.json()
    // The Cloud Function only aggregates counts into `data.message` ("Action
    // completed with 1 failure(s)…") — the actual per-recipient reason lives
    // in `data.details.failures[]` and was otherwise silently dropped here,
    // leaving no way to tell why a send failed short of reading function logs.
    let message = data.message ?? (data.status ? 'Done.' : 'Request failed.')
    const reasons = (data.details?.failures ?? []).map(f => f.error || f.reason).filter(Boolean)
    if (reasons.length) message += ' — ' + [...new Set(reasons)].slice(0, 3).join('; ')
    sendResult.value = { ok: data.status === true, message }
    if (data.status) {
      await load()
      drawerPickList.value = []
      if (selectedCustomCamp.value && selectedCustomCamp.value.status !== 'sent') {
        try {
          await setDoc(doc(db, 'events', eventId.value, 'campaigns', sendCampaign.value), { status: 'sent' }, { merge: true })
          selectedCustomCamp.value = { ...selectedCustomCamp.value, status: 'sent' }
          const idx = customCampaigns.value.findIndex(c => c.id === sendCampaign.value)
          if (idx !== -1) customCampaigns.value[idx] = { ...customCampaigns.value[idx], status: 'sent' }
        } catch (e) {
          console.error('Failed to mark campaign as sent', e)
        }
      }
      msgTab.value = 'sent'
      router.replace({ query: { ...route.query, tab: 'sent' } })
    }
  } catch (e) {
    sendResult.value = { ok: false, message: e.message }
  } finally {
    sending.value = false
  }
}

// A plain SMS text blast — no card, no purpose, message comes straight from
// the campaign doc's own smsMessage field. Same haflaway_server endpoint as
// executeCardSend, just with no `purpose` in the body, which tells the
// server to skip card rendering entirely (see routes/campaigns.js).
async function executeSendPlainSms() {
  sending.value = true
  sendResult.value = null
  stopWatchingSendRun()
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    const idToken = await user.getIdToken()
    const body = { attendeeIds: sendRecipients.value.map(a => a.id), channel: 'sms' }

    const res = await fetch(`${CARD_SERVER_URL}/events/${eventId.value}/campaigns/${sendCampaign.value}/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.status === 409 && data.runId) {
      watchSendRun(data.runId)
      return
    }
    if (!res.ok || !data.ok) {
      sendResult.value = { ok: false, message: data.message ?? `Request failed (${res.status}).` }
      sending.value = false
      return
    }
    watchSendRun(data.runId)
    drawerPickList.value = []
  } catch (e) {
    sendResult.value = { ok: false, message: e.message }
    sending.value = false
  }
}

// Card campaigns (kind:'card') go through haflaway_server instead: it renders
// each attendee's card on demand (reusing one already rendered, per its lazy-
// cache design) and only then dispatches — so every explicitly selected
// recipient is eligible here regardless of whether they already have a card,
// unlike the old Cloud-Function path above which required one to already exist.
// The endpoint responds immediately with a runId and keeps going in the
// background; watchSendRun() below picks up live progress from Firestore.
async function executeCardSend() {
  sending.value = true
  sendResult.value = null
  stopWatchingSendRun()
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    const idToken = await user.getIdToken()
    const attendeeIds = sendRecipients.value.map(a => a.id)
    const body = { attendeeIds, channel: sendChannel.value, purpose: selectedCustomCamp.value.type }
    // Pass the template the user actually picked through rather than letting
    // the server pick one on its own (it'd otherwise just take whichever
    // approved template comes back first for this purpose/language).
    if (sendChannel.value === 'whatsapp') body.templateId = selectedTemplate.value?.id

    const res = await fetch(`${CARD_SERVER_URL}/events/${eventId.value}/campaigns/${sendCampaign.value}/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.message || `Request failed (HTTP ${res.status}).`)
    watchSendRun(data.runId)
  } catch (e) {
    sendResult.value = { ok: false, message: e.message }
    sending.value = false
  }
}

function watchSendRun(runId) {
  const runRef = doc(db, 'events', eventId.value, 'campaigns', sendCampaign.value, 'sendRuns', runId)
  unsubSendRun = onSnapshot(runRef, (snap) => {
    const run = snap.data()
    if (!run) return
    activeSendRun.value = run
    if (!run.finishedAt) return

    stopWatchingSendRun()
    sending.value = false
    const counts = run.counts ?? {}
    const ok = (counts.sent ?? 0) > 0
    // Counts drive the stat tiles in the result modal (em-sp-stats below);
    // `message` is now just the optional per-recipient failure reasons, not
    // the whole sentence — the tiles say the numbers, this only adds why.
    const reasons = Object.values(run.results ?? {}).map(r => r.error).filter(Boolean)
    const message = reasons.length ? [...new Set(reasons)].slice(0, 3).join('; ') : ''
    sendResult.value = {
      ok,
      message,
      counts: { sent: counts.sent ?? 0, renderFailed: counts.renderFailed ?? 0, sendFailed: counts.sendFailed ?? 0, total: run.total ?? 0 },
    }

    load()
    drawerPickList.value = []
    if (ok) {
      // The server itself already writes the campaign doc's status:'sent'
      // once at least one recipient goes through — just reflect that locally.
      selectedCustomCamp.value = { ...selectedCustomCamp.value, status: 'sent' }
      const idx = customCampaigns.value.findIndex(c => c.id === sendCampaign.value)
      if (idx !== -1) customCampaigns.value[idx] = { ...customCampaigns.value[idx], status: 'sent' }
      msgTab.value = 'sent'
      router.replace({ query: { ...route.query, tab: 'sent' } })
    }
  }, (err) => {
    console.error('sendRuns listener failed:', err)
    sendResult.value = { ok: false, message: err.message }
    sending.value = false
    stopWatchingSendRun()
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/).filter(Boolean)
  return p.length === 1 ? (p[0][0] ?? '?').toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
function nameHash(s) { let h = 0; for (let i = 0; i < (s?.length ?? 0); i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
function avatarBg(n) { return `hsl(${nameHash(n ?? '') % 360}, 65%, 92%)` }
function avatarFg(n) { return `hsl(${nameHash(n ?? '') % 360}, 60%, 26%)` }
function formatDate(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) } catch { return '—' } }

onMounted(() => { load(); loadCustomCampaigns() })
watch(eventId, () => { if (eventId.value) { load(); loadCustomCampaigns() } })
</script>

<style scoped>
.em-composer-loading {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  color: var(--c-txt-2);
}
.em-root {
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  background: #ffffff;
  --c-bg:     #ffffff;
  --c-border: #eef0f3;
  --c-track:  #f3f4f6;
  --c-muted:  #f4f5f7;
  --c-txt:    #111827;
  --c-txt-2:  #6b7280;
  --c-txt-3:  #9ca3af;
  --c-divide: #f1f3f9;
  --c-arrow:  #9ca3af;
  transition: background 300ms ease;
}

/* ── Unified Withjoy Hub Header ── */
.em-hub-hd {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 60px;
  flex-shrink: 0;
  background: #ffffff;
  border-bottom: none;
  padding: 0 32px;
  gap: 32px;
}
.em-hd-main {
  display: flex;
  align-items: center;
  gap: 14px;
}
.em-hd-burger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: none;
  border: none;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
  border-radius: 6px;
  transition: color 130ms, background 130ms;
}
.em-hd-burger:hover {
  background: #f3f4f6;
  color: #111827;
}
.em-hd-brand {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.em-hd-brand-logo {
  height: 26px;
  max-width: 110px;
  object-fit: contain;
  border-radius: 4px;
}
.em-hd-brand-script {
  font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-right: 2px;
}
.em-hd-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.em-hub-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.em-hub-badge {
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: 0.08em;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 2px 6px;
  text-transform: uppercase;
  line-height: 1.2;
}

/* ── Withjoy Header Tabs (inline in top bar) ── */
.em-msg-tabs {
  display: flex;
  align-items: center;
  gap: 28px;
  height: 100%;
  margin-left: 8px;
}
.em-msg-tab {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  padding: 0 2px;
  margin-top: 2px;
  transition: color 130ms, border-color 130ms;
}
.em-msg-tab:hover {
  color: #111827;
}
.em-msg-tab--active {
  color: #111827;
  font-weight: 600;
  border-bottom-color: #111827;
}
.em-msg-tab-count {
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  background: #f3f4f6;
  border-radius: 9999px;
  padding: 1px 7px;
}

.em-hub-hd-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* ── Share-report popover (ported from EventMessages.vue) ── */
.em-report-wrap {
  position: relative;
}
.em-report-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--c-txt);
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 7px 12px;
  cursor: pointer;
  white-space: nowrap;
}
.em-report-btn--active {
  border-color: var(--gold);
  color: var(--gold);
}
.em-report-pop {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 40;
  width: 300px;
  background: var(--c-panel, var(--c-bg));
  border: 1px solid var(--c-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  padding: 14px;
}
.em-report-pop-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--c-txt);
  margin: 0 0 8px;
}
.em-report-pop-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 10px;
  line-height: 1.4;
}
.em-report-url {
  font-size: 11.5px;
  color: #4b5563;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 8px 10px;
  word-break: break-all;
  margin-bottom: 10px;
}
.em-report-pop-acts {
  display: flex;
  gap: 8px;
}
.em-report-regen {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: 7px;
  padding: 6px 10px;
  cursor: pointer;
}
.em-report-copy {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: var(--gold);
  border: none;
  border-radius: 7px;
  padding: 6px 10px;
  cursor: pointer;
  flex: 1;
}

/* ── Withjoy Dashboard Canvas ── */
.em-msg-dash {
  max-width: 1240px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 36px 64px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.em-msg-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.em-sec-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.01em;
}

/* ── Withjoy Hero Template Cards ── */
.em-msg-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
@media (max-width: 960px) {
  .em-msg-tiles {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 540px) {
  .em-msg-tiles {
    grid-template-columns: 1fr;
  }
}

.em-msg-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
  text-align: center;
}
.em-msg-tile:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.em-msg-tile-box {
  width: 100%;
  height: 210px;
  background: #f4f5f7;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.02);
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), background 200ms ease, box-shadow 200ms ease;
}
.em-msg-tile:hover:not(:disabled) .em-msg-tile-box {
  transform: translateY(-3px);
  background: #ebedf1;
  box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0, 0, 0, 0.03);
}
.em-msg-tile-label {
  margin-top: 14px;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  transition: color 150ms, font-weight 150ms;
}
.em-msg-tile:hover:not(:disabled) .em-msg-tile-label {
  color: #111827;
  font-weight: 600;
}

/* ── Scheduled & Sent Grid (Withjoy style) ── */
.em-msg-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}
@media (max-width: 860px) {
  .em-msg-row {
    grid-template-columns: 1fr;
  }
}
.em-sub-col {
  display: flex;
  flex-direction: column;
}
.em-sub-card {
  background: #ffffff;
  border: 1px solid #eef0f3;
  border-radius: 16px;
  min-height: 270px;
  padding: 24px 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
}
.em-sub-card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  margin-bottom: 18px;
}
.em-sub-hd-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.em-sub-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.01em;
}
.em-pill-count {
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  background: #f3f4f6;
  border-radius: 9999px;
  padding: 2px 8px;
}
.em-view-all-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  padding: 0;
  transition: opacity 120ms;
}
.em-view-all-btn:hover {
  text-decoration: underline;
}
.em-sub-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.em-sub-card-body--center {
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px 0 6px;
}
.em-empty-cal-icon {
  color: #9ca3af;
  margin-bottom: 2px;
}
.em-empty-text {
  font-size: 14px;
  color: #6b7280;
  margin: 12px 0 18px;
  font-weight: 400;
}
.em-new-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #18181b;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;
  font-family: inherit;
}
.em-new-pill-btn:hover {
  background: #27272a;
  transform: translateY(-1px);
}

/* Sent message row list */
.em-sent-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.em-sent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 130ms;
}
.em-sent-item:hover {
  background: #f9fafb;
}
.em-sent-item:hover .em-msg-sent-acts {
  opacity: 1;
}
.em-sent-mail-icon {
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.em-sent-item-title {
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.em-sent-item-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  margin-left: 6px;
}
.em-sent-item-date {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
  margin-left: 12px;
  font-weight: 400;
}
.em-msg-sent-acts {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 130ms;
}
.em-msg-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: #6b7280;
  font-size: 13px;
}

/* ── Sent tab: withjoy-style full table ── */
.em-sent-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
.em-sent-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 0;
}
.em-sent-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 260px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 0 16px;
  height: 42px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: border-color 150ms, box-shadow 150ms;
}
.em-sent-search-wrap:focus-within {
  border-color: #18181b;
  box-shadow: 0 0 0 1px #18181b;
}
.em-sent-search {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: #18181b;
  padding-right: 8px;
}
.em-sent-search::placeholder { color: #9ca3af; font-size: 14px; }
.em-sent-search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 2px;
  margin-right: 4px;
  flex-shrink: 0;
}
.em-sent-search-clear:hover { color: #18181b; }
.em-sent-search-icon {
  flex-shrink: 0;
  color: #9ca3af;
}

.em-sent-type-dd { position: relative; }
.em-sent-type-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #18181b;
  cursor: pointer;
  white-space: nowrap;
  transition: all 130ms;
}
.em-sent-type-trigger:hover {
  background: #f4f5f7;
}
.em-sent-type-trigger--on {
  background: #f4f5f7;
  border-color: #e5e7eb;
  font-weight: 600;
}
.em-sent-tune-icon {
  flex-shrink: 0;
  color: #18181b;
}

.em-sent-type-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 190px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(0,0,0,0.08);
  padding: 6px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.em-sent-type-item {
  text-align: left;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 100ms;
}
.em-sent-type-item:hover { background: #f4f5f7; color: #18181b; }
.em-sent-type-item--on { background: #f4f5f7; color: #18181b; font-weight: 600; }

.em-sent-new-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 20px;
  background: #18181b !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 9999px !important;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: transform 120ms, background 120ms;
}
.em-sent-new-btn:hover {
  background: #27272a !important;
  transform: translateY(-1px);
}
.em-sent-new-btn:active {
  transform: translateY(0);
}

.em-sent-empty { min-height: 240px; }

/* Sent Table: Edge-to-edge minimalist luxury design */
.em-sent-table {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  width: 100%;
}
.em-sent-tbl-hd,
.em-sent-tbl-row {
  display: grid;
  grid-template-columns: 2.4fr 1.5fr 1.3fr 1.2fr 0.6fr 0.6fr 24px;
  align-items: center;
  gap: 16px;
  padding: 16px 8px;
}
.em-sent-tbl-hd {
  border-bottom: 1px solid #f0f2f5;
  font-size: 13px;
  font-weight: 500;
  color: #71717a;
  text-transform: none;
  letter-spacing: normal;
  padding-bottom: 14px;
}
.em-sent-tbl-row {
  width: 100%;
  background: none;
  border: none;
  border-bottom: 1px solid #f0f2f5;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  padding: 18px 8px;
  transition: background 150ms;
  border-radius: 6px;
}
.em-sent-tbl-row:hover {
  background: #fafafa;
}
.em-sent-col { min-width: 0; }
.em-sent-subject {
  font-size: 14.5px;
  font-weight: 700;
  color: #18181b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.em-sent-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: #374151;
}
.em-sent-type-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: #374151;
}
.em-recip-stack { display: flex; align-items: center; }
.em-recip-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: -0.02em;
  border: 2px solid #ffffff;
  margin-left: -6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.em-recip-avatar:first-child { margin-left: 0; }
.em-recip-more {
  margin-left: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: #71717a;
}
.em-recip-none { color: #9ca3af; font-size: 13.5px; }
.em-sent-col--date {
  font-size: 13.5px;
  color: #71717a;
}
.em-sent-col--sent {
  color: #18181b;
  font-size: 13.5px;
  font-weight: 500;
}
.em-sent-col--failed {
  color: #71717a;
  font-size: 13.5px;
  font-weight: 400;
}
.em-sent-num--bad {
  color: #ef4444 !important;
  font-weight: 600;
}
.em-sent-col--chev {
  display: flex;
  justify-content: flex-end;
  color: #9ca3af;
}

@media (max-width: 860px) {
  .em-sent-toolbar { flex-wrap: wrap; }
  .em-sent-search-wrap { max-width: none; flex-basis: 100%; }
  .em-sent-new-btn { margin-left: 0; }
  .em-sent-tbl-hd { display: none; }
  .em-sent-tbl-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 16px;
    row-gap: 8px;
    position: relative;
    padding: 16px 36px 16px 10px;
  }
  .em-sent-col--subject { flex: 1 1 100%; padding-right: 4px; white-space: normal; }
  .em-sent-col--chev { position: absolute; top: 16px; right: 10px; }
  .em-sent-col--type, .em-sent-col--recip, .em-sent-col--date, .em-sent-col--sent, .em-sent-col--failed {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .em-sent-col--type::before, .em-sent-col--recip::before, .em-sent-col--date::before, .em-sent-col--sent::before, .em-sent-col--failed::before {
    content: attr(data-label);
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.02em;
  }
}

/* ── Loading / empty states ── */
.em-loading-state { display: flex; align-items: center; gap: 10px; color: var(--c-txt-2); font-size: 14px; padding: 48px 0; justify-content: center; }
.em-empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; text-align: center; }
.em-empty-state--sm { padding: 40px 24px; }
.em-empty-icon  { margin-bottom: 16px; }
.em-empty-title { font-size: 16px; font-weight: 700; color: var(--c-txt); margin: 0 0 6px; }
.em-empty-sub   { font-size: 14px; color: var(--c-txt-2); margin: 0 0 16px; max-width: 300px; }

/* ── Action buttons (shared) ── */
.em-camp-item-btn {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--c-border);
  background: rgba(255,255,255,0.04); color: var(--c-txt-2); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 130ms;
}
.em-camp-item-btn:hover { background: var(--c-muted); color: var(--c-txt); }
.em-camp-item-btn--del:hover { background: rgba(255,69,58,0.08); color: #fc8181; border-color: rgba(255,69,58,0.25); }

/* Badge (still used by the send-drawer recipient picker) */
.eca-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
  border: 1px solid transparent;
}
.eca-badge--sent      { background: rgba(48,209,88,0.10);   color: #1D7A38; border-color: rgba(48,209,88,0.20); }
.eca-badge--delivered { background: rgba(48,209,88,0.10);   color: #1D7A38; border-color: rgba(48,209,88,0.20); }
.eca-badge--read      { background: rgba(52,183,241,0.10);  color: #0A84FF; border-color: rgba(52,183,241,0.20); }
.eca-badge--scheduled { background: rgb(from var(--gold) r g b / 0.10);  color: #B36800; border-color: rgb(from var(--gold) r g b / 0.20); }
.eca-badge--draft     { background: rgba(255,255,255,0.05); color: var(--c-txt-2); border-color: var(--c-border); }
.eca-badge--failed    { background: rgba(255,69,58,0.10);   color: #C41E1E; border-color: rgba(255,69,58,0.20); }
.eca-badge--unsent    { background: rgba(255,255,255,0.05); color: var(--c-txt-2); border-color: var(--c-border); }
.eca-badge--pending   { background: rgba(255,204,0,0.10);   color: #B36800; border-color: rgba(255,204,0,0.20); }
.eca-badge--undelivered { background: rgba(255,69,58,0.08); color: #C41E1E; border-color: rgba(255,69,58,0.15); }

/* Campaign list actions */
.eca-camp-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

/* Select-all bar */
.eca-selbar { display: flex; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--c-divide); background: #0d0d0d; }
.eca-selbar-cb { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.eca-selbar-lbl { font-size: 11px; font-weight: 700; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.5px; user-select: none; }

/* ── SMS status badges ── */
.em-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.em-badge--null, .em-badge--undefined { background: transparent; color: var(--c-txt-3); }
.em-badge--unsent      { background: rgba(255,255,255,0.06); color: var(--c-txt-2); }
.em-badge--sent        { background: rgba(255,159,10,0.12);  color: #f59e0b; }
.em-badge--delivered   { background: rgba(52,211,153,0.12);  color: #34d399; }
.em-badge--read        { background: rgba(99,179,237,0.12);  color: #63b3ed; }
.em-badge--failed      { background: rgba(255,69,58,0.12);   color: #fc8181; }
.em-badge--pending     { background: rgba(255,204,0,0.12);   color: #fbbf24; }
.em-badge--undelivered { background: rgba(255,69,58,0.08);   color: #fc8181; }

/* ── Skeleton ── */
.em-sk-name   { display: flex; align-items: center; gap: 9px; }
.em-sk-circle { width: 32px; height: 32px; border-radius: 8px; background: var(--c-track); flex-shrink: 0; animation: em-pulse 1.4s ease-in-out infinite; }
.em-sk-bar    { height: 12px; border-radius: 6px; background: var(--c-track); width: 90px; animation: em-pulse 1.4s ease-in-out infinite; }
.em-sk-bar--lg{ width: 130px; }
.em-sk-bar--sm{ width: 60px; }
@keyframes em-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.em-filter-select {
  height: 28px; padding: 0 8px; border: 1px solid var(--c-border); border-radius: 7px;
  background: var(--c-bg); font-size: 12px; color: var(--c-txt); outline: none; cursor: pointer; color-scheme: dark;
}
.em-filter-select:focus { border-color: var(--gold); }
.em-filter-select--drawer { height: 32px; font-size: 13px; flex: 1; }
.em-drawer-list-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.em-drawer-list-lbl { font-size: 11px; font-weight: 700; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }

/* ── Table footer / pagination ── */
.em-detail-footer {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 14px 4px 4px;
}
.em-range-lbl   { font-size: 13px; color: var(--c-txt-2); }
.em-paginator   { display: flex; align-items: center; gap: 4px; }
.em-paginator--disabled { opacity: 0.5; pointer-events: none; }
.em-page-btn    { min-width: 32px; height: 32px; padding: 0 8px; border-radius: 8px; border: 1px solid var(--c-border); background: #ffffff; font-size: 13px; font-weight: 500; color: var(--c-txt-2); cursor: pointer; transition: all 130ms; display: flex; align-items: center; justify-content: center; }
.em-page-btn:hover:not(:disabled) { background: var(--c-muted); }
.em-page-btn:disabled { opacity: 0.4; cursor: default; }
.em-page-btn--active { background: #111827; border-color: #111827; color: #ffffff; font-weight: 700; }
.em-page-btn--nav    { color: var(--c-txt-2); }
.em-page-ellipsis   { font-size: 13px; color: var(--c-txt-3); padding: 0 4px; }

/* ── Campaign detail page (withjoy-style) ── */
.em-detail-page {
  max-width: 1240px;
  margin: 0 auto;
  width: 100%;
  padding: 24px 36px 64px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.em-detail-crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
}
.em-crumb-link {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 13.5px;
  color: #6b7280;
  cursor: pointer;
  transition: color 120ms;
}
.em-crumb-link:hover {
  color: #111827;
  text-decoration: underline;
}
.em-crumb-sep {
  color: #d1d5db;
}
.em-crumb-current {
  color: #111827;
  font-weight: 600;
}

.em-detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.em-detail-heading-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.em-detail-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}
.em-detail-type-icon {
  display: flex;
  flex-shrink: 0;
}
.em-detail-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.25;
}
.em-detail-heading-acts {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-top: 2px;
}

.em-send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #18181b !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 9999px !important;
  font-size: 14px;
  font-weight: 600;
  height: 42px;
  padding: 0 22px !important;
  cursor: pointer;
  transition: all 150ms ease;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.em-send-btn:hover {
  background: #27272a !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.em-send-btn:active {
  transform: translateY(0);
}

.em-edit-camp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #ffffff !important;
  color: #18181b !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 9999px !important;
  font-size: 14px;
  font-weight: 500;
  height: 42px;
  padding: 0 18px !important;
  cursor: pointer;
  transition: all 150ms ease;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}
.em-edit-camp-btn:hover {
  background: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #000000 !important;
}
.em-edit-camp-btn:active {
  transform: translateY(0);
}

.em-detail-stats {
  display: flex;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}
.em-detail-stat-card {
  flex: 1;
  min-width: 0;
  padding: 24px 28px;
  background: transparent;
  border: none;
  border-right: 1px solid #f0f1f3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}
.em-detail-stat-card:last-child {
  border-right: none;
}
.em-detail-stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.em-detail-stat-val {
  font-size: 38px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  letter-spacing: -0.03em;
}
.em-detail-stat-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #9ca3af;
  flex-shrink: 0;
}
.em-detail-stat-icon--ok {
  color: #0d9488;
}
.em-detail-stat-icon--read {
  color: #2563eb;
}
.em-detail-stat-icon--bad {
  color: #9ca3af;
}
.em-detail-stat-lbl {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: -0.01em;
}
.em-detail-stat-card--ok .em-detail-stat-lbl {
  color: #0d9488;
}

/* ── Withjoy Search & Filter Toolbar ── */
.em-detail-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.em-detail-search-wrap {
  flex: 1;
  max-width: 320px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 0 16px;
  height: 42px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.em-detail-search-wrap:focus-within {
  border-color: #111827;
  box-shadow: 0 0 0 1px #111827;
}
.em-detail-search {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 13.5px;
  color: #111827;
}
.em-detail-search::placeholder {
  color: #9ca3af;
}

.em-detail-filter-dd {
  position: relative;
}
.em-detail-filter-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms ease;
}
.em-detail-filter-trigger:hover {
  background: #f9fafb;
  border-color: #cbd5e1;
}
.em-detail-filter-trigger--on {
  background: #f3f4f6;
  border-color: #111827;
}
.em-detail-filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9999px;
  background: #111827;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
}
.em-detail-filter-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
  padding: 16px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.em-detail-filter-menu-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.em-detail-filter-menu-lbl {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.em-detail-ch-toggle {
  display: flex;
  gap: 6px;
}
.em-detail-ch-pill {
  flex: 1;
  height: 32px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 120ms;
}
.em-detail-ch-pill:hover {
  color: #111827;
}
.em-detail-ch-pill--on {
  background: #111827;
  border-color: #111827;
  color: #ffffff;
}
.em-detail-filter-opts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.em-detail-filter-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  text-align: left;
  transition: background 120ms;
}
.em-detail-filter-opt:hover {
  background: #f3f4f6;
}
.em-detail-filter-opt--on {
  background: #f3f4f6;
  font-weight: 600;
  color: #111827;
}
.em-detail-filter-opt-lbl {
  flex: 1;
}
.em-detail-filter-opt-n {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
}
.em-detail-list-select {
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  font-size: 13px;
  color: #111827;
  outline: none;
  cursor: pointer;
}
.em-detail-filter-clear {
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
}
.em-detail-filter-clear:hover {
  color: #111827;
  text-decoration: underline;
}

/* ── Withjoy Recipients Table ── */
.em-detail-table-wrap {
  background: #ffffff;
  border: 1px solid #eef0f3;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}
.em-detail-table {
  display: flex;
  flex-direction: column;
}
.em-detail-tbl-hd,
.em-detail-tbl-row {
  display: grid;
  grid-template-columns: 1.8fr 1.4fr 1fr 1fr;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
}
.em-detail-tbl-hd {
  border-bottom: 1px solid #f0f1f3;
  font-size: 12px;
  font-weight: 600;
  color: #71717a;
  letter-spacing: 0.01em;
}
.em-detail-tbl-row {
  border-bottom: 1px solid #f4f5f7;
  transition: background 120ms ease;
}
.em-detail-tbl-row:last-child {
  border-bottom: none;
}
.em-detail-tbl-row:hover {
  background: #fafafa;
}
.em-detail-col {
  min-width: 0;
  font-size: 14px;
  color: #374151;
}
.em-detail-col--name {
  display: flex;
  align-items: center;
  gap: 12px;
}
.em-detail-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11.5px;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}
.em-detail-name {
  font-weight: 600;
  color: #18181b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.em-detail-col--delivery {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #52525b;
}
.em-detail-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 500;
  color: #18181b;
}
.em-detail-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.em-detail-status-pill--delivered .em-detail-status-dot {
  background: #10b981;
}
.em-detail-status-pill--sent .em-detail-status-dot {
  background: #f59e0b;
}
.em-detail-status-pill--read .em-detail-status-dot {
  background: #3b82f6;
}
.em-detail-status-pill--failed .em-detail-status-dot {
  background: #ef4444;
}
.em-detail-status-pill--unsent .em-detail-status-dot {
  background: #9ca3af;
}
.em-detail-date {
  color: #52525b;
  font-size: 13.5px;
}

@media (max-width: 720px) {
  .em-detail-title { font-size: 24px; }
  .em-detail-toolbar { flex-wrap: wrap; }
  .em-detail-search-wrap { max-width: none; flex-basis: 100%; }
  .em-detail-filter-menu { left: 0; right: auto; width: min(280px, 90vw); }
  .em-detail-tbl-hd { display: none; }
  .em-detail-tbl-row {
    display: flex; flex-wrap: wrap; align-items: center; column-gap: 16px; row-gap: 6px; padding: 13px 16px;
  }
  .em-detail-col--name { flex: 1 1 100%; }
  .em-detail-col--delivery::before { content: 'Delivery: '; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; }
  .em-detail-col--details::before { content: 'Date: '; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; }
}

/* ── Floating action bar ── */
.em-action-bar {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; background: #1a2236; border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5); white-space: nowrap;
  border: 1px solid var(--c-border); z-index: 200;
}
.em-action-count { font-size: 13px; font-weight: 600; color: var(--c-txt); }
.em-action-btn {
  display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 16px;
  border-radius: 8px; border: none; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: opacity 130ms; font-family: inherit;
}
.em-action-btn--sms { background: var(--gold); color: var(--gold-contrast); }
.em-action-btn--sms:hover { background: #d4b560; opacity: 1; }

/* ── Send Drawer (full-screen, two-column composer) ── */
.em-overlay { position: fixed; inset: 0; background: var(--overlay-bg); z-index: 1000; display: flex; align-items: stretch; justify-content: flex-end; }
.em-overlay--center { align-items: center; justify-content: center; }
.em-drawer  { width: 100%; max-width: 100%; height: 100%; background: #0f0f0f; display: flex; flex-direction: column; box-shadow: none; }
.em-drawer-header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 26px 48px; border-bottom: 1px solid var(--c-divide); }
.em-drawer-header-left { display: flex; align-items: center; gap: 12px; }

.em-send-progress-bar {
  flex-shrink: 0; display: flex; align-items: center; gap: 10px;
  padding: 10px 48px; background: rgba(184,146,77,0.08);
  border-bottom: 1px solid rgba(184,146,77,0.25); color: var(--gold, #b8924d);
  font-size: 13px;
}
.em-send-progress-text { white-space: nowrap; }
.em-send-progress-track {
  flex: 1; height: 5px; border-radius: 3px; background: rgba(184,146,77,0.15);
  overflow: hidden;
}
.em-send-progress-fill {
  height: 100%; background: var(--gold, #b8924d); border-radius: 3px;
  transition: width 240ms ease;
}
@media (max-width: 640px) {
  .em-send-progress-bar { padding: 10px 16px; flex-wrap: wrap; }
  .em-send-progress-track { flex-basis: 100%; }
}
/* Opens the same shared nav drawer as every other page's hamburger
   (useNavDrawer.js) — it renders as an overlay on top of this composer
   (EventLayout's drawer sits above the standard modal z-index layer, see
   .el-sidebar--drawer / .el-mobile-backdrop) rather than requiring this
   composer to close first. */
.em-drawer-burger {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; flex-shrink: 0;
  background: none; border: none; color: var(--c-txt); cursor: pointer; padding: 0;
  transition: opacity 130ms;
}
.em-drawer-burger:hover { opacity: 0.65; }
.em-drawer-title { font-size: 26px; font-weight: 800; letter-spacing: -0.3px; color: var(--c-txt); }
.em-drawer-close { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.06); border: none; cursor: pointer; color: var(--c-txt-2); display: flex; align-items: center; justify-content: center; transition: background 130ms; }
.em-drawer-close:hover { background: rgba(255,255,255,0.10); }
.em-drawer-body  { flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding: 44px 48px 60px; }
.em-drawer-grid { width: 100%; max-width: 1160px; display: grid; grid-template-columns: minmax(0,1fr) 360px; gap: 56px; align-items: start; }
.em-send-form { min-width: 0; }
.em-drawer-section {
  padding: 24px; margin-bottom: 20px; border-radius: 18px;
  background: rgba(255,255,255,0.025); border: 1px solid var(--c-divide);
}
.em-drawer-section:last-child { margin-bottom: 0; }
.em-drawer-section-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 16px; }
.em-custom-camp-display { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 12px; border: 1px solid rgb(from var(--gold) r g b / 0.3); background: rgb(from var(--gold) r g b / 0.06); font-size: 15px; font-weight: 600; color: var(--c-txt); }
.em-custom-camp-type { margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c-txt-2); text-transform: capitalize; }
.em-send-ch-toggle { display: flex; gap: 10px; }
.em-send-ch-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px; border-radius: 12px; border: 1px solid var(--c-border, #2a2a2a); background: var(--c-bg, #1c1c1f); font-size: 15px; font-weight: 500; color: var(--c-txt-2, #8a8a92); cursor: pointer; transition: all 130ms; }
.em-send-ch-btn:hover { border-color: #C9A84C; color: #C9A84C; }
.em-send-ch-btn--wsp, .em-send-ch-btn--sms { background: rgb(from var(--gold) r g b / 0.14); color: var(--gold); border-color: rgb(from var(--gold) r g b / 0.5); font-weight: 700; }
/* The Edit Campaign dialog reuses this toggle but is teleported outside
   .em-drawer--composer, so it never sees that scope's --cx-seg-* variables
   (the ones the composer's own copy of this toggle relies on via inline
   style). Give it its own self-contained, teleport-safe active/inactive
   look instead of inheriting variables that silently resolve to nothing
   here and make the *inactive* tab look selected. */
.em-dialog .em-send-ch-btn { background: #fff; color: #6b7280; border-color: #e5e7eb; }
.em-dialog .em-send-ch-btn--wsp, .em-dialog .em-send-ch-btn--sms {
  background: rgb(from var(--gold, #C9A84C) r g b / 0.14); color: var(--gold, #C9A84C);
  border-color: rgb(from var(--gold, #C9A84C) r g b / 0.5); font-weight: 700;
}
.em-selected-recip-display { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgb(from var(--gold) r g b / 0.3); background: rgb(from var(--gold) r g b / 0.06); font-size: 14px; color: var(--c-txt); }
.em-tpl-loading { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--gold); font-weight: 500; text-transform: none; letter-spacing: 0; }
.em-tpl-empty   { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--c-txt-2); padding: 12px; border: 0.8px dashed var(--c-border); border-radius: 10px; }
.em-msg-missing-warn {
  display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; margin-bottom: 10px;
  border-radius: 10px; background: rgba(255,159,10,0.08); border: 1px solid rgba(255,159,10,0.3);
  color: #f59e0b; font-size: 12px; line-height: 1.5;
}
.em-msg-missing-warn svg { flex-shrink: 0; margin-top: 1px; }
.em-msg-missing-warn-btn {
  background: none; border: none; padding: 0; color: #f59e0b; font-weight: 700; text-decoration: underline;
  cursor: pointer; font-family: inherit; font-size: inherit;
}
.em-tpl-list    { display: flex; flex-direction: column; gap: 8px; }
.em-tpl-item    { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-radius: 10px; border: 1px solid var(--c-border); background: var(--c-bg); cursor: pointer; transition: all 130ms; }
.em-tpl-item:hover { border-color: var(--gold); }
.em-tpl-item--active { border-color: rgba(226,232,240,0.2); background: rgba(226,232,240,0.06); }
.em-tpl-item--own { border-color: rgba(16,185,129,0.4); background: rgba(16,185,129,0.05); }
.em-tpl-radio   { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--gold); flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; }
.em-tpl-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); }
.em-tpl-body    { flex: 1; min-width: 0; }
.em-tpl-content { font-size: 13px; color: var(--c-txt); margin: 0 0 4px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.em-tpl-meta--own { background: rgba(16,185,129,0.14) !important; color: #059669 !important; }

.em-send-run { margin-top: 14px; padding: 12px; border-radius: 10px; border: 1px solid var(--c-border); background: var(--c-bg); }
.em-send-run-title { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: var(--c-txt); margin: 0 0 8px; }
.em-send-run-counts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.em-send-run-count { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; }
.em-send-run-count--ok  { background: rgba(34,197,94,0.12); color: #22c55e; }
.em-send-run-count--err { background: rgba(239,68,68,0.12); color: #ef4444; }
.em-send-run-log { max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.em-send-run-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; padding: 6px 8px; border-radius: 8px; background: var(--c-bg-2, rgba(148,163,184,0.06)); }
.em-send-run-row-name { color: var(--c-txt); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.em-send-run-row-status { color: var(--c-txt-2); text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.em-send-run-row--render_failed .em-send-run-row-status,
.em-send-run-row--send_failed .em-send-run-row-status { color: #ef4444; }
.em-send-run-row--sent .em-send-run-row-status { color: #22c55e; }
.em-tpl-meta    { font-size: 11px; color: var(--c-txt-3); margin: 0; }

/* ── Live message preview (right column) ── */
.em-send-preview { position: sticky; top: 0; }
.em-preview-card {
  display: flex; flex-direction: column; gap: 20px;
  padding: 28px; border-radius: 22px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--c-divide);
}
.em-preview-head { display: flex; align-items: center; justify-content: space-between; }
.em-preview-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--c-txt-3); }
.em-preview-channel {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px;
  border-radius: 999px; font-size: 12px; font-weight: 700;
}
.em-preview-channel--wsp { color: #34d399; background: rgba(52,211,153,0.12); }
.em-preview-channel--sms { color: #8b87ff; background: rgba(88,86,214,0.16); }
.em-preview-phone {
  border-radius: 24px; background: #060606; padding: 24px 18px;
  min-height: 220px; display: flex; flex-direction: column; align-items: flex-start;
}
.em-preview-notch { width: 56px; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.15); margin: 0 auto 22px; }
.em-preview-screen { width: 100%; }
.em-preview-bubble {
  max-width: 92%; padding: 14px 16px; border-radius: 18px; border-bottom-left-radius: 4px;
  font-size: 14px; line-height: 1.6; color: #fff; white-space: pre-wrap; word-break: break-word;
  box-shadow: 0 4px 14px rgba(0,0,0,0.3);
  background: linear-gradient(165deg, #6a67f0, #5856D6);
}
.em-preview-bubble--wsp { background: linear-gradient(165deg, #06614a, #005c4b); }
.em-preview-bubble--empty {
  background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.16);
  color: var(--c-txt-3); font-style: italic; box-shadow: none;
}
.em-preview-token { display: inline-block; background: rgba(255,255,255,0.2); padding: 1px 7px; border-radius: 6px; font-weight: 700; }
.em-preview-caption { margin: 0; font-size: 13px; color: var(--c-txt-2); text-align: center; }
.em-preview-caption strong { color: var(--c-txt); font-weight: 700; }

@media (max-width: 1040px) {
  .em-drawer-grid { grid-template-columns: 1fr; gap: 32px; }
  .em-send-preview { position: static; }
}
@media (max-width: 640px) {
  .em-drawer-header { padding: 18px 20px; }
  .em-drawer-title { font-size: 20px; }
  .em-drawer-body { padding: 24px 16px 40px; }
  .em-drawer-section { padding: 18px; }
}

.em-drawer-footer { flex-shrink: 0; display: flex; justify-content: center; padding: 20px 48px; border-top: 1px solid var(--c-divide); background: var(--c-bg); }
.em-drawer-footer-inner { width: 100%; max-width: 1160px; display: flex; justify-content: flex-end; gap: 12px; }
.em-drawer-cancel { flex: 0 0 140px; height: 48px; border-radius: 12px; border: 1px solid var(--c-border); background: rgba(255,255,255,0.05); font-size: 14px; font-weight: 500; color: var(--c-txt-2); cursor: pointer; transition: background 130ms; font-family: inherit; }
.em-drawer-cancel:hover { background: rgba(255,255,255,0.09); }
.em-drawer-send { flex: 0 0 220px; height: 48px; border-radius: 12px; background: var(--gold); color: var(--gold-contrast); border: none; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background 150ms; font-family: inherit; }
.em-drawer-send:hover:not(:disabled) { background: #d4b560; }
.em-drawer-send:disabled { opacity: 0.45; cursor: default; }

/* ── Campaign dialog ── */
.em-dialog { width: 400px; max-width: 95vw; background: var(--c-bg); border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.5); border: 1px solid var(--c-border); overflow: hidden; transition: background 300ms ease, border-color 300ms ease; }
.em-dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--c-divide); }
.em-dialog-title  { font-size: 16px; font-weight: 700; color: var(--c-txt); margin: 0; }
.em-dialog-body   { padding: 20px; }
.em-dialog-lbl    { display: block; font-size: 11px; font-weight: 700; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
.em-dialog-tpl-acts { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
.em-copy-prev-select {
  max-width: 180px; height: 26px; padding: 0 10px; border: 1px solid var(--c-border); border-radius: 999px;
  background: var(--c-bg); color: var(--c-txt-2); color-scheme: dark;
  font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer; outline: none;
  text-align: left; text-transform: none; letter-spacing: 0; transition: border-color 130ms, color 130ms;
}
.em-copy-prev-select:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
.em-copy-prev-select:disabled { color: var(--c-txt-3, #555); cursor: default; opacity: 0.6; }
.em-dialog-input  { width: 100%; height: 40px; padding: 0 12px; border: 1px solid var(--c-border, #2a2a2a); border-radius: 10px; font-size: 14px; color: var(--c-txt, #f0f0ec); background: var(--c-bg, #1c1c1f); outline: none; box-sizing: border-box; transition: border-color 130ms; font-family: inherit; }
.em-dialog-input:focus { border-color: var(--gold); }
.em-dialog-textarea { width: 100%; min-height: 88px; padding: 10px 12px; border: 1px solid var(--c-border, #2a2a2a); border-radius: 10px; font-size: 14px; color: var(--c-txt, #f0f0ec); background: var(--c-bg, #1c1c1f); outline: none; box-sizing: border-box; transition: border-color 130ms; font-family: inherit; resize: vertical; }
.em-dialog-textarea:hover { border-color: rgb(from var(--gold) r g b / 0.35); }
.em-dialog-textarea:focus { border-color: var(--gold); }
.em-dialog-hint { margin: 6px 0 0; font-size: 11px; color: var(--c-txt-2); line-height: 1.4; }
.em-dialog-type-row { display: flex; gap: 8px; }
.em-dialog-type-btn { flex: 1; height: 36px; border-radius: 9px; border: 1px solid var(--c-border); background: var(--c-bg); font-size: 13px; font-weight: 500; color: var(--c-txt-2); cursor: pointer; transition: all 130ms; font-family: inherit; }
.em-dialog-type-btn:hover { border-color: var(--gold); color: var(--c-txt); }
.em-dialog-type-btn--on { border-color: var(--gold); background: rgb(from var(--gold) r g b / 0.06); color: var(--gold); font-weight: 600; }
.em-dialog-footer { display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--c-divide); }

/* ── Animations ── */
.em-spin { animation: em-rotate 0.8s linear infinite; }
@keyframes em-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.em-fade-enter-active, .em-fade-leave-active { transition: opacity 180ms; }
.em-fade-enter-from,  .em-fade-leave-to     { opacity: 0; }
.em-slide-right-enter-active, .em-slide-right-leave-active { transition: transform 220ms cubic-bezier(0.4,0,0.2,1); }
.em-slide-right-enter-from,  .em-slide-right-leave-to     { transform: translateX(100%); }
.em-slide-up-enter-active, .em-slide-up-leave-active { transition: transform 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms; }
.em-slide-up-enter-from,  .em-slide-up-leave-to     { transform: translateX(-50%) translateY(80px); opacity: 0; }

/* ── Responsive ── */
@media (max-width: 900px) {
  /* Switch to 2-column stat grid before the 4th card clips off-screen */
  .em-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; min-width: 0; }
  .em-stat-card { min-width: 0; overflow: hidden; }
  .em-stat-lbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

@media (max-width: 720px) {
  .em-msg-row { grid-template-columns: 1fr; }
}

@media (max-width: 700px) {
  .em-root  { padding: 0; }
  .em-msg-dash { padding: 20px 16px 40px; gap: 24px; }
  .em-hub-hd { height: 54px; padding: 0 16px; gap: 14px; }
  .em-hub-title { font-size: 18px; }
  /* Column layout so labels get full card width */
  .em-stat-card { padding: 12px; gap: 6px; flex-direction: column; align-items: flex-start; }
  .em-stat-icon { width: 32px; height: 32px; flex-shrink: 0; }
  .em-stat-val  { font-size: 22px; }
  .em-stat-body { gap: 2px; min-width: 0; width: 100%; }
  .em-stat-lbl  { font-size: 10px; letter-spacing: 0; }
  /* Status filter pills: scroll horizontally instead of wrapping */
  .em-filter-pills { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .em-filter-pills::-webkit-scrollbar { display: none; }
  .em-filter-pill { flex-shrink: 0; }
  /* Panel header: allow wrapping on narrow screens */
  .em-panel-hd { flex-wrap: wrap; padding: 10px 14px; gap: 8px; }
  .em-panel-title { font-size: 16px; }
  .em-panel-filter-bar { padding: 8px 14px; gap: 10px; }
  /* Push-to-right only makes sense on one row — stack full-width instead */
  .em-filter-group-cluster { margin-left: 0; width: 100%; flex-direction: column; align-items: stretch; gap: 8px; }
  .em-filter-group-cluster .em-filter-group { width: 100%; justify-content: space-between; }
  .em-status-filter-dd { flex: 1; min-width: 0; }
  /* Collapse to icon-only so it doesn't compete with brand+title+tabs for
     space in an already-tight header row (matches EventMessages.vue's
     equivalent .em-act-label fallback for the same button). */
  .em-report-btn { padding: 7px 8px; gap: 0; }
  .em-report-label { display: none; }
  .em-report-pop { right: -8px; }
}


/* ── Stat dropdown (recipients) ── */
.em-stat-dd { position: relative; }
.em-stat-dd-trigger {
  display: flex; align-items: center; gap: 7px; width: 100%; height: 38px; padding: 0 12px;
  border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-bg);
  font-size: 13px; font-weight: 500; color: var(--c-txt); cursor: pointer;
  transition: border-color 130ms, background 130ms; font-family: inherit;
}
.em-stat-dd-trigger:hover { border-color: var(--gold); }
.em-stat-dd-trigger--unset { border-style: dashed; color: var(--c-txt-2, #9ca3af); }
.em-stat-dd-dot   { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.em-stat-dd-label { flex: 1; text-align: left; }
.em-stat-dd-n     { font-size: 12px; font-weight: 700; color: inherit; opacity: 0.85; }
.em-stat-dd-chev  { transition: transform 180ms; flex-shrink: 0; }
.em-stat-dd-chev--open { transform: rotate(180deg); }
.em-stat-dd-menu {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
  background: #1a1a1a; border: 1px solid var(--c-border, #2a2a2a); border-radius: 10px;
  max-height: 240px;
  overflow-y: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
/* Teleported to <body> so it escapes .em-panel's overflow:hidden — position
   is computed in JS from the trigger's real screen coordinates. */
.em-stat-dd-menu--float { position: fixed; right: auto; z-index: 1200; max-height: min(240px, calc(100vh - 16px)); }
.em-stat-dd-item {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px;
  background: none; border: none; font-size: 13px; font-weight: 500; color: var(--c-txt-2, #8a8a92);
  cursor: pointer; transition: background 100ms; font-family: inherit; text-align: left;
}
.em-stat-dd-item:hover { background: rgba(255,255,255,0.05); }
.em-stat-dd-item--on  { background: rgba(255,255,255,0.04); color: var(--c-txt, #f0f0ec); }
.em-recip-dd { margin-bottom: 10px; }
.em-status-filter-dd { width: fit-content; min-width: 130px; }
.em-status-filter-dd .em-stat-dd-trigger { height: 32px; font-size: 12px; width: 100%; padding-right: 10px; }
.em-status-filter-dd .em-stat-dd-label { flex: none; }
.em-recip-hint { display: flex; align-items: center; gap: 6px; margin: 10px 0 0; font-size: 12px; color: var(--c-txt-3); }

/* ── Pick accordion ── */
.em-pick-toggle-btn {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--c-border); border-radius: 10px;
  font-size: 13px; font-weight: 500; color: var(--c-txt-2); cursor: pointer;
  transition: all 130ms; font-family: inherit; margin-top: 2px;
}
.em-pick-toggle-btn:hover { border-color: var(--gold); color: var(--c-txt); }
.em-pick-toggle-btn--on   { border-color: rgb(from var(--gold) r g b / 0.35); color: var(--c-txt); background: rgb(from var(--gold) r g b / 0.04); }
.em-chip-cnt        { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.em-chip-cnt--gold  { background: rgb(from var(--gold) r g b / 0.15); color: var(--gold); }
.em-pick-wrap       { margin-top: 8px; border: 1px solid var(--c-border); border-radius: 10px; overflow: hidden; }
.em-pick-toolbar    { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--c-divide); background: #0d0d0d; }
.em-pick-search-wrap{ flex: 1; display: flex; align-items: center; gap: 7px; background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 8px; padding: 0 10px; height: 32px; }
.em-pick-search     { flex: 1; background: none; border: none; outline: none; font-size: 13px; color: var(--c-txt); font-family: inherit; }
.em-pick-clear      { background: none; border: none; color: var(--c-txt-3); cursor: pointer; padding: 0; display: flex; align-items: center; }
.em-pick-all-btn    { flex-shrink: 0; height: 30px; padding: 0 10px; border-radius: 7px; border: 1px solid var(--c-border); background: rgba(255,255,255,0.04); font-size: 12px; font-weight: 600; color: var(--c-txt-2); cursor: pointer; font-family: inherit; transition: all 130ms; white-space: nowrap; }
.em-pick-all-btn:hover { border-color: var(--gold); color: var(--c-txt); }
.em-pick-list       { max-height: 200px; overflow-y: auto; }
.em-pick-row        { display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer; transition: background 100ms; border-bottom: 1px solid var(--c-divide); }
.em-pick-row:last-child { border-bottom: none; }
.em-pick-row:hover  { background: rgba(255,255,255,0.03); }
.em-pick-row--on    { background: rgb(from var(--gold) r g b / 0.04); }
.em-pick-cb         { width: 14px; height: 14px; flex-shrink: 0; accent-color: var(--gold); cursor: pointer; }
.em-pick-avatar     { width: 28px; height: 28px; border-radius: 7px; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.em-pick-info       { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.em-pick-name       { font-size: 12px; font-weight: 600; color: var(--c-txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.em-pick-phone      { font-size: 11px; color: var(--c-txt-3); }
.em-pick-empty      { padding: 20px; text-align: center; font-size: 13px; color: var(--c-txt-3); }

/* ── Browse templates / edit-message link ── */
.em-browse-tpl-btn {
  display: inline-flex; align-items: center; gap: 5px;
  background: transparent; border: none; color: var(--gold); padding: 0; margin-left: auto;
  font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;
  text-transform: none; letter-spacing: 0; transition: opacity 130ms;
}
.em-browse-tpl-btn:hover { opacity: 0.75; }

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSER — WithJoy-Inspired Split-Screen Architecture
   ─────────────────────────────────────────────────────────────────────────
   Transforms the composer into a calm, elevated, full-height split-screen
   experience matching WithJoy.com:
   - Left side: A clean, pure-white canvas where form controls sit naturally
     with generous breathing room, refined pill toggles, and sentence-case labels.
   - Right side: A soft, airy neutral canvas holding a single elevated floating
     preview card showcasing the live SMS / WhatsApp message mockup.
   - Fixed header and footer rails that seamlessly frame the workspace.
   ══════════════════════════════════════════════════════════════════════════ */
.em-drawer--composer {
  --cx-ground:     #f8f8f9;
  --cx-card:       #ffffff;
  --cx-line:       #f0f0f2;
  --cx-shadow:     0 1px 2px rgba(0, 0, 0, 0.02);
  --cx-label:      #1a1a1a;
  --cx-muted:      #64748b;
  --cx-faint:      #94a3b8;
  --cx-field:      #ffffff;
  --cx-field-line: #e5e7eb;
  --cx-track:      #e9eaee;
  --cx-seg-bg:     #ffffff;
  --cx-seg-fg:     #1e293b;
  --cx-seg-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  --cx-cta:        #242424;
  --cx-cta-fg:     #ffffff;
  --cx-cta-hover:  #000000;
}

[data-theme="dark"] .em-drawer--composer {
  --cx-ground:     #0c0c0e;
  --cx-card:       #16161a;
  --cx-line:       #26262c;
  --cx-shadow:     0 20px 48px -12px rgba(0, 0, 0, 0.5);
  --cx-label:      #f4f4f6;
  --cx-muted:      #91919e;
  --cx-faint:      #636370;
  --cx-field:      #1c1c21;
  --cx-field-line: #2e2e36;
  --cx-track:      #222228;
  --cx-seg-bg:     #2e2e36;
  --cx-seg-fg:     #ffffff;
  --cx-seg-shadow: 0 1px 3px rgba(0,0,0,0.4);
  --cx-cta:        #ffffff;
  --cx-cta-fg:     #111114;
  --cx-cta-hover:  #e4e4e7;
}

/* ── Fullscreen Overlay and Drawer Container ── */
.em-drawer.em-drawer--composer {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  background: var(--cx-card) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  box-shadow: none !important;
}

/* ── Header: clean, minimal WithJoy-style edge-to-edge top bar ── */
.em-drawer.em-drawer--composer .em-drawer-header {
  flex-shrink: 0 !important;
  height: 64px !important;
  padding: 0 36px !important;
  background: var(--cx-card) !important;
  border-bottom: 1px solid #f0f0f2 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}
.em-drawer.em-drawer--composer .em-drawer-header-left {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
}
.em-drawer.em-drawer--composer .em-send-progress-bar {
  padding: 0 36px !important;
  background: #fafaf9 !important;
  border-bottom: 1px solid #f0f0f2 !important;
  color: #111827 !important;
}
.em-drawer.em-drawer--composer .em-send-progress-inner {
  display: flex !important;
  align-items: flex-end !important;
  justify-content: space-between !important;
  gap: 32px !important;
  max-width: 1160px !important;
  margin: 0 auto !important;
  padding: 16px 0 18px !important;
}
.em-drawer.em-drawer--composer .em-send-progress-copy {
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
  min-width: 0 !important;
}
.em-drawer.em-drawer--composer .em-send-progress-kicker {
  font-size: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0.16em !important;
  text-transform: uppercase !important;
  color: #94a3b8 !important;
}
.em-drawer.em-drawer--composer .em-send-progress-title {
  margin: 0 !important;
  font-family: 'Cormorant Garamond', 'Playfair Display', Didot, Georgia, serif !important;
  font-size: 22px !important;
  font-weight: 500 !important;
  letter-spacing: 0.02em !important;
  color: #111827 !important;
  line-height: 1.2 !important;
}
.em-drawer.em-drawer--composer .em-send-progress-meta {
  margin: 4px 0 0 !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  color: #64748b !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}
.em-drawer.em-drawer--composer .em-send-progress-pct {
  display: inline-flex !important;
  align-items: center !important;
  height: 20px !important;
  padding: 0 8px !important;
  border-radius: 9999px !important;
  background: #111827 !important;
  color: #ffffff !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em !important;
}
.em-drawer.em-drawer--composer .em-send-progress-fail {
  color: #b45309 !important;
}
.em-drawer.em-drawer--composer .em-send-progress-meter {
  flex: 1 1 280px !important;
  max-width: 420px !important;
  padding-bottom: 6px !important;
}
.em-drawer.em-drawer--composer .em-send-progress-track {
  height: 3px !important;
  border-radius: 9999px !important;
  background: #e8e8ea !important;
  overflow: hidden !important;
}
.em-drawer.em-drawer--composer .em-send-progress-fill {
  height: 100% !important;
  border-radius: 9999px !important;
  background: #111827 !important;
  position: relative !important;
  overflow: hidden !important;
  transition: width 280ms ease !important;
}
.em-drawer.em-drawer--composer .em-send-progress-fill::after {
  content: '' !important;
  position: absolute !important;
  inset: 0 !important;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent) !important;
  animation: em-send-sheen 1.6s ease-in-out infinite !important;
}
@keyframes em-send-sheen {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
@media (max-width: 720px) {
  .em-drawer.em-drawer--composer .em-send-progress-inner {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }
  .em-drawer.em-drawer--composer .em-send-progress-meter {
    max-width: none !important;
    flex-basis: auto !important;
  }
}
.em-drawer.em-drawer--composer .em-drawer-burger {
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  background: transparent !important;
  border: none !important;
  color: var(--cx-label) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: background 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-drawer-burger:hover {
  background: var(--cx-track) !important;
}
.em-drawer.em-drawer--composer .em-drawer-icon-badge {
  display: none !important;
}
.em-drawer.em-drawer--composer .em-drawer-title {
  font-family: 'Cormorant Garamond', 'Playfair Display', Didot, Georgia, serif !important;
  font-size: 22px !important;
  font-weight: 500 !important;
  color: #1a1a1a !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
  line-height: 1.15 !important;
  margin: 0 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.em-drawer.em-drawer--composer .em-drawer-close {
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  background: transparent !important;
  border: none !important;
  color: var(--cx-muted) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: all 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-drawer-close:hover {
  background: var(--cx-track) !important;
  color: var(--cx-label) !important;
}

/* ── Drawer Body: Houses the Split-Screen Architecture ── */
.em-drawer.em-drawer--composer .em-drawer-body {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  background: var(--cx-card) !important;
}
.em-drawer.em-drawer--composer .em-composer-loading {
  flex: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: var(--cx-muted) !important;
  background: var(--cx-card) !important;
}
.em-drawer.em-drawer--composer .em-drawer-grid {
  display: flex !important;
  flex-direction: row !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  gap: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  flex: 1 1 0 !important;
  min-height: 0 !important;
}

/* ── Left Pane (Form / Editor): Clean Canvas ── */
.em-drawer.em-drawer--composer .em-send-form {
  flex: 1 1 auto !important;
  max-width: none !important;
  min-width: 380px !important;
  height: 100% !important;
  overflow-y: auto !important;
  background: #ffffff !important;
  padding: 40px 36px 64px 48px !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  scrollbar-width: thin !important;
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent !important;
}
.em-drawer.em-drawer--composer .em-send-form::-webkit-scrollbar {
  width: 6px !important;
}
.em-drawer.em-drawer--composer .em-send-form::-webkit-scrollbar-track {
  background: transparent !important;
}
.em-drawer.em-drawer--composer .em-send-form::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08) !important;
  border-radius: 9999px !important;
}
.em-drawer.em-drawer--composer .em-send-form::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.16) !important;
}

/* ── Form Sections & Typography ── */
.em-drawer.em-drawer--composer .em-drawer-section {
  background: none !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  margin: 0 0 28px !important;
}
.em-drawer.em-drawer--composer .em-drawer-section:last-child {
  margin-bottom: 0 !important;
}
.em-drawer.em-drawer--composer .em-drawer-section-label {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #374151 !important;
  letter-spacing: -0.01em !important;
  text-transform: none !important;
  margin: 0 0 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}

/* ── Campaign Field (WithJoy-style sleek input) ── */
.em-drawer.em-drawer--composer .em-custom-camp-display {
  padding: 10px 14px !important;
  border-radius: 9999px !important;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  color: #374151 !important;
  font-size: 13.5px !important;
  font-weight: 450 !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  transition: border-color 130ms ease !important;
}
.em-drawer.em-drawer--composer .em-custom-camp-display:hover {
  border-color: #d1d5db !important;
}
.em-drawer.em-drawer--composer .em-custom-camp-type {
  font-size: 10.5px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  padding: 3px 9px !important;
  border-radius: 9999px !important;
  background: #f1f5f9 !important;
  color: #475569 !important;
  margin-left: auto !important;
}

/* ── Channel: Segmented Switch (matches WithJoy) ── */
.em-drawer.em-drawer--composer .em-send-ch-toggle {
  background: #e9eaee !important;
  border-radius: 9999px !important;
  padding: 3px !important;
  display: inline-flex !important;
  width: 100% !important;
  gap: 2px !important;
  border: none !important;
}
.em-drawer.em-drawer--composer .em-send-ch-btn {
  flex: 1 1 0 !important;
  height: 36px !important;
  border: none !important;
  border-radius: 9999px !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  color: #64748b !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  cursor: pointer !important;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.em-drawer.em-drawer--composer .em-send-ch-btn:hover {
  color: #18181b !important;
}
.em-drawer.em-drawer--composer .em-send-ch-btn--wsp,
.em-drawer.em-drawer--composer .em-send-ch-btn--sms {
  background: #ffffff !important;
  color: #1e293b !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06) !important;
}

.em-drawer.em-drawer--composer .em-to-btn {
  width: 100% !important;
  height: 46px !important;
  border-radius: 9999px !important;
  border: 1.5px solid #111827 !important;
  background: #ffffff !important;
  color: #111827 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  font-family: inherit !important;
  cursor: pointer !important;
}
.em-drawer.em-drawer--composer .em-to-btn:hover { background: #f8fafc !important; }
.em-drawer.em-drawer--composer .em-to-btn--filled {
  background: #111827 !important;
  color: #ffffff !important;
}

/* ── Recipients: paired filters, then optional people picker ── */
.em-drawer.em-drawer--composer .em-recip-hd {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  margin: 0 0 10px !important;
}
.em-drawer.em-drawer--composer .em-recip-hd .em-drawer-section-label {
  margin: 0 !important;
}
.em-drawer.em-drawer--composer .em-recip-count {
  font-size: 11.5px !important;
  font-weight: 600 !important;
  color: #374151 !important;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 9999px !important;
  padding: 3px 10px !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
}
.em-drawer.em-drawer--composer .em-recip-filters {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 10px 12px !important;
}
.em-drawer.em-drawer--composer .em-recip-filters--solo {
  grid-template-columns: 1fr !important;
}
.em-drawer.em-drawer--composer .em-recip-field {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  min-width: 0 !important;
}
.em-drawer.em-drawer--composer .em-recip-field-lbl {
  font-size: 11.5px !important;
  font-weight: 600 !important;
  color: #6b7280 !important;
  letter-spacing: 0.01em !important;
}
.em-drawer.em-drawer--composer .em-recip-dd {
  margin-bottom: 0 !important;
  width: 100% !important;
}
.em-drawer.em-drawer--composer .em-drawer-list-row {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-bottom: 12px !important;
}
.em-drawer.em-drawer--composer .em-drawer-list-lbl {
  font-size: 13px !important;
  font-weight: 500 !important;
  letter-spacing: -0.01em !important;
  text-transform: none !important;
  color: #6b7280 !important;
  min-width: 50px !important;
}
.em-drawer.em-drawer--composer .em-filter-select--drawer {
  flex: none !important;
  width: 100% !important;
  height: 38px !important;
  padding: 0 36px 0 14px !important;
  border-radius: 9999px !important;
  font-size: 13px !important;
  font-weight: 450 !important;
  background-color: #ffffff !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 14px center !important;
  appearance: none !important;
  border: 1px solid #e5e7eb !important;
  color: #374151 !important;
  cursor: pointer !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  transition: border-color 130ms ease !important;
}
.em-drawer.em-drawer--composer .em-filter-select--drawer:hover {
  border-color: #d1d5db !important;
}
.em-drawer.em-drawer--composer .em-filter-select--drawer:focus {
  border-color: #d1d5db !important;
  outline: none !important;
}

.em-drawer.em-drawer--composer .em-stat-dd-trigger {
  height: 38px !important;
  padding: 0 14px !important;
  border-radius: 9999px !important;
  font-size: 13px !important;
  font-weight: 450 !important;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  color: #374151 !important;
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  cursor: pointer !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  transition: all 130ms ease !important;
}
.em-drawer.em-drawer--composer .em-stat-dd-trigger:hover {
  border-color: #d1d5db !important;
}
.em-drawer.em-drawer--composer .em-stat-dd-dot {
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  margin-right: 10px !important;
  flex-shrink: 0 !important;
}
.em-drawer.em-drawer--composer .em-stat-dd-label {
  color: #374151 !important;
  font-size: 13px !important;
  font-weight: 450 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.em-drawer.em-drawer--composer .em-stat-dd-n {
  margin-left: auto !important;
  margin-right: 8px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  padding: 2px 8px !important;
  border-radius: 9999px !important;
  background: #f1f5f9 !important;
  color: #475569 !important;
}
.em-drawer.em-drawer--composer .em-stat-dd-chev {
  color: #9ca3af !important;
  transition: transform 200ms ease !important;
}

/* ── "Pick specific attendees" Pill Button (Signature WithJoy look) ── */
.em-drawer.em-drawer--composer .em-recip-or {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin: 16px 0 8px !important;
  color: #94a3b8 !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.12em !important;
  text-transform: uppercase !important;
}
.em-drawer.em-drawer--composer .em-recip-or::before,
.em-drawer.em-drawer--composer .em-recip-or::after {
  content: '' !important;
  flex: 1 !important;
  height: 1px !important;
  background: #f0f0f2 !important;
}
.em-drawer.em-drawer--composer .em-pick-toggle-btn {
  margin-top: 0 !important;
  height: auto !important;
  min-height: 0 !important;
  width: 100% !important;
  border-radius: 0 !important;
  border: none !important;
  background: transparent !important;
  color: #374151 !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 8px 2px !important;
  cursor: pointer !important;
  box-shadow: none !important;
  transition: color 130ms ease !important;
}
.em-drawer.em-drawer--composer .em-pick-toggle-btn:hover {
  border-color: transparent !important;
  background: transparent !important;
  color: #111827 !important;
}
.em-drawer.em-drawer--composer .em-pick-toggle-btn--on {
  border-color: transparent !important;
  background: transparent !important;
}
.em-drawer.em-drawer--composer .em-pick-toggle-copy {
  display: flex !important;
  align-items: baseline !important;
  gap: 8px !important;
  flex: 1 !important;
  text-align: left !important;
}
.em-drawer.em-drawer--composer .em-pick-toggle-copy em {
  font-style: normal !important;
  font-size: 11.5px !important;
  font-weight: 500 !important;
  color: #94a3b8 !important;
}
.em-drawer.em-drawer--composer .em-pick-chev {
  margin-left: auto !important;
  color: #9ca3af !important;
  transition: transform 200ms ease !important;
  flex-shrink: 0 !important;
}
.em-drawer.em-drawer--composer .em-pick-toggle-btn .em-chip-cnt {
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 2px 8px !important;
  border-radius: 9999px !important;
  background: #ffffff !important;
  color: #374151 !important;
  border: 1px solid #e5e7eb !important;
}
.em-drawer.em-drawer--composer .em-recip-hint {
  margin-top: 8px !important;
  font-size: 12.5px !important;
  color: #94a3b8 !important;
  display: block !important;
}
.em-drawer.em-drawer--composer .em-pick-wrap {
  margin-top: 10px !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  background: #ffffff !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
}
.em-drawer.em-drawer--composer .em-pick-toolbar {
  padding: 10px 14px !important;
  background: #f8f8f9 !important;
  border-bottom: 1px solid #f0f0f2 !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}
.em-drawer.em-drawer--composer .em-pick-search-wrap {
  height: 32px !important;
  border-radius: 9999px !important;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  flex: 1 !important;
  padding: 0 12px !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}
.em-drawer.em-drawer--composer .em-pick-list {
  max-height: 240px !important;
  overflow-y: auto !important;
}

/* ── Message / Template Section ── */
.em-drawer.em-drawer--composer .em-browse-tpl-btn {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #2563eb !important;
  background: none !important;
  border: none !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  transition: color 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-browse-tpl-btn:hover {
  color: #1d4ed8 !important;
  text-decoration: underline !important;
}
.em-drawer.em-drawer--composer .em-tpl-item {
  height: 46px !important;
  min-height: 46px !important;
  padding: 0 16px !important;
  margin-bottom: 8px !important;
  border-radius: 9999px !important;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  align-items: center !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  transition: all 130ms ease !important;
}
.em-drawer.em-drawer--composer .em-tpl-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}
.em-drawer.em-drawer--composer .em-tpl-list .em-tpl-item {
  margin-bottom: 0 !important;
}
.em-drawer.em-drawer--composer .em-tpl-item:hover {
  border-color: #d1d5db !important;
}
.em-drawer.em-drawer--composer .em-tpl-item--active {
  border-color: #d1d5db !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  background: #ffffff !important;
}
.em-drawer.em-drawer--composer .em-tpl-item--own {
  border-color: rgba(16,185,129,0.45) !important;
  background: rgba(16,185,129,0.05) !important;
}
.em-drawer.em-drawer--composer .em-tpl-radio {
  width: 15px !important;
  height: 15px !important;
  margin-top: 0 !important;
  border: 1.5px solid #d1d5db !important;
  background: #ffffff !important;
}
.em-drawer.em-drawer--composer .em-tpl-item--active .em-tpl-radio {
  border-color: #111827 !important;
}
.em-drawer.em-drawer--composer .em-tpl-radio-dot {
  width: 7px !important;
  height: 7px !important;
  background: #111827 !important;
}
.em-drawer.em-drawer--composer .em-tpl-body {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  min-width: 0 !important;
  flex: 1 !important;
}
.em-drawer.em-drawer--composer .em-tpl-content {
  font-size: 13.5px !important;
  font-weight: 450 !important;
  line-height: 1.3 !important;
  color: #374151 !important;
  margin: 0 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.em-drawer.em-drawer--composer .em-tpl-meta {
  flex-shrink: 0 !important;
  margin: 0 0 0 auto !important;
  padding: 3px 9px !important;
  border-radius: 9999px !important;
  background: #f1f5f9 !important;
  color: #475569 !important;
  font-size: 10.5px !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
}
.em-drawer.em-drawer--composer .em-tpl-meta--own {
  background: rgba(16,185,129,0.14) !important;
  color: #059669 !important;
}
.em-drawer.em-drawer--composer .em-msg-missing-warn {
  border: 1px solid #fef08a !important;
  background: #fefce8 !important;
  color: #854d0e !important;
  border-radius: 12px !important;
  padding: 14px 16px !important;
  font-size: 13px !important;
  line-height: 1.55 !important;
  display: flex !important;
  align-items: flex-start !important;
  gap: 10px !important;
}
.em-drawer.em-drawer--composer .em-msg-missing-warn svg {
  color: #ca8a04 !important;
  flex-shrink: 0 !important;
  margin-top: 2px !important;
}
.em-drawer.em-drawer--composer .em-msg-missing-warn-btn {
  background: none !important;
  border: none !important;
  font-weight: 600 !important;
  text-decoration: underline !important;
  text-underline-offset: 2px !important;
  color: #a16207 !important;
  cursor: pointer !important;
  padding: 0 !important;
  transition: opacity 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-msg-missing-warn-btn:hover {
  opacity: 0.8 !important;
}

/* ── Right Pane (Preview Stage): Soft Neutral Canvas Holding ONE Floating Card ── */
.em-drawer.em-drawer--composer .em-send-preview {
  flex: 0 0 45% !important;
  max-width: 45% !important;
  min-width: 0 !important;
  height: 100% !important;
  overflow-y: auto !important;
  background: #f8f8f9 !important;
  border-left: 1px solid #f0f0f2 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 40px 48px 48px !important;
  position: static !important;
  top: 0 !important;
  scrollbar-width: thin !important;
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent !important;
}
.em-drawer.em-drawer--composer .em-send-preview::-webkit-scrollbar {
  width: 6px !important;
}
.em-drawer.em-drawer--composer .em-send-preview::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08) !important;
  border-radius: 9999px !important;
}

/* ── Preview stage: collage + phone, same language as EventOverview ── */
.em-drawer.em-drawer--composer .em-preview-card {
  width: 100% !important;
  max-width: 400px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 8px !important;
}
.em-drawer.em-drawer--composer .em-preview-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  width: 100% !important;
  padding-bottom: 0 !important;
  border-bottom: none !important;
}
.em-drawer.em-drawer--composer .em-preview-eyebrow {
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #94a3b8 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
}
.em-drawer.em-drawer--composer .em-preview-channel {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  padding: 3px 10px !important;
  border-radius: 9999px !important;
}
.em-drawer.em-drawer--composer .em-preview-channel--sms {
  background: #f3f0ff !important;
  color: #6366f1 !important;
}
.em-drawer.em-drawer--composer .em-preview-channel--wsp {
  background: #e6f7ef !important;
  color: #059669 !important;
}

.em-drawer.em-drawer--composer .em-preview-collage {
  position: relative !important;
  width: 100% !important;
  height: 430px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.em-drawer.em-drawer--composer .em-inv {
  position: absolute !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
  border-radius: 4px !important;
  box-shadow: 0 10px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04) !important;
  pointer-events: none !important;
}
.em-drawer.em-drawer--composer .em-inv--left {
  width: 118px !important;
  height: 162px !important;
  left: 2% !important;
  top: 58px !important;
  background: #faf7f2 !important;
  border: 1px solid #efe8db !important;
  color: #5c4d43 !important;
  transform: rotate(-10deg) !important;
  z-index: 1 !important;
}
.em-drawer.em-drawer--composer .em-inv--right {
  width: 110px !important;
  height: 150px !important;
  right: 2% !important;
  top: 78px !important;
  background: #fff5f6 !important;
  border: 1px solid #fee8eb !important;
  color: #4a2e35 !important;
  transform: rotate(11deg) !important;
  z-index: 1 !important;
}
.em-drawer.em-drawer--composer .em-inv-kicker {
  font-size: 7.5px !important;
  letter-spacing: 0.16em !important;
  text-transform: uppercase !important;
  opacity: 0.7 !important;
}
.em-drawer.em-drawer--composer .em-inv-names {
  font-family: 'Playfair Display', Georgia, serif !important;
  font-size: 15px !important;
  font-style: italic !important;
  line-height: 1.1 !important;
}
.em-drawer.em-drawer--composer .em-inv-orn { font-size: 12px !important; opacity: 0.45 !important; }
.em-drawer.em-drawer--composer .em-inv-line {
  width: 28px !important;
  height: 1px !important;
  background: rgba(74, 46, 53, 0.22) !important;
  margin: 3px 0 !important;
}
.em-drawer.em-drawer--composer .em-inv-date {
  font-size: 8.5px !important;
  letter-spacing: 0.04em !important;
  opacity: 0.7 !important;
}

.em-drawer.em-drawer--composer .em-preview-phone {
  position: relative !important;
  z-index: 4 !important;
  width: 198px !important;
  max-width: 198px !important;
  margin: 0 auto !important;
  background: #18181b !important;
  border: none !important;
  border-radius: 28px !important;
  padding: 7px 6px 10px !important;
  min-height: 392px !important;
  height: 392px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22), 0 2px 0 rgba(255,255,255,0.08) inset !important;
}
.em-drawer.em-drawer--composer .em-preview-screen {
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  flex: 1 !important;
  width: 100% !important;
  min-height: 0 !important;
  border-radius: 22px !important;
  background: #f2f2f7 !important;
  padding: 0 !important;
  color: #1c1c1e !important;
  overflow: hidden !important;
  position: relative !important;
}
.em-drawer.em-drawer--composer .em-preview-phone--wsp .em-preview-screen {
  background:
    radial-gradient(circle at 18% 12%, rgba(255,255,255,0.55), transparent 28%),
    linear-gradient(180deg, #efe7dc 0%, #e8dfd2 100%) !important;
}
.em-drawer.em-drawer--composer .em-phone-osbar {
  display: grid !important;
  grid-template-columns: 1fr auto 1fr !important;
  align-items: center !important;
  height: 22px !important;
  padding: 6px 10px 0 !important;
  font-size: 9px !important;
  font-weight: 650 !important;
  letter-spacing: 0.02em !important;
  color: #1c1c1e !important;
  flex-shrink: 0 !important;
  position: relative !important;
  z-index: 2 !important;
}
.em-drawer.em-drawer--composer .em-preview-phone--wsp .em-phone-osbar { color: #111b21 !important; }
.em-drawer.em-drawer--composer .em-phone-osbar > span:first-child { justify-self: start !important; padding-left: 4px !important; }
.em-drawer.em-drawer--composer .em-phone-os-icons { justify-self: end !important; display: flex !important; }
.em-drawer.em-drawer--composer .em-phone-island {
  width: 58px !important;
  height: 14px !important;
  border-radius: 999px !important;
  background: #18181b !important;
  justify-self: center !important;
}
.em-drawer.em-drawer--composer .em-chat-head {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 4px 8px 8px !important;
  flex-shrink: 0 !important;
  border-bottom: 1px solid rgba(0,0,0,0.06) !important;
  background: rgba(255,255,255,0.72) !important;
}
.em-drawer.em-drawer--composer .em-preview-phone--wsp .em-chat-head {
  background: #075e54 !important;
  border-bottom: none !important;
  color: #ffffff !important;
}
.em-drawer.em-drawer--composer .em-chat-back,
.em-drawer.em-drawer--composer .em-chat-tool { flex-shrink: 0 !important; color: #007aff !important; }
.em-drawer.em-drawer--composer .em-preview-phone--wsp .em-chat-back,
.em-drawer.em-drawer--composer .em-preview-phone--wsp .em-chat-tool { color: #ffffff !important; }
.em-drawer.em-drawer--composer .em-chat-avatar {
  width: 22px !important;
  height: 22px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #c9a84c, #8b6b2e) !important;
  color: #fff !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}
.em-drawer.em-drawer--composer .em-chat-who {
  flex: 1 !important;
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  line-height: 1.15 !important;
}
.em-drawer.em-drawer--composer .em-chat-name {
  font-size: 10.5px !important;
  font-weight: 650 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.em-drawer.em-drawer--composer .em-chat-status {
  font-size: 8px !important;
  opacity: 0.62 !important;
  font-weight: 500 !important;
}
.em-drawer.em-drawer--composer .em-chat-thread {
  flex: 1 !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-end !important;
  padding: 10px 8px 8px !important;
  gap: 6px !important;
}
.em-drawer.em-drawer--composer .em-chat-stamp {
  align-self: center !important;
  font-size: 8px !important;
  font-weight: 600 !important;
  color: #8e8e93 !important;
  background: rgba(255,255,255,0.7) !important;
  padding: 2px 7px !important;
  border-radius: 999px !important;
  margin-bottom: 4px !important;
}
.em-drawer.em-drawer--composer .em-preview-phone--wsp .em-chat-stamp {
  background: rgba(225, 219, 207, 0.92) !important;
  color: #54656f !important;
}
.em-drawer.em-drawer--composer .em-preview-bubble {
  background: #007aff !important;
  color: #ffffff !important;
  border-radius: 16px 16px 5px 16px !important;
  padding: 7px 9px 5px !important;
  font-size: 11px !important;
  line-height: 1.4 !important;
  max-width: 88% !important;
  margin-left: auto !important;
  box-shadow: none !important;
  word-break: break-word !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 3px !important;
}
.em-drawer.em-drawer--composer .em-preview-bubble--wsp {
  background: #d9fdd3 !important;
  color: #111b21 !important;
  border-radius: 8px 8px 2px 8px !important;
  padding: 6px 8px 4px !important;
  box-shadow: 0 1px 0.5px rgba(0,0,0,0.08) !important;
}
.em-drawer.em-drawer--composer .em-preview-bubble-text {
  margin: 0 !important;
  white-space: pre-wrap !important;
}
.em-drawer.em-drawer--composer .em-preview-ticks {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 3px !important;
  font-size: 8px !important;
  opacity: 0.78 !important;
  font-weight: 500 !important;
}
.em-drawer.em-drawer--composer .em-preview-token {
  background: rgba(255, 255, 255, 0.24) !important;
  color: inherit !important;
  padding: 0 4px !important;
  border-radius: 3px !important;
  font-weight: 600 !important;
}
.em-drawer.em-drawer--composer .em-preview-bubble--wsp .em-preview-token {
  background: rgba(0, 0, 0, 0.06) !important;
  color: #075e54 !important;
}
.em-drawer.em-drawer--composer .em-chat-dock {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 6px 8px 10px !important;
  flex-shrink: 0 !important;
}
.em-drawer.em-drawer--composer .em-chat-plus {
  width: 18px !important;
  height: 18px !important;
  border-radius: 50% !important;
  border: 1.4px solid #8e8e93 !important;
  color: #8e8e93 !important;
  font-size: 12px !important;
  line-height: 15px !important;
  text-align: center !important;
  font-weight: 500 !important;
}
.em-drawer.em-drawer--composer .em-preview-phone--wsp .em-chat-plus {
  border-color: #54656f !important;
  color: #54656f !important;
}
.em-drawer.em-drawer--composer .em-chat-field {
  flex: 1 !important;
  height: 22px !important;
  border-radius: 999px !important;
  border: 1px solid rgba(0,0,0,0.08) !important;
  background: #ffffff !important;
  font-size: 9px !important;
  color: #8e8e93 !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 10px !important;
}
.em-drawer.em-drawer--composer .em-chat-mic {
  width: 18px !important;
  height: 18px !important;
  border-radius: 50% !important;
  background: #007aff !important;
}
.em-drawer.em-drawer--composer .em-preview-phone--wsp .em-chat-mic { background: #00a884 !important; }
.em-drawer.em-drawer--composer .em-phone-home {
  width: 72px !important;
  height: 4px !important;
  border-radius: 999px !important;
  background: #3f3f46 !important;
  margin: 7px auto 0 !important;
  flex-shrink: 0 !important;
}
.em-drawer.em-drawer--composer .em-preview-summary {
  text-align: center !important;
  margin-top: 10px !important;
}
.em-drawer.em-drawer--composer .em-preview-title {
  margin: 0 0 8px !important;
  font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif !important;
  font-weight: 600 !important;
  font-size: 22px !important;
  color: #1a1a1a !important;
  line-height: 1.25 !important;
  letter-spacing: -0.01em !important;
}
.em-drawer.em-drawer--composer .em-preview-caption {
  font-size: 13px !important;
  color: #64748b !important;
  text-align: center !important;
  margin: 0 auto !important;
  line-height: 1.55 !important;
  max-width: 34ch !important;
}
.em-drawer.em-drawer--composer .em-preview-caption strong {
  color: #1a1a1a !important;
  font-weight: 600 !important;
}
.em-drawer.em-drawer--composer .em-preview-empty-state {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-end !important;
  gap: 8px !important;
  flex: 1 !important;
  justify-content: flex-end !important;
  text-align: right !important;
  padding: 4px 0 2px !important;
}
.em-drawer.em-drawer--composer .em-preview-ghost {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-end !important;
  gap: 5px !important;
  width: 78% !important;
}
.em-drawer.em-drawer--composer .em-preview-ghost span {
  display: block !important;
  height: 10px !important;
  border-radius: 8px !important;
  background: rgba(0,0,0,0.06) !important;
  width: 100% !important;
}
.em-drawer.em-drawer--composer .em-preview-ghost span:nth-child(2) { width: 72% !important; }
.em-drawer.em-drawer--composer .em-preview-ghost span:nth-child(3) { width: 44% !important; }
.em-drawer.em-drawer--composer .em-preview-empty-msg {
  margin: 0 !important;
  font-size: 9.5px !important;
  line-height: 1.4 !important;
  color: #8a8178 !important;
  text-align: right !important;
  max-width: 88% !important;
}
.em-drawer.em-drawer--composer .eca-badge--unsent,
.em-drawer.em-drawer--composer .eca-badge--draft {
  background: #ffffff !important;
  color: #6b7280 !important;
  border-color: #e5e7eb !important;
}
.em-drawer.em-drawer--composer .em-pick-all-btn {
  height: 32px !important;
  border-radius: 8px !important;
  border: 1px solid #e5e7eb !important;
  background: #ffffff !important;
  color: #4b5563 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
}
.em-drawer.em-drawer--composer .em-pick-all-btn:hover {
  border-color: #d1d5db !important;
  background: #f9fafb !important;
  color: #111827 !important;
}
.em-drawer.em-drawer--composer .em-pick-row {
  border-bottom-color: #f0f0f2 !important;
}
.em-drawer.em-drawer--composer .em-pick-row:hover {
  background: #f7f7f8 !important;
}
.em-drawer.em-drawer--composer .em-pick-row--on {
  background: #f7f7f8 !important;
}
.em-drawer.em-drawer--composer .em-pick-name {
  color: #1a1a1a !important;
}
.em-drawer.em-drawer--composer .em-pick-phone {
  color: #6b7280 !important;
}

/* ── Fixed Bottom Footer Rail: Clean WithJoy Actions ── */
.em-drawer.em-drawer--composer .em-drawer-footer {
  flex-shrink: 0 !important;
  height: 72px !important;
  padding: 0 48px !important;
  background: #ffffff !important;
  border-top: 1px solid #f0f0f2 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
}
.em-drawer.em-drawer--composer .em-drawer-footer-inner {
  width: 100% !important;
  max-width: 100% !important;
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 12px !important;
}
.em-drawer.em-drawer--composer .em-drawer-cancel {
  flex: 0 0 auto !important;
  height: 44px !important;
  padding: 0 24px !important;
  border-radius: 9999px !important;
  border: 1px solid #e5e7eb !important;
  background: #ffffff !important;
  color: #374151 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  transition: all 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-drawer-cancel:hover {
  border-color: #d1d5db !important;
  color: #111827 !important;
  background: #f9fafb !important;
}
.em-drawer.em-drawer--composer .em-drawer-send {
  flex: 0 0 auto !important;
  height: 44px !important;
  padding: 0 32px !important;
  border-radius: 9999px !important;
  border: none !important;
  background: #242424 !important;
  color: #ffffff !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
  transition: all 160ms ease !important;
}
.em-drawer.em-drawer--composer .em-drawer-send:hover:not(:disabled) {
  background: #000000 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16) !important;
}
.em-drawer.em-drawer--composer .em-drawer-send:disabled {
  background: #f1f3f5 !important;
  color: #9ca3af !important;
  opacity: 1 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  transform: none !important;
}

/* ── Responsive Behavior ── */
@media (max-width: 960px) {
  .em-drawer.em-drawer--composer .em-drawer-body {
    overflow-y: auto !important;
  }
  .em-drawer.em-drawer--composer .em-drawer-grid {
    flex-direction: column !important;
    height: auto !important;
  }
  .em-drawer.em-drawer--composer .em-send-form {
    flex: 1 1 auto !important;
    max-width: 100% !important;
    min-width: 0 !important;
    height: auto !important;
    overflow-y: visible !important;
    padding: 24px 20px 32px !important;
  }
  .em-drawer.em-drawer--composer .em-send-preview {
    flex: 1 1 auto !important;
    max-width: 100% !important;
    border-left: none !important;
    border-top: 1px solid #f0f0f2 !important;
    height: auto !important;
    overflow-y: visible !important;
    padding: 32px 20px 48px !important;
  }
  .em-drawer.em-drawer--composer .em-inv {
    display: none !important;
  }
  .em-drawer.em-drawer--composer .em-preview-collage {
    height: auto !important;
  }
  .em-drawer.em-drawer--composer .em-recip-filters {
    grid-template-columns: 1fr !important;
  }
  .em-drawer.em-drawer--composer .em-drawer-footer {
    padding: 12px 20px !important;
    height: 64px !important;
  }
  .em-drawer.em-drawer--composer .em-drawer-cancel {
    flex: 1 1 0 !important;
  }
  .em-drawer.em-drawer--composer .em-drawer-send {
    flex: 2 1 0 !important;
  }
}
</style>

<style>
/* Unscoped: dialogs teleported to <body> */
.em-sp-backdrop {
  position: fixed; inset: 0; z-index: 1300;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(8px);
}
.em-sp {
  position: relative;
  width: min(400px, 100%);
  padding: 36px 32px 32px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 28px 80px rgba(0,0,0,0.22);
  text-align: center;
  overflow: hidden;
}
.em-sp-orbit {
  position: relative;
  width: 72px; height: 72px;
  margin: 0 auto 20px;
}
.em-sp-orbit span {
  position: absolute; inset: 0;
  border-radius: 50%;
  border: 1.5px solid transparent;
  border-top-color: #111827;
  animation: em-sp-spin 1.1s linear infinite;
}
.em-sp-orbit span:nth-child(2) {
  inset: 8px;
  border-top-color: #94a3b8;
  animation-duration: 1.6s;
  animation-direction: reverse;
}
.em-sp-orbit span:nth-child(3) {
  inset: 18px;
  border-top-color: #111827;
  opacity: 0.35;
  animation-duration: 2.1s;
}
@keyframes em-sp-spin {
  to { transform: rotate(360deg); }
}
.em-sp-kicker {
  margin: 0 0 6px;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: #94a3b8;
}
.em-sp-title {
  margin: 0;
  font-family: 'Cormorant Garamond', 'Playfair Display', Didot, Georgia, serif;
  font-size: 28px; font-weight: 500; letter-spacing: 0.01em;
  color: #111827; line-height: 1.15;
}
.em-sp-sub {
  margin: 6px 0 0;
  font-size: 14px; font-weight: 500; color: #64748b;
}
.em-sp-pct {
  margin: 22px 0 12px;
  font-family: 'Cormorant Garamond', 'Playfair Display', Didot, Georgia, serif;
  font-size: 52px; font-weight: 500; line-height: 1;
  color: #111827; letter-spacing: -0.03em;
}
.em-sp-track {
  height: 4px; border-radius: 999px;
  background: #eeeef0; overflow: hidden;
}
.em-sp-fill {
  height: 100%; width: 0;
  border-radius: 999px; background: #111827;
  transition: width 280ms ease;
}
.em-sp-fill--indeterminate {
  width: 40% !important;
  animation: em-sp-indeterminate 1.2s ease-in-out infinite;
}
@keyframes em-sp-indeterminate {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(280%); }
}
.em-sp-meta {
  margin: 14px 0 0;
  font-size: 13px; font-weight: 500; color: #64748b;
}
.em-sp-meta--result {
  line-height: 1.5;
}
.em-sp-result-icon {
  width: 56px; height: 56px;
  margin: 0 auto 18px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.em-sp-result-icon--ok {
  background: #ecfdf5;
  color: #059669;
}
.em-sp-result-icon--err {
  background: #fef2f2;
  color: #dc2626;
}
.em-sp-stats {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 18px;
  margin: 24px 0 0;
  padding: 16px 8px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #eef1f5;
}
.em-sp-stat {
  flex: 1;
  min-width: 0;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.em-sp-stat-div {
  width: 1px;
  align-self: center;
  height: 34px;
  background: #e2e8f0;
}
.em-sp-stat-num {
  font-family: 'Cormorant Garamond', 'Playfair Display', Didot, Georgia, serif;
  font-size: 26px; font-weight: 600; line-height: 1;
  letter-spacing: -0.02em;
}
.em-sp-stat-num--ok    { color: #059669; }
.em-sp-stat-num--warn  { color: #d97706; }
.em-sp-stat-num--err   { color: #dc2626; }
.em-sp-stat-num--muted { color: #cbd5e1; }
.em-sp-stat-label {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: #94a3b8;
  white-space: nowrap;
}
.em-sp-total {
  margin: 10px 0 0;
  font-size: 12px; font-weight: 500; color: #94a3b8;
}
.em-sp-done-btn {
  margin-top: 24px;
  width: 100%;
  padding: 12px 20px;
  border: none; border-radius: 12px;
  background: #111827; color: #fff;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
}
.em-sp-done-btn:hover {
  background: #1f2937;
}

html .em-dialog.em-dialog--joy {
  width: min(440px, 100%) !important;
  max-width: 95vw !important;
  max-height: min(640px, 90vh) !important;
  display: flex !important;
  flex-direction: column !important;
  background: #ffffff !important;
  border: none !important;
  border-radius: 16px !important;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2) !important;
  color: #111827 !important;
  overflow: hidden !important;
}
html .em-dialog.em-dialog--joy .em-dialog-header {
  padding: 18px 20px 10px 24px !important;
  border-bottom: none !important;
  flex-shrink: 0 !important;
}
html .em-dialog.em-dialog--joy .em-dialog-title {
  font-size: 20px !important;
  font-weight: 700 !important;
  letter-spacing: -0.02em !important;
  color: #111827 !important;
}
html .em-dialog.em-dialog--joy .em-dialog-body {
  padding: 8px 24px 12px !important;
  overflow-y: auto !important;
  min-height: 0 !important;
  flex: 1 1 auto !important;
}
html .em-dialog.em-dialog--joy .em-dialog-lbl {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #374151 !important;
  text-transform: none !important;
  letter-spacing: -0.01em !important;
  margin-bottom: 8px !important;
}
html .em-dialog.em-dialog--joy .em-dialog-input,
html .em-dialog.em-dialog--joy .em-dialog-textarea {
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  color: #111827 !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
  font-size: 14px !important;
}
html .em-dialog.em-dialog--joy .em-dialog-input {
  height: 46px !important;
  border-radius: 9999px !important;
  padding: 0 16px !important;
}
html .em-dialog.em-dialog--joy .em-dialog-textarea {
  border-radius: 14px !important;
  padding: 12px 16px !important;
  min-height: 96px !important;
}
html .em-dialog.em-dialog--joy .em-dialog-input:focus,
html .em-dialog.em-dialog--joy .em-dialog-textarea:focus {
  border-color: #d1d5db !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;
  background: #ffffff !important;
  outline: none !important;
}
html .em-dialog.em-dialog--joy .em-dialog-input::placeholder,
html .em-dialog.em-dialog--joy .em-dialog-textarea::placeholder { color: #94a3b8 !important; }
html .em-dialog.em-dialog--joy .em-dialog-hint { color: #94a3b8 !important; font-size: 12px !important; line-height: 1.45 !important; }
html .em-dialog.em-dialog--joy .em-send-ch-toggle {
  background: #e9eaee !important;
  border-radius: 9999px !important;
  padding: 3px !important;
  display: flex !important;
  gap: 2px !important;
  border: none !important;
}
html .em-dialog.em-dialog--joy .em-send-ch-btn {
  flex: 1 !important;
  height: 36px !important;
  border: none !important;
  border-radius: 9999px !important;
  background: transparent !important;
  color: #64748b !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  box-shadow: none !important;
}
html .em-dialog.em-dialog--joy .em-send-ch-btn:hover {
  color: #18181b !important;
  border: none !important;
}
html .em-dialog.em-dialog--joy .em-send-ch-btn--wsp,
html .em-dialog.em-dialog--joy .em-send-ch-btn--sms {
  background: #ffffff !important;
  color: #111827 !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06) !important;
  border: none !important;
}
html .em-dialog.em-dialog--joy .em-dialog-type-row { gap: 8px !important; }
html .em-dialog.em-dialog--joy .em-dialog-type-btn {
  height: 38px !important;
  border-radius: 9999px !important;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  color: #64748b !important;
}
html .em-dialog.em-dialog--joy .em-dialog-type-btn:hover {
  border-color: #d1d5db !important;
  color: #111827 !important;
}
html .em-dialog.em-dialog--joy .em-dialog-type-btn--on {
  background: #111827 !important;
  border-color: #111827 !important;
  color: #ffffff !important;
}
html .em-dialog.em-dialog--joy .em-copy-prev-select {
  height: 32px !important;
  border-radius: 9999px !important;
  border: 1px solid #e5e7eb !important;
  background: #ffffff !important;
  color: #374151 !important;
  font-size: 12px !important;
  color-scheme: light !important;
}
html .em-dialog.em-dialog--joy .em-copy-prev-select:hover:not(:disabled) {
  border-color: #d1d5db !important;
  color: #111827 !important;
}
html .em-dialog.em-dialog--joy .em-dialog-footer {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 14px 20px 18px !important;
  border-top: 1px solid #f1f5f9 !important;
  flex-shrink: 0 !important;
  background: #ffffff !important;
}
html .em-dialog.em-dialog--joy .em-sg-done:disabled { opacity: 0.4; cursor: default; }

.em-sg-backdrop {
  position: fixed; inset: 0; z-index: 1200;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.32);
}
.em-sg {
  width: min(720px, 100%);
  height: min(560px, 100%);
  display: flex; flex-direction: column;
  background: #fff; color: #111827;
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  overflow: hidden;
  flex-shrink: 0;
}
.em-sg-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 10px 24px; flex-shrink: 0;
}
.em-sg-title { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
.em-sg-x {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: #f8fafc; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.em-sg-x:hover { background: #f1f5f9; color: #111827; }
.em-sg-body {
  flex: 1; min-height: 0;
  display: grid; grid-template-columns: minmax(0, 1fr) 200px;
}
.em-sg-col {
  min-width: 0; min-height: 0; overflow: hidden;
  display: flex; flex-direction: column;
  padding: 4px 8px 0 24px; border-right: 1px solid #f1f5f9;
}
.em-sg-note {
  margin: 0 12px 10px 0; padding: 10px 12px; border-radius: 10px;
  background: #f8fafc; color: #64748b; font-size: 12.5px; line-height: 1.45;
}
.em-sg-search {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  height: 40px; margin: 0 12px 10px 0; padding: 0 14px;
  border: 1px solid #e5e7eb; border-radius: 9999px; color: #94a3b8; background: #fff;
}
.em-sg-search-input {
  flex: 1; border: none; outline: none; background: none;
  font-size: 14px; color: #111827; font-family: inherit;
}
.em-sg-scroll { flex: 1; min-height: 0; overflow-y: auto; padding-right: 8px; padding-bottom: 12px; overscroll-behavior: contain; }
.em-sg-sec-hd {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 8px 6px 0; font-size: 13px; font-weight: 700; color: #111827;
}
.em-sg-sec-hd--guests { margin-top: 8px; }
.em-sg-sec-n { font-size: 12px; font-weight: 600; color: #94a3b8; }
.em-sg-select-all {
  margin-left: auto; background: none; border: none; padding: 0;
  font-size: 13px; font-weight: 600; color: #111827; cursor: pointer; font-family: inherit;
}
.em-sg-row {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 8px 8px 8px 0; border: none; background: none;
  cursor: pointer; font-family: inherit; text-align: left;
}
.em-sg-row:hover { background: #fafafa; }
.em-sg-row--active { background: #f8fafc; }
.em-sg-box {
  width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
  border: 1.5px solid #d1d5db; background: #fff; box-sizing: border-box;
}
.em-sg-box--on { border-color: #111827; background: #111827; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' d='M3.5 8.5l3 3 6-6'/%3E%3C/svg%3E"); }
.em-sg-box--mixed { border-color: #111827; background: #111827; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath stroke='%23fff' stroke-width='2' stroke-linecap='round' d='M4 8h8'/%3E%3C/svg%3E"); }
.em-sg-tag { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 9999px; font-size: 13px; font-weight: 600; }
.em-sg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.em-sg-status-lbl { font-size: 14px; font-weight: 500; color: #111827; }
.em-sg-guest-st { margin-left: auto; font-size: 12px; font-weight: 600; flex-shrink: 0; }
.em-sg-row-n { margin-left: auto; font-size: 12px; font-weight: 600; color: #94a3b8; }
.em-sg-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.em-sg-guest { min-width: 0; display: flex; flex-direction: column; }
.em-sg-guest-name { font-size: 14px; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.em-sg-guest-warn { font-size: 12px; color: #d97706; }
.em-sg-empty { padding: 20px 0; font-size: 13px; color: #94a3b8; }
.em-sg-selected { padding: 16px 18px; overflow: hidden; display: flex; flex-direction: column; min-width: 0; }
.em-sg-selected-lbl { margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #64748b; }
.em-sg-selected-lbl strong { color: #111827; }
.em-sg-selected-list { overflow-y: auto; min-height: 0; flex: 1; overscroll-behavior: contain; }
.em-sg-selected-name { margin: 0 0 8px; font-size: 13px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.em-sg-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 20px; border-top: 1px solid #f1f5f9; flex-shrink: 0;
  position: relative; z-index: 2; background: #fff;
}
.em-sg-link { background: none; border: none; padding: 0; font-size: 14px; font-weight: 600; color: #111827; cursor: pointer; font-family: inherit; }
.em-sg-foot-acts { display: flex; align-items: center; gap: 10px; }
.em-sg-cancel {
  height: 40px; padding: 0 18px; border: none; background: none;
  font-size: 14px; font-weight: 600; color: #111827; cursor: pointer; font-family: inherit;
}
.em-sg-done {
  height: 40px; padding: 0 22px; border: none; border-radius: 9999px;
  background: #111827; color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}
@media (max-width: 640px) {
  .em-sg-body { grid-template-columns: 1fr; }
  .em-sg-selected { display: none; }
  .em-sg-col { border-right: none; padding-right: 16px; }
}
</style>
