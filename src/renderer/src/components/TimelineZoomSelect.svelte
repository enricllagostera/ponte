<script lang="ts">
  import { Check, ChevronDown, ScanSearch } from 'lucide-svelte'
  import { createSelect } from '@melt-ui/svelte'
  import { fade } from 'svelte/transition'

  export let selectedZoom

  const options = [
    { value: 'tiny', label: '50%' },
    { value: 'small', label: '70%' },
    { value: 'medium', label: '100%' }
  ]

  const {
    elements: { trigger, menu, option, label },
    states: { selectedLabel, selected, open },
    helpers: { isSelected }
  } = createSelect<string>({
    defaultSelected: { value: 'small', label: '70%' },
    forceVisible: true,
    positioning: {
      placement: 'bottom',
      fitViewport: true,
      sameWidth: true
    }
  })

  $: {
    selectedZoom = $selected.value
  }
</script>

<div class="flex flex-row items-center gap-x-1">
  <!-- svelte-ignore a11y-label-has-associated-control - $label contains the 'for' attribute -->
  <label class="flex gap-x-1 text-neutral-900" {...$label} use:label
    ><ScanSearch class="inline-flex"></ScanSearch>Zoom level</label>
  <button
    class="flex h-8 w-[100px] items-center justify-between border-2 border-c-black bg-white px-3 py-1 text-neutral-700 transition-opacity hover:opacity-90"
    {...$trigger}
    use:trigger
    aria-label="Time unit">
    {$selectedLabel || 'Select a zoom level'}
    <ChevronDown class="size-5" />
  </button>
  {#if $open}
    <div
      class=" z-10 flex max-h-[300px] flex-col
    overflow-y-auto border-2 border-c-black bg-c-white p-1 shadow
    focus:!ring-0"
      {...$menu}
      use:menu
      transition:fade={{ duration: 150 }}>
      {#each options as item}
        <div
          class="relative cursor-pointer py-1 pl-8 pr-4 text-neutral-800
              data-[highlighted]:bg-neutral-200 data-[highlighted]:text-neutral-900
              data-[disabled]:opacity-50
              hover:bg-neutral-100 focus:z-10
              focus:text-neutral-700"
          {...$option({ value: item.value, label: item.label })}
          use:option>
          <div class="check {$isSelected(item) ? 'block' : 'hidden'}">
            <Check class="size-4" />
          </div>
          {item.label}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="postcss">
  .check {
    position: absolute;
    left: theme(spacing.2);
    top: 50%;
    z-index: theme(zIndex.20);
    translate: 0 calc(-50% + 1px);
    color: theme(colors.neutral.500);
  }
</style>
