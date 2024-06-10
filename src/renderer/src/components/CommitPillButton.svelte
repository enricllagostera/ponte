<script lang="ts">
  import { Calendar, GitCommit, ScrollText, Waypoints } from 'lucide-svelte'
  import { createEventDispatcher } from 'svelte'
  import { DateTime } from 'luxon'

  import { appStates } from '../stores/stores'
  import Button from './Button.svelte'

  const dispatch = createEventDispatcher()

  export let hashAbbrev: string
  export let timestamp: string = ''
  export let clickable: boolean = true
  export let forceDarkTheme: boolean = false
  export let zoomLevel: string = 'medium'

  let iconSizes = 'medium'

  $: {
    iconSizes = zoomLevel == 'medium' ? '4' : zoomLevel == 'small' ? '3' : '3'
  }

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
    <Calendar class="inline h-3 w-3" />{DateTime.fromMillis(timestamp).toISODate()}
  {/if}
{:else}
  <div
    class="flex flex-row items-center gap-1 border-c-black font-mono font-semibold text-c-black {forceDarkTheme
      ? 'bg-[#ddd] text-f-grey-200'
      : ''}  {$$restProps.class}">
    <GitCommit class="h-{iconSizes} w-{iconSizes}" /> #{hashAbbrev}
    <Button class="ms-auto flex h-fit" on:click={switchToBlogroll}
      ><ScrollText class="h-{iconSizes} w-{iconSizes}"></ScrollText></Button>
    <Button class="h-fit" on:click={switchToTimeline}
      ><Waypoints class="h-{iconSizes} w-{iconSizes}"></Waypoints></Button>
  </div>
  {#if timestamp != ''}
    <Calendar class="inline h-auto w-[70%]" />{DateTime.fromMillis(timestamp).toISODate()}
  {/if}
{/if}
