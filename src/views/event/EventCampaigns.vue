<template>
  <div class="em-root">

    <!-- ══════════════════════════════════════════════
         CAMPAIGN LIST (no campaign selected)
         ══════════════════════════════════════════════ -->
    <template v-if="!selectedCustomCamp">

      <!-- Stat cards -->
      <div class="em-stats" v-if="!loadingCustomCamps || customCampaigns.length">
        <div class="em-stat-card">
          <div class="em-stat-icon em-stat-icon--purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div class="em-stat-body">
            <span class="em-stat-lbl">Total Campaigns</span>
            <span class="em-stat-val">{{ customCampaigns.length }}</span>
          </div>
        </div>
        <div class="em-stat-card">
          <div class="em-stat-icon em-stat-icon--blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div class="em-stat-body">
            <span class="em-stat-lbl">Invitation</span>
            <span class="em-stat-val">{{ customCampaigns.filter(c => c.type === 'invitation').length }}</span>
          </div>
        </div>
        <div class="em-stat-card">
          <div class="em-stat-icon em-stat-icon--gold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div class="em-stat-body">
            <span class="em-stat-lbl">Contribution</span>
            <span class="em-stat-val">{{ customCampaigns.filter(c => c.type === 'contribution').length }}</span>
          </div>
        </div>
        <div class="em-stat-card">
          <div class="em-stat-icon em-stat-icon--teal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="em-stat-body">
            <span class="em-stat-lbl">Contact</span>
            <span class="em-stat-val">{{ customCampaigns.filter(c => c.type === 'contact').length }}</span>
          </div>
        </div>
      </div>

      <!-- Panel -->
      <div class="em-panel">
        <div class="em-panel-hd">
          <h2 class="em-panel-title">Notifications</h2>
          <div class="em-panel-acts">
            <button class="em-add-btn" @click="openCampDialog(null)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Campaign
            </button>
          </div>
        </div>

        <div class="em-table-area">
          <div v-if="loadingCustomCamps" class="em-loading-state">
            <svg class="em-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span>Loading campaigns…</span>
          </div>

          <div v-else-if="!customCampaigns.length" class="em-empty-state">
            <div class="em-empty-icon">
              <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="#1e1e1e"/>
                <path d="M42 22H22a2 2 0 0 0-2 2v16l6-4h16a2 2 0 0 0 2-2V24a2 2 0 0 0-2-2z" fill="#3a3a3a"/>
                <circle cx="44" cy="40" r="5" fill="#B8924D" fill-opacity="0.2" stroke="#B8924D" stroke-width="1.5"/>
                <line x1="44" y1="37.5" x2="44" y2="42.5" stroke="#B8924D" stroke-width="1.8" stroke-linecap="round"/>
                <line x1="41.5" y1="40" x2="46.5" y2="40" stroke="#B8924D" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="em-empty-title">No campaigns yet</p>
            <p class="em-empty-sub">Create a named campaign to send targeted SMS messages to specific attendees.</p>
            <button class="em-empty-cta" @click="openCampDialog(null)">Create First Campaign</button>
          </div>

          <div v-else class="eca-list">
            <div v-for="camp in pagedCampaigns" :key="camp.id"
              class="eca-card" @click="selectCustomCamp(camp)">
              <div class="eca-card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div class="eca-card-info">
                <span class="eca-card-name">{{ camp.name }}</span>
                <span class="eca-card-meta">Created {{ formatDate(camp.createdAt) }}</span>
              </div>
              <div class="eca-card-badges">
                <span class="eca-badge eca-badge--draft" style="text-transform:capitalize">{{ camp.type }}</span>
              </div>
              <div class="eca-camp-actions" @click.stop>
                <button class="em-camp-item-btn" @click="openCampDialog(camp)" title="Edit">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="em-camp-item-btn em-camp-item-btn--del" @click="deleteCustomCampaign(camp)" title="Delete">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B5B5BB" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loadingCustomCamps && customCampaigns.length" class="em-table-footer" :class="{ 'em-footer--disabled': campTotalPages === 1 }">
          <span class="em-range-lbl">
            {{ (campPage - 1) * CAMP_PAGE_SIZE + 1 }}–{{ Math.min(campPage * CAMP_PAGE_SIZE, customCampaigns.length) }}
            of {{ customCampaigns.length }}
          </span>
          <div class="em-paginator">
            <button class="em-page-btn em-page-btn--nav" :disabled="campPage === 1" @click="campGoPage(campPage - 1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <template v-for="p in campPageNumbers" :key="String(p)">
              <span v-if="p === '…'" class="em-page-ellipsis">…</span>
              <button v-else class="em-page-btn" :class="{ 'em-page-btn--active': campPage === p }" @click="campGoPage(p)">{{ p }}</button>
            </template>
            <button class="em-page-btn em-page-btn--nav" :disabled="campPage === campTotalPages" @click="campGoPage(campPage + 1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════
         CAMPAIGN DETAIL (campaign selected)
         ══════════════════════════════════════════════ -->
    <template v-else>

      <!-- Stat cards for detail view -->
      <div class="em-stats">
        <div class="em-stat-card">
          <div class="em-stat-icon em-stat-icon--purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="em-stat-body">
            <span class="em-stat-lbl">Total Attendees</span>
            <span class="em-stat-val">{{ customStatusCounts.all }}</span>
          </div>
        </div>
        <div class="em-stat-card">
          <div class="em-stat-icon em-stat-icon--blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
          <div class="em-stat-body">
            <span class="em-stat-lbl">Sent</span>
            <span class="em-stat-val">{{ customStatusCounts.sent }}</span>
          </div>
        </div>
        <div class="em-stat-card">
          <div class="em-stat-icon em-stat-icon--teal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="em-stat-body">
            <span class="em-stat-lbl">Delivered</span>
            <span class="em-stat-val">{{ customStatusCounts.delivered }}</span>
          </div>
        </div>
        <div v-if="detailChannel === 'whatsapp'" class="em-stat-card">
          <div class="em-stat-icon em-stat-icon--blue2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 6 7 17 2 12"/><polyline points="23 6 12 17 10.5 15.5"/>
            </svg>
          </div>
          <div class="em-stat-body">
            <span class="em-stat-lbl">Read</span>
            <span class="em-stat-val">{{ customStatusCounts.read }}</span>
          </div>
        </div>
        <div class="em-stat-card">
          <div class="em-stat-icon em-stat-icon--red">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="em-stat-body">
            <span class="em-stat-lbl">Failed</span>
            <span class="em-stat-val">{{ customStatusCounts.failed }}</span>
          </div>
        </div>
      </div>

      <!-- Panel -->
      <div class="em-panel">

        <!-- Panel header -->
        <div class="em-panel-hd">
          <button class="em-detail-back" @click="backToCampaignList">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Notifications
          </button>
          <h2 class="em-panel-title">{{ selectedCustomCamp.name }}</h2>
          <span class="em-detail-type">{{ selectedCustomCamp.type }}</span>
          <span class="em-detail-count">{{ customFilteredAttendees.length }} attendee{{ customFilteredAttendees.length !== 1 ? 's' : '' }}</span>
          <div class="em-panel-acts">
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

        <!-- Filter bar -->
        <div class="em-panel-filter-bar">
          <div class="em-filter-group">
            <span class="em-filter-lbl">Channel</span>
            <div class="em-filter-pills">
              <button class="em-filter-pill em-filter-pill--ch" :class="{ 'em-filter-pill--on': detailChannel === 'whatsapp' }" @click="detailChannel = 'whatsapp'">WhatsApp</button>
              <button class="em-filter-pill em-filter-pill--ch" :class="{ 'em-filter-pill--on': detailChannel === 'sms' }" @click="detailChannel = 'sms'">SMS</button>
            </div>
          </div>
          <div class="em-filter-group-cluster">
          <div class="em-filter-group">
            <span class="em-filter-lbl">Status</span>
            <div class="em-stat-dd em-status-filter-dd">
              <button ref="statusDdTriggerRef" class="em-stat-dd-trigger"
                :style="DRAWER_STATUS_COLORS[customStatus] ? { background: DRAWER_STATUS_COLORS[customStatus].bg, color: DRAWER_STATUS_COLORS[customStatus].fg, borderColor: DRAWER_STATUS_COLORS[customStatus].border } : {}"
                @click="toggleStatusDd">
                <span class="em-stat-dd-dot" :style="{ background: DRAWER_STATUS_COLORS[customStatus]?.fg ?? '#555' }"/>
                <span class="em-stat-dd-label">{{ STATUS_OPTIONS.find(o => o.v === customStatus)?.l ?? 'All' }}</span>
                <span class="em-stat-dd-n">{{ customStatusCounts[customStatus] ?? 0 }}</span>
                <svg class="em-stat-dd-chev" :class="{ 'em-stat-dd-chev--open': customStatusDropOpen }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <Teleport to="body">
                <div v-if="customStatusDropOpen" ref="statusDdMenuRef" class="em-stat-dd-menu em-stat-dd-menu--float"
                  :style="{ top: statusDdPos.top + 'px', left: statusDdPos.left + 'px', width: statusDdPos.width + 'px' }">
                  <button v-for="opt in STATUS_OPTIONS" :key="opt.v"
                    class="em-stat-dd-item" :class="{ 'em-stat-dd-item--on': customStatus === opt.v }"
                    :style="{ color: DRAWER_STATUS_COLORS[opt.v]?.fg }"
                    @click="customStatus = opt.v; customStatusDropOpen = false">
                    <span class="em-stat-dd-dot" :style="{ background: DRAWER_STATUS_COLORS[opt.v]?.fg ?? '#555' }"/>
                    <span class="em-stat-dd-n">{{ customStatusCounts[opt.v] ?? 0 }}</span>
                    {{ opt.l }}
                  </button>
                </div>
              </Teleport>
            </div>
          </div>
          <div class="em-filter-group" v-if="props.event?.labels?.length">
            <span class="em-filter-lbl">List</span>
            <div class="em-stat-dd em-status-filter-dd">
              <button ref="listDdTriggerRef" class="em-stat-dd-trigger" @click="toggleListDd">
                <span class="em-stat-dd-label">{{ props.event.labels.find(l => l.id === customLabelId)?.name ?? 'All Lists' }}</span>
                <svg class="em-stat-dd-chev" :class="{ 'em-stat-dd-chev--open': customLabelDropOpen }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <Teleport to="body">
                <div v-if="customLabelDropOpen" ref="listDdMenuRef" class="em-stat-dd-menu em-stat-dd-menu--float"
                  :style="{ top: listDdPos.top + 'px', left: listDdPos.left + 'px', width: listDdPos.width + 'px' }">
                  <button class="em-stat-dd-item" :class="{ 'em-stat-dd-item--on': customLabelId === null }"
                    @click="customLabelId = null; customLabelDropOpen = false">
                    All Lists
                  </button>
                  <button v-for="lbl in props.event.labels" :key="lbl.id"
                    class="em-stat-dd-item" :class="{ 'em-stat-dd-item--on': customLabelId === lbl.id }"
                    @click="customLabelId = lbl.id; customLabelDropOpen = false">
                    {{ lbl.name }}
                  </button>
                </div>
              </Teleport>
            </div>
          </div>
          </div>
        </div>

        <!-- Detail card list -->
        <div class="em-table-area">
          <!-- Skeleton -->
          <div v-if="loading && !attendees.length" class="eca-list">
            <div v-for="n in 8" :key="`csk-${n}`" class="eca-card eca-card--sk">
              <div class="eca-sk-circle" />
              <div class="eca-card-info">
                <div class="eca-sk-bar eca-sk-bar--lg" />
                <div class="eca-sk-bar eca-sk-bar--sm" style="margin-top:4px" />
              </div>
              <div class="eca-card-badges">
                <div class="eca-sk-bar eca-sk-bar--sm" />
              </div>
              <div class="eca-sk-bar eca-sk-bar--sm" style="width:60px" />
            </div>
          </div>

          <!-- Empty state -->
          <div v-else-if="!loading && !customFilteredAttendees.length" class="em-empty-state em-empty-state--sm">
            <p class="em-empty-title">No attendees match these filters</p>
            <p class="em-empty-sub">Try changing the status or list filter.</p>
          </div>

          <!-- Cards -->
          <div v-else class="eca-list">
            <div v-for="att in pagedDetailAttendees" :key="att.id"
              class="eca-card eca-card--detail"
              :class="`eca-card--${getCustomStatus(att) ?? 'unsent'}`">
              <!-- Avatar -->
              <div class="eca-card-icon eca-card-icon--avatar"
                :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }">
                {{ initials(att.fullName) }}
              </div>
              <!-- Identity -->
              <div class="eca-card-info">
                <span class="eca-card-name">{{ att.fullName }}</span>
                <span class="eca-card-meta">{{ att.phone || '—' }}</span>
              </div>
              <!-- Status badge -->
              <div class="eca-card-badges">
                <span class="eca-badge"
                  :class="`eca-badge--${getCustomStatus(att) === 'read' ? 'read' : getCustomStatus(att) === 'delivered' ? 'sent' : (getCustomStatus(att) ?? 'draft')}`">
                  <svg v-if="getCustomStatus(att) === 'read'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 6 7 17 2 12"/><polyline points="23 6 12 17 10.5 15.5"/></svg>
                  <svg v-else-if="getCustomStatus(att) === 'delivered'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg v-else-if="getCustomStatus(att) === 'failed'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {{ STATUS_LABELS[getCustomStatus(att)] ?? 'Unsent' }}
                </span>
              </div>
              <!-- Date -->
              <span class="eca-card-date">{{ formatDate(att.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Detail footer -->
        <div class="em-table-footer" :class="{ 'em-footer--disabled': detailTotalPages === 1 }">
          <span class="em-range-lbl">
            {{ customFilteredAttendees.length === 0 ? '0' : (detailPage - 1) * DETAIL_PAGE_SIZE + 1 }}–{{ Math.min(detailPage * DETAIL_PAGE_SIZE, customFilteredAttendees.length) }}
            of {{ customFilteredAttendees.length }}
          </span>
          <div class="em-paginator">
            <button class="em-page-btn em-page-btn--nav" :disabled="detailPage === 1" @click="detailGoPage(detailPage - 1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <template v-for="p in detailPageNumbers" :key="String(p)">
              <span v-if="p === '…'" class="em-page-ellipsis">…</span>
              <button v-else class="em-page-btn" :class="{ 'em-page-btn--active': detailPage === p }" @click="detailGoPage(p)">{{ p }}</button>
            </template>
            <button class="em-page-btn em-page-btn--nav" :disabled="detailPage === detailTotalPages" @click="detailGoPage(detailPage + 1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

    </template>

    <!-- ══════════════════════════════════════════════
         SEND DRAWER
         ══════════════════════════════════════════════ -->
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
                  <span class="em-drawer-title">Send {{ sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS' }} Campaign</span>
                </div>
                <button class="em-drawer-close" @click="closeSendDrawer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

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

              <div class="em-drawer-body">
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Campaign</p>
                  <div class="em-custom-camp-display">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {{ selectedCustomCamp?.name }}
                    <span class="em-custom-camp-type">{{ selectedCustomCamp?.type }}</span>
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
                  <div class="em-stat-dd em-recip-dd" v-click-outside="() => recipDropOpen = false">
                    <button class="em-stat-dd-trigger"
                      :style="DRAWER_STATUS_COLORS[sendRecipMode] ? { background: DRAWER_STATUS_COLORS[sendRecipMode].bg, color: DRAWER_STATUS_COLORS[sendRecipMode].fg, borderColor: DRAWER_STATUS_COLORS[sendRecipMode].border } : {}"
                      @click="recipDropOpen = !recipDropOpen">
                      <span class="em-stat-dd-dot" :style="{ background: DRAWER_STATUS_COLORS[sendRecipMode]?.fg ?? '#555' }"/>
                      <span class="em-stat-dd-label">{{ SEND_STATUS_OPTS.find(o => o.v === sendRecipMode)?.l ?? 'All' }}</span>
                      <span class="em-stat-dd-n">{{ sendRecipMode === 'all' ? sendRecipPool.length : (sendStatusCounts[sendRecipMode] ?? 0) }}</span>
                      <svg class="em-stat-dd-chev" :class="{ 'em-stat-dd-chev--open': recipDropOpen }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div v-if="recipDropOpen" class="em-stat-dd-menu">
                      <button v-for="opt in SEND_STATUS_OPTS" :key="opt.v"
                        class="em-stat-dd-item" :class="{ 'em-stat-dd-item--on': sendRecipMode === opt.v }"
                        :style="{ color: DRAWER_STATUS_COLORS[opt.v]?.fg }"
                        @click="sendRecipMode = opt.v; recipDropOpen = false; drawerPickList = []">
                        <span class="em-stat-dd-dot" :style="{ background: DRAWER_STATUS_COLORS[opt.v]?.fg ?? '#555' }"/>
                        <span class="em-stat-dd-n">{{ opt.v === 'all' ? sendRecipPool.length : (sendStatusCounts[opt.v] ?? 0) }}</span>
                        {{ opt.l }}
                      </button>
                    </div>
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
                    {{ sendRecipCount }} recipient{{ sendRecipCount !== 1 ? 's' : '' }} will receive this message
                  </p>
                </div>

                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">
                    {{ sendChannel === 'whatsapp' ? 'Template' : 'Message' }}
                    <span v-if="sendChannel === 'whatsapp' && loadingTemplates" class="em-tpl-loading">
                      <svg class="em-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Loading…
                    </span>
                    <button class="em-browse-tpl-btn" @click="openCampDialog(selectedCustomCamp)">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit message
                    </button>
                  </p>

                  <template v-if="sendChannel === 'whatsapp'">
                    <div v-if="!selectedCustomCamp?.whatsappMessage" class="em-msg-missing-warn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>No WhatsApp Custom Message set for this campaign — the template's placeholder will be blank. <button class="em-msg-missing-warn-btn" @click="openCampDialog(selectedCustomCamp)">Set it now</button> before sending.</span>
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
                      <span>No SMS message set for this campaign — it will be sent blank. <button class="em-msg-missing-warn-btn" @click="openCampDialog(selectedCustomCamp)">Set it now</button> before sending.</span>
                    </div>
                  </template>
                </div>
              </div>

              <div class="em-drawer-footer">
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
                <button class="em-send-ch-btn" :class="{ 'em-send-ch-btn--wsp': campDialogMsgTab === 'whatsapp' }" :style="campDialogMsgTab === 'whatsapp' ? ACTIVE_CH_STYLE : null" @click="campDialogMsgTab = 'whatsapp'">
                  <svg width="14" height="14" viewBox="0 0 448 512" fill="#128C7E"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                  WhatsApp
                </button>
                <button class="em-send-ch-btn" :class="{ 'em-send-ch-btn--sms': campDialogMsgTab === 'sms' }" :style="campDialogMsgTab === 'sms' ? ACTIVE_CH_STYLE : null" @click="campDialogMsgTab = 'sms'">
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
import { collection, query, orderBy, where, getDocs, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore'

const vClickOutside = {
  mounted(el, binding) {
    el._co = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el._co)
  },
  unmounted(el) { document.removeEventListener('mousedown', el._co) }
}

const props = defineProps({ event: Object, eventId: String })
const route  = useRoute()
const router = useRouter()
const eventId = computed(() => props.eventId ?? route.params.eventId)

const SMS_URL = 'https://sendsmsaction-frbu33fema-uc.a.run.app'
const WSP_URL = 'https://sendwhatsappinvitationmessages-frbu33fema-uc.a.run.app'
const GENERAL_CAMPAIGN_CATEGORY = 'haflaway-general-campaign'

// Inline style wins over any stylesheet cascade oddity — used to force the
// active WhatsApp/SMS tab to render visibly. Sourced from --gold (the live
// org brand accent, set at runtime by useOrg.js) at low opacity, matching
// the tinted-accent treatment used elsewhere (e.g. .em-dialog-type-btn--on).
const ACTIVE_CH_STYLE = {
  background: 'rgb(from var(--gold) r g b / 0.14)',
  color: 'var(--gold)',
  borderColor: 'rgb(from var(--gold) r g b / 0.5)',
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
const campPage            = ref(1)
const CAMP_PAGE_SIZE      = 10

const campTotalPages = computed(() => Math.max(1, Math.ceil(customCampaigns.value.length / CAMP_PAGE_SIZE)))
const pagedCampaigns = computed(() => {
  const start = (campPage.value - 1) * CAMP_PAGE_SIZE
  return customCampaigns.value.slice(start, start + CAMP_PAGE_SIZE)
})
const campPageNumbers = computed(() => {
  const total = campTotalPages.value, cur = campPage.value
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
function campGoPage(n) { if (n >= 1 && n <= campTotalPages.value) campPage.value = n }

const selectedCustomCamp = ref(null)
const customStatus       = ref('unsent')
const customStatusDropOpen = ref(false)
const customLabelId      = ref(null)
const customLabelDropOpen = ref(false)
const detailChannel      = ref('sms')

// These dropdown menus are teleported to <body> (see template) so they
// aren't clipped by .em-panel's overflow:hidden — position them from the
// trigger's real screen coordinates instead of relying on CSS relative
// positioning.
const statusDdTriggerRef = ref(null)
const statusDdMenuRef    = ref(null)
const statusDdPos        = ref({ top: 0, left: 0, width: 0 })
const listDdTriggerRef   = ref(null)
const listDdMenuRef      = ref(null)
const listDdPos          = ref({ top: 0, left: 0, width: 0 })

function toggleStatusDd() {
  if (!customStatusDropOpen.value) {
    const r = statusDdTriggerRef.value.getBoundingClientRect()
    statusDdPos.value = { top: r.bottom + 4, left: r.left, width: r.width }
  }
  customStatusDropOpen.value = !customStatusDropOpen.value
}

function toggleListDd() {
  if (!customLabelDropOpen.value) {
    const r = listDdTriggerRef.value.getBoundingClientRect()
    listDdPos.value = { top: r.bottom + 4, left: r.left, width: r.width }
  }
  customLabelDropOpen.value = !customLabelDropOpen.value
}

function handleFilterDdOutsideClick(e) {
  if (customStatusDropOpen.value && !statusDdTriggerRef.value?.contains(e.target) && !statusDdMenuRef.value?.contains(e.target)) {
    customStatusDropOpen.value = false
  }
  if (customLabelDropOpen.value && !listDdTriggerRef.value?.contains(e.target) && !listDdMenuRef.value?.contains(e.target)) {
    customLabelDropOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleFilterDdOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleFilterDdOutsideClick))

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
      if (match) selectedCustomCamp.value = match
    }
  } catch (e) {
    console.error('Failed to load campaigns', e)
  } finally {
    loadingCustomCamps.value = false
  }
}

function selectCustomCamp(camp) {
  selectedCustomCamp.value = camp
  customStatus.value = 'unsent'
  customLabelId.value = null
  router.replace({ query: { ...route.query, campaign: camp.id } })
}

function backToCampaignList() {
  selectedCustomCamp.value = null
  const { campaign, ...rest } = route.query
  router.replace({ query: rest })
}

// ── Campaign dialog ────────────────────────────────────────────────────────────
const campDialogOpen  = ref(false)
const editingCamp     = ref(null)
const campDialogName       = ref('')
const campDialogType       = ref('invitation')
const campDialogWaMessage  = ref('')
const campDialogSmsMessage = ref('')
const campDialogMsgTab     = ref('whatsapp')
const savingCamp           = ref(false)

function openCampDialog(camp) {
  editingCamp.value = camp ?? null
  campDialogMsgTab.value = 'whatsapp'
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
const customFilteredAttendees = computed(() => {
  if (!selectedCustomCamp.value) return []
  const campId   = selectedCustomCamp.value.id
  const status   = customStatus.value
  const labelId  = customLabelId.value
  const cardType = selectedCustomCamp.value.type

  return attendees.value.filter(att => {
    if (!att.cards || att.cards[cardType] == null) return false
    if (labelId && !(att.labelIds ?? []).includes(labelId)) return false
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
  const labelId  = customLabelId.value
  const prefix   = `${detailChannel.value}_${campId}_`
  const base = attendees.value.filter(att => {
    if (!att.cards || att.cards[cardType] == null) return false
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
const pickOpen         = ref(false)
const drawerPickList   = ref([])
const drawerPickSearch = ref('')

const sendRecipPool = computed(() => {
  if (!selectedCustomCamp.value) return []
  const cardType = selectedCustomCamp.value.type
  let pool = attendees.value.filter(att => att.cards && att.cards[cardType] != null)
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
const sendDrawerOpen   = ref(false)
const sendCampaign     = ref(null)
const sendChannel      = ref('sms')
const templates        = ref([])
const selectedTemplate = ref(null)
const loadingTemplates = ref(false)
const sending          = ref(false)
const sendResult       = ref(null)

const canSend = computed(() => {
  if (sending.value || sendRecipCount.value === 0) return false
  if (sendChannel.value === 'whatsapp') return !!selectedTemplate.value && !!selectedCustomCamp.value?.whatsappMessage
  return !!selectedCustomCamp.value?.smsMessage
})

function openCustomSend() {
  sendCampaign.value = selectedCustomCamp.value.id
  sendChannel.value  = 'sms'
  sendResult.value   = null
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
  sendDrawerOpen.value = false
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

async function executeSend() {
  if (!canSend.value) return
  sending.value = true
  sendResult.value = null
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    const kardType = selectedCustomCamp.value?.type ?? 'invitation'
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
function avatarBg(n) { return `hsl(${nameHash(n ?? '') % 360}, 50%, 88%)` }
function avatarFg(n) { return `hsl(${nameHash(n ?? '') % 360}, 50%, 30%)` }
function formatDate(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '—' } }

onMounted(() => { load(); loadCustomCampaigns() })
watch(eventId, () => { if (eventId.value) { load(); loadCustomCampaigns() } })
</script>

<style scoped>
.em-root {
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  --c-bg:     #141414;
  --c-border: #2a2a2a;
  --c-track:  #2a2a2a;
  --c-muted:  #3a3a3a;
  --c-txt:    #f0f0ec;
  --c-txt-2:  #888;
  --c-txt-3:  #555;
  --c-divide: #2a2a2a;
  --c-arrow:  #3a3a3a;
  transition: background 300ms ease;
}

/* ── Stat cards ── */
.em-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.em-stat-card {
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 12px;
  padding: 20px 20px 18px; display: flex; align-items: flex-start; gap: 16px;
  transition: background 300ms ease, border-color 300ms ease;
}
.em-stat-icon {
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0; margin-top: 2px;
  display: flex; align-items: center; justify-content: center;
}
.em-stat-icon--gold   { background: rgb(from var(--gold) r g b / 0.08);  color: var(--gold); }
.em-stat-icon--blue   { background: rgba(96,165,250,0.08);  color: #60a5fa; }
.em-stat-icon--blue2  { background: rgba(52,183,241,0.08);  color: #34B7F1; }
.em-stat-icon--teal   { background: rgba(45,212,191,0.08);  color: #2dd4bf; }
.em-stat-icon--purple { background: rgba(167,139,250,0.08); color: #a78bfa; }
.em-stat-icon--red    { background: rgba(252,129,129,0.08); color: #fc8181; }
.em-stat-body { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.em-stat-lbl  { font-size: 11px; color: var(--c-txt-2); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.6px; text-transform: uppercase; }
.em-stat-val  { font-size: 32px; font-weight: 700; color: var(--c-txt); white-space: nowrap; line-height: 1; letter-spacing: -0.5px; }

/* ── Panel ── */
.em-panel {
  display: flex;
  flex-direction: column;
  background: #0d0d0d;
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 300ms ease;
}
.em-panel-hd {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--c-divide);
  gap: 10px;
}
.em-panel-title {
  font-size: 19px; font-weight: 700; color: var(--c-txt); margin: 0;
  letter-spacing: -0.3px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; min-width: 0;
}
.em-panel-acts { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }

/* ── New Campaign button ── */
.em-add-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: var(--gold); color: var(--gold-contrast); border: none; border-radius: 10px;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: background 150ms;
  font-family: inherit; flex-shrink: 0;
}
.em-add-btn:hover { background: #d4b560; }

/* ── Table area ── */
.em-table-area { overflow-x: auto; }

/* ── Filter bar (inside detail panel) ── */
.em-panel-filter-bar {
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  padding: 10px 20px; border-bottom: 1px solid var(--c-divide); background: #0d0d0d;
}

/* ── Detail header extras ── */
.em-detail-back {
  display: flex; align-items: center; gap: 5px; background: none; border: none;
  font-size: 13px; color: var(--c-txt-2); cursor: pointer; transition: color 130ms; flex-shrink: 0;
  font-family: inherit;
}
.em-detail-back:hover { color: var(--gold); }
.em-detail-type {
  font-size: 11px; font-weight: 600; color: var(--c-txt-2); background: rgba(255,255,255,0.06);
  padding: 3px 8px; border-radius: 20px; white-space: nowrap; text-transform: capitalize; flex-shrink: 0;
}
.em-detail-count { font-size: 12px; color: var(--c-txt-2); white-space: nowrap; }

/* ── Loading / empty states ── */
.em-loading-state { display: flex; align-items: center; gap: 10px; color: var(--c-txt-2); font-size: 14px; padding: 48px 0; justify-content: center; }
.em-empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; text-align: center; }
.em-empty-state--sm { padding: 40px 24px; }
.em-empty-icon  { margin-bottom: 16px; }
.em-empty-title { font-size: 16px; font-weight: 700; color: var(--c-txt); margin: 0 0 6px; }
.em-empty-sub   { font-size: 14px; color: var(--c-txt-2); margin: 0 0 16px; max-width: 300px; }
.em-empty-cta   {
  height: 36px; padding: 0 18px; border-radius: 10px; border: none;
  background: var(--gold); color: var(--gold-contrast); font-size: 13px; font-weight: 700;
  cursor: pointer; transition: background 150ms; font-family: inherit;
}
.em-empty-cta:hover { background: #d4b560; }

/* ── Action buttons (shared) ── */
.em-camp-item-btn {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--c-border);
  background: rgba(255,255,255,0.04); color: var(--c-txt-2); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 130ms;
}
.em-camp-item-btn:hover { background: var(--c-muted); color: var(--c-txt); }
.em-camp-item-btn--del:hover { background: rgba(255,69,58,0.08); color: #fc8181; border-color: rgba(255,69,58,0.25); }

/* ── Card list ── */
.eca-list {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px 16px; background: #0d0d0d;
}
.eca-card {
  display: flex; align-items: center; gap: 14px;
  padding: 13px 16px;
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 12px;
  transition: background 150ms, border-color 150ms, box-shadow 150ms;
  cursor: pointer;
}
.eca-card:hover:not(.eca-card--sk) { background: var(--c-bg); border-color: var(--c-muted); box-shadow: 0 4px 16px rgba(0,0,0,0.35); }
.eca-card--sk { pointer-events: none; }
.eca-card--selected { background: rgb(from var(--gold) r g b / 0.06) !important; border-color: rgb(from var(--gold) r g b / 0.25) !important; }

/* Card icon zone */
.eca-card-icon {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgb(from var(--gold) r g b / 0.10); color: var(--gold);
}
.eca-card-icon--avatar {
  font-size: 12px; font-weight: 700; background: unset;
}

/* Card identity */
.eca-card-info { display: flex; flex-direction: column; gap: 3px; flex: 0 0 200px; min-width: 0; }
.eca-card-name { font-size: 13px; font-weight: 600; color: var(--c-txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eca-card-meta { font-size: 11px; color: var(--c-txt-3); }

/* Card badges zone */
.eca-card-badges { flex: 1; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }

/* Badge */
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

/* Left border stripe by status */
.eca-card--sent      { box-shadow: inset 3px 0 0 rgba(48,209,88,0.55); }
.eca-card--delivered { box-shadow: inset 3px 0 0 rgba(48,209,88,0.55); }
.eca-card--read      { box-shadow: inset 3px 0 0 rgba(52,183,241,0.55); }
.eca-card--scheduled { box-shadow: inset 3px 0 0 rgb(from var(--gold) r g b / 0.55); }
.eca-card--draft     { box-shadow: inset 3px 0 0 rgba(255,255,255,0.08); }
.eca-card--failed    { box-shadow: inset 3px 0 0 rgba(255,69,58,0.40); }
.eca-card--unsent    { box-shadow: inset 3px 0 0 rgba(255,255,255,0.06); }

/* Date */
.eca-card-date { font-size: 11px; color: var(--c-txt-3); white-space: nowrap; flex-shrink: 0; text-align: right; }

/* Checkbox in detail cards */
.eca-card-cb { display: flex; align-items: center; flex-shrink: 0; }

/* Campaign list actions */
.eca-camp-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

/* Select-all bar */
.eca-selbar { display: flex; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--c-divide); background: #0d0d0d; }
.eca-selbar-cb { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.eca-selbar-lbl { font-size: 11px; font-weight: 700; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.5px; user-select: none; }

/* Skeleton */
@keyframes eca-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.eca-sk-circle { width: 40px; height: 40px; border-radius: 11px; background: var(--c-track); flex-shrink: 0; animation: eca-pulse 1.4s ease-in-out infinite; }
.eca-sk-bar    { height: 12px; border-radius: 6px; background: var(--c-track); animation: eca-pulse 1.4s ease-in-out infinite; }
.eca-sk-bar--lg { width: 140px; }
.eca-sk-bar--sm { width: 80px; }

/* Responsive */
@media (max-width: 640px) {
  .eca-list { padding: 8px 10px; gap: 5px; }

  /* Campaign list cards — simple two-row layout */
  .eca-card {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
    grid-template-areas: "icon info badges" "icon info badges";
    align-items: start; gap: 3px 12px; padding: 12px 14px;
  }
  .eca-card-icon   { grid-area: icon; align-self: center; }
  .eca-card-info   { grid-area: info; flex: unset; }
  .eca-card-badges { grid-area: badges; justify-content: flex-end; flex: unset; align-self: center; }
  .eca-card-date   { display: none; }
  .eca-camp-actions { display: none; }

  /* Detail cards: compact 2-row grid
     Row 1: cb | avatar | NAME         | [badge]
     Row 2: cb | avatar | phone        | date          */
  .eca-card.eca-card--detail {
    grid-template-columns: auto auto 1fr auto;
    grid-template-rows: auto auto;
    grid-template-areas:
      "cb icon name  bdg"
      "cb icon meta  dt";
    gap: 2px 10px;
    padding: 10px 12px;
  }
  .eca-card.eca-card--detail .eca-card-cb   { grid-area: cb;   align-self: center; grid-row: 1/3; }
  .eca-card.eca-card--detail .eca-card-icon { grid-area: icon; align-self: center; grid-row: 1/3; width: 36px; height: 36px; font-size: 11px; }
  /* Flatten info wrapper so name and meta each become a grid item */
  .eca-card.eca-card--detail .eca-card-info   { display: contents; }
  .eca-card.eca-card--detail .eca-card-name   { grid-area: name; align-self: center; font-size: 12px; min-width: 0; }
  .eca-card.eca-card--detail .eca-card-meta   { grid-area: meta; align-self: center; font-size: 10px; color: var(--c-txt-3); }
  .eca-card.eca-card--detail .eca-card-badges { grid-area: bdg;  align-self: center; justify-content: flex-end; flex: unset; margin-top: 0; }
  .eca-card.eca-card--detail .eca-card-date   { grid-area: dt;   display: block; align-self: center; font-size: 10px; color: var(--c-txt-3); padding-top: 0; text-align: right; }
}
@media (max-width: 400px) { .eca-card-date { display: none; } }

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

/* ── Filter pills ── */
.em-filter-group { display: flex; align-items: center; gap: 8px; }
/* Status + List wrap together as one unit — if pushed individually, a row
   that only has room to wrap the last group leaves it stranded flush-left
   with no push of its own. */
.em-filter-group-cluster { display: flex; align-items: center; gap: 20px; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
.em-filter-lbl   { font-size: 10px; font-weight: 700; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
.em-filter-pills { display: flex; gap: 4px; flex-wrap: wrap; }
.em-filter-pill  { height: 28px; padding: 0 12px; border-radius: 20px; border: 1px solid transparent; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 130ms; font-family: inherit; }
.em-filter-pill:hover { filter: brightness(1.15); }
.em-filter-pill--ch        { background: rgba(255,255,255,0.06); color: var(--c-txt-2); border-color: var(--c-border); }
.em-filter-pill--ch.em-filter-pill--on {
  background: rgb(from var(--gold) r g b / 0.14);
  color: var(--gold);
  border-color: rgb(from var(--gold) r g b / 0.5);
  font-weight: 700;
}
.em-filter-select {
  height: 28px; padding: 0 8px; border: 1px solid var(--c-border); border-radius: 7px;
  background: var(--c-bg); font-size: 12px; color: var(--c-txt); outline: none; cursor: pointer; color-scheme: dark;
}
.em-filter-select:focus { border-color: var(--gold); }
.em-filter-select--drawer { height: 32px; font-size: 13px; flex: 1; }
.em-drawer-list-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.em-drawer-list-lbl { font-size: 11px; font-weight: 700; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }

/* ── Table footer / pagination ── */
.em-table-footer {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; background: #0d0d0d; border-top: 1px solid var(--c-divide);
}
.em-footer--disabled { opacity: 0.38; pointer-events: none; }
.em-range-lbl   { font-size: 13px; color: var(--c-txt-2); }
.em-paginator   { display: flex; align-items: center; gap: 4px; }
.em-page-btn    { min-width: 32px; height: 32px; padding: 0 8px; border-radius: 8px; border: 1px solid var(--c-border); background: #0d0d0d; font-size: 13px; font-weight: 500; color: var(--c-txt-2); cursor: pointer; transition: all 130ms; display: flex; align-items: center; justify-content: center; }
.em-page-btn:hover:not(:disabled) { background: var(--c-muted); }
.em-page-btn:disabled { opacity: 0.4; cursor: default; }
.em-page-btn--active { background: rgba(226,232,240,0.12); border-color: rgba(226,232,240,0.18); color: var(--c-txt); }
.em-page-btn--nav    { color: var(--c-txt-2); }
.em-page-ellipsis   { font-size: 13px; color: var(--c-txt-3); padding: 0 4px; }

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

/* ── Send Drawer ── */
.em-overlay { position: fixed; inset: 0; background: var(--overlay-bg); z-index: 1000; display: flex; align-items: stretch; justify-content: flex-end; }
.em-overlay--center { align-items: center; justify-content: center; }
.em-drawer  { width: 400px; max-width: 95vw; height: 100%; background: #0f0f0f; display: flex; flex-direction: column; box-shadow: -12px 0 40px rgba(0,0,0,0.6); }
.em-drawer-header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--c-divide); }
.em-drawer-header-left { display: flex; align-items: center; gap: 8px; }
.em-drawer-title { font-size: 16px; font-weight: 700; color: var(--c-txt); }
.em-drawer-close { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.06); border: none; cursor: pointer; color: var(--c-txt-2); display: flex; align-items: center; justify-content: center; transition: background 130ms; }
.em-drawer-close:hover { background: rgba(255,255,255,0.10); }
.em-send-result { flex-shrink: 0; display: flex; align-items: flex-start; gap: 10px; padding: 12px 20px; font-size: 13px; }
.em-send-result--ok  { background: rgba(52,211,153,0.08); color: #34d399; border-bottom: 1px solid rgba(52,211,153,0.2); }
.em-send-result--err { background: rgba(255,69,58,0.08);  color: #fc8181; border-bottom: 1px solid rgba(255,69,58,0.2); }
.em-result-title { font-weight: 700; margin: 0 0 2px; }
.em-result-msg   { margin: 0; opacity: 0.8; }
.em-result-dismiss { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 12px; opacity: 0.7; color: inherit; flex-shrink: 0; }
.em-result-dismiss:hover { opacity: 1; }
.em-drawer-body  { flex: 1; overflow-y: auto; padding: 0 20px 20px; }
.em-drawer-section { padding: 18px 0; border-bottom: 1px solid var(--c-divide); }
.em-drawer-section:last-child { border-bottom: none; }
.em-drawer-section-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 12px; }
.em-custom-camp-display { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgb(from var(--gold) r g b / 0.3); background: rgb(from var(--gold) r g b / 0.06); font-size: 14px; font-weight: 600; color: var(--c-txt); }
.em-custom-camp-type { margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c-txt-2); text-transform: capitalize; }
.em-send-ch-toggle { display: flex; gap: 8px; }
.em-send-ch-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; height: 40px; border-radius: 10px; border: 1px solid var(--c-border, #2a2a2a); background: var(--c-bg, #1c1c1f); font-size: 14px; font-weight: 500; color: var(--c-txt-2, #8a8a92); cursor: pointer; transition: all 130ms; }
.em-send-ch-btn:hover { border-color: #C9A84C; color: #C9A84C; }
.em-send-ch-btn--wsp, .em-send-ch-btn--sms { background: rgb(from var(--gold) r g b / 0.14); color: var(--gold); border-color: rgb(from var(--gold) r g b / 0.5); font-weight: 700; }
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
.em-tpl-meta    { font-size: 11px; color: var(--c-txt-3); margin: 0; }
.em-drawer-footer { flex-shrink: 0; display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--c-divide); background: var(--c-bg); }
.em-drawer-cancel { flex: 1; height: 40px; border-radius: 10px; border: 1px solid var(--c-border); background: rgba(255,255,255,0.05); font-size: 14px; font-weight: 500; color: var(--c-txt-2); cursor: pointer; transition: background 130ms; font-family: inherit; }
.em-drawer-cancel:hover { background: rgba(255,255,255,0.09); }
.em-drawer-send { flex: 2; height: 40px; border-radius: 10px; background: var(--gold); color: var(--gold-contrast); border: none; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background 150ms; font-family: inherit; }
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

@media (max-width: 700px) {
  .em-root  { padding: 12px 14px 20px; gap: 12px; }
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

/* ── Edit button (panel header) ── */
.em-edit-camp-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  background: var(--c-bg); color: var(--c-txt-2); border: 1px solid var(--c-border); border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 130ms;
  font-family: inherit; flex-shrink: 0;
}
.em-edit-camp-btn:hover { border-color: var(--gold); color: var(--gold); }

/* ── Send button (panel header) ── */
.em-send-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: var(--gold); color: var(--gold-contrast); border: none; border-radius: 10px;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: background 150ms;
  font-family: inherit; flex-shrink: 0;
}
.em-send-btn:hover { background: #d4b560; }

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
</style>
