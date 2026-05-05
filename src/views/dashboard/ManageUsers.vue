<template>
  <div class="page">

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <span class="stat-num">{{ users.length }}</span>
        <span class="stat-label">Total Users</span>
      </div>
      <div class="stat-card">
        <span class="stat-num stat-num--green">{{ activeCount }}</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat-card">
        <span class="stat-num stat-num--red">{{ inactiveCount }}</span>
        <span class="stat-label">Inactive</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <MagnifyingGlassIcon class="search-icon" />
        <input v-model="searchQuery" class="search-input" placeholder="Search name, email or phone…" />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
          <XMarkIcon class="search-clear-icon" />
        </button>
      </div>
      <div class="filter-tabs">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          :class="['tab', statusFilter === f.value && 'tab--active']"
          @click="statusFilter = f.value"
        >{{ f.label }}</button>
      </div>
      <button class="add-btn" @click="openCreate">
        <PlusIcon class="btn-icon" />
        Add User
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-center">
      <div class="spinner" />
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="state-center">
      <div class="empty-icon-wrap">
        <UsersIcon class="empty-icon" />
      </div>
      <p class="empty-title">{{ searchQuery ? 'No results found' : 'No users yet' }}</p>
      <p class="empty-sub">{{ searchQuery ? 'Try a different search term.' : 'Add your first user above.' }}</p>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="th">User</th>
            <th class="th">Phone</th>
            <th class="th">Balance</th>
            <th class="th">Status</th>
            <th class="th">Clearance</th>
            <th class="th">Last Login</th>
            <th class="th th--end"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in paginated" :key="u.id" class="row">
            <td class="td">
              <div class="cell-user">
                <div class="avatar" :style="avatarBg(u)">
                  <img v-if="u.profileImage" :src="u.profileImage" class="avatar-img" @error="e => e.target.style.display = 'none'" />
                  <span class="avatar-letters">{{ initials(u) }}</span>
                </div>
                <div class="user-meta">
                  <span class="user-name">{{ fullName(u) }}</span>
                  <span class="user-email">{{ u.email || '—' }}</span>
                </div>
              </div>
            </td>
            <td class="td td--muted">{{ u.phoneNumber || '—' }}</td>
            <td class="td">
              <button class="balance-btn" @click="openBalanceModal(u)" title="Adjust balance">
                {{ formatBalance(u.balance) }}
              </button>
            </td>
            <td class="td">
              <button
                :class="['status-pill', u.isActive && 'status-pill--on']"
                @click="toggleActive(u)"
              >
                <span class="dot" />{{ u.isActive ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td class="td">
              <span :class="['cl-badge', `cl-${u.clearanceLevel ?? 0}`]">L{{ u.clearanceLevel ?? 0 }}</span>
            </td>
            <td class="td td--date">{{ formatDate(u.lastLoginDate) }}</td>
            <td class="td">
              <div class="row-actions">
                <button class="icon-btn" @click="openEdit(u)" title="Edit">
                  <PencilSquareIcon class="ib-svg" />
                </button>
                <button class="icon-btn icon-btn--del" @click="confirmDelete(u)" title="Delete">
                  <TrashIcon class="ib-svg" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">
        <ChevronLeftIcon class="pg-arrow" />
      </button>
      <template v-for="p in pageNumbers" :key="p">
        <span v-if="p === '…'" class="pg-ellipsis">…</span>
        <button v-else :class="['pg-btn', currentPage === p && 'pg-btn--active']" @click="currentPage = p">{{ p }}</button>
      </template>
      <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">
        <ChevronRightIcon class="pg-arrow" />
      </button>
    </div>

    <!-- Delete confirm -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="deletingUser" class="backdrop" @click.self="deletingUser = null">
          <div class="confirm-box">
            <div class="warn-icon-wrap">
              <ExclamationTriangleIcon class="warn-icon" />
            </div>
            <p class="confirm-title">Delete this user?</p>
            <p class="confirm-body">
              <strong>{{ fullName(deletingUser) }}</strong> will be permanently removed. This cannot be undone.
            </p>
            <div class="confirm-row">
              <button class="cancel-btn" :disabled="deleting" @click="deletingUser = null">Cancel</button>
              <button class="del-btn" :disabled="deleting" @click="doDelete">
                {{ deleting ? 'Deleting…' : 'Delete User' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Balance modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="balanceUser" class="backdrop" @click.self="balanceUser = null">
          <div class="balance-modal">

            <div class="modal-header">
              <span class="modal-title">Adjust Balance</span>
              <button class="close-btn" @click="balanceUser = null"><XMarkIcon class="close-icon" /></button>
            </div>

            <div class="bal-current">
              <span class="bal-current-label">Current Balance</span>
              <span class="bal-current-val">{{ formatBalance(balanceUser.balance) }}</span>
            </div>

            <div class="bal-mode-row">
              <button :class="['bal-mode-btn', balanceMode === 'set' && 'bal-mode-btn--on']" @click="balanceMode = 'set'">
                Set to value
              </button>
              <button :class="['bal-mode-btn', balanceMode === 'add' && 'bal-mode-btn--on']" @click="balanceMode = 'add'">
                Add / Deduct
              </button>
            </div>

            <div class="field">
              <label class="field-label">{{ balanceMode === 'set' ? 'New Balance (TZS)' : 'Amount (TZS)' }}</label>
              <input
                v-model.number="balanceInput"
                class="field-input"
                type="number"
                step="1"
                :placeholder="balanceMode === 'set' ? '0' : 'e.g. 5000 or -500'"
              />
            </div>

            <div class="bal-preview">
              <span class="bal-preview-label">Result</span>
              <span class="bal-preview-val" :class="previewBalance < 0 && 'bal-preview-val--neg'">
                {{ formatBalance(previewBalance) }}
              </span>
            </div>

            <p v-if="balanceError" class="error-msg">{{ balanceError }}</p>

            <button class="submit-btn" :disabled="savingBalance || balanceInput === null || balanceInput === ''" @click="doAdjustBalance">
              {{ savingBalance ? 'Saving…' : 'Save Balance' }}
            </button>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit / Create modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal" class="backdrop" @click.self="closeModal">
          <div class="modal">

            <div class="modal-header">
              <span class="modal-title">{{ editingUser ? 'Edit User' : 'Add User' }}</span>
              <button class="close-btn" @click="closeModal">
                <XMarkIcon class="close-icon" />
              </button>
            </div>

            <div class="fields-grid">
              <div class="field">
                <label class="field-label">First Name</label>
                <input v-model="form.firstName" class="field-input" placeholder="First name" />
              </div>
              <div class="field">
                <label class="field-label">Last Name</label>
                <input v-model="form.lastName" class="field-input" placeholder="Last name" />
              </div>
            </div>

            <div v-if="!editingUser" class="field">
              <label class="field-label">Email</label>
              <input v-model="form.email" class="field-input" type="email" placeholder="user@example.com" />
            </div>

            <div v-if="!editingUser" class="field">
              <label class="field-label">Password</label>
              <input v-model="form.password" class="field-input" type="password" placeholder="Min. 6 characters" />
            </div>

            <div class="field">
              <label class="field-label">Phone Number</label>
              <div class="phone-row">
                <button type="button" class="country-trigger" @click="showCountryDrop = !showCountryDrop">
                  <span class="ctry-flag">{{ phoneCountry.flag }}</span>
                  <span class="ctry-code">+{{ phoneCountry.dialCode }}</span>
                  <ChevronDownIcon class="ctry-caret" :class="showCountryDrop && 'ctry-caret--up'" />
                </button>
                <input
                  :value="phoneLocal"
                  @input="onPhoneLocalInput"
                  class="phone-local"
                  type="tel"
                  placeholder="712 345 678"
                />
              </div>
              <div v-if="showCountryDrop" class="country-picker">
                <div class="picker-search-wrap">
                  <MagnifyingGlassIcon class="picker-search-icon" />
                  <input v-model="countrySearch" class="picker-search" placeholder="Search country or code…" />
                </div>
                <div class="country-list">
                  <button
                    v-for="c in filteredCountries"
                    :key="c.code"
                    type="button"
                    :class="['country-opt', c.code === phoneCountry.code && 'country-opt--active']"
                    @click="selectCountry(c)"
                  >
                    <span class="c-flag">{{ c.flag }}</span>
                    <span class="c-name">{{ c.name }}</span>
                    <span class="c-dial">+{{ c.dialCode }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!editingUser" class="field">
              <label class="field-label">Initial Balance (TZS)</label>
              <input v-model.number="form.balance" class="field-input" type="number" min="0" step="1" placeholder="0" />
            </div>

            <div class="field">
              <label class="field-label">Clearance Level</label>
              <div class="select-wrap">
                <select v-model.number="form.clearanceLevel" class="field-input">
                  <option v-for="n in 6" :key="n - 1" :value="n - 1">Level {{ n - 1 }}</option>
                </select>
                <ChevronDownIcon class="select-caret" />
              </div>
            </div>

            <div v-if="editingUser" class="meta-strip">
              <div class="meta-item">
                <span class="meta-key">Registered</span>
                <span class="meta-val">{{ formatDate(editingUser.registrationDate) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-key">Last Login</span>
                <span class="meta-val">{{ formatDate(editingUser.lastLoginDate) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-key">User ID</span>
                <span class="meta-val meta-mono">{{ editingUser.id }}</span>
              </div>
            </div>

            <div class="toggles-row">
              <div class="toggle-item">
                <div class="toggle-text">
                  <span class="toggle-label">Active</span>
                  <span class="toggle-sub">User can access the platform</span>
                </div>
                <button :class="['toggle', form.isActive && 'toggle--on']" @click="form.isActive = !form.isActive" />
              </div>
            </div>

            <p v-if="saveError" class="error-msg">{{ saveError }}</p>

            <button
              class="submit-btn"
              :disabled="saving || !form.firstName.trim() || (!editingUser && (form.password.length < 6 || !form.email.trim()))"
              @click="submit"
            >
              {{ saving ? 'Saving…' : editingUser ? 'Save Changes' : 'Add User' }}
            </button>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { firebaseApp, db } from '../../firebase.js'
import {
  collection, getDocs, setDoc, updateDoc,
  deleteDoc, doc, orderBy, query,
} from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import {
  PlusIcon, TrashIcon, PencilSquareIcon, XMarkIcon,
  MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
  ExclamationTriangleIcon, UsersIcon, ChevronDownIcon,
} from '@heroicons/vue/24/outline'

const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania',        dialCode: '255', flag: '🇹🇿' },
  { code: 'KE', name: 'Kenya',           dialCode: '254', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda',          dialCode: '256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda',          dialCode: '250', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi',         dialCode: '257', flag: '🇧🇮' },
  { code: 'ET', name: 'Ethiopia',        dialCode: '251', flag: '🇪🇹' },
  { code: 'SO', name: 'Somalia',         dialCode: '252', flag: '🇸🇴' },
  { code: 'SS', name: 'South Sudan',     dialCode: '211', flag: '🇸🇸' },
  { code: 'CD', name: 'DR Congo',        dialCode: '243', flag: '🇨🇩' },
  { code: 'ER', name: 'Eritrea',         dialCode: '291', flag: '🇪🇷' },
  { code: 'DJ', name: 'Djibouti',        dialCode: '253', flag: '🇩🇯' },
  { code: 'KM', name: 'Comoros',         dialCode: '269', flag: '🇰🇲' },
  { code: 'AO', name: 'Angola',          dialCode: '244', flag: '🇦🇴' },
  { code: 'AR', name: 'Argentina',       dialCode: '54',  flag: '🇦🇷' },
  { code: 'AU', name: 'Australia',       dialCode: '61',  flag: '🇦🇺' },
  { code: 'AT', name: 'Austria',         dialCode: '43',  flag: '🇦🇹' },
  { code: 'BD', name: 'Bangladesh',      dialCode: '880', flag: '🇧🇩' },
  { code: 'BE', name: 'Belgium',         dialCode: '32',  flag: '🇧🇪' },
  { code: 'BW', name: 'Botswana',        dialCode: '267', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil',          dialCode: '55',  flag: '🇧🇷' },
  { code: 'CM', name: 'Cameroon',        dialCode: '237', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada',          dialCode: '1',   flag: '🇨🇦' },
  { code: 'CL', name: 'Chile',           dialCode: '56',  flag: '🇨🇱' },
  { code: 'CN', name: 'China',           dialCode: '86',  flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia',        dialCode: '57',  flag: '🇨🇴' },
  { code: 'CI', name: 'Côte d\'Ivoire',  dialCode: '225', flag: '🇨🇮' },
  { code: 'DK', name: 'Denmark',         dialCode: '45',  flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt',           dialCode: '20',  flag: '🇪🇬' },
  { code: 'FI', name: 'Finland',         dialCode: '358', flag: '🇫🇮' },
  { code: 'FR', name: 'France',          dialCode: '33',  flag: '🇫🇷' },
  { code: 'DE', name: 'Germany',         dialCode: '49',  flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana',           dialCode: '233', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece',          dialCode: '30',  flag: '🇬🇷' },
  { code: 'IN', name: 'India',           dialCode: '91',  flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia',       dialCode: '62',  flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland',         dialCode: '353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel',          dialCode: '972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy',           dialCode: '39',  flag: '🇮🇹' },
  { code: 'JP', name: 'Japan',           dialCode: '81',  flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan',          dialCode: '962', flag: '🇯🇴' },
  { code: 'KW', name: 'Kuwait',          dialCode: '965', flag: '🇰🇼' },
  { code: 'LB', name: 'Lebanon',         dialCode: '961', flag: '🇱🇧' },
  { code: 'MW', name: 'Malawi',          dialCode: '265', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia',        dialCode: '60',  flag: '🇲🇾' },
  { code: 'ML', name: 'Mali',            dialCode: '223', flag: '🇲🇱' },
  { code: 'MX', name: 'Mexico',          dialCode: '52',  flag: '🇲🇽' },
  { code: 'MA', name: 'Morocco',         dialCode: '212', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique',      dialCode: '258', flag: '🇲🇿' },
  { code: 'NA', name: 'Namibia',         dialCode: '264', flag: '🇳🇦' },
  { code: 'NL', name: 'Netherlands',     dialCode: '31',  flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand',     dialCode: '64',  flag: '🇳🇿' },
  { code: 'NG', name: 'Nigeria',         dialCode: '234', flag: '🇳🇬' },
  { code: 'NO', name: 'Norway',          dialCode: '47',  flag: '🇳🇴' },
  { code: 'PK', name: 'Pakistan',        dialCode: '92',  flag: '🇵🇰' },
  { code: 'PE', name: 'Peru',            dialCode: '51',  flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines',     dialCode: '63',  flag: '🇵🇭' },
  { code: 'PL', name: 'Poland',          dialCode: '48',  flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal',        dialCode: '351', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar',           dialCode: '974', flag: '🇶🇦' },
  { code: 'SA', name: 'Saudi Arabia',    dialCode: '966', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal',         dialCode: '221', flag: '🇸🇳' },
  { code: 'SG', name: 'Singapore',       dialCode: '65',  flag: '🇸🇬' },
  { code: 'ZA', name: 'South Africa',    dialCode: '27',  flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea',     dialCode: '82',  flag: '🇰🇷' },
  { code: 'ES', name: 'Spain',           dialCode: '34',  flag: '🇪🇸' },
  { code: 'SD', name: 'Sudan',           dialCode: '249', flag: '🇸🇩' },
  { code: 'SE', name: 'Sweden',          dialCode: '46',  flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland',     dialCode: '41',  flag: '🇨🇭' },
  { code: 'TH', name: 'Thailand',        dialCode: '66',  flag: '🇹🇭' },
  { code: 'TR', name: 'Turkey',          dialCode: '90',  flag: '🇹🇷' },
  { code: 'AE', name: 'UAE',             dialCode: '971', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom',  dialCode: '44',  flag: '🇬🇧' },
  { code: 'US', name: 'United States',   dialCode: '1',   flag: '🇺🇸' },
  { code: 'VN', name: 'Vietnam',         dialCode: '84',  flag: '🇻🇳' },
  { code: 'ZM', name: 'Zambia',          dialCode: '260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe',        dialCode: '263', flag: '🇿🇼' },
]

const COL       = 'users'
const PAGE_SIZE = 10

const users        = ref([])
const loading      = ref(true)
const searchQuery  = ref('')
const statusFilter = ref('all')
const currentPage  = ref(1)
const showModal    = ref(false)
const editingUser  = ref(null)
const deletingUser = ref(null)
const deleting     = ref(false)
const saving       = ref(false)
const saveError    = ref('')

const statusFilters = [
  { label: 'All',      value: 'all'      },
  { label: 'Active',   value: 'active'   },
  { label: 'Inactive', value: 'inactive' },
]

// ── Phone picker state ─────────────────────────────────────────────────────

const phoneCountry    = ref(COUNTRIES[0])
const phoneLocal      = ref('')
const showCountryDrop = ref(false)
const countrySearch   = ref('')

const filteredCountries = computed(() => {
  const q = countrySearch.value.trim().toLowerCase()
  if (!q) return COUNTRIES
  return COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(q) || c.dialCode.includes(q)
  )
})

function selectCountry(c) {
  phoneCountry.value    = c
  showCountryDrop.value = false
  countrySearch.value   = ''
}

function onPhoneLocalInput(e) {
  e.target.value   = e.target.value.replace(/[^\d\s\-()]/g, '')
  phoneLocal.value = e.target.value
}

function builtPhone() {
  const digits = phoneLocal.value.replace(/\D/g, '')
  if (!digits) return ''
  return `+${phoneCountry.value.dialCode}${digits}`
}

function parsePhone(stored) {
  phoneCountry.value = COUNTRIES[0]
  phoneLocal.value   = ''
  if (!stored) return
  const clean  = stored.replace(/\s/g, '')
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
  for (const c of sorted) {
    if (clean.startsWith('+' + c.dialCode)) {
      phoneCountry.value = c
      phoneLocal.value   = clean.slice(c.dialCode.length + 1)
      return
    }
  }
  phoneLocal.value = clean.replace(/^\+/, '')
}

// ── Form ───────────────────────────────────────────────────────────────────

const defaultForm = () => ({
  firstName:      '',
  lastName:       '',
  email:          '',
  password:       '',
  balance:        0,
  isActive:       true,
  clearanceLevel: 0,
})
const form = ref(defaultForm())

// ── Computed ───────────────────────────────────────────────────────────────

const activeCount   = computed(() => users.value.filter(u => u.isActive).length)
const inactiveCount = computed(() => users.value.filter(u => !u.isActive).length)

const filtered = computed(() => {
  let list = users.value
  if (statusFilter.value === 'active')   list = list.filter(u => u.isActive)
  if (statusFilter.value === 'inactive') list = list.filter(u => !u.isActive)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(u =>
      (u.searchName  || '').toLowerCase().includes(q) ||
      (u.firstName   || '').toLowerCase().includes(q) ||
      (u.lastName    || '').toLowerCase().includes(q) ||
      (u.email       || '').toLowerCase().includes(q) ||
      (u.phoneNumber || '').toLowerCase().includes(q)
    )
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set    = new Set([1, total, cur, cur - 1, cur + 1].filter(p => p >= 1 && p <= total))
  const sorted = [...set].sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
})

watch([searchQuery, statusFilter], () => { currentPage.value = 1 })

// ── Helpers ────────────────────────────────────────────────────────────────

function fullName(obj) {
  return [(obj?.firstName || ''), (obj?.lastName || '')].filter(Boolean).join(' ') || 'Unnamed User'
}

function initials(u) {
  return [u?.firstName, u?.lastName]
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase())
    .join('') || '?'
}

const PALETTE = ['#C9A84C', '#30D158', '#0A84FF', '#FF9F0A', '#BF5AF2', '#FF6961', '#64D2FF']

function avatarBg(u) {
  const color = PALETTE[(u.id || '0').charCodeAt(0) % PALETTE.length]
  return { background: color + '1A', borderColor: color + '55', color }
}

function formatBalance(val) {
  if (val == null) return '—'
  return 'TZS ' + Number(val).toLocaleString('en-US')
}

function formatDate(val) {
  if (!val) return '—'
  try {
    const d = val?.toDate ? val.toDate() : new Date(val)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchUsers() {
  loading.value = true
  try {
    const snap = await getDocs(query(collection(db, COL), orderBy('registrationDate', 'desc')))
    users.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    const snap = await getDocs(collection(db, COL))
    users.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } finally {
    loading.value = false
  }
}

// ── Balance modal state ────────────────────────────────────────────────────

const balanceUser   = ref(null)
const balanceMode   = ref('set')
const balanceInput  = ref(null)
const savingBalance = ref(false)
const balanceError  = ref('')

const previewBalance = computed(() => {
  const current = balanceUser.value?.balance ?? 0
  const input   = balanceInput.value ?? 0
  return balanceMode.value === 'set' ? input : current + input
})

function openBalanceModal(u) {
  balanceUser.value  = u
  balanceMode.value  = 'set'
  balanceInput.value = u.balance ?? 0
  balanceError.value = ''
}

async function doAdjustBalance() {
  savingBalance.value = true
  balanceError.value  = ''
  try {
    const newBalance = previewBalance.value
    await updateDoc(doc(db, COL, balanceUser.value.id), { balance: newBalance })
    balanceUser.value.balance = newBalance
    balanceUser.value = null
  } catch {
    balanceError.value = 'Failed to update balance. Try again.'
  } finally {
    savingBalance.value = false
  }
}

// ── Inline toggle ──────────────────────────────────────────────────────────

async function toggleActive(u) {
  u.isActive = !u.isActive
  await updateDoc(doc(db, COL, u.id), { isActive: u.isActive })
}

// ── Create ─────────────────────────────────────────────────────────────────

async function createUser() {
  saving.value    = true
  saveError.value = ''

  const tempApp  = initializeApp(firebaseApp.options, `admin-create-${Date.now()}`)
  const tempAuth = getAuth(tempApp)

  try {
    const { user } = await createUserWithEmailAndPassword(
      tempAuth,
      form.value.email.trim(),
      form.value.password,
    )

    await setDoc(doc(db, COL, user.uid), {
      firstName:        form.value.firstName.trim(),
      lastName:         form.value.lastName.trim(),
      email:            form.value.email.trim(),
      phoneNumber:      builtPhone(),
      balance:          form.value.balance || 0,
      isActive:         form.value.isActive,
      clearanceLevel:   form.value.clearanceLevel,
      searchName:       `${form.value.firstName} ${form.value.lastName}`.trim().toLowerCase(),
      profileImage:     null,
      registrationDate: new Date().toISOString(),
      lastLoginDate:    null,
    })

    await fetchUsers()
    resetModal()
  } catch (e) {
    const code = e?.code
    if (code === 'auth/email-already-in-use') saveError.value = 'An account with this email already exists.'
    else if (code === 'auth/invalid-email')   saveError.value = 'Invalid email address.'
    else if (code === 'auth/weak-password')   saveError.value = 'Password must be at least 6 characters.'
    else                                      saveError.value = 'Failed to create user. Try again.'
  } finally {
    await tempAuth.signOut().catch(() => {})
    await deleteApp(tempApp).catch(() => {})
    saving.value = false
  }
}

// ── Update ─────────────────────────────────────────────────────────────────

async function saveUser() {
  saving.value    = true
  saveError.value = ''
  try {
    await updateDoc(doc(db, COL, editingUser.value.id), {
      firstName:      form.value.firstName.trim(),
      lastName:       form.value.lastName.trim(),
      email:          form.value.email.trim(),
      phoneNumber:    builtPhone(),
      isActive:       form.value.isActive,
      clearanceLevel: form.value.clearanceLevel,
      searchName:     `${form.value.firstName} ${form.value.lastName}`.trim().toLowerCase(),
    })
    await fetchUsers()
    resetModal()
  } catch {
    saveError.value = 'Failed to save changes. Try again.'
  } finally {
    saving.value = false
  }
}

function submit() { editingUser.value ? saveUser() : createUser() }

// ── Delete ─────────────────────────────────────────────────────────────────

function confirmDelete(u) { deletingUser.value = u }

async function doDelete() {
  deleting.value = true
  try {
    await deleteDoc(doc(db, COL, deletingUser.value.id))
    users.value        = users.value.filter(u => u.id !== deletingUser.value.id)
    deletingUser.value = null
  } catch (e) {
    console.error(e)
  } finally {
    deleting.value = false
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────

function openCreate() {
  editingUser.value = null
  form.value        = defaultForm()
  phoneCountry.value    = COUNTRIES[0]
  phoneLocal.value      = ''
  showCountryDrop.value = false
  countrySearch.value   = ''
  saveError.value   = ''
  showModal.value   = true
}

function openEdit(u) {
  editingUser.value = u
  form.value = {
    firstName:      u.firstName      || '',
    lastName:       u.lastName       || '',
    email:          u.email          || '',
    isActive:       u.isActive       ?? false,
    clearanceLevel: u.clearanceLevel ?? 0,
  }
  parsePhone(u.phoneNumber)
  showCountryDrop.value = false
  countrySearch.value   = ''
  saveError.value = ''
  showModal.value = true
}

function resetModal() {
  showModal.value       = false
  editingUser.value     = null
  form.value            = defaultForm()
  phoneCountry.value    = COUNTRIES[0]
  phoneLocal.value      = ''
  showCountryDrop.value = false
  countrySearch.value   = ''
  saveError.value       = ''
}

function closeModal() {
  if (saving.value) return
  resetModal()
}

onMounted(fetchUsers)
</script>

<style scoped>
/* ── Page ────────────────────────────────────────────────────────────────── */
.page {
  padding: 28px 28px 48px;
  min-height: 100%;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #EEEEF0;
  box-sizing: border-box;
}

/* ── Stats bar ───────────────────────────────────────────────────────────── */
.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 14px;
  padding: 16px 20px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #EEEEF0;
  letter-spacing: -1px;
  line-height: 1;
}
.stat-num--green { color: #30D158; }
.stat-num--red   { color: #FF453A; }

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-wrap {
  flex: 1;
  min-width: 220px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: #48484A;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 36px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 12px;
  color: #EEEEF0;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 150ms;
}
.search-input::placeholder { color: #48484A; }
.search-input:focus { border-color: rgba(201, 168, 76, 0.5); }

.search-clear {
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: #28282C;
  color: #8E8E93;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.search-clear:hover { color: #EEEEF0; }
.search-clear-icon { width: 12px; height: 12px; }

.filter-tabs {
  display: flex;
  gap: 4px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 12px;
  padding: 4px;
}

.tab {
  padding: 7px 14px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms, color 150ms;
  font-family: inherit;
  white-space: nowrap;
}
.tab:hover    { color: #AEAEB2; }
.tab--active  { background: #2A2210; color: #C9A84C; }

.add-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 12px;
  border: 0.8px solid rgba(201, 168, 76, 0.35);
  background: #2A2210;
  color: #C9A84C;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
  white-space: nowrap;
}
.add-btn:hover { opacity: 0.8; }
.btn-icon { width: 16px; height: 16px; }

/* ── States ──────────────────────────────────────────────────────────────── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  gap: 12px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #2C2C2E;
  border-top-color: #C9A84C;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: #2A2210;
  border: 0.8px solid rgba(201, 168, 76, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-icon  { width: 28px; height: 28px; color: #C9A84C; }
.empty-title { font-size: 16px; font-weight: 600; color: #EEEEF0; margin: 0; }
.empty-sub   { font-size: 13px; color: #8E8E93; margin: 0; }

/* ── Table ───────────────────────────────────────────────────────────────── */
.table-wrap {
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 16px;
  overflow: hidden;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 780px;
}

.th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #8E8E93;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  border-bottom: 0.8px solid #2C2C2E;
  white-space: nowrap;
  background: #1C1C1E;
}
.th--end { width: 80px; }

.row { transition: background 100ms; }
.row:hover { background: #28282C; }
.row:not(:last-child) .td { border-bottom: 0.8px solid #2C2C2E; }

.td {
  padding: 13px 16px;
  font-size: 13px;
  color: #AEAEB2;
  vertical-align: middle;
  white-space: nowrap;
}
.td--muted { color: #8E8E93; }
.td--date  { color: #8E8E93; font-size: 12px; }

/* User cell */
.cell-user {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.avatar-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-letters {
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.user-meta  { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.user-name  { font-size: 13px; font-weight: 600; color: #EEEEF0; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
.user-email { font-size: 11px; color: #8E8E93; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }

.balance { color: #C9A84C; font-weight: 600; font-size: 13px; }

/* Status pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 7px;
  border: 0.6px solid #2C2C2E;
  background: #28282C;
  color: #48484A;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 150ms;
  white-space: nowrap;
}
.status-pill--on {
  background: #1C2A1C;
  border-color: rgba(48, 209, 88, 0.3);
  color: #30D158;
}
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* Clearance badges */
.cl-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  min-width: 32px;
  box-sizing: border-box;
}
.cl-0 { background: rgba(142,142,147,.15); color: #8E8E93; border: 0.6px solid rgba(142,142,147,.25); }
.cl-1 { background: rgba(10,132,255,.15);  color: #0A84FF; border: 0.6px solid rgba(10,132,255,.25); }
.cl-2 { background: rgba(201,168,76,.15);  color: #C9A84C; border: 0.6px solid rgba(201,168,76,.25); }
.cl-3 { background: rgba(191,90,242,.15);  color: #BF5AF2; border: 0.6px solid rgba(191,90,242,.25); }
.cl-4 { background: rgba(255,159,10,.15);  color: #FF9F0A; border: 0.6px solid rgba(255,159,10,.25); }
.cl-5 { background: rgba(255,69,58,.15);   color: #FF453A; border: 0.6px solid rgba(255,69,58,.25);  }

/* Row action buttons */
.row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 0.8px solid #2C2C2E;
  background: #28282C;
  color: #8E8E93;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 150ms, background 150ms, border-color 150ms;
  padding: 0;
  box-sizing: border-box;
}
.icon-btn:hover      { color: #C9A84C; background: #2A2210; border-color: rgba(201,168,76,.3); }
.icon-btn--del:hover { color: #FF453A; background: rgba(255,69,58,.1); border-color: rgba(255,69,58,.25); }
.ib-svg { width: 14px; height: 14px; }

/* ── Pagination ──────────────────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 28px;
}

.pg-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-radius: 9px;
  border: 0.8px solid #2C2C2E;
  background: #1C1C1E;
  color: #AEAEB2;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms, color 150ms, border-color 150ms;
  box-sizing: border-box;
}
.pg-btn:hover:not(:disabled):not(.pg-btn--active) { background: #28282C; color: #EEEEF0; }
.pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pg-btn--active  { background: #2A2210; border-color: rgba(201,168,76,.4); color: #C9A84C; cursor: default; }
.pg-arrow        { width: 14px; height: 14px; }

.pg-ellipsis {
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #48484A;
  font-size: 13px;
  user-select: none;
}

/* ── Backdrop ────────────────────────────────────────────────────────────── */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
  box-sizing: border-box;
}

/* ── Delete confirm ──────────────────────────────────────────────────────── */
.confirm-box {
  width: 100%;
  max-width: 360px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 20px;
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.warn-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 69, 58, .12);
  border: 0.8px solid rgba(255, 69, 58, .25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.warn-icon     { width: 24px; height: 24px; color: #FF453A; }
.confirm-title { font-size: 18px; font-weight: 700; color: #EEEEF0; margin: 0; letter-spacing: -0.3px; }
.confirm-body  { font-size: 13px; color: #8E8E93; margin: 0; line-height: 1.5; }

.confirm-row { display: flex; gap: 10px; width: 100%; margin-top: 4px; }

.cancel-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: 0.8px solid #2C2C2E;
  background: #28282C;
  color: #AEAEB2;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: color 150ms;
}
.cancel-btn:hover:not(:disabled) { color: #EEEEF0; }
.cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.del-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: #FF453A;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
}
.del-btn:not(:disabled):hover { opacity: 0.85; }
.del-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Edit / Create modal ─────────────────────────────────────────────────── */
.modal {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title { font-size: 18px; font-weight: 700; color: #EEEEF0; letter-spacing: -0.3px; }

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 0.8px solid #2C2C2E;
  background: #28282C;
  color: #8E8E93;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 150ms;
  padding: 0;
  box-sizing: border-box;
  flex-shrink: 0;
}
.close-btn:hover { color: #EEEEF0; }
.close-icon { width: 15px; height: 15px; }

.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field { display: flex; flex-direction: column; gap: 7px; }

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: #8E8E93;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.field-input {
  background: #28282C;
  border: 0.8px solid #2C2C2E;
  border-radius: 11px;
  padding: 11px 13px;
  font-size: 14px;
  color: #EEEEF0;
  font-family: inherit;
  outline: none;
  transition: border-color 150ms;
  box-sizing: border-box;
  width: 100%;
  appearance: none;
}
.field-input::placeholder { color: #48484A; }
.field-input:focus { border-color: rgba(201, 168, 76, .5); }

.select-wrap { position: relative; }
.select-wrap .field-input { padding-right: 36px; cursor: pointer; }
.select-caret {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: #8E8E93;
  pointer-events: none;
}

/* Meta strip (read-only info) */
.meta-strip {
  background: #28282C;
  border: 0.8px solid #2C2C2E;
  border-radius: 12px;
  overflow: hidden;
}
.meta-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  gap: 12px;
}
.meta-item + .meta-item { border-top: 0.8px solid #2C2C2E; }
.meta-key  { font-size: 12px; font-weight: 500; color: #8E8E93; flex-shrink: 0; }
.meta-val  { font-size: 12px; color: #AEAEB2; text-align: right; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.meta-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; letter-spacing: 0.3px; }

/* Toggle */
.toggles-row {
  display: flex;
  flex-direction: column;
  border: 0.8px solid #2C2C2E;
  border-radius: 14px;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 16px;
}

.toggle-text  { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.toggle-label { font-size: 14px; font-weight: 500; color: #EEEEF0; }
.toggle-sub   { font-size: 12px; color: #8E8E93; }

.toggle {
  width: 42px;
  height: 26px;
  border-radius: 13px;
  border: none;
  background: #3A3A3C;
  cursor: pointer;
  position: relative;
  transition: background 200ms;
  flex-shrink: 0;
  padding: 0;
  box-sizing: border-box;
}
.toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 200ms;
}
.toggle--on { background: #C9A84C; }
.toggle--on::after { transform: translateX(16px); }

.error-msg {
  font-size: 13px;
  color: #FF453A;
  margin: 0;
  padding: 10px 14px;
  background: rgba(255, 69, 58, .08);
  border-radius: 10px;
  border: 0.8px solid rgba(255, 69, 58, .2);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 13px;
  border: none;
  background: #C9A84C;
  color: #111114;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms;
  box-sizing: border-box;
}
.submit-btn:disabled             { opacity: 0.4; cursor: not-allowed; }
.submit-btn:not(:disabled):hover { opacity: 0.88; }

/* ── Balance cell button ─────────────────────────────────────────────────── */
.balance-btn {
  background: none;
  border: none;
  padding: 3px 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #C9A84C;
  cursor: pointer;
  border-bottom: 1px dashed rgba(201, 168, 76, 0.35);
  transition: border-color 150ms, color 150ms;
}
.balance-btn:hover { color: #e0bc6e; border-bottom-color: rgba(201, 168, 76, 0.7); }

/* ── Balance modal ───────────────────────────────────────────────────────── */
.balance-modal {
  width: 100%;
  max-width: 360px;
  background: #1C1C1E;
  border: 0.8px solid #2C2C2E;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
}

.bal-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #28282C;
  border: 0.8px solid #2C2C2E;
  border-radius: 12px;
  padding: 14px 16px;
}
.bal-current-label { font-size: 12px; color: #8E8E93; font-weight: 500; }
.bal-current-val   { font-size: 18px; font-weight: 700; color: #C9A84C; letter-spacing: -0.5px; }

.bal-mode-row {
  display: flex;
  gap: 6px;
  background: #28282C;
  border: 0.8px solid #2C2C2E;
  border-radius: 12px;
  padding: 4px;
}
.bal-mode-btn {
  flex: 1;
  padding: 8px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms, color 150ms;
}
.bal-mode-btn--on { background: #2A2210; color: #C9A84C; }

.bal-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #111114;
  border: 0.8px solid #2C2C2E;
  border-radius: 10px;
}
.bal-preview-label   { font-size: 12px; color: #8E8E93; font-weight: 500; }
.bal-preview-val     { font-size: 15px; font-weight: 700; color: #30D158; }
.bal-preview-val--neg { color: #FF453A; }

/* ── Phone picker ────────────────────────────────────────────────────────── */
.phone-row {
  display: flex;
  gap: 8px;
}

.country-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 44px;
  border-radius: 11px;
  border: 0.8px solid #2C2C2E;
  background: #28282C;
  color: #EEEEF0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 150ms;
}
.country-trigger:hover { border-color: rgba(201, 168, 76, .5); }

.ctry-flag  { font-size: 18px; line-height: 1; display: flex; align-items: center; }
.ctry-code  { font-size: 13px; color: #AEAEB2; line-height: 1; }
.ctry-caret { width: 13px; height: 13px; color: #8E8E93; transition: transform 200ms; flex-shrink: 0; }
.ctry-caret--up { transform: rotate(180deg); }

.phone-local {
  flex: 1;
  background: #28282C;
  border: 0.8px solid #2C2C2E;
  border-radius: 11px;
  padding: 11px 13px;
  font-size: 14px;
  color: #EEEEF0;
  font-family: inherit;
  outline: none;
  transition: border-color 150ms;
  box-sizing: border-box;
}
.phone-local::placeholder { color: #48484A; }
.phone-local:focus { border-color: rgba(201, 168, 76, .5); }

.country-picker {
  margin-top: 8px;
  background: #28282C;
  border: 0.8px solid #2C2C2E;
  border-radius: 14px;
  overflow: hidden;
}

.picker-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border-bottom: 0.8px solid #2C2C2E;
}
.picker-search-icon {
  position: absolute;
  left: 12px;
  width: 14px;
  height: 14px;
  color: #48484A;
  pointer-events: none;
}
.picker-search {
  width: 100%;
  padding: 10px 12px 10px 34px;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: #EEEEF0;
  font-family: inherit;
  box-sizing: border-box;
}
.picker-search::placeholder { color: #48484A; }

.country-list {
  max-height: 200px;
  overflow-y: auto;
}
.country-list::-webkit-scrollbar       { width: 4px; }
.country-list::-webkit-scrollbar-track { background: transparent; }
.country-list::-webkit-scrollbar-thumb { background: #3A3A3C; border-radius: 4px; }

.country-opt {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border: none;
  background: transparent;
  color: #AEAEB2;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 100ms;
}
.country-opt:hover         { background: #2C2C2E; }
.country-opt--active       { background: #2A2210; color: #C9A84C; }
.country-opt--active:hover { background: #2A2210; }

.c-flag { font-size: 16px; line-height: 1; flex-shrink: 0; }
.c-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c-dial { font-size: 12px; color: #8E8E93; flex-shrink: 0; }
.country-opt--active .c-dial { color: #C9A84C; }

/* ── Transitions ─────────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 180ms; }
.fade-enter-from,   .fade-leave-to     { opacity: 0; }
</style>
