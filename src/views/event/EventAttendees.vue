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
          </button>
        </div>
        <button class="ea-add-btn" @click="openAdd">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add
        </button>
      </div>
    </div>

    <!-- ── Summary row ── -->
    <div class="ea-summary" v-if="attendees.length">
      <span class="ea-summary-total">
        {{ filteredList.length }} attendee{{ filteredList.length !== 1 ? 's' : '' }}
      </span>
      <div class="ea-summary-pills">
        <span class="ea-type-pill ea-type-pill--invitation" v-if="typeCount.invitation">
          {{ typeCount.invitation }} invitation
        </span>
        <span class="ea-type-pill ea-type-pill--contribution" v-if="typeCount.contribution">
          {{ typeCount.contribution }} contribution
        </span>
        <span class="ea-type-pill ea-type-pill--contact" v-if="typeCount.contact">
          {{ typeCount.contact }} contact
        </span>
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
                  <input v-model="form.phone" class="ea-input" placeholder="+255 7XX XXX XXX" />
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
  getDocs, updateDoc, deleteDoc, deleteField, doc,
} from 'firebase/firestore'

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
  showModal.value = true
  fetchTemplates('invitation')
}

function openEdit(att) {
  editingAtt.value = att
  const type = getKardType(att)
  form.value = {
    name: att.fullName ?? '',
    phone: att.phone ?? '',
    kardType: type,
    templateCardId: att.cards?.[type]?.templateCardId ?? '',
    labelIds: [...(att.labelIds ?? [])],
  }
  formErr.value = { name: '', templateCardId: '' }
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
    const phone = form.value.phone.trim().replace(/^\+/, '')
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

/* ── Summary ── */
.ea-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ea-summary-total {
  font-size: 13px;
  font-weight: 600;
  color: #6B6A68;
}
.ea-summary-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.ea-type-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px 4px 8px;
  border-radius: 20px;
  border: 0.8px solid transparent;
}
.ea-type-pill::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ea-type-pill--invitation  { background: rgba(0,122,255,0.07); color: #0066CC; border-color: rgba(0,122,255,0.18); }
.ea-type-pill--invitation::before { background: #007AFF; }
.ea-type-pill--contribution { background: rgba(201,168,76,0.09); color: #9A7218; border-color: rgba(201,168,76,0.28); }
.ea-type-pill--contribution::before { background: #C9A84C; }
.ea-type-pill--contact     { background: rgba(142,142,147,0.08); color: #5A5A5E; border-color: rgba(142,142,147,0.2); }
.ea-type-pill--contact::before { background: #8E8E93; }

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
</style>
