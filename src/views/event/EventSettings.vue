<template>
  <div class="es-root">

    <!-- ── Loading skeleton ── -->
    <div v-if="!event" class="es-skeleton">
      <div class="es-sk-bar es-sk-bar--title" />
      <div class="es-sk-bar es-sk-bar--sub" />
      <div class="es-sk-section" v-for="n in 4" :key="n">
        <div class="es-sk-bar es-sk-bar--label" />
        <div class="es-sk-tile" />
      </div>
    </div>

    <template v-else>
      <div class="es-sticky-head">
        <div class="es-hub-hd">
          <button type="button" class="es-hd-burger" title="Menu" @click="navDrawer.open()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="es-hd-sep" />
          <div class="es-hd-badge" @click="$router.push('/events')" title="All Events">
            <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="es-hd-brand-logo" />
            <span v-else class="es-hd-brand-script">.joy</span>
          </div>
          <div class="es-hd-sep" />
          <div class="es-hd-title-group">
            <h1 class="es-hub-title">Settings</h1>
            <span class="es-hub-chip" :class="isPublished ? 'es-hub-chip--pub' : 'es-hub-chip--draft'">
              {{ isPublished ? 'Published' : 'Draft' }}
            </span>
          </div>
          <span class="es-hd-event" :title="event.title">{{ event.title }}</span>
          <button type="button" class="es-edit-btn" @click="router.push(`/edit-event/${eventId}`)">
            Edit Details
          </button>
          <button
            type="button"
            class="es-save-btn"
            :class="{ 'es-save-btn--dirty': isDirty && !saving }"
            :disabled="saving || !isDirty"
            @click="saveSettings"
          >
            <svg v-if="saving" class="es-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span v-if="isDirty && !saving" class="es-save-dot" />
            {{ saving ? 'Saving…' : (isDirty ? 'Save changes' : 'Saved') }}
          </button>
        </div>

        <div class="es-tabs" role="tablist">
          <button
            v-for="t in tabs"
            :key="t.id"
            type="button"
            class="es-tab"
            :class="{ 'es-tab--on': activeTab === t.id, 'es-tab--danger': t.id === 'danger' }"
            role="tab"
            :aria-selected="activeTab === t.id"
            @click="activeTab = t.id"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <!-- ── Tab panes ── -->
      <div class="es-tabpanes">

          <!-- 0. WHO CAN SEE THIS EVENT (owner-only) — Access tab -->
          <div v-if="isOwner" v-show="activeTab === 'access'" class="es-panel">
            <div class="es-panel-hd">
              <div class="es-panel-hd-left">
                <div class="es-accent-bar" />
                <div class="es-section-meta">
                  <span class="es-section-label">WHO CAN SEE THIS EVENT</span>
                  <span class="es-section-hint">You always see it. Grant specific members access below.</span>
                </div>
              </div>
            </div>

            <div v-if="!orgMembers.length" class="es-placeholder">
              No other members in this organization yet.
            </div>
            <div v-else class="es-vis-list">
              <label v-for="m in orgMembers" :key="m.id" class="es-vis-row" :class="{ 'es-vis-row--busy': visBusyUid === m.id }">
                <div class="es-vis-info">
                  <span class="es-vis-name">{{ m.name }}</span>
                  <span class="es-vis-email">{{ m.email }}</span>
                </div>
                <input
                  type="checkbox"
                  class="es-vis-check"
                  :checked="visibleTo.includes(m.id)"
                  :disabled="visBusyUid === m.id"
                  @change="toggleVisibility(m.id)"
                />
              </label>
            </div>
          </div>

          <!-- 1. EVENT LOCATIONS — Locations tab -->
          <div v-show="activeTab === 'locations'" class="es-panel">
            <div class="es-panel-hd">
              <div class="es-panel-hd-left">
                <div class="es-accent-bar" />
                <div class="es-section-meta">
                  <span class="es-section-label">VENUES</span>
                  <span class="es-section-hint">Ceremony, reception &amp; other venue details</span>
                </div>
              </div>
              <button class="es-add-btn" @click="openLocationModal()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add
              </button>
            </div>

            <div v-if="!locations.length" class="es-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0CEC9" stroke-width="1.4" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              No venues added yet
            </div>
            <div v-else class="es-location-list">
              <div
                v-for="(loc, idx) in locations"
                :key="loc.id"
                class="es-location-row"
                :class="{ 'es-location-row--sep': idx < locations.length - 1 }"
              >
                <div class="es-loc-icon-wrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div class="es-loc-info">
                  <span class="es-loc-label">{{ loc.label }}</span>
                  <span class="es-loc-place">{{ loc.placeName }}</span>
                  <span v-if="loc.description" class="es-loc-desc">{{ loc.description }}</span>
                  <span v-if="loc.dateTime" class="es-loc-date">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {{ fmtLocDateTime(loc.dateTime) }}
                  </span>
                </div>
                <a v-if="loc.mapsUrl" :href="loc.mapsUrl" target="_blank" rel="noopener" class="es-loc-link" title="Open in Google Maps">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
                <button class="es-loc-edit" @click="openLocationModal(loc)" title="Edit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </button>
                <button class="es-loc-del" @click="removeLocation(loc)" title="Remove">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 2. LANGUAGE — General tab -->
          <div v-show="activeTab === 'general'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">LANGUAGE</span>
                <span class="es-section-hint">Preferred language for message templates</span>
              </div>
            </div>
            <div class="es-radio-group">
              <button class="es-radio-opt" :class="{ 'es-radio-opt--on': language === 'sw' }" @click="language = 'sw'">
                <span class="es-radio-flag">🇹🇿</span>
                <span class="es-radio-lbl">Kiswahili</span>
                <svg v-if="language === 'sw'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DDDBD6" stroke-width="1.6"><circle cx="12" cy="12" r="10"/></svg>
              </button>
              <div class="es-radio-sep" />
              <button class="es-radio-opt" :class="{ 'es-radio-opt--on': language === 'en' }" @click="language = 'en'">
                <span class="es-radio-flag">🇬🇧</span>
                <span class="es-radio-lbl">English</span>
                <svg v-if="language === 'en'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DDDBD6" stroke-width="1.6"><circle cx="12" cy="12" r="10"/></svg>
              </button>
            </div>
          </div>

          <!-- 2b. TIME FORMAT (English events only) — General tab -->
          <div v-if="language === 'en'" v-show="activeTab === 'general'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">TIME FORMAT</span>
                <span class="es-section-hint">How event times appear in English message templates</span>
              </div>
            </div>
            <div class="es-toggle-group">
              <button class="es-toggle-opt" :class="{ 'es-toggle-opt--on': timeFormat === '12h' }" @click="timeFormat = '12h'">
                12-hour (AM/PM)
              </button>
              <button class="es-toggle-opt" :class="{ 'es-toggle-opt--on': timeFormat === '24h' }" @click="timeFormat = '24h'">
                24-hour
              </button>
            </div>
          </div>

          <!-- 2c. GREETING — General tab -->
          <div v-show="activeTab === 'general'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">GREETING</span>
                <span class="es-section-hint">Write any sentence — put <code v-pre>{{username}}</code> anywhere in it and the guest's name breaks onto its own underlined line there</span>
              </div>
            </div>
            <textarea
              v-model="greetingTemplate"
              class="es-textarea"
              placeholder="e.g. To {{username}}, we can't wait to celebrate with you"
              rows="3"
            />
            <p class="es-mc-note">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Leave blank to just show the guest's name, as before. Saves with the "Save changes" button above
            </p>
          </div>

          <!-- 3. SCAN PROMO — General tab -->
          <div v-show="activeTab === 'general'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">SCAN PROMO</span>
                <span class="es-section-hint">Promotional message sent to attendees after a successful check-in scan</span>
              </div>
            </div>
            <textarea
              v-model="scanPromo"
              class="es-textarea"
              placeholder="Write your promotional message here…"
              rows="5"
            />
            <div class="es-promo-footer">
              <span class="es-promo-note">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Triggered automatically on successful check-in
              </span>
            </div>
          </div>

          <!-- 3b. SMS SENDER ID — General tab -->
          <div v-if="approvedSenderIds.length" v-show="activeTab === 'general'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">SMS SENDER ID</span>
                <span class="es-section-hint">Who guests see this event's messages from</span>
              </div>
            </div>

            <div class="es-sid-options">
              <!-- Follow the org default -->
              <button
                class="es-sid-opt"
                :class="{ 'es-sid-opt--on': !eventSenderId }"
                :disabled="savingSenderId"
                @click="chooseSenderId(null)"
              >
                <span class="es-sid-opt-val">{{ orgDefaultSenderId || 'HAFLAWAY' }}</span>
                <span class="es-sid-opt-tag">Organization default</span>
                <svg v-if="!eventSenderId" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>

              <!-- Anything else this org has had approved -->
              <button
                v-for="sid in approvedSenderIds"
                :key="sid.id"
                class="es-sid-opt"
                :class="{ 'es-sid-opt--on': eventSenderId === sid.value }"
                :disabled="savingSenderId"
                @click="chooseSenderId(sid.value)"
              >
                <span class="es-sid-opt-val">{{ sid.value }}</span>
                <span v-if="eventSenderId === sid.value" class="es-sid-opt-tag">Only this event</span>
                <svg v-if="eventSenderId === sid.value" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>

            <p v-if="senderIdError" class="es-sid-error">{{ senderIdError }}</p>
            <span v-else class="es-sid-note">
              Applies to every SMS this event sends. Changing the organization's default won't
              override a choice made here.
            </span>
          </div>

          <!-- 4. CARD FORMAT — General tab -->
          <div v-show="activeTab === 'general'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">CARD FORMAT</span>
                <span class="es-section-hint">File type when sharing invitation and contribution cards</span>
              </div>
            </div>
            <div class="es-toggle-group">
              <button class="es-toggle-opt" :class="{ 'es-toggle-opt--on': usePng }" @click="usePng = true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" :stroke="usePng ? '#111827' : '#B5B5BB'" stroke-width="2" stroke-linecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                PNG Image
              </button>
              <button class="es-toggle-opt" :class="{ 'es-toggle-opt--on': !usePng }" @click="usePng = false">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" :stroke="!usePng ? '#111827' : '#B5B5BB'" stroke-width="2" stroke-linecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                PDF Document
              </button>
            </div>
          </div>

          <!-- 5. PUBLISHING — Access tab -->
          <div v-show="activeTab === 'access'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">PUBLISHING</span>
                <span class="es-section-hint">Whether end-users can see this event publicly</span>
              </div>
            </div>
            <button class="es-action-row" @click="showPublishDialog = true">
              <div class="es-action-icon" :class="isPublished ? 'es-action-icon--green' : ''">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" :stroke="isPublished ? '#111827' : '#888'" stroke-width="2" stroke-linecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <span class="es-action-label" :class="isPublished ? 'es-action-label--green' : ''">
                {{ isPublished ? 'Published · Unpublish' : 'Draft · Publish' }}
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <!-- 5a2. HERO COVER IMAGE — Extras tab -->
          <div v-show="activeTab === 'extras'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">HERO COVER IMAGE</span>
                <span class="es-section-hint">Falls back to your event thumbnail if not set. Used as the video poster too.</span>
              </div>
            </div>

            <div
              class="es-artwork-drop"
              :class="{ 'es-artwork-drop--has': heroImageUrl }"
              @click="$refs.heroImageInput.click()"
              @dragover.prevent
              @drop.prevent="onHeroImageDrop"
            >
              <img v-if="heroImageUrl" :src="heroImageUrl" class="es-artwork-preview" />
              <div v-else class="es-artwork-placeholder">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D0CEC9" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                </svg>
                <p class="es-artwork-hint">Click or drag an image to upload</p>
              </div>
              <div v-if="savingHeroImage" class="es-artwork-uploading">
                <svg class="es-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Uploading…
              </div>
              <input ref="heroImageInput" type="file" accept="image/*" class="es-hidden" @change="onHeroImageChange" />
            </div>
          </div>

          <!-- 5a3. INTRO VIDEO — Extras tab -->
          <div v-show="activeTab === 'extras'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">INTRO VIDEO</span>
                <span class="es-section-hint">Plays once, muted, when a guest opens the invite — then fades into the hero</span>
              </div>
            </div>

            <button class="es-switch" :class="{ 'es-switch--on': heroVideoEnabled }" @click="toggleHeroVideo">
              <span class="es-switch-track"><span class="es-switch-thumb" /></span>
              <span class="es-switch-label">{{ heroVideoEnabled ? 'Enabled' : 'Disabled' }}</span>
            </button>

            <div
              class="es-artwork-drop"
              :class="{ 'es-artwork-drop--has': heroVideoUrl }"
              @click="$refs.heroVideoInput.click()"
              @dragover.prevent
              @drop.prevent="onHeroVideoDrop"
            >
              <video v-if="heroVideoUrl" :src="heroVideoUrl" class="es-artwork-preview" muted playsinline />
              <div v-else class="es-artwork-placeholder">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D0CEC9" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <p class="es-artwork-hint">Click or drag a video to upload · under 40MB</p>
              </div>
              <div v-if="savingHeroVideo" class="es-artwork-uploading">
                <svg class="es-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Uploading…
              </div>
              <input ref="heroVideoInput" type="file" accept="video/*" class="es-hidden" @change="onHeroVideoChange" />
            </div>
          </div>

          <!-- 5a4. BACKGROUND MUSIC — Extras tab -->
          <div v-show="activeTab === 'extras'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">BACKGROUND MUSIC</span>
                <span class="es-section-hint">Starts once the intro ends. Guests can mute it from the public page.</span>
              </div>
            </div>

            <button class="es-switch" :class="{ 'es-switch--on': heroMusicEnabled }" @click="toggleHeroMusic">
              <span class="es-switch-track"><span class="es-switch-thumb" /></span>
              <span class="es-switch-label">{{ heroMusicEnabled ? 'Enabled' : 'Disabled' }}</span>
            </button>

            <div
              class="es-audio-drop"
              @click="$refs.heroMusicInput.click()"
              @dragover.prevent
              @drop.prevent="onHeroMusicDrop"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D0CEC9" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
              <p class="es-artwork-hint">{{ heroMusicUrl ? 'Click or drag to replace the track' : 'Click or drag an audio file to upload · under 15MB' }}</p>
              <div v-if="savingHeroMusic" class="es-artwork-uploading es-artwork-uploading--inline">
                <svg class="es-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Uploading…
              </div>
              <input ref="heroMusicInput" type="file" accept="audio/*" class="es-hidden" @change="onHeroMusicChange" />
            </div>
            <audio v-if="heroMusicUrl" :src="heroMusicUrl" controls class="es-audio-player" />
          </div>

          <!-- 5b. FOOD & BEVERAGES — Extras tab -->
          <div v-show="activeTab === 'extras'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">FOOD &amp; BEVERAGES</span>
                <span class="es-section-hint">Shown on the public page once enabled and an image is set</span>
              </div>
            </div>

            <button class="es-switch" :class="{ 'es-switch--on': foodBevEnabled }" @click="toggleFoodBev">
              <span class="es-switch-track"><span class="es-switch-thumb" /></span>
              <span class="es-switch-label">{{ foodBevEnabled ? 'Enabled' : 'Disabled' }}</span>
            </button>

            <div
              class="es-artwork-drop"
              :class="{ 'es-artwork-drop--has': foodBevImage }"
              @click="$refs.foodBevInput.click()"
              @dragover.prevent
              @drop.prevent="onFoodBevDrop"
            >
              <img v-if="foodBevImage" :src="foodBevImage" class="es-artwork-preview" />
              <div v-else class="es-artwork-placeholder">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D0CEC9" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                </svg>
                <p class="es-artwork-hint">Click or drag an image to upload</p>
              </div>
              <div v-if="savingFoodBev" class="es-artwork-uploading">
                <svg class="es-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Uploading…
              </div>
              <input ref="foodBevInput" type="file" accept="image/*" class="es-hidden" @change="onFoodBevChange" />
            </div>
          </div>

          <!-- 5c. DRESS CODE — Extras tab -->
          <div v-show="activeTab === 'extras'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">DRESS CODE</span>
                <span class="es-section-hint">Shown on the public page once enabled and an image is set</span>
              </div>
            </div>

            <button class="es-switch" :class="{ 'es-switch--on': dressCodeEnabled }" @click="toggleDressCode">
              <span class="es-switch-track"><span class="es-switch-thumb" /></span>
              <span class="es-switch-label">{{ dressCodeEnabled ? 'Enabled' : 'Disabled' }}</span>
            </button>

            <div
              class="es-artwork-drop"
              :class="{ 'es-artwork-drop--has': dressCodeImage }"
              @click="$refs.dressCodeInput.click()"
              @dragover.prevent
              @drop.prevent="onDressCodeDrop"
            >
              <img v-if="dressCodeImage" :src="dressCodeImage" class="es-artwork-preview" />
              <div v-else class="es-artwork-placeholder">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D0CEC9" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                </svg>
                <p class="es-artwork-hint">Click or drag an image to upload</p>
              </div>
              <div v-if="savingDressCode" class="es-artwork-uploading">
                <svg class="es-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Uploading…
              </div>
              <input ref="dressCodeInput" type="file" accept="image/*" class="es-hidden" @change="onDressCodeChange" />
            </div>
          </div>

          <!-- 5d. MASTER OF CEREMONIES — Extras tab -->
          <div v-show="activeTab === 'extras'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">MASTER OF CEREMONIES</span>
                <span class="es-section-hint">Shown on the public page once enabled, named, and a photo is set</span>
              </div>
            </div>

            <button class="es-switch" :class="{ 'es-switch--on': mcEnabled }" @click="toggleMc">
              <span class="es-switch-track"><span class="es-switch-thumb" /></span>
              <span class="es-switch-label">{{ mcEnabled ? 'Enabled' : 'Disabled' }}</span>
            </button>

            <div
              class="es-artwork-drop es-artwork-drop--mc"
              :class="{ 'es-artwork-drop--has': mcPhoto }"
              @click="$refs.mcInput.click()"
              @dragover.prevent
              @drop.prevent="onMcPhotoDrop"
            >
              <img v-if="mcPhoto" :src="mcPhoto" class="es-artwork-preview" />
              <div v-else class="es-artwork-placeholder">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D0CEC9" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
                </svg>
                <p class="es-artwork-hint">Click or drag a photo to upload</p>
              </div>
              <div v-if="savingMcPhoto" class="es-artwork-uploading">
                <svg class="es-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Uploading…
              </div>
              <input ref="mcInput" type="file" accept="image/*" class="es-hidden" @change="onMcPhotoChange" />
            </div>

            <label class="es-field-label" style="margin-top:14px">NAME</label>
            <input v-model="mcName" class="es-input" placeholder="e.g. GaraB" />

            <label class="es-field-label" style="margin-top:10px">ROLE / TITLE</label>
            <input v-model="mcRole" class="es-input" placeholder="e.g. Master of Ceremonies" />

            <label class="es-field-label" style="margin-top:10px">BIO <span class="es-field-optional">· optional</span></label>
            <textarea v-model="mcBio" class="es-textarea" rows="3" placeholder="A short note about them…"></textarea>

            <p class="es-mc-note">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Name, role and bio save with the "Save changes" button above
            </p>
          </div>

          <!-- 5e. CONTACTS — Extras tab -->
          <div v-show="activeTab === 'extras'" class="es-panel">
            <div class="es-panel-hd">
              <div class="es-panel-hd-left">
                <div class="es-accent-bar" />
                <div class="es-section-meta">
                  <span class="es-section-label">CONTACTS</span>
                  <span class="es-section-hint">People guests can reach out to for RSVP or questions</span>
                </div>
              </div>
              <button class="es-add-btn" @click="openContactModal()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add
              </button>
            </div>

            <div v-if="!contacts.length" class="es-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0CEC9" stroke-width="1.4" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              No contacts added yet
            </div>
            <div v-else class="es-location-list">
              <div
                v-for="(c, idx) in contacts"
                :key="c.id"
                class="es-location-row"
                :class="{ 'es-location-row--sep': idx < contacts.length - 1 }"
              >
                <div class="es-loc-icon-wrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div class="es-loc-info">
                  <span class="es-loc-label">{{ c.name }}</span>
                  <span class="es-loc-place">{{ c.phone }}</span>
                  <span v-if="c.role" class="es-loc-desc">{{ c.role }}</span>
                </div>
                <button class="es-loc-edit" @click="openContactModal(c)" title="Edit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </button>
                <button class="es-loc-del" @click="removeContact(c)" title="Remove">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 5f. CLOSING NOTE — Extras tab -->
          <div v-show="activeTab === 'extras'" class="es-panel">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar" />
              <div class="es-section-meta">
                <span class="es-section-label">CLOSING NOTE</span>
                <span class="es-section-hint">Shown beneath the entry pass on the public page — e.g. an RSVP reminder or house rule</span>
              </div>
            </div>
            <textarea
              v-model="passNote"
              class="es-textarea"
              placeholder="e.g. While we love your little ones, our celebration will be an adult-only occasion…"
              rows="3"
            />
            <p class="es-mc-note">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Saves with the "Save changes" button above
            </p>
          </div>

          <!-- 6. DANGER ZONE — Danger tab -->
          <div v-show="activeTab === 'danger'" class="es-panel es-panel--danger">
            <div class="es-panel-hd es-panel-hd--flat">
              <div class="es-accent-bar es-accent-bar--red" />
              <div class="es-section-meta">
                <span class="es-section-label es-section-label--red">DANGER ZONE</span>
                <span class="es-section-hint">Irreversible actions</span>
              </div>
            </div>
            <button class="es-danger-row" @click="showDeleteDialog = true">
              <div class="es-danger-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>
              <span>Delete Event</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

      </div><!-- /tabpanes -->
    </template>

    <!-- ══════════════════════════════════════
         MODALS
         ══════════════════════════════════════ -->

    <!-- Add/Edit Venue side panel -->
    <Teleport to="body">
      <Transition name="es-fade">
        <div v-if="locationModalOpen" class="es-joy-backdrop" @click.self="closeLocationModal" />
      </Transition>
      <Transition name="es-drawer">
        <div v-if="locationModalOpen" class="es-modal">
            <div class="es-modal-hd">
              <div class="es-modal-ico">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div class="es-modal-hd-text">
                <h3 class="es-modal-title">{{ editingLocId ? 'Edit Venue' : 'Add Venue' }}</h3>
                <p class="es-modal-sub">{{ editingLocId ? "Update this venue's details" : 'Add a ceremony, reception, or other venue' }}</p>
              </div>
              <button class="es-modal-close" @click="closeLocationModal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="es-modal-body">
            <label class="es-field-label">CATEGORY</label>
            <input v-model="locForm.label" class="es-input" placeholder="e.g. The Ceremony, The Reception" />

            <label class="es-field-label" style="margin-top:8px">SEARCH PLACE</label>
            <div class="es-search-wrap">
              <svg class="es-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref="placeSearchRef"
                v-model="placeQuery"
                class="es-input es-input--search"
                placeholder="Search for a place…"
                autocomplete="off"
                @input="onPlaceInput"
                @keydown.down.prevent="suggestionCursor = Math.min(suggestionCursor + 1, placeSuggestions.length - 1)"
                @keydown.up.prevent="suggestionCursor = Math.max(suggestionCursor - 1, 0)"
                @keydown.enter.prevent="suggestionCursor >= 0 && pickSuggestion(placeSuggestions[suggestionCursor])"
                @keydown.escape="placeSuggestions = []"
              />
              <svg v-if="placesLoading" class="es-spin es-search-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <button v-else-if="locForm.placeName" class="es-search-clear" @click="clearPlacePick" title="Clear">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>

              <ul v-if="placeSuggestions.length" class="es-suggestions">
                <li
                  v-for="(s, i) in placeSuggestions"
                  :key="s.place"
                  class="es-suggestion"
                  :class="{ 'es-suggestion--active': i === suggestionCursor }"
                  @mousedown.prevent="pickSuggestion(s)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" style="flex-shrink:0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div class="es-suggestion-text">
                    <span class="es-suggestion-main">{{ s.structuredFormat?.mainText?.text }}</span>
                    <span class="es-suggestion-sub">{{ s.structuredFormat?.secondaryText?.text }}</span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Picked place chip -->
            <div v-if="locForm.placeName" class="es-picked-place">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span class="es-picked-name">{{ locForm.placeName }}</span>
              <span v-if="locForm.lat" class="es-picked-coords">{{ Number(locForm.lat).toFixed(4) }}, {{ Number(locForm.lng).toFixed(4) }}</span>
            </div>

            <label class="es-field-label" style="margin-top:8px">DESCRIPTION <span class="es-field-optional">· optional</span></label>
            <textarea v-model="locForm.description" class="es-textarea" rows="3" placeholder="What happens here, and anything guests should know…"></textarea>

            <label class="es-field-label" style="margin-top:8px">DATE &amp; TIME <span class="es-field-optional">· optional</span></label>
            <input v-model="locForm.dateTime" type="datetime-local" class="es-input" />
            </div>

            <div class="es-modal-actions">
              <button class="es-modal-cancel" @click="closeLocationModal">Cancel</button>
              <button
                class="es-modal-save"
                :disabled="!locForm.label.trim() || !locForm.placeName.trim() || savingLoc"
                @click="saveVenue"
              >
                {{ savingLoc ? (editingLocId ? 'Saving…' : 'Adding…') : (editingLocId ? 'Save Changes' : 'Add Venue') }}
              </button>
            </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add/Edit Contact side panel -->
    <Teleport to="body">
      <Transition name="es-fade">
        <div v-if="contactModalOpen" class="es-joy-backdrop" @click.self="closeContactModal" />
      </Transition>
      <Transition name="es-drawer">
        <div v-if="contactModalOpen" class="es-modal">
            <div class="es-modal-hd">
              <div class="es-modal-ico">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div class="es-modal-hd-text">
                <h3 class="es-modal-title">{{ editingContactId ? 'Edit Contact' : 'Add Contact' }}</h3>
                <p class="es-modal-sub">{{ editingContactId ? "Update this contact's details" : 'Add someone guests can reach out to' }}</p>
              </div>
              <button class="es-modal-close" @click="closeContactModal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="es-modal-body">
            <label class="es-field-label">NAME</label>
            <input v-model="contactForm.name" class="es-input" placeholder="e.g. Antidius Ruttasingwa" />

            <label class="es-field-label" style="margin-top:8px">PHONE</label>
            <input v-model="contactForm.phone" class="es-input" placeholder="e.g. 0717 329 240" />

            <label class="es-field-label" style="margin-top:8px">ROLE <span class="es-field-optional">· optional</span></label>
            <input v-model="contactForm.role" class="es-input" placeholder="e.g. Best Man, Committee Member" />
            </div>

            <div class="es-modal-actions">
              <button class="es-modal-cancel" @click="closeContactModal">Cancel</button>
              <button
                class="es-modal-save"
                :disabled="!contactForm.name.trim() || !contactForm.phone.trim() || savingContact"
                @click="saveContact"
              >
                {{ savingContact ? (editingContactId ? 'Saving…' : 'Adding…') : (editingContactId ? 'Save Changes' : 'Add Contact') }}
              </button>
            </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Publish / Unpublish dialog -->
    <Teleport to="body">
      <Transition name="es-fade">
        <div v-if="showPublishDialog" class="es-joy-overlay" @click.self="showPublishDialog = false">
          <div class="es-dialog">
            <div class="es-dialog-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <h3 class="es-dialog-title">{{ isPublished ? 'Unpublish Event?' : 'Publish Event?' }}</h3>
            <p class="es-dialog-msg">
              {{ isPublished
                  ? 'This will hide the event from end-users.'
                  : 'This will make the event visible to all users.' }}
            </p>
            <div class="es-dialog-actions">
              <button class="es-dialog-cancel" @click="showPublishDialog = false">Cancel</button>
              <button class="es-dialog-confirm" :class="{ 'es-dialog-confirm--red': isPublished }" @click="togglePublish">
                {{ isPublished ? 'Unpublish' : 'Publish' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete dialog -->
    <Teleport to="body">
      <Transition name="es-fade">
        <div v-if="showDeleteDialog" class="es-joy-overlay" @click.self="closeDeleteDialog">
          <div class="es-dialog">
            <div class="es-dialog-icon es-dialog-icon--red">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="1.8" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3 class="es-dialog-title">Delete Event</h3>
            <p class="es-dialog-msg">This is irreversible. Type <strong>"delete"</strong> below to confirm.</p>
            <input
              v-model="deleteConfirm"
              class="es-input es-input--center"
              placeholder="delete"
              @keydown.enter="deleteEvent"
            />
            <div class="es-dialog-actions">
              <button class="es-dialog-cancel" @click="closeDeleteDialog">Cancel</button>
              <button
                class="es-dialog-confirm es-dialog-confirm--red"
                :disabled="deleteConfirm !== 'delete' || deleting"
                :style="{ opacity: deleteConfirm !== 'delete' ? 0.35 : 1 }"
                @click="deleteEvent"
              >
                {{ deleting ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="es-toast">
        <div v-if="toastVisible" class="es-toast" :class="{ 'es-toast--err': toastErr }">
          <svg v-if="!toastErr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ toastMsg }}
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { db, storage } from '../../firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, setDoc, updateDoc, deleteDoc, deleteField, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useOrg } from '../../composables/useOrg.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const props = defineProps({ event: Object, eventId: String })
const route  = useRoute()
const router = useRouter()
const {
  activeOrg, isOwner, brandName, brandLogoUrl,
  approvedSenderIds, defaultSenderId: orgDefaultSenderId, setEventSenderId,
} = useOrg()
const navDrawer = useNavDrawer()

// ── SMS sender ID ──────────────────────────────────────────────────────────
// Writes immediately rather than joining the Save-button dirty set: it's a
// single discrete choice, and the callable has to validate it against the org's
// approved pool server-side anyway.
const eventSenderId  = ref(props.event?.senderId ?? null)
const savingSenderId = ref(false)
const senderIdError  = ref('')

watch(() => props.event?.senderId, (v) => { eventSenderId.value = v ?? null })

async function chooseSenderId(value) {
  if (savingSenderId.value || eventSenderId.value === (value ?? null)) return
  savingSenderId.value = true
  senderIdError.value = ''
  const previous = eventSenderId.value
  eventSenderId.value = value ?? null
  try {
    await setEventSenderId(eventId.value, value)
  } catch (e) {
    eventSenderId.value = previous
    senderIdError.value = e?.message || 'Could not change the sender ID. Try again.'
  } finally {
    savingSenderId.value = false
  }
}

const eventId = computed(() => props.eventId ?? route.params.eventId)

// ── Tabs ───────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'general',   label: 'General'   },
  { id: 'access',    label: 'Access'    },
  { id: 'locations', label: 'Venues' },
  { id: 'extras',    label: 'Extras' },
  { id: 'danger',    label: 'Danger'    },
]
const activeTab = ref('general')

// ── Dirty tracking ─────────────────────────────────────────────────────────
// The single top Save button owns the "form" fields (language, time format,
// card format, scan promo). It only lights up when one of them differs from
// what's saved, and leaving with unsaved changes prompts for confirmation.
// Locations, visibility and publishing write immediately and aren't part of
// this dirty state.
const baseline = ref({ language: 'sw', timeFormat: '12h', usePng: true, scanPromo: '', mcName: '', mcRole: '', mcBio: '', passNote: '', greetingTemplate: '' })
const isDirty = computed(() =>
  language.value !== baseline.value.language ||
  timeFormat.value !== baseline.value.timeFormat ||
  usePng.value !== baseline.value.usePng ||
  scanPromo.value.trim() !== baseline.value.scanPromo.trim() ||
  mcName.value.trim() !== baseline.value.mcName.trim() ||
  mcRole.value.trim() !== baseline.value.mcRole.trim() ||
  mcBio.value.trim() !== baseline.value.mcBio.trim() ||
  passNote.value.trim() !== baseline.value.passNote.trim() ||
  greetingTemplate.value.trim() !== baseline.value.greetingTemplate.trim()
)
function captureBaseline() {
  baseline.value = {
    language: language.value,
    timeFormat: timeFormat.value,
    usePng: usePng.value,
    scanPromo: scanPromo.value,
    mcName: mcName.value,
    mcRole: mcRole.value,
    mcBio: mcBio.value,
    passNote: passNote.value,
    greetingTemplate: greetingTemplate.value,
  }
}

// Warn on in-app navigation away with unsaved changes.
onBeforeRouteLeave(() => {
  if (isDirty.value) return window.confirm('You have unsaved changes. Leave without saving?')
})
// Warn on browser tab close / refresh with unsaved changes.
function beforeUnload(e) {
  if (isDirty.value) { e.preventDefault(); e.returnValue = '' }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

// ── Visibility (owner-only) ────────────────────────────────────────────────
// The owner controls which org members can see this event. The owner always
// sees it (bypass), so the list below is the other members. Toggling writes
// straight to the event's visibleTo array.
const visibleTo   = ref([])
const orgMembers  = ref([])   // { id, name, email } for non-owner org members
const visBusyUid  = ref(null)

async function loadOrgMembers() {
  const ownerId = activeOrg.value?.ownerId
  const ids = (activeOrg.value?.memberIds ?? []).filter(id => id !== ownerId)
  if (!ids.length) { orgMembers.value = []; return }
  const snaps = await Promise.all(ids.map(id => getDoc(doc(db, 'users', id))))
  orgMembers.value = snaps.map((s, i) => {
    const d = s.exists() ? s.data() : {}
    const name = [d.firstName, d.lastName].filter(Boolean).join(' ') || d.displayName || d.email || 'Member'
    return { id: ids[i], name, email: d.email ?? '' }
  })
}
watch(() => activeOrg.value?.memberIds?.join(','), () => { if (isOwner.value) loadOrgMembers() }, { immediate: true })

async function toggleVisibility(memberUid) {
  if (visBusyUid.value || !eventId.value) return
  const has = visibleTo.value.includes(memberUid)
  visBusyUid.value = memberUid
  // optimistic update, then persist
  visibleTo.value = has ? visibleTo.value.filter(u => u !== memberUid) : [...visibleTo.value, memberUid]
  try {
    await updateDoc(doc(db, 'events', eventId.value), {
      visibleTo: has ? arrayRemove(memberUid) : arrayUnion(memberUid),
    })
  } finally {
    visBusyUid.value = null
  }
}

// ── Settings state ─────────────────────────────────────────────────────────
const language   = ref('sw')
const timeFormat = ref('12h')
const usePng     = ref(true)
const scanPromo  = ref('')
const isPublished = ref(false)
const locations  = ref([])
const heroImageUrl     = ref('')
const heroVideoEnabled = ref(false)
const heroVideoUrl     = ref('')
const heroMusicEnabled = ref(false)
const heroMusicUrl     = ref('')
const foodBevEnabled   = ref(false)
const foodBevImage     = ref('')
const dressCodeEnabled = ref(false)
const dressCodeImage   = ref('')
const mcEnabled = ref(false)
const mcPhoto   = ref('')
const mcName    = ref('')
const mcRole    = ref('')
const mcBio     = ref('')
const contacts  = ref([])
const passNote  = ref('')
const greetingTemplate = ref('')

watch(() => props.event, (ev) => {
  if (!ev) return
  language.value    = ev.language ?? 'sw'
  timeFormat.value  = ev.timeFormat ?? '12h'
  usePng.value      = ev.usepng ?? true
  scanPromo.value   = ev.scanPromo ?? ''
  isPublished.value = (ev.status ?? 'draft').toLowerCase() === 'published'
  locations.value   = Array.isArray(ev.locations) ? [...ev.locations] : []
  contacts.value    = Array.isArray(ev.contacts) ? [...ev.contacts] : []
  visibleTo.value   = Array.isArray(ev.visibleTo) ? [...ev.visibleTo] : []
  heroImageUrl.value     = ev.heroImageUrl ?? ''
  heroVideoEnabled.value = ev.heroVideoEnabled ?? false
  heroVideoUrl.value     = ev.heroVideoUrl ?? ''
  heroMusicEnabled.value = ev.heroMusicEnabled ?? false
  heroMusicUrl.value     = ev.heroMusicUrl ?? ''
  foodBevEnabled.value   = ev.foodBeverageEnabled ?? false
  foodBevImage.value     = ev.foodBeverageImage ?? ''
  dressCodeEnabled.value = ev.dressCodeEnabled ?? false
  dressCodeImage.value   = ev.dressCodeImage ?? ''
  mcEnabled.value = ev.mcEnabled ?? false
  mcPhoto.value   = ev.mcPhoto ?? ''
  mcName.value    = ev.mcName ?? ''
  mcRole.value    = ev.mcRole ?? ''
  mcBio.value     = ev.mcBio ?? ''
  passNote.value  = ev.passNote ?? ''
  greetingTemplate.value = ev.greetingTemplate ?? ''
  captureBaseline()
}, { immediate: true })

// ── Saving flags ───────────────────────────────────────────────────────────
const saving      = ref(false)
const savingLoc   = ref(false)
const savingHeroImage = ref(false)
const savingHeroVideo = ref(false)
const savingHeroMusic = ref(false)
const savingFoodBev   = ref(false)
const savingDressCode = ref(false)
const savingMcPhoto   = ref(false)
const savingContact   = ref(false)
const deleting    = ref(false)

// ── Dialog/modal visibility ────────────────────────────────────────────────
const locationModalOpen  = ref(false)
const contactModalOpen   = ref(false)
const showPublishDialog  = ref(false)
const showDeleteDialog   = ref(false)
const deleteConfirm      = ref('')

// ── Venue (location) form ────────────────────────────────────────────────────
const editingLocId = ref(null)
const locForm = ref({ label: '', placeName: '', lat: '', lng: '', description: '', dateTime: '' })

function fmtLocDateTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-TZ', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

// ── Contacts form ─────────────────────────────────────────────────────────────
const editingContactId = ref(null)
const contactForm = ref({ name: '', phone: '', role: '' })

// ── Google Places autocomplete ─────────────────────────────────────────────
const placeSearchRef    = ref(null)
const placeQuery        = ref('')
const placeSuggestions  = ref([])
const suggestionCursor  = ref(-1)
const placesLoading     = ref(false)
let debounceTimer = null

function onPlaceInput() {
  locForm.value.placeName = ''
  locForm.value.lat = ''
  locForm.value.lng = ''
  placeSuggestions.value = []
  suggestionCursor.value = -1
  clearTimeout(debounceTimer)
  const q = placeQuery.value.trim()
  if (q.length < 2) return
  debounceTimer = setTimeout(() => fetchSuggestions(q), 280)
}

async function fetchSuggestions(q) {
  placesLoading.value = true
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': MAPS_KEY },
      body: JSON.stringify({ input: q, languageCode: 'sw' }),
    })
    const data = await res.json()
    placeSuggestions.value = (data.suggestions ?? [])
      .map(s => s.placePrediction)
      .filter(Boolean)
  } catch {
    placeSuggestions.value = []
  } finally {
    placesLoading.value = false
  }
}

async function pickSuggestion(s) {
  placeSuggestions.value = []
  placeQuery.value = s.text.text
  placesLoading.value = true
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/${s.place}?fields=location,displayName,formattedAddress`,
      { headers: { 'X-Goog-Api-Key': MAPS_KEY } }
    )
    const place = await res.json()
    locForm.value.placeName = place.formattedAddress || place.displayName?.text || s.text.text
    locForm.value.lat  = place.location?.latitude  ?? ''
    locForm.value.lng  = place.location?.longitude ?? ''
    if (!locForm.value.label.trim()) locForm.value.label = place.displayName?.text ?? ''
  } catch {
    locForm.value.placeName = s.text.text
  } finally {
    placesLoading.value = false
  }
}

function clearPlacePick() {
  placeQuery.value = ''
  locForm.value.placeName = ''
  locForm.value.lat = ''
  locForm.value.lng = ''
  placeSuggestions.value = []
  placeSearchRef.value?.focus()
}

function openLocationModal(loc = null) {
  if (loc) {
    editingLocId.value = loc.id
    locForm.value = {
      label: loc.label ?? '', placeName: loc.placeName ?? '',
      lat: loc.lat ?? '', lng: loc.lng ?? '',
      description: loc.description ?? '', dateTime: loc.dateTime ?? '',
    }
    placeQuery.value = loc.placeName ?? ''
  } else {
    editingLocId.value = null
    locForm.value = { label: '', placeName: '', lat: '', lng: '', description: '', dateTime: '' }
    placeQuery.value = ''
  }
  placeSuggestions.value = []
  locationModalOpen.value = true
}
function closeLocationModal() { locationModalOpen.value = false; placeSuggestions.value = []; editingLocId.value = null }

function openContactModal(c = null) {
  if (c) {
    editingContactId.value = c.id
    contactForm.value = { name: c.name ?? '', phone: c.phone ?? '', role: c.role ?? '' }
  } else {
    editingContactId.value = null
    contactForm.value = { name: '', phone: '', role: '' }
  }
  contactModalOpen.value = true
}
function closeContactModal() { contactModalOpen.value = false; editingContactId.value = null }

function closeDeleteDialog()  { showDeleteDialog.value = false; deleteConfirm.value = '' }

// ── Save all General fields together (single top Save button) ──────────────
async function saveSettings() {
  if (!eventId.value || !isDirty.value) return
  saving.value = true
  const trimmedPromo = scanPromo.value.trim()
  const trimmedMcName = mcName.value.trim()
  const trimmedMcRole = mcRole.value.trim()
  const trimmedMcBio  = mcBio.value.trim()
  const trimmedPassNote = passNote.value.trim()
  const trimmedGreeting = greetingTemplate.value.trim()
  try {
    await setDoc(doc(db, 'events', eventId.value), {
      language:   language.value,
      timeFormat: timeFormat.value,
      usepng:     usePng.value,
      scanPromo:  trimmedPromo.length ? trimmedPromo : deleteField(),
      mcName: trimmedMcName.length ? trimmedMcName : deleteField(),
      mcRole: trimmedMcRole.length ? trimmedMcRole : deleteField(),
      mcBio:  trimmedMcBio.length ? trimmedMcBio : deleteField(),
      passNote: trimmedPassNote.length ? trimmedPassNote : deleteField(),
      greetingTemplate: trimmedGreeting.length ? trimmedGreeting : deleteField(),
    }, { merge: true })
    captureBaseline()
    showToast('Settings saved')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    saving.value = false
  }
}

// ── Venues (event.locations) ─────────────────────────────────────────────────
async function saveVenue() {
  const label     = locForm.value.label.trim()
  const placeName = locForm.value.placeName.trim()
  if (!label || !placeName) return

  const lat = locForm.value.lat !== '' ? parseFloat(locForm.value.lat) : null
  const lng = locForm.value.lng !== '' ? parseFloat(locForm.value.lng) : null
  const hasCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)
  const description = locForm.value.description.trim()
  const dateTime = locForm.value.dateTime

  const fields = {
    label,
    placeName,
    ...(hasCoords ? {
      lat,
      lng,
      mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
    } : {}),
    ...(description ? { description } : {}),
    ...(dateTime ? { dateTime } : {}),
  }

  const updated = editingLocId.value
    ? locations.value.map(l => l.id === editingLocId.value ? { id: l.id, ...fields } : l)
    : [...locations.value, { id: Date.now().toString(), ...fields }]

  savingLoc.value = true
  try {
    await updateDoc(doc(db, 'events', eventId.value), { locations: updated })
    locations.value = updated
    closeLocationModal()
    showToast(editingLocId.value ? 'Venue updated' : 'Venue added')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    savingLoc.value = false
  }
}

async function removeLocation(loc) {
  const updated = locations.value.filter(l => l.id !== loc.id)
  try {
    await updateDoc(doc(db, 'events', eventId.value), { locations: updated })
    locations.value = updated
    showToast('Venue removed')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  }
}

// ── Contacts ────────────────────────────────────────────────────────────────
async function saveContact() {
  const name  = contactForm.value.name.trim()
  const phone = contactForm.value.phone.trim()
  if (!name || !phone) return

  const role = contactForm.value.role.trim()
  const fields = { name, phone, ...(role ? { role } : {}) }

  const updated = editingContactId.value
    ? contacts.value.map(c => c.id === editingContactId.value ? { id: c.id, ...fields } : c)
    : [...contacts.value, { id: Date.now().toString(), ...fields }]

  savingContact.value = true
  try {
    await updateDoc(doc(db, 'events', eventId.value), { contacts: updated })
    contacts.value = updated
    closeContactModal()
    showToast(editingContactId.value ? 'Contact updated' : 'Contact added')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    savingContact.value = false
  }
}

async function removeContact(c) {
  const updated = contacts.value.filter(x => x.id !== c.id)
  try {
    await updateDoc(doc(db, 'events', eventId.value), { contacts: updated })
    contacts.value = updated
    showToast('Contact removed')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  }
}

// ── Extras (food & beverages, dress code) ──────────────────────────────────
async function uploadArtwork(file, kind) {
  const sRef = storageRef(storage, `Event-Extras/${eventId.value}/${kind}_${Date.now()}_${file.name}`)
  await uploadBytes(sRef, file)
  return await getDownloadURL(sRef)
}

// ── Hero intro (cover image, video, background music) ──────────────────────
async function handleHeroImageFile(file) {
  if (!file || !file.type?.startsWith('image/')) return
  const localPreview = URL.createObjectURL(file)
  heroImageUrl.value = localPreview
  savingHeroImage.value = true
  try {
    const url = await uploadArtwork(file, 'hero-image')
    await updateDoc(doc(db, 'events', eventId.value), { heroImageUrl: url })
    heroImageUrl.value = url
    showToast('Hero cover image updated')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    savingHeroImage.value = false
    URL.revokeObjectURL(localPreview)
  }
}
function onHeroImageChange(e) { handleHeroImageFile(e.target.files[0]) }
function onHeroImageDrop(e) { handleHeroImageFile(e.dataTransfer.files[0]) }

async function toggleHeroVideo() {
  const next = !heroVideoEnabled.value
  try {
    await updateDoc(doc(db, 'events', eventId.value), { heroVideoEnabled: next })
    heroVideoEnabled.value = next
  } catch (e) {
    showToast('Error: ' + e.message, true)
  }
}
async function handleHeroVideoFile(file) {
  if (!file || !file.type?.startsWith('video/')) return
  if (file.size > 40 * 1024 * 1024) {
    showToast('Video must be under 40MB', true)
    return
  }
  const localPreview = URL.createObjectURL(file)
  heroVideoUrl.value = localPreview
  savingHeroVideo.value = true
  try {
    const url = await uploadArtwork(file, 'hero-video')
    await updateDoc(doc(db, 'events', eventId.value), { heroVideoUrl: url })
    heroVideoUrl.value = url
    showToast('Intro video updated')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    savingHeroVideo.value = false
    URL.revokeObjectURL(localPreview)
  }
}
function onHeroVideoChange(e) { handleHeroVideoFile(e.target.files[0]) }
function onHeroVideoDrop(e) { handleHeroVideoFile(e.dataTransfer.files[0]) }

async function toggleHeroMusic() {
  const next = !heroMusicEnabled.value
  try {
    await updateDoc(doc(db, 'events', eventId.value), { heroMusicEnabled: next })
    heroMusicEnabled.value = next
  } catch (e) {
    showToast('Error: ' + e.message, true)
  }
}
async function handleHeroMusicFile(file) {
  if (!file || !file.type?.startsWith('audio/')) return
  if (file.size > 15 * 1024 * 1024) {
    showToast('Audio must be under 15MB', true)
    return
  }
  savingHeroMusic.value = true
  try {
    const url = await uploadArtwork(file, 'hero-music')
    await updateDoc(doc(db, 'events', eventId.value), { heroMusicUrl: url })
    heroMusicUrl.value = url
    showToast('Background music updated')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    savingHeroMusic.value = false
  }
}
function onHeroMusicChange(e) { handleHeroMusicFile(e.target.files[0]) }
function onHeroMusicDrop(e) { handleHeroMusicFile(e.dataTransfer.files[0]) }

async function toggleFoodBev() {
  const next = !foodBevEnabled.value
  try {
    await updateDoc(doc(db, 'events', eventId.value), { foodBeverageEnabled: next })
    foodBevEnabled.value = next
  } catch (e) {
    showToast('Error: ' + e.message, true)
  }
}
async function handleFoodBevFile(file) {
  if (!file || !file.type?.startsWith('image/')) return
  const localPreview = URL.createObjectURL(file)
  foodBevImage.value = localPreview
  savingFoodBev.value = true
  try {
    const url = await uploadArtwork(file, 'food-beverage')
    await updateDoc(doc(db, 'events', eventId.value), { foodBeverageImage: url })
    foodBevImage.value = url
    showToast('Artwork updated')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    savingFoodBev.value = false
    URL.revokeObjectURL(localPreview)
  }
}
function onFoodBevChange(e) { handleFoodBevFile(e.target.files[0]) }
function onFoodBevDrop(e) { handleFoodBevFile(e.dataTransfer.files[0]) }

async function toggleDressCode() {
  const next = !dressCodeEnabled.value
  try {
    await updateDoc(doc(db, 'events', eventId.value), { dressCodeEnabled: next })
    dressCodeEnabled.value = next
  } catch (e) {
    showToast('Error: ' + e.message, true)
  }
}
async function handleDressCodeFile(file) {
  if (!file || !file.type?.startsWith('image/')) return
  const localPreview = URL.createObjectURL(file)
  dressCodeImage.value = localPreview
  savingDressCode.value = true
  try {
    const url = await uploadArtwork(file, 'dress-code')
    await updateDoc(doc(db, 'events', eventId.value), { dressCodeImage: url })
    dressCodeImage.value = url
    showToast('Artwork updated')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    savingDressCode.value = false
    URL.revokeObjectURL(localPreview)
  }
}
function onDressCodeChange(e) { handleDressCodeFile(e.target.files[0]) }
function onDressCodeDrop(e) { handleDressCodeFile(e.dataTransfer.files[0]) }

async function toggleMc() {
  const next = !mcEnabled.value
  try {
    await updateDoc(doc(db, 'events', eventId.value), { mcEnabled: next })
    mcEnabled.value = next
  } catch (e) {
    showToast('Error: ' + e.message, true)
  }
}
async function handleMcPhotoFile(file) {
  if (!file || !file.type?.startsWith('image/')) return
  const localPreview = URL.createObjectURL(file)
  mcPhoto.value = localPreview
  savingMcPhoto.value = true
  try {
    const url = await uploadArtwork(file, 'mc-photo')
    await updateDoc(doc(db, 'events', eventId.value), { mcPhoto: url })
    mcPhoto.value = url
    showToast('Photo updated')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  } finally {
    savingMcPhoto.value = false
    URL.revokeObjectURL(localPreview)
  }
}
function onMcPhotoChange(e) { handleMcPhotoFile(e.target.files[0]) }
function onMcPhotoDrop(e) { handleMcPhotoFile(e.dataTransfer.files[0]) }

// ── Visibility ─────────────────────────────────────────────────────────────
async function togglePublish() {
  showPublishDialog.value = false
  const newStatus = isPublished.value ? 'Draft' : 'Published'
  try {
    await updateDoc(doc(db, 'events', eventId.value), { status: newStatus })
    isPublished.value = !isPublished.value
    showToast(isPublished.value ? 'Event published' : 'Event set as Draft')
  } catch (e) {
    showToast('Error: ' + e.message, true)
  }
}

// ── Delete ─────────────────────────────────────────────────────────────────
async function deleteEvent() {
  if (deleteConfirm.value !== 'delete') return
  deleting.value = true
  try {
    await deleteDoc(doc(db, 'events', eventId.value))
    router.push('/events')
  } catch (e) {
    showToast('Error: ' + e.message, true)
    deleting.value = false
    closeDeleteDialog()
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────
const toastMsg     = ref('')
const toastErr     = ref(false)
const toastVisible = ref(false)
let toastTimer     = null

function showToast(msg, isErr = false) {
  toastMsg.value     = msg
  toastErr.value     = isErr
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3200)
}
</script>

<style scoped>
/* ── Root ──────────────────────────────────────────────────────────────── */
.es-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 0 64px;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --c-bg:     #ffffff;
  --c-border: #e5e7eb;
  --c-track:  #f1f3f5;
  --c-muted:  #f3f4f6;
  --c-txt:    #111827;
  --c-txt-2:  #64748b;
  --c-txt-3:  #94a3b8;
  --c-divide: #f1f3f5;
  --c-arrow:  #3a3a3a;
  transition: background 300ms ease;
}

.es-grid,
.es-col { display: contents; }

/* ── Tabbed settings layout ─────────────────────────────────────────────── */
.es-summary {
  margin: 0 0 18px;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 300ms ease, border-color 300ms ease;
}
.es-sticky-head { position: sticky; top: 0; z-index: 20; background: #fff; }
.es-hub-hd {
  display: flex; align-items: center; height: 92px; padding: 0 36px; gap: 14px;
  border-bottom: 1px solid #f1f3f5;
}
.es-hd-burger {
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid #e5e7eb; border-radius: 50%; background: #fff;
  color: #4b5563; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.es-hd-burger:hover { background: #f8fafc; color: #18181b; border-color: #d1d5db; }
.es-hd-sep { width: 1px; height: 16px; background: #e5e7eb; flex-shrink: 0; margin: 0 4px; }
.es-hd-badge {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e7eb;
  overflow: hidden; background: #fff; flex-shrink: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.es-hd-brand-logo { width: 100%; height: 100%; object-fit: cover; }
.es-hd-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-size: 18px; font-weight: 700;
  color: #111827; letter-spacing: -0.04em; line-height: 1;
}
.es-hd-title-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.es-hub-title { margin: 0; font-size: 22px; font-weight: 600; color: #18181b; letter-spacing: -0.015em; white-space: nowrap; }
.es-hub-chip {
  font-size: 12px; font-weight: 600; color: #4b5563;
  background: #f1f3f5; border-radius: 9999px; padding: 2px 10px;
}
.es-hub-chip--pub { background: #111827; color: #fff; }
.es-hd-event {
  flex: 1; min-width: 0; font-size: 13.5px; color: #64748b;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.es-tabs {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 36px; border-bottom: 1px solid #f1f3f5;
  overflow-x: auto; scrollbar-width: none;
}
.es-tabs::-webkit-scrollbar { display: none; }
.es-tab {
  min-height: 34px; padding: 6px 14px;
  border: 1px solid #e2e8f0; border-radius: 9999px; background: #fff;
  color: #475569; font-family: inherit; font-size: 13px; font-weight: 500;
  cursor: pointer; white-space: nowrap;
}
.es-tab:hover { background: #f8fafc; border-color: #cbd5e1; }
.es-tab--on { background: #f1f5f9; border-color: #cbd5e1; color: #0f172a; font-weight: 600; }
.es-tab--danger.es-tab--on { background: #fef2f2; border-color: #fecdd3; color: #9f1239; }
.es-tabpanes {
  display: flex; flex-wrap: wrap; align-items: stretch;
  gap: 16px; width: 100%; box-sizing: border-box;
  padding: 24px 36px 0;
}
.es-panel {
  flex: 1 1 480px;
  min-width: 0;
}

/* ── Panel card ─────────────────────────────────────────────────────────── */
.es-panel {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 18px 20px;
  overflow: hidden;
  transition: background 300ms ease, border-color 300ms ease;
}
.es-panel--danger {
  border-color: rgba(255,59,48,0.2);
  background: rgba(255,59,48,0.02);
}
.es-panel-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}
.es-panel-hd--flat { margin-bottom: 12px; justify-content: flex-start; }
.es-panel-hd-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

/* ── Add button ─────────────────────────────────────────────────────────── */
.es-add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #111827;
  border-radius: 9999px;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 130ms;
  flex-shrink: 0;
  white-space: nowrap;
}
.es-add-btn:hover { background: #f8fafc; }

/* ── Event summary card (right column top) ──────────────────────────────── */
.es-event-card {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 300ms ease, border-color 300ms ease;
}
.es-event-card-thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}
.es-event-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.es-event-card-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(10,10,11,0.03);
  border: 1px solid rgba(10,10,11,0.08);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.es-event-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.es-event-card-name {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--c-txt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.es-event-card-type {
  display: block;
  font-size: 11.5px;
  color: var(--c-txt-2);
}
.es-event-card-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 20px;
  padding: 4px 10px;
  flex-shrink: 0;
}
.es-status--pub  { background: rgba(52,199,89,0.1);   color: #34d399; }
.es-status--draft { background: #f3f4f6; color: #4b5563; }
.es-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.es-status--pub  .es-status-dot { background: #34C759; }
.es-status--draft .es-status-dot { background: linear-gradient(180deg, #2A2A2D 0%, #0A0A0B 100%); }

/* ── Responsive collapse ────────────────────────────────────────────────── */
@media (max-width: 680px) {
  .es-panel { flex-basis: 100%; }
}

/* ── Skeleton ──────────────────────────────────────────────────────────── */
.es-skeleton { display: flex; flex-direction: column; gap: 20px; }
.es-sk-bar {
  background: linear-gradient(90deg, var(--c-bg) 25%, var(--c-track) 50%, var(--c-bg) 75%);
  background-size: 200% 100%;
  animation: es-shimmer 1.4s infinite;
  border-radius: 8px;
}
.es-sk-bar--title { height: 28px; width: 220px; }
.es-sk-bar--sub   { height: 14px; width: 320px; }
.es-sk-bar--label { height: 11px; width: 120px; margin-bottom: 10px; }
.es-sk-tile  { height: 56px; border-radius: 14px; background: var(--c-track); }
.es-sk-section { display: flex; flex-direction: column; gap: 8px; }
@keyframes es-shimmer { 0%{background-position:200%}100%{background-position:-200%} }

/* ── Page header ───────────────────────────────────────────────────────── */
.es-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
}
.es-page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--c-txt);
  letter-spacing: -0.5px;
  margin: 0 0 4px;
}
.es-page-sub {
  font-size: 13px;
  color: var(--c-txt-2);
  margin: 0;
  line-height: 1.5;
}
.es-header-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.es-save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  color: var(--c-txt);
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 0 18px;
  height: 40px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms, border-color 150ms, color 150ms, box-shadow 150ms;
  flex-shrink: 0;
}
.es-save-btn:disabled { color: var(--c-txt-2); cursor: default; }
/* Dirty state — the button "screams" to be saved: gold fill + soft pulse. */
.es-save-btn--dirty {
  background: #111827;
  color: #ffffff;
  border-color: #111827;
}
.es-save-btn--dirty:hover { background: #000000; }
.es-save-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
@keyframes es-save-pulse {
  0%, 100% { box-shadow: 0 0 0 0 #d1d5db; }
  50%      { box-shadow: 0 0 0 6px transparent; }
}
.es-edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  color: var(--c-txt);
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 0 16px;
  height: 40px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 150ms, color 150ms;
  flex-shrink: 0;
}
.es-edit-btn:hover { background: #f8fafc; border-color: #d1d5db; }

/* ── Sections ──────────────────────────────────────────────────────────── */
.es-section {
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid #F0EFED;
}
.es-section--last { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

.es-section-hd {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}
.es-accent-bar { display: none;
  width: 3px;
  height: 34px;
  border-radius: 2px;
  background: linear-gradient(180deg, #2A2A2D 0%, #0A0A0B 100%);
  flex-shrink: 0;
  margin-top: 1px;
}
.es-accent-bar--red { background: #FF3B30; }
.es-section-meta { display: flex; flex-direction: column; gap: 3px; }
.es-section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--c-txt-2);
  letter-spacing: 1.3px;
  text-transform: uppercase;
}
.es-section-label--red { color: #FF453A; }
.es-section-hint { font-size: 12px; color: var(--c-txt-3); line-height: 1.4; }
.es-section-hint code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  padding: 1px 5px;
  background: #f3f4f6;
  border-radius: 5px;
  color: #111827;
}

/* ── SMS sender ID picker ── */
.es-sid-options { display: flex; flex-direction: column; gap: 8px; }
.es-sid-opt {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 11px 13px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color 150ms, background 150ms;
}
.es-sid-opt:hover:not(:disabled) { border-color: rgba(255,255,255,0.22); }
.es-sid-opt--on {
  border-color: #d1d5db;
  background: #f8fafc;
}
.es-sid-opt:disabled { opacity: 0.6; cursor: not-allowed; }
.es-sid-opt-val {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px; font-weight: 700; letter-spacing: 1px; color: var(--c-txt);
}
.es-sid-opt-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
  color: var(--c-txt-3); background: rgba(255,255,255,0.06);
  border-radius: 6px; padding: 3px 7px; margin-left: auto;
}
.es-sid-opt--on .es-sid-opt-tag { color: #111827; background: #e9eaee; }
.es-sid-note  { font-size: 11.5px; color: var(--c-txt-3); line-height: 1.5; margin-top: 10px; display: block; }
.es-sid-error { font-size: 12px; color: #FF453A; margin: 10px 0 0; }

/* ── Card shell ────────────────────────────────────────────────────────── */
.es-card {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
}

/* ── Action row (generic) ──────────────────────────────────────────────── */
.es-action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--c-txt);
  transition: background 300ms ease, border-color 300ms ease;
  text-align: left;
}
.es-action-row:hover { background: var(--c-bg); }

.es-action-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.es-action-icon--green { background: rgba(52,199,89,0.1); }
.es-action-label { flex: 1; }
.es-action-label--green { color: #34d399; }

/* ── Placeholder ───────────────────────────────────────────────────────── */
.es-placeholder {
  margin-top: 10px;
  padding: 20px;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  text-align: center;
  font-size: 13px;
  color: var(--c-txt-3);
  font-weight: 500;
}

/* ── Extras (food & beverages / dress code) ─────────────────────────────── */
.es-hidden { display: none; }
.es-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-top: 12px;
  font-family: inherit;
}
.es-switch-track {
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: 11px;
  background: var(--c-track);
  flex-shrink: 0;
  transition: background 150ms;
}
.es-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: transform 150ms;
}
.es-switch--on .es-switch-track { background: #111827; }
.es-switch--on .es-switch-thumb { transform: translateX(16px); }
.es-switch-label { font-size: 13px; font-weight: 600; color: var(--c-txt-2); }
.es-switch--on .es-switch-label { color: var(--c-txt); }

.es-artwork-drop {
  margin-top: 14px;
  border: 1.5px dashed var(--c-border);
  border-radius: 14px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  background: var(--c-bg);
  transition: border-color 150ms;
}
.es-artwork-drop:hover { border-color: #d1d5db; }
.es-artwork-drop--has { border-style: solid; }
.es-artwork-preview { width: 100%; height: 100%; max-height: 260px; object-fit: cover; position: absolute; inset: 0; }
.es-artwork-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; }
.es-artwork-hint { font-size: 12.5px; font-weight: 500; color: var(--c-txt-3); margin: 0; }
.es-artwork-uploading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(0,0,0,0.55);
  color: #f0f0ec;
  font-size: 12.5px;
  font-weight: 600;
}
.es-artwork-uploading--inline {
  position: static;
  inset: auto;
  background: none;
  color: var(--c-txt-3);
  justify-content: flex-start;
  margin-top: 8px;
}

/* ── Audio drop zone (background music) ─────────────────────────────────── */
.es-audio-drop {
  margin-top: 14px;
  border: 1.5px dashed var(--c-border);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background: var(--c-bg);
  transition: border-color 150ms;
  text-align: center;
}
.es-audio-drop:hover { border-color: #d1d5db; }
.es-audio-player { width: 100%; margin-top: 12px; }

/* ── Visibility list (owner-only) ──────────────────────────────────────── */
.es-vis-list { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.es-vis-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  cursor: pointer;
}
.es-vis-row--busy { opacity: 0.6; }
.es-vis-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.es-vis-name { font-size: 13px; font-weight: 600; color: var(--c-txt); }
.es-vis-email { font-size: 12px; color: var(--c-txt-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.es-vis-check { width: 17px; height: 17px; cursor: pointer; flex-shrink: 0; accent-color: #111827; }

/* ── Locations list ────────────────────────────────────────────────────── */
.es-location-list { margin-top: 10px; }
.es-location-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
}
.es-location-row--sep { border-bottom: 1px solid var(--c-divide); }
.es-location-row .es-loc-icon-wrap { margin-top: 1px; }
.es-location-row .es-loc-link,
.es-location-row .es-loc-edit,
.es-location-row .es-loc-del { margin-top: 1px; }

.es-loc-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.es-loc-info { flex: 1; min-width: 0; }
.es-loc-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-txt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.es-loc-place {
  display: block;
  font-size: 12px;
  color: var(--c-txt-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.es-loc-desc {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 11.5px;
  color: var(--c-txt-3);
  line-height: 1.4;
  margin-top: 4px;
}
.es-loc-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .2px;
  color: #111827;
}
.es-loc-link {
  display: flex;
  align-items: center;
  color: var(--c-txt-2);
  padding: 6px;
  border-radius: 7px;
  transition: color 130ms, background 130ms;
}
.es-loc-link:hover { color: #111827; background: rgba(10,10,11,0.03); }
.es-loc-del {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--c-txt-3);
  padding: 6px;
  border-radius: 7px;
  transition: color 130ms, background 130ms;
}
.es-loc-del:hover { color: #FF453A; background: rgba(255,59,48,0.07); }
.es-loc-edit {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--c-txt-3);
  padding: 6px;
  border-radius: 7px;
  transition: color 130ms, background 130ms;
}
.es-loc-edit:hover { color: #111827; background: #f3f4f6; }

/* ── Scan promo card ───────────────────────────────────────────────────── */
.es-promo-card { padding: 14px; }
.es-textarea {
  width: 100%;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13.5px;
  font-family: inherit;
  color: var(--c-txt);
  resize: vertical;
  outline: none;
  transition: border-color 150ms, background 300ms ease;
  box-sizing: border-box;
  line-height: 1.6;
}
.es-textarea:focus { border-color: #111827; background: var(--c-bg); }
.es-textarea::placeholder { color: var(--c-txt-3); }

.es-promo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  gap: 12px;
}
.es-promo-note {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--c-txt-2);
}
.es-mc-note {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--c-txt-2);
  margin: 12px 0 0;
}
.es-artwork-drop--mc { max-width: 160px; aspect-ratio: 1; min-height: 0; border-radius: 50%; }

/* ── Language radio group ──────────────────────────────────────────────── */
.es-radio-group { display: flex; flex-direction: column; }
.es-radio-sep { height: 0.8px; background: var(--c-divide); margin: 0; }
.es-radio-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background 130ms;
}
.es-radio-opt:hover { background: var(--c-bg); }
.es-radio-opt--on { background: #f7f7f8; }
.es-radio-flag { font-size: 20px; }
.es-radio-lbl {
  flex: 1;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--c-txt);
}
.es-radio-opt--on .es-radio-lbl { font-weight: 600; color: #111827; }

/* ── Card format toggle ────────────────────────────────────────────────── */
.es-toggle-group {
  display: flex;
  gap: 0;
  background: var(--c-track);
  border-radius: 12px;
  padding: 4px;
}
.es-toggle-opt {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 16px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-txt-2);
  cursor: pointer;
  font-family: inherit;
  transition: all 160ms;
}
.es-toggle-opt--on {
  background: var(--c-bg);
  color: #111827;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  border: 1px solid rgba(10,10,11,0.08);
}

/* ── Danger row ────────────────────────────────────────────────────────── */
.es-danger-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: rgba(255,59,48,0.05);
  border: 1px solid rgba(255,59,48,0.25);
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #FF453A;
  transition: background 130ms;
  text-align: left;
}
.es-danger-row:hover { background: rgba(255,59,48,0.09); }
.es-danger-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(255,59,48,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Shared inputs ─────────────────────────────────────────────────────── */
.es-input {
  width: 100%;
  padding: 11px 14px;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: var(--c-txt);
  outline: none;
  transition: border-color 150ms, background 300ms ease;
  box-sizing: border-box;
}
.es-input:focus { border-color: #111827; background: var(--c-bg); }
.es-input::placeholder { color: var(--c-txt-3); }
.es-input--center { text-align: center; }

/* ── Place search ──────────────────────────────────────────────────────── */
.es-search-wrap {
  position: relative;
}
.es-search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
.es-input--search {
  padding-left: 36px;
  padding-right: 36px;
}
.es-search-spin {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}
.es-search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--c-txt-3);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 50%;
  transition: color 130ms, background 130ms;
}
.es-search-clear:hover { color: var(--c-txt); background: rgba(255,255,255,0.08); }

.es-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.35);
  z-index: 200;
  list-style: none;
  margin: 0;
  padding: 4px;
}
.es-suggestion {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 120ms;
}
.es-suggestion:hover,
.es-suggestion--active { background: rgba(255,255,255,0.06); }
.es-suggestion-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.es-suggestion-main {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--c-txt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.es-suggestion-sub {
  font-size: 12px;
  color: var(--c-txt-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.es-picked-place {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-top: 2px;
}
.es-picked-name {
  flex: 1;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--c-txt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.es-picked-coords {
  font-size: 11px;
  color: var(--c-txt-2);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ── Overlay ──
   Also a Teleport target — same --c-* redeclaration as .es-modal-backdrop
   above, needed for .es-dialog and everything inside it to resolve colors. */
.es-joy-overlay {
  --c-bg:     #ffffff;
  --c-border: #e5e7eb;
  --c-track:  #f1f3f5;
  --c-muted:  #f3f4f6;
  --c-txt:    #111827;
  --c-txt-2:  #64748b;
  --c-txt-3:  #94a3b8;
  --c-divide: #f1f3f5;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

/* ── Add/Edit Venue side panel ──
   .es-modal-backdrop is a Teleport target (<body>), so it's no longer a
   descendant of .es-root — the --c-* tokens declared there don't cascade
   here. Redeclare them on this shared Teleport root (same fix already used
   by EventMessages.vue's .em-overlay) so every var(--c-*) inside the panel
   resolves again, instead of quietly falling back to transparent/initial. */
.es-joy-backdrop {
  --c-bg:     #ffffff;
  --c-border: #e5e7eb;
  --c-track:  #f1f3f5;
  --c-muted:  #f3f4f6;
  --c-txt:    #111827;
  --c-txt-2:  #64748b;
  --c-txt-3:  #94a3b8;
  --c-divide: #f1f3f5;
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.32);
}
.es-modal {
  --c-bg:     #ffffff;
  --c-border: #e5e7eb;
  --c-track:  #f1f3f5;
  --c-muted:  #f3f4f6;
  --c-txt:    #111827;
  --c-txt-2:  #64748b;
  --c-txt-3:  #94a3b8;
  --c-divide: #f1f3f5;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  width: 420px;
  max-width: 92vw;
  background: var(--c-bg);
  border-left: 1px solid var(--c-border);
  box-shadow: -8px 0 40px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background 300ms ease, border-color 300ms ease;
}
.es-modal-hd {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 24px 24px 18px;
  flex-shrink: 0;
}
.es-modal-ico {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  flex-shrink: 0;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}
.es-modal-hd-text { flex: 1; min-width: 0; }
.es-modal-title { font-size: 17px; font-weight: 700; color: var(--c-txt); margin: 0; }
.es-modal-sub { font-size: 12.5px; color: var(--c-txt-2); margin: 3px 0 0; }
.es-modal-close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--c-txt-2);
  transition: background 130ms;
  flex-shrink: 0;
}
.es-modal-close:hover { background: rgba(255,255,255,0.10); }
.es-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.es-modal-actions {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--c-divide);
  flex-shrink: 0;
}
.es-modal-cancel {
  flex: 1;
  padding: 11px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-txt-2);
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms;
}
.es-modal-cancel:hover { background: rgba(255,255,255,0.09); }
.es-modal-save {
  flex: 1;
  padding: 11px;
  background: #111827;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms, opacity 130ms;
}
.es-modal-save:hover:not(:disabled) { background: #000; color: #fff; }
.es-modal-save:disabled { opacity: 0.45; cursor: not-allowed; }

.es-field-label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--c-txt-2);
  letter-spacing: 1.1px;
  text-transform: uppercase;
}
.es-field-optional { font-weight: 400; text-transform: none; letter-spacing: 0; }

/* ── Small dialogs (publish / delete) ─────────────────────────────────── */
.es-dialog {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  width: 100%;
  max-width: 360px;
  padding: 28px 24px 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  transition: background 300ms ease;
}
.es-dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.es-dialog-icon--red { background: rgba(255,59,48,0.1); }
.es-dialog-title { font-size: 18px; font-weight: 700; color: var(--c-txt); margin: 0; }
.es-dialog-msg { font-size: 13.5px; color: var(--c-txt-2); margin: 0; line-height: 1.55; }
.es-dialog-msg strong { color: var(--c-txt); }
.es-dialog .es-input { margin-top: 4px; }
.es-dialog-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 6px;
}
.es-dialog-cancel {
  flex: 1;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-txt-2);
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms;
}
.es-dialog-cancel:hover { background: rgba(255,255,255,0.09); }
.es-dialog-confirm {
  flex: 1;
  padding: 12px;
  background: linear-gradient(180deg, #2A2A2D 0%, #0A0A0B 100%);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 130ms;
}
.es-dialog-confirm:not(:disabled):hover { opacity: 0.88; }
.es-dialog-confirm--red { background: #FF3B30; }
.es-dialog-confirm:disabled { cursor: not-allowed; }

/* ── Toast — also a Teleport target, same --c-bg redeclaration ── */
.es-toast {
  --c-bg: #111827;
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--c-bg);
  color: #fff;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  z-index: 10000;
  white-space: nowrap;
}
.es-toast--err { background: #FF3B30; }

/* ── Spin animation ────────────────────────────────────────────────────── */
.es-spin { animation: es-rotate 0.8s linear infinite; }
@keyframes es-rotate { to { transform: rotate(360deg); } }

/* ── Transitions ───────────────────────────────────────────────────────── */
.es-fade-enter-active, .es-fade-leave-active { transition: opacity 200ms; }
.es-fade-enter-from, .es-fade-leave-to { opacity: 0; }

.es-drawer-enter-active { transition: transform 260ms cubic-bezier(0.32,0.72,0,1); }
.es-drawer-leave-active { transition: transform 200ms cubic-bezier(0.32,0.72,0,1); }
.es-drawer-enter-from,
.es-drawer-leave-to     { transform: translateX(100%); }

.es-toast-enter-active { transition: opacity 220ms, transform 220ms cubic-bezier(0.34,1.56,0.64,1); }
.es-toast-leave-active { transition: opacity 180ms, transform 180ms; }
.es-toast-enter-from   { opacity: 0; transform: translateX(-50%) translateY(12px); }
.es-toast-leave-to     { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* ── Responsive ── */
@media (max-width: 900px) {
  .es-hub-hd { height: auto; flex-wrap: wrap; padding: 12px 16px; gap: 10px; }
  .es-hd-sep { display: none; }
  .es-hd-event { flex: 1 1 100%; order: 8; }
  .es-tabs, .es-tabpanes { padding-left: 16px; padding-right: 16px; }
  .es-page-title { font-size: 22px; }
}

@media (max-width: 780px) {
  .es-panel { flex-basis: 100%; }
}

@media (max-width: 600px) {
  .es-panel { padding: 12px; }
  .es-section-hint { overflow-wrap: break-word; word-break: break-word; }
  /* Panel header left: shrink so hint text doesn't push outside the panel */
  .es-panel-hd { gap: 8px; }
  .es-panel-hd-left { min-width: 0; }
}
</style>