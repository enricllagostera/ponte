<script lang="ts">
  import { Check, ChevronDown } from 'lucide-svelte'
  import { createSelect } from '@melt-ui/svelte'
  import { fade } from 'svelte/transition'

  export let selectedUnit

  const options = [
    { value: 'hour1', label: '1 hour' },
    { value: 'hour12', label: '12 hours' },
    { value: 'day1', label: '1 day' },
    // { value: 'day3', label: '3 days' },
    { value: 'week1', label: '1 week' },
    { value: 'week2', label: '2 weeks' },
    { value: 'month1', label: '1 month' }
  ]

  const {
    elements: { trigger, menu, option, label },
    states: { selectedLabel, selected, open },
    helpers: { isSelected }
  } = createSelect<string>({
    defaultSelected: { value: 'day1', label: '1 day' },
    forceVisible: true,
    positioning: {
      placement: 'bottom',
      fitViewport: true,
      sameWidth: true
    }
  })

  $: {
    selectedUnit = $selected.value
  }
</script>

<div class="flex flex-row items-center gap-1">
  <!-- svelte-ignore a11y-label-has-associated-control - $label contains the 'for' attribute -->
  <label class="h-8 text-neutral-900" {...$label} use:label>Time unit</label>
  <button
    class="flex h-8 min-w-[220px] items-center justify-between border-2 border-c-black bg-white
  px-3 py-1 text-neutral-700 transition-opacity hover:opacity-90"
    {...$trigger}
    use:trigger
    aria-label="Time unit">
    {$selectedLabel || 'Select a time unit'}
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
        <!-- <div class="py-1 pl-4 pr-4 font-semibold capitalize text-neutral-800" {...$groupLabel(key)} use:groupLabel>
            {key}
          </div> -->
        <!-- {@debug item} -->
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
