<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import Select from 'svelte-select'
  import type { CodeOption } from '../../../types'
  import { Tags } from 'lucide-svelte'
  import { settings } from '../stores'

  export let initialOptions: CodeOption[]
  export let initialValues: CodeOption[]

  let filterText: string = ''
  let value: CodeOption[] | null = null
  let items: CodeOption[] | null

  const dispatch = createEventDispatcher()

  onMount(() => {
    value = initialValues
    items = [...initialOptions]
  })

  function handleFilter(e): void {
    if (value?.find((i) => i.label === filterText)) return
    if (e.detail.length === 0 && filterText.length > 0) {
      const prev = items.filter((i) => !i.created)
      items = [...prev, { value: filterText, label: filterText, created: true }]
    }
  }

  function handleClear(e: CustomEvent): void {
    value = value || []
    const toRemove = Array.isArray(e.detail) ? e.detail : [e.detail]
    for (const rv of [...toRemove]) {
      value = [...value.filter((cv) => rv.value != cv.value)]
    }
    dispatch('codesChanged', {
      codes: value,
      options: items
    })
  }

  function handleChange(): void {
    items = items.map((i: CodeOption) => {
      delete i.created
      return i
    })
    dispatch('codesChanged', {
      codes: value,
      options: items
    })
  }
</script>

<div class="flex items-center border-2 my-2 w-100 dark:bg-zinc-800 dark:text-zinc-200">
  <div class="m-2"><Tags class="inline" /></div>
  <div class="flex fc-select w-full max-w-full">
    {#if $settings.darkTheme}
      <Select
        on:change={handleChange}
        multiple
        on:filter={handleFilter}
        on:clear={handleClear}
        bind:filterText
        bind:value
        {items}
        clearable
        multiFullItemClearable
        --multi-item-bg="rgb(59, 130, 246)"
        --background="rgb(39, 39, 42)"
        --input-color="rgb(228, 228, 231)"
        --border-radius="0px"
        --border="0"
        --border-hover="0"
        --padding="0">
        <div slot="item" let:item>
          {item.created ? 'Add new: ' : ''}
          {item.label}
        </div>
      </Select>
    {:else}
      <Select
        on:change={handleChange}
        multiple
        on:filter={handleFilter}
        on:clear={handleClear}
        bind:filterText
        bind:value
        {items}
        clearable
        multiFullItemClearable
        --background="rgb(228, 228, 231)"
        --input-color="rgb(39, 39, 42)"
        --multi-item-bg="rgb(59, 130, 246)"
        --multi-item-color="rgb(228, 228, 231)"
        --border-radius="0px"
        --border="0"
        --border-hover="0"
        --padding="0">
        <div slot="item" let:item>
          {item.created ? 'Add new: ' : ''}
          {item.label}
        </div>
      </Select>{/if}
  </div>
</div>
