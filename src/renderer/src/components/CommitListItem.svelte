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
  import { slide } from 'svelte/transition'

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

  async function devlogWithTrailerContent(): Promise<string> {
    const dv = await window.loader.getDevlogForCommit(commit.hash, {})
    return dv.content
  }
</script>

<div
  class="mb-10 flex flex-col border-2 border-c-black dark:border-f-grey-200"
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
  <div
    class="flex items-center justify-between border-b-2 border-c-black bg-c-black p-2 text-sm text-c-white dark:border-b-f-grey-200">
    <span
      class="me-2 inline-flex items-center rounded-full border-2 border-c-white p-2 px-2 py-1 text-sm font-medium"
      ><GitCommit class="inline" /> #{commit.hashAbbrev}</span>
    <time class="text-sm font-normal"
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
  <h3
    class="mb-4 flex items-center border-y-8 border-y-app p-4 py-2 text-xl font-bold dark:text-white">
    {commit.subject}
  </h3>

  {#if commit.body != ''}
    <div
      class="prose prose-base prose-neutral mb-4 px-4 dark:prose-invert prose-headings:mt-2 prose-headings:text-f-grey-200 prose-h1:border-t-2 prose-h1:pt-4 prose-h1:text-xl prose-h1:text-c-black prose-h1:before:content-['Devlog:_'] dark:prose-headings:text-f-grey-100 dark:prose-h1:text-c-white">
      {#await devlogWithTrailerContent() then dlog}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html marked.parse(dlog)}
      {/await}
    </div>
  {/if}

  {#if isInView}
    <div class="overflow-auto px-4">
      <details class:animate={isInView} class="overflow-auto pe-2" bind:open={showFileTree}>
        <summary class="w-fit"><i class="bi bi-eye"></i> Preview files in this commit</summary>
        {#await promise then}
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
