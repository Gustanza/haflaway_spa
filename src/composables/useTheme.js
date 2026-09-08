import { ref, watchEffect } from 'vue'

// Light is the only theme for now — the toggle UI is hidden everywhere, so this
// no longer reads/writes a stored preference. isDark stays exported (rather
// than inlined at call sites) so re-enabling the toggle later is a one-line change.
const isDark = ref(false)

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
})

export function useTheme() {
  return {
    isDark,
    toggleTheme() {},
  }
}
