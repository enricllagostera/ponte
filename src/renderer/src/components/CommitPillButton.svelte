<script lang="ts">
  import { Calendar, GitCommit } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'
  import { DateTime } from 'luxon'

  const dispatch = createEventDispatcher()

  export let hashAbbrev: string
  export let timestamp: string = ''
  export let clickable: boolean = true
  export let forceDarkTheme: boolean = false
</script>

{#if clickable}
  <button
    on:click={() => dispatch('showCommitOnView', { hashAbbrev })}
    class="items-center rounded-full border-2 border-c-black px-2 py-1 text-c-black dark:border-c-white dark:text-c-white {$$restProps.class}"
    ><GitCommit class="inline" />{hashAbbrev}
  </button>
  {#if timestamp != ''}
    <Calendar class="inline h-4 w-4" />{DateTime.fromMillis(timestamp).toISODate()}
  {/if}
{:else}
  <span
    class="items-center rounded-full border-2 border-c-black px-2 py-1 text-c-black {forceDarkTheme
      ? 'border-c-white bg-c-black text-c-white'
      : ''}  {$$restProps.class}"
    ><GitCommit class="inline" />{hashAbbrev}
  </span>
  {#if timestamp != ''}
    <Calendar class="inline h-4 w-4" />{DateTime.fromMillis(timestamp).toISODate()}
  {/if}
{/if}
