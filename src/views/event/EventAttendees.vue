<template>
  <div class="ea-root">

    <!-- ── Toolbar ── -->
    <div class="ea-toolbar">
      <div class="ea-search-wrap">
        <svg class="ea-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="#8A8580" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="searchQ" class="ea-search" placeholder="Search by name or phone…" />
        <button v-if="searchQ" class="ea-search-clear" @click="searchQ = ''">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="ea-toolbar-right">
        <div class="ea-filter-chips">
          <button v-for="f in typeFilters" :key="f.val"
            class="ea-chip" :class="{ 'ea-chip--active': activeType === f.val }"
            @click="activeType = f.val">
            {{ f.label }}
            <span v-if="f.val === 'all' ? attendees.length : typeCount[f.val]" class="ea-chip-cnt">
              {{ f.val === 'all' ? attendees.length : typeCount[f.val] }}
            </span>
          </button>
        </div>
        <button class="ea-import-btn" @click="openImport">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Import
        </button>
        <button class="ea-add-btn" @click="openAdd">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add
        </button>
      </div>
    </div>


    <!-- ── Selection bar ── -->
    <Transition name="ea-fade">
      <div v-if="selectedIds.size" class="ea-selection-bar">
        <span class="ea-sel-count">{{ selectedIds.size }} selected</span>
        <div class="ea-sel-actions">
          <button class="ea-sel-btn ea-sel-btn--ghost" @click="clearSelection">Clear</button>
          <button class="ea-sel-btn ea-sel-btn--danger" :disabled="bulkDeleting" @click="bulkDelete">
            {{ bulkDeleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Table ── -->
    <div class="ea-table-wrap">
      <div class="ea-table-scroll">
        <table class="ea-table">
          <thead>
            <tr>
              <th class="ea-th ea-th--cb">
                <input type="checkbox" class="ea-cb" ref="headerCb"
                  :checked="isAllPageSelected"
                  @change="toggleSelectAll" />
              </th>
              <th class="ea-th ea-th--sortable" @click="toggleSort('name')">
                <span>Name</span>
                <svg class="ea-sort-icon"
                  :class="{ 'ea-sort-icon--active': sortKey === 'name', 'ea-sort-icon--desc': sortKey === 'name' && sortDir === 'desc' }"
                  width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.5" stroke-linecap="round">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </th>
              <th class="ea-th">Phone</th>
              <th class="ea-th">Type</th>
              <th class="ea-th">Template</th>
              <th class="ea-th">Status</th>
              <th class="ea-th">Labels</th>
              <th class="ea-th ea-th--sortable ea-th--right" @click="toggleSort('date')">
                <span>Added</span>
                <svg class="ea-sort-icon"
                  :class="{ 'ea-sort-icon--active': sortKey === 'date', 'ea-sort-icon--desc': sortKey === 'date' && sortDir === 'desc' }"
                  width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.5" stroke-linecap="round">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </th>
              <th class="ea-th ea-th--actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="att in displayList" :key="att.id" class="ea-tr"
              :class="{ 'ea-tr--selected': selectedIds.has(att.id), 'ea-tr--pending': isCardPending(att) }"
              @click="selectedIds.size ? toggleSelect(att.id) : openDetail(att)">
              <!-- Checkbox -->
              <td class="ea-td ea-td--cb" @click.stop="toggleSelect(att.id)">
                <input type="checkbox" class="ea-cb"
                  :checked="selectedIds.has(att.id)"
                  @click.stop
                  @change="toggleSelect(att.id)" />
              </td>
              <!-- Name -->
              <td class="ea-td">
                <div class="ea-cell-name">
                  <div class="ea-avatar"
                    :style="{ background: avatarBg(att.fullName), color: avatarColor(att.fullName) }">
                    {{ initials(att.fullName) }}
                  </div>
                  <span class="ea-name-text">{{ att.fullName }}</span>
                </div>
              </td>
              <!-- Phone -->
              <td class="ea-td ea-td--muted">{{ att.phone || '—' }}</td>
              <!-- Type -->
              <td class="ea-td">
                <span class="ea-type-badge" :class="`ea-type-badge--${getKardType(att)}`">
                  {{ typeLabels[getKardType(att)] }}
                </span>
              </td>
              <!-- Template -->
              <td class="ea-td">
                <div v-if="isCardPending(att)" class="ea-pending-cell">
                  <span class="ea-tpl-name">{{ templateNameForAtt(att) || '—' }}</span>
                  <span class="ea-pending-pill">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.5" stroke-linecap="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Rendering
                  </span>
                </div>
                <span v-else class="ea-td--muted">{{ templateNameForAtt(att) || '—' }}</span>
              </td>
              <!-- Status -->
              <td class="ea-td">
                <div v-if="getKardType(att) === 'invitation'" class="ea-status-cell">
                  <span class="ea-status-dot"
                    :style="{ background: statusColor(att.attendanceStatus) }" />
                  <span class="ea-status-text">{{ att.attendanceStatus || 'Not Confirmed' }}</span>
                </div>
                <span v-else class="ea-cell-dash">—</span>
              </td>
              <!-- Labels -->
              <td class="ea-td">
                <div class="ea-label-list">
                  <span v-for="lbl in attLabels(att)" :key="lbl.id" class="ea-label-chip"
                    :style="{ background: labelBg(lbl), color: labelFg(lbl) }">
                    {{ lbl.name }}
                  </span>
                  <span v-if="!attLabels(att).length" class="ea-cell-dash">—</span>
                </div>
              </td>
              <!-- Added -->
              <td class="ea-td ea-td--muted ea-td--right">{{ formatDate(att.createdAt) }}</td>
              <!-- Actions -->
              <td class="ea-td ea-td--actions" @click.stop>
                <div class="ea-row-actions">
                  <button v-if="isCardPending(att)" class="ea-row-btn ea-row-btn--refresh"
                    :class="{ 'ea-row-btn--spinning': loading }"
                    title="Refresh — card is still rendering"
                    @click="loadInitial">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="23 4 23 10 17 10"/>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                  </button>
                  <button class="ea-row-btn ea-row-btn--edit" title="Edit attendee"
                    @click="openEdit(att)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <!-- Skeleton rows on initial load -->
            <template v-if="loading && !attendees.length">
              <tr v-for="n in 8" :key="`sk-${n}`" class="ea-tr ea-tr--skeleton">
                <td class="ea-td ea-td--cb" />
                <td class="ea-td">
                  <div class="ea-cell-name">
                    <div class="ea-sk-circle" />
                    <div class="ea-sk-bar ea-sk-bar--lg" />
                  </div>
                </td>
                <td class="ea-td"><div class="ea-sk-bar ea-sk-bar--md" /></td>
                <td class="ea-td"><div class="ea-sk-bar ea-sk-bar--sm" /></td>
                <td class="ea-td"><div class="ea-sk-bar ea-sk-bar--md" /></td>
                <td class="ea-td"><div class="ea-sk-bar ea-sk-bar--md" /></td>
                <td class="ea-td"><div class="ea-sk-bar ea-sk-bar--sm" /></td>
                <td class="ea-td"><div class="ea-sk-bar ea-sk-bar--sm" /></td>
                <td class="ea-td" />
              </tr>
            </template>

            <!-- Empty state row -->
            <tr v-else-if="!loading && !filteredList.length">
              <td colspan="9" class="ea-td-empty">
                <div class="ea-empty">
                  <!-- Illustration -->
                  <div class="ea-empty-graphic">
                    <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="32" fill="#F2F2F0"/>
                      <!-- People silhouette -->
                      <circle cx="26" cy="22" r="7" fill="#DDDBD6"/>
                      <path d="M12 44c0-7.732 6.268-14 14-14h0c7.732 0 14 6.268 14 14" stroke="#DDDBD6" stroke-width="3" stroke-linecap="round" fill="none"/>
                      <!-- Plus person -->
                      <circle cx="44" cy="24" r="5" fill="#C9A84C" fill-opacity="0.25" stroke="#C9A84C" stroke-width="1.5"/>
                      <line x1="44" y1="21" x2="44" y2="27" stroke="#C9A84C" stroke-width="1.8" stroke-linecap="round"/>
                      <line x1="41" y1="24" x2="47" y2="24" stroke="#C9A84C" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                  </div>

                  <!-- No-filter empty (no attendees at all) -->
                  <template v-if="!searchQ && activeType === 'all'">
                    <p class="ea-empty-title">No attendees yet</p>
                    <p class="ea-empty-sub">Add your first guest, contributor, or contact<br>to get started.</p>
                    <button class="ea-empty-cta" @click="openAdd">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Attendee
                    </button>
                  </template>

                  <!-- Active type filter, no match -->
                  <template v-else-if="!searchQ && activeType !== 'all'">
                    <p class="ea-empty-title">No {{ activeType }}s here</p>
                    <p class="ea-empty-sub">There are no attendees of this type yet.<br>Switch tabs or add one now.</p>
                    <button class="ea-empty-cta" @click="openAdd">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add {{ capitalize(activeType) }}
                    </button>
                  </template>

                  <!-- Search returned nothing -->
                  <template v-else>
                    <p class="ea-empty-title">No results for "{{ searchQ }}"</p>
                    <p class="ea-empty-sub">Check the spelling or try a different<br>name or phone number.</p>
                    <button class="ea-empty-cta ea-empty-cta--ghost" @click="searchQ = ''">
                      Clear search
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table footer: record range + paginator -->
      <div class="ea-table-footer" v-if="filteredList.length > PAGE_SIZE || (filteredList.length && totalPages > 1)">
        <span class="ea-range-label" v-if="filteredList.length">
          {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filteredList.length) }}
          of {{ filteredList.length }}
        </span>
        <div class="ea-paginator" v-if="totalPages > 1">
          <!-- Prev -->
          <button class="ea-page-btn ea-page-btn--nav"
            :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <!-- Page numbers -->
          <template v-for="p in pageNumbers" :key="String(p)">
            <span v-if="p === '…'" class="ea-page-ellipsis">…</span>
            <button v-else class="ea-page-btn"
              :class="{ 'ea-page-btn--active': currentPage === p }"
              @click="goToPage(p)">
              {{ p }}
            </button>
          </template>
          <!-- Next -->
          <button class="ea-page-btn ea-page-btn--nav"
            :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Add / Edit Modal ── -->
    <Teleport to="body">
      <Transition name="ea-fade">
        <div v-if="showModal" class="ea-overlay ea-overlay--center" @click.self="closeModal">
          <Transition name="ea-scale">
            <div class="ea-modal" v-if="showModal">
              <div class="ea-modal-header">
                <h3 class="ea-modal-title">{{ editingAtt ? 'Edit Attendee' : 'Add Attendee' }}</h3>
                <button class="ea-modal-close" @click="closeModal">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <form @submit.prevent="submitForm" class="ea-form">
                <!-- Name -->
                <div class="ea-field">
                  <label class="ea-label">Full Name <span class="ea-required">*</span></label>
                  <input v-model="form.name" class="ea-input"
                    :class="{ 'ea-input--error': formErr.name }"
                    placeholder="Enter full name"
                    @blur="validateForm" />
                  <span v-if="formErr.name" class="ea-field-error">{{ formErr.name }}</span>
                </div>

                <!-- Phone -->
                <div class="ea-field">
                  <label class="ea-label">Phone Number</label>
                  <VueTelInput
                    v-model="form.phone"
                    class="ea-tel-input"
                    :class="{ 'ea-tel-input--valid': phoneObj?.valid, 'ea-tel-input--invalid': phoneObj && !phoneObj.valid && form.phone }"
                    :preferred-countries="['TZ', 'KE', 'UG', 'RW', 'ET', 'ZM', 'MW', 'MZ']"
                    default-country="TZ"
                    mode="international"
                    :input-options="{ placeholder: '7XX XXX XXX', name: 'phone', id: 'att-phone' }"
                    :dropdown-options="{ showDialCodeInSelection: true, showFlags: true, showSearchBox: true }"
                    @validate="onPhoneValidate"
                  />
                  <span v-if="phoneObj && !phoneObj.valid && form.phone" class="ea-field-error">
                    Enter a valid phone number with country code
                  </span>
                </div>

                <!-- Type -->
                <div class="ea-field">
                  <label class="ea-label">Attendee Type</label>
                  <div class="ea-type-row">
                    <button v-for="t in ['invitation', 'contribution', 'contact']" :key="t"
                      type="button"
                      class="ea-type-opt" :class="{ 'ea-type-opt--active': form.kardType === t }"
                      @click="form.kardType = t">
                      {{ capitalize(t) }}
                    </button>
                  </div>
                  <p v-if="editingAtt && form.kardType !== getKardType(editingAtt)" class="ea-type-change-note">
                    Changing type will replace the current card assignment.
                  </p>
                </div>

                <!-- Card Template (not for contact) -->
                <div class="ea-field" v-if="form.kardType !== 'contact'">
                  <label class="ea-label">
                    Card Template <span class="ea-required">*</span>
                  </label>

                  <!-- Loading -->
                  <div v-if="fetchingTemplates" class="ea-tpl-state">
                    <svg class="ea-tpl-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Loading templates…
                  </div>

                  <!-- No templates found -->
                  <div v-else-if="!cardTemplates.length" class="ea-tpl-empty">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B5B0A8"
                      stroke-width="1.8" stroke-linecap="round">
                      <rect x="2" y="5" width="20" height="14" rx="3"/>
                      <line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    No {{ form.kardType }} card templates yet.
                    Create one in the <strong>Cards</strong> section first.
                  </div>

                  <!-- Template grid -->
                  <div v-else class="ea-tpl-grid">
                    <button v-for="tpl in cardTemplates" :key="tpl.id"
                      type="button"
                      class="ea-tpl-opt"
                      :class="{ 'ea-tpl-opt--active': form.templateCardId === tpl.id }"
                      @click="form.templateCardId = tpl.id">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                        <rect x="2" y="5" width="20" height="14" rx="3"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                      <span>{{ tpl.name }}</span>
                      <svg v-if="form.templateCardId === tpl.id" class="ea-tpl-check"
                        width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  </div>

                  <span v-if="formErr.templateCardId" class="ea-field-error">
                    {{ formErr.templateCardId }}
                  </span>
                </div>

                <!-- Labels -->
                <div class="ea-field" v-if="eventLabels.length">
                  <label class="ea-label">Labels</label>
                  <div class="ea-label-row">
                    <button v-for="lbl in eventLabels" :key="lbl.id"
                      type="button"
                      class="ea-label-toggle"
                      :style="{
                        borderColor: labelFg(lbl),
                        color: form.labelIds.includes(lbl.id) ? labelFg(lbl) : '#8A8580',
                        background: form.labelIds.includes(lbl.id) ? labelBg(lbl) : 'transparent'
                      }"
                      @click="toggleLabel(lbl.id)">
                      {{ lbl.name }}
                    </button>
                  </div>
                </div>

                <!-- Actions -->
                <div class="ea-form-actions">
                  <button type="button" class="ea-btn ea-btn--ghost" @click="closeModal">Cancel</button>
                  <button v-if="editingAtt" type="button" class="ea-btn ea-btn--danger"
                    @click="deleteAttendee" :disabled="submitting">Delete</button>
                  <button type="submit" class="ea-btn ea-btn--primary" :disabled="submitting">
                    {{ submitting ? 'Saving…' : editingAtt ? 'Save Changes' : 'Add Attendee' }}
                  </button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════
         IMPORT — Phase 1: Type + File pick
         ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="ea-fade">
        <div v-if="importPhase === 1" class="ea-overlay ea-overlay--center" @click.self="closeImport">
          <Transition name="ea-scale">
            <div class="ea-modal ea-imp-modal" v-if="importPhase === 1">
              <div class="ea-modal-header">
                <h3 class="ea-modal-title">Import Attendees</h3>
                <button class="ea-modal-close" @click="closeImport">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div class="ea-imp-body">
                <!-- Type -->
                <div class="ea-field">
                  <label class="ea-label">Attendee Type <span class="ea-required">*</span></label>
                  <div class="ea-type-row">
                    <button v-for="t in ['invitation','contribution','contact']" :key="t"
                      type="button" class="ea-type-opt"
                      :class="{ 'ea-type-opt--active': importKardType === t }"
                      @click="importKardType = t">
                      {{ capitalize(t) }}
                    </button>
                  </div>
                  <p class="ea-imp-type-hint">
                    <template v-if="importKardType === 'invitation'">Guests who receive an invitation card.</template>
                    <template v-else-if="importKardType === 'contribution'">Guests who pledge or pay contributions.</template>
                    <template v-else>General contacts — no card, optional pledge/contribution fields.</template>
                  </p>
                </div>

                <!-- Drop zone -->
                <div class="ea-dropzone"
                  :class="{ 'ea-dropzone--over': dropOver, 'ea-dropzone--filled': importFileName }"
                  @dragover.prevent="dropOver = true"
                  @dragleave="dropOver = false"
                  @drop.prevent="onFileDrop">

                  <input type="file" class="ea-file-input" ref="fileInputRef"
                    accept=".xls,.xlsx,.xlsm,.xlsb"
                    @change="handleImportFile" />

                  <!-- Empty state -->
                  <div v-if="!importFileName && !importProcessing" class="ea-dropzone-inner" @click="fileInputRef.click()">
                    <div class="ea-drop-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <p class="ea-drop-title">Drop your Excel file here</p>
                    <p class="ea-drop-sub">or <span class="ea-drop-link">click to browse</span> — .xls · .xlsx · .xlsm · .xlsb</p>
                  </div>

                  <!-- Processing -->
                  <div v-else-if="importProcessing" class="ea-dropzone-inner">
                    <svg class="ea-tpl-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    <p class="ea-drop-sub" style="margin-top:10px">Parsing file…</p>
                  </div>

                  <!-- File chosen -->
                  <div v-else class="ea-file-chosen">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span class="ea-file-name">{{ importFileName }}</span>
                    <button class="ea-file-clear" @click.stop="clearImportFile">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>

                <p v-if="importFileError" class="ea-imp-error">{{ importFileError }}</p>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════
         IMPORT — Phase 2: Column Mapping
         ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="ea-fade">
        <div v-if="importPhase === 2" class="ea-overlay ea-overlay--center" @click.self="closeImport">
          <Transition name="ea-scale">
            <div class="ea-modal ea-imp-modal ea-imp-modal--tall" v-if="importPhase === 2">
              <div class="ea-modal-header">
                <div class="ea-imp-header-left">
                  <button class="ea-imp-back" @click="importPhase = 1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <h3 class="ea-modal-title">Map Columns</h3>
                </div>
                <button class="ea-modal-close" @click="closeImport">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div class="ea-imp-body ea-imp-body--scroll">

                <!-- File info pill -->
                <div class="ea-imp-file-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {{ importFileName }} · {{ importRows.length }} rows · {{ capitalize(importKardType) }}
                </div>

                <!-- ── Step 1: Labels ── -->
                <div v-if="eventLabels.length" class="ea-imp-section">
                  <p class="ea-imp-section-label">Step 1 — Assign Labels <span class="ea-imp-opt">(optional)</span></p>
                  <div class="ea-imp-label-scroller">
                    <button v-for="lbl in eventLabels" :key="lbl.id"
                      type="button" class="ea-imp-label-chip"
                      :class="{ 'ea-imp-label-chip--active': importSelectedLabels.includes(lbl.id) }"
                      :style="{
                        borderColor: importSelectedLabels.includes(lbl.id) ? labelFg(lbl) : '#EBEBEA',
                        color: importSelectedLabels.includes(lbl.id) ? labelFg(lbl) : '#8A8580',
                        background: importSelectedLabels.includes(lbl.id) ? labelBg(lbl) : 'transparent',
                      }"
                      @click="toggleImportLabel(lbl.id)">
                      {{ lbl.name }}
                    </button>
                  </div>
                </div>

                <!-- ── Step 2: Map columns ── -->
                <div class="ea-imp-section">
                  <p class="ea-imp-section-label">{{ eventLabels.length ? 'Step 2' : 'Step 1' }} — Map Excel Columns</p>

                  <!-- Name -->
                  <div class="ea-map-row">
                    <div class="ea-map-icon-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <span class="ea-map-label">Name <span class="ea-required">*</span></span>
                    <div class="ea-map-select-wrap">
                      <select class="ea-map-select" v-model="importMapping.name">
                        <option :value="null" disabled>Select column…</option>
                        <option v-for="h in importHeaders" :key="h.idx" :value="h.idx">{{ h.label }}</option>
                      </select>
                    </div>
                  </div>

                  <!-- Phone -->
                  <div class="ea-map-row">
                    <div class="ea-map-icon-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
                    </div>
                    <span class="ea-map-label">Phone <span class="ea-required">*</span></span>
                    <div class="ea-map-select-wrap">
                      <select class="ea-map-select" v-model="importMapping.phone">
                        <option :value="null" disabled>Select column…</option>
                        <option v-for="h in importHeaders" :key="h.idx" :value="h.idx">{{ h.label }}</option>
                      </select>
                    </div>
                  </div>

                  <!-- Pledges — contribution & contact only -->
                  <div v-if="importKardType === 'contribution' || importKardType === 'contact'" class="ea-map-row">
                    <div class="ea-map-icon-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <span class="ea-map-label">Pledges</span>
                    <div class="ea-map-toggle-group">
                      <label class="ea-toggle">
                        <input type="checkbox" v-model="importMapAhadi" />
                        <span class="ea-toggle-track"><span class="ea-toggle-thumb"/></span>
                      </label>
                      <div class="ea-map-select-wrap" v-if="importMapAhadi">
                        <select class="ea-map-select" v-model="importMapping.ahadi">
                          <option :value="null" disabled>Select column…</option>
                          <option v-for="h in importHeaders" :key="h.idx" :value="h.idx">{{ h.label }}</option>
                        </select>
                      </div>
                      <span v-else class="ea-map-skip">Skipped</span>
                    </div>
                  </div>

                  <!-- Contribution paid — contribution & contact only -->
                  <div v-if="importKardType === 'contribution' || importKardType === 'contact'" class="ea-map-row">
                    <div class="ea-map-icon-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    </div>
                    <span class="ea-map-label">Contribution</span>
                    <div class="ea-map-toggle-group">
                      <label class="ea-toggle">
                        <input type="checkbox" v-model="importMapMchango" />
                        <span class="ea-toggle-track"><span class="ea-toggle-thumb"/></span>
                      </label>
                      <div class="ea-map-select-wrap" v-if="importMapMchango">
                        <select class="ea-map-select" v-model="importMapping.mchango">
                          <option :value="null" disabled>Select column…</option>
                          <option v-for="h in importHeaders" :key="h.idx" :value="h.idx">{{ h.label }}</option>
                        </select>
                      </div>
                      <span v-else class="ea-map-skip">Skipped</span>
                    </div>
                  </div>

                  <!-- Card Template — invitation & contribution only -->
                  <div v-if="importKardType !== 'contact'" class="ea-map-row ea-map-row--card">
                    <div class="ea-map-icon-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    </div>
                    <span class="ea-map-label">Card Template <span class="ea-required">*</span></span>
                    <div class="ea-map-select-wrap">
                      <div v-if="fetchingTemplates" class="ea-map-loading">
                        <svg class="ea-tpl-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                        Loading…
                      </div>
                      <div v-else-if="!cardTemplates.length" class="ea-map-empty">
                        No {{ importKardType }} templates yet — create one in Cards first.
                      </div>
                      <select v-else class="ea-map-select" v-model="importMapping.card">
                        <option :value="null" disabled>Select template…</option>
                        <option v-for="tpl in cardTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Proceed -->
                <button class="ea-imp-proceed-btn" @click="proceedToPreview">
                  Preview Import
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════
         IMPORT — Phase 3: Preview + Import
         ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="ea-fade">
        <div v-if="importPhase === 3" class="ea-overlay" @click.self="closeImport">
          <Transition name="ea-slide-right">
            <div class="ea-drawer ea-imp-drawer" v-if="importPhase === 3">

              <!-- Header -->
              <div class="ea-drawer-header ea-imp-drawer-header">
                <button class="ea-drawer-back" @click="importPhase = 2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <button class="ea-drawer-edit-btn" @click="closeImport">Cancel</button>
              </div>

              <!-- Hero strip -->
              <div class="ea-imp-preview-hero">
                <div>
                  <p class="ea-imp-preview-title">Import Preview</p>
                  <p class="ea-imp-preview-sub">{{ importPreviewList.length }} guest{{ importPreviewList.length !== 1 ? 's' : '' }} · {{ capitalize(importKardType) }}</p>
                </div>
                <!-- Labels assigned -->
                <div v-if="importSelectedLabels.length" class="ea-imp-preview-labels">
                  <span v-for="lbl in eventLabels.filter(l => importSelectedLabels.includes(l.id))" :key="lbl.id"
                    class="ea-label-chip"
                    :style="{ background: labelBg(lbl), color: labelFg(lbl) }">
                    {{ lbl.name }}
                  </span>
                </div>
              </div>

              <!-- Card template being used -->
              <div v-if="importKardType !== 'contact'" class="ea-imp-tpl-banner">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                Template: <strong>{{ cardTemplates.find(t => t.id === importMapping.card)?.name ?? '—' }}</strong>
              </div>

              <!-- Empty state -->
              <div v-if="!importPreviewList.length" class="ea-imp-empty">
                <p class="ea-empty-title">All done!</p>
                <p class="ea-empty-sub">All guests were imported successfully.</p>
                <button class="ea-empty-cta" @click="closeImport">Close</button>
              </div>

              <!-- Attendee list -->
              <div v-else class="ea-imp-preview-list">
                <div v-for="(att, idx) in importPreviewList" :key="att._id" class="ea-imp-preview-row">
                  <span class="ea-imp-row-num">{{ idx + 1 }}</span>
                  <div class="ea-imp-row-info">
                    <span class="ea-imp-row-name">{{ att.fullName }}</span>
                    <span class="ea-imp-row-phone">{{ att.phone || '—' }}</span>
                    <!-- pledge / contribution for contribution & contact -->
                    <div v-if="importKardType === 'contribution' || importKardType === 'contact'" class="ea-imp-row-amounts">
                      <span v-if="att.pledgedAmount != null" class="ea-imp-amount ea-imp-amount--pledge">
                        Pledge: {{ att.pledgedAmount ? formatMoney(att.pledgedAmount) : '—' }}
                      </span>
                      <span v-if="att.paidAmount != null" class="ea-imp-amount ea-imp-amount--paid">
                        Paid: {{ att.paidAmount ? formatMoney(att.paidAmount) : '—' }}
                      </span>
                    </div>
                  </div>
                  <button class="ea-imp-row-remove" @click="importPreviewList.splice(idx,1)" title="Remove from import">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              <!-- Footer: import button -->
              <div class="ea-imp-drawer-footer" v-if="importPreviewList.length">
                <button class="ea-imp-run-btn" :disabled="importing" @click="runImport">
                  <template v-if="importing">
                    <svg class="ea-tpl-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Importing…
                  </template>
                  <template v-else>
                    Import {{ importPreviewList.length }} Guest{{ importPreviewList.length !== 1 ? 's' : '' }}
                  </template>
                </button>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Detail Drawer ── -->
    <Teleport to="body">
      <Transition name="ea-fade">
        <div v-if="selectedAtt" class="ea-overlay" @click.self="closeDetail">
          <Transition name="ea-slide-right">
            <div class="ea-drawer" v-if="selectedAtt">

              <!-- Header -->
              <div class="ea-drawer-header">
                <button class="ea-drawer-back" @click="closeDetail">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Close
                </button>
                <button class="ea-drawer-edit-btn" @click="openEdit(selectedAtt)">Edit</button>
              </div>

              <!-- Hero -->
              <div class="ea-drawer-hero">
                <div class="ea-drawer-avatar"
                  :style="{ background: avatarBg(selectedAtt.fullName), color: avatarColor(selectedAtt.fullName) }">
                  {{ initials(selectedAtt.fullName) }}
                </div>
                <p class="ea-drawer-name">{{ selectedAtt.fullName }}</p>
                <p class="ea-drawer-phone">{{ selectedAtt.phone || '—' }}</p>
                <div class="ea-drawer-hero-meta">
                  <span class="ea-type-badge" :class="`ea-type-badge--${getKardType(selectedAtt)}`">
                    {{ typeLabels[getKardType(selectedAtt)] }}
                  </span>
                  <span v-if="templateNameForAtt(selectedAtt)" class="ea-drawer-tpl-name">
                    {{ templateNameForAtt(selectedAtt) }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="ea-drawer-actions">
                <a :href="`tel:${selectedAtt.phone}`" class="ea-action-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/>
                  </svg>
                  Call
                </a>
                <a v-if="cardUrl(selectedAtt) && !isCardPending(selectedAtt)"
                  :href="cardUrl(selectedAtt)" target="_blank" rel="noopener" class="ea-action-pill">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.8" stroke-linecap="round">
                    <rect x="2" y="5" width="20" height="14" rx="3"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                  View Card
                </a>
                <span v-else-if="isCardPending(selectedAtt)" class="ea-action-pill ea-action-pill--pending">
                  <svg class="ea-spin" width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Card rendering…
                </span>
              </div>

              <!-- Body -->
              <div class="ea-drawer-body">

                <!-- Labels -->
                <div v-if="attLabels(selectedAtt).length" class="ea-drawer-block">
                  <p class="ea-block-label">Labels</p>
                  <div class="ea-label-wrap">
                    <span v-for="lbl in attLabels(selectedAtt)" :key="lbl.id" class="ea-label-chip"
                      :style="{ background: labelBg(lbl), color: labelFg(lbl) }">
                      {{ lbl.name }}
                    </span>
                  </div>
                </div>

                <!-- Attendance — invitation only -->
                <div v-if="getKardType(selectedAtt) === 'invitation'" class="ea-drawer-block">
                  <p class="ea-block-label">Attendance</p>
                  <div class="ea-status-pill-row">
                    <button v-for="s in attendanceStatuses" :key="s.val"
                      class="ea-status-pill"
                      :class="{ 'ea-status-pill--active': selectedAtt.attendanceStatus === s.val }"
                      :style="selectedAtt.attendanceStatus === s.val
                        ? { background: s.bg, color: s.color, borderColor: s.color }
                        : {}"
                      :disabled="updatingStatus"
                      @click="updateStatus(s.val)">
                      <span class="ea-att-dot-sm" :style="{ background: s.color }" />
                      {{ s.val }}
                    </button>
                  </div>
                </div>

                <!-- Contributions — contribution type -->
                <div v-if="getKardType(selectedAtt) === 'contribution'" class="ea-drawer-block">
                  <p class="ea-block-label">Contributions</p>
                  <div class="ea-contrib-row">
                    <div class="ea-contrib-card">
                      <span class="ea-contrib-label">Pledged</span>
                      <span class="ea-contrib-val">{{ formatMoney(selectedAtt.pledgedAmount) }}</span>
                    </div>
                    <div class="ea-contrib-card">
                      <span class="ea-contrib-label">Paid</span>
                      <span class="ea-contrib-val ea-contrib-val--paid">{{ formatMoney(selectedAtt.paidAmount) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Added -->
                <p class="ea-drawer-added">Added {{ formatDate(selectedAtt.createdAt) }}</p>

              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db, auth } from '../../firebase'
import {
  collection, query, orderBy, where,
  getDocs, updateDoc, deleteDoc, deleteField, doc, addDoc,
} from 'firebase/firestore'
import * as XLSX from 'xlsx'
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'

const CREATE_ATTENDEES_URL = 'https://createattendees-frbu33fema-uc.a.run.app'

const props = defineProps({
  event: Object,
  eventId: String,
})

const route = useRoute()
const eventId = computed(() => props.eventId ?? route.params.eventId)
const eventLabels = computed(() => props.event?.labels ?? [])

// ── Data ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10
const attendees = ref([])
const loading = ref(false)
const currentPage = ref(1)
const selectedIds = reactive(new Set())

// ── Search & Filter ───────────────────────────────────────────────────────────
const searchQ = ref('')
const activeType = ref('all')
const sortKey = ref('date')
const sortDir = ref('desc')

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const typeFilters = [
  { val: 'all', label: 'All' },
  { val: 'invitation', label: 'Invitation' },
  { val: 'contribution', label: 'Contribution' },
  { val: 'contact', label: 'Contact' },
]

const typeLabels = { invitation: 'Invitation', contribution: 'Contribution', contact: 'Contact' }

const filteredList = computed(() => {
  let list = attendees.value
  if (activeType.value !== 'all') {
    list = list.filter(a => getKardType(a) === activeType.value)
  }
  const q = searchQ.value.trim().toLowerCase()
  if (q) {
    list = list.filter(a =>
      (a.fullNameLower ?? a.fullName?.toLowerCase() ?? '').includes(q) ||
      (a.phone ?? '').includes(q)
    )
  }
  if (sortKey.value) {
    list = [...list].sort((a, b) => {
      const va = sortKey.value === 'name' ? (a.fullNameLower ?? '') : (a.createdAt ?? '')
      const vb = sortKey.value === 'name' ? (b.fullNameLower ?? '') : (b.createdAt ?? '')
      if (va < vb) return sortDir.value === 'asc' ? -1 : 1
      if (va > vb) return sortDir.value === 'asc' ? 1 : -1
      return 0
    })
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / PAGE_SIZE)))

const displayList = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredList.value.slice(start, start + PAGE_SIZE)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (cur > 3) pages.push('…')
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (cur < total - 2) pages.push('…')
  if (total > 1) pages.push(total)
  return pages
})

function goToPage(n) {
  if (n < 1 || n > totalPages.value) return
  currentPage.value = n
}

const isAllPageSelected = computed(() =>
  displayList.value.length > 0 && displayList.value.every(a => selectedIds.has(a.id))
)
const isSomePageSelected = computed(() =>
  displayList.value.some(a => selectedIds.has(a.id)) && !isAllPageSelected.value
)
function toggleSelectAll() {
  if (isAllPageSelected.value) {
    displayList.value.forEach(a => selectedIds.delete(a.id))
  } else {
    displayList.value.forEach(a => selectedIds.add(a.id))
  }
}
function toggleSelect(id) {
  if (selectedIds.has(id)) selectedIds.delete(id)
  else selectedIds.add(id)
}

watch([searchQ, activeType, sortKey, sortDir], () => {
  currentPage.value = 1
  selectedIds.clear()
})

const typeCount = computed(() => {
  const c = { invitation: 0, contribution: 0, contact: 0 }
  for (const a of attendees.value) {
    const t = getKardType(a)
    if (t in c) c[t]++
  }
  return c
})


// ── Firestore load ────────────────────────────────────────────────────────────
async function loadInitial() {
  if (!eventId.value) return
  loading.value = true
  attendees.value = []
  currentPage.value = 1
  try {
    const q = query(
      collection(db, 'events', eventId.value, 'attendees'),
      orderBy('createdAt', 'desc'),
    )
    const snap = await getDocs(q)
    attendees.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Failed to load attendees', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadInitial(); loadAllTemplates() })
watch(eventId, () => { if (eventId.value) { loadInitial(); loadAllTemplates() } })

// ── Helpers ───────────────────────────────────────────────────────────────────
function getKardType(att) {
  const c = att.cards ?? {}
  if (c.invitation != null) return 'invitation'
  if (c.contribution != null) return 'contribution'
  return 'contact'
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function nameHash(str) {
  let h = 0
  for (let i = 0; i < (str?.length ?? 0); i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}
function avatarHue(name) { return nameHash(name ?? '') % 360 }
function avatarBg(name) { return `hsl(${avatarHue(name)}, 50%, 88%)` }
function avatarColor(name) { return `hsl(${avatarHue(name)}, 50%, 30%)` }

function labelFg(lbl) {
  const v = lbl?.colorValue
  if (!v) return '#C9A84C'
  if (typeof v === 'string') return v
  const r = (v >> 16) & 0xFF
  const g = (v >> 8) & 0xFF
  const b = v & 0xFF
  return `rgb(${r},${g},${b})`
}

function labelBg(lbl) {
  const v = lbl?.colorValue
  if (!v) return 'rgba(201,168,76,0.12)'
  if (typeof v === 'string') return v + '20'
  const r = (v >> 16) & 0xFF
  const g = (v >> 8) & 0xFF
  const b = v & 0xFF
  return `rgba(${r},${g},${b},0.12)`
}

function attLabels(att) {
  const ids = att.labelIds ?? []
  return eventLabels.value.filter(l => ids.includes(l.id))
}

function statusColor(status) {
  return {
    'Confirmed': '#30D158',
    'Declined': '#FF453A',
    'Called': '#64D2FF',
    'Unreachable': '#FF9F0A',
    'Not Confirmed': '#8E8E93',
  }[status] ?? '#8E8E93'
}

function cardUrl(att) {
  const t = getKardType(att)
  return att.cards?.[t]?.url ?? null
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMoney(n) {
  if (!n) return 'TZS 0'
  return 'TZS ' + Number(n).toLocaleString()
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : '' }

function templateNameForAtt(att) {
  const type = getKardType(att)
  if (type === 'contact') return null
  const tid = att.cards?.[type]?.templateCardId
  return tid ? (allTemplatesMap.value[tid] ?? null) : null
}

function isCardPending(att) {
  const type = getKardType(att)
  if (type === 'contact') return false
  const cardMap = att.cards?.[type]
  if (!cardMap) return true
  const url = cardMap.url ?? ''
  return !url || !url.startsWith('http') || url.includes('placeholder')
}

// ── Attendance status ─────────────────────────────────────────────────────────
const attendanceStatuses = [
  { val: 'Confirmed',     color: '#30D158', bg: 'rgba(48,209,88,0.1)' },
  { val: 'Not Confirmed', color: '#8E8E93', bg: 'rgba(142,142,147,0.1)' },
  { val: 'Declined',      color: '#FF453A', bg: 'rgba(255,69,58,0.1)' },
  { val: 'Called',        color: '#64D2FF', bg: 'rgba(100,210,255,0.1)' },
  { val: 'Unreachable',   color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
]

// ── Detail drawer ─────────────────────────────────────────────────────────────
const selectedAtt = ref(null)
const updatingStatus = ref(false)

function openDetail(att) { selectedAtt.value = att }
function closeDetail() { selectedAtt.value = null }

async function updateStatus(status) {
  const att = selectedAtt.value
  if (!att || updatingStatus.value) return
  updatingStatus.value = true
  try {
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), { attendanceStatus: status })
    const updated = { ...att, attendanceStatus: status }
    selectedAtt.value = updated
    const idx = attendees.value.findIndex(a => a.id === att.id)
    if (idx !== -1) attendees.value[idx] = updated
  } catch (e) {
    console.error('Failed to update status', e)
  } finally {
    updatingStatus.value = false
  }
}

// ── Card templates ────────────────────────────────────────────────────────────
const cardTemplates = ref([])       // [{ id, name }] for the modal selector
const fetchingTemplates = ref(false)
const allTemplatesMap = ref({})     // { [templateId]: name } for table display

async function loadAllTemplates() {
  if (!eventId.value) return
  try {
    const snap = await getDocs(collection(db, 'events', eventId.value, 'cards'))
    const map = {}
    snap.docs.forEach(d => { map[d.id] = d.data().type })
    allTemplatesMap.value = map
  } catch (e) {
    console.error('Failed to load card templates', e)
  }
}

async function fetchTemplates(type) {
  if (type === 'contact') { cardTemplates.value = []; return }
  if (!eventId.value) return
  fetchingTemplates.value = true
  try {
    const snap = await getDocs(
      query(
        collection(db, 'events', eventId.value, 'cards'),
        where('purpose', '==', type),
      )
    )
    cardTemplates.value = snap.docs.map(d => ({ id: d.id, name: d.data().type }))
  } catch (e) {
    console.error('Failed to fetch card templates', e)
  } finally {
    fetchingTemplates.value = false
  }
}

// ── Add / Edit modal ──────────────────────────────────────────────────────────
const showModal = ref(false)
const editingAtt = ref(null)
const submitting = ref(false)

const form = ref({ name: '', phone: '', kardType: 'invitation', templateCardId: '', labelIds: [] })
const formErr = ref({ name: '', templateCardId: '' })
const phoneObj = ref(null)   // populated by vue-tel-input @validate

function onPhoneValidate(obj) { phoneObj.value = obj }

function validateForm() {
  formErr.value.name = form.value.name.trim() ? '' : 'Name is required'
  formErr.value.templateCardId =
    (form.value.kardType !== 'contact' && !form.value.templateCardId)
      ? 'Select a card template'
      : ''
}

function openAdd() {
  editingAtt.value = null
  form.value = { name: '', phone: '', kardType: 'invitation', templateCardId: '', labelIds: [] }
  formErr.value = { name: '', templateCardId: '' }
  phoneObj.value = null
  showModal.value = true
  fetchTemplates('invitation')
}

function openEdit(att) {
  editingAtt.value = att
  const type = getKardType(att)
  // Stored phone is E.164 digits without +; vue-tel-input needs the + to parse it
  const rawPhone = att.phone ?? ''
  form.value = {
    name: att.fullName ?? '',
    phone: rawPhone ? '+' + rawPhone : '',
    kardType: type,
    templateCardId: att.cards?.[type]?.templateCardId ?? '',
    labelIds: [...(att.labelIds ?? [])],
  }
  formErr.value = { name: '', templateCardId: '' }
  phoneObj.value = null
  closeDetail()
  showModal.value = true
  fetchTemplates(type)
}

// Re-fetch templates whenever the type changes in the form
watch(() => form.value.kardType, type => {
  form.value.templateCardId = ''
  fetchTemplates(type)
})

function closeModal() {
  showModal.value = false
  editingAtt.value = null
}

function toggleLabel(id) {
  const idx = form.value.labelIds.indexOf(id)
  if (idx === -1) form.value.labelIds.push(id)
  else form.value.labelIds.splice(idx, 1)
}

async function submitForm() {
  validateForm()
  if (formErr.value.name || formErr.value.templateCardId) return
  submitting.value = true
  try {
    const name = form.value.name.trim()
    // Prefer the E.164 number from vue-tel-input validation; fall back to raw input stripped of +
    const phone = (phoneObj.value?.number ?? form.value.phone).trim().replace(/^\+/, '')
    const isContact = form.value.kardType === 'contact'
    const existingAtt = editingAtt.value

    // Always route through the cloud function for all types (invitation, contribution,
    // contact). This ensures consistent Firestore structure with the Flutter app, proper
    // billing deduction, and correct atomic type-switching (the function replaces the
    // entire cards map so changing type cleanly removes the old card key).
    const uid = auth.currentUser.uid
    const attendeeId = existingAtt?.id ?? doc(collection(db, 'events', eventId.value, 'attendees')).id
    const attendeeData = {
      id:               attendeeId,
      cards:            {},
      checkinStatus:    existingAtt?.checkinStatus ?? [],
      createdAt:        existingAtt?.createdAt ?? new Date().toISOString(),
      email:            existingAtt?.email ?? '',
      fullName:         name.toUpperCase(),
      fullNameLower:    name.toLowerCase(),
      attendanceStatus: existingAtt?.attendanceStatus ?? 'Not Confirmed',
      phone,
      messages:         existingAtt?.messages ?? {},
      messageIndexes:   existingAtt?.messageIndexes ?? [],
      labelIds:         form.value.labelIds,
      idComment:        existingAtt?.idComment ?? 'No Comment',
    }
    const payload = {
      eventId:        eventId.value,
      attendees:      [attendeeData],
      // contacts don't need a real templateCardId — the function uses "_" for them
      templateCardId: isContact ? 'contact' : form.value.templateCardId,
      usepng:         props.event?.usepng ?? true,
      kardType:       form.value.kardType,
    }
    const res = await fetch(CREATE_ATTENDEES_URL, {
      method:  'POST',
      headers: {
        // No Content-Type: application/json — the function calls JSON.parse(req.body)
        // itself, so the body must arrive as a raw string (text/plain), not pre-parsed.
        'Authorization': `Bearer ${uid}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Cloud function error: ${res.status}`)
    const json = await res.json()
    if (!json.status) throw new Error(json.message ?? 'Server error')

    // Firestore merge: true deeply merges nested maps, so the old card type key
    // survives alongside the new one. Explicitly delete it so the attendee only
    // ever has one card type — matching the mobile app's expectation.
    if (existingAtt) {
      const oldType = getKardType(existingAtt)
      if (oldType !== form.value.kardType) {
        await updateDoc(
          doc(db, 'events', eventId.value, 'attendees', attendeeId),
          { [`cards.${oldType}`]: deleteField() },
        )
      }
    }

    await loadInitial()
    closeModal()
  } catch (e) {
    console.error('Failed to save attendee', e)
    alert(`Could not save attendee: ${e.message}`)
  } finally {
    submitting.value = false
  }
}

async function deleteAttendee() {
  if (!editingAtt.value) return
  if (!confirm(`Delete ${editingAtt.value.fullName}? This cannot be undone.`)) return
  submitting.value = true
  try {
    await deleteDoc(doc(db, 'events', eventId.value, 'attendees', editingAtt.value.id))
    attendees.value = attendees.value.filter(a => a.id !== editingAtt.value.id)
    selectedIds.delete(editingAtt.value.id)
    closeModal()
  } catch (e) {
    console.error('Failed to delete attendee', e)
  } finally {
    submitting.value = false
  }
}

// ── Bulk actions ──────────────────────────────────────────────────────────────
const bulkDeleting = ref(false)
const headerCb = ref(null)

function clearSelection() { selectedIds.clear() }

async function bulkDelete() {
  const ids = [...selectedIds]
  if (!ids.length) return
  if (!confirm(`Delete ${ids.length} attendee${ids.length !== 1 ? 's' : ''}? This cannot be undone.`)) return
  bulkDeleting.value = true
  try {
    await Promise.all(ids.map(id => deleteDoc(doc(db, 'events', eventId.value, 'attendees', id))))
    attendees.value = attendees.value.filter(a => !ids.includes(a.id))
    selectedIds.clear()
  } catch (e) {
    console.error('Failed to bulk delete', e)
  } finally {
    bulkDeleting.value = false
  }
}

watch([isAllPageSelected, isSomePageSelected], () => {
  if (headerCb.value) headerCb.value.indeterminate = isSomePageSelected.value
}, { flush: 'post' })

// ── Import flow ───────────────────────────────────────────────────────────────

const importPhase          = ref(0)          // 0=closed 1=file+type 2=map 3=preview
const importKardType       = ref('invitation')
const importFileName       = ref('')
const importHeaders        = ref([])         // [{ idx, label }]
const importRows           = ref([])         // raw rows (no header row)
const importMapping        = reactive({ name: null, phone: null, ahadi: null, mchango: null, card: null })
const importMapAhadi       = ref(true)
const importMapMchango     = ref(true)
const importSelectedLabels = ref([])
const importPreviewList    = ref([])
const importProcessing     = ref(false)
const importFileError      = ref('')
const importing            = ref(false)
const dropOver             = ref(false)
const fileInputRef         = ref(null)

function openImport() {
  importPhase.value = 1
  importKardType.value = 'invitation'
  importFileName.value = ''
  importHeaders.value = []
  importRows.value = []
  Object.assign(importMapping, { name: null, phone: null, ahadi: null, mchango: null, card: null })
  importMapAhadi.value = true
  importMapMchango.value = true
  importSelectedLabels.value = []
  importPreviewList.value = []
  importFileError.value = ''
  importProcessing.value = false
  fetchTemplates('invitation')
}

function closeImport() { importPhase.value = 0 }

function clearImportFile() {
  importFileName.value = ''
  importHeaders.value = []
  importRows.value = []
  importFileError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function onFileDrop(e) {
  dropOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) parseImportFile(file)
}

function handleImportFile(e) {
  const file = e.target.files?.[0]
  if (file) parseImportFile(file)
}

async function parseImportFile(file) {
  const validExts = ['xls', 'xlsx', 'xlsm', 'xlsb']
  const ext = file.name.split('.').pop().toLowerCase()
  if (!validExts.includes(ext)) {
    importFileError.value = 'Please select a valid Excel file (.xls, .xlsx, .xlsm, .xlsb)'
    return
  }
  importFileName.value = file.name
  importFileError.value = ''
  importProcessing.value = true
  try {
    const buf = await file.arrayBuffer()
    const wb  = XLSX.read(buf, { type: 'array', cellDates: true })
    const ws  = wb.Sheets[wb.SheetNames[0]]
    // header:1 → array of arrays; defval keeps empty cells as ''
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    if (!data.length) throw new Error('empty')
    const headerRow = data[0] ?? []
    importHeaders.value = headerRow.map((h, i) => ({
      idx:   i,
      label: String(h).trim() || `Column ${i + 1}`,
    }))
    // skip rows that are entirely blank
    importRows.value = data.slice(1).filter(row =>
      row.some(cell => cell !== '' && cell != null)
    )
    if (!importRows.value.length) {
      importFileError.value = 'The file has no data rows.'
      importFileName.value = ''
      return
    }
    Object.assign(importMapping, { name: null, phone: null, ahadi: null, mchango: null, card: null })
    importPhase.value = 2
  } catch (err) {
    console.error('parseImportFile', err)
    importFileError.value = 'Could not read the file. Ensure it is a valid Excel file.'
    importFileName.value = ''
  } finally {
    importProcessing.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

// Re-fetch templates and reset card selection when type changes in the import
watch(() => importKardType.value, type => {
  importMapping.card = null
  fetchTemplates(type)
})

function toggleImportLabel(id) {
  const idx = importSelectedLabels.value.indexOf(id)
  if (idx === -1) importSelectedLabels.value.push(id)
  else importSelectedLabels.value.splice(idx, 1)
}

function validateImportMapping() {
  if (importMapping.name === null)  return 'Select the column that contains the guest name.'
  if (importMapping.phone === null) return 'Select the column that contains the phone number.'
  const isContrib = importKardType.value === 'contribution' || importKardType.value === 'contact'
  if (isContrib && importMapAhadi.value && importMapping.ahadi === null)
    return 'Select the Pledges column or disable the toggle.'
  if (isContrib && importMapMchango.value && importMapping.mchango === null)
    return 'Select the Contribution column or disable the toggle.'
  if (importKardType.value !== 'contact' && !importMapping.card)
    return 'Select a card template.'
  return null
}

function proceedToPreview() {
  const err = validateImportMapping()
  if (err) { alert(err); return }
  importPreviewList.value = buildPreviewList()
  if (!importPreviewList.value.length) { alert('No valid rows found in the file.'); return }
  importPhase.value = 3
}

// ── Port of Flutter's transformNumber (helpers.dart) ─────────────────────────
// Normalises a raw phone string from Excel to E.164 digits (no +).
// Handles: BOM / invisible chars, Excel float decimals (255712345678.0),
// leading +, local 0-prefix, bare 7/6 9-digit numbers (TZ).
function transformNumber(raw) {
  let input = String(raw ?? '')
  // 1. Strip invisible / non-printable chars (BOM, zero-width spaces, etc.)
  input = input.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
  // 2. Excel stores phone numbers as floats → drop the decimal part
  if (input.includes('.')) input = input.split('.')[0]
  // 3. Remember whether the original had a leading + (foreign country code)
  const hadPlus = input.trimStart().startsWith('+')
  // 4. Strip everything that is not a digit
  input = input.replace(/\D/g, '')
  if (!input) return ''
  // 5. Normalise to TZ E.164 (no +)
  if (input.startsWith('255')) {
    // already correct — leave as-is
  } else if (hadPlus) {
    // foreign country code — keep digits as-is (e.g. 254…, 256…)
  } else if (input.startsWith('0') && input.length >= 10) {
    input = '255' + input.slice(1)
  } else if ((input.startsWith('7') || input.startsWith('6')) && input.length === 9) {
    input = '255' + input
  }
  // 6. Sanity: must be all digits and a plausible length (9–15)
  if (!/^\d{9,15}$/.test(input)) return ''
  return input
}

// ── Numeric cleaner for pledge / contribution amounts ─────────────────────────
// Handles: invisible chars, currency prefixes (TZS, $, etc.),
// thousands separators (commas, dots, spaces), European decimals,
// Excel scientific notation (1.5E+6), and negative values.
function cleanNumeric(raw) {
  let s = String(raw ?? '')
  // Strip invisible / non-printable chars
  s = s.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
  // Strip currency letters / symbols (e.g. "TZS", "$", "KSH ")
  s = s.replace(/[A-Za-z$€£¥₦₹]/g, '').trim()
  // If the value is already a JS number (SheetJS often returns real numbers), handle directly
  if (raw !== null && raw !== '' && !isNaN(Number(raw))) return Math.max(0, Number(raw))
  // Determine decimal separator: if both , and . exist, the last one is decimal
  const lastComma = s.lastIndexOf(',')
  const lastDot   = s.lastIndexOf('.')
  if (lastComma > lastDot) {
    // European style: 1.234.567,89 → remove dots, replace comma with dot
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    // US / default style: 1,234,567.89 → remove commas
    s = s.replace(/,/g, '')
  }
  // Remove any remaining spaces used as thousand-separators
  s = s.replace(/\s/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? 0 : Math.max(0, n)
}

function buildPreviewList() {
  const isContrib = importKardType.value === 'contribution' || importKardType.value === 'contact'
  return importRows.value
    .map(row => {
      const rawName  = String(row[importMapping.name]  ?? '').trim()
      const rawPhone = String(row[importMapping.phone] ?? '').trim()
      if (!rawName && !rawPhone) return null

      const phone = transformNumber(rawPhone)

      const pledgedAmount = (isContrib && importMapAhadi.value && importMapping.ahadi !== null)
        ? cleanNumeric(row[importMapping.ahadi]) : null
      const paidAmount    = (isContrib && importMapMchango.value && importMapping.mchango !== null)
        ? cleanNumeric(row[importMapping.mchango]) : null

      return {
        _id:           crypto.randomUUID(),
        fullName:      rawName.toUpperCase(),
        fullNameLower: rawName.toLowerCase(),
        phone,
        pledgedAmount,
        paidAmount,
        labelIds:      [...importSelectedLabels.value],
      }
    })
    .filter(Boolean)
}

async function runImport() {
  if (!importPreviewList.value.length || importing.value) return
  importing.value = true
  const uid            = auth.currentUser?.uid
  const templateCardId = importKardType.value === 'contact' ? 'contact' : importMapping.card
  const snapshot       = [...importPreviewList.value]   // copy so we can mutate the reactive list

  for (let i = 0; i < snapshot.length; i += 2) {
    const batch   = snapshot.slice(i, i + 2)
    const payload = batch.map(p => ({
      id:               p._id,
      cards:            {},
      checkinStatus:    [],
      createdAt:        new Date().toISOString(),
      email:            '',
      fullName:         p.fullName,
      fullNameLower:    p.fullNameLower,
      attendanceStatus: 'Not Confirmed',
      phone:            p.phone,
      messages:         {},
      messageIndexes:   [],
      labelIds:         p.labelIds,
      idComment:        'No Comment',
      ...(p.pledgedAmount != null ? { pledgedAmount: p.pledgedAmount } : {}),
      ...(p.paidAmount    != null ? { paidAmount:    p.paidAmount    } : {}),
    }))

    try {
      const res = await fetch(CREATE_ATTENDEES_URL, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${uid}` },
        body:    JSON.stringify({
          eventId:        eventId.value,
          attendees:      payload,
          templateCardId,
          usepng:         props.event?.usepng ?? true,
          kardType:       importKardType.value,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json.status) throw new Error(json.message ?? 'Server error')

      for (const result of (json.data ?? [])) {
        if (!result.status) continue
        const p   = batch.find(a => a._id === result.attendeeId)
        const idx = importPreviewList.value.findIndex(a => a._id === result.attendeeId)
        if (idx !== -1) importPreviewList.value.splice(idx, 1)
        // For contribution / contact: write a payment sub-collection entry when paidAmount > 0
        if (p && (importKardType.value === 'contribution' || importKardType.value === 'contact') && p.paidAmount) {
          setImportPayment(result.attendeeId, p.paidAmount)
        }
      }
    } catch (err) {
      console.error('Import batch error', err)
    }
  }

  importing.value = false
  if (!importPreviewList.value.length) {
    importPhase.value = 0
    await loadInitial()
  }
}

function setImportPayment(attendeeId, amount) {
  addDoc(
    collection(db, 'events', eventId.value, 'attendees', attendeeId, 'payments'),
    { amount: amount ?? 0, createdAt: new Date().toISOString() }
  ).catch(e => console.error('Payment entry error', e))
}
</script>

<style scoped>
.ea-root {
  padding: 28px 28px 80px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Toolbar ── */
.ea-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ea-search-wrap {
  flex: 1;
  min-width: 180px;
  position: relative;
  display: flex;
  align-items: center;
}
.ea-search-icon {
  position: absolute;
  left: 11px;
  pointer-events: none;
}
.ea-search {
  width: 100%;
  padding: 9px 34px 9px 34px;
  background: #FFFFFF;
  border: 0.8px solid #EBEBEA;
  border-radius: 10px;
  font-size: 13px;
  color: #1C1A18;
  outline: none;
  transition: border-color 150ms;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  font-family: inherit;
}
.ea-search:focus { border-color: #C9A84C; }
.ea-search::placeholder { color: #B5B0A8; }
.ea-search-clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #B5B0A8;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 3px;
  border-radius: 4px;
}
.ea-search-clear:hover { color: #6B6A68; }

.ea-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ea-filter-chips { display: flex; gap: 4px; }
.ea-chip {
  padding: 7px 13px;
  border-radius: 20px;
  border: 0.8px solid #EBEBEA;
  background: #FFFFFF;
  font-size: 12px;
  font-weight: 500;
  color: #8A8580;
  cursor: pointer;
  transition: all 140ms;
  font-family: inherit;
}
.ea-chip:hover { background: #F2F2F0; color: #6B6A68; }
.ea-chip--active {
  background: #FFF8EC;
  border-color: rgba(201,168,76,0.4);
  color: #C9A84C;
  font-weight: 600;
}
.ea-chip-cnt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  padding: 1px 5px;
  background: #EDEDEB;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #9A9690;
  margin-left: 5px;
  line-height: 1.4;
}
.ea-chip--active .ea-chip-cnt {
  background: rgba(201,168,76,0.2);
  color: #9A7218;
}

.ea-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #1C1A18;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms;
  font-family: inherit;
  flex-shrink: 0;
}
.ea-add-btn:hover { opacity: 0.82; }


/* ── Selection bar ── */
.ea-selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 16px;
  background: #1C1A18;
  border-radius: 12px;
  gap: 12px;
}
.ea-sel-count {
  font-size: 13px;
  font-weight: 600;
  color: #FFFFFF;
}
.ea-sel-actions { display: flex; gap: 8px; }
.ea-sel-btn {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: opacity 140ms;
}
.ea-sel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ea-sel-btn--ghost { background: rgba(255,255,255,0.15); color: #FFFFFF; }
.ea-sel-btn--ghost:hover { background: rgba(255,255,255,0.22); }
.ea-sel-btn--danger { background: #FF453A; color: #FFFFFF; }
.ea-sel-btn--danger:hover:not(:disabled) { opacity: 0.85; }

/* ── Table ── */
.ea-table-wrap {
  background: #FFFFFF;
  border: 0.8px solid #EBEBEA;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.ea-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.ea-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 780px;
}

/* Checkbox column */
.ea-th--cb, .ea-td--cb {
  width: 44px;
  padding-left: 16px;
  padding-right: 4px;
}
.ea-cb {
  width: 15px;
  height: 15px;
  accent-color: #1C1A18;
  cursor: pointer;
  display: block;
}

/* Head */
.ea-th {
  padding: 11px 16px;
  font-size: 11px;
  font-weight: 700;
  color: #8A8580;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  white-space: nowrap;
  background: #FAFAF9;
  border-bottom: 0.8px solid #EBEBEA;
  user-select: none;
}
.ea-th--sortable { cursor: pointer; }
.ea-th--sortable:hover { color: #1C1A18; }
.ea-th--right { text-align: right; }

/* Sort icon */
.ea-sort-icon {
  display: inline;
  vertical-align: middle;
  margin-left: 4px;
  opacity: 0.3;
  transition: opacity 150ms, transform 200ms;
}
.ea-sort-icon--active { opacity: 1; color: #C9A84C; }
.ea-sort-icon--desc { transform: rotate(180deg); }

/* Rows */
.ea-tr {
  border-bottom: 0.8px solid #F2F2F0;
  cursor: pointer;
  transition: background 120ms;
}
.ea-tr:last-child { border-bottom: none; }
.ea-tr:hover:not(.ea-tr--skeleton) { background: #FAFAF9; }
.ea-tr--skeleton { pointer-events: none; }
.ea-tr--selected { background: #FFFBF0 !important; }
.ea-tr--pending { box-shadow: inset 3px 0 0 #FF9F0A; }

/* Cells */
.ea-td {
  padding: 11px 16px;
  font-size: 13px;
  color: #1C1A18;
  vertical-align: middle;
  white-space: nowrap;
}
.ea-td--muted { color: #8A8580; font-size: 12px; }
.ea-td--right { text-align: right; }
.ea-td--date  { font-size: 12px; }

/* Name cell */
.ea-cell-name {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ea-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}
.ea-name-text {
  font-weight: 600;
  color: #1C1A18;
  white-space: nowrap;
}

/* Type badge */
.ea-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px 4px 8px;
  border-radius: 20px;
  white-space: nowrap;
  border: 0.8px solid transparent;
}
.ea-type-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ea-type-badge--invitation {
  background: rgba(0,122,255,0.07);
  color: #0066CC;
  border-color: rgba(0,122,255,0.18);
}
.ea-type-badge--invitation::before { background: #007AFF; }

.ea-type-badge--contribution {
  background: rgba(201,168,76,0.09);
  color: #9A7218;
  border-color: rgba(201,168,76,0.28);
}
.ea-type-badge--contribution::before { background: #C9A84C; }

.ea-type-badge--contact {
  background: rgba(142,142,147,0.08);
  color: #5A5A5E;
  border-color: rgba(142,142,147,0.2);
}
.ea-type-badge--contact::before { background: #8E8E93; }

/* Actions column */
.ea-th--actions, .ea-td--actions {
  width: 72px;
  padding-right: 12px;
}
.ea-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  opacity: 0;
  transition: opacity 140ms;
}
.ea-tr:hover .ea-row-actions { opacity: 1; }
.ea-tr--pending .ea-row-actions { opacity: 1; }
.ea-row-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 0.8px solid #EBEBEA;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 130ms;
  color: #8A8580;
  flex-shrink: 0;
}
.ea-row-btn:hover { background: #F2F2F0; color: #1C1A18; border-color: #D8D6D0; }
.ea-row-btn--edit:hover { color: #1C1A18; }
.ea-row-btn--refresh {
  color: #FF9F0A;
  border-color: rgba(255,159,10,0.3);
  background: rgba(255,159,10,0.06);
}
.ea-row-btn--refresh:hover {
  background: rgba(255,159,10,0.12);
  border-color: rgba(255,159,10,0.5);
  color: #FF9F0A;
}
.ea-row-btn--spinning svg { animation: ea-spin 0.9s linear infinite; }

/* Pending pill in Template column */
.ea-pending-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ea-tpl-name {
  font-size: 12px;
  color: #8A8580;
}
.ea-pending-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #FF9F0A;
  background: rgba(255,159,10,0.08);
  border: 0.8px solid rgba(255,159,10,0.28);
  border-radius: 6px;
  padding: 2px 7px 2px 5px;
  white-space: nowrap;
}

/* Status cell */
.ea-status-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}
.ea-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ea-status-text { font-size: 12px; font-weight: 500; color: #3A3936; }

/* Labels */
.ea-label-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 200px;
}
.ea-label-chip {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}
.ea-cell-dash { color: #D0CEC9; font-size: 13px; }

/* Skeleton */
.ea-sk-circle {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #F2F2F0 25%, #E8E8E6 50%, #F2F2F0 75%);
  background-size: 200% 100%;
  animation: ea-shimmer 1.3s infinite;
  flex-shrink: 0;
}
.ea-sk-bar {
  height: 9px;
  border-radius: 5px;
  background: linear-gradient(90deg, #F2F2F0 25%, #E8E8E6 50%, #F2F2F0 75%);
  background-size: 200% 100%;
  animation: ea-shimmer 1.3s infinite;
}
.ea-sk-bar--lg { width: 140px; }
.ea-sk-bar--md { width: 90px; }
.ea-sk-bar--sm { width: 60px; }

@keyframes ea-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Table footer & paginator ── */
.ea-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 0.8px solid #EBEBEA;
  background: #FAFAF9;
  gap: 12px;
  flex-wrap: wrap;
}
.ea-range-label {
  font-size: 12px;
  color: #8A8580;
  font-weight: 500;
  white-space: nowrap;
}
.ea-paginator {
  display: flex;
  align-items: center;
  gap: 3px;
}
.ea-page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 0.8px solid #EBEBEA;
  border-radius: 8px;
  background: #FFFFFF;
  font-size: 13px;
  font-weight: 500;
  color: #6B6A68;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 140ms;
  font-family: inherit;
}
.ea-page-btn:hover:not(:disabled):not(.ea-page-btn--active) {
  background: #F2F2F0;
  border-color: #D8D6D0;
  color: #1C1A18;
}
.ea-page-btn--active {
  background: #1C1A18;
  border-color: #1C1A18;
  color: #FFFFFF;
  font-weight: 600;
  cursor: default;
}
.ea-page-btn--nav { color: #8A8580; }
.ea-page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.ea-page-ellipsis {
  min-width: 28px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #B5B0A8;
  letter-spacing: 1px;
}

/* ── Empty state (inside table) ── */
.ea-td-empty {
  padding: 0 !important;
  text-align: center;
}
.ea-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px 60px;
  gap: 6px;
}
.ea-empty-graphic { margin-bottom: 10px; }
.ea-empty-title {
  font-size: 15px;
  font-weight: 700;
  color: #1C1A18;
  margin: 0;
}
.ea-empty-sub {
  font-size: 13px;
  color: #8A8580;
  margin: 0 0 14px;
  line-height: 1.5;
}
.ea-empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #1C1A18;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
}
.ea-empty-cta:hover { opacity: 0.82; }
.ea-empty-cta--ghost {
  background: #F2F2F0;
  color: #6B6A68;
}
.ea-empty-cta--ghost:hover { opacity: 1; background: #EBEBEA; }

/* ── Overlay ── */
.ea-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.28);
  z-index: 200;
  backdrop-filter: blur(2px);
}
.ea-overlay--center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Modal ── */
.ea-modal {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  overflow: hidden;
}
.ea-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 16px;
  border-bottom: 0.8px solid #F2F2F0;
}
.ea-modal-title { font-size: 16px; font-weight: 700; color: #1C1A18; margin: 0; }
.ea-modal-close {
  background: #F2F2F0;
  border: none;
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6B6A68;
  transition: background 140ms;
}
.ea-modal-close:hover { background: #EBEBEA; }

.ea-form {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ea-field { display: flex; flex-direction: column; gap: 6px; }
.ea-label { font-size: 12px; font-weight: 600; color: #6B6A68; }
.ea-required { color: #FF453A; }

.ea-input {
  padding: 9px 12px;
  border: 0.8px solid #EBEBEA;
  border-radius: 10px;
  font-size: 13px;
  color: #1C1A18;
  outline: none;
  background: #FAFAF9;
  transition: border-color 150ms, background 150ms;
  font-family: inherit;
}
.ea-input:focus { border-color: #C9A84C; background: #FFFFFF; }
.ea-input--error { border-color: #FF453A; }
.ea-field-error { font-size: 11px; color: #FF453A; }

.ea-type-row { display: flex; gap: 6px; }
.ea-type-change-note {
  font-size: 11px;
  color: #FF9F0A;
  margin: 0;
  padding: 6px 10px;
  background: rgba(255,159,10,0.07);
  border: 0.8px solid rgba(255,159,10,0.25);
  border-radius: 8px;
}
.ea-type-opt {
  flex: 1;
  padding: 8px;
  border: 0.8px solid #EBEBEA;
  border-radius: 10px;
  background: #FAFAF9;
  font-size: 12px;
  font-weight: 600;
  color: #8A8580;
  cursor: pointer;
  transition: all 140ms;
  font-family: inherit;
}
.ea-type-opt:hover { background: #F2F2F0; }
.ea-type-opt--active {
  background: #FFF8EC;
  border-color: rgba(201,168,76,0.4);
  color: #C9A84C;
}

/* ── Card template selector ── */
.ea-tpl-state {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8A8580;
  padding: 10px 0;
}
@keyframes ea-tpl-spin { to { transform: rotate(360deg); } }
.ea-tpl-spin { animation: ea-tpl-spin 0.9s linear infinite; flex-shrink: 0; }

.ea-tpl-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8A8580;
  background: #FAFAF9;
  border: 0.8px solid #EBEBEA;
  border-radius: 10px;
  padding: 12px 14px;
  line-height: 1.4;
}
.ea-tpl-empty strong { color: #6B6A68; font-weight: 600; }

.ea-tpl-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ea-tpl-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: 0.8px solid #EBEBEA;
  border-radius: 10px;
  background: #FAFAF9;
  font-size: 13px;
  font-weight: 500;
  color: #3A3936;
  cursor: pointer;
  text-align: left;
  transition: all 140ms;
  font-family: inherit;
}
.ea-tpl-opt:hover { background: #F2F2F0; border-color: #D8D6D0; }
.ea-tpl-opt--active {
  background: #FFF8EC;
  border-color: rgba(201,168,76,0.5);
  color: #9A7218;
  font-weight: 600;
}
.ea-tpl-opt--active svg:first-child { stroke: #C9A84C; }
.ea-tpl-check { margin-left: auto; color: #C9A84C; flex-shrink: 0; }

.ea-label-row { display: flex; flex-wrap: wrap; gap: 6px; }
.ea-label-toggle {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 140ms;
  font-family: inherit;
}

.ea-form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 4px;
  border-top: 0.8px solid #F2F2F0;
}
.ea-btn {
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms;
  border: none;
  font-family: inherit;
}
.ea-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ea-btn--primary { background: #1C1A18; color: #FFFFFF; }
.ea-btn--ghost   { background: #F2F2F0; color: #6B6A68; }
.ea-btn--danger  { background: rgba(255,69,58,0.1); color: #FF453A; }

/* ── Drawer ── */
.ea-drawer {
  position: fixed;
  right: 0; top: 0; bottom: 0;
  width: 360px;
  background: #FFFFFF;
  box-shadow: -2px 0 32px rgba(0,0,0,0.10);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 201;
}

.ea-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  flex-shrink: 0;
}
.ea-drawer-back {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 13px;
  color: #8A8580;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 8px;
  transition: all 130ms;
  font-family: inherit;
}
.ea-drawer-back:hover { background: #F2F2F0; color: #1C1A18; }
.ea-drawer-edit-btn {
  background: #F2F2F0;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #6B6A68;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 130ms;
  font-family: inherit;
}
.ea-drawer-edit-btn:hover { background: #EBEBEA; }

/* Hero */
.ea-drawer-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 24px 22px;
  background: #FAFAF9;
  border-top: 0.8px solid #F2F2F0;
  border-bottom: 0.8px solid #F2F2F0;
  gap: 4px;
}
.ea-drawer-avatar {
  width: 60px; height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  font-weight: 700;
  margin-bottom: 8px;
}
.ea-drawer-name {
  font-size: 17px;
  font-weight: 700;
  color: #1C1A18;
  margin: 0;
  letter-spacing: -0.2px;
}
.ea-drawer-phone {
  font-size: 13px;
  color: #8A8580;
  margin: 0;
}
.ea-drawer-hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.ea-drawer-tpl-name {
  font-size: 11px;
  font-weight: 600;
  color: #B5B0A8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Actions */
.ea-drawer-actions {
  display: flex;
  gap: 8px;
  padding: 14px 18px;
  border-bottom: 0.8px solid #F2F2F0;
}
.ea-action-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #F2F2F0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #1C1A18;
  text-decoration: none;
  transition: background 140ms;
}
.ea-action-pill:hover { background: #EBEBEA; }
.ea-action-pill--pending {
  color: #FF9F0A;
  background: rgba(255,159,10,0.08);
  cursor: default;
  gap: 6px;
}
.ea-action-pill--pending:hover { background: rgba(255,159,10,0.08); }
@keyframes ea-spin { to { transform: rotate(360deg); } }
.ea-spin { animation: ea-spin 1.1s linear infinite; flex-shrink: 0; }

/* Body blocks */
.ea-drawer-body {
  display: flex;
  flex-direction: column;
  padding: 6px 0 24px;
}
.ea-drawer-block {
  padding: 16px 20px;
}
.ea-block-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: #C0BAB2;
  margin: 0 0 10px;
}
.ea-label-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Status pills */
.ea-status-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ea-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border: 0.8px solid #EBEBEA;
  border-radius: 20px;
  background: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  color: #6B6A68;
  cursor: pointer;
  transition: all 140ms;
  font-family: inherit;
  white-space: nowrap;
}
.ea-status-pill:hover:not(:disabled) { background: #F2F2F0; }
.ea-status-pill:disabled { opacity: 0.6; cursor: wait; }
.ea-status-pill--active { font-weight: 700; }

.ea-att-dot-sm {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Contributions */
.ea-contrib-row { display: flex; gap: 10px; }
.ea-contrib-card {
  flex: 1;
  background: #FAFAF9;
  border: 0.8px solid #EBEBEA;
  border-radius: 12px;
  padding: 14px 16px;
}
.ea-contrib-label {
  display: block;
  font-size: 11px;
  color: #8A8580;
  font-weight: 500;
  margin-bottom: 4px;
}
.ea-contrib-val {
  font-size: 15px;
  font-weight: 700;
  color: #1C1A18;
}
.ea-contrib-val--paid { color: #30D158; }

/* Footer */
.ea-drawer-added {
  font-size: 12px;
  color: #C0BAB2;
  margin: 0;
  padding: 4px 20px 0;
}

/* ── Transitions ── */
.ea-fade-enter-active, .ea-fade-leave-active { transition: opacity 200ms ease; }
.ea-fade-enter-from, .ea-fade-leave-to { opacity: 0; }

.ea-scale-enter-active, .ea-scale-leave-active { transition: transform 220ms ease, opacity 220ms ease; }
.ea-scale-enter-from, .ea-scale-leave-to { transform: scale(0.96); opacity: 0; }

.ea-slide-right-enter-active, .ea-slide-right-leave-active { transition: transform 260ms ease; }
.ea-slide-right-enter-from, .ea-slide-right-leave-to { transform: translateX(100%); }

/* ══════════════════════════════════════════════════════════════
   VUE-TEL-INPUT OVERRIDES
   ══════════════════════════════════════════════════════════════ */

/* Outer wrapper — match ea-input sizing & border */
:deep(.ea-tel-input.vue-tel-input) {
  display: flex;
  align-items: stretch;
  border: 0.8px solid #EBEBEA;
  border-radius: 10px;
  background: #FAFAF9;
  box-shadow: none;
  font-family: inherit;
  transition: border-color 150ms, background 150ms;
  overflow: visible;
}
:deep(.ea-tel-input.vue-tel-input:focus-within) {
  border-color: #C9A84C;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(201,168,76,0.10);
}
:deep(.ea-tel-input--valid.vue-tel-input) { border-color: rgba(48,209,88,0.55); }
:deep(.ea-tel-input--invalid.vue-tel-input) { border-color: rgba(255,69,58,0.55); }

/* Country dropdown button */
:deep(.ea-tel-input .vti__dropdown) {
  border: none;
  border-right: 0.8px solid #EBEBEA;
  border-radius: 10px 0 0 10px;
  background: transparent;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: background 130ms;
  flex-shrink: 0;
}
:deep(.ea-tel-input .vti__dropdown:hover),
:deep(.ea-tel-input .vti__dropdown.open) {
  background: #F2F2F0;
}

/* Flag */
:deep(.ea-tel-input .vti__flag) {
  margin-right: 1px;
  border-radius: 2px;
}

/* Dial code shown next to flag */
:deep(.ea-tel-input .vti__selection .vti__country-code) {
  font-size: 12px;
  font-weight: 600;
  color: #3A3936;
  font-family: inherit;
}

/* Dropdown arrow */
:deep(.ea-tel-input .vti__dropdown-arrow) {
  font-size: 9px;
  color: #B5B0A8;
  margin-left: 2px;
}

/* The actual text input */
:deep(.ea-tel-input .vti__input) {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 9px 12px;
  font-size: 13px;
  color: #1C1A18;
  font-family: inherit;
  border-radius: 0 10px 10px 0;
  min-width: 0;
}
:deep(.ea-tel-input .vti__input::placeholder) { color: #B5B0A8; }

/* Dropdown list */
:deep(.ea-tel-input .vti__dropdown-list) {
  border: 0.8px solid #EBEBEA;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.10);
  background: #FFFFFF;
  z-index: 9999;
  padding: 6px;
  max-height: 260px;
  overflow-y: auto;
  width: 280px;
}
:deep(.ea-tel-input .vti__dropdown-list.below) { top: calc(100% + 6px); }
:deep(.ea-tel-input .vti__dropdown-list.above) { bottom: calc(100% + 6px); }

/* Search box inside dropdown */
:deep(.ea-tel-input .vti__search_box) {
  width: calc(100% - 16px);
  margin: 0 8px 6px;
  padding: 7px 10px;
  border: 0.8px solid #EBEBEA;
  border-radius: 8px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  background: #FAFAF9;
  color: #1C1A18;
  display: block;
}
:deep(.ea-tel-input .vti__search_box:focus) { border-color: #C9A84C; }

/* Country list items */
:deep(.ea-tel-input .vti__dropdown-item) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  font-size: 12px;
  color: #3A3936;
  font-family: inherit;
  border-radius: 8px;
  cursor: pointer;
  transition: background 100ms;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:deep(.ea-tel-input .vti__dropdown-item:hover) { background: #F2F2F0; }
:deep(.ea-tel-input .vti__dropdown-item.highlighted) {
  background: #FFF8EC;
  color: #9A7218;
  font-weight: 600;
}
:deep(.ea-tel-input .vti__dropdown-item strong) {
  font-weight: 600;
  color: #6B6A68;
  font-size: 11px;
  margin-left: auto;
  flex-shrink: 0;
}

/* ══════════════════════════════════════════════════════════════
   IMPORT STYLES
   ══════════════════════════════════════════════════════════════ */

/* ── Import toolbar button ── */
.ea-import-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #FFFFFF;
  color: #6B6A68;
  border: 0.8px solid #EBEBEA;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.ea-import-btn:hover {
  background: #FFF8EC;
  border-color: rgba(201,168,76,0.4);
  color: #C9A84C;
}

/* ── Import modal sizing ── */
.ea-imp-modal { max-width: 480px; }
.ea-imp-modal--tall { max-height: 88vh; display: flex; flex-direction: column; }

/* ── Import body ── */
.ea-imp-body {
  padding: 20px 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.ea-imp-body--scroll {
  overflow-y: auto;
  flex: 1;
  padding-bottom: 8px;
}

/* ── Type hint ── */
.ea-imp-type-hint {
  font-size: 11px;
  color: #8A8580;
  margin: 4px 0 0;
  line-height: 1.5;
}

/* ── Drop zone ── */
.ea-dropzone {
  border: 1.5px dashed #D8D6D0;
  border-radius: 14px;
  background: #FAFAF9;
  transition: all 180ms;
  position: relative;
  min-height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ea-dropzone--over {
  border-color: #C9A84C;
  background: #FFF8EC;
}
.ea-dropzone--filled {
  border-style: solid;
  border-color: rgba(201,168,76,0.45);
  background: #FFFCF5;
}
.ea-file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.ea-dropzone-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px;
  cursor: pointer;
  width: 100%;
  text-align: center;
}
.ea-drop-icon {
  width: 52px; height: 52px;
  background: #F2F2F0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #B5B0A8;
  margin-bottom: 4px;
  transition: background 180ms, color 180ms;
}
.ea-dropzone--over .ea-drop-icon {
  background: rgba(201,168,76,0.12);
  color: #C9A84C;
}
.ea-drop-title {
  font-size: 13px;
  font-weight: 600;
  color: #3A3936;
  margin: 0;
}
.ea-drop-sub {
  font-size: 12px;
  color: #8A8580;
  margin: 0;
}
.ea-drop-link { color: #C9A84C; font-weight: 600; }

/* ── File chosen state ── */
.ea-file-chosen {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  width: 100%;
}
.ea-file-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #3A3936;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ea-file-clear {
  background: #F2F2F0;
  border: none;
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6B6A68;
  flex-shrink: 0;
  transition: background 140ms;
}
.ea-file-clear:hover { background: #EBEBEA; }

/* ── Import error ── */
.ea-imp-error {
  font-size: 12px;
  color: #FF453A;
  margin: 0;
  padding: 8px 12px;
  background: rgba(255,69,58,0.06);
  border: 0.8px solid rgba(255,69,58,0.2);
  border-radius: 8px;
}

/* ── Phase 2 header back button ── */
.ea-imp-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ea-imp-back {
  background: #F2F2F0;
  border: none;
  width: 28px; height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6B6A68;
  transition: background 130ms;
}
.ea-imp-back:hover { background: #EBEBEA; }

/* ── File pill (phase 2) ── */
.ea-imp-file-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: #F2F2F0;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: #6B6A68;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* ── Section label ── */
.ea-imp-section { display: flex; flex-direction: column; gap: 12px; }
.ea-imp-section-label {
  font-size: 12px;
  font-weight: 700;
  color: #C9A84C;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}
.ea-imp-opt { font-weight: 500; color: #B5B0A8; text-transform: none; letter-spacing: 0; }

/* ── Label chip scroller ── */
.ea-imp-label-scroller {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ea-imp-label-chip {
  padding: 5px 13px;
  border-radius: 20px;
  border: 1px solid #EBEBEA;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 140ms;
  font-family: inherit;
}

/* ── Mapping rows ── */
.ea-map-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  background: #FAFAF9;
  border: 0.8px solid #EBEBEA;
  border-radius: 12px;
}
.ea-map-icon-wrap {
  width: 28px; height: 28px;
  background: rgba(201,168,76,0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ea-map-label {
  font-size: 12px;
  font-weight: 600;
  color: #3A3936;
  width: 110px;
  flex-shrink: 0;
}
.ea-map-select-wrap { flex: 1; }
.ea-map-select {
  width: 100%;
  padding: 7px 10px;
  border: 0.8px solid #EBEBEA;
  border-radius: 8px;
  background: #FFFFFF;
  font-size: 12px;
  color: #1C1A18;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 140ms;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23B5B0A8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 9px center;
  padding-right: 28px;
}
.ea-map-select:focus { border-color: #C9A84C; }
.ea-map-toggle-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}
.ea-map-loading, .ea-map-empty {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #8A8580;
}
.ea-map-skip {
  font-size: 11px;
  color: #B5B0A8;
  font-style: italic;
}

/* ── Toggle switch ── */
.ea-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}
.ea-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
.ea-toggle-track {
  width: 34px; height: 19px;
  background: #D8D6D0;
  border-radius: 10px;
  position: relative;
  transition: background 200ms;
}
.ea-toggle input:checked + .ea-toggle-track { background: #C9A84C; }
.ea-toggle-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 15px; height: 15px;
  background: #FFFFFF;
  border-radius: 50%;
  transition: transform 200ms;
  box-shadow: 0 1px 3px rgba(0,0,0,0.18);
}
.ea-toggle input:checked + .ea-toggle-track .ea-toggle-thumb {
  transform: translateX(15px);
}

/* ── Proceed button ── */
.ea-imp-proceed-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 12px;
  background: #1C1A18;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
  margin-top: 4px;
}
.ea-imp-proceed-btn:hover { opacity: 0.85; }

/* ── Phase 3: import drawer ── */
.ea-imp-drawer { width: 420px; display: flex; flex-direction: column; }

.ea-imp-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  flex-shrink: 0;
  border-bottom: 0.8px solid #F2F2F0;
}

.ea-imp-preview-hero {
  padding: 16px 20px 12px;
  border-bottom: 0.8px solid #F2F2F0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.ea-imp-preview-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1A18;
  margin: 0;
}
.ea-imp-preview-sub {
  font-size: 12px;
  color: #8A8580;
  margin: 0;
}
.ea-imp-preview-labels { display: flex; flex-wrap: wrap; gap: 5px; }

.ea-imp-tpl-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: #FAFAF9;
  border-bottom: 0.8px solid #F2F2F0;
  font-size: 11px;
  color: #8A8580;
  flex-shrink: 0;
}
.ea-imp-tpl-banner strong { color: #3A3936; }

/* ── Preview list ── */
.ea-imp-preview-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ea-imp-preview-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 13px;
  background: #FFFFFF;
  border: 0.8px solid #EBEBEA;
  border-radius: 12px;
  transition: background 120ms;
}
.ea-imp-preview-row:hover { background: #FAFAF9; }
.ea-imp-row-num {
  width: 24px; height: 24px;
  background: #F2F2F0;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #6B6A68;
  flex-shrink: 0;
}
.ea-imp-row-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ea-imp-row-name {
  font-size: 13px;
  font-weight: 600;
  color: #1C1A18;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ea-imp-row-phone { font-size: 11px; color: #8A8580; }
.ea-imp-row-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}
.ea-imp-amount {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}
.ea-imp-amount--pledge  { background: rgba(201,168,76,0.10); color: #9A7218; }
.ea-imp-amount--paid    { background: rgba(48,209,88,0.10);  color: #1A8C3A; }

.ea-imp-row-remove {
  background: none;
  border: none;
  color: #C0BAB2;
  cursor: pointer;
  width: 22px; height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 130ms;
  flex-shrink: 0;
  padding: 0;
}
.ea-imp-row-remove:hover { background: rgba(255,69,58,0.08); color: #FF453A; }

/* ── Empty import state ── */
.ea-imp-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 24px;
  text-align: center;
}

/* ── Footer: run button ── */
.ea-imp-drawer-footer {
  padding: 14px 16px;
  border-top: 0.8px solid #F2F2F0;
  flex-shrink: 0;
}
.ea-imp-run-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  background: #1C1A18;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
}
.ea-imp-run-btn:hover:not(:disabled) { opacity: 0.85; }
.ea-imp-run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
