<template>
  <div class="os-root">

    <!-- ── Sticky topbar ── -->
    <nav class="os-topbar">
      <div class="os-topbar-inner">
        <div class="os-brand" @click="router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="os-brand-logo" />
          <span v-else class="os-brand-script">.joy</span>
        </div>
        <div class="os-hd-sep" />
        <h1 class="os-hub-title">Organization</h1>
        <div class="os-topbar-right">
          <div class="os-admin-wrap" ref="adminWrapRef">
            <button class="os-admin-pill" @click="showAdminDropdown = !showAdminDropdown">
              <span class="os-admin-dot" />
              <!-- Role prefix is a separate span so the pill can shed it as an
                   intermediate step ("Admin · Stanley Sam" → "Stanley Sam" →
                   icon only) instead of jumping straight to no label. -->
              <span class="os-admin-label"><span class="os-admin-role">Admin · </span>{{ userDisplayName }}</span>
              <svg class="os-admin-chevron" :class="{ 'os-admin-chevron--open': showAdminDropdown }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div v-if="showAdminDropdown" class="os-admin-dropdown">
              <div class="os-dropdown-header">
                <span class="os-admin-dot os-dropdown-dot" />
                <div class="os-dropdown-header-text">
                  <span class="os-dropdown-name">{{ userDisplayName }}</span>
                  <span class="os-dropdown-email">{{ userEmail }}</span>
                </div>
              </div>
              <div class="os-dropdown-divider" />
              <button class="os-dropdown-item" @click="showAdminDropdown = false; router.push('/events')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
                My Events
              </button>
              <button class="os-dropdown-item os-dropdown-item--signout" @click="showAdminDropdown = false; showLogoutModal = true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          </div>
          <button class="os-create-btn" @click="router.push('/create-event')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span class="os-create-label">Create event</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- ── Logout confirm modal ── -->
    <div v-if="showLogoutModal" class="os-modal-backdrop" @click.self="showLogoutModal = false">
      <div class="os-modal">
        <p class="os-modal-title">Sign out?</p>
        <p class="os-modal-body">You'll need to sign back in to access your events.</p>
        <div class="os-modal-actions">
          <button class="os-modal-cancel" @click="showLogoutModal = false">Cancel</button>
          <button class="os-modal-confirm" @click="logout">Sign out</button>
        </div>
      </div>
    </div>

   <div class="os-page">

    <!-- ══ Loading ══ -->
    <div v-if="loading" class="os-empty">
      <svg class="os-spin" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#9ca3af" stroke-width="2.2" stroke-linecap="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <p>Loading organizations…</p>
    </div>

    <template v-else>

      <!-- ══ No orgs yet ══ -->
      <div v-if="!orgs.length" class="os-panel os-create-panel">
        <div class="os-empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
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

        <div class="os-tabs" role="tablist">
          <button type="button" class="os-tab" :class="{ 'os-tab--on': activeTab === 'orgs' }" @click="activeTab = 'orgs'">Organizations</button>
          <button type="button" class="os-tab" :class="{ 'os-tab--on': activeTab === 'branding' }" @click="activeTab = 'branding'">Branding</button>
          <button type="button" class="os-tab" :class="{ 'os-tab--on': activeTab === 'sender' }" @click="activeTab = 'sender'">Sender IDs</button>
          <button type="button" class="os-tab" :class="{ 'os-tab--on': activeTab === 'smsProviders' }" @click="activeTab = 'smsProviders'">SMS Providers</button>
          <button type="button" class="os-tab" :class="{ 'os-tab--on': activeTab === 'team' }" @click="activeTab = 'team'">Team</button>
        </div>

        <!-- ══ Org switcher ══ -->
        <div v-show="activeTab === 'orgs'" class="os-panel">
          <div class="os-panel-hd">
            <h2 class="os-panel-title">Your Organizations</h2>
          </div>
          <div class="os-panel-body os-switcher">
            <button
              v-for="org in activeOrgsList"
              :key="org.id"
              class="os-org-chip"
              :class="{ 'os-org-chip--active': org.id === activeOrg?.id }"
              @click="setActiveOrg(org.id)"
            >
              <span class="os-org-chip-avatar" :style="chipAvatarStyle(org)">
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

          <!-- ── Archived organizations (collapsed by default) ── -->
          <div v-if="archivedOrgsList.length" class="os-archived-disclosure">
            <button class="os-archived-toggle" @click="showArchived = !showArchived">
              <svg class="os-archived-chevron" :class="{ 'os-archived-chevron--open': showArchived }"
                width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Archived ({{ archivedOrgsList.length }})
            </button>
            <div v-if="showArchived" class="os-panel-body os-switcher os-switcher--archived">
              <button
                v-for="org in archivedOrgsList"
                :key="org.id"
                class="os-org-chip os-org-chip--archived"
                :class="{ 'os-org-chip--active': org.id === activeOrg?.id }"
                @click="setActiveOrg(org.id)"
              >
                <span class="os-org-chip-avatar" :style="chipAvatarStyle(org)">
                  <img v-if="org.logoUrl" :src="org.logoUrl" class="os-org-chip-img" />
                  <span v-else>{{ (org.name || '?')[0].toUpperCase() }}</span>
                </span>
                <span class="os-org-chip-name">{{ org.name }}</span>
                <span class="os-archived-badge">Archived</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="activeOrg" v-show="activeTab !== 'orgs'" class="os-stack">

          <!-- ══ Branding panel ══ -->
          <div v-show="activeTab === 'branding'" class="os-panel">
            <div class="os-panel-hd">
              <h2 class="os-panel-title">Branding</h2>
              <span v-if="!isOwner" class="os-readonly-badge">Read only</span>
            </div>
            <div class="os-panel-body">

              <div v-if="activeOrg.archived" class="os-archived-banner">
                <span>This organization is archived — hidden from new event creation until it's back.</span>
                <button v-if="isOwner" class="os-secondary-btn" :disabled="archiving" @click="handleUnarchive">
                  {{ archiving ? 'Unarchiving…' : 'Unarchive' }}
                </button>
              </div>

              <div v-else-if="isOwner && !isBrandingApproved" class="os-archived-banner">
                <span>Custom branding isn't enabled for this organization yet — contact support to turn it on.</span>
              </div>

              <div class="os-identity">
                <div class="os-identity-art">
                  <div class="os-image-picker" :class="{ 'os-image-picker--disabled': !canEditBranding }" @click="canEditBranding && logoInput.click()">
                    <img v-if="activeOrg.logoUrl" :src="activeOrg.logoUrl" class="os-image-preview" />
                    <span v-else class="os-image-placeholder">Logo</span>
                    <div v-if="uploadingLogo" class="os-image-overlay">
                      <svg class="os-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    </div>
                    <input ref="logoInput" type="file" accept="image/*" class="os-hidden" @change="e => onImageChange(e, 'logoUrl')" />
                  </div>
                  <span class="os-image-cap">Logo</span>
                </div>
                <div class="os-identity-art">
                  <div class="os-image-picker os-image-picker--small" :class="{ 'os-image-picker--disabled': !canEditBranding }" @click="canEditBranding && faviconInput.click()">
                    <img v-if="activeOrg.faviconUrl" :src="activeOrg.faviconUrl" class="os-image-preview" />
                    <span v-else class="os-image-placeholder">Icon</span>
                    <div v-if="uploadingFavicon" class="os-image-overlay">
                      <svg class="os-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    </div>
                    <input ref="faviconInput" type="file" accept="image/*" class="os-hidden" @change="e => onImageChange(e, 'faviconUrl')" />
                  </div>
                  <span class="os-image-cap">Favicon</span>
                </div>
                <div class="os-field os-identity-name">
                  <label class="os-field-label os-field-label--flush">Organization Name</label>
                  <input
                    v-model="nameDraft"
                    class="os-input"
                    type="text"
                    :disabled="!canEditBranding"
                    placeholder="Organization name"
                  />
                </div>
              </div>

              <div class="os-color-grid">
                <div class="os-field">
                  <label class="os-field-label os-field-label--flush">Primary Color</label>
                  <div class="os-color-row">
                    <input v-model="accentDraft" type="color" class="os-color-input" :disabled="!canEditBranding" />
                    <span class="os-color-value">{{ accentDraft }}</span>
                  </div>
                </div>
                <div class="os-field">
                  <label class="os-field-label os-field-label--flush">Secondary Color</label>
                  <div class="os-color-row">
                    <input v-model="secondaryDraft" type="color" class="os-color-input" :disabled="!canEditBranding" />
                    <span class="os-color-value">{{ secondaryDraft }}</span>
                  </div>
                </div>
              </div>

              <div class="os-advanced-hd">
                <span class="os-field-label os-field-label--flush">Surface Colors (optional)</span>
                <span class="os-advanced-hint">Leave off to keep the default light/dark look</span>
              </div>

              <label class="os-toggle-row">
                <input type="checkbox" v-model="sidebarEnabled" :disabled="!canEditBranding" />
                <span>Sidebar background</span>
              </label>
              <div v-if="sidebarEnabled" class="os-color-row">
                <input v-model="sidebarDraft" type="color" class="os-color-input" :disabled="!canEditBranding" />
                <span class="os-color-value">{{ sidebarDraft }}</span>
              </div>

              <label class="os-toggle-row">
                <input type="checkbox" v-model="topbarEnabled" :disabled="!canEditBranding" />
                <span>Topbar background</span>
              </label>
              <div v-if="topbarEnabled" class="os-color-row">
                <input v-model="topbarDraft" type="color" class="os-color-input" :disabled="!canEditBranding" />
                <span class="os-color-value">{{ topbarDraft }}</span>
              </div>

              <label class="os-toggle-row">
                <input type="checkbox" v-model="pageBgEnabled" :disabled="!canEditBranding" />
                <span>Page background</span>
              </label>
              <div v-if="pageBgEnabled" class="os-color-row">
                <input v-model="pageBgDraft" type="color" class="os-color-input" :disabled="!canEditBranding" />
                <span class="os-color-value">{{ pageBgDraft }}</span>
              </div>

              <div class="os-save-row">
                <button v-if="canEditBranding" class="os-primary-btn os-save-btn" :disabled="savingDetails" @click="saveBrandingDetails">
                  {{ savingDetails ? 'Saving…' : 'Save changes' }}
                </button>
                <span v-if="saveStatus === 'success'" class="os-save-status os-save-status--ok">✓ Saved</span>
                <span v-else-if="saveStatus === 'error'" class="os-save-status os-save-status--err">Failed to save. Try again.</span>
              </div>

              <!-- ── Danger zone ── -->
              <div v-if="isOwner && !activeOrg.archived" class="os-danger-row">
                <template v-if="confirmArchive">
                  <span class="os-del-lbl">Archive this organization? Members keep their access to view it, but it's hidden from new event creation.</span>
                  <div class="os-danger-actions">
                    <button class="os-del-yes" :disabled="archiving" @click="handleArchive">
                      {{ archiving ? 'Archiving…' : 'Yes, archive' }}
                    </button>
                    <button class="os-del-no" @click="confirmArchive = false">Cancel</button>
                  </div>
                </template>
                <button v-else class="os-danger-btn" @click="confirmArchive = true">Archive organization</button>
              </div>
            </div>
          </div>

          <!-- ══ SMS Sender IDs panel ══ -->
          <div v-show="activeTab === 'sender'" class="os-panel">
            <div class="os-panel-hd">
              <h2 class="os-panel-title">SMS Sender IDs</h2>
              <span v-if="!isOwner" class="os-readonly-badge">Read only</span>
              <span v-else-if="senderIds.length" class="os-section-cnt">{{ senderIds.length }}</span>
            </div>
            <div class="os-panel-body">

              <!-- What guests see right now -->
              <div class="os-sid-current">
                <span class="os-sid-current-lbl">
                  {{ hasCustomSenderId ? 'Events send from this by default' : 'Your guests currently see messages from' }}
                </span>
                <span class="os-sid-current-val">{{ activeSenderId }}</span>
                <span v-if="!hasCustomSenderId" class="os-sid-current-hint">
                  the shared Haflaway sender — used by every organization without an approved ID of its own
                </span>
                <span v-else class="os-sid-current-hint">
                  Any event can pick a different approved ID in its own settings.
                </span>
              </div>

              <!-- The org's IDs -->
              <div v-if="senderIds.length" class="os-sid-list">
                <div
                  v-for="sid in sortedSenderIds"
                  :key="sid.id"
                  class="os-sid-row"
                  :class="{ 'os-sid-row--muted': sid.status === 'revoked' || sid.status === 'rejected' }"
                >
                  <div class="os-sid-row-main">
                    <span class="os-sid-row-val">{{ sid.value }}</span>
                    <span class="os-sid-chip" :class="`os-sid-chip--${sid.status}`">
                      {{ sidStatusLabel(sid.status) }}
                    </span>
                    <span v-if="sid.value === defaultSenderId" class="os-sid-chip os-sid-chip--default">Default</span>
                  </div>

                  <p v-if="sid.rejectionReason" class="os-sid-row-note">{{ sid.rejectionReason }}</p>
                  <p v-else-if="sid.status === 'pending'" class="os-sid-row-note">
                    With our team for review — networks have to register it first, so this usually takes a few working days.
                  </p>

                  <div v-if="isOwner && !activeOrg.archived" class="os-sid-row-actions">
                    <button
                      v-if="sid.status === 'approved' && sid.value !== defaultSenderId"
                      class="os-secondary-btn os-sid-mini-btn"
                      :disabled="defaultingSenderId === sid.value"
                      @click="makeDefault(sid.value)"
                    >{{ defaultingSenderId === sid.value ? 'Setting…' : 'Make default' }}</button>
                    <button
                      v-if="sid.status === 'rejected' || sid.status === 'revoked'"
                      class="os-secondary-btn os-sid-mini-btn"
                      :disabled="requestingSenderId"
                      @click="senderIdDraft = sid.value; submitSenderIdRequest()"
                    >Request again</button>
                  </div>
                </div>
              </div>

              <!-- Request form -->
              <template v-if="isOwner && !activeOrg.archived">
                <label class="os-field-label">
                  {{ senderIds.length ? 'Request another sender ID' : 'Request your own sender ID' }}
                </label>
                <div class="os-search-row">
                  <input
                    v-model="senderIdDraft"
                    class="os-input os-sid-input"
                    type="text"
                    :maxlength="SENDER_ID_MAX"
                    placeholder="e.g. GUSTANZA"
                    :disabled="requestingSenderId"
                    @input="senderIdError = ''"
                    @keydown.enter="submitSenderIdRequest"
                  />
                  <button
                    class="os-primary-btn"
                    :disabled="requestingSenderId || !senderIdDraft.trim()"
                    @click="submitSenderIdRequest"
                  >{{ requestingSenderId ? 'Sending…' : 'Request' }}</button>
                </div>
                <span class="os-advanced-hint">
                  3–{{ SENDER_ID_MAX }} letters and numbers, no spaces, can't start with a number.
                  It's shown in place of a phone number on every SMS your events send.
                </span>
                <span v-if="senderIdError" class="os-search-error">{{ senderIdError }}</span>
                <span v-if="senderIdSuccess" class="os-save-status os-save-status--ok">✓ Request sent for review</span>
                <span v-if="!hasCustomSenderId && !senderIds.length" class="os-advanced-hint">
                  Your first approved ID automatically becomes the default.
                </span>
              </template>

              <div v-else-if="activeOrg.archived" class="os-archived-banner">
                <span>Unarchive this organization to request a sender ID.</span>
              </div>
            </div>
          </div>

          <!-- ══ SMS Providers panel ══ -->
          <div v-show="activeTab === 'smsProviders'" class="os-panel">
            <div class="os-panel-hd">
              <h2 class="os-panel-title">SMS Providers</h2>
              <span v-if="!isOwner" class="os-readonly-badge">Read only</span>
            </div>
            <div class="os-panel-body">

              <span class="os-advanced-hint">
                Bring your own smtz or wasambazie account for this organization's SMS. Leave either
                one unset and it sends through the shared Haflaway account instead.
              </span>

              <div v-if="!isOwner" class="os-archived-banner">
                <span>Only the organization owner can view or change SMS provider credentials.</span>
              </div>

              <template v-else>
                <!-- ── smtz ── -->
                <div class="os-provider-card">
                  <div class="os-provider-hd">
                    <span class="os-provider-name">smtz</span>
                    <span class="os-sid-chip" :class="smsCredentialsStatus.smtz?.configured ? 'os-sid-chip--approved' : 'os-sid-chip--revoked'">
                      {{ smsCredentialsStatus.smtz?.configured ? 'Configured' : 'Using shared default' }}
                    </span>
                  </div>
                  <div class="os-field">
                    <label class="os-field-label os-field-label--flush">API key</label>
                    <input
                      v-model="smtzApiKeyDraft"
                      class="os-input"
                      type="password"
                      autocomplete="off"
                      placeholder="Paste smtz API key…"
                      :disabled="!activeOrg || activeOrg.archived || savingProvider === 'smtz'"
                    />
                  </div>
                  <div class="os-save-row">
                    <button
                      class="os-primary-btn os-save-btn"
                      :disabled="!activeOrg || activeOrg.archived || savingProvider === 'smtz' || !smtzApiKeyDraft.trim()"
                      @click="saveProviderCredentials('smtz')"
                    >{{ savingProvider === 'smtz' ? 'Saving…' : 'Save' }}</button>
                    <button
                      v-if="smsCredentialsStatus.smtz?.configured"
                      class="os-secondary-btn"
                      :disabled="!activeOrg || activeOrg.archived || clearingProvider === 'smtz'"
                      @click="clearProviderCredentials('smtz')"
                    >{{ clearingProvider === 'smtz' ? 'Resetting…' : 'Reset to default' }}</button>
                    <span v-if="providerStatus.smtz === 'success'" class="os-save-status os-save-status--ok">✓ Saved</span>
                    <span v-else-if="providerStatus.smtz === 'error'" class="os-save-status os-save-status--err">{{ providerError.smtz || 'Failed to save. Try again.' }}</span>
                  </div>
                </div>

                <!-- ── wasambazie ── -->
                <div class="os-provider-card">
                  <div class="os-provider-hd">
                    <span class="os-provider-name">wasambazie</span>
                    <span class="os-sid-chip" :class="smsCredentialsStatus.wasambazie?.configured ? 'os-sid-chip--approved' : 'os-sid-chip--revoked'">
                      {{ smsCredentialsStatus.wasambazie?.configured ? 'Configured' : 'Using shared default' }}
                    </span>
                  </div>
                  <div class="os-field">
                    <label class="os-field-label os-field-label--flush">Public key</label>
                    <input
                      v-model="wasambaziePublicKeyDraft"
                      class="os-input"
                      type="password"
                      autocomplete="off"
                      placeholder="Paste wasambazie public key…"
                      :disabled="!activeOrg || activeOrg.archived || savingProvider === 'wasambazie'"
                    />
                  </div>
                  <div class="os-field">
                    <label class="os-field-label os-field-label--flush">Secret key</label>
                    <input
                      v-model="wasambazieSecretKeyDraft"
                      class="os-input"
                      type="password"
                      autocomplete="off"
                      placeholder="Paste wasambazie secret key…"
                      :disabled="!activeOrg || activeOrg.archived || savingProvider === 'wasambazie'"
                    />
                  </div>
                  <div class="os-save-row">
                    <button
                      class="os-primary-btn os-save-btn"
                      :disabled="!activeOrg || activeOrg.archived || savingProvider === 'wasambazie' || !wasambaziePublicKeyDraft.trim() || !wasambazieSecretKeyDraft.trim()"
                      @click="saveProviderCredentials('wasambazie')"
                    >{{ savingProvider === 'wasambazie' ? 'Saving…' : 'Save' }}</button>
                    <button
                      v-if="smsCredentialsStatus.wasambazie?.configured"
                      class="os-secondary-btn"
                      :disabled="!activeOrg || activeOrg.archived || clearingProvider === 'wasambazie'"
                      @click="clearProviderCredentials('wasambazie')"
                    >{{ clearingProvider === 'wasambazie' ? 'Resetting…' : 'Reset to default' }}</button>
                    <span v-if="providerStatus.wasambazie === 'success'" class="os-save-status os-save-status--ok">✓ Saved</span>
                    <span v-else-if="providerStatus.wasambazie === 'error'" class="os-save-status os-save-status--err">{{ providerError.wasambazie || 'Failed to save. Try again.' }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- ══ Team panel ══ -->
          <div v-show="activeTab === 'team'" class="os-panel">
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
                    <template v-else>
                      <button
                        class="os-perm-toggle"
                        :class="{ 'os-perm-toggle--on': memberCan(uid, 'canCreate') }"
                        :disabled="permBusyUid === uid"
                        :title="memberCan(uid, 'canCreate') ? 'Can create events (spends org balance) — click to revoke' : 'Cannot create events — click to allow'"
                        @click="toggleCanCreate(uid)"
                      >
                        <span class="os-perm-dot" />
                        {{ memberCan(uid, 'canCreate') ? 'Can create' : 'View only' }}
                      </button>
                      <button class="os-remove-btn" title="Remove" @click="confirmRemove = uid">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </template>
                  </template>
                </div>
              </div>

              <!-- ── Leave (non-owner members only) ── -->
              <div v-if="!isOwner" class="os-danger-row">
                <template v-if="confirmLeave">
                  <span class="os-del-lbl">Leave {{ activeOrg.name }}? You'll lose access to its events and branding.</span>
                  <div class="os-danger-actions">
                    <button class="os-del-yes" :disabled="leaving" @click="handleLeave">
                      {{ leaving ? 'Leaving…' : 'Yes, leave' }}
                    </button>
                    <button class="os-del-no" @click="confirmLeave = false">Cancel</button>
                  </div>
                </template>
                <button v-else class="os-danger-btn" @click="confirmLeave = true">Leave organization</button>
              </div>

            </div>
          </div>

        </div>
      </template>
    </template>
   </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db, storage, auth } from '../firebase'
import { signOut } from 'firebase/auth'
import {
  doc, getDoc, getDocs, collection, query, where, limit,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useOrg, contrastColor, DEFAULT_ACCENT, DEFAULT_SECONDARY, DEFAULT_SENDER_ID } from '../composables/useOrg.js'

const router = useRouter()

const {
  currentUser, orgs, activeOrg, isOwner, isBrandingApproved, brandName, brandLogoUrl, loading,
  setActiveOrg, createOrg, updateBranding, addMember, removeMember,
  archiveOrg, unarchiveOrg, leaveOrg, memberCan, setMemberPermission,
  senderIds, defaultSenderId, activeSenderId, hasCustomSenderId,
  requestSenderId, setDefaultSenderId,
  smsCredentialsStatus, loadSmsCredentialsStatus, setSmsCredentials, clearSmsCredentials,
} = useOrg()

const activeOrgsList = computed(() => orgs.value.filter(o => !o.archived))
const archivedOrgsList = computed(() => orgs.value.filter(o => o.archived))
const canEditBranding = computed(() =>
  isOwner.value && !activeOrg.value?.archived && isBrandingApproved.value
)

// ── Topbar ───────────────────────────────────────────────────────────────────
const showLogoutModal = ref(false)
const showAdminDropdown = ref(false)
const adminWrapRef = ref(null)

const userDisplayName = computed(() => {
  const u = auth.currentUser
  if (!u) return 'Admin'
  return u.displayName || u.email?.split('@')[0] || 'Admin'
})
const userEmail = computed(() => auth.currentUser?.email ?? '')

function onClickOutside(e) {
  if (adminWrapRef.value && !adminWrapRef.value.contains(e.target)) {
    showAdminDropdown.value = false
  }
}

async function logout() {
  showLogoutModal.value = false
  await signOut(auth)
  router.push('/login')
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
const showArchived = ref(false)
const activeTab = ref('branding')

// ── Create org ───────────────────────────────────────────────────────────────
const newOrgName = ref('')
const creatingOrg = ref(false)

async function handleCreateOrg() {
  if (!newOrgName.value.trim() || creatingOrg.value) return
  creatingOrg.value = true
  try {
    await createOrg(newOrgName.value.trim())
    newOrgName.value = ''
    activeTab.value = 'branding'
  } finally {
    creatingOrg.value = false
  }
}

// ── Archive / unarchive / leave ───────────────────────────────────────────────
const archiving = ref(false)
const confirmArchive = ref(false)
const leaving = ref(false)
const confirmLeave = ref(false)

async function handleArchive() {
  if (!activeOrg.value || archiving.value) return
  archiving.value = true
  try {
    await archiveOrg(activeOrg.value.id)
    confirmArchive.value = false
  } finally {
    archiving.value = false
  }
}

async function handleUnarchive() {
  if (!activeOrg.value || archiving.value) return
  archiving.value = true
  try {
    await unarchiveOrg(activeOrg.value.id)
  } finally {
    archiving.value = false
  }
}

async function handleLeave() {
  if (!activeOrg.value || leaving.value) return
  leaving.value = true
  try {
    await leaveOrg(activeOrg.value.id)
    confirmLeave.value = false
  } finally {
    leaving.value = false
  }
}

// ── SMS sender IDs ───────────────────────────────────────────────────────────
const SENDER_ID_MAX = 11
const senderIdDraft = ref('')
const senderIdError = ref('')
const senderIdSuccess = ref(false)
const requestingSenderId = ref(false)
const defaultingSenderId = ref(null)

const SID_STATUS_LABELS = {
  pending:  'Pending review',
  approved: 'Approved',
  rejected: 'Not approved',
  revoked:  'Removed',
}
const sidStatusLabel = (s) => SID_STATUS_LABELS[s] ?? s

// Usable IDs first, then the ones that are only history — an owner scanning
// this list cares about what can send today, not what once could.
const SID_ORDER = { approved: 0, pending: 1, rejected: 2, revoked: 3 }
const sortedSenderIds = computed(() =>
  [...senderIds.value].sort((a, b) =>
    (SID_ORDER[a.status] ?? 9) - (SID_ORDER[b.status] ?? 9) ||
    String(a.value).localeCompare(String(b.value))
  )
)

async function makeDefault(value) {
  if (defaultingSenderId.value || !activeOrg.value) return
  defaultingSenderId.value = value
  senderIdError.value = ''
  try {
    await setDefaultSenderId(activeOrg.value.id, value)
  } catch (e) {
    senderIdError.value = e?.message || 'Could not change the default. Try again.'
  } finally {
    defaultingSenderId.value = null
  }
}

// Switching orgs must not carry one org's draft (or another's error) over.
watch(() => activeOrg.value?.id, () => {
  senderIdDraft.value = ''
  senderIdError.value = ''
  senderIdSuccess.value = false
})

async function submitSenderIdRequest() {
  if (requestingSenderId.value || !activeOrg.value) return
  const value = senderIdDraft.value.trim()
  if (!value) return

  requestingSenderId.value = true
  senderIdError.value = ''
  senderIdSuccess.value = false
  try {
    await requestSenderId(activeOrg.value.id, value)
    senderIdDraft.value = ''
    senderIdSuccess.value = true
  } catch (e) {
    // The callable re-validates and returns the human-readable rule it failed,
    // so surface its message rather than a generic failure line.
    senderIdError.value = e?.message || 'Could not send that request. Try again.'
  } finally {
    requestingSenderId.value = false
  }
}

// ── SMS provider credentials (smtz / wasambazie) ─────────────────────────────
const smtzApiKeyDraft = ref('')
const wasambaziePublicKeyDraft = ref('')
const wasambazieSecretKeyDraft = ref('')
const savingProvider = ref(null) // null | 'smtz' | 'wasambazie'
const clearingProvider = ref(null)
const providerStatus = ref({ smtz: '', wasambazie: '' }) // '' | 'success' | 'error'
const providerError = ref({ smtz: '', wasambazie: '' })
let providerStatusTimers = { smtz: null, wasambazie: null }

// Status (configured or not) is fetched on demand, not via a live listener —
// the secret values themselves never come back to the client once saved, so
// there's nothing to subscribe to beyond this boolean.
watch(() => activeOrg.value?.id, (orgId) => {
  smtzApiKeyDraft.value = ''
  wasambaziePublicKeyDraft.value = ''
  wasambazieSecretKeyDraft.value = ''
  providerStatus.value = { smtz: '', wasambazie: '' }
  providerError.value = { smtz: '', wasambazie: '' }
  if (orgId && isOwner.value) loadSmsCredentialsStatus(orgId)
}, { immediate: true })

function flashProviderStatus(provider, kind) {
  clearTimeout(providerStatusTimers[provider])
  providerStatus.value = { ...providerStatus.value, [provider]: kind }
  providerStatusTimers[provider] = setTimeout(() => {
    providerStatus.value = { ...providerStatus.value, [provider]: '' }
  }, 3000)
}

async function saveProviderCredentials(provider) {
  if (!activeOrg.value || savingProvider.value) return
  const credentials = provider === 'smtz'
    ? { apiKey: smtzApiKeyDraft.value.trim() }
    : { publicKey: wasambaziePublicKeyDraft.value.trim(), secretKey: wasambazieSecretKeyDraft.value.trim() }

  savingProvider.value = provider
  providerError.value = { ...providerError.value, [provider]: '' }
  try {
    await setSmsCredentials(activeOrg.value.id, provider, credentials)
    if (provider === 'smtz') smtzApiKeyDraft.value = ''
    else { wasambaziePublicKeyDraft.value = ''; wasambazieSecretKeyDraft.value = '' }
    flashProviderStatus(provider, 'success')
  } catch (e) {
    providerError.value = { ...providerError.value, [provider]: e?.message || 'Failed to save. Try again.' }
    flashProviderStatus(provider, 'error')
  } finally {
    savingProvider.value = null
  }
}

async function clearProviderCredentials(provider) {
  if (!activeOrg.value || clearingProvider.value) return
  clearingProvider.value = provider
  providerError.value = { ...providerError.value, [provider]: '' }
  try {
    await clearSmsCredentials(activeOrg.value.id, provider)
    flashProviderStatus(provider, 'success')
  } catch (e) {
    providerError.value = { ...providerError.value, [provider]: e?.message || 'Failed to reset. Try again.' }
    flashProviderStatus(provider, 'error')
  } finally {
    clearingProvider.value = null
  }
}

// ── Branding ─────────────────────────────────────────────────────────────────
const nameDraft = ref('')
const accentDraft = ref(DEFAULT_ACCENT)
const secondaryDraft = ref(DEFAULT_SECONDARY)
const DEFAULT_SIDEBAR = '#111111'
const DEFAULT_TOPBAR = '#111111'
const DEFAULT_PAGE_BG = '#0a0a0b'
const sidebarEnabled = ref(false)
const sidebarDraft = ref(DEFAULT_SIDEBAR)
const topbarEnabled = ref(false)
const topbarDraft = ref(DEFAULT_TOPBAR)
const pageBgEnabled = ref(false)
const pageBgDraft = ref(DEFAULT_PAGE_BG)
const savingDetails = ref(false)
const saveStatus = ref('') // '' | 'success' | 'error'
let saveStatusTimer = null
const uploadingLogo = ref(false)
const uploadingFavicon = ref(false)
const logoInput = ref(null)
const faviconInput = ref(null)

watch(activeOrg, (org) => {
  nameDraft.value = org?.name ?? ''
  accentDraft.value = org?.accentColor ?? DEFAULT_ACCENT
  secondaryDraft.value = org?.secondaryColor ?? DEFAULT_SECONDARY
  sidebarEnabled.value = !!org?.sidebarColor
  sidebarDraft.value = org?.sidebarColor || DEFAULT_SIDEBAR
  topbarEnabled.value = !!org?.topbarColor
  topbarDraft.value = org?.topbarColor || DEFAULT_TOPBAR
  pageBgEnabled.value = !!org?.pageBackgroundColor
  pageBgDraft.value = org?.pageBackgroundColor || DEFAULT_PAGE_BG
}, { immediate: true })

async function saveBrandingDetails() {
  if (!activeOrg.value || !canEditBranding.value) return
  savingDetails.value = true
  clearTimeout(saveStatusTimer)
  saveStatus.value = ''
  try {
    await updateBranding(activeOrg.value.id, {
      name: nameDraft.value.trim(),
      accentColor: accentDraft.value,
      secondaryColor: secondaryDraft.value,
      sidebarColor: sidebarEnabled.value ? sidebarDraft.value : '',
      topbarColor: topbarEnabled.value ? topbarDraft.value : '',
      pageBackgroundColor: pageBgEnabled.value ? pageBgDraft.value : '',
    })
    saveStatus.value = 'success'
  } catch (e) {
    saveStatus.value = 'error'
  } finally {
    savingDetails.value = false
    saveStatusTimer = setTimeout(() => { saveStatus.value = '' }, 3000)
  }
}

async function onImageChange(e, field) {
  const file = e.target.files[0]
  if (!file || !activeOrg.value || !canEditBranding.value) return
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

// Owner-only: grant/revoke a member's permission to create events (which draws
// on the org's wallet balance).
const permBusyUid = ref(null)
async function toggleCanCreate(uid) {
  if (permBusyUid.value || !activeOrg.value) return
  permBusyUid.value = uid
  try {
    await setMemberPermission(activeOrg.value.id, uid, 'canCreate', !memberCan(uid, 'canCreate'))
  } finally {
    permBusyUid.value = null
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function chipAvatarStyle(org) {
  const primary = org.accentColor || DEFAULT_ACCENT
  const secondary = org.secondaryColor || DEFAULT_SECONDARY
  return {
    background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    color: contrastColor(primary),
  }
}
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
  --os-page-bg: #ffffff;
  --c-bg: #ffffff;
  --c-border: #e5e7eb;
  --c-track: #f3f4f6;
  --c-txt: #111827;
  --c-txt-2: #64748b;
  --c-txt-3: #94a3b8;
  --ink: #111827;
  --ink-soft: #374151;
  --ink-muted: #64748b;
  --ink-dim: #94a3b8;
  --line: #e5e7eb;
  --line-soft: #f1f3f5;
  --line-strong: #d1d5db;
  --paper-soft: #f8fafc;
  --emerald: #059669;
  --emerald-soft: #ecfdf5;
  --os-topbar-bg: #ffffff;
  --os-dropdown-bg: #ffffff;
}
.os-root::before,
.os-root::after { display: none; }

.os-page {
  max-width: none;
  width: 100%;
  margin: 0;
  padding: 0 0 64px;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-sizing: border-box;
}
.os-tabs {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 36px; border-bottom: 1px solid #f1f3f5; background: #fff;
}
.os-tab {
  min-height: 34px; padding: 6px 14px;
  border: 1px solid #e2e8f0; border-radius: 9999px; background: #fff;
  color: #475569; font-family: inherit; font-size: 13px; font-weight: 500;
  cursor: pointer; white-space: nowrap;
}
.os-tab:hover { background: #f8fafc; border-color: #cbd5e1; }
.os-tab--on { background: #f1f5f9; border-color: #cbd5e1; color: #0f172a; font-weight: 600; }
.os-stack { display: flex; flex-direction: column; padding: 20px 36px 0; }
.os-page > .os-panel,
.os-page > .os-empty { margin: 20px 36px 0; }
.os-page-header { display: none; }

.os-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: #fff;
}
.os-topbar-inner {
  height: 92px;
  padding: 0 36px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: 0;
  background: #fff;
  border: none;
  border-bottom: 1px solid #f1f3f5;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.os-topbar-inner:hover {
  background: #fff;
  border-color: #f1f3f5;
  box-shadow: none;
}
.os-hd-sep { width: 1px; height: 16px; background: #e5e7eb; flex-shrink: 0; margin: 0 4px; }
.os-hub-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #18181b;
  letter-spacing: -0.015em;
  white-space: nowrap;
  font-family: inherit;
}
.os-hub-sub { display: none; }
.os-brand {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e5e7eb;
  overflow: hidden; background: #fff; flex-shrink: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center; min-width: 34px; gap: 0;
}
.os-brand-logo { width: 100%; height: 100%; border-radius: 0; object-fit: cover; }
.os-brand-script {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic; font-size: 18px; font-weight: 700;
  color: #111827; letter-spacing: -0.04em; line-height: 1;
}
.os-brand-name { display: none; }
.os-topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-left: auto; }

.os-admin-wrap { position: relative; }
.os-admin-pill {
  display: flex; align-items: center; gap: 7px;
  height: 40px; padding: 0 14px 0 12px;
  border-radius: 9999px; border: 1px solid #e5e7eb; background: #fff;
  font-size: 13px; font-weight: 500; color: #374151;
  cursor: pointer; font-family: inherit;
}
.os-admin-pill:hover { background: #f8fafc; color: #111827; border-color: #d1d5db; }
.os-admin-chevron { color: #94a3b8; transition: transform 180ms ease; flex-shrink: 0; }
.os-admin-chevron--open { transform: rotate(180deg); }
.os-admin-label { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.os-admin-dot { width: 7px; height: 7px; border-radius: 50%; background: #059669; flex-shrink: 0; }

.os-admin-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0; min-width: 210px;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.12); overflow: hidden; z-index: 200;
}
.os-dropdown-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; }
.os-dropdown-dot { flex-shrink: 0; }
.os-dropdown-header-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.os-dropdown-name { font-size: 13px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.os-dropdown-email { font-size: 11.5px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.os-dropdown-divider { height: 1px; background: #f1f3f5; }
.os-dropdown-item {
  display: flex; align-items: center; gap: 9px; width: 100%; padding: 11px 16px;
  background: transparent; border: none; font-size: 13px; font-weight: 500;
  color: #64748b; cursor: pointer; font-family: inherit; text-align: left;
}
.os-dropdown-item:hover { background: #f8fafc; color: #111827; }
.os-dropdown-item--signout:hover { background: #fef2f2; color: #dc2626; }

.os-create-btn {
  display: flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 20px; border: none; border-radius: 9999px;
  background: #222; color: #fff; font-size: 13.5px; font-weight: 600;
  white-space: nowrap; flex-shrink: 0; cursor: pointer; font-family: inherit;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
.os-create-btn:hover { background: #000; opacity: 1; }
.os-create-label { white-space: nowrap; }


/* ── Logout confirm modal ── */
.os-modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.os-modal {
  background: var(--os-dropdown-bg);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 28px 28px 24px;
  width: 340px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.2), 0 16px 40px rgba(0,0,0,0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: background 300ms ease, border-color 300ms ease;
}
.os-modal-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 22px;
  font-weight: 400;
  color: var(--ink);
  margin: 0;
  letter-spacing: -0.1px;
}
.os-modal-body { font-size: 13.5px; color: var(--ink-muted); margin: 0 0 8px; line-height: 1.5; }
.os-modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.os-modal-backdrop { background: rgba(15, 23, 42, 0.32); }
.os-modal {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
}
.os-modal-cancel {
  background: #fff; border: 1px solid #e5e7eb; color: #111827;
  height: 40px; padding: 0 18px; border-radius: 9999px;
  font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.os-modal-cancel:hover { background: #f8fafc; }
.os-modal-confirm {
  background: #dc2626; color: #fff;
  border: none; height: 40px; padding: 0 18px; border-radius: 9999px;
  font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: opacity 130ms;
}
.os-modal-confirm:hover { opacity: 0.85; }

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

.os-stack {
  display: flex;
  flex-direction: column;
  padding: 20px 36px 0;
}
.os-grid { display: contents; }

.os-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: none;
}
.os-panel-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid #f1f3f5;
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
  font-size: 11px; font-weight: 600; color: #64748b;
  background: #f3f4f6; border-radius: 9999px; padding: 3px 9px;
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
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: none;
}
.os-create-row .os-input { min-width: 0; }
.os-create-row--inline { max-width: none; margin-top: 0; padding-top: 0; }

.os-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-top: 6px;
}

.os-primary-btn {
  height: 46px; padding: 0 18px;
  background: #222; color: #fff; border: none; border-radius: 9999px;
  font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; font-family: inherit;
}
.os-primary-btn:hover:not(:disabled) { background: #000; }
.os-primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.os-secondary-btn {
  height: 46px; padding: 0 16px;
  background: #fff; border: 1px solid #e5e7eb; color: #111827;
  border-radius: 9999px; font-size: 13.5px; font-weight: 600;
  cursor: pointer; white-space: nowrap; font-family: inherit;
}
.os-secondary-btn:hover:not(:disabled) { background: #f8fafc; border-color: #d1d5db; }
.os-secondary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.os-save-row { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
.os-save-btn { align-self: flex-start; margin-top: 0; }
.os-save-status { font-size: 12px; font-weight: 600; }
.os-save-status--ok { color: #065f46; }
.os-save-status--err { color: #FF453A; }

.os-switcher { flex-direction: row; flex-wrap: wrap; gap: 8px; }
.os-org-chip {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 9999px;
  padding: 6px 12px 6px 6px; cursor: pointer; font-family: inherit;
  min-width: 0; max-width: 100%;
}
.os-org-chip:hover:not(.os-org-chip--active) { background: #f8fafc; border-color: #d1d5db; }
.os-org-chip--active { border-color: #cbd5e1; background: #f1f5f9; }
.os-org-chip-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  overflow: hidden;
}
.os-org-chip-img { width: 100%; height: 100%; object-fit: cover; }
.os-org-chip-name {
  font-size: 13px; font-weight: 600; color: var(--c-txt);
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.os-owner-badge {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  color: #111827; background: #f3f4f6; border-radius: 9999px; padding: 2px 8px;
}
.os-archived-badge {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  color: #64748b; background: #f3f4f6; border-radius: 9999px; padding: 2px 8px;
}
.os-org-chip--archived { opacity: 0.55; }
.os-org-chip--archived.os-org-chip--active { opacity: 0.85; }

.os-archived-disclosure { border-top: 1px solid var(--c-border); }
.os-archived-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  background: none;
  border: none;
  padding: 10px 18px;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-txt-3);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}
.os-archived-toggle:hover { color: var(--c-txt-2); }
.os-archived-chevron { flex-shrink: 0; transition: transform 150ms; }
.os-archived-chevron--open { transform: rotate(90deg); }
.os-switcher--archived { padding-top: 0; }

.os-archived-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--c-txt-2);
  margin-bottom: 4px;
}

.os-danger-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--c-border);
}
.os-danger-actions { display: flex; gap: 8px; }
.os-danger-btn {
  background: none;
  border: none;
  color: #FF453A;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.os-danger-btn:hover { text-decoration: underline; }

.os-identity {
  display: grid;
  grid-template-columns: 88px 72px minmax(0, 1fr);
  align-items: end;
  gap: 16px;
}
.os-identity-art { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.os-image-cap { font-size: 11px; font-weight: 600; color: #64748b; }
.os-identity-name { min-width: 0; }
.os-field { display: flex; flex-direction: column; gap: 6px; }
.os-color-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.os-brand-row { display: none; }
.os-image-picker {
  width: 88px; height: 88px;
  border: 1px dashed #d1d5db;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: #f8fafc;
}
.os-image-picker--small { width: 72px; height: 72px; border-radius: 16px; }
.os-image-picker--disabled { cursor: not-allowed; opacity: 0.6; }
.os-image-preview { width: 100%; height: 100%; object-fit: cover; }
.os-image-placeholder { font-size: 11px; color: var(--c-txt-3); }
.os-image-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
}
.os-hidden { display: none; }

.os-color-row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 46px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #fff;
  box-sizing: border-box;
}
.os-color-input {
  width: 36px; height: 36px;
  border: 1px solid #e5e7eb; border-radius: 50%;
  background: none; cursor: pointer;
  padding: 0; overflow: hidden;
  flex-shrink: 0;
}
.os-color-input::-webkit-color-swatch-wrapper { padding: 0; }
.os-color-input::-webkit-color-swatch { border: none; border-radius: 50%; }
.os-color-value { font-size: 14px; color: #374151; font-family: 'JetBrains Mono', monospace; }

.os-advanced-hd {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--c-border);
}
.os-field-label--flush { margin-top: 0; }
.os-advanced-hint { font-size: 11px; color: var(--c-txt-3); }

.os-toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--c-txt);
  cursor: pointer;
}
.os-toggle-row input[type="checkbox"] { cursor: pointer; }

/* ── SMS sender ID ── */
.os-sid-current {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f8fafc;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 12px 14px;
}
.os-sid-current-lbl  { font-size: 11.5px; color: var(--c-txt-3); }
.os-sid-current-val {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.os-sid-current-hint { font-size: 11.5px; color: var(--c-txt-3); line-height: 1.5; }

.os-sid-list { display: flex; flex-direction: column; gap: 8px; }
.os-sid-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 10px 12px;
}
.os-sid-row--muted { opacity: 0.7; }
.os-sid-row-main { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.os-sid-row-val {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 15px; font-weight: 700; letter-spacing: 1px; color: var(--c-txt);
}
.os-sid-row-note { font-size: 11.5px; color: var(--c-txt-3); margin: 0; line-height: 1.5; }
.os-sid-row-actions { display: flex; gap: 8px; }
.os-sid-mini-btn { padding: 5px 10px; font-size: 11.5px; align-self: flex-start; }

.os-sid-chip {
  font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
  text-transform: uppercase; border-radius: 6px; padding: 3px 7px;
}
.os-sid-chip--approved { color: #065f46; background: #ecfdf5; }
.os-sid-chip--pending  { color: #FF9F0A; background: rgba(255,159,10,0.12); }
.os-sid-chip--rejected { color: #FF453A; background: rgba(255,69,58,0.12); }
.os-sid-chip--revoked  { color: #64748b; background: #f3f4f6; }
.os-sid-chip--default  { color: #111827; background: #f3f4f6; }

.os-sid-input {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* ── SMS provider credentials ── */
.os-provider-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fff;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 14px;
}
.os-provider-hd { display: flex; align-items: center; gap: 8px; }
.os-provider-name {
  font-size: 13px; font-weight: 700; color: var(--c-txt);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.os-section-lbl { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
.os-search-row { display: flex; align-items: center; gap: 10px; }
.os-search-row .os-input { min-width: 0; flex: 1; }
.os-search-error { font-size: 12px; color: #FF453A; }

.os-member-list { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.os-member-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
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
  background: #111827; color: #fff;
  border: none; border-radius: 9999px; padding: 6px 14px;
  font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
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

/* Per-member "can create events" toggle (owner-only) */
.os-perm-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid var(--c-border);
  color: var(--c-txt-3);
  border-radius: 20px;
  padding: 5px 11px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 130ms, color 130ms, border-color 130ms;
}
.os-perm-toggle:disabled { opacity: 0.6; cursor: not-allowed; }
.os-perm-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-txt-3); flex-shrink: 0; }
.os-perm-toggle--on {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}
.os-perm-toggle--on .os-perm-dot { background: #111827; }

/* ── Responsive topbar ──────────────────────────────────────────────────────
   Same ladder as MyEvents.vue: the bar sheds text in priority order as width
   runs out — wordmark, then the admin pill's label, then the create button's
   label — so controls keep their tap targets instead of being squeezed. ── */
@media (max-width: 860px) {
  .os-topbar-inner { height: auto; flex-wrap: wrap; padding: 12px 16px; }
  .os-hd-sep { display: none; }
  .os-tabs, .os-stack { padding-left: 16px; padding-right: 16px; }
  .os-page > .os-panel, .os-page > .os-empty { margin-left: 16px; margin-right: 16px; }
  .os-identity { grid-template-columns: 88px 72px 1fr; }
  .os-color-grid { grid-template-columns: 1fr; }
}

/* Wordmark first — decorative, and the logo still links to /. */
@media (max-width: 740px) {
  .os-brand-name { display: none; }
}

@media (max-width: 640px) {
  .os-topbar { padding: 0; }
  .os-topbar-inner { padding: 12px 16px; }
  .os-page { padding: 16px 16px 48px; gap: 16px; }
  .os-admin-dropdown { top: 92px; }
  /* The dropdown is right:0-anchored to its trigger, but the trigger isn't the
     rightmost element (theme toggle and create button follow it) — at narrow
     widths that pushed the 210px panel's left edge off-screen. Anchor it to the
     viewport instead once space is tight. */
  /* Clears the floating capsule: 16px sticky offset + 12/12 padding + 34px
     control height + borders ≈ 76px, so 84px leaves a visible gap under it. */
  .os-admin-dropdown {
    position: fixed;
    top: 84px;
    left: 12px;
    right: 12px;
    min-width: 0;
    width: auto;
  }
  .os-page-title { font-size: 27px; }
}

/* ── Phone content reflow ──
   430px rather than 400 so it covers the common large phones (Pixel 412,
   iPhone Pro Max 428), not just the narrow ones. Below this the side-by-side
   rows stop fitting and start crushing their own contents. ── */
@media (max-width: 430px) {
  .os-panel-body { padding: 14px; }
  .os-panel-hd { padding-left: 14px; padding-right: 14px; }

  /* input + button side by side leaves the input unusably narrow once the
     button reserves its (nowrap) label width — stack and go full-width. */
  .os-create-row,
  .os-search-row {
    flex-direction: column;
    align-items: stretch;
    max-width: none;
  }
  .os-identity { grid-template-columns: 1fr; justify-items: start; }

  /* Avatar + name/email + permission pill + remove button can't share one line
     at this width without squeezing the name to nothing. Let the actions drop
     to a second row, pinned right so the card still reads as one unit. */
  .os-member-card { flex-wrap: wrap; row-gap: 8px; }
  .os-member-info { min-width: 120px; }
  .os-perm-toggle { margin-left: auto; }

  .os-archived-banner { flex-direction: column; align-items: flex-start; }
  .os-save-row { flex-wrap: wrap; }
}

/* Step 2 of the shed order: the role prefix goes, leaving just the name. */
@media (max-width: 620px) {
  .os-admin-role { display: none; }
}

/* Step 3: the name goes too. Collapse to an icon-only tap target rather than
   hiding the pill outright — it's the only way to reach My Events / Sign out
   from this screen. */
@media (max-width: 560px) {
  .os-admin-label { display: none; }
  .os-admin-pill { padding: 7px 9px; gap: 4px; }
}

/* Step 4 — matches MyEvents.vue: the create button drops its label at 480,
   before the 400px tier, since the bar is already tight by ~450px. */
@media (max-width: 480px) {
  .os-create-label { display: none; }
  /* Square up the tap target — 18px of side padding around a lone 14px glyph
     leaves a stretched pill with the icon floating in it. */
  .os-create-btn { padding: 9px 11px; gap: 0; }
}

@media (max-width: 400px) {
  .os-topbar { padding: 0; }
  .os-topbar-inner { padding: 10px 16px; }
  .os-page { padding: 12px 16px 40px; }
  .os-page-title { font-size: 24px; }
  .os-page-sub { display: none; }
}
</style>

<!--
  Unscoped, same pattern as EventBudget / EventSchedule: Tailwind Preflight
  (`padding: 0` on *) wins over scoped `.os-input` and leaves native inputs
  looking like 20px underlines. `html .os-input` is enough to take them back.
-->
<style>
html .os-input {
  appearance: none;
  -webkit-appearance: none;
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 46px;
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #fff;
  font-size: 14px;
  font-weight: 450;
  line-height: 1.3;
  color: #111827;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}
html .os-input:disabled { opacity: 0.6; cursor: not-allowed; }
html .os-input:focus { border-color: #111827; background: #fff; }
html .os-input::placeholder { color: #94a3b8; }
html .os-sid-input {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
