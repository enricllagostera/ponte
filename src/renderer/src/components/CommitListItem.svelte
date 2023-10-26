<script lang="ts">
  /** eslint-disable @typescript-eslint/explicit-function-return-type */
  import { createEventDispatcher } from 'svelte'
  import { DateTime } from 'luxon'
  import { marked } from 'marked'

  import CodeSelect from './CodeSelect.svelte'
  import { codeOptions, settings } from '../stores'

  import { inview } from 'svelte-inview'
  import Tree from './Tree.svelte'
  import type { Action, AppliedCode, CodeOption } from '../../../types'
  // import { fade } from 'svelte/transition'

  export let encodingAction: Action
  export let activeAtStart = true
  export let commit
  export let userRepoInfo
  export let promise
  let active = activeAtStart

  let showFileTree = false
  let isInView = false
  let inViewOptions = {
    rootMargin: '50px',
    unobserveOnEnter: true
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
  class="card my-3 overflow-auto"
  class:text-bg-secondary={!active}
  use:inview={inViewOptions}
  on:inview_enter={(event) => {
    const { inView } = event.detail
    isInView = inView
  }}
  on:inview_leave={(event) => {
    const { inView } = event.detail
    isInView = inView
  }}
>
  <div class="card-header">
    <i class="bi bi-git"></i> #{commit.hashAbbrev} <i class="bi bi-calendar-event"></i>
    {DateTime.fromMillis(commit.author.timestamp).toISODate()}, approx. {DateTime.fromMillis(
      commit.author.timestamp
    ).toRelative()}
  </div>
  <div class="card-body">
    <h6 class="card-title">{commit.subject}</h6>
    {#if commit.body != ''}
      <div class="commitBody text-body-secondary">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html marked.parse(commit.body)}
      </div>
    {/if}
  </div>
  {#if isInView}
    <div class="card-body overflow-auto">
      <details class:animate={isInView} class="pe-2 overflow-auto" bind:open={showFileTree}>
        <summary class="mb-2 btn btn-outline-primary"
          ><i class="bi bi-eye"></i> Preview files in this commit</summary
        >
        {#await promise then}
          <Tree tree={commit.fileTree} let:node>
            <div
              class="d-flex align-items-start p-1 rounded-1 fs-6 text-red"
              class:text-secondary={isUnsupported(node)}
              class:my-1={isUnsupported(node)}
              style:background-color={isUnsupported(node) ? '#f0f0f0' : 'transparent'}
            >
              {#if node.children}
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="folderSwitch"
                    on:change={(e) => toggleFolder(e, node)}
                    checked={node.selected}
                  />
                </div>
                <i class="bi bi-folder me-1"></i>
                {node.name}
              {:else}
                {#if checkTextSourceExt(node.name)}
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="flexSwitchCheckDefault"
                      disabled={!checkTextSourceExt(node.name)}
                      on:change={(e) => toggleFile(e, node)}
                      checked={node.selected}
                    />
                  </div>
                  <i class="bi bi-file-text-fill me-1"></i>
                {/if}
                {node.name}
                <a
                  href={`https://github.com/${userRepoInfo}/tree/${commit.hash}/${node.rel}`}
                  target="_blank"
                  ><i class="bi bi-github ms-1"></i>
                </a>
              {/if}
            </div>
          </Tree>
        {/await}
      </details>
    </div>
  {/if}

  <div class="card-footer d-flex d-flex flex-grow-0 align-items-center overflow-auto">
    <div class="mt-1">
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          bind:checked={active}
          on:change={onToggleIncluded}
          id="includeCheckbox_{commit.hash}"
        />
        <label for="includeCheckbox_{commit.hash}">Include in QDPX</label>
      </div>
    </div>
    <div class="ms-auto">
      <a
        class="btn btn-primary"
        href={`https://github.com/${userRepoInfo}/tree/${commit.hash}`}
        target="_blank"
        role="button"
      >
        <i class="bi bi-github"></i> Browse on Github</a
      >
    </div>
  </div>

  <div class="card-footer d-flex d-flex flex-grow-0 align-items-center overflow-auto">
    <CodeSelect
      initialOptions={$codeOptions}
      initialValues={getAllCodesForThisCommit()}
      on:codesChanged={codesChanged}
    />
  </div>
</div>

<style>
  :global(.commitBody h1) {
    font-size: 1.5rem;
  }
</style>
