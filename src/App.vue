<template>
  <router-view />
</template>

<script setup>
import { useTheme } from './composables/useTheme.js'
import { useOrg } from './composables/useOrg.js'
useTheme()
useOrg()
</script>
