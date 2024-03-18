<script lang="ts">
  import { Calendar, GitCommit, ScrollText, Waypoints } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'
  import { DateTime } from 'luxon'

  import { appStates } from '../stores'
  import Button from './Button.svelte'

  const dispatch = createEventDispatcher()

  export let hashAbbrev: string
  export let timestamp: string = ''
  export let clickable: boolean = true
  export let forceDarkTheme: boolean = false

  function switchToBlogroll(): void {
    if ($appStates.view != 'blogroll') {
      $appStates.commitInView = hashAbbrev
      $appStates.view = 'blogroll'
    }
  }

  function switchToTimeline(): void {
    if ($appStates.view != 'timeline') {
      $appStates.commitInView = hashAbbrev
      $appStates.view = 'timeline'
    }
  }
</script>

{#if clickable}
  <button
    on:click={() => dispatch('showCommitOnView', { hashAbbrev })}
    class="items-center border-2 border-c-black px-2 py-1 text-f-grey-200 dark:border-c-white dark:text-c-white {$$restProps.class}"
    ><GitCommit class="inline" /> #{hashAbbrev}
  </button>
  {#if timestamp != ''}
    <Calendar class="inline h-4 w-4" />{DateTime.fromMillis(timestamp).toISODate()}
  {/if}
{:else}
  <div
    class="flex flex-row items-center gap-1 border-c-black font-mono font-semibold text-c-black {forceDarkTheme
      ? 'bg-[#ddd] text-f-grey-200'
      : ''}  {$$restProps.class}">
    <GitCommit class="inline-flex h-4 w-4" /> #{hashAbbrev}
    <Button class="ms-auto inline-flex" on:click={switchToBlogroll}><ScrollText class="h-4 w-4"></ScrollText></Button>
    <Button class="inline-flex" on:click={switchToTimeline}><Waypoints class="h-4 w-4"></Waypoints></Button>
  </div>
  {#if timestamp != ''}
    <Calendar class="inline h-4 w-4" />{DateTime.fromMillis(timestamp).toISODate()}
  {/if}
{/if}
