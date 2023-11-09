<script lang="ts">
  import { GitCommit } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let hashAbbrev: string
  export let clickable: boolean = true
  export let forceDarkTheme: boolean = false
</script>

{#if clickable}
  <button
    on:click={() => dispatch('showCommitOnView', { hashAbbrev })}
    class="m-1 items-center rounded-full border-2 border-c-black px-2 py-1 text-c-black dark:border-c-white dark:text-c-white"
    ><GitCommit class="inline" /> #{hashAbbrev}
  </button>
{:else}
  <span
    class="m-1 items-center rounded-full border-2 border-c-black px-2 py-1 text-c-black {forceDarkTheme
      ? 'border-c-white bg-c-black text-c-white'
      : ''}"><GitCommit class="inline" /> #{hashAbbrev}</span>
{/if}
