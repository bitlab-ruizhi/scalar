<script setup lang="ts">
import { TheCommandPalette } from '@/components/CommandPalette'
import SideNav from '@/components/SideNav/SideNav.vue'
import TopNav from '@/components/TopNav/TopNav.vue'
import { useDarkModeState } from '@/hooks'
import { handleHotKeyDown, loadAllResources } from '@/libs'
import { useWorkspace } from '@/store/workspace'
import { addScalarClassesToHeadless } from '@scalar/components'
import { LS_KEYS } from '@scalar/object-utils/mutator-record'
import { getThemeStyles } from '@scalar/themes'
import { ScalarToasts } from '@scalar/use-toasts'
import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  watchEffect,
} from 'vue'
import { RouterView } from 'vue-router'

onMounted(() => {
  watchEffect(() => {
    document.body.classList.toggle('dark-mode', isDark.value)
    document.body.classList.toggle('light-mode', !isDark.value)
  })
})

const { isDark } = useDarkModeState()
const workspaceStore = useWorkspace()

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(async () => {
  // Check if we have localStorage data
  if (localStorage.getItem(LS_KEYS.WORKSPACE)) {
    const size: Record<string, string> = {}
    let _lsTotal = 0
    let _xLen = 0
    let _key = ''

    for (_key in localStorage) {
      if (!Object.prototype.hasOwnProperty.call(localStorage, _key)) {
        continue
      }
      _xLen = (localStorage[_key].length + _key.length) * 2
      _lsTotal += _xLen
      size[_key] = (_xLen / 1024).toFixed(2) + ' KB'
    }
    size['Total'] = (_lsTotal / 1024).toFixed(2) + ' KB'
    console.table(size)

    loadAllResources(workspaceStore)
  } else {
    // Create default workspace
    workspaceStore.workspaceMutators.add({
      uid: 'default',
      name: 'Workspace',
      proxyUrl: 'https://proxy.scalar.com',
    })
  }

  addScalarClassesToHeadless()
})

/** Handles the hotkey events, we will pass in custom hotkeys here */
const handleKeyDown = (ev: KeyboardEvent) => handleHotKeyDown(ev)

// Hotkey listeners
onMounted(() => window.addEventListener('keydown', handleKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown))

const fontsStyleTag = computed(
  () =>
    workspaceStore.activeWorkspace.value &&
    `<style>
  ${getThemeStyles(workspaceStore.activeWorkspace.value.themeId, {
    fonts: true,
  })}</style>`,
)
</script>
<template>
  <div v-html="fontsStyleTag"></div>
  <TopNav />

  <!-- Ensure we have the workspace loaded from localStorage above -->
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main
    v-if="workspaceStore.activeWorkspace.value?.uid"
    class="flex min-h-0 flex-1 z-0">
    <SideNav />

    <!-- Popup command palette to add resources from anywhere -->
    <TheCommandPalette />

    <div class="flex flex-1 flex-col min-w-0">
      <RouterView v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </RouterView>
    </div>
  </main>
  <ScalarToasts />
</template>
<style>
@import '@scalar/components/style.css';
@import '@scalar/themes/style.css';
@import '@/assets/tailwind.css';
@import '@/assets/variables.css';

#scalar-client {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  position: relative;
  background-color: var(--scalar-background-2);
}
.dark-mode #scalar-client {
  background-color: color-mix(in srgb, var(--scalar-background-1) 30%, black);
}
</style>
