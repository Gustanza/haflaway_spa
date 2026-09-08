import { ref } from 'vue'

// Shared open/close state for the event sidebar drawer — lets "hub chrome"
// pages (which hide EventLayout's static sidebar) trigger the same overlay
// via their own hamburger button, without prop/event plumbing through RouterView.
const isOpen = ref(false)

export function useNavDrawer() {
  return {
    isOpen,
    open() { isOpen.value = true },
    close() { isOpen.value = false },
    toggle() { isOpen.value = !isOpen.value },
  }
}
