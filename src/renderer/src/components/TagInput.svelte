<script lang="ts">
  import { createTagsInput } from '@melt-ui/svelte'
  import { Tag, Tags, X } from 'lucide-svelte'

  export let startingTags = []
  export let codesChanged

  const {
    elements: { root, input, tag, deleteTrigger, edit },
    states: { tags }
  } = createTagsInput({
    defaultTags: startingTags,
    unique: true,
    onTagsChange({ next }) {
      codesChanged(next)
      return next
    },
    addOnPaste: true
  })
</script>

<div class="flex w-full flex-col items-start justify-center gap-2">
  <div
    {...$root}
    use:root
    class="flex w-full flex-row flex-wrap gap-2.5 border-2 border-c-black bg-c-white px-3 py-2 align-middle focus-within:ring-1 focus-within:ring-f-grey-200">
    <Tags class="mt-2 flex p-0" />
    {#each $tags as t}
      <div
        {...$tag(t)}
        use:tag
        class="flex items-center overflow-hidden rounded-full bg-magenta/30 [word-break:break-word] data-[disabled]:bg-neutral-400 data-[selected]:bg-app data-[disabled]:hover:cursor-default data-[disabled]:focus:!outline-none data-[disabled]:focus:!ring-0">
        <span class="flex items-center border-r border-white/10 px-2"
          ><Tag class="me-1 inline-flex h-5 " /> {t.value}</span>
        <button {...$deleteTrigger(t)} use:deleteTrigger class="flex h-full items-center px-1 enabled:hover:bg-app">
          <X class="h-4 w-4" />
        </button>
      </div>
      <div
        {...$edit(t)}
        use:edit
        class="word-break:break-word] flex items-center overflow-hidden rounded-md px-1.5 data-[invalid-edit]:focus:!ring-red-500" />
    {/each}

    <input
      {...$input}
      use:input
      type="text"
      placeholder="Enter tags..."
      class="min-w-[4.5rem] shrink grow basis-0 border-0 text-black outline-none data-[invalid]:text-red-500 focus:!ring-0" />
  </div>
</div>
