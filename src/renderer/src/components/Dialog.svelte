<script lang="ts">
  import { createDialog } from '@melt-ui/svelte'
  /** Internal helpers */
  import { X } from 'lucide-svelte'

  export let title: string
  export let message: string =
    'This will lose the current config. Be sure to save it first before confirming.'
  export let confirmLabel: string = 'Confirm'

  let confirmed = false

  export let onCancel = (): void => {}
  export let onConfirm = (): void => {}

  const {
    elements: { overlay, content, title: localTitle, description, close, portalled },
    states: { open: localOpen }
  } = createDialog()

  localOpen.subscribe((isOpen) => {
    if (!isOpen && confirmed) {
      if (onConfirm) {
        onConfirm()
        confirmed = false
        localOpen.set(false)
        return
      }
    }

    if (!isOpen && !confirmed) {
      if (onCancel) {
        onCancel()
        localOpen.set(false)
        return
      }
    }
  })

  export function trigger(): void {
    localOpen.set(true)
  }

  function handleConfirmKey(e: CustomEvent): void {
    // console.log(e.detail)
    if (e.detail.originalEvent.code == 'Enter' || e.detail.originalEvent.code == 'Space') {
      confirmed = true
    }
  }
</script>

<!-- <button
  {...$trigger}
  use:trigger
  class="inline-flex items-center justify-center rounded-md bg-white px-4 py-2
    font-medium leading-none text-magnum-700 shadow-lg hover:opacity-75">
  Delete Item
</button> -->

<div {...$portalled} use:portalled>
  {#if $localOpen}
    <div {...$overlay} use:overlay class="fixed inset-0 z-50 bg-black/50" />
    <div
      class="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw]
            max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white
            p-6 shadow-lg"
      {...$content}
      use:content>
      <h2 {...$localTitle} use:localTitle class="m-0 text-lg font-medium text-black">
        {title}
      </h2>
      <p {...$description} use:description class="mb-5 mt-2 leading-normal text-zinc-600">
        {message}
      </p>

      <div class="mt-6 flex justify-end gap-4">
        <button
          {...$close}
          use:close
          class="inline-flex h-8 items-center justify-center rounded-[4px]
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600">
          Cancel
        </button>
        <button
          {...$close}
          on:m-click={() => (confirmed = true)}
          on:m-keydown={handleConfirmKey}
          use:close
          class="inline-flex h-8 items-center justify-center rounded-[4px]
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900">
          {confirmLabel}
        </button>
      </div>

      <button
        {...$close}
        use:close
        aria-label="Close"
        class="absolute right-[10px] top-[10px] inline-flex h-6 w-6
                appearance-none items-center justify-center rounded-full text-magnum-800
                hover:bg-magnum-100 focus:shadow-magnum-400">
        <X class="square-4" />
      </button>
    </div>
  {/if}
</div>
