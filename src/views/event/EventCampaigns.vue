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
          <h1 class="em-hub-title">Messaging</h1>
          <span class="em-hub-badge">MESSAGING+</span>
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
          <span v-if="sentCampaigns.length" class="em-msg-tab-count">{{ sentCampaigns.length }}</span>
        </button>
      </nav>
    </div>

    <!-- ══════════════════════════════════════════════
         CAMPAIGN LIST (no campaign selected)
         ══════════════════════════════════════════════ -->
    <template v-if="!selectedCustomCamp">

      <div class="em-msg-dash">

        <!-- Create Tab: Withjoy 4 hero tiles + Scheduled preview + Sent preview -->
        <template v-if="msgTab === 'create'">
          <div class="em-msg-section">
            <h2 class="em-sec-title">Messages</h2>
            <div class="em-msg-tiles">
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
                  <p class="em-empty-text">No scheduled messages</p>
                  <button class="em-new-pill-btn" @click="createPresetCampaign('General Message')">
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
                    <span v-if="sentCampaigns.length" class="em-pill-count">{{ sentCampaigns.length }}</span>
                  </div>
                  <button v-if="sentCampaigns.length > 4" class="em-view-all-btn" @click="msgTab = 'sent'">View All</button>
                </div>
                <div class="em-sub-card-body">
                  <div v-if="loadingCustomCamps" class="em-msg-loading"><p>Loading…</p></div>
                  <div v-else-if="!sentCampaigns.length" class="em-sub-card-body--center" style="min-height: 180px;">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2.5"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    <p class="em-empty-text">No messages sent yet</p>
                  </div>
                  <div v-else class="em-sent-list">
                    <div v-for="camp in sentCampaigns.slice(0, 4)" :key="camp.id" class="em-sent-item" @click="selectCustomCamp(camp)">
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
              <p class="em-empty-text">No scheduled messages</p>
              <button class="em-new-pill-btn" @click="createPresetCampaign('General Message')">
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
          <div v-else-if="!sentCampaigns.length" class="em-sub-card-body--center em-sent-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2.5"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <p class="em-empty-text">No messages sent yet</p>
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
          <button class="em-crumb-link" @click="backToCampaignList">Messaging</button>
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
                  <h2 class="em-drawer-title">{{ selectedCustomCamp?.cardPurpose ? `Send ${selectedCustomCamp.name}` : `Send ${sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} Campaign` }}</h2>
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
                <div v-if="sendResult" class="em-send-result"
                  :class="sendResult.ok ? 'em-send-result--ok' : 'em-send-result--err'">
                  <svg v-if="sendResult.ok" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div>
                    <p class="em-result-title">{{ sendResult.ok ? 'Messages sent!' : 'Something went wrong' }}</p>
                    <p class="em-result-msg">{{ sendResult.message }}</p>
                  </div>
                  <button class="em-result-dismiss" @click="sendResult = null">Dismiss</button>
                </div>

                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Campaign</p>
                  <div class="em-custom-camp-display">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: var(--cx-muted); flex-shrink: 0;" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {{ selectedCustomCamp?.name }}
                    <span v-if="selectedCustomCamp?.type" class="em-custom-camp-type">{{ selectedCustomCamp.type }}</span>
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
                  <p class="em-drawer-section-label">Recipients</p>

                  <!-- Group filter -->
                  <div v-if="props.event?.labels?.length" class="em-drawer-list-row">
                    <span class="em-drawer-list-lbl">Group</span>
                    <select v-model="sendLabelId" class="em-filter-select em-filter-select--drawer">
                      <option :value="null">All Groups</option>
                      <option v-for="lbl in props.event.labels" :key="lbl.id" :value="lbl.id">{{ lbl.name }}</option>
                    </select>
                  </div>

                  <!-- Status dropdown -->
                  <div class="em-stat-dd em-recip-dd">
                    <button ref="recipDdTriggerRef" class="em-stat-dd-trigger"
                      :style="DRAWER_STATUS_COLORS[sendRecipMode] ? { background: DRAWER_STATUS_COLORS[sendRecipMode].bg, color: DRAWER_STATUS_COLORS[sendRecipMode].fg, borderColor: DRAWER_STATUS_COLORS[sendRecipMode].border } : {}"
                      @click="toggleRecipDd">
                      <span class="em-stat-dd-dot" :style="{ background: DRAWER_STATUS_COLORS[sendRecipMode]?.fg ?? '#555' }"/>
                      <span class="em-stat-dd-label">{{ SEND_STATUS_OPTS.find(o => o.v === sendRecipMode)?.l ?? 'All' }}</span>
                      <span class="em-stat-dd-n">{{ sendRecipMode === 'all' ? sendRecipPool.length : (sendStatusCounts[sendRecipMode] ?? 0) }}</span>
                      <svg class="em-stat-dd-chev" :class="{ 'em-stat-dd-chev--open': recipDropOpen }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <Teleport to="body">
                      <div v-if="recipDropOpen" ref="recipDdMenuRef" class="em-stat-dd-menu em-stat-dd-menu--float"
                        :style="{ top: recipDdPos.top + 'px', left: recipDdPos.left + 'px', width: recipDdPos.width + 'px' }">
                        <button v-for="opt in SEND_STATUS_OPTS" :key="opt.v"
                          class="em-stat-dd-item" :class="{ 'em-stat-dd-item--on': sendRecipMode === opt.v }"
                          :style="{ color: DRAWER_STATUS_COLORS[opt.v]?.fg }"
                          @click="sendRecipMode = opt.v; recipDropOpen = false; drawerPickList = []">
                          <span class="em-stat-dd-dot" :style="{ background: DRAWER_STATUS_COLORS[opt.v]?.fg ?? '#555' }"/>
                          <span class="em-stat-dd-n">{{ opt.v === 'all' ? sendRecipPool.length : (sendStatusCounts[opt.v] ?? 0) }}</span>
                          {{ opt.l }}
                        </button>
                      </div>
                    </Teleport>
                  </div>

                  <!-- Pick manually -->
                  <button class="em-pick-toggle-btn" :class="{ 'em-pick-toggle-btn--on': pickOpen || drawerPickList.length }" @click="pickOpen = !pickOpen">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Pick specific attendees
                    <span v-if="drawerPickList.length" class="em-chip-cnt em-chip-cnt--gold" style="margin-left:auto">{{ drawerPickList.length }} selected</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-left:auto; transition:transform 200ms" :style="{ transform: pickOpen ? 'rotate(90deg)' : 'rotate(0deg)' }"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>

                  <div v-if="pickOpen" class="em-pick-wrap">
                    <div class="em-pick-toolbar">
                      <div class="em-pick-search-wrap">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input v-model="drawerPickSearch" class="em-pick-search" placeholder="Search name or phone…" />
                        <button v-if="drawerPickSearch" class="em-pick-clear" @click="drawerPickSearch = ''">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      <button class="em-pick-all-btn" @click="drawerPickSelectAll">
                        {{ drawerPickFiltered.every(a => drawerPickList.includes(a.id)) && drawerPickFiltered.length ? 'Clear all' : 'Select all' }}
                      </button>
                    </div>
                    <div class="em-pick-list">
                      <label v-for="att in drawerPickFiltered" :key="att.id" class="em-pick-row" :class="{ 'em-pick-row--on': drawerPickList.includes(att.id) }">
                        <input type="checkbox" :checked="drawerPickList.includes(att.id)" @change="drawerPickToggle(att)" class="em-pick-cb" />
                        <div class="em-pick-avatar" :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }">{{ initials(att.fullName) }}</div>
                        <div class="em-pick-info">
                          <span class="em-pick-name">{{ att.fullName }}</span>
                          <span class="em-pick-phone">{{ att.phone || '—' }}</span>
                        </div>
                        <span class="eca-badge" :class="`eca-badge--${getCustomStatus(att, sendChannel) ?? 'unsent'}`">{{ STATUS_LABELS[getCustomStatus(att, sendChannel)] ?? 'Unsent' }}</span>
                      </label>
                      <div v-if="!drawerPickFiltered.length" class="em-pick-empty">No attendees found</div>
                    </div>
                  </div>

                  <p class="em-recip-hint">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ sendRecipCount }} recipient{{ sendRecipCount !== 1 ? 's' : '' }} will receive this {{ selectedCustomCamp?.cardPurpose ? 'card' : 'message' }}
                  </p>
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
                    <div v-if="!selectedCustomCamp?.whatsappMessage" class="em-msg-missing-warn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>No WhatsApp Custom Message set for this campaign — the template's placeholder will be blank. <button class="em-msg-missing-warn-btn" @click="openCampDialog(selectedCustomCamp, 'whatsapp')">Set it now</button> before sending.</span>
                    </div>
                    <div v-if="!loadingTemplates && !templates.length" class="em-tpl-empty">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B5B5BB" stroke-width="1.8" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      No general-campaign WhatsApp templates registered yet.
                    </div>
                    <div v-else class="em-tpl-list">
                      <div v-for="tpl in templates" :key="tpl.id"
                        class="em-tpl-item"
                        :class="{ 'em-tpl-item--active': selectedTemplate?.id === tpl.id }"
                        @click="selectedTemplate = tpl">
                        <div class="em-tpl-radio">
                          <div class="em-tpl-radio-dot" v-if="selectedTemplate?.id === tpl.id" />
                        </div>
                        <div class="em-tpl-body">
                          <p class="em-tpl-content">{{ tpl.content }}</p>
                          <p v-if="tpl.language" class="em-tpl-meta">{{ tpl.language.toUpperCase() }}</p>
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
                      <span class="em-preview-eyebrow">Preview</span>
                      <span class="em-preview-channel" :class="sendChannel === 'whatsapp' ? 'em-preview-channel--wsp' : 'em-preview-channel--sms'">
                        <svg v-if="sendChannel === 'whatsapp'" width="12" height="12" viewBox="0 0 448 512" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {{ sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS' }}
                      </span>
                    </div>

                    <div class="em-preview-phone">
                      <div class="em-preview-notch" />
                      <div class="em-phone-statusbar">
                        <span class="em-phone-carrier">{{ sendChannel === 'whatsapp' ? 'WhatsApp' : 'Haflaway SMS' }}</span>
                        <span class="em-phone-time">Today 10:42 AM</span>
                      </div>
                      <div class="em-preview-screen">
                        <div class="em-preview-bubble" :class="{ 'em-preview-bubble--wsp': sendChannel === 'whatsapp' }" v-if="previewParts.length">
                          <template v-for="(part, i) in previewParts" :key="i">
                            <span v-if="isVarToken(part)" class="em-preview-token">{{ part }}</span>
                            <template v-else>{{ part }}</template>
                          </template>
                        </div>
                        <div class="em-preview-empty-state" v-else>
                          <div class="em-preview-empty-glyph">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              <line x1="9" y1="10" x2="15" y2="10"/>
                            </svg>
                          </div>
                          <p class="em-preview-empty-msg">
                            {{ selectedCustomCamp?.cardPurpose
                              ? 'Each recipient\'s card is rendered individually — no shared preview to show here.'
                              : (sendChannel === 'whatsapp' ? 'Pick a template to preview it here.' : 'Set an SMS message to preview it here.') }}
                          </p>
                          <p class="em-preview-empty-hint">Real-time mobile delivery simulation</p>
                        </div>
                      </div>
                    </div>

                    <div class="em-preview-summary">
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

    <!-- ══════════════════════════════════════════════
         CAMPAIGN CREATE / EDIT DIALOG
         ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="em-fade">
        <div v-if="campDialogOpen" class="em-overlay em-overlay--center" @click.self="campDialogOpen = false">
          <div class="em-dialog">
            <div class="em-dialog-header">
              <h3 class="em-dialog-title">{{ editingCamp ? 'Edit Campaign' : 'New Campaign' }}</h3>
              <button class="em-drawer-close" @click="campDialogOpen = false">
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
                  <button class="em-dialog-type-btn" :class="{ 'em-dialog-type-btn--on': campDialogType === 'invitation' }" @click="campDialogType = 'invitation'">Invitation</button>
                  <button class="em-dialog-type-btn" :class="{ 'em-dialog-type-btn--on': campDialogType === 'contribution' }" @click="campDialogType = 'contribution'">Contribution</button>
                  <button class="em-dialog-type-btn" :class="{ 'em-dialog-type-btn--on': campDialogType === 'contact' }" @click="campDialogType = 'contact'">Contact</button>
                </div>
              </template>
              <label class="em-dialog-lbl" style="margin-top:14px">Custom Message</label>
              <div class="em-send-ch-toggle">
                <button class="em-send-ch-btn" :class="{ 'em-send-ch-btn--wsp': campDialogMsgTab === 'whatsapp' }" @click="campDialogMsgTab = 'whatsapp'">
                  <svg width="14" height="14" viewBox="0 0 448 512" fill="#128C7E"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                  WhatsApp
                </button>
                <button class="em-send-ch-btn" :class="{ 'em-send-ch-btn--sms': campDialogMsgTab === 'sms' }" @click="campDialogMsgTab = 'sms'">
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
              <button class="em-drawer-cancel" @click="campDialogOpen = false">Cancel</button>
              <button class="em-drawer-send" :disabled="!campDialogName.trim() || savingCamp" @click="saveCamp">
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
import { collection, query, orderBy, where, getDocs, addDoc, setDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { useNavDrawer } from '../../composables/useNavDrawer.js'
import { useOrg } from '../../composables/useOrg.js'

const props = defineProps({ event: Object, eventId: String })
const route  = useRoute()
const router = useRouter()
const navDrawer = useNavDrawer()
const { brandName, brandLogoUrl } = useOrg()
const eventId = computed(() => props.eventId ?? route.params.eventId)

const SMS_URL = 'https://sendsmsaction-frbu33fema-uc.a.run.app'
const WSP_URL = 'https://sendwhatsappinvitationmessages-frbu33fema-uc.a.run.app'
const GENERAL_CAMPAIGN_CATEGORY = 'haflaway-general-campaign'
// Our own VPS-hosted service (see /server) — renders each recipient's card
// then dispatches it, for the canonical per-purpose card campaigns only.
// Defaults to localhost for local dev; set VITE_CARD_SERVER_URL once deployed.
const CARD_SERVER_URL = import.meta.env.VITE_CARD_SERVER_URL || 'http://localhost:8080'

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
function messageTypeMeta(camp) { return PRESET_TYPE_META[camp.name] ?? DEFAULT_TYPE_META }
const SENT_TYPE_OPTIONS = [...Object.keys(PRESET_TYPE_META), 'Custom']

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

// Recipients + send/fail counts per sent campaign, for the Sent tab table.
// A recipient counts as "sent" if any channel reached sent/delivered/read,
// and "failed" only if every channel attempted for them came back failed.
const campaignStatsMap = computed(() => {
  const map = {}
  for (const camp of sentCampaigns.value) {
    const recipients = []
    let sent = 0, failed = 0
    for (const att of attendees.value) {
      const entries = campaignIndexEntries(att, camp.id)
      if (!entries.length) continue
      recipients.push(att)
      const statuses = entries.map(idx => idx.slice(idx.lastIndexOf('_') + 1))
      if (statuses.some(s => s === 'sent' || s === 'delivered' || s === 'read')) sent++
      else if (statuses.every(s => s === 'failed')) failed++
    }
    map[camp.id] = { recipients, sent, failed }
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
  return sentCampaigns.value.filter(camp => {
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
onUnmounted(() => {
  document.removeEventListener('mousedown', handleFilterDdOutsideClick)
  stopWatchingSendRun()
})

async function loadCustomCampaigns() {
  if (!eventId.value) return
  loadingCustomCamps.value = true
  try {
    const snap = await getDocs(
      query(collection(db, 'events', eventId.value, 'campaigns'), orderBy('createdAt', 'desc'))
    )
    customCampaigns.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
  const campId   = selectedCustomCamp.value.id
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
    if (gateByCard && (!att.cards || att.cards[cardType] == null)) return false
    if (labelId && !(att.labelIds ?? []).includes(labelId)) return false
    if (q && !(att.fullName ?? '').toLowerCase().includes(q) && !(att.phone ?? '').includes(q)) return false
    const prefix = `${detailChannel.value}_${campId}_`
    const match  = (att.messageIndexes ?? []).find(idx => idx.startsWith(prefix))
    const s      = match ? match.slice(match.lastIndexOf('_') + 1) : null
    if (status === 'all') return true
    if (status === 'unsent') return s === null || s === 'unsent'
    return s === status
  })
})

function getCustomStatus(att, channel = detailChannel.value) {
  if (!selectedCustomCamp.value) return null
  const prefix = `${channel}_${selectedCustomCamp.value.id}_`
  const match  = (att.messageIndexes ?? []).find(idx => idx.startsWith(prefix))
  return match ? match.slice(match.lastIndexOf('_') + 1) : null
}

const customStatusCounts = computed(() => {
  if (!selectedCustomCamp.value) return { all: 0, unsent: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
  const campId   = selectedCustomCamp.value.id
  const cardType = selectedCustomCamp.value.type
  const gateByCard = !selectedCustomCamp.value.cardPurpose && !!cardType
  const labelId  = customLabelId.value
  const prefix   = `${detailChannel.value}_${campId}_`
  const base = attendees.value.filter(att => {
    if (gateByCard && (!att.cards || att.cards[cardType] == null)) return false
    if (labelId && !(att.labelIds ?? []).includes(labelId)) return false
    return true
  })
  const counts = { all: base.length, unsent: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
  for (const att of base) {
    const match = (att.messageIndexes ?? []).find(idx => idx.startsWith(prefix))
    const s = match ? match.slice(match.lastIndexOf('_') + 1) : null
    if (!s || s === 'unsent') counts.unsent++
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
const sendRecipMode    = ref('unsent')
const sendLabelId      = ref(null)
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

const sendRecipPool = computed(() => {
  if (!selectedCustomCamp.value) return []
  const cardType = selectedCustomCamp.value.type
  let pool = (selectedCustomCamp.value.cardPurpose || !cardType)
    ? attendees.value.slice()
    : attendees.value.filter(att => att.cards && att.cards[cardType] != null)
  if (sendLabelId.value) pool = pool.filter(a => (a.labelIds ?? []).includes(sendLabelId.value))
  return pool
})

const sendStatusCounts = computed(() => {
  if (!selectedCustomCamp.value) return { unsent: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
  const campId = selectedCustomCamp.value.id
  const prefix = `${sendChannel.value}_${campId}_`
  const counts = { unsent: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
  for (const att of sendRecipPool.value) {
    const match = (att.messageIndexes ?? []).find(idx => idx.startsWith(prefix))
    const s = match ? match.slice(match.lastIndexOf('_') + 1) : null
    if (!s || s === 'unsent') counts.unsent++
    else if (counts[s] !== undefined) counts[s]++
  }
  return counts
})

const drawerPickFiltered = computed(() => {
  const q = drawerPickSearch.value.trim().toLowerCase()
  if (!q) return sendRecipPool.value
  return sendRecipPool.value.filter(a =>
    (a.fullName ?? '').toLowerCase().includes(q) || (a.phone ?? '').includes(q)
  )
})

const sendRecipients = computed(() => {
  if (drawerPickList.value.length) {
    return sendRecipPool.value.filter(a => drawerPickList.value.includes(a.id))
  }
  if (!selectedCustomCamp.value) return []
  const campId = selectedCustomCamp.value.id
  const prefix = `${sendChannel.value}_${campId}_`
  return sendRecipPool.value.filter(att => {
    const match = (att.messageIndexes ?? []).find(idx => idx.startsWith(prefix))
    const s = match ? match.slice(match.lastIndexOf('_') + 1) : null
    if (sendRecipMode.value === 'all') return true
    if (sendRecipMode.value === 'unsent') return s === null || s === 'unsent'
    return s === sendRecipMode.value
  })
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
// Card-purpose sends run async on the card server and report progress via a
// Firestore doc this listens to live — same "reactive Firestore read drives
// the UI" pattern the rest of this screen already uses for Sent/Unsent counts.
const sendRunId    = ref(null)
const sendRun      = ref(null)
let unsubscribeSendRun = null
function stopWatchingSendRun() {
  if (unsubscribeSendRun) { unsubscribeSendRun(); unsubscribeSendRun = null }
  sendRunId.value = null
  sendRun.value = null
}
function watchSendRun(campaignId, runId) {
  stopWatchingSendRun()
  sendRunId.value = runId
  unsubscribeSendRun = onSnapshot(
    doc(db, 'events', eventId.value, 'campaigns', campaignId, 'sendRuns', runId),
    (snap) => { sendRun.value = snap.exists() ? snap.data() : null },
    (e) => console.error('watchSendRun:', e)
  )
}
// Set only when this drawer was deep-linked open from elsewhere (e.g. the
// Guest List "Send" flow) — closing it should then hand the user back to
// where they came from instead of stranding them on this campaign's detail
// view, which they never asked to visit.
const deepLinkReturnTo = ref(deepLinkSend ? (route.query.returnTo ?? null) : null)

const canSend = computed(() => {
  if (sending.value || sendRecipCount.value === 0) return false
  // A card-purpose campaign has no message/template to fill in — the card
  // itself, rendered fresh per recipient, is the content. But its send runs
  // async on the card server after this returns, so `sending` alone doesn't
  // cover the whole window — block again while a started run hasn't reported
  // finishedAt yet, otherwise a double-click (or a second tab) can fire a
  // second overlapping batch against the same recipients.
  if (selectedCustomCamp.value?.cardPurpose) return !(sendRunId.value && !sendRun.value?.finishedAt)
  if (sendChannel.value === 'whatsapp') return !!selectedTemplate.value && !!selectedCustomCamp.value?.whatsappMessage
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

function openCustomSend() {
  sendCampaign.value = selectedCustomCamp.value.id
  sendChannel.value  = 'sms'
  sendResult.value   = null
  stopWatchingSendRun()
  sendRecipMode.value = 'unsent'
  sendLabelId.value = null
  pickOpen.value = false
  drawerPickList.value = []
  drawerPickSearch.value = ''
  sendDrawerOpen.value = true
  loadSendTemplates()
}

function onChannelChange(ch) {
  sendChannel.value = ch
  selectedTemplate.value = null
  loadSendTemplates()
}

function closeSendDrawer() {
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
    // WhatsApp templates are pre-approved and admin-managed (read only here) —
    // only ones tagged for general/bulk campaigns are eligible, never the
    // invitation-lifecycle categories used by the Invitations screen.
    const lang = props.event?.language ?? 'sw'
    const snap = await getDocs(
      query(collection(db, 'messageTemplates'), where('category', '==', GENERAL_CAMPAIGN_CATEGORY), where('language', '==', lang))
    )
    templates.value = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.active !== false)
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
  sending.value = true
  sendResult.value = null
  try {
    if (selectedCustomCamp.value?.cardPurpose) {
      await executeSendCard()
      return
    }
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    // Sourced from cardPurpose, not the campaign's own `type` — a manually
    // -typed reminder campaign (or a legacy doc from before cardPurpose
    // existed) has a real `type` but must never get a card attached; only
    // the canonical per-purpose campaigns should, and those never reach this
    // branch at all (see the cardPurpose check above). This is always null
    // here in practice — kept explicit rather than a bare `null` so the
    // invariant stays visible if that ever changes.
    const kardType = selectedCustomCamp.value?.cardPurpose ?? null
    const url = sendChannel.value === 'whatsapp' ? WSP_URL : SMS_URL
    const body = sendChannel.value === 'whatsapp'
      ? { templateId: selectedTemplate.value.id, type: sendCampaign.value, eventId: eventId.value, attendeesIds: sendRecipients.value.map(a => a.id), kardType }
      : { content: selectedCustomCamp.value.smsMessage, type: sendCampaign.value, eventId: eventId.value, attendeesIds: sendRecipients.value.map(a => a.id), kardType }
    const res  = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${user.uid}` }, body: JSON.stringify(body) })
    const data = await res.json()
    sendResult.value = { ok: data.status === true, message: data.message ?? (data.status ? 'Done.' : 'Request failed.') }
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

/* ── Withjoy-Style Unified 3-Column Metric Card ── */
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
.em-send-result { flex-shrink: 0; display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; margin-bottom: 18px; border-radius: 10px; font-size: 13px; }
.em-send-result--ok  { background: rgba(52,211,153,0.08); color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
.em-send-result--err { background: rgba(255,69,58,0.08);  color: #fc8181; border: 1px solid rgba(255,69,58,0.2); }
.em-result-title { font-weight: 700; margin: 0 0 2px; }
.em-result-msg   { margin: 0; opacity: 0.8; }
.em-result-dismiss { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 12px; opacity: 0.7; color: inherit; flex-shrink: 0; }
.em-result-dismiss:hover { opacity: 1; }
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
.em-tpl-radio   { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--gold); flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; }
.em-tpl-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); }
.em-tpl-body    { flex: 1; min-width: 0; }
.em-tpl-content { font-size: 13px; color: var(--c-txt); margin: 0 0 4px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }

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
  --cx-ground:     #f8f9fa;
  --cx-card:       #ffffff;
  --cx-line:       #eef0f3;
  --cx-shadow:     0 20px 48px -12px rgba(0, 0, 0, 0.07), 0 2px 6px rgba(0, 0, 0, 0.02);
  --cx-label:      #18181b;
  --cx-muted:      #64748b;
  --cx-faint:      #94a3b8;
  --cx-field:      #ffffff;
  --cx-field-line: #e2e8f0;
  --cx-track:      #f1f3f5;
  --cx-seg-bg:     #ffffff;
  --cx-seg-fg:     #18181b;
  --cx-seg-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --cx-cta:        #18181b;
  --cx-cta-fg:     #ffffff;
  --cx-cta-hover:  #27272a;
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
  border-bottom: 1px solid #f1f3f5 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}
.em-drawer.em-drawer--composer .em-drawer-header-left {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
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
  font-size: 18px !important;
  font-weight: 600 !important;
  color: var(--cx-label) !important;
  letter-spacing: -0.015em !important;
  margin: 0 !important;
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
  flex: 0 0 54% !important;
  max-width: 54% !important;
  min-width: 380px !important;
  height: 100% !important;
  overflow-y: auto !important;
  background: var(--cx-card) !important;
  padding: 40px 48px 64px 48px !important;
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

/* ── Result Alert Banner ── */
.em-drawer.em-drawer--composer .em-send-result {
  border-radius: 12px !important;
  padding: 14px 16px !important;
  margin-bottom: 24px !important;
  font-size: 13.5px !important;
  line-height: 1.5 !important;
}
.em-drawer.em-drawer--composer .em-send-result--ok {
  background: #ecfdf5 !important;
  border: 1px solid #a7f3d0 !important;
  color: #065f46 !important;
}
.em-drawer.em-drawer--composer .em-send-result--err {
  background: #fef2f2 !important;
  border: 1px solid #fecaca !important;
  color: #991b1b !important;
}

/* ── Campaign Field (WithJoy-style sleek input) ── */
.em-drawer.em-drawer--composer .em-custom-camp-display {
  padding: 12px 16px !important;
  border-radius: 10px !important;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #18181b !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
  transition: border-color 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-custom-camp-display:hover {
  border-color: #cbd5e1 !important;
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
  background: #f1f3f5 !important;
  border-radius: 9999px !important;
  padding: 4px !important;
  display: flex !important;
  gap: 3px !important;
  border: 1px solid rgba(0, 0, 0, 0.03) !important;
}
.em-drawer.em-drawer--composer .em-send-ch-btn {
  flex: 1 1 0 !important;
  height: 38px !important;
  border: none !important;
  border-radius: 9999px !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  color: #6b7280 !important;
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
  color: #18181b !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04) !important;
}

/* ── Recipients ── */
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
  flex: 1 !important;
  height: 42px !important;
  padding: 0 36px 0 14px !important;
  border-radius: 10px !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  background-color: #ffffff !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 14px center !important;
  appearance: none !important;
  border: 1px solid #e2e8f0 !important;
  color: #18181b !important;
  cursor: pointer !important;
  transition: border-color 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-filter-select--drawer:hover {
  border-color: #cbd5e1 !important;
}
.em-drawer.em-drawer--composer .em-filter-select--drawer:focus {
  border-color: #18181b !important;
  outline: none !important;
}

.em-drawer.em-drawer--composer .em-stat-dd-trigger {
  height: 44px !important;
  padding: 0 16px !important;
  border-radius: 10px !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #18181b !important;
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  cursor: pointer !important;
  transition: all 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-stat-dd-trigger:hover {
  border-color: #cbd5e1 !important;
}
.em-drawer.em-drawer--composer .em-stat-dd-dot {
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  margin-right: 10px !important;
  flex-shrink: 0 !important;
}
.em-drawer.em-drawer--composer .em-stat-dd-label {
  color: #18181b !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
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
.em-drawer.em-drawer--composer .em-pick-toggle-btn {
  margin-top: 10px !important;
  height: 44px !important;
  width: 100% !important;
  border-radius: 9999px !important;
  border: 1.5px solid #e2e8f0 !important;
  background: #ffffff !important;
  color: #18181b !important;
  font-size: 13.5px !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 0 20px !important;
  cursor: pointer !important;
  transition: all 160ms ease !important;
}
.em-drawer.em-drawer--composer .em-pick-toggle-btn:hover {
  border-color: #cbd5e1 !important;
  background: #f8fafc !important;
}
.em-drawer.em-drawer--composer .em-pick-toggle-btn--on {
  border-color: #18181b !important;
  background: #f8fafc !important;
}
.em-drawer.em-drawer--composer .em-pick-toggle-btn .em-chip-cnt {
  font-size: 11.5px !important;
  font-weight: 600 !important;
  padding: 2px 8px !important;
  border-radius: 9999px !important;
  background: #18181b !important;
  color: #ffffff !important;
}
.em-drawer.em-drawer--composer .em-recip-hint {
  margin-top: 10px !important;
  font-size: 12.5px !important;
  color: #6b7280 !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}
.em-drawer.em-drawer--composer .em-pick-wrap {
  margin-top: 10px !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
  overflow: hidden !important;
  background: #ffffff !important;
}
.em-drawer.em-drawer--composer .em-pick-toolbar {
  padding: 10px 14px !important;
  background: #f8fafc !important;
  border-bottom: 1px solid #e2e8f0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}
.em-drawer.em-drawer--composer .em-pick-search-wrap {
  height: 36px !important;
  border-radius: 9999px !important;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
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
  padding: 14px 16px !important;
  border-radius: 12px !important;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  margin-bottom: 8px !important;
  transition: all 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-tpl-item:hover {
  border-color: #cbd5e1 !important;
}
.em-drawer.em-drawer--composer .em-tpl-item--active {
  border-color: #18181b !important;
  box-shadow: 0 0 0 1px #18181b !important;
}
.em-drawer.em-drawer--composer .em-tpl-content {
  font-size: 14px !important;
  line-height: 1.55 !important;
  color: #18181b !important;
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
  flex: 0 0 46% !important;
  max-width: 46% !important;
  min-width: 0 !important;
  height: 100% !important;
  overflow-y: auto !important;
  background: #f8f9fa !important;
  border-left: 1px solid #f1f3f5 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  padding: 44px 36px 60px !important;
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

/* ── The Single Elevated Preview Card ── */
.em-drawer.em-drawer--composer .em-preview-card {
  width: 100% !important;
  max-width: 440px !important;
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  border-radius: 20px !important;
  box-shadow: 0 20px 48px -12px rgba(0, 0, 0, 0.07), 0 2px 6px rgba(0, 0, 0, 0.02) !important;
  padding: 24px 22px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 18px !important;
}
.em-drawer.em-drawer--composer .em-preview-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding-bottom: 8px !important;
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

/* ── Live Message Mockup Screen ── */
.em-drawer.em-drawer--composer .em-preview-phone {
  background: #f1f3f5 !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 22px !important;
  padding: 18px 16px 20px !important;
  min-height: 280px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-end !important;
  position: relative !important;
}
.em-drawer.em-drawer--composer .em-preview-notch {
  width: 44px !important;
  height: 4.5px !important;
  border-radius: 9999px !important;
  background: #cbd5e1 !important;
  margin: 0 auto 16px auto !important;
  flex-shrink: 0 !important;
}
.em-drawer.em-drawer--composer .em-phone-statusbar {
  display: flex !important;
  justify-content: space-between !important;
  margin-bottom: 24px !important;
  padding: 0 4px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  color: #94a3b8 !important;
}
.em-drawer.em-drawer--composer .em-preview-screen {
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-end !important;
  flex: 1 !important;
}
.em-drawer.em-drawer--composer .em-preview-bubble {
  background: #007aff !important;
  color: #ffffff !important;
  border-radius: 18px 18px 4px 18px !important;
  padding: 10px 15px !important;
  font-size: 13.5px !important;
  line-height: 1.45 !important;
  max-width: 88% !important;
  margin-left: auto !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
  word-break: break-word !important;
}
.em-drawer.em-drawer--composer .em-preview-bubble--wsp {
  background: #d9fdd3 !important;
  color: #111b21 !important;
  border-radius: 14px 14px 2px 14px !important;
  padding: 10px 14px !important;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08) !important;
}
.em-drawer.em-drawer--composer .em-preview-token {
  background: rgba(255, 255, 255, 0.24) !important;
  color: #ffffff !important;
  padding: 1px 6px !important;
  border-radius: 4px !important;
  font-weight: 600 !important;
}
.em-drawer.em-drawer--composer .em-preview-bubble--wsp .em-preview-token {
  background: rgba(0, 0, 0, 0.06) !important;
  color: #075e54 !important;
}
.em-drawer.em-drawer--composer .em-preview-caption {
  font-size: 13px !important;
  color: #64748b !important;
  text-align: center !important;
  margin: 14px 0 0 !important;
  line-height: 1.5 !important;
}
.em-drawer.em-drawer--composer .em-preview-caption strong {
  color: #0f172a !important;
  font-weight: 600 !important;
}

/* ── Fixed Bottom Footer Rail: Clean WithJoy Actions ── */
.em-drawer.em-drawer--composer .em-drawer-footer {
  flex-shrink: 0 !important;
  height: 72px !important;
  padding: 0 48px !important;
  background: #ffffff !important;
  border-top: 1px solid #f1f3f5 !important;
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
  border: 1.5px solid #e2e8f0 !important;
  background: #ffffff !important;
  color: #374151 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 150ms ease !important;
}
.em-drawer.em-drawer--composer .em-drawer-cancel:hover {
  border-color: #cbd5e1 !important;
  color: #111827 !important;
  background: #f8fafc !important;
}
.em-drawer.em-drawer--composer .em-drawer-send {
  flex: 0 0 auto !important;
  height: 44px !important;
  padding: 0 32px !important;
  border-radius: 9999px !important;
  border: none !important;
  background: #18181b !important;
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
  background: #27272a !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16) !important;
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
    border-top: 1px solid #f1f3f5 !important;
    height: auto !important;
    overflow-y: visible !important;
    padding: 32px 20px 48px !important;
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
