<template>
  <div class="ea-root">

    <!-- ── Stat cards (Contacts view only — Guest List stays a clean table, withjoy-style) ── -->
    <div class="ea-stats" v-if="isContactsView && (!loading || attendees.length)">

      <!-- Contacts view -->
      <template>
        <div class="ea-stat-card">
          <div class="ea-stat-icon ea-stat-icon--teal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="ea-stat-body">
            <span class="ea-stat-lbl">Contact List</span>
            <span class="ea-stat-val">{{ typeCount.contact }}</span>
          </div>
        </div>
        <div class="ea-stat-card">
          <div class="ea-stat-icon ea-stat-icon--gold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div class="ea-stat-body">
            <span class="ea-stat-lbl">Contribution Cards</span>
            <span class="ea-stat-val">{{ typeCount.contribution }}</span>
          </div>
        </div>
        <div class="ea-stat-card">
          <div class="ea-stat-icon ea-stat-icon--purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="ea-stat-body">
            <span class="ea-stat-lbl">Total</span>
            <span class="ea-stat-val">{{ (typeCount.contact ?? 0) + (typeCount.contribution ?? 0) }}</span>
          </div>
        </div>
        <div class="ea-stat-card">
          <div class="ea-stat-icon ea-stat-icon--blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="ea-stat-body">
            <span class="ea-stat-lbl">Contributions</span>
            <span class="ea-stat-val">{{ attendees.filter(a => a.contributionPaid).length }}</span>
          </div>
        </div>
      </template>

    </div>

    <div class="ea-panel">

      <!-- ── Sticky head: title bar + toolbar + column header all move together and stay
           pinned while scrolling — only the row list scrolls underneath. ── -->
      <div class="ea-sticky-head">

      <!-- Panel header: hamburger + brand + title + wide inline search + primary CTA + settings —
           withjoy's single consolidated top row. The sidebar is hidden on this page (see
           EventLayout's isHubRoute), so this hamburger is the only way back into it. -->
      <div class="ea-panel-hd">
        <button class="ea-hd-burger" title="Menu" @click="navDrawer.open()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div class="ea-hd-sep"></div>

        <div class="ea-hd-icon-badge" @click="$router.push('/events')" title="All Events">
          <img v-if="brandLogoUrl && !brandLogoUrl.includes('icon-512')" :src="brandLogoUrl" :alt="brandName" class="ea-hd-brand-logo" />
          <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>

        <div class="ea-hd-sep"></div>

        <div class="ea-hd-title-group">
          <h2 class="ea-panel-title">{{ isContactsView ? 'Contact List' : 'Guest List' }}</h2>
          <span class="ea-title-count-badge" v-if="!loading">{{ attendees.length }}</span>
        </div>

        <div class="ea-search-wrap ea-search-inline">
          <svg class="ea-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQ" class="ea-search" placeholder="Search by name or phone…" />
          <button v-if="searchQ" class="ea-search-clear" @click="searchQ = ''">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <span v-else class="ea-search-filter" title="Filter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          </span>
        </div>

        <button class="ea-send-btn" @click="showSendModal = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Send
        </button>

        <button class="ea-add-btn" @click="openAdd">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ addLabel }}
        </button>

        <button class="ea-hd-gear" title="Settings" @click="$router.push(`/event/${eventId}/settings`)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <!-- ── Secondary toolbar: icon-over-label buttons, withjoy style — only real actions ── -->
      <div class="ea-toolbar2">
        <!-- Groups dropdown -->
        <div class="ea-label-select" ref="labelSelectRef">
          <button class="ea-tb2-btn" :class="{ 'ea-tb2-btn--active': filterLabelId }" @click="labelDropOpen = !labelDropOpen">
            <span class="ea-tb2-ic">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </span>
            <span class="ea-tb2-lbl">
              {{ filterLabelId ? (localLabels.find(l => l.id === filterLabelId)?.name ?? 'Groups') : 'Groups' }}
              <span v-if="localLabels.length && !filterLabelId" class="ea-tb2-cnt">{{ localLabels.length }}</span>
            </span>
            <svg class="ea-tb2-chev" :class="{ 'ea-tb2-chev--open': labelDropOpen }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div v-if="labelDropOpen" class="ea-type-drop">
            <button class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': !filterLabelId }"
              @click="filterLabelId = null; labelDropOpen = false">
              All
              <span class="ea-type-drop-cnt">{{ attendees.length }}</span>
            </button>
            <template v-if="localLabels.length">
              <div class="ea-label-drop-sep"/>
              <button v-for="lbl in localLabels" :key="lbl.id"
                class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': filterLabelId === lbl.id }"
                @click="filterLabelId = filterLabelId === lbl.id ? null : lbl.id; labelDropOpen = false">
                <span style="display:flex;align-items:center;gap:7px;">
                  <span class="ea-lf-dot" :style="{ background: labelFg(lbl) }"/>
                  {{ lbl.name }}
                </span>
              </button>
            </template>
          </div>
        </div>

        <!-- Manage Groups — a separate always-visible action, not nested in the
             filter dropdown (matches withjoy treating Assign Tags / Manage Tags
             as two distinct toolbar icons rather than one combined menu). -->
        <button class="ea-tb2-btn" @click="showLabelManager = true">
          <span class="ea-tb2-ic">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </span>
          <span class="ea-tb2-lbl">Manage Groups</span>
        </button>

        <!-- Card filter dropdown -->
        <div v-if="cardDropTemplates.length" class="ea-label-select" ref="cardDropRef">
          <button class="ea-tb2-btn" :class="{ 'ea-tb2-btn--active': filterCardId }" @click="cardDropOpen = !cardDropOpen">
            <span class="ea-tb2-ic">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                <rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </span>
            <span class="ea-tb2-lbl">
              {{ filterCardId ? (allTemplatesMap[filterCardId] ?? 'Card') : 'Card' }}
              <span v-if="!filterCardId" class="ea-tb2-cnt">{{ cardDropTemplates.length }}</span>
            </span>
            <svg class="ea-tb2-chev" :class="{ 'ea-tb2-chev--open': cardDropOpen }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div v-if="cardDropOpen" class="ea-type-drop">
            <button class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': !filterCardId }"
              @click="filterCardId = null; cardDropOpen = false">
              All cards
              <span class="ea-type-drop-cnt">{{ cardDropTemplates.length }}</span>
            </button>
            <div class="ea-label-drop-sep"/>
            <button v-for="tpl in cardDropTemplates" :key="tpl.id"
              class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': filterCardId === tpl.id }"
              @click="filterCardId = filterCardId === tpl.id ? null : tpl.id; cardDropOpen = false">
              {{ tpl.name || '—' }}
              <span class="ea-type-drop-cnt">{{ cardAttendeeCount[tpl.id] ?? 0 }}</span>
            </button>
          </div>
        </div>

        <div class="ea-tb2-divider" />

        <!-- From Contact List (Guest List view only) -->
        <button v-if="!isContactsView" class="ea-tb2-btn" @click="openContactPicker">
          <span class="ea-tb2-ic">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <polyline points="17 11 19 13 23 9"/>
            </svg>
          </span>
          <span class="ea-tb2-lbl">From Contacts</span>
        </button>

        <!-- Import -->
        <button class="ea-tb2-btn" @click="openImport">
          <span class="ea-tb2-ic">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </span>
          <span class="ea-tb2-lbl">Import</span>
        </button>

        <!-- Refresh -->
        <button class="ea-tb2-btn" @click="loadInitial" :disabled="loading" title="Refresh attendees">
          <span class="ea-tb2-ic">
            <svg :class="{ 'ea-spin': loading }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </span>
          <span class="ea-tb2-lbl">Refresh</span>
        </button>

        <!-- Selection actions — appear inline once rows are checked, instead of a
             separate banner, matching withjoy's toolbar (icons stay in one place). -->
        <template v-if="selectedIds.size">
          <div class="ea-tb2-divider" />
          <button class="ea-tb2-btn" @click="clearSelection">
            <span class="ea-tb2-ic">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </span>
            <span class="ea-tb2-lbl">Clear</span>
          </button>
          <div class="ea-label-select" v-if="localLabels.length">
            <button class="ea-tb2-btn" @click="bulkLabelOpen = !bulkLabelOpen">
              <span class="ea-tb2-ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </span>
              <span class="ea-tb2-lbl">Group</span>
            </button>
            <div v-if="bulkLabelOpen" class="ea-bulk-label-drop">
              <button v-for="lbl in localLabels" :key="lbl.id"
                class="ea-bld-item" @click="applyBulkLabel(lbl.id)">
                <span class="ea-bld-dot" :style="{ background: labelFg(lbl) }"></span>
                {{ lbl.name }}
              </button>
              <div class="ea-bld-divider"></div>
              <button class="ea-bld-item ea-bld-item--clear" @click="applyBulkLabel(null)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Remove all groups
              </button>
            </div>
          </div>
          <button class="ea-tb2-btn ea-tb2-btn--danger" :disabled="bulkDeleting" @click="bulkDelete">
            <span class="ea-tb2-ic">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </span>
            <span class="ea-tb2-lbl">{{ bulkDeleting ? 'Deleting…' : 'Delete' }}</span>
          </button>
          <span class="ea-tb2-sel-count">{{ selectedIds.size }} selected</span>
        </template>
      </div>

      <!-- ── Type tabs (Contacts view only) ── -->
      <div v-if="isContactsView" class="ea-tabs-row">
        <div class="ea-tabs">
          <button v-for="f in typeFilters" :key="f.val"
            class="ea-tab" :class="{ 'ea-tab--active': activeType === f.val }"
            @click="activeType = f.val">
            {{ f.label }}
            <span class="ea-tab-cnt">{{ f.val === 'all' ? attendees.length : (typeCount[f.val] ?? 0) }}</span>
          </button>
        </div>
      </div>

      <!-- ── Column header row (both views) ── -->
      <div class="ea-row-grid ea-col-head" v-if="displayList.length">
        <label class="ea-col-cb" @click.stop>
          <input type="checkbox" class="ea-cb" ref="headerCb" :checked="isAllPageSelected" @change="toggleSelectAll" />
        </label>
        <span class="ea-col-avatar" />
        <button class="ea-col-btn" @click="toggleSort('name')">
          Name
          <svg class="ea-sort-icon"
            :class="{ 'ea-sort-icon--active': sortKey === 'name', 'ea-sort-icon--desc': sortKey === 'name' && sortDir === 'desc' }"
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
        <span class="ea-col-lbl">Phone</span>
        <span class="ea-col-lbl">Groups</span>
        <button class="ea-col-btn ea-col-btn--right" @click="toggleSort('date')">
          Added
          <svg class="ea-sort-icon"
            :class="{ 'ea-sort-icon--active': sortKey === 'date', 'ea-sort-icon--desc': sortKey === 'date' && sortDir === 'desc' }"
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
        <span class="ea-col-actions" />
      </div>

      </div> <!-- /.ea-sticky-head -->

    <!-- ── Card list ── -->
    <div class="ea-table-wrap">

      <!-- Skeleton cards on initial load -->
      <div v-if="loading && !attendees.length" class="ea-list">
        <div v-for="n in 8" :key="`sk-${n}`" class="ea-row-grid ea-card ea-card--sk">
          <span />
          <div class="ea-card-av-wrap">
            <div class="ea-sk-circle ea-sk-circle--card" />
          </div>
          <div class="ea-sk-bar ea-sk-bar--lg" />
          <div class="ea-sk-bar ea-sk-bar--md" />
          <div class="ea-sk-bar ea-sk-bar--sm" />
          <div class="ea-sk-bar ea-sk-bar--sm" />
          <span />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && !filteredList.length" class="ea-empty">
        <div class="ea-empty-graphic">
          <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#242424"/>
            <circle cx="26" cy="22" r="7" fill="#DDDBD6"/>
            <path d="M12 44c0-7.732 6.268-14 14-14h0c7.732 0 14 6.268 14 14" stroke="#DDDBD6" stroke-width="3" stroke-linecap="round" fill="none"/>
            <circle cx="44" cy="24" r="5" fill="#B8924D" fill-opacity="0.25" stroke="#B8924D" stroke-width="1.5"/>
            <line x1="44" y1="21" x2="44" y2="27" stroke="#B8924D" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="41" y1="24" x2="47" y2="24" stroke="#B8924D" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <template v-if="!searchQ && activeType === 'all'">
          <p class="ea-empty-title">No {{ personLabelPlural }} yet</p>
          <p class="ea-empty-sub">Add your first {{ personLabel.toLowerCase() }} to get started.</p>
          <button class="ea-empty-cta" @click="openAdd">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ addLabel }}
          </button>
        </template>
        <template v-else-if="!searchQ && activeType !== 'all'">
          <p class="ea-empty-title">No {{ personLabelPlural }} here</p>
          <p class="ea-empty-sub">There are no {{ personLabelPlural.toLowerCase() }} yet.<br>{{ isContactsView ? 'Switch tabs or add one now.' : 'Add one to get started.' }}</p>
          <button class="ea-empty-cta" @click="openAdd">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add {{ capitalize(activeType) }}
          </button>
        </template>
        <template v-else>
          <p class="ea-empty-title">No results for "{{ searchQ }}"</p>
          <p class="ea-empty-sub">Check the spelling or try a different<br>name or phone number.</p>
          <button class="ea-empty-cta ea-empty-cta--ghost" @click="searchQ = ''">Clear search</button>
        </template>
      </div>

      <!-- Row list — real columns, aligned to .ea-col-head above -->
      <div v-else class="ea-list">
        <div v-for="att in displayList" :key="att.id"
          class="ea-row-grid ea-card"
          :class="[
            `ea-card--${getKardType(att)}`,
            { 'ea-card--pending': isCardPending(att), 'ea-card--selected': selectedIds.has(att.id) }
          ]"
          @click="openDetail(att)">

          <!-- Select checkbox -->
          <label class="ea-col-cb" @click.stop>
            <input type="checkbox" class="ea-cb" :checked="selectedIds.has(att.id)" @change="toggleSelect(att.id)" />
          </label>

          <!-- Avatar with type dot (only on Contacts view) -->
          <div class="ea-card-av-wrap">
            <div class="ea-card-avatar"
              :style="{ background: avatarBg(att.fullName), color: avatarColor(att.fullName) }">
              {{ initials(att.fullName) }}
            </div>
            <span class="ea-card-type-dot" v-if="isContactsView" />
          </div>

          <!-- Name -->
          <span class="ea-card-name" :title="att.fullName">
            <span class="ea-card-name-txt">{{ formatDisplayName(att.fullName) }}</span>
            <span v-if="isCardPending(att)" class="ea-pending-pill">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.5" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Rendering
            </span>
          </span>

          <!-- Phone -->
          <span class="ea-card-meta">{{ formatPhoneDisplay(att.phone) }}</span>

          <!-- Groups -->
          <span class="ea-cell ea-cell--groups">
            <template v-if="attLabels(att).length">
              <span v-for="lbl in attLabels(att)" :key="lbl.id" class="ea-label-chip"
                :style="{ background: labelBg(lbl), color: labelFg(lbl) }">
                {{ lbl.name }}
              </span>
            </template>
            <span v-else class="ea-groups-empty">—</span>
          </span>

          <!-- Date -->
          <span class="ea-card-date">{{ formatDate(att.createdAt) }}</span>

          <!-- Row action buttons (shown on hover or when pending) -->
          <div class="ea-card-actions" @click.stop>
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
        </div>
      </div>

      <!-- Footer: record range + paginator -->
      <div class="ea-table-footer">
        <span class="ea-range-label">
          {{ filteredList.length ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredList.length)}` : '0' }}
          of {{ filteredList.length }}
        </span>
        <div class="ea-paginator" :class="{ 'ea-paginator--disabled': totalPages <= 1 }">
          <!-- Prev -->
          <button class="ea-page-btn ea-page-btn--nav"
            :disabled="currentPage === 1 || totalPages <= 1" @click="goToPage(currentPage - 1)">
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
              :disabled="totalPages <= 1"
              @click="goToPage(p)">
              {{ p }}
            </button>
          </template>
          <!-- Next -->
          <button class="ea-page-btn ea-page-btn--nav"
            :disabled="currentPage === totalPages || totalPages <= 1" @click="goToPage(currentPage + 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Add / Edit Guest Drawer (WithJoy Experience) ── -->
    <Teleport to="body">
      <Transition name="ea-fade">
        <div v-if="showModal" class="ea-overlay" @click.self="closeModal">
          <Transition name="ea-slide-right">
            <div class="ea-add-drawer" v-if="showModal">

              <!-- Drawer Header -->
              <div class="ea-add-drawer-header">
                <h3 class="ea-add-drawer-title">
                  {{ phonePickerMode ? 'From Contacts' : editingAtt ? 'Edit Guest' : 'Add Guests' }}
                </h3>
                <div class="ea-add-drawer-actions">
                  <!-- From Phonebook button -->
                  <button v-if="!editingAtt && !phonePickerMode"
                    type="button" class="ea-add-phonebook-btn" @click="openPhonePicker" title="Import from phone contacts">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>From Phone</span>
                  </button>

                  <button v-if="phonePickerMode" type="button" class="ea-add-phonebook-back-btn" @click="exitPhonePickerMode">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Back
                  </button>

                  <button type="button" class="ea-add-help-btn" @click="showHelpInfo">Help</button>

                  <button type="button" class="ea-add-close-btn" @click="closeModal" title="Close">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Drawer Form / Body -->
              <form @submit.prevent="phonePickerMode ? submitPhonePicker() : submitForm()" class="ea-add-drawer-form">
                <div class="ea-add-drawer-scroll">

                  <!-- Phone-book batch review if active -->
                  <template v-if="phonePickerMode">
                    <div class="ea-pb-list">
                      <div v-for="(c, i) in phonePickerContacts" :key="i"
                        class="ea-pb-row" :class="{ 'ea-pb-row--excluded': !c.include }">
                        <div class="ea-pb-avatar">{{ c.name.charAt(0).toUpperCase() }}</div>
                        <div class="ea-pb-info">
                          <span class="ea-pb-name">{{ c.name }}</span>
                          <span class="ea-pb-phone">{{ c.phone || 'No phone' }}</span>
                        </div>
                        <button type="button" class="ea-pb-toggle"
                          :class="{ 'ea-pb-toggle--off': !c.include }"
                          @click="c.include = !c.include">
                          <svg v-if="c.include" width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </template>

                  <!-- Main WithJoy Guest Entry -->
                  <template v-else>

                    <!-- WithJoy Banner Card: Magic Link & Spreadsheet -->
                    <div v-if="!editingAtt" class="ea-add-banner">
                      <div class="ea-add-banner-row">
                        <span class="ea-add-banner-text">Populate your guest list with a single magic link.</span>
                        <button type="button" class="ea-add-banner-link" @click="copyMagicLink">Try Contact Collector</button>
                      </div>
                      <div class="ea-add-banner-divider" />
                      <div class="ea-add-banner-row ea-add-banner-row--spread">
                        <span class="ea-add-banner-sub">Have a contact list already?</span>
                        <button type="button" class="ea-add-banner-upload-btn" @click="triggerUploadSpreadsheet">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          Upload Spreadsheet
                        </button>
                      </div>
                    </div>

                    <!-- Party Type Segmented Capsule -->
                    <div class="ea-add-party-capsule">
                      <button
                        type="button"
                        class="ea-party-tab"
                        :class="{ 'ea-party-tab--active': form.partyType === 'individual' }"
                        @click="setPartyType('individual')"
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        class="ea-party-tab"
                        :class="{ 'ea-party-tab--active': form.partyType === 'couple' }"
                        @click="setPartyType('couple')"
                      >
                        Couple
                      </button>
                      <button
                        type="button"
                        class="ea-party-tab"
                        :class="{ 'ea-party-tab--active': form.partyType === 'family' }"
                        @click="setPartyType('family')"
                      >
                        Family
                      </button>
                    </div>

                    <!-- Contact Info Section -->
                    <div class="ea-add-section">
                      <h4 class="ea-add-section-title">Contact Info</h4>

                      <!-- Title (Optional) -->
                      <div class="ea-add-field">
                        <label class="ea-add-label">Title</label>
                        <input v-model="form.title" class="ea-add-input" placeholder="e.g. Mr, Mrs, Dr" />
                      </div>

                      <!-- Full Name* -->
                      <div class="ea-add-field">
                        <label class="ea-add-label">Full Name <span class="ea-add-req-star">*</span></label>
                        <input
                          v-model="form.name"
                          class="ea-add-input"
                          :class="{ 'ea-add-input--error': formErr.name }"
                          placeholder="First and last name"
                          @blur="validateForm"
                        />
                        <span v-if="formErr.name" class="ea-field-error">{{ formErr.name }}</span>
                      </div>

                      <!-- Mobile Phone -->
                      <div class="ea-add-field">
                        <label class="ea-add-label">Mobile Phone</label>
                        <VueTelInput
                          v-model="form.phone"
                          class="ea-tel-input ea-add-tel"
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
                        <!-- Duplicate warning -->
                        <div v-if="addFormDuplicate" class="ea-add-dup-warn">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          <span class="ea-add-dup-warn-text">Phone already in this event</span>
                          <div class="ea-imp-dup-compare">
                            <span class="ea-imp-dup-compare-label">In DB:</span>
                            <span class="ea-imp-dup-compare-name">{{ addFormDuplicate.fullName }}</span>
                            <span class="ea-imp-dup-compare-sep">·</span>
                            <span class="ea-imp-dup-compare-phone">{{ addFormDuplicate.phone }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Email -->
                      <div class="ea-add-field">
                        <label class="ea-add-label">Email</label>
                        <input v-model="form.email" type="email" class="ea-add-input" placeholder="your@email.com" />
                      </div>

                      <!-- Collapsible Mailing Address -->
                      <div class="ea-add-collapse">
                        <button type="button" class="ea-add-collapse-btn" @click="form.showMailingAddress = !form.showMailingAddress">
                          <span class="ea-add-collapse-label">Mailing Address</span>
                          <svg class="ea-add-collapse-chev" :class="{ 'ea-add-collapse-chev--open': form.showMailingAddress }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                        <div v-if="form.showMailingAddress" class="ea-add-collapse-content">
                          <div class="ea-add-field">
                            <label class="ea-add-label">Street Address</label>
                            <input v-model="form.address.street" class="ea-add-input" placeholder="Street address or P.O. Box" />
                          </div>
                          <div class="ea-add-row-2">
                            <div class="ea-add-field">
                              <label class="ea-add-label">City</label>
                              <input v-model="form.address.city" class="ea-add-input" placeholder="City" />
                            </div>
                            <div class="ea-add-field">
                              <label class="ea-add-label">State / Region</label>
                              <input v-model="form.address.state" class="ea-add-input" placeholder="State or Region" />
                            </div>
                          </div>
                          <div class="ea-add-row-2">
                            <div class="ea-add-field">
                              <label class="ea-add-label">Postal Code</label>
                              <input v-model="form.address.zip" class="ea-add-input" placeholder="ZIP / Postal Code" />
                            </div>
                            <div class="ea-add-field">
                              <label class="ea-add-label">Country</label>
                              <input v-model="form.address.country" class="ea-add-input" placeholder="Country" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Additional Party Members -->
                      <div v-if="form.partyMembers.length" class="ea-add-members-list">
                        <div v-for="(member, mIdx) in form.partyMembers" :key="member.id" class="ea-add-member-card">
                          <div class="ea-add-member-hd">
                            <span class="ea-add-member-title">Party Member #{{ mIdx + 2 }}</span>
                            <button type="button" class="ea-add-member-remove" @click="removePartyMember(mIdx)" title="Remove member">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Remove
                            </button>
                          </div>
                          <div class="ea-add-field">
                            <label class="ea-add-label">Full Name <span class="ea-add-req-star">*</span></label>
                            <input v-model="member.name" class="ea-add-input" placeholder="Member full name" />
                          </div>
                          <div class="ea-add-row-2">
                            <div class="ea-add-field">
                              <label class="ea-add-label">Phone</label>
                              <input v-model="member.phone" class="ea-add-input" placeholder="Phone number" />
                            </div>
                            <div class="ea-add-field">
                              <label class="ea-add-label">Relationship</label>
                              <input v-model="member.relation" class="ea-add-input" placeholder="e.g. Spouse, Child, +1" />
                            </div>
                          </div>
                          <div class="ea-add-field">
                            <label class="ea-add-label">Email</label>
                            <input v-model="member.email" type="email" class="ea-add-input" placeholder="member@email.com" />
                          </div>
                        </div>
                      </div>

                      <!-- Add a member to this party Button -->
                      <button type="button" class="ea-add-party-btn" @click="addPartyMember">
                        <svg class="ea-add-party-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="16"/>
                          <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                        <span>Add a member to this party</span>
                      </button>

                      <!-- Groups / Labels Toggle -->
                      <div class="ea-add-field" v-if="eventLabels.length" style="margin-top: 14px;">
                        <label class="ea-add-label">Groups / Tags</label>
                        <div class="ea-label-row">
                          <button v-for="lbl in eventLabels" :key="lbl.id" type="button"
                            class="ea-label-toggle"
                            :style="{
                              borderColor: labelFg(lbl),
                              color: form.labelIds.includes(lbl.id) ? labelFg(lbl) : '#888',
                              background: form.labelIds.includes(lbl.id) ? labelBg(lbl) : 'transparent'
                            }"
                            @click="toggleLabel(lbl.id)">
                            {{ lbl.name }}
                          </button>
                        </div>
                      </div>

                    </div>
                  </template>

                </div>

                <!-- Drawer Sticky Footer -->
                <div class="ea-add-drawer-footer">
                  <span class="ea-add-req-hint">*Required fields</span>
                  <div class="ea-add-footer-btns">
                    <button v-if="editingAtt" type="button" class="ea-add-del-btn" @click="deleteAttendee" :disabled="submitting">
                      Delete
                    </button>
                    <button type="button" class="ea-add-cancel-btn" @click="closeModal">
                      Cancel
                    </button>
                    <button type="submit" class="ea-add-save-btn" :disabled="submitting">
                      {{ submitting ? 'Saving…' : phonePickerMode ? `Add ${phonePickerContacts.filter(c=>c.include).length} Contacts` : 'Save Details' }}
                    </button>
                  </div>
                </div>

              </form>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Send modal — "Card" is still just a visual placeholder; "Message"
         leads into a Campaigns screen (same Firestore data/shape as the full
         Bulk Messages page) that opens straight on the message-intent presets
         — no separate "New Campaign" step for the user to know about. Picking
         a preset creates its draft campaign in the background and jumps
         straight into composing/sending it. ── -->
    <Teleport to="body">
      <Transition name="ea-fade">
        <div v-if="showSendModal" class="ea-overlay ea-overlay--center" @click.self="closeSendModal">
          <Transition name="ea-sheet">
            <div class="ea-modal ea-send-modal" v-if="showSendModal">
              <div class="ea-modal-header ea-send-modal-header" :class="{
                'ea-send-modal-header--nav': sendStep === 'campaigns',
                'ea-send-modal-header--centered': sendStep === 'card'
              }">
                <div class="ea-send-modal-header-side ea-send-modal-header-side--left">
                  <button v-if="sendStep !== 'root'" class="ea-send-back"
                    @click="sendStep = 'root'" title="Back">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                </div>
                <h3 class="ea-modal-title">
                  {{ sendStep === 'root' ? 'What would you like to send?' : sendStep === 'card' ? 'Card' : 'Campaigns' }}
                </h3>
                <div class="ea-send-modal-header-side ea-send-modal-header-side--right">
                  <button class="ea-modal-close" @click="closeSendModal" title="Close">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.2" stroke-linecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Step 1: Card / Message -->
              <div class="ea-send-opts" v-if="sendStep === 'root'">
                <div class="ea-send-opt" @click="openCardStep">
                  <div class="ea-send-opt-art">
                    <div class="ea-send-opt-box ea-send-opt-box--card">
                      <span class="ea-pcard ea-pcard--1" />
                      <span class="ea-pcard ea-pcard--2" />
                      <span class="ea-pcard ea-pcard--3" />
                    </div>
                  </div>
                  <span class="ea-send-opt-title">Card</span>
                  <span class="ea-send-opt-desc">Save the Dates, Invites, and more.</span>
                </div>
                <div class="ea-send-opt" @click="openMessageStep">
                  <div class="ea-send-opt-art">
                    <div class="ea-send-opt-box ea-send-opt-box--msg">
                      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                  </div>
                  <span class="ea-send-opt-title">Message</span>
                  <span class="ea-send-opt-desc">Reminders, texts, and emails.</span>
                </div>
              </div>

              <!-- Step 2: Card selection (WithJoy exact match) -->
              <div class="ea-send-card-list" v-else-if="sendStep === 'card'">
                <div
                  v-for="cardOpt in CARD_OPTIONS"
                  :key="cardOpt.id"
                  class="ea-send-card-item"
                  @click="selectCardOption(cardOpt)"
                >
                  <div class="ea-send-card-icon" v-html="cardOpt.icon" />
                  <div class="ea-send-card-info">
                    <span class="ea-send-card-name">{{ cardOpt.title }}</span>
                    <span class="ea-send-card-desc">{{ cardOpt.desc }}</span>
                  </div>
                  <svg class="ea-send-card-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>

              <!-- Step 2: Campaigns — opens straight on the message-intent presets
                   (no separate "New Campaign" click to get there); picking one
                   creates its draft campaign right away and jumps into
                   composing/sending it. Past campaigns, if any, are listed
                   below for reopening/resending. -->
              <div class="ea-send-camps" v-else>
                <div class="ea-send-camps-list">
                  <div v-for="label in PRESET_CAMPAIGNS" :key="label" class="ea-send-camp-row"
                    :class="{ 'ea-send-camp-row--disabled': creatingPresetCamp }"
                    @click="createPresetCampaign(label)">
                    <span class="ea-send-camp-icon">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </span>
                    <span class="ea-send-camp-text">
                      <span class="ea-send-camp-name">{{ label }}</span>
                    </span>
                    <svg class="ea-send-camp-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>

                <div v-if="loadingSendCampaigns" class="ea-send-camps-loading">Loading past campaigns…</div>
                <template v-else-if="sendCampaigns.length">
                  <p class="ea-send-camps-divider">Past Campaigns</p>
                  <div class="ea-send-camps-list">
                    <div v-for="camp in sendCampaigns" :key="camp.id" class="ea-send-camp-row"
                      @click="$router.push(`/event/${eventId}/bulk-messages?campaign=${camp.id}&send=1&returnTo=${encodeURIComponent(`/event/${eventId}/attendees?reopenCampaigns=1`)}`)">
                      <span class="ea-send-camp-icon">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      </span>
                      <span class="ea-send-camp-text">
                        <span class="ea-send-camp-name">{{ camp.name }}</span>
                        <span class="ea-send-camp-meta">{{ capitalize(camp.type) }} campaign · Created {{ formatDate(camp.createdAt) }}</span>
                      </span>
                      <svg class="ea-send-camp-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════
         FROM CONTACT LIST — Phase 1: Select contacts
         ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="ea-fade">
        <div v-if="contactPickerPhase === 1" class="ea-overlay ea-overlay--center" @click.self="closeContactPicker">
          <Transition name="ea-scale">
            <div class="ea-modal ea-imp-modal ea-imp-modal--tall" v-if="contactPickerPhase === 1">
              <div class="ea-modal-header">
                <div class="ea-modal-header-left">
                  <h3 class="ea-modal-title">From Contact List</h3>
                  <span class="ea-modal-sub">{{ contactPickerSelected.size }} selected</span>
                </div>
                <button class="ea-modal-close" @click="closeContactPicker">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div class="ea-imp-body ea-imp-body--scroll">
                <div class="ea-cp-toolbar">
                  <input v-model="contactPickerSearch" class="ea-input ea-cp-search" placeholder="Search contacts by name or phone…" />

                  <!-- Groups filter -->
                  <div class="ea-label-select" ref="contactPickerLabelSelectRef" v-if="localLabels.length">
                    <button class="ea-type-trigger" :class="{ 'ea-type-trigger--active': contactPickerFilterLabelId }" @click="contactPickerLabelDropOpen = !contactPickerLabelDropOpen">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                      <template v-if="contactPickerFilterLabelId">
                        <span class="ea-label-trigger-dot" :style="{ background: labelFg(localLabels.find(l => l.id === contactPickerFilterLabelId)) }"/>
                        {{ localLabels.find(l => l.id === contactPickerFilterLabelId)?.name ?? 'Groups' }}
                      </template>
                      <template v-else>
                        Groups
                        <span class="ea-type-trigger-cnt">{{ localLabels.length }}</span>
                      </template>
                      <svg class="ea-type-chevron" :class="{ 'ea-type-chevron--open': contactPickerLabelDropOpen }"
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    <div v-if="contactPickerLabelDropOpen" class="ea-type-drop">
                      <button class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': !contactPickerFilterLabelId }"
                        @click="contactPickerFilterLabelId = null; contactPickerLabelDropOpen = false">
                        All
                        <span class="ea-type-drop-cnt">{{ availableContacts.length }}</span>
                      </button>
                      <div class="ea-label-drop-sep"/>
                      <button v-for="lbl in localLabels" :key="lbl.id"
                        class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': contactPickerFilterLabelId === lbl.id }"
                        @click="contactPickerFilterLabelId = contactPickerFilterLabelId === lbl.id ? null : lbl.id; contactPickerLabelDropOpen = false">
                        <span style="display:flex;align-items:center;gap:7px;">
                          <span class="ea-lf-dot" :style="{ background: labelFg(lbl) }"/>
                          {{ lbl.name }}
                        </span>
                      </button>
                      <div class="ea-label-drop-sep"/>
                      <button class="ea-type-drop-item ea-label-drop-manage" @click="showLabelManager = true; contactPickerLabelDropOpen = false">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Manage Groups
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="!availableContacts.length" class="ea-imp-empty">
                  No contacts yet. Add people to your <strong>Contact List</strong> first.
                </div>
                <div v-else-if="!contactPickerFiltered.length" class="ea-imp-empty">
                  No contacts match {{ contactPickerFilterLabelId ? 'this group' : `"${contactPickerSearch}"` }}.
                </div>

                <template v-else>
                  <label class="ea-list-select-all" style="margin: 4px 0 8px;">
                    <input type="checkbox" class="ea-cb" :checked="isAllContactsSelected" @change="toggleContactPickerAll" />
                    <span>Select all {{ contactPickerFiltered.length }}</span>
                  </label>

                  <div class="ea-pb-list">
                    <div v-for="c in contactPickerFiltered" :key="c.id"
                      class="ea-pb-row" :class="{ 'ea-pb-row--excluded': !contactPickerSelected.has(c.id) }"
                      @click="toggleContactPickerSelect(c.id)">
                      <div class="ea-pb-avatar" :style="{ background: avatarBg(c.fullName), color: avatarColor(c.fullName) }">{{ initials(c.fullName) }}</div>
                      <div class="ea-pb-info">
                        <span class="ea-pb-name">{{ c.fullName }}</span>
                        <span class="ea-pb-phone">{{ c.phone || 'No phone' }}</span>
                      </div>
                      <div class="ea-card-badges" v-if="attLabels(c).length" style="flex: 0 0 auto;">
                        <span v-for="lbl in attLabels(c)" :key="lbl.id" class="ea-label-chip"
                          :style="{ background: labelBg(lbl), color: labelFg(lbl) }">
                          {{ lbl.name }}
                        </span>
                      </div>
                      <button type="button" class="ea-pb-toggle"
                        :class="{ 'ea-pb-toggle--off': !contactPickerSelected.has(c.id) }"
                        @click.stop="toggleContactPickerSelect(c.id)">
                        <svg v-if="contactPickerSelected.has(c.id)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                </template>
              </div>

              <div class="ea-cp-footer">
                <button type="button" class="ea-btn ea-btn--ghost" @click="closeContactPicker">Cancel</button>
                <button type="button" class="ea-btn ea-btn--primary" :disabled="!contactPickerSelected.size" @click="contactPickerNext">
                  Next — {{ contactPickerSelected.size }} selected
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════
         FROM CONTACT LIST — Phase 2: Card + Groups, then convert
         ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="ea-fade">
        <div v-if="contactPickerPhase === 2" class="ea-overlay ea-overlay--center" @click.self="closeContactPicker">
          <Transition name="ea-sheet">
            <div class="ea-modal" v-if="contactPickerPhase === 2">
              <div class="ea-modal-header">
                <div class="ea-modal-header-left">
                  <h3 class="ea-modal-title">From Contact List</h3>
                  <span class="ea-modal-sub">
                    {{ contactPickerSelected.size }} contact{{ contactPickerSelected.size !== 1 ? 's' : '' }} selected
                  </span>
                </div>
                <div class="ea-modal-header-right">
                  <button type="button" class="ea-phonebook-back-btn" :disabled="contactPickerSubmitting" @click="contactPickerBack">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Back
                  </button>
                  <button class="ea-modal-close" @click="closeContactPicker">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              <form @submit.prevent="submitContactPicker" class="ea-form">
                <div class="ea-field">
                  <label class="ea-label">Send As <span class="ea-required">*</span></label>
                  <div class="ea-type-row">
                    <button v-for="t in ['invitation','contribution']" :key="t"
                      type="button" class="ea-type-opt"
                      :class="{ 'ea-type-opt--active': contactPickerForm.kardType === t }"
                      @click="contactPickerForm.kardType = t">
                      {{ capitalize(t) }}
                    </button>
                  </div>
                </div>

                <div class="ea-field">
                  <label class="ea-label">Card Template <span class="ea-required">*</span></label>
                  <div v-if="fetchingTemplates" class="ea-tpl-state">
                    <svg class="ea-tpl-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2.5" stroke-linecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Loading templates…
                  </div>
                  <div v-else-if="!cardTemplates.length" class="ea-tpl-empty">
                    No {{ contactPickerForm.kardType }} templates yet. Create one in <strong>Cards</strong> first.
                  </div>
                  <div v-else class="ea-tpl-grid">
                    <button v-for="tpl in cardTemplates" :key="tpl.id" type="button"
                      class="ea-tpl-opt" :class="{ 'ea-tpl-opt--active': contactPickerForm.templateCardId === tpl.id }"
                      @click="contactPickerForm.templateCardId = tpl.id">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                        <rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                      <span>{{ tpl.name }}</span>
                      <svg v-if="contactPickerForm.templateCardId === tpl.id" class="ea-tpl-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  </div>
                  <span v-if="contactPickerErr" class="ea-field-error">{{ contactPickerErr }}</span>
                </div>

                <div class="ea-field" v-if="eventLabels.length">
                  <label class="ea-label">Groups</label>
                  <div class="ea-label-row">
                    <button v-for="lbl in eventLabels" :key="lbl.id" type="button"
                      class="ea-label-toggle"
                      :style="{
                        borderColor: labelFg(lbl),
                        color: contactPickerForm.labelIds.includes(lbl.id) ? labelFg(lbl) : '#888',
                        background: contactPickerForm.labelIds.includes(lbl.id) ? labelBg(lbl) : 'transparent'
                      }"
                      @click="toggleContactPickerLabel(lbl.id)">
                      {{ lbl.name }}
                    </button>
                  </div>
                </div>

                <div class="ea-form-actions">
                  <button type="button" class="ea-btn ea-btn--ghost" @click="closeContactPicker">Cancel</button>
                  <button type="submit" class="ea-btn ea-btn--primary" :disabled="contactPickerSubmitting">
                    {{ contactPickerSubmitting ? 'Adding…' : `Add ${contactPickerSelected.size} Guest${contactPickerSelected.size !== 1 ? 's' : ''}` }}
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
                <h3 class="ea-modal-title">Import {{ personLabelPlural }}</h3>
                <button class="ea-modal-close" @click="closeImport">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div class="ea-imp-body">
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
                    <svg class="ea-tpl-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2.5" stroke-linecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    <p class="ea-drop-sub" style="margin-top:10px">Parsing file…</p>
                  </div>

                  <!-- File chosen -->
                  <div v-else class="ea-file-chosen">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2" stroke-linecap="round">
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
                  {{ importFileName }} · {{ importRows.length }} rows
                </div>

                <!-- ── Step 1: Labels ── -->
                <div v-if="eventLabels.length" class="ea-imp-section">
                  <p class="ea-imp-section-label">Step 1 — Assign Groups <span class="ea-imp-opt">(optional)</span></p>
                  <div class="ea-imp-label-scroller">
                    <button v-for="lbl in eventLabels" :key="lbl.id"
                      type="button" class="ea-imp-label-chip"
                      :class="{ 'ea-imp-label-chip--active': importSelectedLabels.includes(lbl.id) }"
                      :style="{
                        borderColor: importSelectedLabels.includes(lbl.id) ? labelFg(lbl) : '#ECECEF',
                        color: importSelectedLabels.includes(lbl.id) ? labelFg(lbl) : '#888',
                        background: importSelectedLabels.includes(lbl.id) ? labelBg(lbl) : 'transparent',
                      }"
                      @click="toggleImportLabel(lbl.id)">
                      {{ lbl.name }}
                    </button>
                  </div>
                </div>

                <!-- ── Step 2: Map columns ── -->
                <div class="ea-imp-section" ref="mapColumnsRef">
                  <p class="ea-imp-section-label">{{ eventLabels.length ? 'Step 2' : 'Step 1' }} — Map Excel Columns</p>

                  <!-- Name -->
                  <div class="ea-map-row">
                    <div class="ea-map-icon-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <span class="ea-map-label">Name <span class="ea-required">*</span></span>
                    <div class="ea-map-select-wrap ea-map-drop-wrap">
                      <button type="button" class="ea-map-drop-trigger" @click="mapDropOpen = mapDropOpen === 'name' ? null : 'name'">
                        <span :class="{ 'ea-map-drop-placeholder': importMapping.name === null }">{{ importMapping.name !== null ? headerLabel(importMapping.name) : 'Select column…' }}</span>
                        <svg class="ea-type-chevron" :class="{ 'ea-type-chevron--open': mapDropOpen === 'name' }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      <div v-if="mapDropOpen === 'name'" class="ea-type-drop ea-map-drop">
                        <button v-for="h in importHeaders" :key="h.idx" type="button" class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': importMapping.name === h.idx }" @click="importMapping.name = h.idx; mapDropOpen = null">{{ h.label }}</button>
                      </div>
                    </div>
                  </div>

                  <!-- Phone -->
                  <div class="ea-map-row">
                    <div class="ea-map-icon-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
                    </div>
                    <span class="ea-map-label">Phone <span class="ea-required">*</span></span>
                    <div class="ea-map-select-wrap ea-map-drop-wrap">
                      <button type="button" class="ea-map-drop-trigger" @click="mapDropOpen = mapDropOpen === 'phone' ? null : 'phone'">
                        <span :class="{ 'ea-map-drop-placeholder': importMapping.phone === null }">{{ importMapping.phone !== null ? headerLabel(importMapping.phone) : 'Select column…' }}</span>
                        <svg class="ea-type-chevron" :class="{ 'ea-type-chevron--open': mapDropOpen === 'phone' }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      <div v-if="mapDropOpen === 'phone'" class="ea-type-drop ea-map-drop">
                        <button v-for="h in importHeaders" :key="h.idx" type="button" class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': importMapping.phone === h.idx }" @click="importMapping.phone = h.idx; mapDropOpen = null">{{ h.label }}</button>
                      </div>
                    </div>
                  </div>

                  <!-- Pledges — optional for any guest -->
                  <div class="ea-map-row">
                    <div class="ea-map-icon-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <span class="ea-map-label">Pledges</span>
                    <div class="ea-map-toggle-group">
                      <label class="ea-toggle">
                        <input type="checkbox" v-model="importMapAhadi" />
                        <span class="ea-toggle-track"><span class="ea-toggle-thumb"/></span>
                      </label>
                      <div class="ea-map-select-wrap ea-map-drop-wrap" v-if="importMapAhadi">
                        <button type="button" class="ea-map-drop-trigger" @click="mapDropOpen = mapDropOpen === 'ahadi' ? null : 'ahadi'">
                          <span :class="{ 'ea-map-drop-placeholder': importMapping.ahadi === null }">{{ importMapping.ahadi !== null ? headerLabel(importMapping.ahadi) : 'Select column…' }}</span>
                          <svg class="ea-type-chevron" :class="{ 'ea-type-chevron--open': mapDropOpen === 'ahadi' }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <div v-if="mapDropOpen === 'ahadi'" class="ea-type-drop ea-map-drop">
                          <button v-for="h in importHeaders" :key="h.idx" type="button" class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': importMapping.ahadi === h.idx }" @click="importMapping.ahadi = h.idx; mapDropOpen = null">{{ h.label }}</button>
                        </div>
                      </div>
                      <span v-else class="ea-map-skip">Skipped</span>
                    </div>
                  </div>

                  <!-- Contribution paid — optional for any guest -->
                  <div class="ea-map-row">
                    <div class="ea-map-icon-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8924D" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    </div>
                    <span class="ea-map-label">Contribution</span>
                    <div class="ea-map-toggle-group">
                      <label class="ea-toggle">
                        <input type="checkbox" v-model="importMapMchango" />
                        <span class="ea-toggle-track"><span class="ea-toggle-thumb"/></span>
                      </label>
                      <div class="ea-map-select-wrap ea-map-drop-wrap" v-if="importMapMchango">
                        <button type="button" class="ea-map-drop-trigger" @click="mapDropOpen = mapDropOpen === 'mchango' ? null : 'mchango'">
                          <span :class="{ 'ea-map-drop-placeholder': importMapping.mchango === null }">{{ importMapping.mchango !== null ? headerLabel(importMapping.mchango) : 'Select column…' }}</span>
                          <svg class="ea-type-chevron" :class="{ 'ea-type-chevron--open': mapDropOpen === 'mchango' }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <div v-if="mapDropOpen === 'mchango'" class="ea-type-drop ea-map-drop">
                          <button v-for="h in importHeaders" :key="h.idx" type="button" class="ea-type-drop-item" :class="{ 'ea-type-drop-item--active': importMapping.mchango === h.idx }" @click="importMapping.mchango = h.idx; mapDropOpen = null">{{ h.label }}</button>
                        </div>
                      </div>
                      <span v-else class="ea-map-skip">Skipped</span>
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
                  <p class="ea-imp-preview-sub">{{ importPreviewList.length }} guest{{ importPreviewList.length !== 1 ? 's' : '' }}</p>
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

              <!-- Empty state -->
              <div v-if="!importPreviewList.length" class="ea-imp-empty">
                <p class="ea-empty-title">All done!</p>
                <p class="ea-empty-sub">All guests were imported successfully.</p>
                <button class="ea-empty-cta" @click="closeImport">Close</button>
              </div>

              <!-- Duplicate warning banner -->
              <div v-if="importDuplicateCount > 0" class="ea-imp-dup-banner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>{{ importDuplicateCount }} entr{{ importDuplicateCount === 1 ? 'y' : 'ies' }} already exist{{ importDuplicateCount === 1 ? 's' : '' }} in this event</span>
                <button class="ea-imp-dup-remove-all" @click="importPreviewList = importPreviewList.filter(r => !r._isDuplicate)">
                  Remove all
                </button>
              </div>

              <!-- Attendee list -->
              <div v-if="importPreviewList.length" class="ea-imp-preview-list">
                <div
                  v-for="(att, idx) in importPreviewList"
                  :key="att._id"
                  class="ea-imp-preview-row"
                  :class="{ 'ea-imp-preview-row--dup': att._isDuplicate }"
                >
                  <span class="ea-imp-row-num">{{ idx + 1 }}</span>
                  <div class="ea-imp-row-info">
                    <div class="ea-imp-row-name-line">
                      <span class="ea-imp-row-name">{{ att.fullName }}</span>
                      <span v-if="att._isDuplicate" class="ea-imp-dup-badge">DUPLICATE</span>
                    </div>
                    <span class="ea-imp-row-phone">{{ att.phone || '—' }}</span>
                    <!-- existing record compare panel -->
                    <div v-if="att._isDuplicate" class="ea-imp-dup-compare">
                      <span class="ea-imp-dup-compare-label">In DB:</span>
                      <span class="ea-imp-dup-compare-name">{{ att._existingAttendee.fullName }}</span>
                      <span class="ea-imp-dup-compare-sep">·</span>
                      <span class="ea-imp-dup-compare-phone">{{ att._existingAttendee.phone }}</span>
                      <span class="ea-imp-dup-compare-sep">·</span>
                      <span
                        class="ea-imp-dup-compare-status"
                        :class="{
                          'ea-imp-dup-status--confirmed':  att._existingAttendee.attendanceStatus === 'Confirmed',
                          'ea-imp-dup-status--declined':   att._existingAttendee.attendanceStatus === 'Declined',
                        }"
                      >{{ att._existingAttendee.attendanceStatus }}</span>
                    </div>
                    <!-- pledge / contribution, when mapped -->
                    <div v-if="att.pledgedAmount != null || att.paidAmount != null" class="ea-imp-row-amounts">
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

                <!-- Mchango — contribution & contact types -->
                <div v-if="getKardType(selectedAtt) !== 'invitation'" class="ea-drawer-block ea-drawer-mchango">
                  <p class="ea-block-label">Mchango</p>

                  <!-- Summary row -->
                  <div class="ea-contrib-row">
                    <!-- Pledged — tap to edit -->
                    <div class="ea-contrib-card ea-contrib-card--clickable" @click="openPledgeEdit">
                      <div class="ea-contrib-card-top">
                        <span class="ea-contrib-label">Pledged</span>
                        <svg class="ea-contrib-edit-ico" width="11" height="11" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </div>
                      <template v-if="!pledgeEditMode">
                        <span class="ea-contrib-val">{{ formatMoney(selectedAtt.pledgedAmount) }}</span>
                      </template>
                      <template v-else>
                        <div class="ea-inline-field" @click.stop>
                          <input v-model="pledgeInput" type="number" min="0" class="ea-inline-inp"
                            placeholder="0" autofocus
                            @keyup.enter="savePledge" @keyup.escape="pledgeEditMode = false" />
                          <button class="ea-inline-ok" :disabled="savingPledge" @click.stop="savePledge">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                          <button class="ea-inline-x" @click.stop="pledgeEditMode = false">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              stroke-width="2.5" stroke-linecap="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      </template>
                    </div>

                    <!-- Paid -->
                    <div class="ea-contrib-card">
                      <div class="ea-contrib-card-top">
                        <span class="ea-contrib-label">Paid</span>
                      </div>
                      <span class="ea-contrib-val ea-contrib-val--paid">{{ formatMoney(selectedAtt.paidAmount) }}</span>
                    </div>
                  </div>

                  <!-- Progress bar (when pledge > 0) -->
                  <div v-if="(selectedAtt.pledgedAmount ?? 0) > 0" class="ea-pledge-bar-wrap">
                    <div class="ea-pledge-bar">
                      <div class="ea-pledge-bar-fill"
                        :style="{ width: Math.min(100, ((selectedAtt.paidAmount ?? 0) / selectedAtt.pledgedAmount) * 100) + '%' }" />
                    </div>
                    <span class="ea-pledge-pct">
                      {{ Math.round(((selectedAtt.paidAmount ?? 0) / selectedAtt.pledgedAmount) * 100) }}% paid
                    </span>
                  </div>

                  <!-- Add payment button / inline form -->
                  <button v-if="!addPayMode" class="ea-add-pay-btn" @click="addPayMode = true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.2" stroke-linecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Payment
                  </button>

                  <div v-else class="ea-pay-form">
                    <div class="ea-pay-form-head">
                      <span class="ea-pay-form-label">New Payment</span>
                      <button class="ea-pay-form-close" @click="addPayMode = false; payInput = ''">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="2.5" stroke-linecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <div class="ea-pay-form-row">
                      <input ref="payInputRef" v-model="payInput" type="number" min="0" class="ea-pay-inp"
                        placeholder="Amount in TZS"
                        @keyup.enter="addPayment" @keyup.escape="addPayMode = false; payInput = ''" />
                      <button class="ea-pay-submit" :disabled="savingPayment || !payInput" @click="addPayment">
                        {{ savingPayment ? '…' : 'Save' }}
                      </button>
                    </div>
                  </div>

                  <!-- Payment history -->
                  <div class="ea-pay-history">
                    <p v-if="loadingPayments" class="ea-pay-empty">
                      <svg class="ea-spin" width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="#B8924D" stroke-width="2.2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Loading…
                    </p>
                    <p v-else-if="!drawerPayments.length" class="ea-pay-empty">No payments recorded yet</p>
                    <template v-else>
                      <div v-for="p in drawerPayments" :key="p.id" class="ea-pay-item">
                        <div class="ea-pay-ico">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B8924D"
                            stroke-width="2" stroke-linecap="round">
                            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                          </svg>
                        </div>
                        <template v-if="editingPaymentId === p.id">
                          <div class="ea-inline-field" style="flex:1">
                            <input v-model="editPayInput" type="number" min="0" class="ea-inline-inp"
                              autofocus @keyup.enter="saveEditPayment" @keyup.escape="editingPaymentId = null" />
                            <button class="ea-inline-ok" @click="saveEditPayment">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                            <button class="ea-inline-x" @click="editingPaymentId = null">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5" stroke-linecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        </template>
                        <template v-else>
                          <div class="ea-pay-info">
                            <span class="ea-pay-amt">{{ formatMoney(p.amount) }}</span>
                            <span class="ea-pay-when">{{ formatDate(p.createdAt) }}</span>
                          </div>
                          <div class="ea-pay-item-actions">
                            <button class="ea-pay-item-btn" @click="startEditPayment(p)" title="Edit">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.2" stroke-linecap="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button class="ea-pay-item-btn ea-pay-item-btn--del"
                              :disabled="deletingPaymentId === p.id" @click="deletePayment(p)" title="Delete">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.2" stroke-linecap="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          </div>
                        </template>
                      </div>
                    </template>
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

  <!-- ══ Label Manager Modal ══ -->
  <Teleport to="body">
    <Transition name="ea-fade">
      <div v-if="showLabelManager" class="ea-overlay ea-overlay--center" @click.self="showLabelManager = false">
        <Transition name="ea-scale">
          <div class="ea-modal ea-lm-modal" v-if="showLabelManager">

            <div class="ea-modal-header">
              <h3 class="ea-modal-title">Manage Groups</h3>
              <button class="ea-modal-close" @click="showLabelManager = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="ea-lm-body">

              <!-- Existing labels list -->
              <div v-if="localLabels.length" class="ea-lm-list">
                <template v-for="lbl in localLabels" :key="lbl.id">
                  <!-- View row -->
                  <div v-if="editingLabel?.id !== lbl.id" class="ea-lm-row">
                    <span class="ea-lm-dot" :style="{ background: labelFg(lbl) }"></span>
                    <span class="ea-lm-name">{{ lbl.name }}</span>
                    <button class="ea-lm-action" title="Edit" @click="startEditLabel(lbl)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="ea-lm-action ea-lm-action--del" title="Delete" @click="deleteLabel(lbl)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                  <!-- Inline edit row -->
                  <div v-else class="ea-lm-edit-row">
                    <div class="ea-lm-palette">
                      <button v-for="c in LABEL_COLORS" :key="c"
                        class="ea-lm-color" :class="{ 'ea-lm-color--on': editLabelColor === c }"
                        :style="{ background: c }"
                        @click="editLabelColor = c" />
                    </div>
                    <div class="ea-lm-edit-fields">
                      <input v-model="editLabelName" class="ea-lm-input" placeholder="Label name" @keydown.enter="saveEditLabel" @keydown.escape="editingLabel = null" />
                      <div class="ea-lm-edit-actions">
                        <button class="ea-lm-edit-cancel" @click="editingLabel = null">Cancel</button>
                        <button class="ea-lm-save-btn" :disabled="!editLabelName.trim() || savingLabel" @click="saveEditLabel">
                          {{ savingLabel ? '…' : 'Save' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <p v-else class="ea-lm-empty">No groups yet. Create your first one below.</p>

              <div class="ea-lm-divider"></div>

              <!-- Create new label -->
              <div class="ea-lm-create">
                <p class="ea-lm-section-hd">New Group</p>
                <div class="ea-lm-palette">
                  <button v-for="c in LABEL_COLORS" :key="c"
                    class="ea-lm-color" :class="{ 'ea-lm-color--on': newLabelColor === c }"
                    :style="{ background: c }"
                    @click="newLabelColor = c" />
                </div>
                <div class="ea-lm-create-row">
                  <span class="ea-lm-preview-dot" :style="{ background: newLabelColor }"></span>
                  <input v-model="newLabelName" class="ea-lm-input" placeholder="Label name…"
                    @keydown.enter="createLabel" />
                  <button class="ea-lm-save-btn" :disabled="!newLabelName.trim() || savingLabel" @click="createLabel">
                    {{ savingLabel ? '…' : 'Add' }}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

    </div><!-- /ea-panel -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db, auth } from '../../firebase'
import {
  collection, query, orderBy, where,
  getDocs, updateDoc, deleteDoc, deleteField, doc, addDoc, setDoc, writeBatch,
  arrayUnion, arrayRemove,
} from 'firebase/firestore'
function genAttendeeId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  const arr = new Uint8Array(4)
  crypto.getRandomValues(arr)
  arr.forEach(b => { id += chars[b % chars.length] })
  return id
}

import * as XLSX from 'xlsx'
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'
import { useOrg } from '../../composables/useOrg.js'
import { useNavDrawer } from '../../composables/useNavDrawer.js'

const CREATE_ATTENDEES_URL = 'https://createattendees-frbu33fema-uc.a.run.app'

const props = defineProps({
  event: Object,
  eventId: String,
})

const route = useRoute()
const router = useRouter()
const eventId = computed(() => props.eventId ?? route.params.eventId)
const { brandName, brandLogoUrl } = useOrg()
const navDrawer = useNavDrawer()

// Labels — local copy so we can mutate optimistically without prop mutation
const localLabels = ref([])
watch(() => props.event?.labels, (v) => { localLabels.value = v ? [...v] : [] }, { immediate: true })
const eventLabels = localLabels  // alias so existing code still works

// Label filter (table row filter)
const filterLabelId = ref(null)
const filterCardId  = ref(null)

// Collapsible search
const searchOpen    = ref(false)
const searchInputRef = ref(null)
function openSearch() {
  searchOpen.value = true
  nextTick(() => searchInputRef.value?.focus())
}
function closeSearch() {
  searchOpen.value = false
  searchQ.value = ''
}

// Label color helpers — Flutter stores colorValue as 0xFFRRGGBB int
// Web must write the same integer so Flutter's `map['colorValue'] as int` never sees a String.
function hexToColorInt(hex) {
  // '#RRGGBB' → 0xFFRRGGBB as a JS number (safe, stays within float-64 precision)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0xFF000000 + r * 65536 + g * 256 + b
}
function colorIntToHex(v) {
  // 0xFFRRGGBB int → '#RRGGBB' (uppercase)
  // Use >>> (unsigned right shift) to avoid JS signed-int issues with values > 2^31
  const r = (v >>> 16) & 0xFF
  const g = (v >>> 8)  & 0xFF
  const b =  v         & 0xFF
  return '#' + [r, g, b].map(x => x.toString(16).toUpperCase().padStart(2, '0')).join('')
}

// Palette matches Flutter's _colorPalette in label_manager.dart (same 0xFFRRGGBB values)
const LABEL_COLORS = [
  '#C9A84C', // Gold   (0xFFC9A84C)
  '#4CAF50', // Green  (0xFF4CAF50)
  '#2196F3', // Blue   (0xFF2196F3)
  '#F44336', // Red    (0xFFF44336)
  '#FF9800', // Orange (0xFFFF9800)
  '#9C27B0', // Purple (0xFF9C27B0)
  '#00BCD4', // Cyan   (0xFF00BCD4)
  '#E91E63', // Pink   (0xFFE91E63)
  '#795548', // Brown  (0xFF795548)
  '#607D8B', // Blue Grey (0xFF607D8B)
]

// Label Manager state
const showLabelManager = ref(false)
const newLabelName   = ref('')
const newLabelColor  = ref(LABEL_COLORS[0])   // default Gold
const editingLabel   = ref(null)
const editLabelName  = ref('')
const editLabelColor = ref('')
const savingLabel    = ref(false)

// Bulk-label state
const bulkLabelOpen = ref(false)
const bulkLabeling  = ref(false)

// ── Data ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10
const attendees = ref([])
const loading = ref(false)
const currentPage = ref(1)
const selectedIds = reactive(new Set())

// ── Search & Filter ───────────────────────────────────────────────────────────
const searchQ = ref('')
// Guest List shows everyone regardless of card type — a guest shouldn't be
// invisible here just because they haven't been assigned an invitation card
// yet. Contacts still opens pre-filtered to its own 'contact' tab.
const activeType = ref(route.name === 'EventContacts' ? 'contact' : 'all')
watch(() => route.name, name => {
  activeType.value = name === 'EventContacts' ? 'contact' : 'all'
})
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

const isContactsView = computed(() => route.name === 'EventContacts')

const personLabel = computed(() => {
  if (!isContactsView.value) return 'Guest'
  if (activeType.value === 'contribution') return 'Contributor'
  return 'Contact'
})
const personLabelPlural = computed(() => {
  if (!isContactsView.value) return 'Guests'
  if (activeType.value === 'contribution') return 'Contributors'
  return 'Contacts'
})
const addLabel = computed(() => `Add ${personLabel.value}`)

const typeFilters = computed(() => {
  if (isContactsView.value) return [
    { val: 'contact', label: 'Contacts' },
    { val: 'contribution', label: 'Contribution Cards' },
  ]
  return []
})

const PURPOSE_LABELS = {
  invitation:    'Invitation',
  contribution:  'Contribution',
  save_the_date: 'Save the Date',
  contact:       'Contact',
}

const typeLabels = { invitation: 'Invitation', contribution: 'Contribution', contact: 'Contact' }

const filteredList = computed(() => {
  let list = attendees.value
  if (activeType.value !== 'all') {
    list = list.filter(a => getKardType(a) === activeType.value)
  }
  if (filterLabelId.value) {
    list = list.filter(a => (a.labelIds ?? []).includes(filterLabelId.value))
  }
  if (filterCardId.value) {
    list = list.filter(a => Object.values(a.cards ?? {}).some(v => v?.templateCardId === filterCardId.value))
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

watch([searchQ, activeType, sortKey, sortDir, filterLabelId, filterCardId], () => {
  currentPage.value = 1
  selectedIds.clear()
})

// ── Label dropdown ────────────────────────────────────────────────────────────
const labelDropOpen  = ref(false)
const labelSelectRef = ref(null)

// ── Card filter dropdown ──────────────────────────────────────────────────────
const cardDropOpen   = ref(false)
const cardDropRef    = ref(null)

// ── Map Columns dropdowns (import) ──────────────────────────────────────────
const mapDropOpen  = ref(null) // 'name' | 'phone' | 'ahadi' | 'mchango' | 'card' | null
const mapColumnsRef = ref(null)
function headerLabel(idx) { return importHeaders.value.find(h => h.idx === idx)?.label ?? 'Select column…' }
function cardTplLabel(id) { return cardTemplates.value.find(t => t.id === id)?.name ?? 'Select template…' }

const cardDropTemplates = computed(() => {
  if (activeType.value === 'contact') return []
  if (activeType.value === 'all') return allTemplatesList.value
  return allTemplatesList.value.filter(t => t.purpose === activeType.value)
})

const cardAttendeeCount = computed(() => {
  const counts = {}
  attendees.value.forEach(a => {
    const type = getKardType(a)
    if (type === 'contact') return
    const tid = a.cards?.[type]?.templateCardId
    if (tid) counts[tid] = (counts[tid] ?? 0) + 1
  })
  return counts
})

watch(activeType, () => { filterCardId.value = null })

function onClickOutsideDropdowns(e) {
  if (labelSelectRef.value && !labelSelectRef.value.contains(e.target)) labelDropOpen.value = false
  if (cardDropRef.value && !cardDropRef.value.contains(e.target)) cardDropOpen.value = false
  if (mapColumnsRef.value && !mapColumnsRef.value.contains(e.target)) mapDropOpen.value = null
  if (contactPickerLabelSelectRef.value && !contactPickerLabelSelectRef.value.contains(e.target)) contactPickerLabelDropOpen.value = false
}
onMounted(() => document.addEventListener('click', onClickOutsideDropdowns, true))
onUnmounted(() => document.removeEventListener('click', onClickOutsideDropdowns, true))

const typeCount = computed(() => {
  const c = { invitation: 0, contribution: 0, contact: 0 }
  for (const a of attendees.value) {
    const t = getKardType(a)
    if (t in c) c[t]++
  }
  return c
})

const confirmedCount = computed(() =>
  attendees.value.filter(a => getKardType(a) === 'invitation' && a.attendanceStatus === 'Confirmed').length
)

const totalPaid = computed(() =>
  attendees.value.reduce((s, a) => s + (getKardType(a) !== 'invitation' ? (a.paidAmount ?? 0) : 0), 0)
)


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
  if (!v) return '#B8924D'
  if (typeof v === 'string') return v
  const r = (v >> 16) & 0xFF
  const g = (v >> 8) & 0xFF
  const b = v & 0xFF
  return `rgb(${r},${g},${b})`
}

function labelBg(lbl) {
  const v = lbl?.colorValue
  if (!v) return 'rgba(10,10,11,0.04)'
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
    'Confirmed': '#10B981',
    'Declined': '#EF4444',
    'Called': '#0EA5E9',
    'Unreachable': '#F59E0B',
    'Not Confirmed': '#9CA3AF',
  }[status] ?? '#9CA3AF'
}

function statusSlug(status) {
  return (status || 'not-confirmed').toLowerCase().replace(/\s+/g, '-')
}

function formatDisplayName(name) {
  if (!name) return '—'
  const trimmed = name.trim()
  // If already mixed case (e.g. "Grace", "Falaji Mkoto", "Hasani na Lukia"), keep as is
  if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) return trimmed
  // Otherwise gracefully title-case all uppercase or all lowercase strings
  return trimmed.toLowerCase().replace(/(?:^|\s|-|\/)\S/g, char => char.toUpperCase())
}

function formatPhoneDisplay(phone) {
  if (!phone) return '—'
  const p = String(phone).trim()
  if (p.startsWith('255') && p.length === 12) {
    return `+255 ${p.slice(3, 6)} ${p.slice(6, 9)} ${p.slice(9)}`
  }
  return p
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

// ── Mchango (pledges & payments) ──────────────────────────────────────────────
const drawerPayments    = ref([])
const loadingPayments   = ref(false)
const pledgeEditMode    = ref(false)
const pledgeInput       = ref('')
const savingPledge      = ref(false)
const addPayMode        = ref(false)
const payInputRef       = ref(null)
const payInput          = ref('')
const savingPayment     = ref(false)
const editingPaymentId  = ref(null)
const editPayInput      = ref('')
const deletingPaymentId = ref(null)

watch(selectedAtt, async (att) => {
  pledgeEditMode.value   = false
  addPayMode.value       = false
  editingPaymentId.value = null
  payInput.value         = ''
  if (att && getKardType(att) !== 'invitation') {
    await loadDrawerPayments(att)
  } else {
    drawerPayments.value = []
  }
})

watch(addPayMode, (v) => {
  if (v) nextTick(() => payInputRef.value?.focus())
})

async function loadDrawerPayments(att) {
  loadingPayments.value = true
  try {
    const snap = await getDocs(
      query(
        collection(db, 'events', eventId.value, 'attendees', att.id, 'payments'),
        orderBy('createdAt', 'desc')
      )
    )
    drawerPayments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Failed to load payments', e)
  } finally {
    loadingPayments.value = false
  }
}

function openPledgeEdit() {
  pledgeInput.value  = selectedAtt.value?.pledgedAmount ?? 0
  pledgeEditMode.value = true
}

async function savePledge() {
  const att = selectedAtt.value
  if (!att || savingPledge.value) return
  const amount = parseFloat(pledgeInput.value)
  if (isNaN(amount) || amount < 0) return
  savingPledge.value = true
  try {
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), { pledgedAmount: amount })
    const updated = { ...att, pledgedAmount: amount }
    selectedAtt.value = updated
    const idx = attendees.value.findIndex(a => a.id === att.id)
    if (idx !== -1) attendees.value[idx] = updated
    pledgeEditMode.value = false
  } catch (e) {
    console.error('Failed to save pledge', e)
  } finally {
    savingPledge.value = false
  }
}

async function addPayment() {
  const att = selectedAtt.value
  if (!att || savingPayment.value) return
  const amount = parseFloat(payInput.value)
  if (isNaN(amount) || amount <= 0) return
  savingPayment.value = true
  try {
    await addDoc(
      collection(db, 'events', eventId.value, 'attendees', att.id, 'payments'),
      { amount, method: 'manual', createdAt: new Date().toISOString() }
    )
    const newPaid = (att.paidAmount ?? 0) + amount
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), { paidAmount: newPaid })
    const updated = { ...att, paidAmount: newPaid }
    selectedAtt.value = updated
    const idx = attendees.value.findIndex(a => a.id === att.id)
    if (idx !== -1) attendees.value[idx] = updated
    payInput.value   = ''
    addPayMode.value = false
    await loadDrawerPayments(selectedAtt.value)
  } catch (e) {
    console.error('Failed to add payment', e)
  } finally {
    savingPayment.value = false
  }
}

function startEditPayment(p) {
  editingPaymentId.value = p.id
  editPayInput.value     = p.amount
}

async function saveEditPayment() {
  const att = selectedAtt.value
  const pid = editingPaymentId.value
  if (!att || !pid) return
  const newAmount = parseFloat(editPayInput.value)
  if (isNaN(newAmount) || newAmount < 0) return
  const original = drawerPayments.value.find(p => p.id === pid)
  const diff     = newAmount - (original?.amount ?? 0)
  try {
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id, 'payments', pid), {
      amount: newAmount, updateAt: new Date().toISOString(),
    })
    const newPaid = Math.max(0, (att.paidAmount ?? 0) + diff)
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), { paidAmount: newPaid })
    const updated = { ...att, paidAmount: newPaid }
    selectedAtt.value = updated
    const idx = attendees.value.findIndex(a => a.id === att.id)
    if (idx !== -1) attendees.value[idx] = updated
    editingPaymentId.value = null
    await loadDrawerPayments(att)
  } catch (e) {
    console.error('Failed to edit payment', e)
  }
}

async function deletePayment(payment) {
  const att = selectedAtt.value
  if (!att || deletingPaymentId.value) return
  deletingPaymentId.value = payment.id
  try {
    await deleteDoc(doc(db, 'events', eventId.value, 'attendees', att.id, 'payments', payment.id))
    const newPaid = Math.max(0, (att.paidAmount ?? 0) - (payment.amount ?? 0))
    await updateDoc(doc(db, 'events', eventId.value, 'attendees', att.id), { paidAmount: newPaid })
    const updated = { ...att, paidAmount: newPaid }
    selectedAtt.value = updated
    const idx = attendees.value.findIndex(a => a.id === att.id)
    if (idx !== -1) attendees.value[idx] = updated
    await loadDrawerPayments(att)
  } catch (e) {
    console.error('Failed to delete payment', e)
  } finally {
    deletingPaymentId.value = null
  }
}

// ── Card templates ────────────────────────────────────────────────────────────
const cardTemplates = ref([])       // [{ id, name }] for the modal selector
const fetchingTemplates = ref(false)
const allTemplatesMap = ref({})     // { [templateId]: name } for table display
const allTemplatesList = ref([])    // [{ id, name, purpose }] for the By-Card view

async function loadAllTemplates() {
  if (!eventId.value) return
  try {
    const snap = await getDocs(collection(db, 'events', eventId.value, 'cards'))
    const map = {}
    const list = []
    snap.docs.forEach(d => {
      const data = d.data()
      map[d.id] = data.type
      list.push({ id: d.id, name: data.type, purpose: data.purpose })
    })
    allTemplatesMap.value = map
    allTemplatesList.value = list
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
const showSendModal = ref(false)
// 'root' (Card/Message choice) → 'campaigns' (opens straight on the
// message-intent presets, same Firestore collection as EventCampaigns.vue,
// with any past campaigns listed below for reopening/resending).
const sendStep = ref('root')
function closeSendModal() { showSendModal.value = false; sendStep.value = 'root' }

const sendCampaigns = ref([])
const loadingSendCampaigns = ref(false)
let sendCampaignsLoaded = false
async function loadSendCampaigns(force = false) {
  if (sendCampaignsLoaded && !force) return
  loadingSendCampaigns.value = true
  try {
    const snap = await getDocs(query(collection(db, 'events', eventId.value, 'campaigns'), orderBy('createdAt', 'desc')))
    sendCampaigns.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    sendCampaignsLoaded = true
  } catch (e) {
    console.error('loadSendCampaigns:', e)
  } finally {
    loadingSendCampaigns.value = false
  }
}
function openMessageStep() {
  sendStep.value = 'campaigns'
  loadSendCampaigns()
}

function openCardStep() {
  sendStep.value = 'card'
}

const CARD_OPTIONS = [
  {
    id: 'save-the-date',
    purpose: 'save_the_date',
    title: 'Save the Date',
    desc: 'Announce your date with a beautiful design',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2.5"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M12 14.2c-.4-.4-1.1-.4-1.5 0-.4.4-.4 1.1 0 1.5l1.5 1.5 1.5-1.5c.4-.4.4-1.1 0-1.5-.4-.4-1.1-.4-1.5 0z"/>
    </svg>`
  },
  {
    id: 'invitation',
    purpose: 'invitation',
    title: 'Invitation',
    desc: 'Invite guests with a custom card',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2.5"/>
      <line x1="8" y1="7" x2="16" y2="7"/>
      <circle cx="12" cy="13" r="2.2"/>
      <path d="M12 15.2v2.3"/>
    </svg>`
  },
  {
    id: 'thank-you',
    purpose: 'thank_you',
    title: 'Thank You Card',
    desc: 'Send a designed thank-you card',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/>
      <polyline points="3 8 12 14 21 8"/>
      <path d="M3 8l5.5-4h7l5.5 4"/>
      <circle cx="12" cy="14" r="2.2"/>
      <path d="M11 14l.7.7 1.5-1.4"/>
    </svg>`
  },
  {
    id: 'enclosure',
    purpose: 'enclosure',
    title: 'Enclosure Card',
    desc: 'Include extra details with an enclosure card',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="7" y="7" width="14" height="14" rx="2"/>
      <path d="M3 17V5a2 2 0 0 1 2-2h12"/>
    </svg>`
  }
]

function selectCardOption(cardOpt) {
  closeSendModal()
  router.push({
    path: `/event/${eventId.value}/cards`,
    query: { filter: cardOpt.purpose }
  })
}

// Round-trips back here after a campaign row sent the user off to the
// full-screen composer on the Bulk Messages page (see the ea-send-camp-row
// click handler) — that page's Cancel/close hands back to the returnTo URL
// below, and this restores the Campaigns list instead of leaving them on
// a bare Guest List with no memory of where they'd been.
onMounted(() => {
  if (route.query.reopenCampaigns === '1') {
    showSendModal.value = true
    openMessageStep()
    const { reopenCampaigns, ...rest } = route.query
    router.replace({ query: rest })
  }
})

// Fixed set of message intents shown instead of a free-text campaign name/type
// form — picking one auto-creates a draft campaign titled after the pick and
// jumps straight into composing/sending it (see createPresetCampaign below).
const PRESET_CAMPAIGNS = ['General Message', 'RSVP Reminder', 'Pledge Reminder', 'Meeting Reminder']
const creatingPresetCamp = ref(false)
async function createPresetCampaign(label) {
  if (creatingPresetCamp.value) return
  creatingPresetCamp.value = true
  try {
    const docRef = await addDoc(collection(db, 'events', eventId.value, 'campaigns'), {
      name: label,
      type: 'invitation',
      whatsappMessage: null,
      smsMessage: null,
      createdAt: new Date().toISOString(),
      status: 'draft',
    })
    closeSendModal()
    router.push(`/event/${eventId.value}/bulk-messages?campaign=${docRef.id}&send=1&returnTo=${encodeURIComponent(`/event/${eventId.value}/attendees?reopenCampaigns=1`)}`)
  } catch (e) {
    console.error('createPresetCampaign:', e)
  } finally {
    creatingPresetCamp.value = false
  }
}
const editingAtt = ref(null)
const submitting = ref(false)

const form = ref({ name: '', phone: '', labelIds: [] })
const formErr = ref({ name: '' })
const phoneObj = ref(null)   // populated by vue-tel-input @validate

// ── Phone-book picker (Contact Picker API — Android Chrome / iOS Safari 14.5+) ──
const phonePickerSupported = ref(false)
onMounted(() => {
  phonePickerSupported.value = 'contacts' in navigator && 'ContactsManager' in window
})
const phonePickerMode     = ref(false)   // batch review list
const phonePickerContacts = ref([])      // [{ name, phone, include }]
const phonePickerUnsupported = ref(false) // show "open on mobile" hint

async function openPhonePicker() {
  if (!phonePickerSupported.value) {
    phonePickerUnsupported.value = true
    return
  }
  phonePickerUnsupported.value = false
  try {
    const picked = await navigator.contacts.select(['name', 'tel'], { multiple: true })
    const mapped = picked
      .filter(c => c.name?.length)
      .map(c => ({ name: (c.name[0] || '').trim(), phone: (c.tel?.[0] || '').replace(/\s+/g, ''), include: true }))
      .filter(c => c.name)
    if (!mapped.length) return
    phonePickerContacts.value = mapped
    phonePickerMode.value = true
  } catch { /* dismissed */ }
}

function removePickedContact(i) {
  phonePickerContacts.value.splice(i, 1)
  if (!phonePickerContacts.value.length) phonePickerMode.value = false
}

function exitPhonePickerMode() {
  phonePickerMode.value = false
  phonePickerContacts.value = []
  phonePickerUnsupported.value = false
}

async function submitPhonePicker() {
  const contacts = phonePickerContacts.value.filter(c => c.include && c.name)
  if (!contacts.length) return
  submitting.value = true
  try {
    const batch = writeBatch(db)
    for (const c of contacts) {
      const id = genAttendeeId()
      batch.set(doc(db, 'events', eventId.value, 'attendees', id), {
        id,
        cards:            {},
        checkinStatus:    [],
        createdAt:        new Date().toISOString(),
        email:            '',
        fullName:         c.name,
        fullNameLower:    c.name.toLowerCase(),
        attendanceStatus: 'Not Confirmed',
        phone:            c.phone.replace(/^\+/, ''),
        messages:         {},
        messageIndexes:   [],
        labelIds:         form.value.labelIds,
        idComment:        'No Comment',
      }, { merge: true })
    }
    await batch.commit()
    await loadInitial()
    closeModal()
  } catch (e) {
    alert(`Could not add contacts: ${e.message}`)
  } finally {
    submitting.value = false
  }
}

const addFormDuplicate = computed(() => {
  if (editingAtt.value) return null
  if (!phoneObj.value?.valid) return null
  const phone = (phoneObj.value.number ?? '').replace(/^\+/, '')
  if (!phone) return null
  return attendees.value.find(a => a.phone === phone) ?? null
})

function onPhoneValidate(obj) { phoneObj.value = obj }

function validateForm() {
  formErr.value.name = form.value.name?.trim() ? '' : 'Name is required'
}

function addPartyMember() {
  form.value.partyMembers.push({
    id: 'pm_' + Date.now() + Math.random().toString(36).substr(2, 4),
    title: '',
    name: '',
    phone: '',
    email: '',
    relation: form.value.partyMembers.length === 0 ? 'Spouse / +1' : 'Guest'
  })
  if (form.value.partyType === 'individual') {
    form.value.partyType = form.value.partyMembers.length === 1 ? 'couple' : 'family'
  }
}

function removePartyMember(idx) {
  form.value.partyMembers.splice(idx, 1)
  if (form.value.partyMembers.length === 0) {
    form.value.partyType = 'individual'
  } else if (form.value.partyMembers.length === 1) {
    form.value.partyType = 'couple'
  }
}

function setPartyType(type) {
  form.value.partyType = type
  if (type === 'couple') {
    if (form.value.partyMembers.length === 0) {
      addPartyMember()
    } else if (form.value.partyMembers.length > 1) {
      form.value.partyMembers = form.value.partyMembers.slice(0, 1)
    }
  } else if (type === 'family') {
    while (form.value.partyMembers.length < 2) {
      addPartyMember()
    }
  } else if (type === 'individual') {
    form.value.partyMembers = []
  }
}

function triggerUploadSpreadsheet() {
  closeModal()
  openImport()
}

function copyMagicLink() {
  const url = `${window.location.origin}/event-landing/${eventId.value}`
  navigator.clipboard?.writeText(url)
  alert('Magic link copied to clipboard! Share it with guests to collect their details.')
}

function showHelpInfo() {
  alert('Add guests individually, or use Couple / Family to link party members together. You can also upload a spreadsheet or share a magic link.')
}

function openAdd() {
  editingAtt.value = null
  form.value = {
    title: '',
    name: '',
    phone: '',
    email: '',
    partyType: 'individual',
    partyMembers: [],
    showMailingAddress: false,
    address: { street: '', city: '', state: '', zip: '', country: '' },
    labelIds: []
  }
  formErr.value = { name: '' }
  phoneObj.value = null
  showModal.value = true
}

function openEdit(att) {
  editingAtt.value = att
  // Stored phone is E.164 digits without +; vue-tel-input needs the + to parse it
  const rawPhone = att.phone ?? ''
  form.value = {
    title: att.title || '',
    name: att.fullName ?? '',
    phone: rawPhone ? '+' + rawPhone : '',
    email: att.email || '',
    partyType: att.partyType || (att.partyMembers?.length ? 'couple' : 'individual'),
    partyMembers: att.partyMembers ? JSON.parse(JSON.stringify(att.partyMembers)) : [],
    showMailingAddress: Boolean(att.address?.street || att.address?.city),
    address: {
      street: att.address?.street || '',
      city: att.address?.city || '',
      state: att.address?.state || '',
      zip: att.address?.zip || '',
      country: att.address?.country || ''
    },
    labelIds: [...(att.labelIds ?? [])],
  }
  formErr.value = { name: '' }
  phoneObj.value = null
  closeDetail()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingAtt.value = null
  phonePickerMode.value = false
  phonePickerContacts.value = []
  phonePickerUnsupported.value = false
}

function toggleLabel(id) {
  const idx = form.value.labelIds.indexOf(id)
  if (idx === -1) form.value.labelIds.push(id)
  else form.value.labelIds.splice(idx, 1)
}

async function submitForm() {
  validateForm()
  if (formErr.value.name) return
  submitting.value = true
  try {
    const existingAtt = editingAtt.value
    const name = form.value.name.trim()
    // Prefer the E.164 number from vue-tel-input validation; fall back to raw input stripped of +
    const phone = (phoneObj.value?.number ?? form.value.phone).trim().replace(/^\+/, '')
    const email = form.value.email ? form.value.email.trim() : (existingAtt?.email ?? '')

    const attendeeId = existingAtt?.id ?? genAttendeeId()
    const attendeeData = {
      id:               attendeeId,
      // Empty map + merge:true below is a no-op on an existing doc's `cards` field —
      // it deliberately never touches whatever card(s) sending a card has already
      // attached. Guests are just contact info here; cards are a separate, later step.
      cards:            {},
      checkinStatus:    existingAtt?.checkinStatus ?? [],
      createdAt:        existingAtt?.createdAt ?? new Date().toISOString(),
      email,
      fullName:         name,
      fullNameLower:    name.toLowerCase(),
      attendanceStatus: existingAtt?.attendanceStatus ?? 'Not Confirmed',
      phone,
      title:            form.value.title || '',
      partyType:        form.value.partyType,
      partyMembers:     form.value.partyMembers,
      address:          form.value.address,
      messages:         existingAtt?.messages ?? {},
      messageIndexes:   existingAtt?.messageIndexes ?? [],
      labelIds:         form.value.labelIds,
      idComment:        existingAtt?.idComment ?? 'No Comment',
    }

    await setDoc(
      doc(db, 'events', eventId.value, 'attendees', attendeeId),
      attendeeData,
      { merge: true },
    )

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

// ── Label manager ─────────────────────────────────────────────────────────────
async function createLabel() {
  const name = newLabelName.value.trim()
  if (!name || savingLabel.value) return
  savingLabel.value = true
  // colorValue stored as 0xFFRRGGBB integer — Flutter reads it as int without crashing
  const newLbl = { id: Date.now().toString(), name, colorValue: hexToColorInt(newLabelColor.value) }
  try {
    await updateDoc(doc(db, 'events', eventId.value), { labels: arrayUnion(newLbl) })
    localLabels.value = [...localLabels.value, newLbl]
    newLabelName.value = ''
    newLabelColor.value = LABEL_COLORS[0]
  } catch (e) {
    console.error('Failed to create label', e)
  } finally {
    savingLabel.value = false
  }
}

function startEditLabel(lbl) {
  editingLabel.value = lbl
  editLabelName.value = lbl.name
  // Convert existing colorValue to hex for the palette picker regardless of whether it
  // was stored as an int (Flutter) or a legacy hex string (old web labels).
  if (typeof lbl.colorValue === 'number') {
    editLabelColor.value = colorIntToHex(lbl.colorValue)
  } else {
    // Legacy string — normalise to uppercase so palette === comparison works
    editLabelColor.value = (lbl.colorValue ?? LABEL_COLORS[0]).toUpperCase()
  }
}

async function saveEditLabel() {
  const name = editLabelName.value.trim()
  const lbl  = editingLabel.value
  if (!name || !lbl || savingLabel.value) return
  savingLabel.value = true
  // Always write colorValue as integer so Flutter never receives a String
  const updated = { ...lbl, name, colorValue: hexToColorInt(editLabelColor.value) }
  try {
    await updateDoc(doc(db, 'events', eventId.value), { labels: arrayRemove(lbl) })
    await updateDoc(doc(db, 'events', eventId.value), { labels: arrayUnion(updated) })
    const idx = localLabels.value.findIndex(l => l.id === lbl.id)
    if (idx !== -1) localLabels.value[idx] = updated
    editingLabel.value = null
  } catch (e) {
    console.error('Failed to update label', e)
  } finally {
    savingLabel.value = false
  }
}

async function deleteLabel(lbl) {
  if (!confirm(`Delete group "${lbl.name}"? Attendees will lose this group.`)) return
  try {
    await updateDoc(doc(db, 'events', eventId.value), { labels: arrayRemove(lbl) })
    localLabels.value = localLabels.value.filter(l => l.id !== lbl.id)
    if (filterLabelId.value === lbl.id) filterLabelId.value = null
  } catch (e) {
    console.error('Failed to delete label', e)
  }
}

// ── Bulk label ────────────────────────────────────────────────────────────────
async function applyBulkLabel(labelId) {
  bulkLabelOpen.value = false
  const ids = [...selectedIds]
  if (!ids.length || bulkLabeling.value) return
  bulkLabeling.value = true
  try {
    if (labelId === null) {
      await Promise.all(ids.map(id =>
        updateDoc(doc(db, 'events', eventId.value, 'attendees', id), { labelIds: [] })
      ))
    } else {
      await Promise.all(ids.map(id =>
        updateDoc(doc(db, 'events', eventId.value, 'attendees', id), { labelIds: arrayUnion(labelId) })
      ))
    }
    // Reflect changes locally
    attendees.value = attendees.value.map(a => {
      if (!ids.includes(a.id)) return a
      const current = a.labelIds ?? []
      return {
        ...a,
        labelIds: labelId === null
          ? []
          : current.includes(labelId) ? current : [...current, labelId],
      }
    })
  } catch (e) {
    console.error('Failed to apply label', e)
  } finally {
    bulkLabeling.value = false
  }
}

// ── Bulk actions ──────────────────────────────────────────────────────────────
const bulkDeleting = ref(false)
const headerCb = ref(null)

function clearSelection() { selectedIds.clear(); bulkLabelOpen.value = false }

async function bulkDelete() {
  const ids = [...selectedIds]
  if (!ids.length) return
  if (!confirm(`Delete ${ids.length} ${ids.length !== 1 ? personLabelPlural.value : personLabel.value}? This cannot be undone.`)) return
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

const importPhase          = ref(0)          // 0=closed 1=file 2=map 3=preview
const importFileName       = ref('')
const importHeaders        = ref([])         // [{ idx, label }]
const importRows           = ref([])         // raw rows (no header row)
const importMapping        = reactive({ name: null, phone: null, ahadi: null, mchango: null })
const importMapAhadi       = ref(true)
const importMapMchango     = ref(true)
const importSelectedLabels = ref([])
const importPreviewList    = ref([])
const importDuplicateCount = computed(() => importPreviewList.value.filter(r => r._isDuplicate).length)
const importProcessing     = ref(false)
const importFileError      = ref('')
const importing            = ref(false)
const dropOver             = ref(false)
const fileInputRef         = ref(null)

function openImport() {
  importPhase.value = 1
  importFileName.value = ''
  importHeaders.value = []
  importRows.value = []
  Object.assign(importMapping, { name: null, phone: null, ahadi: null, mchango: null })
  importMapAhadi.value = true
  importMapMchango.value = true
  importSelectedLabels.value = []
  importPreviewList.value = []
  importFileError.value = ''
  importProcessing.value = false
}

function closeImport() { importPhase.value = 0 }

// ── From Contact List picker (convert existing contacts into guests) ────────────
// Reuses each contact's existing attendeeId — this is a conversion, not a copy,
// so the same person never ends up with two records.
const contactPickerPhase     = ref(0) // 0=closed 1=select 2=apply
const contactPickerSearch    = ref('')
const contactPickerSelected  = reactive(new Set())
const contactPickerForm      = ref({ kardType: 'invitation', templateCardId: '', labelIds: [] })
const contactPickerErr       = ref('')
const contactPickerSubmitting = ref(false)
const contactPickerFilterLabelId  = ref(null)
const contactPickerLabelDropOpen  = ref(false)
const contactPickerLabelSelectRef = ref(null)

const availableContacts = computed(() => attendees.value.filter(a => getKardType(a) === 'contact'))
const contactPickerFiltered = computed(() => {
  let list = availableContacts.value
  if (contactPickerFilterLabelId.value) {
    list = list.filter(a => (a.labelIds ?? []).includes(contactPickerFilterLabelId.value))
  }
  const q = contactPickerSearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter(a =>
      (a.fullNameLower ?? a.fullName?.toLowerCase() ?? '').includes(q) ||
      (a.phone ?? '').includes(q))
  }
  return list
})
const isAllContactsSelected = computed(() =>
  contactPickerFiltered.value.length > 0 &&
  contactPickerFiltered.value.every(a => contactPickerSelected.has(a.id))
)
function toggleContactPickerAll() {
  if (isAllContactsSelected.value) contactPickerFiltered.value.forEach(a => contactPickerSelected.delete(a.id))
  else contactPickerFiltered.value.forEach(a => contactPickerSelected.add(a.id))
}
function toggleContactPickerSelect(id) {
  if (contactPickerSelected.has(id)) contactPickerSelected.delete(id)
  else contactPickerSelected.add(id)
}
function toggleContactPickerLabel(id) {
  const idx = contactPickerForm.value.labelIds.indexOf(id)
  if (idx === -1) contactPickerForm.value.labelIds.push(id)
  else contactPickerForm.value.labelIds.splice(idx, 1)
}

function openContactPicker() {
  contactPickerPhase.value = 1
  contactPickerSearch.value = ''
  contactPickerSelected.clear()
  contactPickerForm.value = { kardType: 'invitation', templateCardId: '', labelIds: [] }
  contactPickerErr.value = ''
  contactPickerFilterLabelId.value = null
  contactPickerLabelDropOpen.value = false
}
function closeContactPicker() {
  // Guard against closing (via X, Cancel, or overlay click) while a submit is still
  // in flight — the request keeps running either way, so hiding the modal would just
  // make the in-progress conversion invisible instead of actually stopping it.
  if (contactPickerSubmitting.value) return
  contactPickerPhase.value = 0
}
function contactPickerNext() {
  if (!contactPickerSelected.size) return
  contactPickerPhase.value = 2
  fetchTemplates(contactPickerForm.value.kardType)
}
function contactPickerBack() { contactPickerPhase.value = 1 }

// Re-fetch templates and reset the chosen one when the send-as type changes
watch(() => contactPickerForm.value.kardType, type => {
  contactPickerForm.value.templateCardId = ''
  fetchTemplates(type)
})

async function submitContactPicker() {
  if (!contactPickerForm.value.templateCardId) {
    contactPickerErr.value = 'Select a card template'
    return
  }
  contactPickerErr.value = ''
  const chosen = attendees.value.filter(a => contactPickerSelected.has(a.id))
  if (!chosen.length) return
  contactPickerSubmitting.value = true
  const succeeded = []
  const failed = []   // [{ name, reason }]
  try {
    const uid = auth.currentUser.uid
    for (let i = 0; i < chosen.length; i += 2) {
      const batch = chosen.slice(i, i + 2)
      const payload = batch.map(c => ({
        id:               c.id,
        cards:            {},
        checkinStatus:    c.checkinStatus ?? [],
        createdAt:        c.createdAt ?? new Date().toISOString(),
        email:            c.email ?? '',
        fullName:         c.fullName,
        fullNameLower:    c.fullNameLower ?? c.fullName?.toLowerCase() ?? '',
        attendanceStatus: c.attendanceStatus ?? 'Not Confirmed',
        phone:            c.phone,
        messages:         c.messages ?? {},
        messageIndexes:   c.messageIndexes ?? [],
        labelIds:         contactPickerForm.value.labelIds,
        idComment:        c.idComment ?? 'No Comment',
      }))

      // A whole-batch failure (network drop, 500, etc.) is recorded against just this
      // batch's contacts — it must not stop the remaining batches in the queue.
      try {
        const res = await fetch(CREATE_ATTENDEES_URL, {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${uid}` },
          body:    JSON.stringify({
            eventId:        eventId.value,
            attendees:      payload,
            templateCardId: contactPickerForm.value.templateCardId,
            usepng:         props.event?.usepng ?? true,
            kardType:       contactPickerForm.value.kardType,
          }),
        })
        if (!res.ok) throw new Error(`Server error (${res.status})`)
        const json = await res.json()
        if (!json.status) throw new Error(json.message ?? 'Server error')

        // The function now reports one result per attendee (e.g. a single person hitting
        // the max-edits limit no longer aborts the whole batch) — split them out here.
        const okIds = []
        for (const c of batch) {
          const result = (json.data ?? []).find(r => r.attendeeId === c.id)
          if (result?.status) { succeeded.push(c); okIds.push(c.id) }
          else failed.push({ name: c.fullName, reason: result?.message ?? 'Unknown error' })
        }

        // Firestore merge keeps the old 'contact' key alongside the new 'invitation' one —
        // delete it explicitly so the converted doc only carries one card type, same as
        // the single-attendee type-switch path in submitForm(). Only for attendees that
        // actually converted; a cleanup failure here is cosmetic, not a real failure.
        try {
          await Promise.all(okIds.map(id =>
            updateDoc(doc(db, 'events', eventId.value, 'attendees', id), { 'cards.contact': deleteField() })
          ))
        } catch (cleanupErr) {
          console.error('Failed to clear stale contact card key', cleanupErr)
        }
      } catch (batchErr) {
        batch.forEach(c => failed.push({ name: c.fullName, reason: batchErr.message }))
      }
    }

    await loadInitial()
    closeContactPicker()

    if (failed.length) {
      alert(
        `Added ${succeeded.length} guest${succeeded.length !== 1 ? 's' : ''}.\n` +
        `${failed.length} failed:\n` +
        failed.map(f => `• ${f.name} — ${f.reason}`).join('\n')
      )
    }
  } finally {
    contactPickerSubmitting.value = false
  }
}

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

function toggleImportLabel(id) {
  const idx = importSelectedLabels.value.indexOf(id)
  if (idx === -1) importSelectedLabels.value.push(id)
  else importSelectedLabels.value.splice(idx, 1)
}

function validateImportMapping() {
  if (importMapping.name === null)  return 'Select the column that contains the guest name.'
  if (importMapping.phone === null) return 'Select the column that contains the phone number.'
  if (importMapAhadi.value && importMapping.ahadi === null)
    return 'Select the Pledges column or disable the toggle.'
  if (importMapMchango.value && importMapping.mchango === null)
    return 'Select the Contribution column or disable the toggle.'
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
  const phoneIndex = new Map(attendees.value.map(a => [a.phone, a]))

  return importRows.value
    .map(row => {
      const rawName  = String(row[importMapping.name]  ?? '').trim()
      const rawPhone = String(row[importMapping.phone] ?? '').trim()
      if (!rawName && !rawPhone) return null

      const phone = transformNumber(rawPhone)

      const pledgedAmount = (importMapAhadi.value && importMapping.ahadi !== null)
        ? cleanNumeric(row[importMapping.ahadi]) : null
      const paidAmount    = (importMapMchango.value && importMapping.mchango !== null)
        ? cleanNumeric(row[importMapping.mchango]) : null

      const existing = phone ? phoneIndex.get(phone) : null

      return {
        _id:           genAttendeeId(),
        fullName:      rawName,
        fullNameLower: rawName.toLowerCase(),
        phone,
        pledgedAmount,
        paidAmount,
        labelIds:      [...importSelectedLabels.value],
        ...(existing ? {
          _isDuplicate:      true,
          _existingAttendee: {
            fullName:         existing.fullName,
            phone:            existing.phone,
            attendanceStatus: existing.attendanceStatus,
          },
        } : {}),
      }
    })
    .filter(Boolean)
}

async function runImport() {
  if (!importPreviewList.value.length || importing.value) return
  importing.value = true
  const snapshot = [...importPreviewList.value]   // copy so we can mutate the reactive list

  // Firestore batched writes cap at 500 ops — chunk well under that.
  const CHUNK = 400
  for (let i = 0; i < snapshot.length; i += CHUNK) {
    const chunk = snapshot.slice(i, i + CHUNK)
    const batch = writeBatch(db)
    for (const p of chunk) {
      batch.set(doc(db, 'events', eventId.value, 'attendees', p._id), {
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
      }, { merge: true })
    }

    try {
      await batch.commit()
      for (const p of chunk) {
        const idx = importPreviewList.value.findIndex(a => a._id === p._id)
        if (idx !== -1) importPreviewList.value.splice(idx, 1)
        if (p.paidAmount) setImportPayment(p._id, p.paidAmount)
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
  padding: 28px 36px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  --c-bg:     #141414;
  --c-border: #2a2a2a;
  --c-track:  #2a2a2a;
  --c-muted:  #3a3a3a;
  --c-txt:    #f0f0ec;
  --c-txt-2:  #888;
  --c-txt-3:  #555;
  --c-divide: #2a2a2a;
  --c-arrow:  #3a3a3a;
  /* withjoy's dominant button blue — scoped to this page only, not the app's
     --gold brand accent used everywhere else. */
  --wj-blue: #4f46e5;
  --wj-blue-hover: #4338ca;
  transition: background 300ms ease;
}

/* ── Outer panel ── */
.ea-panel {
  display: flex;
  flex-direction: column;
  background: var(--c-bg, #ffffff);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: background 300ms ease, border-color 300ms ease;
}

.ea-panel-hd {
  display: flex;
  align-items: center;
  height: 92px;
  padding: 0 32px;
  gap: 14px;
  flex-shrink: 0;
}
.ea-hd-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.ea-panel-title {
  font-size: 27px;
  font-weight: 800;
  color: var(--c-txt);
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.ea-title-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--c-muted);
  color: var(--c-txt-2);
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--c-border);
}

.ea-hd-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--c-muted);
  border: 1px solid var(--c-border);
  color: var(--wj-blue, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 150ms ease;
}
.ea-hd-icon-badge:hover {
  background: var(--c-bg);
  border-color: var(--wj-blue, #4f46e5);
}
.ea-hd-icon-badge svg { width: 19px; height: 19px; }

/* ── Header hamburger / brand / gear ── */
.ea-hd-gear {
  display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: var(--c-bg); border: 1px solid var(--c-border);
  color: var(--c-txt-2); cursor: pointer; font-family: inherit; padding: 0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: color 130ms, background 130ms, border-color 130ms;
}
.ea-hd-gear:hover { color: var(--c-txt); background: var(--c-muted); border-color: var(--c-txt-3); }
.ea-hd-gear svg { width: 20px; height: 20px; }

/* Bare, borderless lines — no circle chrome — matching withjoy's plain hamburger. */
.ea-hd-burger {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; flex-shrink: 0;
  background: none; border: none;
  color: var(--c-txt); cursor: pointer; font-family: inherit; padding: 0;
  border-radius: 8px;
  transition: color 130ms, background 130ms;
}
.ea-hd-burger:hover { background: var(--c-muted); }
.ea-hd-burger svg { width: 21px; height: 21px; }
.ea-hd-brand {
  display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0;
}
.ea-hd-brand-logo { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.ea-hd-sep { width: 1px; height: 24px; background: var(--c-divide); flex-shrink: 0; margin: 0 2px; }
.ea-panel-acts {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

/* ── Stat cards ── */
.ea-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.ea-stat-card {
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 12px;
  padding: 20px 20px 18px; display: flex; align-items: flex-start; gap: 16px;
  transition: background 300ms ease, border-color 300ms ease;
}

/* ── Header search ── */
/* ── Collapsible search ── */
.ea-search-expanded {
  flex: 1;
  min-width: 160px;
  position: relative;
  display: flex;
  align-items: center;
}
.ea-search-cancel {
  flex-shrink: 0;
  padding: 7px 2px; border-radius: 9px;
  border: none; background: none;
  font-size: 13px; font-weight: 500; color: var(--c-txt-2);
  cursor: pointer; font-family: inherit;
  transition: color 130ms;
}
.ea-search-cancel:hover { color: var(--c-txt); }
.ea-stat-icon {
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0; margin-top: 2px;
  background: rgb(from var(--gold) r g b / 0.08); color: var(--gold);
  display: flex; align-items: center; justify-content: center;
}
.ea-stat-icon--gold   { background: rgb(from var(--gold) r g b / 0.08);  color: var(--gold); }
.ea-stat-icon--blue   { background: rgba(60,168,164,0.09);  color: #3CA8A4; }
.ea-stat-icon--teal   { background: rgba(45,212,191,0.08);  color: #2dd4bf; }
.ea-stat-icon--purple { background: rgba(167,139,250,0.08); color: #a78bfa; }
.ea-stat-body { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ea-stat-lbl  { font-size: 11px; color: var(--c-txt-2); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.6px; text-transform: uppercase; }
.ea-stat-val  { font-size: 32px; font-weight: 700; color: var(--c-txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1; letter-spacing: -0.5px; }

/* ── Toolbar ── */
.ea-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
  padding: 0;
}

.ea-search-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.ea-search-icon {
  position: absolute;
  left: 18px;
  pointer-events: none;
  width: 18px;
  height: 18px;
}
.ea-search {
  width: 100%;
  height: 52px;
  padding: 0 42px 0 48px;
  background: none;
  border: 1.5px solid var(--c-border);
  border-radius: 999px;
  font-size: 16px;
  color: var(--c-txt);
  outline: none;
  box-shadow: none;
  font-family: inherit;
  transition: border-color 150ms, box-shadow 150ms;
}
.ea-search:focus { border-color: rgba(79,70,229,0.4); box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
.ea-search::placeholder { color: var(--c-txt-3); }
.ea-search-clear {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  color: var(--c-txt-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 50%;
}
.ea-search-clear svg { width: 15px; height: 15px; }
.ea-search-filter {
  position: absolute;
  right: 12px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--c-border);
  border-radius: 50%;
  color: var(--c-txt-2);
  flex-shrink: 0;
}
.ea-search-filter svg { width: 14px; height: 14px; }
.ea-search-clear:hover { color: var(--c-txt-2); }

.ea-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ea-tb-acts {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ea-label-select { position: relative; flex-shrink: 0; }
.ea-type-trigger--active { color: #f0ece6; border-color: rgba(240,236,230,0.2); background: rgba(240,236,230,0.06); }
.ea-label-trigger-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.ea-label-drop-sep {
  height: 1px; background: var(--c-divide); margin: 3px 4px;
}
.ea-label-drop-manage { color: var(--c-txt-2) !important; font-size: 12px !important; }
.ea-label-drop-manage:hover { color: var(--gold) !important; }

.ea-type-select { position: relative; flex-shrink: 0; }
.ea-type-trigger {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 12px; border-radius: 10px;
  border: 1px solid var(--c-border); background: var(--c-muted);
  font-size: 12px; font-weight: 500; color: var(--c-txt-2);
  cursor: pointer; font-family: inherit;
  transition: background 140ms; white-space: nowrap;
}
.ea-type-trigger:hover { background: var(--c-bg); color: var(--c-txt); }
.ea-type-trigger-cnt {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; padding: 1px 5px;
  background: var(--c-bg); border-radius: 10px;
  font-size: 11px; font-weight: 600; color: var(--c-txt-2);
}
.ea-type-chevron { color: #505050; transition: transform 150ms; }
.ea-type-chevron--open { transform: rotate(180deg); }
.ea-type-drop {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 50;
  background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 10px;
  padding: 4px; min-width: 170px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.ea-type-drop-item {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 8px 12px; border-radius: 7px;
  border: none; background: none; cursor: pointer;
  font-size: 13px; font-weight: 500; color: var(--c-txt-2);
  font-family: inherit; transition: background 120ms, color 120ms; gap: 10px;
}
.ea-type-drop-item:hover { background: var(--c-badge-bg, rgba(255,255,255,0.05)); color: var(--c-txt); }
.ea-type-drop-item--active { color: var(--c-txt); font-weight: 600; background: rgb(from var(--gold) r g b / 0.12); }
.ea-type-drop-item--active .ea-type-drop-cnt { background: rgb(from var(--gold) r g b / 0.2); color: var(--gold); }
.ea-type-drop-cnt {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; padding: 1px 5px;
  background: var(--c-bg); border-radius: 10px;
  font-size: 11px; font-weight: 600; color: var(--c-txt-2);
}

.ea-add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 28px;
  height: 52px;
  background: var(--wj-blue, #4f46e5);
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms, box-shadow 150ms;
  font-family: inherit;
  flex-shrink: 0;
  letter-spacing: -0.1px;
}
.ea-add-btn:hover { background: #4338ca; box-shadow: 0 2px 8px rgba(79,70,229,0.28); }
.ea-add-btn svg { width: 16px; height: 16px; }
.ea-panel-hd .ea-add-btn { margin-left: 0; }
.ea-panel-hd .ea-search-inline { flex: 0 1 480px; margin: 0 auto; }

.ea-send-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 26px;
  height: 52px;
  background: none;
  color: var(--c-txt-2);
  border: 1px solid var(--c-border);
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms, color 150ms, border-color 150ms;
  font-family: inherit;
  flex-shrink: 0;
  letter-spacing: -0.1px;
}
.ea-send-btn:hover { background: var(--c-muted); color: var(--c-txt); border-color: transparent; }
.ea-send-btn svg { width: 16px; height: 16px; }

/* ── Secondary toolbar: horizontal action pills, withjoy style ── */
.ea-toolbar2 {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--c-divide);
  flex-wrap: wrap;
  min-height: 60px;
}
.ea-tb2-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 130ms, border-color 130ms;
}
.ea-tb2-btn:hover { background: var(--c-muted); }
.ea-tb2-btn--active { background: rgba(79,70,229,0.07); }
.ea-tb2-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ea-tb2-ic {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  color: var(--c-txt-2);
  flex-shrink: 0;
}
.ea-tb2-btn--active .ea-tb2-ic { color: var(--wj-blue); }
.ea-tb2-btn--active .ea-tb2-lbl { color: var(--wj-blue); }
.ea-tb2-lbl {
  display: flex; align-items: center; gap: 5px;
  font-size: 14px; font-weight: 500; color: var(--c-txt-2);
  white-space: nowrap;
}
.ea-tb2-btn:hover .ea-tb2-lbl { color: var(--c-txt); }
.ea-tb2-cnt {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px;
  background: var(--c-muted); font-size: 10px; font-weight: 700; color: var(--c-txt-3);
}
.ea-tb2-sel-count {
  align-self: center; font-size: 12.5px; font-weight: 600; color: var(--c-txt-2); white-space: nowrap;
  padding: 4px 10px;
  margin-left: auto;
  background: var(--c-muted);
  border-radius: 999px;
}
.ea-tb2-btn--danger .ea-tb2-lbl { color: #FF453A; }
.ea-tb2-btn--danger:hover { background: rgba(255,69,58,0.08); }
.ea-tb2-divider { width: 1px; height: 24px; background: var(--c-divide); margin: 0 6px; flex-shrink: 0; }

/* ── Shared row grid — header + data rows align on this template ── */
.ea-row-grid {
  display: grid;
  grid-template-columns: 34px 48px minmax(180px, 2fr) minmax(160px, 1.3fr) minmax(120px, 1fr) 118px 48px;
  align-items: center;
  gap: 20px;
}
.ea-col-head {
  padding: 20px 24px;
  border-bottom: 1px solid var(--c-divide);
  background: var(--ea-col-head-bg, rgba(255,255,255,0.02));
}

/* ── Sticky head — the whole title/toolbar/column-header block moves together
   and stays pinned while scrolling; only the row list scrolls beneath it. ── */
.ea-sticky-head {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--c-bg, #ffffff);
}
.ea-col-cb { display: flex; align-items: center; cursor: pointer; }
.ea-col-avatar { width: 48px; }
.ea-col-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; padding: 0; cursor: pointer; font-family: inherit;
  font-size: 15px; font-weight: 700; color: var(--c-txt);
  text-transform: none; letter-spacing: -0.01em; justify-self: start;
  transition: color 120ms;
}
.ea-col-btn:hover { color: var(--c-txt); }
.ea-col-btn--right { justify-self: start; }
.ea-col-lbl {
  font-size: 15px; font-weight: 700; color: var(--c-txt);
  text-transform: none; letter-spacing: -0.01em;
}
.ea-col-actions { width: 100%; }
.ea-cell { display: flex; align-items: center; gap: 6px; min-width: 0; }
.ea-cell--center { justify-content: center; }
.ea-cell--groups { flex-wrap: wrap; gap: 4px; }
.ea-checkin-dash { color: var(--c-txt-3); font-size: 13px; }


/* ── Selection bar ── */
.ea-selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 16px;
  background: var(--c-bg);
  border-radius: 12px;
  gap: 12px;
}
.ea-sel-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-txt);
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
  display: flex;
  flex-direction: column;
  background: transparent;
  border-top: 1px solid var(--c-border);
  overflow: hidden;
}
.ea-table-scroll {
  overflow-x: auto;
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
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1.5px solid var(--c-border);
  background: transparent;
  cursor: pointer;
  display: block;
  flex-shrink: 0;
  position: relative;
  transition: background 140ms, border-color 140ms, box-shadow 140ms;
}
.ea-cb:hover {
  border-color: var(--gold);
  background: rgb(from var(--gold) r g b / 0.08);
  box-shadow: 0 0 0 3px rgb(from var(--gold) r g b / 0.10);
}
.ea-cb:checked {
  background: var(--gold);
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgb(from var(--gold) r g b / 0.15);
}
.ea-cb:checked::after {
  content: '';
  display: block;
  position: absolute;
  left: 5px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: 2px solid #0a0e1c;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}
.ea-cb:indeterminate {
  background: rgb(from var(--gold) r g b / 0.18);
  border-color: var(--gold);
}
.ea-cb:indeterminate::after {
  content: '';
  display: block;
  position: absolute;
  left: 3px;
  top: 6px;
  width: 8px;
  height: 2px;
  background: var(--gold);
  border-radius: 2px;
}

/* Head */
.ea-th {
  padding: 11px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--c-txt-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  white-space: nowrap;
  background: var(--c-bg);
  border-bottom: 1px solid var(--c-border);
  user-select: none;
  position: sticky;
  top: 0;
  z-index: 1;
}
.ea-th--sortable { cursor: pointer; }
.ea-th--sortable:hover { color: #f0ece6; }
.ea-th--right { text-align: right; }

/* Sort icon */
.ea-sort-icon {
  display: inline;
  vertical-align: middle;
  margin-left: 4px;
  opacity: 0.3;
  transition: opacity 150ms, transform 200ms;
}
.ea-sort-icon--active { opacity: 1; color: var(--gold); }
.ea-sort-icon--desc { transform: rotate(180deg); }

/* Rows */
.ea-tr {
  border-bottom: 1px solid var(--c-border);
  cursor: pointer;
  transition: background 120ms;
}
.ea-tr:last-child { border-bottom: none; }
.ea-tr:hover:not(.ea-tr--skeleton) { background: var(--c-hover, #161616); }
.ea-tr--skeleton { pointer-events: none; }
.ea-tr--selected { background: #FFFBF0 !important; }
.ea-tr--pending { box-shadow: inset 3px 0 0 #FF9F0A; }
.ea-tr--invitation   { box-shadow: inset 2px 0 0 rgba(60, 168, 164, 0.45); }
.ea-tr--contribution { box-shadow: inset 2px 0 0 rgb(from var(--gold) r g b / 0.35); }
.ea-tr--contact      { box-shadow: inset 2px 0 0 rgba(142, 142, 147, 0.22); }
.ea-tr--pending.ea-tr--invitation,
.ea-tr--pending.ea-tr--contribution,
.ea-tr--pending.ea-tr--contact { box-shadow: inset 3px 0 0 #FF9F0A; }

/* Cells */
.ea-td {
  padding: 11px 16px;
  font-size: 13px;
  color: var(--c-txt);
  vertical-align: middle;
  white-space: nowrap;
}
.ea-td--muted { color: var(--c-txt-2); font-size: 12px; }
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
  color: var(--c-txt);
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
  border: 1px solid transparent;
}
.ea-type-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ea-type-badge--invitation {
  background: rgba(60,168,164,0.08);
  color: #3CA8A4;
  border-color: rgba(60,168,164,0.22);
}
.ea-type-badge--invitation::before { background: #3CA8A4; }

.ea-type-badge--contribution {
  background: rgb(from var(--gold) r g b / 0.08);
  color: var(--gold);
  border-color: rgba(184,146,77,0.28);
}
.ea-type-badge--contribution::before { background: linear-gradient(180deg, #2A2A2D 0%, #0A0A0B 100%); }

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
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 130ms;
  color: var(--c-txt-2);
  flex-shrink: 0;
}
.ea-row-btn:hover { background: var(--c-badge-bg, var(--c-bg)); color: var(--c-txt); border-color: var(--c-border); }
.ea-row-btn--edit:hover { color: var(--c-txt); }
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
  color: var(--c-txt-2);
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
  border: 1px solid rgba(255,159,10,0.28);
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
.ea-status-text { font-size: 12px; font-weight: 500; color: var(--c-txt-2); }

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
  background: var(--c-track);
  background-size: 200% 100%;
  animation: ea-shimmer 1.3s infinite;
  flex-shrink: 0;
}
.ea-sk-bar {
  height: 9px;
  border-radius: 5px;
  background: var(--c-track);
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
  padding: 14px 20px;
  border-top: 1px solid var(--c-divide);
  background: transparent;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.ea-range-label {
  font-size: 12.5px;
  color: var(--c-txt-2);
  font-weight: 500;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.ea-paginator {
  display: flex;
  align-items: center;
  gap: 3px;
}
.ea-paginator--disabled { opacity: 0.38; pointer-events: none; }
.ea-page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-txt-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 140ms;
  font-family: inherit;
}
.ea-page-btn:hover:not(:disabled):not(.ea-page-btn--active) {
  background: var(--c-muted);
  color: var(--c-txt);
  border-color: transparent;
}
.ea-page-btn--active {
  background: var(--c-txt);
  border-color: transparent;
  color: var(--c-bg);
  font-weight: 600;
  cursor: default;
}
.ea-page-btn--nav { color: var(--c-txt-2); }
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
  color: var(--c-txt-3);
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
  color: var(--c-txt);
  margin: 0;
}
.ea-empty-sub {
  font-size: 13px;
  color: var(--c-txt-2);
  margin: 0 0 14px;
  line-height: 1.5;
}
.ea-empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: var(--c-bg);
  color: var(--c-txt);
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
  background: var(--c-bg);
  color: var(--c-txt-2);
}
.ea-empty-cta--ghost:hover { opacity: 1; background: #242424; }

/* ── Overlay ── */
.ea-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  z-index: 200;
}
.ea-overlay--center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Modal header layout ── */
.ea-modal-header-left { display: flex; flex-direction: column; gap: 2px; }
.ea-modal-sub { font-size: 11px; color: #666; }
.ea-modal-header-right { display: flex; align-items: center; gap: 8px; }

/* "From Contacts" button */
.ea-phonebook-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  color: var(--gold);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 140ms, border-color 140ms;
  white-space: nowrap;
}
.ea-phonebook-btn:hover { background: rgb(from var(--gold) r g b / 0.08); border-color: rgb(from var(--gold) r g b / 0.3); }

/* "Back" button in picker mode */
.ea-phonebook-back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: transparent;
  color: var(--c-txt-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 140ms, color 140ms;
}
.ea-phonebook-back-btn:hover { background: #222; color: var(--c-txt); }

/* ── "Open on mobile" unsupported hint ── */
.ea-pb-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  background: var(--c-bg);
  text-align: center;
  color: #666;
}
.ea-pb-unsupported svg { color: #444; }
.ea-pb-unsupported-text { font-size: 13px; color: var(--c-txt-2); margin: 0; line-height: 1.5; }
.ea-pb-unsupported-dismiss {
  font-size: 12px;
  font-weight: 600;
  color: var(--gold);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-family: inherit;
}

/* ── Phone-book batch review list ── */
.ea-pb-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--c-track) transparent;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 4px;
}
.ea-pb-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 120ms, opacity 120ms;
}
.ea-pb-row:hover { background: var(--c-bg); }
.ea-pb-row--excluded { opacity: 0.4; }
.ea-pb-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgb(from var(--gold) r g b / 0.12);
  border: 1px solid rgb(from var(--gold) r g b / 0.2);
  color: var(--gold);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ea-pb-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.ea-pb-name { font-size: 13px; font-weight: 600; color: var(--c-txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ea-pb-phone { font-size: 11px; color: #666; }
.ea-pb-toggle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid var(--c-border);
  background: rgb(from var(--gold) r g b / 0.1);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms, border-color 120ms, color 120ms;
}
.ea-pb-toggle--off { background: var(--c-bg); color: var(--c-txt-3); border-color: #222; }

/* ── Modal ── */
.ea-modal {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35);
  overflow: hidden;
  transition: background 300ms ease, border-color 300ms ease;
}
.ea-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 22px;
  border-bottom: 1px solid var(--c-border);
}
.ea-modal-title { font-size: 16px; font-weight: 700; color: var(--c-txt); margin: 0; }
.ea-modal-close {
  background: var(--c-badge-bg, #222);
  border: 1px solid var(--c-border);
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: background 140ms, color 140ms;
}
.ea-modal-close:hover { background: var(--c-border); color: var(--c-txt); }

/* ── WithJoy Add Guest Drawer ── */
.ea-add-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 530px;
  max-width: 100vw;
  background: #ffffff;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  z-index: 1550;
  font-family: inherit;
}

.ea-add-drawer-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f1f3;
  flex-shrink: 0;
  background: #ffffff;
}
.ea-add-drawer-title {
  font-size: 22px;
  font-weight: 700;
  color: #18181b;
  letter-spacing: -0.015em;
  margin: 0;
}
.ea-add-drawer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ea-add-phonebook-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}
.ea-add-phonebook-btn:hover {
  background: #f8fafc;
  border-color: #d1d5db;
}
.ea-add-phonebook-back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #5b3ae8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.ea-add-help-btn {
  background: none;
  border: none;
  color: #5b3ae8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 8px;
}
.ea-add-help-btn:hover {
  text-decoration: underline;
}
.ea-add-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  transition: all 120ms ease;
}
.ea-add-close-btn:hover {
  background: #f4f5f7;
  color: #18181b;
}

/* Form & Scroll Container */
.ea-add-drawer-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ea-add-drawer-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.12) transparent;
}
.ea-add-drawer-scroll::-webkit-scrollbar {
  width: 5px;
}
.ea-add-drawer-scroll::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.12);
  border-radius: 9999px;
}

/* Banner Card */
.ea-add-banner {
  background: #fafafa;
  border: 1px solid #f0f1f3;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ea-add-banner-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.ea-add-banner-row--spread {
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding-top: 4px;
}
.ea-add-banner-divider {
  height: 1px;
  background: #f0f1f3;
}
.ea-add-banner-text {
  font-size: 13.5px;
  font-weight: 500;
  color: #18181b;
  line-height: 1.35;
  max-width: 240px;
}
.ea-add-banner-sub {
  font-size: 13.5px;
  font-weight: 600;
  color: #18181b;
}
.ea-add-banner-link {
  background: none;
  border: none;
  color: #18181b;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  white-space: nowrap;
}
.ea-add-banner-link:hover {
  color: #5b3ae8;
}
.ea-add-banner-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #18181b;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 130ms ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.ea-add-banner-upload-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

/* Party Type Capsule */
.ea-add-party-capsule {
  display: flex;
  background: #f4f5f6;
  padding: 4px;
  border-radius: 10px;
}
.ea-party-tab {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #52525b;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 130ms ease;
  text-align: center;
}
.ea-party-tab--active {
  background: #ffffff;
  color: #18181b;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Section Header */
.ea-add-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ea-add-section-title {
  font-size: 18px;
  font-weight: 700;
  color: #18181b;
  letter-spacing: -0.01em;
  margin: 6px 0 2px;
}

/* Fields & Inputs */
.ea-add-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ea-add-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.ea-add-req-star {
  color: #ef4444;
}
.ea-add-input {
  height: 44px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  font-family: inherit;
  color: #18181b;
  background: #ffffff;
  outline: none;
  transition: border-color 130ms, box-shadow 130ms;
}
.ea-add-input:focus {
  border-color: #5b3ae8;
  box-shadow: 0 0 0 3px rgba(91, 58, 232, 0.12);
}
.ea-add-input--error {
  border-color: #ef4444 !important;
}
.ea-add-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Collapsible Address */
.ea-add-collapse {
  margin-top: 4px;
  border: 1px solid #f0f1f3;
  border-radius: 10px;
  overflow: hidden;
}
.ea-add-collapse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  background: #fafafa;
  border: none;
  cursor: pointer;
  text-align: left;
}
.ea-add-collapse-label {
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
}
.ea-add-collapse-chev {
  color: #71717a;
  transition: transform 150ms ease;
}
.ea-add-collapse-chev--open {
  transform: rotate(180deg);
}
.ea-add-collapse-content {
  padding: 16px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid #f0f1f3;
}

/* Party Member Cards */
.ea-add-members-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 6px;
}
.ea-add-member-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: #fafbfe;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ea-add-member-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #edf2f7;
}
.ea-add-member-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #18181b;
}
.ea-add-member-remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
}
.ea-add-member-remove:hover {
  background: #fef2f2;
}

/* Add a member to this party button */
.ea-add-party-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  background: none;
  border: none;
  color: #5b3ae8;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 120ms ease;
}
.ea-add-party-btn:hover {
  opacity: 0.85;
}
.ea-add-party-icon {
  color: #5b3ae8;
}

/* Footer */
.ea-add-drawer-footer {
  padding: 18px 28px;
  border-top: 1px solid #f0f1f3;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}
.ea-add-req-hint {
  font-size: 12px;
  color: #71717a;
}
.ea-add-footer-btns {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ea-add-save-btn {
  flex: 1;
  height: 48px;
  border-radius: 9999px;
  background: #5b3ae8;
  color: #ffffff;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 130ms ease;
  box-shadow: 0 4px 14px rgba(91, 58, 232, 0.28);
}
.ea-add-save-btn:hover:not(:disabled) {
  background: #4f30dc;
  box-shadow: 0 6px 18px rgba(91, 58, 232, 0.36);
  transform: translateY(-1px);
}
.ea-add-save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.ea-add-cancel-btn {
  padding: 0 20px;
  height: 48px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 130ms ease;
}
.ea-add-cancel-btn:hover {
  background: #f8fafc;
}
.ea-add-del-btn {
  padding: 0 16px;
  height: 48px;
  border-radius: 9999px;
  border: 1px solid #fecaca;
  background: #fff5f5;
  color: #ef4444;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}
.ea-add-del-btn:hover {
  background: #fee2e2;
}

/* ── Send modal ── */
.ea-send-modal { max-width: 480px; }
/* Header is a 3-slot row: two equal-flex side rails (left/right) with the
   title as a fixed-width item between them. Equal flex-grow on both rails
   keeps the title visually centered no matter what lives in either rail —
   unlike the old absolute-positioned side groups, this can't overlap the
   title even if a rail's content grows (that's what broke when the "New
   Campaign" pill got its label back). */
.ea-send-modal .ea-modal-header { padding: 18px 20px; }
.ea-send-modal .ea-modal-title { font-size: 19px; flex-shrink: 0; }
.ea-send-modal-header-side { display: flex; align-items: center; flex: 1 1 0; min-width: 0; }
.ea-send-modal-header-side--left { justify-content: flex-start; }
.ea-send-modal-header-side--right { justify-content: flex-end; gap: 10px; }
/* Equal-flex rails only stay collision-free when both sides are roughly the
   same weight (true on 'root' and 'newCampaign'). On 'campaigns' the right
   rail carries both the labeled pill and the close button while the left
   rail is just a bare arrow — forcing them to equal widths was squeezing the
   pill's text onto two lines. Whenever a back arrow is showing, drop true
   centering for a standard "arrow + left-aligned title" nav pattern instead:
   both rails size to their own content and the title fills whatever's left,
   which can't overflow no matter how wide the right-side content gets. */
.ea-send-modal-header--nav .ea-send-modal-header-side--left,
.ea-send-modal-header--nav .ea-send-modal-header-side--right {
  flex: 0 0 auto;
}
.ea-send-modal-header--nav .ea-modal-title {
  flex: 1 1 auto; text-align: left;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.ea-send-modal-header--centered {
  padding: 16px 20px 10px !important;
}
.ea-send-modal-header--centered .ea-send-modal-header-side {
  flex: 1 1 0;
}
.ea-send-modal-header--centered .ea-modal-title {
  text-align: center;
  flex: 0 0 auto;
  font-size: 16.5px;
  font-weight: 700;
  color: #18181b;
}

.ea-send-modal .ea-modal-close,
.ea-send-modal .ea-send-back {
  border: none;
  background: transparent;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #4b5563;
  transition: background 120ms, color 120ms;
}
.ea-send-modal .ea-modal-close:hover,
.ea-send-modal .ea-send-back:hover {
  background: #f4f5f7;
  color: #18181b;
}

/* Card Selection list (WithJoy match) */
.ea-send-card-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 16px 22px;
}
.ea-send-card-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
  transition: background 130ms ease;
}
.ea-send-card-item:hover {
  background: #f8fafc;
}
.ea-send-card-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #18181b;
  flex-shrink: 0;
}
.ea-send-card-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}
.ea-send-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #18181b;
  letter-spacing: -0.01em;
}
.ea-send-card-desc {
  font-size: 13px;
  color: #71717a;
  line-height: 1.35;
}
.ea-send-card-chev {
  color: #9ca3af;
  flex-shrink: 0;
  transition: transform 120ms ease, color 120ms ease;
}
.ea-send-card-item:hover .ea-send-card-chev {
  color: #18181b;
  transform: translateX(2px);
}
.ea-send-opts {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  padding: 22px;
}
.ea-send-opt {
  /* Teleported to <body>, outside .ea-root — var(--c-border) isn't inherited
     here, so it was silently invalidating this whole border shorthand and
     rendering no outline at all. Hardcoded to match the app's real border color. */
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px;
  padding: 28px 20px; border: 1px solid #e8e8f4; border-radius: 14px;
  cursor: pointer; transition: border-color 150ms, background 150ms;
}
.ea-send-opt:hover { border-color: #4f46e5; background: rgba(79,70,229,0.04); }
.ea-send-opt-art {
  width: 100%; height: 110px; display: flex; align-items: center; justify-content: center;
}
/* Both options share this exact box — same width/height, same centering
   method — so "Card" and "Message" read as a matched pair, not two
   differently-sized graphics that happen to sit near each other. */
.ea-send-opt-box {
  width: 92px; height: 92px; position: relative; flex-shrink: 0;
}
.ea-send-opt-box--msg {
  /* Teleported to <body>, outside .ea-root, so the scoped --wj-blue custom
     property isn't inherited here — hardcode the color instead. */
  display: flex; align-items: center; justify-content: center;
  border-radius: 22px;
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  box-shadow: 0 10px 24px rgba(79,70,229,0.3);
}
.ea-send-opt-box--card .ea-pcard {
  position: absolute; top: 50%; left: 50%; width: 58px; height: 78px; border-radius: 10px;
  margin: -39px 0 0 -29px; /* half height/width — anchors the un-rotated card on the box's exact center */
  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
}
.ea-send-opt-box--card .ea-pcard--1 { background: linear-gradient(160deg,#fde68a,#f59e0b); transform: rotate(-10deg) translateX(-20px); }
.ea-send-opt-box--card .ea-pcard--2 { background: linear-gradient(160deg,#fecdd3,#f43f5e); transform: rotate(4deg); z-index: 1; }
.ea-send-opt-box--card .ea-pcard--3 { background: linear-gradient(160deg,#a5b4fc,#6366f1); transform: rotate(15deg) translateX(20px); }
.ea-send-opt-title { font-size: 16px; font-weight: 700; color: var(--c-txt); }
.ea-send-opt-desc { font-size: 12.5px; color: var(--c-txt-2); line-height: 1.4; }
@media (max-width: 560px) {
  .ea-send-opts { grid-template-columns: 1fr; }
}

/* ── Send modal — Campaigns step + New Campaign step ──
   All colors hardcoded (not var(--c-*)) — this modal is Teleported to
   <body>, outside .ea-root, so those scoped tokens aren't reachable. ── */
.ea-send-back {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  background: none; border: none; color: #6b7280; cursor: pointer; padding: 0;
  transition: background 130ms, color 130ms;
}
.ea-send-back:hover { background: #f4f4fd; color: #1a1a2e; }

.ea-send-camps { padding: 18px 22px 22px; display: flex; flex-direction: column; gap: 14px; }
.ea-send-camps-loading { padding: 24px 4px; text-align: center; color: #6b7280; font-size: 13px; }
.ea-send-camps-divider {
  margin: 4px 0 -4px; font-size: 11px; font-weight: 700; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.ea-send-camps-list { display: flex; flex-direction: column; max-height: 320px; overflow-y: auto; margin: 0 -6px; }
.ea-send-camp-row {
  display: flex; align-items: center; gap: 16px; padding: 14px 6px;
  border-bottom: 1px solid #f0f0f5; border-radius: 10px;
  cursor: pointer; transition: background 130ms;
}
.ea-send-camp-row:hover { background: #f8f8fd; }
.ea-send-camp-row:last-child { border-bottom: none; }
.ea-send-camp-row--disabled { opacity: 0.5; pointer-events: none; }
.ea-send-camp-icon {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
  border: 1.3px solid #e8e8f4; color: #1a1a2e;
  display: flex; align-items: center; justify-content: center;
}
.ea-send-camp-text { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.ea-send-camp-name { font-size: 15.5px; font-weight: 700; color: #1a1a2e; }
.ea-send-camp-meta { font-size: 13px; color: #6b7280; text-transform: capitalize; }
.ea-send-camp-chev { color: #b0b0c0; flex-shrink: 0; }

.ea-form {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ea-field { display: flex; flex-direction: column; gap: 6px; }
.ea-label { font-size: 12px; font-weight: 600; color: var(--c-txt-2); letter-spacing: 0.3px; }
.ea-required { color: #FF453A; }

.ea-input {
  padding: 9px 12px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 13px;
  color: var(--c-txt);
  outline: none;
  background: var(--c-bg);
  transition: border-color 150ms;
  font-family: inherit;
}
.ea-input:focus { border-color: var(--gold); }
.ea-input--error { border-color: #FF453A; }
.ea-field-error { font-size: 11px; color: #FF453A; }

.ea-type-row { display: flex; gap: 6px; }
.ea-type-change-note {
  font-size: 11px;
  color: #FF9F0A;
  margin: 0;
  padding: 6px 10px;
  background: rgba(255,159,10,0.07);
  border: 1px solid rgba(255,159,10,0.2);
  border-radius: 8px;
}
.ea-type-opt {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-bg);
  font-size: 12px;
  font-weight: 600;
  color: var(--c-txt-2);
  cursor: pointer;
  transition: border-color 140ms, background 140ms, color 140ms;
  font-family: inherit;
}
.ea-type-opt:hover { background: var(--c-badge-bg, var(--c-bg)); border-color: var(--c-border); color: var(--c-txt); }
.ea-type-opt--active {
  background: rgb(from var(--gold) r g b / 0.1);
  border-color: rgb(from var(--gold) r g b / 0.35);
  color: var(--gold);
}

/* ── Card template selector ── */
.ea-tpl-state {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--c-txt-2);
  padding: 10px 0;
}
@keyframes ea-tpl-spin { to { transform: rotate(360deg); } }
.ea-tpl-spin { animation: ea-tpl-spin 0.9s linear infinite; flex-shrink: 0; }

.ea-tpl-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--c-txt-2);
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 12px 14px;
  line-height: 1.4;
}
.ea-tpl-empty strong { color: var(--c-txt-2); font-weight: 600; }

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
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-bg);
  font-size: 13px;
  font-weight: 500;
  color: var(--c-txt-2);
  cursor: pointer;
  text-align: left;
  transition: all 140ms;
  font-family: inherit;
}
.ea-tpl-opt:hover { background: var(--c-badge-bg, var(--c-bg)); border-color: var(--c-border); }
.ea-tpl-opt--active {
  background: var(--c-badge-bg, #070707);
  border-color: rgba(184,146,77,0.5);
  color: var(--gold);
  font-weight: 600;
}
.ea-tpl-opt--active svg:first-child { stroke: #B8924D; }
.ea-tpl-check { margin-left: auto; color: var(--gold); flex-shrink: 0; }

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
  border-top: 1px solid var(--c-border);
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
.ea-btn--primary { background: rgb(from var(--gold) r g b / 0.12); color: var(--gold); border: 1px solid rgb(from var(--gold) r g b / 0.3); }
.ea-btn--ghost   { background: var(--c-bg); color: var(--c-txt-2); }
.ea-btn--danger  { background: rgba(255,69,58,0.1); color: #FF453A; }

/* ── Drawer ── */
.ea-drawer {
  position: fixed;
  right: 0; top: 0; bottom: 0;
  width: 360px;
  background: var(--c-bg);
  box-shadow: -4px 0 32px rgba(0,0,0,0.5);
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
  color: var(--c-txt-2);
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 8px;
  transition: all 130ms;
  font-family: inherit;
}
.ea-drawer-back:hover { background: var(--c-bg); color: var(--c-txt); }
.ea-drawer-edit-btn {
  background: var(--c-bg);
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-txt-2);
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 130ms;
  font-family: inherit;
}
.ea-drawer-edit-btn:hover { background: #242424; }

/* Hero */
.ea-drawer-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 24px 22px;
  background: var(--c-bg);
  border-top: 1px solid var(--c-border);
  border-bottom: 1px solid var(--c-border);
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
  color: var(--c-txt);
  margin: 0;
  letter-spacing: -0.2px;
}
.ea-drawer-phone {
  font-size: 13px;
  color: var(--c-txt-2);
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
  color: var(--c-txt-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Actions */
.ea-drawer-actions {
  display: flex;
  gap: 8px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--c-border);
}
.ea-action-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--c-bg);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-txt);
  text-decoration: none;
  transition: background 140ms;
}
.ea-action-pill:hover { background: #242424; }
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
  color: var(--c-txt-3);
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
  border: 1px solid var(--c-border);
  border-radius: 20px;
  background: var(--c-bg);
  font-size: 12px;
  font-weight: 600;
  color: var(--c-txt-2);
  cursor: pointer;
  transition: all 140ms;
  font-family: inherit;
  white-space: nowrap;
}
.ea-status-pill:hover:not(:disabled) { background: var(--c-bg); }
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
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 14px 16px;
}
.ea-contrib-label {
  display: block;
  font-size: 11px;
  color: var(--c-txt-2);
  font-weight: 500;
  margin-bottom: 4px;
}
.ea-contrib-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px;
  font-weight: 700;
  color: var(--c-txt);
}
.ea-contrib-val--paid { color: #30D158; }

/* Mchango interactive bits */
.ea-contrib-card--clickable { cursor: pointer; transition: background 130ms; }
.ea-contrib-card--clickable:hover { background: #F2F1EE; }
.ea-contrib-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.ea-contrib-edit-ico { color: var(--gold); opacity: 0.5; flex-shrink: 0; transition: opacity 130ms; }
.ea-contrib-card--clickable:hover .ea-contrib-edit-ico { opacity: 1; }

.ea-inline-field { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.ea-inline-inp {
  flex: 1; min-width: 0;
  border: 1px solid #B8924D; border-radius: 6px;
  padding: 4px 8px; font-size: 13px; font-family: inherit;
  outline: none; background: #FFFDF5; color: #f0ece6;
}
.ea-inline-ok {
  width: 26px; height: 26px; border-radius: 6px;
  border: none; background: linear-gradient(180deg, #2A2A2D 0%, #0A0A0B 100%); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: background 130ms;
}
.ea-inline-ok:hover:not(:disabled) { background: #B8943E; }
.ea-inline-ok:disabled { opacity: 0.5; cursor: not-allowed; }
.ea-inline-x {
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid #242424; background: var(--c-bg); color: var(--c-txt-2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: background 130ms;
}
.ea-inline-x:hover { background: #242424; }

/* Progress bar */
.ea-pledge-bar-wrap { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.ea-pledge-bar { flex: 1; height: 5px; background: var(--c-track); border-radius: 99px; overflow: hidden; }
.ea-pledge-bar-fill { height: 100%; background: #30D158; border-radius: 99px; transition: width 500ms ease; }
.ea-pledge-pct { font-size: 10px; font-weight: 700; color: #30D158; white-space: nowrap; flex-shrink: 0; }

/* Add payment button */
.ea-add-pay-btn {
  width: 100%; margin-top: 14px; padding: 9px 16px;
  border: 1px dashed #B8924D; border-radius: 10px;
  background: rgba(184,146,77,0.04); color: var(--gold);
  font-size: 12px; font-weight: 600; font-family: inherit;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 6px; transition: background 130ms;
}
.ea-add-pay-btn:hover { background: rgba(184,146,77,0.10); }

/* Inline add-payment form */
.ea-pay-form {
  margin-top: 14px; background: var(--c-bg);
  border: 1px solid var(--c-border); border-radius: 10px; padding: 12px;
}
.ea-pay-form-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.ea-pay-form-label { font-size: 11px; font-weight: 700; color: var(--c-txt); letter-spacing: 0.3px; text-transform: uppercase; }
.ea-pay-form-close {
  width: 22px; height: 22px; border-radius: 50%;
  border: none; background: #242424; color: var(--c-txt-2);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.ea-pay-form-close:hover { background: #E0E0DC; }
.ea-pay-form-row { display: flex; gap: 6px; }
.ea-pay-inp {
  flex: 1; min-width: 0;
  border: 1px solid var(--c-border); border-radius: 8px;
  padding: 8px 12px; font-size: 13px; font-family: inherit;
  outline: none; background: var(--c-bg); color: var(--c-txt); transition: border-color 130ms, box-shadow 130ms;
}
.ea-pay-inp:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(10,10,11,0.04); }
.ea-pay-submit {
  padding: 8px 16px; border: none; border-radius: 8px;
  background: linear-gradient(180deg, #2A2A2D 0%, #0A0A0B 100%); color: #fff; font-size: 13px; font-weight: 600;
  font-family: inherit; cursor: pointer; flex-shrink: 0; transition: background 130ms;
}
.ea-pay-submit:hover:not(:disabled) { background: #B8943E; }
.ea-pay-submit:disabled { opacity: 0.45; cursor: not-allowed; }

/* Payment history list */
.ea-pay-history { margin-top: 14px; }
.ea-pay-empty {
  font-size: 12px; color: var(--c-txt-3); text-align: center;
  padding: 16px 0; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0;
}
.ea-pay-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--c-border);
}
.ea-pay-item:last-child { border-bottom: none; }
.ea-pay-ico {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(184,146,77,0.10);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ea-pay-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ea-pay-amt {
  font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: var(--c-txt); }
.ea-pay-when { font-size: 11px; color: var(--c-txt-2); }
.ea-pay-item-actions { display: flex; gap: 4px; flex-shrink: 0; }
.ea-pay-item-btn {
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--c-border); background: var(--c-bg); color: var(--c-txt-2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 130ms;
}
.ea-pay-item-btn:hover { background: var(--c-badge-bg, #242424); color: var(--c-txt); border-color: var(--c-border); }
.ea-pay-item-btn--del:hover { background: rgba(255,59,48,0.08); color: #FF453A; border-color: rgba(255,59,48,0.3); }
.ea-pay-item-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Footer */
.ea-drawer-added {
  font-size: 12px;
  color: var(--c-txt-3);
  margin: 0;
  padding: 4px 20px 0;
}

/* ── Transitions ── */
.ea-fade-enter-active, .ea-fade-leave-active { transition: opacity 200ms ease; }
.ea-fade-enter-from, .ea-fade-leave-to { opacity: 0; }

.ea-scale-enter-active, .ea-scale-leave-active { transition: transform 220ms ease, opacity 220ms ease; }
.ea-scale-enter-from, .ea-scale-leave-to { transform: scale(0.96); opacity: 0; }

/* Desktop: scale like other modals */
.ea-sheet-enter-active, .ea-sheet-leave-active { transition: transform 220ms ease, opacity 220ms ease; }
.ea-sheet-enter-from, .ea-sheet-leave-to { transform: scale(0.96); opacity: 0; }
/* Mobile: slide up from bottom */
@media (max-width: 600px) {
  .ea-sheet-enter-active, .ea-sheet-leave-active { transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1); opacity: 1; }
  .ea-sheet-enter-from, .ea-sheet-leave-to { transform: translateY(100%); opacity: 1; }
}

/* ── Mobile: modal becomes a bottom sheet ── */
@media (max-width: 600px) {
  .ea-overlay--center { align-items: flex-end; padding: 0; }

  .ea-modal {
    max-width: 100%;
    width: 100%;
    border-radius: 24px 24px 0 0;
    border-bottom: none;
    border-left: none;
    border-right: none;
    max-height: 92dvh;
    overflow-y: auto;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.5);
  }

  /* Drag handle */
  .ea-modal::before {
    content: '';
    display: block;
    width: 36px;
    height: 4px;
    background: #333;
    border-radius: 2px;
    margin: 12px auto 0;
  }

  .ea-modal-header {
    padding: 12px 20px 14px;
    border-bottom-color: #222;
  }
  .ea-modal-title { font-size: 17px; }

  .ea-form { padding: 16px 20px 32px; gap: 18px; }

  .ea-pb-list { max-height: 40vh; }

  .ea-phonebook-btn { padding: 7px 12px; font-size: 12px; }
}

.ea-slide-right-enter-active, .ea-slide-right-leave-active { transition: transform 260ms ease; }
.ea-slide-right-enter-from, .ea-slide-right-leave-to { transform: translateX(100%); }

/* ══════════════════════════════════════════════════════════════
   VUE-TEL-INPUT OVERRIDES
   ══════════════════════════════════════════════════════════════ */

/* Outer wrapper — match ea-input sizing & border */
:deep(.ea-tel-input.vue-tel-input) {
  display: flex;
  align-items: stretch;
  border: 1px solid #242424;
  border-radius: 10px;
  background: var(--c-bg);
  box-shadow: none;
  font-family: inherit;
  transition: border-color 150ms, background 150ms;
  overflow: visible;
}
:deep(.ea-tel-input.vue-tel-input:focus-within) {
  border-color: var(--gold);
  background: var(--c-bg);
  box-shadow: 0 0 0 3px rgba(184,146,77,0.10);
}
:deep(.ea-tel-input--valid.vue-tel-input) { border-color: rgba(48,209,88,0.55); }
:deep(.ea-tel-input--invalid.vue-tel-input) { border-color: rgba(255,69,58,0.55); }

/* Country dropdown button */
:deep(.ea-tel-input .vti__dropdown) {
  border: none;
  border-right: 1px solid #ECECEF;
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
  background: var(--c-bg);
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
  color: #505050;
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
  color: var(--c-txt);
  font-family: inherit;
  border-radius: 0 10px 10px 0;
  min-width: 0;
}
:deep(.ea-tel-input .vti__input::placeholder) { color: #505050; }

/* Dropdown list */
:deep(.ea-tel-input .vti__dropdown-list) {
  border: 1px solid #242424;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.10);
  background: var(--c-bg);
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
  border: 1px solid #242424;
  border-radius: 8px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  background: var(--c-bg);
  color: var(--c-txt);
  display: block;
}
:deep(.ea-tel-input .vti__search_box:focus) { border-color: var(--gold); }

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
:deep(.ea-tel-input .vti__dropdown-item:hover) { background: var(--c-bg); }
:deep(.ea-tel-input .vti__dropdown-item.highlighted) {
  background: #070707;
  color: var(--gold);
  font-weight: 600;
}
:deep(.ea-tel-input .vti__dropdown-item strong) {
  font-weight: 600;
  color: var(--c-txt-2);
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
  background: var(--c-bg);
  color: var(--c-txt-2);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.ea-import-btn:hover {
  background: #070707;
  border-color: rgba(10,10,11,0.15);
  color: var(--gold);
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

/* ── From Contact List toolbar (search + Groups filter) ── */
.ea-cp-toolbar { display: flex; gap: 8px; align-items: center; }
.ea-cp-search { flex: 1; min-width: 0; }
.ea-cp-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 14px 22px; border-top: 1px solid var(--c-border); flex-shrink: 0;
}

/* ── Type hint ── */
.ea-imp-type-hint {
  font-size: 11px;
  color: var(--c-txt-2);
  margin: 4px 0 0;
  line-height: 1.5;
}

/* ── Drop zone ── */
.ea-dropzone {
  border: 1.5px dashed #D8D6D0;
  border-radius: 14px;
  background: var(--c-bg);
  transition: all 180ms;
  position: relative;
  min-height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ea-dropzone--over {
  border-color: var(--gold);
  background: #070707;
}
.ea-dropzone--filled {
  border-style: solid;
  border-color: rgba(10,10,11,0.16);
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
  background: var(--c-bg);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #505050;
  margin-bottom: 4px;
  transition: background 180ms, color 180ms;
}
.ea-dropzone--over .ea-drop-icon {
  background: rgb(from var(--gold) r g b / 0.08);
  color: var(--gold);
}
.ea-drop-title {
  font-size: 13px;
  font-weight: 600;
  color: #3A3936;
  margin: 0;
}
.ea-drop-sub {
  font-size: 12px;
  color: var(--c-txt-2);
  margin: 0;
}
.ea-drop-link { color: var(--gold); font-weight: 600; }

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
  background: var(--c-bg);
  border: none;
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--c-txt-2);
  flex-shrink: 0;
  transition: background 140ms;
}
.ea-file-clear:hover { background: #242424; }

/* ── Import error ── */
.ea-imp-error {
  font-size: 12px;
  color: #FF453A;
  margin: 0;
  padding: 8px 12px;
  background: rgba(255,69,58,0.06);
  border: 1px solid rgba(255,69,58,0.2);
  border-radius: 8px;
}

/* ── Phase 2 header back button ── */
.ea-imp-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ea-imp-back {
  background: var(--c-bg);
  border: none;
  width: 28px; height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--c-txt-2);
  transition: background 130ms;
}
.ea-imp-back:hover { background: #242424; }

/* ── File pill (phase 2) ── */
.ea-imp-file-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--c-bg);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: var(--c-txt-2);
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
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}
.ea-imp-opt { font-weight: 500; color: #505050; text-transform: none; letter-spacing: 0; }

/* ── Label chip scroller ── */
.ea-imp-label-scroller {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ea-imp-label-chip {
  padding: 5px 13px;
  border-radius: 20px;
  border: 1px solid #242424;
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
  background: var(--c-bg);
  border: 1px solid #242424;
  border-radius: 12px;
}
.ea-map-icon-wrap {
  width: 28px; height: 28px;
  background: rgb(from var(--gold) r g b / 0.08);
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
.ea-map-drop-wrap { position: relative; }
.ea-map-drop-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid #242424;
  border-radius: 8px;
  background: var(--c-bg);
  font-size: 12px;
  color: var(--c-txt);
  outline: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color 140ms;
}
.ea-map-drop-trigger:hover,
.ea-map-drop-trigger:focus { border-color: var(--gold); }
.ea-map-drop-placeholder { color: var(--c-txt-3); }
.ea-map-drop { left: 0; right: 0; min-width: auto; max-height: 220px; overflow-y: auto; }
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
  color: var(--c-txt-2);
}
.ea-map-skip {
  font-size: 11px;
  color: var(--c-txt-3);
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
  background: var(--c-track, #2a2a2a);
  border-radius: 10px;
  position: relative;
  transition: background 200ms;
}
.ea-toggle input:checked + .ea-toggle-track { background: var(--gold); }
.ea-toggle-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 15px; height: 15px;
  background: #fff;
  border-radius: 50%;
  transition: transform 200ms;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
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
  background: #0A0A0B;
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
  border-bottom: 1px solid var(--c-border);
}

.ea-imp-preview-hero {
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.ea-imp-preview-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--c-txt);
  margin: 0;
}
.ea-imp-preview-sub {
  font-size: 12px;
  color: var(--c-txt-2);
  margin: 0;
}
.ea-imp-preview-labels { display: flex; flex-wrap: wrap; gap: 5px; }

.ea-imp-tpl-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: var(--c-bg);
  border-bottom: 1px solid var(--c-border);
  font-size: 11px;
  color: var(--c-txt-2);
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
  background: var(--c-bg);
  border: 1px solid #242424;
  border-radius: 12px;
  transition: background 120ms;
}
.ea-imp-preview-row:hover { background: var(--c-bg); }
.ea-imp-row-num {
  width: 24px; height: 24px;
  background: var(--c-bg);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--c-txt-2);
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
  color: var(--c-txt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ea-imp-row-phone { font-size: 11px; color: var(--c-txt-2); }
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
.ea-imp-amount--pledge  { background: rgba(184,146,77,0.10); color: var(--gold); }
.ea-imp-amount--paid    { background: rgba(48,209,88,0.10);  color: #1A8C3A; }

.ea-imp-row-remove {
  background: none;
  border: none;
  color: #505050;
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

/* ── Duplicate detection ── */
.ea-imp-dup-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 4px;
  padding: 10px 14px;
  background: rgba(255,69,58,0.08);
  border: 1px solid rgba(255,69,58,0.25);
  border-radius: 10px;
  font-size: 12px;
  color: #FF6B6B;
  flex-shrink: 0;
}
.ea-imp-dup-banner svg { flex-shrink: 0; opacity: 0.85; }
.ea-imp-dup-banner span { flex: 1; }
.ea-imp-dup-remove-all {
  background: rgba(255,69,58,0.12);
  border: 1px solid rgba(255,69,58,0.30);
  border-radius: 7px;
  color: #FF453A;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms;
}
.ea-imp-dup-remove-all:hover { background: rgba(255,69,58,0.22); }

.ea-imp-preview-row--dup {
  border-color: rgba(255,69,58,0.35);
  background: rgba(255,69,58,0.05);
}
.ea-imp-preview-row--dup:hover { background: rgba(255,69,58,0.09); }

.ea-imp-row-name-line {
  display: flex;
  align-items: center;
  gap: 7px;
}
.ea-imp-dup-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(255,69,58,0.15);
  color: #FF453A;
  flex-shrink: 0;
}
.ea-imp-dup-compare {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  padding: 5px 9px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,69,58,0.15);
  border-radius: 7px;
  font-size: 10.5px;
}
.ea-imp-dup-compare-label {
  color: #FF6B6B;
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.ea-imp-dup-compare-name  { color: #c8d0df; font-weight: 600; }
.ea-imp-dup-compare-phone { color: var(--c-txt-2); }
.ea-imp-dup-compare-sep   { color: #3a4358; }
.ea-imp-dup-compare-status { font-weight: 600; color: var(--c-txt-2); }
.ea-imp-dup-status--confirmed { color: #30D158; }
.ea-imp-dup-status--declined  { color: #FF453A; }

/* ── Single-add duplicate warning ── */
.ea-add-dup-warn {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 6px;
  padding: 9px 12px;
  background: rgba(255,69,58,0.07);
  border: 1px solid rgba(255,69,58,0.25);
  border-radius: 9px;
  color: #FF6B6B;
}
.ea-add-dup-warn > svg { flex-shrink: 0; opacity: 0.85; align-self: flex-start; margin-top: 1px; }
.ea-add-dup-warn-text { font-size: 11.5px; font-weight: 600; color: #FF6B6B; }
.ea-add-dup-warn .ea-imp-dup-compare { margin-top: 2px; }

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
  border-top: 1px solid var(--c-border);
  flex-shrink: 0;
}
.ea-imp-run-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  background: #0A0A0B;
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

/* ── Label filter row ── */
.ea-lf-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Bulk label dropdown ── */
.ea-sel-label-wrap { position: relative; }
.ea-sel-btn--label {
  background: rgba(255,255,255,0.15);
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background 130ms;
}
.ea-sel-btn--label:hover { background: rgba(255,255,255,0.22); }
.ea-bulk-label-drop {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  background: #161616;
  border: 1px solid #242424;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.14);
  min-width: 180px;
  padding: 6px;
  z-index: 200;
}
.ea-bld-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-txt);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background 120ms;
}
.ea-bld-item:hover { background: var(--c-bg); }
.ea-bld-item--clear { color: #8E8E93; font-size: 12px; }
.ea-bld-divider { height: 1px; background: var(--c-divide); margin: 4px 0; }
.ea-bld-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

/* ── Label Manager modal ── */
.ea-lm-modal { max-width: 420px; }
.ea-lm-body { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 0; }
.ea-lm-list { display: flex; flex-direction: column; gap: 2px; }
.ea-lm-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  transition: background 120ms;
}
.ea-lm-row:hover { background: var(--c-bg); }
.ea-lm-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
.ea-lm-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--c-txt); }
.ea-lm-action {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent;
  border-radius: 7px; cursor: pointer; color: var(--c-txt-2);
  transition: all 120ms;
}
.ea-lm-action:hover { background: var(--c-bg); color: var(--c-txt); }
.ea-lm-action--del:hover { background: rgba(255,69,58,0.08); color: #FF453A; }
.ea-lm-edit-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #F9F8F6;
  border-radius: 10px;
  border: 1px solid #E8E6E0;
}
.ea-lm-palette { display: flex; gap: 6px; flex-wrap: wrap; }
.ea-lm-color {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 120ms, border-color 120ms;
  flex-shrink: 0;
}
.ea-lm-color:hover { transform: scale(1.15); }
.ea-lm-color--on { border-color: #f0ece6; transform: scale(1.15); }
.ea-lm-edit-fields { display: flex; flex-direction: column; gap: 6px; }
.ea-lm-edit-actions { display: flex; gap: 6px; justify-content: flex-end; }
.ea-lm-edit-cancel {
  padding: 5px 12px; border: 1px solid #242424; border-radius: 7px;
  background: var(--c-bg); font-size: 12px; font-weight: 500; color: var(--c-txt-2);
  cursor: pointer; font-family: inherit;
}
.ea-lm-input {
  width: 100%; padding: 8px 11px;
  border: 1px solid #242424; border-radius: 8px;
  font-size: 13px; color: var(--c-txt); outline: none;
  font-family: inherit; box-sizing: border-box;
  transition: border-color 150ms;
}
.ea-lm-input:focus { border-color: var(--gold); }
.ea-lm-save-btn {
  padding: 6px 14px; border: none; border-radius: 8px;
  background: rgba(240,236,230,0.10); color: #f0ece6;
  font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: opacity 140ms; white-space: nowrap;
}
.ea-lm-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ea-lm-save-btn:not(:disabled):hover { opacity: 0.82; }
.ea-lm-empty { font-size: 13px; color: var(--c-txt-2); text-align: center; padding: 12px 0 8px; }
.ea-lm-divider { height: 1px; background: var(--c-divide); margin: 14px 0; }
.ea-lm-section-hd { font-size: 11px; font-weight: 700; color: var(--c-txt-2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.ea-lm-create { display: flex; flex-direction: column; gap: 10px; }
.ea-lm-create-row { display: flex; align-items: center; gap: 8px; }
.ea-lm-preview-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }

/* ── Card list ── */
/* ea-list-sort-bar removed — controls merged into ea-tabs-row */
.ea-tabs-row {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--c-divide);
  flex-shrink: 0;
}
.ea-sort-controls {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  flex-shrink: 0;
  border-left: 1px solid var(--c-divide);
}
.ea-list-sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: none;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-txt-3);
  cursor: pointer;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  transition: color 130ms, background 130ms, border-color 130ms;
}
.ea-list-sort-btn:hover { color: var(--c-txt-2); background: var(--c-bg); border-color: #242424; }
.ea-list-sort-btn--active { color: var(--gold); border-color: rgb(from var(--gold) r g b / 0.25); background: rgb(from var(--gold) r g b / 0.05); }
.ea-list-select-all {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 600;
  color: #505050;
  cursor: pointer;
  user-select: none;
}
.ea-list-select-all:hover { color: var(--c-txt-2); }

.ea-list {
  display: flex;
  flex-direction: column;
  background: var(--c-bg);
}

/* ── Individual row ── */
.ea-card {
  padding: 13px 20px;
  background: var(--c-bg);
  border: none;
  border-bottom: 1px solid var(--c-divide);
  border-radius: 0;
  transition: background 120ms;
  cursor: pointer;
  position: relative;
  min-height: 60px;
}
.ea-list .ea-card:first-child { border-top: 1px solid var(--c-divide); }
.ea-card:hover:not(.ea-card--sk) { background: var(--c-hover, var(--c-bg)); }
.ea-card--sk { pointer-events: none; }
.ea-card--selected { background: rgb(from var(--gold) r g b / 0.06); }

/* Left border stripe per type */
.ea-card--invitation   { box-shadow: inset 3px 0 0 rgba(60,168,164,0.55); }
.ea-card--contribution { box-shadow: inset 3px 0 0 rgb(from var(--gold) r g b / 0.50); }
.ea-card--contact      { box-shadow: inset 3px 0 0 rgba(142,142,147,0.30); }
.ea-card--pending      { box-shadow: inset 3px 0 0 #FF9F0A !important; }

/* Combine selected + type stripe */
.ea-card--selected.ea-card--invitation   { box-shadow: inset 3px 0 0 rgba(60,168,164,0.55), 0 0 0 1px rgb(from var(--gold) r g b / 0.25) inset; }
.ea-card--selected.ea-card--contribution { box-shadow: inset 3px 0 0 rgb(from var(--gold) r g b / 0.50), 0 0 0 1px rgb(from var(--gold) r g b / 0.25) inset; }
.ea-card--selected.ea-card--contact      { box-shadow: inset 3px 0 0 rgba(142,142,147,0.30), 0 0 0 1px rgb(from var(--gold) r g b / 0.25) inset; }
.ea-card--selected.ea-card--pending      { box-shadow: inset 3px 0 0 #FF9F0A, 0 0 0 1px rgb(from var(--gold) r g b / 0.25) inset !important; }

/* Avatar */
.ea-card-av-wrap { position: relative; flex-shrink: 0; }
.ea-card-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  font-size: 15px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ea-card-type-dot {
  position: absolute; bottom: -1px; right: -1px;
  width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid var(--c-bg);
}
.ea-card--invitation   .ea-card-type-dot { background: rgba(60,168,164,0.85); }
.ea-card--contribution .ea-card-type-dot { background: var(--gold); }
.ea-card--contact      .ea-card-type-dot { background: #555; }
.ea-card--pending      .ea-card-type-dot { background: #FF9F0A; }

/* Skeleton avatar tweak */
.ea-sk-circle--card { width: 44px; height: 44px; border-radius: 50%; }

/* Identity */
.ea-card-info {
  display: flex; flex-direction: column; gap: 3px;
  flex: 0 0 200px; min-width: 0;
}
.ea-card-name {
  font-size: 15px; font-weight: 600; color: var(--c-txt);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ea-card-meta { font-size: 14px; color: var(--c-txt-2); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* Badges zone */
.ea-card-badges {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* Attendance status inline pill badge */
.ea-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--c-txt-2);
  white-space: nowrap;
  background: var(--c-muted);
  border: 1px solid var(--c-border);
  letter-spacing: -0.01em;
  transition: all 140ms ease;
}
.ea-status-pill .ea-status-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}
.ea-status-pill--confirmed {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.25);
  color: #10B981;
}
.ea-status-pill--not-confirmed {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  color: #9CA3AF;
}
.ea-status-pill--declined {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.25);
  color: #EF4444;
}
.ea-status-pill--called {
  background: rgba(14, 165, 233, 0.12);
  border-color: rgba(14, 165, 233, 0.25);
  color: #0EA5E9;
}
.ea-status-pill--unreachable {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.25);
  color: #F59E0B;
}

.ea-checkin-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.ea-groups-empty {
  color: var(--c-txt-3);
  font-size: 13px;
}

/* Date */
.ea-card-date {
  font-size: 13px; color: var(--c-txt-2);
  white-space: nowrap; flex-shrink: 0; text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Row action buttons: hidden until hover, always visible when pending */
.ea-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 140ms;
}
.ea-card:hover .ea-card-actions { opacity: 1; }
.ea-card--pending .ea-card-actions { opacity: 1; }

.ea-row-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  color: var(--c-txt-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: all 120ms ease;
}
.ea-row-btn:hover {
  background: var(--c-muted);
  color: var(--c-txt);
  border-color: var(--c-txt-3);
}

/* Mobile responsive — CSS Grid */
@media (max-width: 640px) {
  .ea-col-head { display: none; }
  .ea-list { padding: 8px 10px; gap: 6px; }
  .ea-card {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    grid-template-areas:
      "cb avatar name   date"
      "cb avatar meta   meta"
      "cb avatar status status"
      "cb avatar groups groups";
    align-items: start;
    gap: 3px 10px;
    padding: 12px 14px;
    border: 1px solid var(--c-border);
    border-radius: 12px;
  }
  .ea-col-cb        { grid-area: cb; align-self: start; padding-top: 2px; }
  .ea-card-av-wrap  { grid-area: avatar; align-self: start; padding-top: 2px; }
  .ea-card-name     { grid-area: name; }
  .ea-card-meta     { grid-area: meta; }
  .ea-cell--status  { grid-area: status; margin-top: 4px; }
  .ea-cell--checkin { display: none; }
  .ea-cell--groups  { grid-area: groups; margin-top: 4px; }
  .ea-card-date     { grid-area: date; align-self: start; padding-top: 2px; }
  .ea-card-actions  { display: none; }
}
@media (max-width: 400px) {
  .ea-card-date { display: none; }
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .ea-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 767px) {
  .ea-root { padding: 12px 14px 20px; gap: 12px; }
  .ea-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; min-width: 0; }

  /* Panel header: stack into 3 predictable rows — nav / search / actions —
     instead of letting everything wrap inside a fixed-height box (that fixed
     height is what was clipping wrapped content and causing the Add Guest
     button to float on top of the toolbar below it). */
  .ea-panel-hd { flex-wrap: wrap; height: auto; padding: 12px 16px; gap: 10px; row-gap: 10px; }
  .ea-hd-sep { display: none; }
  .ea-hd-burger { order: 0; }
  .ea-hd-icon-badge { order: 1; }
  .ea-hd-title-group { order: 2; flex: 1 1 auto; min-width: 0; }
  .ea-panel-title { font-size: 19px; }
  .ea-hd-gear { order: 3; }
  .ea-panel-hd .ea-search-inline { order: 4; flex: 1 1 100%; max-width: none; }
  .ea-send-btn { order: 5; flex: 1 1 0; justify-content: center; height: 46px; padding: 0 16px; font-size: 14px; }
  .ea-panel-hd .ea-add-btn { order: 6; flex: 1 1 0; justify-content: center; height: 46px; padding: 0 16px; font-size: 14px; margin-left: 0; }

  /* Secondary toolbar: allow wrap, tighten a bit */
  .ea-toolbar2 { gap: 6px; padding: 8px 10px; }
  .ea-tb2-btn { padding: 5px 8px; }

  /* Stat cards: min-width:0 lets grid cells shrink; overflow:hidden clips long labels */
  .ea-stat-card { padding: 14px 14px 12px; gap: 12px; min-width: 0; overflow: hidden; }
  .ea-stat-icon { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; }
  .ea-stat-val { font-size: 24px; }
  .ea-stat-body { gap: 6px; min-width: 0; }
}
@media (max-width: 400px) {
  .ea-tb2-lbl { display: none; }
  .ea-add-btn { flex: 1; justify-content: center; padding: 10px 16px; font-size: 14px; }
  .ea-stat-val { font-size: 20px; }
  .ea-stat-card { padding: 12px 12px 10px; gap: 10px; }
}

.ea-tabs-spacer { flex: 1; }

/* ── Type tabs ── */
.ea-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 20px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.ea-tabs::-webkit-scrollbar { display: none; }
.ea-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-txt-2);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 130ms, border-color 130ms;
  white-space: nowrap;
}
.ea-tab:hover { color: var(--c-txt); }
.ea-tab--active {
  color: var(--c-txt);
  border-bottom-color: var(--gold);
}
.ea-tab-cnt {
  font-size: 11px;
  font-weight: 600;
  background: var(--c-badge-bg, #242424);
  color: var(--c-txt-2);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
.ea-tab--active .ea-tab-cnt {
  background: rgb(from var(--gold) r g b / 0.12);
  color: var(--gold);
}
@media (max-width: 640px) {
  /* Row wraps: tabs on top, sort controls drop below */
  .ea-tabs-row { flex-wrap: wrap; }
  .ea-tabs { padding: 0 12px; gap: 0; width: 100%; flex: unset; border-bottom: 1px solid var(--c-border); }
  .ea-tab { padding: 10px 10px; font-size: 12px; flex-shrink: 0; }
  .ea-sort-controls {
    border-left: none;
    border-top: 1px solid var(--c-border);
    padding: 7px 14px;
    width: 100%;
    gap: 6px;
  }
  .ea-list-select-all { margin-left: auto; }
}
</style>