<template>
  <div class="em-root">

    <!-- ══════════════════════════════════════════════
         CAMPAIGN LIST (no campaign selected)
         ══════════════════════════════════════════════ -->
    <template v-if="!selectedCustomCamp">
      <div class="em-custom-toolbar">
        <div>
          <h2 class="em-custom-title">Notifications</h2>
          <p class="em-custom-sub">Named SMS campaigns you can send to any group of attendees</p>
        </div>
        <button class="em-send-btn" @click="openCampDialog(null)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Campaign
        </button>
      </div>

      <div class="em-custom-body">
        <div class="em-custom-scroll">
          <div v-if="loadingCustomCamps" class="em-custom-loading">
            <svg class="em-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span>Loading campaigns…</span>
          </div>

          <div v-else-if="!customCampaigns.length" class="em-custom-empty">
            <div class="em-empty-icon">
              <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="#F4F4F6"/>
                <path d="M42 22H22a2 2 0 0 0-2 2v16l6-4h16a2 2 0 0 0 2-2V24a2 2 0 0 0-2-2z" fill="#DDDBD6"/>
              </svg>
            </div>
            <p class="em-empty-title">No campaigns yet</p>
            <p class="em-empty-sub">Create a named campaign to send targeted SMS messages to specific attendees.</p>
            <button class="em-empty-cta em-empty-cta--primary" @click="openCampDialog(null)">Create First Campaign</button>
          </div>

          <div v-else class="em-camp-table-wrap">
            <table class="em-camp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="camp in pagedCampaigns" :key="camp.id" class="em-camp-row" @click="selectCustomCamp(camp)">
                  <td class="em-ct-name">{{ camp.name }}</td>
                  <td class="em-ct-type"><span class="em-ct-type-badge">{{ camp.type }}</span></td>
                  <td class="em-ct-date">{{ formatDate(camp.createdAt) }}</td>
                  <td class="em-ct-actions" @click.stop>
                    <button class="em-camp-item-btn" @click="openCampDialog(camp)" title="Edit">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="em-camp-item-btn em-camp-item-btn--del" @click="deleteCustomCampaign(camp)" title="Delete">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B5B5BB" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sticky paginator footer -->
      <div v-if="!loadingCustomCamps && customCampaigns.length" class="em-table-footer" :class="{ 'em-camp-footer--disabled': campTotalPages === 1 }">
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
    </template>

    <!-- ══════════════════════════════════════════════
         CAMPAIGN DETAIL (campaign selected)
         ══════════════════════════════════════════════ -->
    <template v-else>

      <!-- Detail header -->
      <div class="em-detail-top">
        <button class="em-detail-back" @click="selectedCustomCamp = null; customSelectList = []">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Notifications
        </button>
        <h2 class="em-detail-title">{{ selectedCustomCamp.name }}</h2>
        <span class="em-detail-type">{{ selectedCustomCamp.type }}</span>
      </div>

      <!-- Filters -->
      <div class="em-detail-filters">
        <div class="em-filter-group">
          <span class="em-filter-lbl">STATUS</span>
          <div class="em-filter-pills">
            <button v-for="s in STATUS_OPTIONS" :key="s.v"
              class="em-filter-pill" :class="[s.v !== 'all' ? `em-filter-pill--${s.v}` : 'em-filter-pill--all', { 'em-filter-pill--on': customStatus === s.v }]"
              @click="customStatus = s.v"><span class="em-fp-n">{{ customStatusCounts[s.v] ?? 0 }}</span> {{ s.l }}</button>
          </div>
        </div>
        <div class="em-filter-group" v-if="props.event?.labels?.length">
          <span class="em-filter-lbl">LIST</span>
          <select v-model="customLabelId" class="em-filter-select">
            <option :value="null">All Lists</option>
            <option v-for="lbl in props.event.labels" :key="lbl.id" :value="lbl.id">{{ lbl.name }}</option>
          </select>
        </div>
        <div class="em-detail-count">
          {{ customFilteredAttendees.length }} attendee{{ customFilteredAttendees.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Detail table -->
      <div class="em-detail-table-wrap">
        <table class="em-table">
          <thead>
            <tr>
              <th class="em-th em-th--cb">
                <input type="checkbox"
                  :checked="allCustomSelected"
                  :indeterminate.prop="someCustomSelected && !allCustomSelected"
                  @change="toggleCustomSelectAll" />
              </th>
              <th class="em-th">Name</th>
              <th class="em-th">Phone</th>
              <th class="em-th">SMS Status</th>
              <th class="em-th">Added</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading && !attendees.length">
              <tr v-for="n in 8" :key="`csk-${n}`" class="em-tr em-tr--sk">
                <td class="em-td em-td--cb"><div class="em-sk-bar em-sk-bar--sm" style="width:16px;height:16px;border-radius:3px"/></td>
                <td class="em-td"><div class="em-sk-name"><div class="em-sk-circle"/><div class="em-sk-bar em-sk-bar--lg"/></div></td>
                <td class="em-td"><div class="em-sk-bar"/></td>
                <td class="em-td"><div class="em-sk-bar em-sk-bar--sm"/></td>
                <td class="em-td"><div class="em-sk-bar"/></td>
              </tr>
            </template>
            <tr v-for="att in pagedDetailAttendees" :key="att.id"
              class="em-tr em-tr--cb" :class="{ 'em-tr--sel': isCustomSelected(att) }"
              @click="toggleCustomSelect(att)">
              <td class="em-td em-td--cb" @click.stop>
                <input type="checkbox" :checked="isCustomSelected(att)" @change="toggleCustomSelect(att)" />
              </td>
              <td class="em-td">
                <div class="em-name-cell">
                  <div class="em-avatar" :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }">
                    {{ initials(att.fullName) }}
                  </div>
                  <span class="em-name-text">{{ att.fullName }}</span>
                </div>
              </td>
              <td class="em-td em-td--muted">{{ att.phone || '—' }}</td>
              <td class="em-td">
                <span class="em-badge" :class="`em-badge--${getCustomStatus(att) ?? 'unsent'}`">
                  <svg v-if="['delivered','read'].includes(getCustomStatus(att))" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg v-else-if="getCustomStatus(att) === 'failed'" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {{ STATUS_LABELS[getCustomStatus(att)] ?? 'Unsent' }}
                </span>
              </td>
              <td class="em-td em-td--muted">{{ formatDate(att.createdAt) }}</td>
            </tr>
            <tr v-if="!loading && !customFilteredAttendees.length">
              <td colspan="5" class="em-td-empty">
                <div class="em-empty">
                  <p class="em-empty-title">No attendees match these filters</p>
                  <p class="em-empty-sub">Try changing the status or list filter.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Detail attendees paginator -->
      <div class="em-table-footer" :class="{ 'em-camp-footer--disabled': detailTotalPages === 1 }">
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

      <!-- Floating action bar -->
      <Transition name="em-slide-up">
        <div v-if="customSelectList.length" class="em-action-bar">
          <span class="em-action-count">{{ customSelectList.length }} selected</span>
          <button class="em-action-btn em-action-btn--sms" @click="openCustomSend">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Send SMS
          </button>
        </div>
      </Transition>

    </template>

    <!-- ══════════════════════════════════════════════
         SEND DRAWER (SMS + selected recipients only)
         ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="em-fade">
        <div v-if="sendDrawerOpen" class="em-overlay" @click.self="closeSendDrawer">
          <Transition name="em-slide-right">
            <div v-if="sendDrawerOpen" class="em-drawer">

              <div class="em-drawer-header">
                <div class="em-drawer-header-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B8924D"
                    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  <span class="em-drawer-title">Send SMS Campaign</span>
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
                <svg v-if="sendResult.ok" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <p class="em-result-title">{{ sendResult.ok ? 'Messages sent!' : 'Something went wrong' }}</p>
                  <p class="em-result-msg">{{ sendResult.message }}</p>
                </div>
                <button class="em-result-dismiss" @click="sendResult = null">Dismiss</button>
              </div>

              <div class="em-drawer-body">

                <!-- Campaign (locked) -->
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Campaign</p>
                  <div class="em-custom-camp-display">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {{ selectedCustomCamp?.name }}
                    <span class="em-custom-camp-type">{{ selectedCustomCamp?.type }}</span>
                  </div>
                </div>

                <!-- Channel (locked: SMS) -->
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Channel</p>
                  <div class="em-ch-sms-card">
                    <div class="em-ch-sms-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5856D6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div class="em-ch-sms-info">
                      <span class="em-ch-sms-name">SMS Channel</span>
                      <span class="em-ch-sms-note">Custom campaigns are SMS only</span>
                    </div>
                    <div class="em-ch-sms-badge">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Active
                    </div>
                  </div>
                </div>

                <!-- Recipients (locked: selected) -->
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">Recipients</p>
                  <div class="em-selected-recip-display">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span><strong>{{ customSelectList.length }}</strong> attendees selected</span>
                  </div>
                </div>

                <!-- Template -->
                <div class="em-drawer-section">
                  <p class="em-drawer-section-label">
                    Template
                    <span v-if="loadingTemplates" class="em-tpl-loading">
                      <svg class="em-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Loading…
                    </span>
                  </p>
                  <div v-if="!loadingTemplates && !templates.length" class="em-tpl-empty">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B5B5BB" stroke-width="1.8" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    No templates found for this campaign.
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
                    <svg class="em-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Sending…
                  </template>
                  <template v-else>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Send to {{ customSelectList.length }}
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db, auth } from '../../firebase'
import { collection, query, orderBy, getDocs, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore'

const props = defineProps({ event: Object, eventId: String })
const route  = useRoute()
const eventId = computed(() => props.eventId ?? route.params.eventId)

const SMS_URL = 'https://sendsmsaction-frbu33fema-uc.a.run.app'

const STATUS_LABELS = {
  unsent: 'Unsent', sent: 'Sent', delivered: 'Delivered',
  read: 'Read', failed: 'Failed', pending: 'Pending', undelivered: 'Undelivered',
}

const STATUS_OPTIONS = [
  { v: 'unsent',    l: 'Unsent'    },
  { v: 'sent',      l: 'Sent'      },
  { v: 'delivered', l: 'Delivered' },
  { v: 'failed',    l: 'Failed'    },
  { v: 'all',       l: 'All'       },
]

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
const customLabelId      = ref(null)
const customSelectList   = ref([])

async function loadCustomCampaigns() {
  if (!eventId.value) return
  loadingCustomCamps.value = true
  try {
    const snap = await getDocs(
      query(collection(db, 'events', eventId.value, 'campaigns'), orderBy('createdAt', 'desc'))
    )
    customCampaigns.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Failed to load campaigns', e)
  } finally {
    loadingCustomCamps.value = false
  }
}

function selectCustomCamp(camp) {
  selectedCustomCamp.value = camp
  customSelectList.value = []
  customStatus.value = 'unsent'
  customLabelId.value = null
}

// ── Campaign dialog ────────────────────────────────────────────────────────────
const campDialogOpen  = ref(false)
const editingCamp     = ref(null)
const campDialogName  = ref('')
const campDialogType  = ref('invitation')
const savingCamp      = ref(false)

function openCampDialog(camp) {
  editingCamp.value = camp ?? null
  campDialogName.value = camp?.name ?? ''
  campDialogType.value = camp?.type ?? 'invitation'
  campDialogOpen.value = true
}

async function saveCamp() {
  if (!campDialogName.value.trim()) return
  savingCamp.value = true
  try {
    if (editingCamp.value) {
      await setDoc(
        doc(db, 'events', eventId.value, 'campaigns', editingCamp.value.id),
        { name: campDialogName.value.trim(), updatedAt: new Date().toISOString() },
        { merge: true }
      )
      if (selectedCustomCamp.value?.id === editingCamp.value.id) {
        selectedCustomCamp.value = { ...selectedCustomCamp.value, name: campDialogName.value.trim() }
      }
    } else {
      await addDoc(collection(db, 'events', eventId.value, 'campaigns'), {
        name: campDialogName.value.trim(),
        type: campDialogType.value,
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
      selectedCustomCamp.value = null
      customSelectList.value = []
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
    const prefix = `sms_${campId}_`
    const match  = (att.messageIndexes ?? []).find(idx => idx.startsWith(prefix))
    const s      = match ? match.slice(match.lastIndexOf('_') + 1) : null
    if (status === 'all') return true
    if (status === 'unsent') return s === null || s === 'unsent'
    return s === status
  })
})

function getCustomStatus(att) {
  if (!selectedCustomCamp.value) return null
  const prefix = `sms_${selectedCustomCamp.value.id}_`
  const match  = (att.messageIndexes ?? []).find(idx => idx.startsWith(prefix))
  return match ? match.slice(match.lastIndexOf('_') + 1) : null
}

const customStatusCounts = computed(() => {
  if (!selectedCustomCamp.value) return { all: 0, unsent: 0, sent: 0, delivered: 0, failed: 0 }
  const campId   = selectedCustomCamp.value.id
  const cardType = selectedCustomCamp.value.type
  const labelId  = customLabelId.value
  const prefix   = `sms_${campId}_`
  const base = attendees.value.filter(att => {
    if (!att.cards || att.cards[cardType] == null) return false
    if (labelId && !(att.labelIds ?? []).includes(labelId)) return false
    return true
  })
  const counts = { all: base.length, unsent: 0, sent: 0, delivered: 0, failed: 0 }
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

// ── Selection ──────────────────────────────────────────────────────────────────
const allCustomSelected  = computed(() => customFilteredAttendees.value.length > 0 && customSelectList.value.length === customFilteredAttendees.value.length)
const someCustomSelected = computed(() => customSelectList.value.length > 0 && customSelectList.value.length < customFilteredAttendees.value.length)

function isCustomSelected(att)  { return customSelectList.value.some(a => a.id === att.id) }
function toggleCustomSelect(att) {
  const i = customSelectList.value.findIndex(a => a.id === att.id)
  if (i === -1) customSelectList.value.push(att)
  else customSelectList.value.splice(i, 1)
}
function toggleCustomSelectAll() {
  if (allCustomSelected.value) customSelectList.value = []
  else customSelectList.value = [...customFilteredAttendees.value]
}
watch([customStatus, customLabelId], () => { customSelectList.value = [] })

// ── Send drawer ────────────────────────────────────────────────────────────────
const sendDrawerOpen   = ref(false)
const sendCampaign     = ref(null)
const templates        = ref([])
const selectedTemplate = ref(null)
const loadingTemplates = ref(false)
const sending          = ref(false)
const sendResult       = ref(null)

const canSend = computed(() => selectedTemplate.value && customSelectList.value.length > 0 && !sending.value)

function openCustomSend() {
  sendCampaign.value = selectedCustomCamp.value.id
  sendResult.value   = null
  sendDrawerOpen.value = true
  loadSendTemplates()
}

function closeSendDrawer() {
  sendDrawerOpen.value = false
  if (sendResult.value?.ok) customSelectList.value = []
}

async function loadSendTemplates() {
  if (!eventId.value) return
  loadingTemplates.value = true
  templates.value = []
  selectedTemplate.value = null
  try {
    const snap = await getDocs(collection(db, 'events', eventId.value, 'messageTemplates'))
    templates.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
    const body = {
      content: selectedTemplate.value.content,
      type: sendCampaign.value,
      eventId: eventId.value,
      attendeesIds: customSelectList.value.map(a => a.id),
      kardType,
    }
    const res  = await fetch(SMS_URL, { method: 'POST', headers: { Authorization: `Bearer ${user.uid}` }, body: JSON.stringify(body) })
    const data = await res.json()
    sendResult.value = { ok: data.status === true, message: data.message ?? (data.status ? 'Done.' : 'Request failed.') }
    if (data.status) {
      await load()
      customSelectList.value = []
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
  display: flex; flex-direction: column;
  gap: 16px;
  padding: 20px 24px 24px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
}

/* ── Campaign list toolbar ── */
.em-custom-toolbar {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 0 0 12px; border-bottom: 1px solid #1e2d44;
}
.em-custom-title { font-size: 20px; font-weight: 800; color: #e2e8f0; margin: 0 0 2px; letter-spacing: -0.3px; }
.em-custom-sub   { font-size: 13px; color: #8892a4; margin: 0; }
.em-custom-body  { display: flex; flex-direction: column; }
.em-custom-scroll { overflow-x: auto; }
.em-custom-loading { display: flex; align-items: center; gap: 10px; color: #8892a4; font-size: 14px; padding: 40px 0; justify-content: center; }
.em-custom-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; text-align: center; }
.em-camp-table-wrap { display: flex; flex-direction: column; background: #111827; border: 1px solid #1e2d44; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.em-camp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.em-camp-table th { padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #8892a4; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; position: sticky; top: 0; z-index: 1; background: #111827; border-bottom: 1px solid #1e2d44; user-select: none; }
.em-camp-row { cursor: pointer; border-bottom: 1px solid #1a2a3e; transition: background 120ms; }
.em-camp-row:last-child { border-bottom: none; }
.em-camp-row:hover { background: rgba(255,255,255,0.03); }
.em-ct-name { padding: 11px 16px; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; }
.em-ct-type { padding: 11px 16px; white-space: nowrap; }
.em-ct-type-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; background: rgba(255,255,255,0.06); font-size: 11px; font-weight: 600; color: #8892a4; text-transform: capitalize; }
.em-ct-date { padding: 11px 16px; color: #8892a4; white-space: nowrap; font-size: 12px; }
.em-ct-actions { padding: 11px 16px; display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
.em-camp-footer--disabled { opacity: 0.38; pointer-events: none; }
.em-camp-item-btn {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid #1e2d44;
  background: rgba(255,255,255,0.04); color: #8892a4; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 130ms;
}
.em-camp-item-btn:hover { background: #1a2236; color: #e2e8f0; border-color: #2a3a52; }
.em-camp-item-btn--del:hover { background: rgba(255,69,58,0.08); color: #fc8181; border-color: rgba(255,69,58,0.25); }

/* ── Send button ── */
.em-send-btn {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  height: 34px; padding: 0 16px; border-radius: 8px;
  background: linear-gradient(180deg, #2e3a58 0%, #1e2d46 100%); color: #e2e8f0; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 130ms;
}
.em-send-btn:hover { opacity: 0.85; }

/* ── Campaign detail ── */
.em-detail-top {
  flex-shrink: 0; display: flex; align-items: center; gap: 12px;
  padding: 0 0 14px; border-bottom: 1px solid #1e2d44;
}
.em-detail-back {
  display: flex; align-items: center; gap: 5px; background: none; border: none;
  font-size: 13px; color: #8892a4; cursor: pointer; transition: color 130ms; flex-shrink: 0;
}
.em-detail-back:hover { color: #C9A84C; }
.em-detail-title { flex: 1; font-size: 18px; font-weight: 700; color: #e2e8f0; margin: 0; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.em-detail-type  { font-size: 11px; font-weight: 600; color: #8892a4; background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 20px; white-space: nowrap; text-transform: capitalize; flex-shrink: 0; }
.em-detail-filters {
  flex-shrink: 0; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  padding: 12px 16px; background: #0f1729; border: 1px solid #1e2d44; border-radius: 10px;
}
.em-filter-group { display: flex; align-items: center; gap: 8px; }
.em-filter-lbl   { font-size: 10px; font-weight: 700; color: #8892a4; text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
.em-filter-pills { display: flex; gap: 4px; flex-wrap: wrap; }
.em-filter-pill  { height: 28px; padding: 0 12px; border-radius: 20px; border: 1px solid transparent; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 130ms; font-family: inherit; }
.em-filter-pill:hover { filter: brightness(1.15); }
.em-filter-pill--all       { background: rgba(255,255,255,0.06); color: #8892a4; border-color: #2a3a52; }
.em-filter-pill--unsent    { background: rgba(255,255,255,0.06); color: #8892a4; border-color: #2a3a52; }
.em-filter-pill--sent      { background: rgba(255,159,10,0.10); color: #f59e0b; border-color: rgba(255,159,10,0.2); }
.em-filter-pill--delivered { background: rgba(52,211,153,0.10); color: #34d399; border-color: rgba(52,211,153,0.2); }
.em-filter-pill--failed    { background: rgba(255,69,58,0.10);  color: #fc8181; border-color: rgba(255,69,58,0.2); }
.em-filter-pill--all.em-filter-pill--on       { background: rgba(226,232,240,0.15); color: #e2e8f0; border-color: rgba(226,232,240,0.2); }
.em-filter-pill--unsent.em-filter-pill--on    { background: #4f617a; color: #e2e8f0; border-color: #4f617a; }
.em-filter-pill--sent.em-filter-pill--on      { background: #B36800; color: #fff; border-color: #B36800; }
.em-filter-pill--delivered.em-filter-pill--on { background: #1D7A38; color: #fff; border-color: #1D7A38; }
.em-filter-pill--failed.em-filter-pill--on    { background: #C41E1E; color: #fff; border-color: #C41E1E; }
.em-fp-n { font-size: 13px; font-weight: 800; line-height: 1; }
.em-filter-select { height: 28px; padding: 0 8px; border: 1px solid #2a3a52; border-radius: 7px; background: #0f1729; font-size: 12px; color: #e2e8f0; outline: none; cursor: pointer; color-scheme: dark; }
.em-filter-select:focus { border-color: #C9A84C; }
.em-detail-count { margin-left: auto; font-size: 12px; color: #8892a4; white-space: nowrap; }
.em-detail-table-wrap { overflow-x: auto; background: #111827; border: 1px solid #1e2d44; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }

/* ── Table ── */
.em-table { width: 100%; border-collapse: collapse; }
.em-th {
  padding: 11px 16px; font-size: 11px; font-weight: 700; color: #8892a4;
  text-align: left; background: #111827; border-bottom: 1px solid #1e2d44;
  white-space: nowrap; position: sticky; top: 0; z-index: 1; text-transform: uppercase; letter-spacing: 0.5px; user-select: none;
}
.em-th--cb { width: 40px; padding: 11px 8px 11px 16px; }
.em-tr     { transition: background 120ms; border-bottom: 1px solid #1a2a3e; }
.em-tr:last-child { border-bottom: none; }
.em-tr:hover { background: rgba(255,255,255,0.03); }
.em-tr--sk { pointer-events: none; }
.em-tr--cb { cursor: pointer; }
.em-tr--sel { background: rgba(201,168,76,0.06) !important; }
.em-td     { padding: 11px 16px; font-size: 13px; color: #e2e8f0; vertical-align: middle; }
.em-td--muted { color: #8892a4; font-size: 12px; }
.em-td--cb  { padding: 11px 8px 11px 16px; width: 40px; }
.em-td-empty { padding: 0; border: none; }
.em-name-cell { display: flex; align-items: center; gap: 9px; }
.em-avatar    { width: 32px; height: 32px; border-radius: 8px; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.em-name-text { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
.em-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.em-badge--null, .em-badge--undefined { background: transparent; color: #4f617a; }
.em-badge--unsent      { background: rgba(255,255,255,0.06); color: #8892a4; }
.em-badge--sent        { background: rgba(255,159,10,0.12); color: #f59e0b; }
.em-badge--delivered   { background: rgba(52,211,153,0.12); color: #34d399; }
.em-badge--read        { background: rgba(99,179,237,0.12); color: #63b3ed; }
.em-badge--failed      { background: rgba(255,69,58,0.12);  color: #fc8181; }
.em-badge--pending     { background: rgba(255,204,0,0.12);  color: #fbbf24; }
.em-badge--undelivered { background: rgba(255,69,58,0.08);  color: #fc8181; }
.em-sk-name   { display: flex; align-items: center; gap: 9px; }
.em-sk-circle { width: 32px; height: 32px; border-radius: 8px; background: #1e2d44; flex-shrink: 0; animation: em-pulse 1.4s ease-in-out infinite; }
.em-sk-bar    { height: 12px; border-radius: 6px; background: #1e2d44; width: 90px; animation: em-pulse 1.4s ease-in-out infinite; }
.em-sk-bar--lg{ width: 130px; }
.em-sk-bar--sm{ width: 60px; }
@keyframes em-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.em-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; text-align: center; }
.em-empty-icon  { margin-bottom: 16px; }
.em-empty-title { font-size: 16px; font-weight: 700; color: #e2e8f0; margin: 0 0 6px; }
.em-empty-sub   { font-size: 14px; color: #8892a4; margin: 0 0 16px; max-width: 300px; }
.em-empty-cta   { height: 34px; padding: 0 16px; border-radius: 8px; border: 1px solid #1e2d44; background: #111827; font-size: 14px; font-weight: 500; color: #e2e8f0; cursor: pointer; transition: background 130ms; }
.em-empty-cta:hover { background: #1a2236; }
.em-empty-cta--primary { background: linear-gradient(180deg, #2e3a58 0%, #1e2d46 100%); color: #e2e8f0; border-color: transparent; }
.em-empty-cta--primary:hover { opacity: 0.85; }

/* ── Pagination ── */
.em-table-footer { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: #111827; border-top: 1px solid #1e2d44; }
.em-range-lbl   { font-size: 13px; color: #8892a4; }
.em-paginator   { display: flex; align-items: center; gap: 4px; }
.em-paginator--disabled { opacity: 0.38; pointer-events: none; }
.em-page-btn    { min-width: 32px; height: 32px; padding: 0 8px; border-radius: 8px; border: 1px solid #1e2d44; background: #111827; font-size: 13px; font-weight: 500; color: #8892a4; cursor: pointer; transition: all 130ms; display: flex; align-items: center; justify-content: center; }
.em-page-btn:hover:not(:disabled) { background: #1a2236; }
.em-page-btn:disabled { opacity: 0.4; cursor: default; }
.em-page-btn--active { background: rgba(226,232,240,0.12); border-color: rgba(226,232,240,0.18); color: #e2e8f0; }
.em-page-btn--nav    { color: #8892a4; }
.em-page-ellipsis   { font-size: 13px; color: #4f617a; padding: 0 4px; }

/* ── Floating action bar ── */
.em-action-bar {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; background: #1a2236; border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5); white-space: nowrap;
  border: 1px solid #2a3a52; z-index: 200;
}
.em-action-count { font-size: 13px; font-weight: 600; color: #c8d4e0; }
.em-action-btn {
  display: flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 16px; border-radius: 8px; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 130ms;
}
.em-action-btn:hover { opacity: 0.88; }
.em-action-btn--sms { background: linear-gradient(180deg, #2e3a58 0%, #1e2d46 100%); color: #e2e8f0; }
.em-action-btn--sms:hover { opacity: 1; background: rgba(201,168,76,0.2); }

/* ── Send Drawer ── */
.em-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000; display: flex; align-items: stretch; justify-content: flex-end; }
.em-overlay--center { align-items: center; justify-content: center; }
.em-drawer  { width: 400px; max-width: 95vw; height: 100%; background: #111827; display: flex; flex-direction: column; box-shadow: -8px 0 32px rgba(0,0,0,0.45); }
.em-drawer-header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #1e2d44; }
.em-drawer-header-left { display: flex; align-items: center; gap: 8px; }
.em-drawer-title { font-size: 16px; font-weight: 700; color: #e2e8f0; }
.em-drawer-close { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.06); border: none; cursor: pointer; color: #8892a4; display: flex; align-items: center; justify-content: center; transition: background 130ms; }
.em-drawer-close:hover { background: rgba(255,255,255,0.10); }
.em-send-result { flex-shrink: 0; display: flex; align-items: flex-start; gap: 10px; padding: 12px 20px; font-size: 13px; }
.em-send-result--ok  { background: rgba(52,211,153,0.08); color: #34d399; border-bottom: 1px solid rgba(52,211,153,0.2); }
.em-send-result--err { background: rgba(255,69,58,0.08);  color: #fc8181; border-bottom: 1px solid rgba(255,69,58,0.2); }
.em-result-title { font-weight: 700; margin: 0 0 2px; }
.em-result-msg   { margin: 0; opacity: 0.8; }
.em-result-dismiss { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 12px; opacity: 0.7; color: inherit; flex-shrink: 0; }
.em-result-dismiss:hover { opacity: 1; }
.em-drawer-body  { flex: 1; overflow-y: auto; padding: 0 20px 20px; }
.em-drawer-section { padding: 18px 0; border-bottom: 1px solid #1e2d44; }
.em-drawer-section:last-child { border-bottom: none; }
.em-drawer-section-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #8892a4; text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 12px; }
.em-custom-camp-display { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(201,168,76,0.3); background: rgba(201,168,76,0.06); font-size: 14px; font-weight: 600; color: #e2e8f0; }
.em-custom-camp-type { margin-left: auto; font-size: 11px; font-weight: 500; color: #8892a4; text-transform: capitalize; }
.em-ch-sms-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(88,86,214,0.3); background: rgba(88,86,214,0.1); }
.em-ch-sms-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(88,86,214,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.em-ch-sms-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.em-ch-sms-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
.em-ch-sms-note { font-size: 11px; color: #8892a4; }
.em-ch-sms-badge { display: flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 20px; background: #5856D6; color: #fff; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.em-selected-recip-display { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(201,168,76,0.3); background: rgba(201,168,76,0.06); font-size: 14px; color: #e2e8f0; }
.em-tpl-loading { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #C9A84C; font-weight: 500; text-transform: none; letter-spacing: 0; }
.em-tpl-empty   { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #8892a4; padding: 12px; border: 0.8px dashed #2a3a52; border-radius: 10px; }
.em-tpl-list    { display: flex; flex-direction: column; gap: 8px; }
.em-tpl-item    { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-radius: 10px; border: 1px solid #1e2d44; background: #0f1729; cursor: pointer; transition: all 130ms; }
.em-tpl-item:hover { border-color: #C9A84C; }
.em-tpl-item--active { border-color: rgba(226,232,240,0.2); background: rgba(226,232,240,0.06); }
.em-tpl-radio   { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #C9A84C; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; }
.em-tpl-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: #C9A84C; }
.em-tpl-body    { flex: 1; min-width: 0; }
.em-tpl-content { font-size: 13px; color: #e2e8f0; margin: 0 0 4px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.em-tpl-meta    { font-size: 11px; color: #4f617a; margin: 0; }
.em-drawer-footer { flex-shrink: 0; display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid #1e2d44; background: #111827; }
.em-drawer-cancel { flex: 1; height: 40px; border-radius: 10px; border: 1px solid #1e2d44; background: rgba(255,255,255,0.05); font-size: 14px; font-weight: 500; color: #8892a4; cursor: pointer; transition: background 130ms; }
.em-drawer-cancel:hover { background: rgba(255,255,255,0.09); }
.em-drawer-send { flex: 2; height: 40px; border-radius: 10px; background: linear-gradient(180deg, #2e3a58 0%, #1e2d46 100%); color: #e2e8f0; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: opacity 130ms; }
.em-drawer-send:hover:not(:disabled) { opacity: 0.85; }
.em-drawer-send:disabled { opacity: 0.45; cursor: default; }

/* ── Campaign dialog ── */
.em-dialog { width: 400px; max-width: 95vw; background: #111827; border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.5); border: 1px solid #1e2d44; overflow: hidden; }
.em-dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #1e2d44; }
.em-dialog-title  { font-size: 16px; font-weight: 700; color: #e2e8f0; margin: 0; }
.em-dialog-body   { padding: 20px; }
.em-dialog-lbl    { display: block; font-size: 11px; font-weight: 700; color: #8892a4; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
.em-dialog-input  { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #2a3a52; border-radius: 10px; font-size: 14px; color: #e2e8f0; background: #0f1729; outline: none; box-sizing: border-box; transition: border-color 130ms; }
.em-dialog-input:focus { border-color: #C9A84C; }
.em-dialog-type-row { display: flex; gap: 8px; }
.em-dialog-type-btn { flex: 1; height: 36px; border-radius: 9px; border: 1px solid #1e2d44; background: #0f1729; font-size: 13px; font-weight: 500; color: #8892a4; cursor: pointer; transition: all 130ms; }
.em-dialog-type-btn:hover { border-color: #C9A84C; color: #e2e8f0; }
.em-dialog-type-btn--on { border-color: #C9A84C; background: rgba(201,168,76,0.06); color: #C9A84C; font-weight: 600; }
.em-dialog-footer { display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid #1e2d44; }

/* ── Animations ── */
.em-spin { animation: em-rotate 0.8s linear infinite; }
@keyframes em-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.em-fade-enter-active, .em-fade-leave-active { transition: opacity 180ms; }
.em-fade-enter-from,  .em-fade-leave-to     { opacity: 0; }
.em-slide-right-enter-active, .em-slide-right-leave-active { transition: transform 220ms cubic-bezier(0.4,0,0.2,1); }
.em-slide-right-enter-from,  .em-slide-right-leave-to     { transform: translateX(100%); }
.em-slide-up-enter-active, .em-slide-up-leave-active { transition: transform 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms; }
.em-slide-up-enter-from,  .em-slide-up-leave-to     { transform: translateX(-50%) translateY(80px); opacity: 0; }
</style>
