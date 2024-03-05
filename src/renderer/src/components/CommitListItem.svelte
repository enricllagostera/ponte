<script lang="ts">
  /** eslint-disable @typescript-eslint/explicit-function-return-type */
  import { createEventDispatcher } from 'svelte'
  import { DateTime } from 'luxon'
  import { marked } from 'marked'

  import { appStates, codeOptions, settings } from '../stores'

  import { inview } from 'svelte-inview'
  import Tree from './Tree.svelte'
  import type { Action, AppliedCode, CodeOption, Commit } from '../../../types'
  import { Github } from 'lucide-svelte'
  import CommitPillButton from './CommitPillButton.svelte'
  import TagInput from './TagInput.svelte'
  import Pane from './Pane.svelte'

  export let encodingAction: Action
  export let activeAtStart = true
  export let commit: Commit
  export let userRepoInfo: string
  let active = activeAtStart

  let isInView = false
  let inViewOptions = {
    rootMargin: '1000px',
    unobserveOnEnter: false
  }

  const dispatch = createEventDispatcher()

  function getExt(filename): string {
    const ext = filename.split('.').pop()
    return ext
  }

  function toggleFile(event, node): void {
    node.selected = event.target.checked
    dispatch('fileToggled')
  }

  function toggleFolder(event, node): void {
    node.selected = event.target.checked
    dispatch('folderToggled')
  }

  function updateCodes(codes, options): void {
    for (const code of options) {
      let previousOptions = $codeOptions.filter((o) => o.value != code.value)
      $codeOptions = [...previousOptions, ...options]
    }
    commit.appliedCodes = [...codes]
    // console.log(commit)
  }

  function getAllCodesForThisCommit(): CodeOption[] {
    const res = encodingAction.codesToApply.filter((e) => e.commitHashes.indexOf(commit.hash) >= 0)
    return res.map((r) => r.code)
  }

  function findIndexCodeToApply(name: string): number {
    const res = encodingAction.codesToApply.findIndex((e) => e.code.value == name)
    return res
  }

  function appendToCodesToApply(newEntries: AppliedCode[] = []): void {
    encodingAction.codesToApply = [...encodingAction.codesToApply, ...newEntries]
  }

  function removeCodeToApply(codeToRemove): void {
    encodingAction.codesToApply = encodingAction.codesToApply.filter(
      (c) => c.code.value != codeToRemove.code.value
    )
  }

  function appendToCommits(indexOfCode: number, newHash: string): void {
    const other = encodingAction.codesToApply[indexOfCode].commitHashes.filter((c) => c !== newHash)
    encodingAction.codesToApply[indexOfCode].commitHashes = [...other, newHash]
  }

  function removeFromCommits(indexOfCode: number, hashToRemove: string): void {
    const other = encodingAction.codesToApply[indexOfCode].commitHashes.filter(
      (c) => c !== hashToRemove
    )
    encodingAction.codesToApply[indexOfCode].commitHashes = [...other]
  }

  function codesChanged(event: CustomEvent): void {
    // console.log(event.detail)
    // console.log('old options', $codeOptions)
    updateCodes(event.detail.codes, event.detail.options)

    const codesToAdd = event.detail.codes.filter((c) => findIndexCodeToApply(c.value) < 0)

    const codesAlreadyInAction = event.detail.codes.filter(
      (c) => findIndexCodeToApply(c.value) >= 0
    )

    const entriesWithObsoleteCodes = encodingAction.codesToApply.filter((entry) => {
      const entryHasThisCommit = entry.commitHashes.indexOf(commit.hash) >= 0
      const entryCodeIsNotInEvent =
        event.detail.codes.findIndex((c) => c.value == entry.code.value) < 0
      return entryHasThisCommit && entryCodeIsNotInEvent
    })

    // create new codesToApply entries
    for (const newCode of codesToAdd) {
      appendToCodesToApply([
        {
          code: newCode,
          commitHashes: [commit.hash]
        }
      ])
    }

    // update existing codesToApply entries
    for (const codeToAppend of codesAlreadyInAction) {
      const appendIndex = findIndexCodeToApply(codeToAppend.value)
      appendToCommits(appendIndex, commit.hash)
    }

    for (const obsoleteEntry of entriesWithObsoleteCodes) {
      const obsIndex = findIndexCodeToApply(obsoleteEntry.code.value)
      removeFromCommits(obsIndex, commit.hash)
    }

    // remove all empty codes (not referencesd by any commit)
    const emptyCodesToApply = encodingAction.codesToApply.filter((e) => e.commitHashes.length == 0)
    for (const emptyCode of emptyCodesToApply) {
      removeCodeToApply(emptyCode)
    }

    encodingAction.codesToApply = [...encodingAction.codesToApply]
    dispatch('commitEncoded', { codes: commit.appliedCodes, commit: commit.hash })
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

  async function devlogWithTrailerContent(): Promise<string> {
    const dv = await window.loader.getDevlogForCommit(commit.hash, {})
    return dv.content
  }

  function getLineChanges(commit, filepath: string) {
    let res = commit.lineChangeStats.filter((lc) => lc.filepath == filepath)
    if (res.length == 0) {
      return { added_lines: '-', deleted_lines: '-' }
    }
    return res[0]
  }

  function getBgColorByOperation(operation) {
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
    // console.log(operation, res)
    return res
  }
</script>

<div
  class="my-6 flex max-h-[500px] w-full flex-col border-2 border-c-black transition-all dark:border-f-grey-200"
  class:text-bg-secondary={!active}
  use:inview={inViewOptions}
  on:inview_enter={(event) => {
    const { inView } = event.detail
    isInView = inView
  }}
  on:inview_leave={(event) => {
    const { inView } = event.detail
    isInView = inView
  }}>
  {#if isInView}
    <!-- TOP BAR -->
    <div class="flex w-full flex-col">
      <div
        class="flex items-center justify-between border-b-2 border-c-black bg-c-black px-8 py-2 text-sm text-c-white dark:border-b-f-grey-200"
        id="commit_{commit.hashAbbrev}">
        <CommitPillButton clickable={false} hashAbbrev={commit.hashAbbrev} forceDarkTheme />
        <time class="ms-2 text-sm font-normal"
          >{DateTime.fromMillis(commit.author.timestamp).toISODate()}, approx. {DateTime.fromMillis(
            commit.author.timestamp
          ).toRelative()}</time>
        <a
          class="active:hover:ring-0! me-2 ms-auto inline-flex h-fit w-fit cursor-pointer items-center border-2 border-c-black bg-transparent p-2 text-center text-sm font-medium text-c-white underline ring-offset-2 ring-offset-c-white hover:bg-c-black hover:text-app focus:outline-none focus-visible:z-10 focus-visible:border-2 focus-visible:ring-2 focus-visible:ring-c-black active:border-app active:bg-app active:text-c-black active:focus-visible:border-c-white disabled:bg-f-grey-200 disabled:text-c-white"
          href={`https://github.com/${userRepoInfo}/tree/${commit.hash}`}
          target="_blank"
          role="button">
          <Github class="me-1 inline h-5 w-5" /> Browse on Github</a>
      </div>
    </div>
  {/if}
  <!-- Main commit panel -->
  <div class="flex flex-row overflow-hidden">
    <div
      class="prose prose-base prose-neutral mt-4 flex w-1/2 max-w-full flex-col overflow-y-auto border-r-8 border-transparent px-8 text-c-black">
      <h3 class="pb-4 text-2xl font-bold dark:text-white">
        {commit.subject}
      </h3>
      {#if commit.body != ''}
        {#await devlogWithTrailerContent() then dlog}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html marked.parse(dlog)}
        {/await}
      {:else}
        <p>No commit message available.</p>
      {/if}
    </div>

    <!-- Changed files col -->

    <Pane class=" mt-4 flex h-full w-1/5 flex-grow-0 flex-col transition-all">
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
        <table class="w-full table-auto border-separate border-spacing-1">
          {#each commit.fileChangeStats as { operation, filepath }}
            <tr class="align-top text-sm">
              <!-- {@debug commit} -->
              <!-- <div class="flex w-full items-start py-1 text-sm"> -->
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
                  href={`https://github.com/${userRepoInfo}/blame/${commit.hash}/${filepath}`}
                  target="_blank"
                  title="See file in GitHub (blame)"
                  class=" text-neutral-600"><Github class="h-4 w-4" /></a>
              </td>
              <!-- </div> -->
            </tr>
          {/each}
        </table>
      </div>
    </Pane>
    <!-- All files in project col -->
    <Pane
      title="All files in project"
      class="mt-4  flex h-full w-1/5 flex-grow-0 flex-col transition-all">
      <div slot="body">
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
                on:change={(e) => toggleFolder(e, node)}
                checked={node.selected} />
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
                  on:change={(e) => toggleFile(e, node)}
                  checked={node.selected} />
                <i class="bi bi-file-text-fill me-1"></i>
                <label for="fileSwitch_{node.name}_{commit.hashAbbrev}">{node.name}</label>
              {:else}
                {node.name}
              {/if}
              <a
                href={`https://github.com/${userRepoInfo}/tree/${commit.hash}/${node.rel}`}
                target="_blank"
                title="See file in GitHub"
                class="mx-2 items-start align-middle text-neutral-600"
                ><Github class="h-4 w-4" /></a>
            {/if}
          </div>
        </Tree>
      </div>
    </Pane>
  </div>
  <!-- TAGGING ROW -->
  <div class="my-4 flex w-full px-8">
    <TagInput on:codesChanged={codesChanged}></TagInput>
  </div>
</div>

<style>
  :global(.commitBody h1) {
    font-size: 1.5rem;
  }
</style>
