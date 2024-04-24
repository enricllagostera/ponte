<script lang="ts">
  import { DateTime } from 'luxon'
  import { marked } from 'marked'

  import { allDevlogs, repo, settings } from '../stores'
  import { addSource, allSources, removeSource } from '../sources'

  import { allCodes, codesInCommit, updateEncodingsForCommit } from '../codes'

  import { inview } from 'svelte-inview'
  import Tree from './Tree.svelte'
  import type { Commit } from '../../../types'
  import { Github } from 'lucide-svelte'
  import CommitPillButton from './CommitPillButton.svelte'
  import TagInput from './TagInput.svelte'
  import Pane from './Pane.svelte'
  import { onMount } from 'svelte'
  import { minimatch } from 'minimatch'

  export let activeAtStart = true
  export let commit: Commit
  export let devlog: Devlog

  let devlogContent = ''
  $: {
    devlogContent = devlog?.content ?? 'Empty commit message.'
  }
  let userRepoInfo: string = $repo.userRepoInfo

  let active = activeAtStart
  let isInView = false
  let inViewOptions = {
    rootMargin: '500px',
    unobserveOnEnter: true
  }
  let encodingsStore
  let processedEncodings = []

  onMount(() => {
    // console.log('[COMMIT LIST ITEM] Getting encodings store.')
    encodingsStore = codesInCommit.get(commit.hash)
  })

  $: {
    if (encodingsStore != undefined) {
      processedEncodings = $encodingsStore.map((enc) => $allCodes.get(enc))
    }
  }

  function selectIfInSource(node): boolean {
    // console.log('[FILE TREE ITEM] Updating selected treenodes from sources.')
    for (const source of $allSources.filter((s) => s.commitHash == commit.hash)) {
      if (source.type == 'textFile') {
        return minimatch(source.abs, node.abs)
      }
      if (source.type == 'folderCompilation') {
        console.log('[FILE TREE ITEM] Updating selected folder treenodes from sources.')
        return minimatch(source.abs, node.abs)
      }
    }
    return false
  }

  function getExt(filename): string {
    const ext = filename.split('.').pop()
    return ext
  }

  function toggleFile(event, node): void {
    const newState = event.target.checked
    if (newState) {
      // adding file source
      addSource({ ...node, type: 'textFile' })
    } else {
      // removing file source
      removeSource({ ...node, type: 'textFile' })
    }
    node.selected = event.target.checked
  }

  function toggleFolder(event, node): void {
    const newState = event.target.checked
    if (newState) {
      // adding file source
      addSource({ ...node, type: 'folderCompilation' })
    } else {
      // removing file source
      removeSource({ ...node, type: 'folderCompilation' })
    }
    node.selected = event.target.checked
  }

  async function handleChangedCodes(tags): Promise<void> {
    console.log('commitlist handle taginput change: ', commit.hash)

    let codes = [...tags]

    updateEncodingsForCommit(codes, commit.hash)
  }

  function checkTextSourceExt(filename: string): boolean {
    return $settings.supportedTextExts.indexOf(getExt(filename)) > -1
  }

  function isUnsupported(node): boolean {
    if (node.children) {
      return false
    }
    return checkTextSourceExt(node.name) == false
  }

  function getLineChanges(commit, filepath: string): { added_lines: string; deleted_lines: string } {
    let res = commit.lineChangeStats.filter((lc) => lc.filepath == filepath)
    if (res.length == 0) {
      return { added_lines: '-', deleted_lines: '-' }
    }
    return res[0]
  }

  function getCommitBodyAndDevlog(commitHash: HASH) {
    const dlc = allDevlogs.get(commit.hash)?.content
    return marked.parse(dlc ?? 'No commit message or devlog available.')
  }

  function getBgColorByOperation(operation): string {
    let res = 'c-black'
    switch (operation) {
      case 'A':
        res = '#66800B'
        break
      case 'D':
        res = '#AF3029'
        break
      case 'M':
        res = '#205EA6'
        break
      default:
        res = 'c-black'
        break
    }
    return res
  }
</script>

<!-- COMPONENT ROOT -->
<div
  class="my-6 flex w-full shrink grow-0 flex-col gap-0 overflow-hidden border-2 border-c-black transition-all dark:border-f-grey-200"
  class:text-bg-secondary={!active}
  id="blogroll_{commit.hashAbbrev}"
  use:inview={inViewOptions}
  on:inview_enter={(event) => {
    const { inView } = event.detail
    isInView = inView
  }}
  on:inview_leave={(event) => {
    const { inView } = event.detail
    isInView = inView
  }}>
  <!-- TOP BAR -->
  <div
    class="flex h-16 basis-full flex-row items-center justify-between border-b-2 border-c-black bg-c-black px-8 py-2 align-middle text-sm text-c-white dark:border-b-f-grey-200"
    id="commit_{commit.hashAbbrev}">
    <CommitPillButton clickable={false} hashAbbrev={commit.hashAbbrev} forceDarkTheme class="p-1 px-2" />
    <time class="ms-2 flex font-normal"
      >{DateTime.fromMillis(commit.author.timestamp).toISODate()}, approx. {DateTime.fromMillis(
        commit.author.timestamp
      ).toRelative()}.</time>
    <a
      class="active:hover:ring-0! me-2 ms-auto inline-flex h-fit w-fit cursor-pointer items-center border-2 border-c-black bg-transparent p-2 text-center text-sm font-medium text-c-white underline ring-offset-2 ring-offset-c-white hover:bg-c-black hover:text-app focus:outline-none focus-visible:z-10 focus-visible:border-2 focus-visible:ring-2 focus-visible:ring-c-black active:border-app active:bg-app active:text-c-black active:focus-visible:border-c-white disabled:bg-f-grey-200 disabled:text-c-white"
      href={`https://github.com/${userRepoInfo}/tree/${commit.hash}`}
      target="_blank"
      role="button">
      <Github class="me-1 inline h-5 w-5" /> Browse on Github</a>
  </div>
  <div class="my-2 flex h-full max-h-[400px] w-full flex-row gap-2 px-8 pt-2">
    <!-- Main commit panel -->
    <div class="flex shrink-0 grow flex-col overflow-y-auto scrollbar-thin">
      <div class="min-w-1/2 prose prose-base prose-neutral pe-4 text-c-black">
        <h3 class="pb-4 text-2xl font-bold dark:text-white">
          {commit.subject}
        </h3>
        {#key devlogContent}
          {#if commit.body == ''}
            <p>No commit message or devlog available.</p>
          {:else}
            {@html marked.parse(devlogContent ?? 'Empty message.')}
          {/if}
        {/key}
      </div>
    </div>
    {#if isInView}
      <!-- Changed files col -->
      <Pane class="ms-auto basis-1/4">
        <div slot="header" class="flex w-full justify-between">
          <span class="flex w-fit">Changed files</span>
          <span class="flex w-fit">
            <a
              href={`https://github.com/${userRepoInfo}/commit/${commit.hash}`}
              target="_blank"
              title="Explore diff details on GitHub"
              class="flex w-fit text-f-grey-200"><Github class="mt-1 h-4 w-4" />Explore diff</a
            ></span>
        </div>
        <div slot="body">
          <table class="h-full w-full table-auto border-separate border-spacing-1">
            {#each commit.fileChangeStats as { operation, filepath }}
              <tr class="align-top text-sm">
                <td
                  class="text-balance break-all border-l-2 pb-2 pe-4 ps-2"
                  style:border-left-color={getBgColorByOperation(operation)}
                  style:color={getBgColorByOperation(operation)}>{filepath}</td>
                <td class="w-4"> {operation}</td>
                <td class="text-green">
                  {getLineChanges(commit, filepath).added_lines}
                </td>
                <td class="text-red">{getLineChanges(commit, filepath).deleted_lines}</td>
                <td class="w-4 px-2 pt-1">
                  <a
                    href={`https://github.com/${userRepoInfo}/blob/${commit.hash}/${filepath}`}
                    target="_blank"
                    title="See file in GitHub"
                    class=" text-neutral-600"><Github class="h-4 w-4" /></a>
                </td>
              </tr>
            {/each}
          </table>
        </div>
      </Pane>
      <!-- All files in project col -->
      <Pane title="All files in project" class="basis-1/4">
        <div slot="body">
          {#key $allSources}
            <Tree tree={commit.fileTree} let:node>
              <div
                class="flex items-start py-1 align-middle text-sm"
                class:italic={isUnsupported(node)}
                class:opacity-50={isUnsupported(node)}>
                {#if node.children}
                  <input
                    type="checkbox"
                    class="form-checkbox text-app-accessible focus:outline-none
                  focus:ring-2 focus:ring-app-accessible focus:ring-offset-c-white dark:focus:ring-app dark:focus:ring-offset-c-black"
                    role="switch"
                    id="folderSwitch_{node.name}"
                    on:change={(ev) => toggleFolder(ev, node)}
                    checked={selectIfInSource(node)} />
                  <i class="bi bi-folder me-1"></i>
                  <label for="folderSwitch_{node.name}">{node.name}</label>
                {:else}
                  {#if checkTextSourceExt(node.name)}
                    <input
                      class="form-checkbox text-app-accessible focus:outline-none
                  focus:ring-2 focus:ring-app focus:ring-offset-c-white dark:focus:ring-offset-c-black"
                      type="checkbox"
                      role="switch"
                      id="fileSwitch_{node.name}_{commit.hashAbbrev}"
                      disabled={!checkTextSourceExt(node.name)}
                      on:change={(ev) => toggleFile(ev, node)}
                      checked={selectIfInSource(node)} />
                    <i class="bi bi-file-text-fill me-1"></i>
                    <label for="fileSwitch_{node.name}_{commit.hashAbbrev}">{node.name}</label>
                  {:else}
                    {node.name}
                  {/if}

                  <a
                    href={`https://github.com/${userRepoInfo}/tree/${commit.hash}/${node.rel}`}
                    target="_blank"
                    title="See file in GitHub"
                    class="mx-2 items-start align-middle text-neutral-600"><Github class="h-4 w-4" /></a>
                {/if}
              </div>
            </Tree>
          {/key}
        </div>
      </Pane>
    {/if}
  </div>
  <!-- {/if} -->

  <!-- TAGGING ROW -->
  <div class="my-2 flex basis-full px-8">
    {#key processedEncodings ?? []}
      <TagInput startingTags={processedEncodings ?? []} codesChanged={handleChangedCodes}></TagInput>
    {/key}
  </div>
</div>
<!-- 
<style>
  :global(.commitBody h1) {
    font-size: 1.5rem;
  }
</style> -->
