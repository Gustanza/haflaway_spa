import { ref, watchEffect } from 'vue'

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('haflaway-theme') : null
const isDark = ref(stored !== 'light')

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('haflaway-theme', isDark.value ? 'dark' : 'light')
})

export function useTheme() {
  return {
    isDark,
    toggleTheme() { isDark.value = !isDark.value },
  }
}
