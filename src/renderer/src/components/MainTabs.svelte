<script lang="ts">
  import { createTabs } from '@melt-ui/svelte'
  import { cubicInOut } from 'svelte/easing'
  import { crossfade } from 'svelte/transition'
  import { appStates, repo, settings } from '../stores'
  import CommitListItem from './CommitListItem.svelte'
  import ChronologicalTimeline from './ChronologicalTimeline.svelte'
  import Button from './Button.svelte'
  import QdpxPreview from './QDPXPreview.svelte'
  import GeneralToggle from './GeneralToggle.svelte'
  import { onMount } from 'svelte'
  import { Filter, X } from 'lucide-svelte'

  const {
    elements: { root, list, content, trigger },
    states: { value }
  } = createTabs({
    defaultValue: 'blogroll',
    onValueChange: ({ curr, next }) => {
      $appStates.view = next
      return next
    }
  })

  const triggers = [
    { id: 'blogroll', title: 'Blogroll view' },
    { id: 'timeline', title: 'Timeline view' },
    { id: 'exportPanel', title: 'Export panel' }
  ]

  let mainView
  let filterKeyword = ''
  let filteredCommitsCount = 0
  let toggleFullText = false

  let allDevlogs = []

  onMount(async () => {
    let allDvsPromises = $repo.commits.map(async (c) => {
      return { hash: c.hash, content: await devlogWithTrailerContent(c.hash) }
    })

    allDevlogs = []
    for await (const devlog of allDvsPromises) {
      allDevlogs.push(devlog)
    }
  })

  $: {
    if ($appStates.view != $value) {
      $value = $appStates.view
      clearCommitFilter()
      $appStates.scrollIntoView($value, $appStates.commitInView)
    }
  }

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
    if (toggleFullText) {
      const filtered = $repo.commits.filter((i) => {
        let devlog = allDevlogs.find((d) => d.hash == i.hash)
        return devlog.content.toLowerCase().indexOf(filterKeyword.toLowerCase()) >= 0
      })
      filteredCommitsCount = filtered.length
      return filtered
    }

    const filtered = $repo.commits.filter((i) => i.subject.toLowerCase().indexOf(filterKeyword.toLowerCase()) >= 0)
    filteredCommitsCount = filtered.length
    return filtered
  }

  async function devlogWithTrailerContent(commitHash): Promise<string> {
    const dv = await window.loader.getDevlogForCommit(commitHash, {})
    return dv.content
  }
</script>

<div class="flex h-full w-full flex-col" {...$root} use:root>
  <div
    class="flex w-full flex-none border-b-2 border-c-black px-2 font-bold dark:border-c-white"
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
    <div {...$content('exportPanel')} use:content id="exportPanelTab" class="h-full w-full">
      <QdpxPreview></QdpxPreview>
    </div>
    <div {...$content('timeline')} use:content id="chronoTimelineView">
      <ChronologicalTimeline />
    </div>
    <div {...$content('blogroll')} use:content>
      <div class="flex w-full flex-col" id="commitListViewContainer">
        {#if $appStates.repoReady}
          <div class="sticky top-0 z-10 inline-flex w-full items-center gap-2 bg-white py-4">
            <div class="flex h-8 flex-row items-center gap-x-2 overflow-hidden">
              <Filter class="inline-flex pe-1"></Filter> Filter
              <input
                type="text"
                placeholder="Search commits..."
                on:input={debounce(changeKeyword)}
                value={filterKeyword}
                class="h-8" />
              <Button class="-ms-2 h-8 p-0" on:click={clearCommitFilter}><X></X></Button>
              <GeneralToggle class="h-8 w-[120px]" bind:value={toggleFullText}>Full-text</GeneralToggle>
              {#key filterKeyword}
                {#if filteredCommitsCount > 0}
                  {#if filterKeyword != ''}
                    Showing {filteredCommitsCount} commits with '{filterKeyword}' (out of {$repo.commits.length} commits).
                  {:else}
                    Showing all {$repo.commits.length} commits.
                  {/if}
                {:else}
                  No commits to show with '{filterKeyword}'.
                {/if}
              {/key}
            </div>
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
