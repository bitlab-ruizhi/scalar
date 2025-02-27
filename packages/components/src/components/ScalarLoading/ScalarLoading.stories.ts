import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../ScalarButton'
import ScalarLoading, { useLoadingState } from './ScalarLoading.vue'

/**
 * To use the loading, you must pass in a loadingState which can be created using the useLoadingState hook exported from this component
 */
const meta = {
  component: ScalarLoading,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'text', default: '24px' },
  },
  render: () => ({
    components: { ScalarButton, ScalarLoading },
    setup() {
      const loadingState = useLoadingState()
      loadingState.startLoading()
      return { loadingState }
    },
    template: `
      <div className="row gap-16 items-center">
        <ScalarLoading :loadingState="loadingState" />
        <div className="row gap-4 items-center">
          <ScalarButton @click="loadingState.validate()">Validate</ScalarButton>
          <ScalarButton variant="danger" @click="loadingState.invalidate()">Invalidate</ScalarButton>
          <ScalarButton variant="outlined" @click="loadingState.clear() && loadingState.startLoading()">Clear</ScalarButton>
        </div>
      </div>
    `,
  }),
} satisfies Meta<typeof ScalarLoading>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {} as any
