<template>
  <div class="login-root">
    <!-- Ambient orbs -->
    <div class="orb orb--tr" />
    <div class="orb orb--bl" />

    <!-- Card -->
    <div class="login-card">
      <!-- Brand -->
      <div class="login-brand">
        <span class="brand-dot" />
        <span class="brand-name">haflaway</span>
      </div>

      <!-- Header -->
      <div class="login-header">
        <h1 class="login-title">Create Account</h1>
        <p class="login-sub">Start managing your events in minutes</p>
      </div>

      <!-- Form -->
      <form class="login-form" @submit.prevent="handleRegister" novalidate>
        <!-- Name -->
        <div class="field-group" :class="{ 'field-group--error': errors.name }">
          <label class="field-label">Full Name</label>
          <div class="field-wrap">
            <span class="field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              v-model="form.name"
              type="text"
              class="field-input"
              placeholder="Jane Doe"
              autocomplete="name"
              @input="errors.name = ''"
            />
          </div>
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <!-- Email -->
        <div class="field-group" :class="{ 'field-group--error': errors.email }">
          <label class="field-label">Email Address</label>
          <div class="field-wrap">
            <span class="field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <input
              v-model="form.email"
              type="email"
              class="field-input"
              placeholder="name@example.com"
              autocomplete="email"
              @input="errors.email = ''"
            />
          </div>
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        </div>

        <!-- Password -->
        <div class="field-group" :class="{ 'field-group--error': errors.password }">
          <label class="field-label">Password</label>
          <div class="field-wrap">
            <span class="field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              placeholder="••••••••"
              autocomplete="new-password"
              @input="errors.password = ''"
            />
            <button type="button" class="field-toggle" @click="showPassword = !showPassword" tabindex="-1">
              <svg v-if="!showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <!-- Auth error -->
        <div v-if="authError" class="login-auth-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ authError }}
        </div>

        <!-- Submit -->
        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="login-spinner" />
          <span v-else>Create Account</span>
        </button>
      </form>

      <!-- Login link -->
      <p class="login-register">
        Already have an account?
        <RouterLink to="/login" class="login-register-link">Sign In</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { DEFAULT_ACCENT, DEFAULT_SECONDARY } from '../composables/useOrg.js'

const router = useRouter()
const route = useRoute()

const form = ref({ name: '', email: '', password: '' })
const errors = ref({ name: '', email: '', password: '' })
const authError = ref('')
const loading = ref(false)
const showPassword = ref(false)

function validate() {
  let ok = true
  errors.value = { name: '', email: '', password: '' }
  if (!form.value.name.trim()) {
    errors.value.name = 'Enter your full name'
    ok = false
  }
  if (!form.value.email.trim()) {
    errors.value.email = 'Enter your email address'
    ok = false
  }
  if (!form.value.password || form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
    ok = false
  }
  return ok
}

async function handleRegister() {
  if (!validate()) return
  authError.value = ''
  loading.value = true
  try {
    const fullName = form.value.name.trim()
    const [firstName, ...rest] = fullName.split(' ')
    const lastName = rest.join(' ')

    const credential = await createUserWithEmailAndPassword(auth, form.value.email.trim(), form.value.password)
    await updateProfile(credential.user, { displayName: fullName })

    // Every account gets a default organization at signup — no separate
    // "create your org" step. They land in it and can rename/rebrand freely.
    const orgRef = await addDoc(collection(db, 'organizations'), {
      name: `${firstName}'s Organization`,
      logoUrl: '',
      faviconUrl: '',
      accentColor: DEFAULT_ACCENT,
      secondaryColor: DEFAULT_SECONDARY,
      ownerId: credential.user.uid,
      memberIds: [credential.user.uid],
      createdAt: serverTimestamp(),
    })

    await setDoc(doc(db, 'users', credential.user.uid), {
      email: form.value.email.trim(),
      firstName,
      lastName,
      activeOrgId: orgRef.id,
      createdAt: serverTimestamp(),
    })

    const redirect = route.query.redirect ?? '/'
    router.push(redirect)
  } catch (e) {
    authError.value = friendlyError(e.code)
  } finally {
    loading.value = false
  }
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
</script>

<style scoped>
.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0e1c;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  padding: 24px;
}

/* Orbs */
.orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  z-index: 0;
}
.orb--tr { width: 360px; height: 360px; top: -100px; right: -100px; background: rgba(201,168,76,0.10); }
.orb--bl { width: 280px; height: 280px; bottom: -80px; left: -60px; background: rgba(201,168,76,0.06); }

/* Card */
.login-card {
  width: 100%;
  max-width: 420px;
  background: #111827;
  border: 1px solid #1e2d44;
  border-radius: 20px;
  padding: 36px 36px 28px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Brand */
.login-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #C9A84C;
}
.brand-name {
  font-size: 16px;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: -0.3px;
}

/* Header */
.login-header {}
.login-title {
  font-size: 24px;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: -0.5px;
  margin: 0 0 5px;
}
.login-sub {
  font-size: 14px;
  color: #8892a4;
  margin: 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #8892a4;
  letter-spacing: 0.1px;
}
.field-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.field-icon {
  position: absolute;
  left: 13px;
  color: #4f617a;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.field-input {
  width: 100%;
  padding: 11px 12px 11px 40px;
  border: 0.8px solid #1e2d44;
  border-radius: 11px;
  background: #111827;
  font-size: 14px;
  color: #e2e8f0;
  outline: none;
  transition: border-color 140ms, box-shadow 140ms;
  font-family: inherit;
  box-sizing: border-box;
}
.field-input::placeholder { color: #4f617a; }
.field-input:focus {
  border-color: rgba(201,168,76,0.5);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.10);
  background: #0d1326;
}
.field-group--error .field-input {
  border-color: rgba(255,59,48,0.5);
  box-shadow: 0 0 0 3px rgba(255,59,48,0.08);
}
.field-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: #4f617a;
  display: flex;
  align-items: center;
  padding: 4px;
  transition: color 130ms;
}
.field-toggle:hover { color: #8892a4; }
.field-error {
  font-size: 12px;
  color: #FF453A;
  font-weight: 500;
}

/* Auth error banner */
.login-auth-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,59,48,0.07);
  border: 0.8px solid rgba(255,59,48,0.2);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #FF453A;
}

/* Submit button */
.login-btn {
  width: 100%;
  padding: 13px;
  background: #C9A84C;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 150ms;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  letter-spacing: 0.1px;
}
.login-btn:hover:not(:disabled) { opacity: 0.88; }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Spinner */
.login-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Login link */
.login-register {
  font-size: 13px;
  color: #8892a4;
  text-align: center;
  margin: 0;
}
.login-register-link {
  color: #C9A84C;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}
.login-register-link:hover { text-decoration: underline; }
</style>
