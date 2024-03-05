<script lang="ts">
  import { createTabs } from '@melt-ui/svelte'
  import { cubicInOut } from 'svelte/easing'
  import { crossfade } from 'svelte/transition'
  import { appStates, repo, settings } from '../stores'
  import CommitListItem from './CommitListItem.svelte'
  import ChronologicalTimeline from './ChronologicalTimeline.svelte'
  import Button from './Button.svelte'

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
  let filterKeyword = ''
  let filteredCommitsCount = 0

  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut
  })

  const debounce = (callback: Function, wait = 300) => {
    let timeout: ReturnType<typeof setTimeout>
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => callback(...args), wait)
    }
  }

  function changeKeyword(e) {
    filterKeyword = e.target.value
  }

  function clearCommitFilter() {
    filterKeyword = ''
  }

  function filteredCommits() {
    const filtered = $repo.commits.filter(
      (i) => i.subject.toLowerCase().indexOf(filterKeyword.toLowerCase()) >= 0
    )
    filteredCommitsCount = filtered.length
    return filtered
  }
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
    class="flex w-full shrink grow overflow-auto px-4 scrollbar"
    id="mainTabbedView"
    on:scroll={() => ($appStates.mainViewScroll = mainView.scrollTop)}
    bind:this={mainView}>
    <div {...$content('tab-2')} use:content id="chronoTimelineView" class="pt-2">
      <ChronologicalTimeline />
    </div>
    <div {...$content('tab-1')} use:content>
      <div class="flex w-full flex-col" id="commitListViewContainer">
        {#if $appStates.repoReady}
          <div class="sticky top-0 bg-white py-4">
            <input
              type="text"
              placeholder="Filter commits by subject..."
              on:input={debounce(changeKeyword)}
              value={filterKeyword} />

            <Button on:click={clearCommitFilter}>Reset filter</Button>
            {#key filterKeyword}
              {#if filteredCommitsCount > 0}
                {#if filterKeyword != ''}
                  Showing {filteredCommitsCount} commits with '{filterKeyword}' (out of {$repo
                    .commits.length} commits).
                {:else}
                  Showing all {$repo.commits.length} commits.
                {/if}
              {:else}
                No commits to show with '{filterKeyword}'.
              {/if}
            {/key}
          </div>
          {#key filterKeyword}
            {#each filteredCommits() as commit (commit.hash)}
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
          {/key}
        {:else}
          <p id="gitData">Waiting for repo data.</p>
        {/if}
      </div>
    </div>
  </div>
</div>
