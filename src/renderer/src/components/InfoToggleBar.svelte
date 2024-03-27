<script lang="ts">
  import { createToggleGroup } from '@melt-ui/svelte'
  import { Diff, FileDiff, GitBranch, Info, Tags, User } from 'lucide-svelte'

  export let info: string | string[] = []

  const {
    elements: { root, item },
    states: { value }
  } = createToggleGroup({
    type: 'multiple',
    defaultValue: [...info]
  })

  $: {
    info = $value
  }
</script>

<Info class="h-4 w-4" /> Info toggles
<div
  {...$root}
  use:root
  class="flex h-8 items-center gap-1 border-2 border-c-black data-[orientation='vertical']:flex-col"
  aria-label="Info toggles">
  <button
    class="toggle-item m-1 p-1 data-[state='on']:bg-app hover:bg-f-grey-100/30"
    {...$item('author')}
    use:item
    aria-label="Author">
    <User class="h-4 w-4" />
  </button>
  <button
    class="toggle-item m-1 p-1 data-[state='on']:bg-app hover:bg-f-grey-100/30"
    {...$item('branches')}
    use:item
    aria-label="Branches">
    <GitBranch class="h-4 w-4" />
  </button>
  <button
    class="toggle-item m-1 p-1 data-[state='on']:bg-app hover:bg-f-grey-100/30"
    {...$item('tags')}
    use:item
    aria-label="Tags">
    <Tags class="h-4 w-4" />
  </button>
  <button
    class="toggle-item m-1 p-1 data-[state='on']:bg-app hover:bg-f-grey-100/30"
    {...$item('file_diff')}
    use:item
    aria-label="File diff">
    <FileDiff class="h-4 w-4" />
  </button>
  <button
    class="toggle-item m-1 p-1 data-[state='on']:bg-app hover:bg-f-grey-100/30"
    {...$item('line_diff')}
    use:item
    aria-label="Line diff">
    <Diff class="h-4 w-4" />
  </button>
</div>
