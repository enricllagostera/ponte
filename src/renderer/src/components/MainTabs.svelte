<script lang="ts">
  import { createTabs } from '@melt-ui/svelte'
  import { cubicInOut } from 'svelte/easing'
  import { crossfade } from 'svelte/transition'
  import { appStates, repo, settings } from '../stores'
  import CommitListItem from './CommitListItem.svelte'
  import ChronologicalTimeline from './ChronologicalTimeline.svelte'

  const {
    elements: { root, list, content, trigger },
    states: { value }
  } = createTabs({
    defaultValue: 'tab-1'
  })

  const triggers = [
    { id: 'tab-1', title: 'Blogroll view' },
    { id: 'tab-2', title: 'Timeline view' }
  ]

  let mainView

  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut
  })
</script>

<div class="m-2 flex h-full w-full flex-col" {...$root} use:root>
  <div
    class="flex w-full grow-0 border-b-2 border-c-black px-2 font-bold dark:border-c-white"
    {...$list}
    use:list
    aria-label="Main view picker">
    {#each triggers as triggerItem}
      <button
        {...$trigger(triggerItem.id)}
        use:trigger
        class=" p-2 data-[state=inactive]:border-t-0 data-[state=active]:border-app data-[state=active]:bg-c-black data-[state=active]:text-c-white dark:border-c-white dark:data-[state=active]:bg-c-white dark:data-[state=active]:text-c-black">
        {triggerItem.title}
        {#if $value === triggerItem.id}
          <div
            in:send={{ key: 'trigger' }}
            out:receive={{ key: 'trigger' }}
            class="absolute bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full" />
        {/if}
      </button>
    {/each}
  </div>
  <div
    class="flex w-full shrink grow overflow-auto px-4 py-2 scrollbar"
    id="mainTabbedView"
    on:scroll={() => ($appStates.mainViewScroll = mainView.scrollTop)}
    bind:this={mainView}>
    <div {...$content('tab-2')} use:content id="chronoTimelineView">
      <ChronologicalTimeline />
    </div>
    <div {...$content('tab-1')} use:content>
      <div class="flex w-full flex-col" id="commitListViewContainer">
        {#if $appStates.repoReady}
          {#each $repo.commits as commit (commit.hash)}
            <CommitListItem
              {commit}
              userRepoInfo={$repo.userRepoInfo}
              encodingAction={$appStates.actions.manualEncodeCommits}
              on:fileToggled={async () => {
                await $appStates.updateQDPX($repo, $settings, $appStates.actions)
              }}
              on:folderToggled={async () => {
                await $appStates.updateQDPX($repo, $settings, $appStates.actions)
              }}
              on:commitEncoded={async () => {
                await $appStates.updateQDPX($repo, $settings, $appStates.actions)
              }} />
          {/each}
        {:else}
          <p id="gitData">Waiting for repo data.</p>
        {/if}
      </div>
    </div>
  </div>
</div>
