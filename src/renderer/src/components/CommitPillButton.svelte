<script lang="ts">
  import { GitCommit } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  export let hashAbbrev: string
</script>

<button
  on:click={() => dispatch('showCommitOnView', { hashAbbrev })}
  class="m-1 items-center rounded-full border-2 border-c-black p-1 text-c-black dark:border-c-white dark:text-c-white"
  ><GitCommit class="me-1 inline" />
  #{hashAbbrev}
</button>
