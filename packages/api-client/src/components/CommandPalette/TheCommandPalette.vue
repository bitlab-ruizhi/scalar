<script lang="ts">
import { useWorkspace } from '@/store/workspace'

import CommandPaletteCollection from './CommandPaletteCollection.vue'
import CommandPaletteExample from './CommandPaletteExample.vue'
import CommandPaletteFolder from './CommandPaletteFolder.vue'
import CommandPaletteImport from './CommandPaletteImport.vue'
import CommandPaletteRequest from './CommandPaletteRequest.vue'
import CommandPaletteWorkspace from './CommandPaletteWorkspace.vue'

/**
 * The Command Palette
 *
 * This component is a singleton so should only exist in our app once we will use the event bus to trigger it
 */
export default {
  name: 'TheCommandPalette',
}

export const PaletteComponents = {
  'Import Collection': CommandPaletteImport,
  'Create Request': CommandPaletteRequest,
  'Create Workspace': CommandPaletteWorkspace,
  'Add Folder': CommandPaletteFolder,
  'Create Collection': CommandPaletteCollection,
  'Add Example': CommandPaletteExample,
} as const

/** Infer the types from the commands  */
export type CommandNames = keyof typeof PaletteComponents
</script>

<script setup lang="ts">
import { ScalarIcon, useModal } from '@scalar/components'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  commandPaletteBus,
  hotKeyBus,
  type HotKeyEvents,
  type CommandPaletteEvent,
} from '@/libs'

/** Available Commands for the Command Palette */
const availableCommands = [
  {
    label: 'Add to Request Sidebar',
    commands: [
      {
        name: 'Create Request',
        icon: 'ExternalLink',
      },
      {
        name: 'Import Collection',
        icon: 'Import',
      },
      {
        name: 'Add Folder',
        icon: 'Folder',
      },
      {
        name: 'Create Collection',
        icon: 'Collection',
      },
      {
        name: 'Add Example',
        icon: 'Example',
      },
    ],
  },
  {
    label: 'More Actions',
    commands: [
      {
        name: 'Create Workspace',
        icon: 'Workspace',
      },
      {
        name: 'Add Server',
        icon: 'Brackets',
        path: '/servers',
      },
      {
        name: 'Add Environment',
        icon: 'Server',
        path: '/environment',
      },
      {
        name: 'Add Cookie',
        icon: 'Cookie',
        path: '/cookies',
      },
    ],
  },
] as const
type Command = (typeof availableCommands)[number]['commands'][number]

const modalState = useModal()
const { push } = useRouter()
const { activeWorkspace } = useWorkspace()

/** Additional metadata for the command palettes */
const metaData = ref<string>()
const commandQuery = ref('')
const activeCommand = ref<keyof typeof PaletteComponents | null>(null)
const selectedSearchResult = ref<number>(-1)
const commandRefs = ref<HTMLElement[]>([])

const searchResultsWithPlaceholderResults = computed(() =>
  availableCommands.reduce((acc, group) => {
    const filteredGroupCommands = group.commands.filter((command) =>
      command.name.toLowerCase().includes(commandQuery.value.toLowerCase()),
    )
    return [...acc, ...filteredGroupCommands]
  }, [] as Command[]),
)

/** Reset state on close */
const closeHandler = () => {
  modalState.hide()
  commandQuery.value = ''
  activeCommand.value = null
  selectedSearchResult.value = -1
}

/** Handle execution of the command, some have routes while others show another palette */
const executeCommand = (
  command: (typeof availableCommands)[number]['commands'][number],
) => {
  // Route to the page
  if ('path' in command) {
    push(`/workspace/${activeWorkspace.value.uid}${command.path}`)
    closeHandler()
  }
  // Open respective command palette
  else activeCommand.value = command.name
}

const commandInputRef = ref<HTMLInputElement | null>()

/** Handles opening the command pallete to the correct palette */
const openCommandPalette = ({
  commandName,
  metaData: _metaData,
}: CommandPaletteEvent = {}) => {
  activeCommand.value = commandName ?? null
  metaData.value = _metaData
  modalState.show()

  // Need nextTick to focus after a click since focus goes to the button
  nextTick(() => commandInputRef.value?.focus())
}

/** Handle up and down arrow keys in the menu */
const handleArrowKey = (direction: 'up' | 'down', ev: KeyboardEvent) => {
  if (!modalState.open) return
  ev.preventDefault()

  const offset = direction === 'up' ? -1 : 1
  const length = searchResultsWithPlaceholderResults.value.length

  // Ensures we loop around the array by using the remainder
  selectedSearchResult.value =
    (selectedSearchResult.value + offset + length) % length

  commandRefs.value[selectedSearchResult.value]?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
}

/** The currently selected command */
const selectedCommand = computed(
  () => searchResultsWithPlaceholderResults.value[selectedSearchResult.value],
)

/** Handle enter keydown in the menu */
const handleSelect = () => {
  if (!selectedCommand.value) return
  executeCommand(selectedCommand.value)
}

/** Handle hotkeys */
const handleHotKey = (event: HotKeyEvents) => {
  if (!modalState.open) return
  if (event.closeModal) closeHandler()
  if (event.commandPaletteUp) handleArrowKey('up', event.commandPaletteUp)
  if (event.commandPaletteDown) handleArrowKey('down', event.commandPaletteDown)
  if (event.commandPaletteSelect) handleSelect()
}

onMounted(() => {
  commandPaletteBus.on(openCommandPalette)
  hotKeyBus.on(handleHotKey)
})
onBeforeUnmount(() => {
  commandPaletteBus.off(openCommandPalette)
  hotKeyBus.off(handleHotKey)
})
</script>
<template>
  <div
    v-show="modalState.open"
    class="commandmenu-clickout"
    @click="closeHandler()"></div>

  <div
    v-show="modalState.open"
    class="commandmenu">
    <!-- Default palette (command list) -->
    <template v-if="!activeCommand">
      <div
        class="bg-b-2 flex items-center rounded mb-2 pl-2 focus-within:bg-b-1 focus-within:shadow-border">
        <label for="commandmenu">
          <ScalarIcon
            class="text-c-1 mr-2.5"
            icon="Search"
            size="sm"
            thickness="1.5" />
        </label>
        <input
          id="commandmenu"
          ref="commandInputRef"
          v-model="commandQuery"
          autocomplete="off"
          autofocus
          class="w-full rounded bg-none border-none py-1.5 text-sm focus:outline-none"
          placeholder="Search commands..."
          type="text" />
      </div>
      <template
        v-for="group in availableCommands"
        :key="group.label">
        <div
          v-show="
            group.commands.filter((command) =>
              command.name.toLowerCase().includes(commandQuery.toLowerCase()),
            ).length > 0
          "
          class="text-c-3 font-medium text-xs mt-2">
          {{ group.label }}
        </div>
        <div
          v-for="(command, index) in group.commands.filter((command) =>
            command.name.toLowerCase().includes(commandQuery.toLowerCase()),
          )"
          :key="command.name"
          :ref="
            (el) => {
              if (el) commandRefs[index] = el as HTMLElement
            }
          "
          class="commandmenu-item text-sm flex items-center py-1.5 px-2 rounded hover:bg-b-2 cursor-pointer"
          :class="{
            'bg-b-2': command.name === selectedCommand?.name,
          }"
          @click="executeCommand(command)">
          <ScalarIcon
            class="text-c-1 mr-2.5"
            :icon="command.icon"
            size="md"
            thickness="1.5" />
          {{ command.name }}
        </div>
      </template>
      <div
        v-if="!searchResultsWithPlaceholderResults.length"
        class="text-c-3 text-center text-sm p-2 pt-3">
        No commands found
      </div>
    </template>

    <!-- Specific command palette -->
    <template v-else>
      <button
        class="absolute p-0.75 hover:bg-b-3 rounded text-c-3 active:text-c-1 m-1.5 z-10"
        type="button"
        @click="activeCommand = null">
        <ScalarIcon
          icon="ChevronLeft"
          size="md"
          thickness="1.5" />
      </button>
      <component
        :is="PaletteComponents[activeCommand]"
        :metaData="metaData"
        @close="closeHandler" />
    </template>
  </div>
</template>
<style scoped>
/* command menu */
.commandmenu {
  box-shadow: var(--scalar-shadow-2);
  border-radius: var(--scalar-radius-lg);
  background-color: var(--scalar-background-1);
  width: 100%;
  max-width: 580px;
  padding: 12px;
  margin: 12px;
  position: fixed;
  z-index: 10;
  left: 50%;
  top: 150px;
  opacity: 0;
  transform: translate3d(-50%, 10px, 0);
  z-index: 100;
  animation: fadeincommandmenu ease-in-out 0.3s forwards;
  animation-delay: 0.1s;
}
.commandmenu-clickout {
  background: rgba(0, 0, 0, 0.2);
  animation: fadeincommand ease-in-out 0.3s forwards;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  cursor: pointer;
}
@keyframes fadeincommand {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes fadeincommandmenu {
  0% {
    opacity: 0;
    transform: translate3d(-50%, 10px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(-50%, 0, 0);
  }
}
</style>
