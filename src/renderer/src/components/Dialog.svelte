<script lang="ts">
  import { createDialog } from '@melt-ui/svelte'
  /** Internal helpers */
  import { X } from 'lucide-svelte'

  export let title: string
  export let message: string = 'This will lose the current config. Be sure to save it first before confirming.'
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
    <div {...$overlay} use:overlay class="fixed inset-0 z-50 bg-c-black/50 dark:bg-c-white/20" />
    <div
      class="rounded-0 fixed left-[50%] top-[50%] z-50 max-h-[85vh]
            w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] bg-c-white p-6
            shadow-lg dark:bg-c-black dark:text-c-white"
      {...$content}
      use:content>
      <h2 {...$localTitle} use:localTitle class="m-0 text-lg font-medium">
        {title}
      </h2>
      <p {...$description} use:description class="mb-5 mt-2 leading-normal text-f-grey-200 dark:text-f-grey-100">
        {message}
      </p>

      <div class="mt-6 flex justify-end gap-4">
        <button
          {...$close}
          use:close
          class="active:hover:ring-0! inline-flex items-center border-2 border-c-black bg-transparent p-2 text-center text-base font-medium text-c-black ring-offset-2 ring-offset-c-white hover:bg-c-black hover:text-c-white focus:outline-none focus-visible:z-10 focus-visible:border-2 focus-visible:ring-2 focus-visible:ring-c-black active:border-app active:bg-app active:text-c-black active:focus-visible:border-app disabled:bg-f-grey-200 disabled:text-c-white dark:border-c-white dark:text-c-white dark:ring-offset-c-black dark:hover:bg-c-white dark:hover:text-c-black dark:focus-visible:ring-c-white dark:active:text-c-black">
          Cancel
        </button>
        <button
          {...$close}
          on:m-click={() => (confirmed = true)}
          on:m-keydown={handleConfirmKey}
          use:close
          class="active:hover:ring-0! inline-flex items-center border-2 border-app bg-app p-2 text-center text-base font-medium text-c-black ring-offset-2 ring-offset-c-white hover:border-c-black hover:bg-c-black hover:text-c-white focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-c-black active:border-c-black active:bg-transparent active:text-c-black disabled:bg-f-grey-200 disabled:text-c-white dark:ring-offset-c-black dark:hover:border-c-white dark:hover:bg-c-white dark:hover:text-c-black dark:focus-visible:ring-c-white dark:active:border-c-white dark:active:bg-c-white dark:active:text-c-black">
          {confirmLabel}
        </button>
      </div>

      <button
        {...$close}
        use:close
        aria-label="Close"
        class="text-magnum-800 hover:bg-magnum-100 focus:shadow-magnum-400 absolute right-[10px] top-[10px]
                inline-flex h-6 w-6 appearance-none items-center
                justify-center rounded-full">
        <X class="square-4" />
      </button>
    </div>
  {/if}
</div>
