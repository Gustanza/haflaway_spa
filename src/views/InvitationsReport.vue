<template>
  <div class="ir-page">
    <!-- Loading -->
    <div v-if="!eventLoaded" class="ir-state">
      <div class="ir-spinner" />
    </div>

    <!-- Invalid link -->
    <div v-else-if="!tokenValid" class="ir-state">
      <div class="ir-state-card">
        <div class="ir-state-icon ir-state-icon--bad">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h1>Kiungo hiki si sahihi</h1>
        <p>Tafadhali hakiki kiungo ulichotumiwa, au omba kipya.</p>
      </div>
    </div>

    <!-- Report -->
    <div v-else class="ir-body">
      <header class="ir-header">
        <div class="ir-brand">Haflaway</div>
        <h1>{{ TAB_TITLES[activeTab] }}</h1>
        <p v-if="event?.title" class="ir-event-title">{{ event.title }}</p>
      </header>

      <div class="ir-tabs" role="tablist">
        <button class="ir-tab" :class="{ 'ir-tab--active': activeTab === 'undelivered' }" @click="activeTab = 'undelivered'">
          Hawajapokea
          <span class="ir-tab-count">{{ reportList.length }}</span>
        </button>
        <button class="ir-tab" :class="{ 'ir-tab--active': activeTab === 'delivered' }" @click="activeTab = 'delivered'">
          Wamepokea
          <span class="ir-tab-count">{{ deliveredList.length }}</span>
        </button>
        <button class="ir-tab" :class="{ 'ir-tab--active': activeTab === 'rsvp' }" @click="activeTab = 'rsvp'">
          Majibu (RSVP)
          <span class="ir-tab-count">{{ attendees.length }}</span>
        </button>
      </div>

      <!-- ── Tab: Not delivered ── -->
      <template v-if="activeTab === 'undelivered'">
        <div v-if="notDeliveredAll.length" class="ir-stats">
          <div class="ir-meter" role="img" :aria-label="`Asilimia ${resolvedPct} zimetatuliwa — ${resolvedList.length} kati ya ${notDeliveredAll.length}`">
            <svg width="88" height="88" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ir-ok-bg)" stroke-width="10" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ir-ok-fg)" stroke-width="10"
                stroke-linecap="round" transform="rotate(-90 50 50)"
                :stroke-dasharray="METER_CIRC" :stroke-dashoffset="METER_CIRC * (1 - resolvedPct / 100)" />
            </svg>
            <div class="ir-meter-center">
              <span class="ir-meter-pct">{{ resolvedPct }}%</span>
              <span class="ir-meter-lbl">zimetatuliwa</span>
            </div>
          </div>
          <div class="ir-stat-sep" />
          <div class="ir-stat ir-stat--bad">
            <span class="ir-stat-val">{{ reportList.length }}</span>
            <span class="ir-stat-lbl">Wanahitaji kurekebishwa</span>
          </div>
          <div class="ir-stat-sep" />
          <div class="ir-stat ir-stat--ok">
            <span class="ir-stat-val">{{ resolvedList.length }}</span>
            <span class="ir-stat-lbl">Zimetatuliwa</span>
          </div>
        </div>

        <div class="ir-divider" />
        <p class="ir-explainer">
          Rekebisha nambari isiyo sahihi, pakua kadi ili uitume mwenyewe, au uweke alama ya
          <strong>imetatuliwa</strong> kama hakuna cha kufanya tena.
        </p>

        <div v-if="!notDeliveredAll.length" class="ir-empty">
          <div class="ir-state-icon ir-state-icon--ok">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2>Mialiko yote imefika</h2>
          <p>Hakuna kitu cha kurekebisha kwa sasa.</p>
        </div>

        <template v-else>
          <div v-if="!reportList.length" class="ir-empty">
            <div class="ir-state-icon ir-state-icon--ok">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2>Kila kitu kimeshughulikiwa</h2>
            <p>Kila tatizo limerekebishwa au limewekwa alama ya kutatuliwa.</p>
          </div>

          <template v-else>
            <div class="ir-search-wrap">
              <svg class="ir-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="searchQ" class="ir-search-input" type="text" placeholder="Tafuta kwa jina au nambari ya simu…" />
              <button v-if="searchQ" class="ir-search-clear" title="Futa utafutaji" @click="searchQ = ''">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div v-if="!visibleList.length" class="ir-empty ir-empty--search">
              <p>Hakuna mgeni anayelingana na "{{ searchQ }}".</p>
              <button class="ir-card-btn ir-card-btn--ghost" @click="searchQ = ''">Futa utafutaji</button>
            </div>

            <div v-else class="ir-list">
              <div v-for="(att, idx) in visibleList" :key="att.id" class="ir-card" :style="{ '--i': idx }">
                <div class="ir-card-top">
                  <div class="ir-card-who">
                    <div class="ir-avatar" :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }">
                      {{ initials(att.fullName) }}
                    </div>
                    <div class="ir-card-name">{{ att.fullName }}</div>
                  </div>
                  <div class="ir-card-badges">
                    <span class="ir-badge" :class="`ir-badge--${statusFor(att, 'whatsapp') || 'unsent'}`">
                      <svg class="ir-badge-icon" width="10" height="10" viewBox="0 0 448 512" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                      {{ STATUS_LABELS[statusFor(att, 'whatsapp')] || 'Haijatumwa' }}
                    </span>
                    <span class="ir-badge" :class="`ir-badge--${statusFor(att, 'sms') || 'unsent'}`">
                      <svg class="ir-badge-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {{ STATUS_LABELS[statusFor(att, 'sms')] || 'Haijatumwa' }}
                    </span>
                  </div>
                </div>

                <div class="ir-card-body">
                  <div class="ir-tile ir-tile--phone">
                    <label class="ir-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      Nambari ya simu
                    </label>
                    <VueTelInput
                      v-model="phoneDrafts[att.id]"
                      :preferred-countries="['TZ', 'KE', 'UG', 'RW', 'ET', 'ZM', 'MW', 'MZ']"
                      default-country="TZ"
                      mode="international"
                      :input-options="{ placeholder: '7XX XXX XXX' }"
                      :dropdown-options="{ showDialCodeInSelection: true, showFlags: true, showSearchBox: true }"
                      @validate="obj => onValidate(att.id, obj)"
                    />
                    <div class="ir-phone-acts">
                      <button class="ir-save-btn" :disabled="!canSave(att) || saving[att.id]" @click="savePhone(att)">
                        {{ saving[att.id] ? 'Inahifadhi…' : 'Hifadhi nambari' }}
                      </button>
                      <span v-if="justSaved[att.id]" class="ir-saved-mark">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Imehifadhiwa — tutawajulisha timu
                      </span>
                    </div>
                  </div>

                  <div v-if="cardUrl(att)" class="ir-tile ir-tile--card">
                    <label class="ir-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      Kadi ya mwaliko
                    </label>
                    <div class="ir-card-row">
                      <button class="ir-card-thumb-btn" title="Gusa kuona kadi" @click="lightboxUrl = cardUrl(att)">
                        <img :src="cardUrl(att)" class="ir-card-thumb" alt="Kadi ya mwaliko" />
                        <span class="ir-card-thumb-zoom">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                        </span>
                      </button>
                      <div class="ir-card-acts">
                        <a :href="cardUrl(att)" target="_blank" rel="noopener" class="ir-card-btn">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Pakua
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="ir-resolve-row">
                  <svg class="ir-resolve-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                  <p class="ir-resolve-text">Je, nambari hii ni sahihi na tayari umetuma kadi mwenyewe kwa njia nyingine?</p>
                  <button class="ir-resolve-btn" :disabled="resolving[att.id]" @click="markResolved(att)">
                    {{ resolving[att.id] ? 'Inaweka…' : 'Weka imetatuliwa' }}
                  </button>
                </div>
              </div>
            </div>
          </template>

          <div v-if="resolvedList.length" class="ir-resolved-section">
            <button class="ir-resolved-toggle" @click="resolvedExpanded = !resolvedExpanded">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Zimetatuliwa {{ resolvedList.length }}
              <svg class="ir-resolved-chev" :class="{ 'ir-resolved-chev--open': resolvedExpanded }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div v-if="resolvedExpanded" class="ir-resolved-list">
              <div v-for="att in resolvedList" :key="att.id" class="ir-resolved-row">
                <span class="ir-resolved-name">{{ att.fullName }}</span>
                <span class="ir-resolved-phone">{{ att.phone || '—' }}</span>
                <button class="ir-resolved-undo" @click="undoResolved(att)">Tendua</button>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- ── Tab: Delivered ── -->
      <template v-else-if="activeTab === 'delivered'">
        <div v-if="invitationAttendees.length" class="ir-stats">
          <div class="ir-stat ir-stat--ok">
            <span class="ir-stat-val">{{ deliveredList.length }}</span>
            <span class="ir-stat-lbl">Wamepokea</span>
          </div>
          <div class="ir-stat-sep" />
          <div class="ir-stat ir-stat--bad">
            <span class="ir-stat-val">{{ notDeliveredAll.length }}</span>
            <span class="ir-stat-lbl">Hawajapokea</span>
          </div>
        </div>
        <div class="ir-divider" />
        <p class="ir-explainer">
          Hawa ni wageni ambao mwaliko wao umefika au umesomwa kupitia WhatsApp au SMS.
        </p>

        <div v-if="!deliveredList.length" class="ir-empty">
          <div class="ir-state-icon ir-state-icon--ok">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2>Hakuna bado</h2>
          <p>Hakuna mgeni aliyepokea mwaliko wake bado.</p>
        </div>

        <template v-else>
          <div class="ir-search-wrap">
            <svg class="ir-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQ" class="ir-search-input" type="text" placeholder="Tafuta kwa jina au nambari ya simu…" />
            <button v-if="searchQ" class="ir-search-clear" title="Futa utafutaji" @click="searchQ = ''">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div v-if="!visibleDeliveredList.length" class="ir-empty ir-empty--search">
            <p>Hakuna mgeni anayelingana na "{{ searchQ }}".</p>
            <button class="ir-card-btn ir-card-btn--ghost" @click="searchQ = ''">Futa utafutaji</button>
          </div>

          <div v-else class="ir-list">
            <div v-for="(att, idx) in visibleDeliveredList" :key="att.id" class="ir-card" :style="{ '--i': idx }">
              <div class="ir-card-top">
                <div class="ir-card-who">
                  <div class="ir-avatar" :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }">
                    {{ initials(att.fullName) }}
                  </div>
                  <div>
                    <div class="ir-card-name">{{ att.fullName }}</div>
                    <div v-if="att.phone" class="ir-card-phone">{{ att.phone }}</div>
                  </div>
                </div>
                <div class="ir-card-badges">
                  <span class="ir-badge" :class="`ir-badge--${statusFor(att, 'whatsapp') || 'unsent'}`">
                    <svg class="ir-badge-icon" width="10" height="10" viewBox="0 0 448 512" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                    {{ STATUS_LABELS[statusFor(att, 'whatsapp')] || 'Haijatumwa' }}
                  </span>
                  <span class="ir-badge" :class="`ir-badge--${statusFor(att, 'sms') || 'unsent'}`">
                    <svg class="ir-badge-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {{ STATUS_LABELS[statusFor(att, 'sms')] || 'Haijatumwa' }}
                  </span>
                </div>
              </div>

              <div v-if="cardUrl(att)" class="ir-card-body">
                <div class="ir-tile ir-tile--card">
                  <label class="ir-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    Kadi ya mwaliko
                  </label>
                  <div class="ir-card-row">
                    <button class="ir-card-thumb-btn" title="Gusa kuona kadi" @click="lightboxUrl = cardUrl(att)">
                      <img :src="cardUrl(att)" class="ir-card-thumb" alt="Kadi ya mwaliko" />
                      <span class="ir-card-thumb-zoom">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                      </span>
                    </button>
                    <div class="ir-card-acts">
                      <a :href="cardUrl(att)" target="_blank" rel="noopener" class="ir-card-btn">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Pakua
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- ── Tab: RSVP ── -->
      <template v-else>
        <div class="ir-stats">
          <div class="ir-stat ir-stat--ok">
            <span class="ir-stat-val">{{ rsvpCounts.confirmed }}</span>
            <span class="ir-stat-lbl">Wamethibitisha</span>
          </div>
          <div class="ir-stat-sep" />
          <div class="ir-stat ir-stat--bad">
            <span class="ir-stat-val">{{ rsvpCounts.declined }}</span>
            <span class="ir-stat-lbl">Wamekataa</span>
          </div>
          <div class="ir-stat-sep" />
          <div class="ir-stat">
            <span class="ir-stat-val">{{ rsvpCounts.pending }}</span>
            <span class="ir-stat-lbl">Wanasubiri</span>
          </div>
        </div>
        <div class="ir-divider" />

        <div class="ir-chips">
          <button class="ir-chip" :class="{ 'ir-chip--active': rsvpFilter === 'all' }" @click="rsvpFilter = 'all'">
            Wote <span class="ir-chip-count">{{ rsvpCounts.all }}</span>
          </button>
          <button class="ir-chip ir-chip--ok" :class="{ 'ir-chip--active': rsvpFilter === 'confirmed' }" @click="rsvpFilter = 'confirmed'">
            Wamethibitisha <span class="ir-chip-count">{{ rsvpCounts.confirmed }}</span>
          </button>
          <button class="ir-chip ir-chip--bad" :class="{ 'ir-chip--active': rsvpFilter === 'declined' }" @click="rsvpFilter = 'declined'">
            Wamekataa <span class="ir-chip-count">{{ rsvpCounts.declined }}</span>
          </button>
          <button class="ir-chip ir-chip--warn" :class="{ 'ir-chip--active': rsvpFilter === 'pending' }" @click="rsvpFilter = 'pending'">
            Wanasubiri <span class="ir-chip-count">{{ rsvpCounts.pending }}</span>
          </button>
        </div>

        <div v-if="!attendees.length" class="ir-empty">
          <h2>Hakuna wageni bado</h2>
        </div>
        <template v-else>
          <div class="ir-search-wrap">
            <svg class="ir-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQ" class="ir-search-input" type="text" placeholder="Tafuta kwa jina au nambari ya simu…" />
            <button v-if="searchQ" class="ir-search-clear" title="Futa utafutaji" @click="searchQ = ''">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div v-if="!visibleRsvpList.length" class="ir-empty ir-empty--search">
            <p>Hakuna mgeni anayelingana na vigezo hivi.</p>
            <button class="ir-card-btn ir-card-btn--ghost" @click="searchQ = ''; rsvpFilter = 'all'">Futa vichujio</button>
          </div>

          <div v-else class="ir-list">
            <div v-for="(att, idx) in visibleRsvpList" :key="att.id" class="ir-card ir-card--compact" :style="{ '--i': idx }">
              <div class="ir-card-top ir-card-top--flush">
                <div class="ir-card-who">
                  <div class="ir-avatar" :style="{ background: avatarBg(att.fullName), color: avatarFg(att.fullName) }">
                    {{ initials(att.fullName) }}
                  </div>
                  <div>
                    <div class="ir-card-name">{{ att.fullName }}</div>
                    <div v-if="att.phone" class="ir-card-phone">{{ att.phone }}</div>
                  </div>
                </div>
                <span class="ir-rsvp-badge" :class="`ir-rsvp-badge--${rsvpStatusOf(att)}`">
                  {{ RSVP_LABELS[rsvpStatusOf(att)] }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <!-- Card preview lightbox -->
    <div v-if="lightboxUrl" class="ir-lightbox" @click.self="lightboxUrl = null">
      <button class="ir-lightbox-close" title="Funga" @click="lightboxUrl = null">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <img :src="lightboxUrl" class="ir-lightbox-img" alt="Kadi ya mwaliko" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { doc, collection, onSnapshot, updateDoc, setDoc } from 'firebase/firestore'
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'

const route = useRoute()
const eventId = computed(() => route.params.eventId)
const token = computed(() => route.params.token)

const STATUS_LABELS = { unsent: 'Haijatumwa', sent: 'Imetumwa', delivered: 'Imefika', read: 'Imesomwa', failed: 'Imeshindwa', pending: 'Inasubiri', undelivered: 'Haijafika', submitted: 'Imetumwa' }
const RSVP_LABELS = { confirmed: 'Amethibitisha', declined: 'Amekataa', pending: 'Anasubiri' }
const TAB_TITLES = {
  undelivered: 'Wageni ambao hawajapokea mwaliko wao',
  delivered: 'Wageni ambao wamepokea mwaliko wao',
  rsvp: 'Majibu ya Mialiko (RSVP)',
}

const activeTab = ref('undelivered') // 'undelivered' | 'delivered' | 'rsvp'
watch(activeTab, () => { searchQ.value = '' })

// Only the main Invitation campaign counts toward "not delivered" here.
const CAMPAIGN_ID = 'haflaway-invitation-campaign'
const WA_NOT_DELIVERED = new Set(['undelivered', 'sent', 'unsent'])
const SMS_NOT_DELIVERED = new Set(['sent', 'submitted', 'failed', 'unsent'])

const eventLoaded = ref(false)
const event = ref(null)
const attendees = ref([])

const tokenValid = computed(() => !!event.value?.invitationsReportToken && event.value.invitationsReportToken === token.value)

let unsubEvent = null
let unsubAttendees = null

let prevHtmlLang = null

onMounted(() => {
  unsubEvent = onSnapshot(doc(db, 'events', eventId.value), snap => {
    eventLoaded.value = true
    event.value = snap.exists() ? { id: snap.id, ...snap.data() } : null
  })
  window.addEventListener('keydown', onKeydown)
  prevHtmlLang = document.documentElement.lang
  document.documentElement.lang = 'sw'
})

watch(tokenValid, (valid) => {
  if (valid && !unsubAttendees) {
    unsubAttendees = onSnapshot(collection(db, 'events', eventId.value, 'attendees'), snap => {
      attendees.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      for (const a of snap.docs) {
        const id = a.id
        if (!(id in phoneDrafts)) phoneDrafts[id] = a.data().phone ? `+${a.data().phone}` : ''
      }
    })
  } else if (!valid && unsubAttendees) {
    unsubAttendees()
    unsubAttendees = null
    attendees.value = []
  }
})

onUnmounted(() => {
  unsubEvent?.()
  unsubAttendees?.()
  window.removeEventListener('keydown', onKeydown)
  document.documentElement.lang = prevHtmlLang ?? 'en'
})

function getKardType(att) {
  const c = att.cards ?? {}
  if (c.invitation != null) return 'invitation'
  if (c.contribution != null) return 'contribution'
  return 'contact'
}

function parseIdx(idx) {
  const firstU = idx.indexOf('_')
  const lastU = idx.lastIndexOf('_')
  if (firstU === -1 || firstU === lastU) return null
  return { channel: idx.slice(0, firstU), campaignId: idx.slice(firstU + 1, lastU), status: idx.slice(lastU + 1) }
}

function statusFor(att, channel) {
  for (const idx of att.messageIndexes ?? []) {
    const p = parseIdx(idx)
    if (p && p.channel === channel && p.campaignId === CAMPAIGN_ID) return p.status
  }
  return null
}

function isNotDelivered(att) {
  const wa = statusFor(att, 'whatsapp')
  const sms = statusFor(att, 'sms')
  const waBad = wa == null || WA_NOT_DELIVERED.has(wa)
  const smsBad = sms == null || SMS_NOT_DELIVERED.has(sms)
  return waBad && smsBad
}

// Every invitation attendee whose card hasn't been confirmed delivered on either
// channel. Some of these get resolved without ever flipping to "delivered" —
// e.g. the client insists the number is correct and just sends the card
// themselves another way — so resolution is tracked separately via
// invitationIssueResolvedAt rather than inferred from delivery status.
const invitationAttendees = computed(() => attendees.value.filter(a => getKardType(a) === 'invitation'))

const notDeliveredAll = computed(() =>
  invitationAttendees.value.filter(a => isNotDelivered(a))
)
const reportList = computed(() => notDeliveredAll.value.filter(a => !a.invitationIssueResolvedAt))
const resolvedList = computed(() => notDeliveredAll.value.filter(a => a.invitationIssueResolvedAt))
const resolvedExpanded = ref(false)

// The opposite of notDeliveredAll — confirmed delivered or read on at least one channel.
const deliveredList = computed(() => invitationAttendees.value.filter(a => !isNotDelivered(a)))

// Progress ring — resolved-of-total meter. r=42 circle: 2*PI*42.
const METER_CIRC = 263.894
const resolvedPct = computed(() =>
  notDeliveredAll.value.length ? Math.round((resolvedList.value.length / notDeliveredAll.value.length) * 100) : 0
)

// ── RSVP ─────────────────────────────────────────────────────────────────────
const rsvpFilter = ref('all') // 'all' | 'confirmed' | 'declined' | 'pending'
function rsvpStatusOf(a) {
  if (a.attendanceStatus === 'Confirmed') return 'confirmed'
  if (a.attendanceStatus === 'Declined') return 'declined'
  return 'pending'
}
const rsvpCounts = computed(() => {
  const c = { all: attendees.value.length, confirmed: 0, declined: 0, pending: 0 }
  for (const a of attendees.value) c[rsvpStatusOf(a)]++
  return c
})
const rsvpFilteredList = computed(() =>
  attendees.value.filter(a => rsvpFilter.value === 'all' || rsvpStatusOf(a) === rsvpFilter.value)
)

const searchQ = ref('')

function matchesSearch(a, q) {
  if (!q) return true
  const qDigits = q.replace(/\D/g, '')
  return (a.fullName ?? '').toLowerCase().includes(q) || (!!qDigits && (a.phone ?? '').includes(qDigits))
}

const visibleList = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  return reportList.value.filter(a => matchesSearch(a, q))
})
const visibleDeliveredList = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  return deliveredList.value.filter(a => matchesSearch(a, q))
})
const visibleRsvpList = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  return rsvpFilteredList.value.filter(a => matchesSearch(a, q))
})

function cardUrl(att) {
  return att.cards?.invitation?.url ?? null
}

// ── Avatar identity ──────────────────────────────────────────────────────────
// A small curated warm palette (rather than a full hue rotation) so every
// avatar still reads as part of this page's ivory/gold family.
const AVATAR_PALETTE = [
  { bg: '#F3E6C8', fg: '#8B6800' }, // amber
  { bg: '#E9DCC8', fg: '#7A5C2E' }, // sand
  { bg: '#E3DED0', fg: '#5B5340' }, // olive
  { bg: '#EAD9D2', fg: '#A83C2E' }, // terracotta
  { bg: '#DCE3D5', fg: '#4A6B4D' }, // sage
  { bg: '#E6DCE8', fg: '#6B4E75' }, // plum
]
function nameHash(s) {
  let h = 0
  for (let i = 0; i < (s?.length ?? 0); i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/).filter(Boolean)
  return p.length === 1 ? (p[0][0] ?? '?').toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
function avatarBg(name) { return AVATAR_PALETTE[nameHash(name ?? '') % AVATAR_PALETTE.length].bg }
function avatarFg(name) { return AVATAR_PALETTE[nameHash(name ?? '') % AVATAR_PALETTE.length].fg }

// ── Phone editing ────────────────────────────────────────────────────────────
const phoneDrafts = reactive({})
const phoneValidity = reactive({})
const saving = reactive({})
const justSaved = reactive({})
const lightboxUrl = ref(null)
const resolving = reactive({})

function onKeydown(e) {
  if (e.key === 'Escape') lightboxUrl.value = null
}

function onValidate(attId, obj) {
  phoneValidity[attId] = obj
  justSaved[attId] = false
}

function normalizeNum(s) {
  return (s ?? '').replace(/\D/g, '')
}

function canSave(att) {
  const v = phoneValidity[att.id]
  if (!v?.valid) return false
  return normalizeNum(v.number) !== normalizeNum(att.phone)
}

async function savePhone(att) {
  if (!canSave(att)) return
  const newPhone = normalizeNum(phoneValidity[att.id].number)
  const previousPhone = att.phone ?? ''
  saving[att.id] = true
  try {
    const at = new Date().toISOString()
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), {
      phone: newPhone,
      previousPhone,
      phoneUpdatedByClientAt: at,
    })
    await setDoc(doc(db, 'events', eventId.value, 'phoneChangeNotices', att.id), {
      attendeeId: att.id,
      fullName: att.fullName ?? '',
      previousPhone,
      newPhone,
      at,
    }, { merge: true })
    justSaved[att.id] = true
  } catch (e) {
    console.error('Failed to save phone number', e)
  } finally {
    saving[att.id] = false
  }
}

// ── Manual resolution (no phone alternative, handled outside the system) ───
async function markResolved(att) {
  resolving[att.id] = true
  try {
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), {
      invitationIssueResolvedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Failed to mark attendee resolved', e)
  } finally {
    resolving[att.id] = false
  }
}

async function undoResolved(att) {
  try {
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), {
      invitationIssueResolvedAt: null,
    })
  } catch (e) {
    console.error('Failed to undo resolved status', e)
  }
}
</script>

<style scoped>
.ir-page {
  --ir-ivory: #FAF6EF;
  --ir-cream: #F3ECDD;
  --ir-gold: #C9A84C;
  --ir-gold-dark: #9C7F32;
  --ir-text-main: #241F18;
  --ir-text-light: #6b6255;
  --ir-white: #FFFFFF;
  --ir-radius: 20px;
  --ir-shadow: 0 14px 34px -16px rgba(36,31,24,0.22), 0 2px 10px rgba(36,31,24,0.06);
  --ir-ok-bg: #E6F2E8; --ir-ok-fg: #1D7A46;
  --ir-warn-bg: #FBEFD0; --ir-warn-fg: #8B6800;
  --ir-bad-bg: #FBE6E1; --ir-bad-fg: #A83C2E;

  min-height: 100vh;
  background:
    radial-gradient(ellipse 900px 500px at 50% -10%, var(--ir-cream), transparent),
    var(--ir-ivory);
  color: var(--ir-text-main);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 48px 16px 90px;
}

.ir-state { min-height: 60vh; display: flex; align-items: center; justify-content: center; }
.ir-spinner {
  width: 34px; height: 34px; border-radius: 50%;
  border: 3px solid var(--ir-cream); border-top-color: var(--ir-gold);
  animation: ir-spin 0.85s linear infinite;
}
@keyframes ir-spin { to { transform: rotate(360deg); } }

.ir-state-icon {
  width: 56px; height: 56px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}
.ir-state-icon--ok  { background: var(--ir-ok-bg);  color: var(--ir-ok-fg); }
.ir-state-icon--bad { background: var(--ir-bad-bg); color: var(--ir-bad-fg); }

.ir-state-card {
  max-width: 380px; text-align: center; padding: 36px 32px;
  background: var(--ir-white); border-radius: var(--ir-radius); box-shadow: var(--ir-shadow);
  border: 1px solid rgba(201,168,76,0.14);
}
.ir-state-card h1 { font-family: 'Playfair Display', serif; font-weight: 600; font-size: 19px; margin: 0 0 6px; }
.ir-state-card p { font-size: 14px; color: var(--ir-text-light); margin: 0; line-height: 1.5; }

.ir-body { max-width: 660px; margin: 0 auto; }

.ir-header { text-align: center; margin-bottom: 36px; }
.ir-brand {
  font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 600;
  letter-spacing: 0.32em; text-transform: uppercase; color: var(--ir-gold-dark);
  margin-bottom: 14px;
}
.ir-header h1 {
  font-family: 'Playfair Display', serif; font-weight: 600;
  font-size: clamp(23px, 4vw, 30px); line-height: 1.25;
  margin: 0 0 6px; letter-spacing: -0.2px;
}
.ir-event-title { font-size: 14px; color: var(--ir-gold-dark); font-weight: 600; margin: 0; }

.ir-tabs {
  display: flex; gap: 6px; margin: 22px 0 24px;
  background: var(--ir-cream); border-radius: 14px; padding: 5px;
}
.ir-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  height: 40px; border: none; border-radius: 10px; background: transparent;
  font-family: inherit; font-size: 13px; font-weight: 700; color: var(--ir-text-light);
  cursor: pointer; transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
}
.ir-tab:hover { color: var(--ir-text-main); }
.ir-tab--active {
  background: var(--ir-white); color: var(--ir-text-main);
  box-shadow: 0 4px 12px -6px rgba(36,31,24,0.25);
}
.ir-tab-count {
  font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px;
  background: rgba(36,31,24,0.08); color: inherit;
}
.ir-tab--active .ir-tab-count { background: rgba(201,168,76,0.18); color: var(--ir-gold-dark); }
@media (max-width: 480px) {
  .ir-tabs { flex-wrap: wrap; }
  .ir-tab { flex: 1 1 auto; min-width: 30%; }
}
.ir-stats {
  display: flex; align-items: center; justify-content: center; gap: 0; flex-wrap: wrap;
  margin: 18px auto 0; max-width: 460px;
  background: var(--ir-white); border-radius: 16px;
  box-shadow: var(--ir-shadow); border: 1px solid rgba(201,168,76,0.14);
  overflow: hidden;
}
.ir-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 16px 18px; }
.ir-stat-val { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; line-height: 1; }
.ir-stat-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ir-text-light); }
.ir-stat--bad .ir-stat-val { color: var(--ir-bad-fg); }
.ir-stat--ok  .ir-stat-val { color: var(--ir-ok-fg); }
.ir-stat-sep { align-self: stretch; width: 1px; background: rgba(36,31,24,0.08); margin: 16px 0; }

.ir-meter { position: relative; flex-shrink: 0; width: 88px; height: 88px; margin: 12px 14px; }
.ir-meter svg circle { transition: stroke-dashoffset 600ms cubic-bezier(.19,1,.22,1); }
.ir-meter-center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1px;
}
.ir-meter-pct { font-family: 'Inter', sans-serif; font-size: 19px; font-weight: 700; color: var(--ir-ok-fg); line-height: 1; }
.ir-meter-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ir-text-light); }

@media (prefers-reduced-motion: reduce) {
  .ir-meter svg circle { transition: none !important; }
}
.ir-divider {
  width: 92px; height: 1px; margin: 18px auto;
  background: linear-gradient(90deg, transparent, var(--ir-gold) 15%, var(--ir-gold) 85%, transparent);
}
.ir-explainer { font-size: 15px; line-height: 1.65; color: var(--ir-text-light); max-width: 520px; margin: 0 auto; }
.ir-explainer strong { color: var(--ir-text-main); font-weight: 700; }

.ir-empty {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 64px 24px; background: var(--ir-white); border-radius: var(--ir-radius);
  box-shadow: var(--ir-shadow); border: 1px solid rgba(201,168,76,0.14);
}
.ir-empty h2 { font-family: 'Playfair Display', serif; font-weight: 600; font-size: 19px; margin: 0 0 4px; }
.ir-empty p { font-size: 14px; color: var(--ir-text-light); margin: 0; }
.ir-empty--search { padding: 40px 24px; gap: 12px; }
.ir-empty--search p { font-size: 15px; color: var(--ir-text-main); font-weight: 600; }

.ir-search-wrap {
  display: flex; align-items: center; gap: 10px;
  background: var(--ir-white); border: 1px solid rgba(36,31,24,0.14);
  border-radius: 14px; padding: 12px 16px; margin-bottom: 18px;
  box-shadow: var(--ir-shadow);
  transition: border-color 180ms ease, box-shadow 180ms ease;
}
.ir-search-wrap:focus-within { border-color: var(--ir-gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.18); }
.ir-search-icon { color: var(--ir-text-light); flex-shrink: 0; }
.ir-search-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-family: 'Inter', sans-serif; font-size: 15px; color: var(--ir-text-main);
}
.ir-search-input::placeholder { color: #b6aa98; }
.ir-search-clear {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%; border: none;
  background: var(--ir-cream); color: var(--ir-text-light); cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}
.ir-search-clear:hover { background: rgba(201,168,76,0.2); color: var(--ir-gold-dark); }

.ir-list { display: flex; flex-direction: column; gap: 18px; }
.ir-card {
  position: relative;
  background: var(--ir-white);
  border-radius: var(--ir-radius);
  padding: 24px 26px;
  box-shadow: var(--ir-shadow);
  border: 1px solid rgba(201,168,76,0.14);
  overflow: hidden;
  animation: ir-card-in 480ms cubic-bezier(.19,1,.22,1) both;
  animation-delay: calc(var(--i, 0) * 70ms);
  transition: transform 220ms ease, box-shadow 220ms ease;
}
.ir-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px -18px rgba(36,31,24,0.28), 0 3px 12px rgba(36,31,24,0.08);
}
.ir-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--ir-gold) 18%, var(--ir-gold) 82%, transparent);
}
@keyframes ir-card-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.ir-card-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 20px; }
.ir-card-who { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ir-avatar {
  flex-shrink: 0; width: 38px; height: 38px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700;
}
.ir-card-name { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 600; }
.ir-card-phone { font-size: 12px; color: var(--ir-text-light); margin-top: 2px; }
.ir-card-badges { display: flex; gap: 7px; flex-wrap: wrap; }

.ir-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.ir-chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 14px; border-radius: 999px;
  background: var(--ir-white); border: 1px solid rgba(36,31,24,0.14);
  font-family: inherit; font-size: 12.5px; font-weight: 700; color: var(--ir-text-light);
  cursor: pointer; transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
}
.ir-chip:hover { border-color: var(--ir-gold); color: var(--ir-text-main); }
.ir-chip-count {
  font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px;
  background: rgba(36,31,24,0.08); color: inherit;
}
.ir-chip--active { color: var(--ir-text-main); border-color: transparent; background: var(--ir-cream); }
.ir-chip--active .ir-chip-count { background: rgba(36,31,24,0.12); }
.ir-chip--ok.ir-chip--active { background: var(--ir-ok-bg); color: var(--ir-ok-fg); }
.ir-chip--ok.ir-chip--active .ir-chip-count { background: rgba(29,122,70,0.16); }
.ir-chip--bad.ir-chip--active { background: var(--ir-bad-bg); color: var(--ir-bad-fg); }
.ir-chip--bad.ir-chip--active .ir-chip-count { background: rgba(168,60,46,0.16); }
.ir-chip--warn.ir-chip--active { background: var(--ir-warn-bg); color: var(--ir-warn-fg); }
.ir-chip--warn.ir-chip--active .ir-chip-count { background: rgba(139,104,0,0.16); }

.ir-rsvp-badge {
  flex-shrink: 0; font-size: 11.5px; font-weight: 700; letter-spacing: 0.02em;
  padding: 6px 13px; border-radius: 20px;
  background: var(--ir-warn-bg); color: var(--ir-warn-fg);
}
.ir-rsvp-badge--confirmed { background: var(--ir-ok-bg); color: var(--ir-ok-fg); }
.ir-rsvp-badge--declined { background: var(--ir-bad-bg); color: var(--ir-bad-fg); }
.ir-rsvp-badge--pending { background: var(--ir-warn-bg); color: var(--ir-warn-fg); }

.ir-card--compact { padding: 16px 20px; }
.ir-card-top--flush { margin-bottom: 0; }
.ir-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
  padding: 5px 11px; border-radius: 20px;
  background: var(--ir-warn-bg); color: var(--ir-warn-fg);
}
.ir-badge-icon { flex-shrink: 0; opacity: 0.85; }
.ir-badge--delivered, .ir-badge--read           { background: var(--ir-ok-bg);  color: var(--ir-ok-fg); }
.ir-badge--failed, .ir-badge--undelivered       { background: var(--ir-bad-bg); color: var(--ir-bad-fg); }

.ir-card-body { display: flex; flex-wrap: wrap; gap: 14px; }
.ir-tile {
  background: var(--ir-ivory); border: 1px solid rgba(36,31,24,0.06);
  border-radius: 14px; padding: 16px 18px;
}
.ir-tile--phone { flex: 1 1 260px; min-width: 240px; }
.ir-tile--card { flex: 1 1 220px; min-width: 200px; }
.ir-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; color: var(--ir-text-light);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;
}
.ir-label svg { flex-shrink: 0; opacity: 0.75; }

/*
 * This page is standalone and always light, regardless of whatever theme the
 * admin app currently has set on <html> — but that admin theme's global,
 * !important-heavy [data-theme="dark"] .vue-tel-input rules (src/style.css)
 * still match here since they're unscoped. Out-specificity + !important them
 * so the phone input can never inherit the admin's dark skin.
 */
.ir-page :deep(.vue-tel-input) {
  border-radius: 12px !important;
  background: var(--ir-white) !important;
  border-color: rgba(36,31,24,0.15) !important;
  box-shadow: none !important;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}
.ir-page :deep(.vue-tel-input:focus-within) {
  border-color: var(--ir-gold) !important;
  box-shadow: 0 0 0 3px rgba(201,168,76,0.20) !important;
}
.ir-page :deep(.vti__dropdown) { border-right-color: rgba(36,31,24,0.12) !important; }
.ir-page :deep(.vti__dropdown:hover),
.ir-page :deep(.vti__dropdown.open) { background: var(--ir-cream) !important; }
.ir-page :deep(.vti__country-code) { color: var(--ir-text-light) !important; }
.ir-page :deep(.vti__dropdown-arrow) { color: var(--ir-text-light) !important; }
.ir-page :deep(.vti__input) {
  background: var(--ir-white) !important;
  color: var(--ir-text-main) !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 14px !important;
}
.ir-page :deep(.vti__input::placeholder) { color: #b6aa98 !important; }
.ir-page :deep(.vti__dropdown-list) {
  background: var(--ir-white) !important;
  border-color: rgba(36,31,24,0.12) !important;
  box-shadow: var(--ir-shadow) !important;
  color: var(--ir-text-main) !important;
}
.ir-page :deep(.vti__search_box) {
  background: var(--ir-ivory) !important;
  border-color: rgba(36,31,24,0.12) !important;
  color: var(--ir-text-main) !important;
}
.ir-page :deep(.vti__dropdown-item) { color: var(--ir-text-main) !important; }
.ir-page :deep(.vti__dropdown-item:hover) { background: var(--ir-cream) !important; }
.ir-page :deep(.vti__dropdown-item.highlighted) {
  background: rgba(201,168,76,0.16) !important;
  color: var(--ir-gold-dark) !important;
  font-weight: 600 !important;
}

.ir-phone-acts { display: flex; align-items: center; gap: 14px; margin-top: 12px; flex-wrap: wrap; }
.ir-save-btn {
  height: 42px; padding: 0 22px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, var(--ir-gold), var(--ir-gold-dark));
  color: #241F18; font-size: 14px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  box-shadow: 0 8px 18px -8px rgba(156,127,50,0.6);
  transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
}
.ir-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 22px -8px rgba(156,127,50,0.65); }
.ir-save-btn:active:not(:disabled) { transform: translateY(0); }
.ir-save-btn:disabled { opacity: 0.35; box-shadow: none; cursor: default; }
.ir-saved-mark {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--ir-ok-fg);
  animation: ir-pop 360ms cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes ir-pop { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }

.ir-card-row { display: flex; align-items: center; gap: 16px; }
.ir-card-thumb-btn {
  position: relative; flex-shrink: 0; width: 72px; height: 72px;
  border-radius: 10px; overflow: hidden; padding: 0; cursor: zoom-in;
  border: 1px solid rgba(36,31,24,0.10); box-shadow: 0 4px 10px -6px rgba(36,31,24,0.25);
  transition: transform 180ms ease, box-shadow 180ms ease;
}
.ir-card-thumb-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 16px -8px rgba(36,31,24,0.35); }
.ir-card-thumb { width: 100%; height: 100%; display: block; object-fit: cover; }
.ir-card-thumb-zoom {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(36,31,24,0.35); color: #fff; opacity: 0; transition: opacity 180ms ease;
}
.ir-card-thumb-btn:hover .ir-card-thumb-zoom { opacity: 1; }

.ir-card-acts { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8px; }
.ir-card-btn {
  flex: 0 0 auto; height: 36px; padding: 0 16px; border-radius: 8px;
  background: var(--ir-gold); color: #241F18; font-size: 12px; font-weight: 700;
  border: 1px solid transparent; cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: inherit; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}
.ir-card-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px -8px rgba(156,127,50,0.55); }
.ir-card-btn--ghost { background: transparent; border-color: var(--ir-gold); color: var(--ir-gold-dark); }
.ir-card-btn--ghost:hover { background: rgba(201,168,76,0.08); }

.ir-resolve-row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  margin-top: 14px; padding: 12px 16px; border-radius: 12px;
  background: rgba(29,122,70,0.05); border: 1px dashed rgba(29,122,70,0.25);
}
.ir-resolve-icon { flex-shrink: 0; color: var(--ir-ok-fg); opacity: 0.7; }
.ir-resolve-text { flex: 1 1 220px; font-size: 12.5px; color: var(--ir-text-light); margin: 0; line-height: 1.4; }
.ir-resolve-btn {
  flex-shrink: 0; margin-left: auto; height: 32px; padding: 0 14px; border-radius: 8px;
  background: transparent; border: 1px solid rgba(29,122,70,0.35); color: var(--ir-ok-fg);
  font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}
.ir-resolve-btn:hover:not(:disabled) { background: rgba(29,122,70,0.10); transform: translateY(-1px); }
.ir-resolve-btn:disabled { opacity: 0.5; cursor: default; }

.ir-resolved-section { margin-top: 20px; }
.ir-resolved-toggle {
  display: flex; align-items: center; gap: 7px;
  background: none; border: none; cursor: pointer; padding: 6px 2px;
  font-family: inherit; font-size: 13px; font-weight: 600; color: var(--ir-ok-fg);
}
.ir-resolved-chev { margin-left: 2px; transition: transform 160ms ease; }
.ir-resolved-chev--open { transform: rotate(180deg); }
.ir-resolved-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.ir-resolved-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--ir-white); border: 1px solid rgba(36,31,24,0.08);
  border-radius: 10px; padding: 9px 14px; opacity: 0.75;
}
.ir-resolved-name { font-size: 13px; font-weight: 600; color: var(--ir-text-main); flex-shrink: 0; }
.ir-resolved-phone { font-size: 12px; color: var(--ir-text-light); flex: 1; }
.ir-resolved-undo {
  flex-shrink: 0; background: none; border: none; cursor: pointer;
  font-size: 12px; font-weight: 700; color: var(--ir-gold-dark); padding: 0; font-family: inherit;
}
.ir-resolved-undo:hover { text-decoration: underline; }

.ir-lightbox {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(20,16,10,0.72); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; padding: 40px 20px;
  animation: ir-fade-in 180ms ease both;
}
@keyframes ir-fade-in { from { opacity: 0; } to { opacity: 1; } }
.ir-lightbox-img { max-width: min(90vw, 420px); max-height: 85vh; border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.ir-lightbox-close {
  position: absolute; top: 20px; right: 20px;
  width: 38px; height: 38px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.15); color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 150ms ease;
}
.ir-lightbox-close:hover { background: rgba(255,255,255,0.28); }

@media (prefers-reduced-motion: reduce) {
  .ir-card, .ir-saved-mark, .ir-spinner, .ir-lightbox { animation: none !important; transition: none !important; }
}

@media (max-width: 480px) {
  .ir-page { padding: 32px 12px 70px; }
  .ir-card { padding: 20px 18px; }
  .ir-card-body { gap: 20px; }
}
</style>
