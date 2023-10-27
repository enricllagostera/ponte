<script lang="ts">
  /** eslint-disable @typescript-eslint/explicit-function-return-type */
  import { createEventDispatcher } from 'svelte'
  import { DateTime } from 'luxon'
  import { marked } from 'marked'

  import CodeSelect from './CodeSelect.svelte'
  import { codeOptions, settings } from '../stores'

  import { inview } from 'svelte-inview'
  import Tree from './Tree.svelte'
  import type { Action, AppliedCode, CodeOption, Commit } from '../../../types'
  import { GitCommit, Github, Tags } from 'lucide-svelte'

  export let encodingAction: Action
  export let activeAtStart = true
  export let commit: Commit
  export let userRepoInfo: string
  export let promise: Promise<any>
  let active = activeAtStart

  let showFileTree = false
  let isInView = false
  let inViewOptions = {
    rootMargin: '100px',
    unobserveOnEnter: false
  }

  const dispatch = createEventDispatcher()

  function onToggleIncluded(event): void {
    dispatch('toggleIncluded', {
      checked: event.target.checked,
      hash: commit.hash
    })
  }

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
</script>

<div
  class="flex flex-col border-indigo-200 dark:border-indigo-900 border-t-0 border-b-3 border-r-3 border-l-3 border-2 mb-4 rounded-lg"
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
  <div class="flex items-center justify-between rounded-t-lg bg-indigo-100 dark:bg-indigo-700">
    <span
      class="bg-indigo-200 text-indigo-800 rounded-tl-lg text-sm font-medium me-2 p-2 dark:bg-indigo-900 dark:text-indigo-300"
      ><GitCommit class="inline" /> #{commit.hashAbbrev}</span>
    <time class="inline text-sm font-normal text-zinc-500 dark:text-zinc-400"
      >{DateTime.fromMillis(commit.author.timestamp).toISODate()}, approx. {DateTime.fromMillis(
        commit.author.timestamp
      ).toRelative()}</time>
    <a
      class=" ms-auto w-fit h-fit text-sm text-indigo-700 dark:text-indigo-300 cursor-pointer me-4"
      href={`https://github.com/${userRepoInfo}/tree/${commit.hash}`}
      target="_blank"
      role="button">
      <Github class="inline" /> Browse on Github</a>
  </div>
  <!-- <div class="mt-1">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              bind:checked={active}
              on:change={onToggleIncluded}
              id="includeCheckbox_{commit.hash}" />
            <label for="includeCheckbox_{commit.hash}">Include in QDPX</label>
          </div>
        </div> -->
  <h3 class="flex items-center my-4 p-4 text-lg font-semibold text-zinc-900 dark:text-white">
    {commit.subject}
  </h3>

  {#if commit.body != ''}
    <div class="prose prose-base dark:prose-invert prose-zinc mb-4 px-4">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html marked.parse(commit.body)}
    </div>
  {/if}

  {#if isInView}
    <div class="overflow-auto px-4">
      <details class:animate={isInView} class="pe-2 overflow-auto" bind:open={showFileTree}>
        <summary
          class="w-fit text-indigo-700 hover:text-white border border-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:border-indigo-500 dark:text-indigo-500 dark:hover:text-white dark:hover:bg-indigo-500 dark:focus:ring-indigo-800 text-center cursor-pointer"
          ><i class="bi bi-eye"></i> Preview files in this commit</summary>
        {#await promise then}
          <Tree tree={commit.fileTree} let:node>
            <div
              class="flex items-start align-middle p-1 text-sm"
              class:italic={isUnsupported(node)}
              class:opacity-50={isUnsupported(node)}>
              {#if node.children}
                <input
                  type="checkbox"
                  role="switch"
                  id="folderSwitch_{node.name}"
                  on:change={(e) => toggleFolder(e, node)}
                  checked={node.selected} />

                <i class="bi bi-folder me-1"></i>
                <label for="folderSwitch_{node.name}">{node.name}</label>
              {:else}
                {#if checkTextSourceExt(node.name)}
                  <input
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
                  class="mx-2 items-start align-middle text-indigo-600"
                  ><Github class="w-4 h-4" /></a>
              {/if}
            </div>
          </Tree>
        {/await}
      </details>
    </div>
  {/if}

  <div class="p-4">
    <CodeSelect
      initialOptions={$codeOptions}
      initialValues={getAllCodesForThisCommit()}
      on:codesChanged={codesChanged} />
  </div>
</div>

<style>
  :global(.commitBody h1) {
    font-size: 1.5rem;
  }
</style>
