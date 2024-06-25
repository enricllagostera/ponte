<script lang="ts">
  import { createTabs } from '@melt-ui/svelte'
  import { cubicInOut } from 'svelte/easing'
  import { crossfade } from 'svelte/transition'
  import { allDevlogs, appStates, repo } from '../stores/stores'
  import CommitListItem from './CommitListItem.svelte'
  import ChronologicalTimeline from './ChronologicalTimeline.svelte'
  import Button from './Button.svelte'
  import QdpxPreview from './QDPXPreview.svelte'
  import GeneralToggle from './GeneralToggle.svelte'
  import { Filter, X } from 'lucide-svelte'
  import SettingsPanel from './SettingsPanel.svelte'
  import type { Commit } from '../../../types'

  const {
    elements: { root, list, content, trigger },
    states: { value }
  } = createTabs({
    defaultValue: 'blogroll',
    onValueChange: ({ next }) => {
      $appStates.view = next
      return next
    }
  })

  const triggers = [
    { id: 'blogroll', title: 'Blogroll' },
    { id: 'timeline', title: 'Timeline' },
    { id: 'exportPanel', title: 'Export summary' },
    { id: 'settingsTab', title: 'Settings' }
  ]

  let mainView
  let filterKeyword = ''
  let filteredCommitsCount = 0
  let toggleFullText = false

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

  function changeKeyword(e): void {
    filterKeyword = e.target.value
    filteredCommits()
  }

  function clearCommitFilter(): void {
    filterKeyword = ''
    filteredCommits()
  }

  function filteredCommits(): Commit[] {
    if (toggleFullText) {
      const filtered = $repo.commits.filter((i) => {
        let devlog = $allDevlogs.get(i.hash)
        return devlog.content.toLowerCase().indexOf(filterKeyword.toLowerCase()) >= 0
      })
      filteredCommitsCount = filtered.length
      return filtered
    }

    const filtered = $repo.commits.filter((i) => i.subject.toLowerCase().indexOf(filterKeyword.toLowerCase()) >= 0)
    filteredCommitsCount = filtered.length
    return filtered
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
    on:scroll={() => {
      $appStates.mainViewScroll = mainView.scrollTop
      $appStates.mainViewLeft = mainView.scrollLeft
      $appStates.mainViewWidth = mainView.clientWidth
    }}
    bind:this={mainView}>
    <div {...$content('exportPanel')} use:content id="exportPanelTab" class="h-full w-full">
      <QdpxPreview></QdpxPreview>
    </div>
    <div {...$content('settingsTab')} use:content id="settingsTab" class="h-full w-full"><SettingsPanel /></div>
    <div {...$content('timeline')} use:content id="chronoTimelineView">
      <ChronologicalTimeline parentBox={mainView} />
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
          {#each filteredCommits() as commit (commit.hash)}
            {#key filterKeyword}
              <CommitListItem {commit} devlog={$allDevlogs.get(commit.hash)} />
            {/key}
          {/each}
        {:else}
          <p id="gitData">Waiting for repo data.</p>
        {/if}
      </div>
    </div>
  </div>
</div>
