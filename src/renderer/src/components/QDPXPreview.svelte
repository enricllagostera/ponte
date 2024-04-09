<script lang="ts">
  import TextSourcePreview from './TextSourcePreview.svelte'
  import Pane from './Pane.svelte'
  import type { Commit } from '../../../types'
  import { repo, qdpx, appStates, settings } from '../stores'
  import Button from './Button.svelte'
  import { marked } from 'marked'

  import { Info, File, PackageCheck, Tag, Trash2 } from 'lucide-svelte'

  import { createEventDispatcher } from 'svelte'
  import CommitPillButton from './CommitPillButton.svelte'
  import { findInTreeAndToggleSelected } from '../fileSystem'

  let contentInPreview = ''
  let previewSource = undefined
  let previewCode = undefined

  function getExt(filename): string {
    const ext = filename.split('.').pop()
    return ext
  }

  function findDevlogForCommit(hash) {
    let res = $qdpx.sources.filter((s) => s.hash == hash)[0]
    return res
  }

  async function exportQDPX() {
    let qdpxExportOptions = {
      title: `Save QDPX file...`
    }
    await window.loader.exportQDPX($qdpx, qdpxExportOptions)
  }

  function getCommit(hash: string): Commit {
    return $repo.commits.find((c) => c.hash == hash)
  }

  function setSourcePreviewContent(source) {
    clearPreviewContent()
    previewSource = source
    if (source.originalExt == 'md') {
      contentInPreview = source.content
    } else {
      contentInPreview = `\`\`\`\`${source.originalExt}\n${source.content}\n\`\`\`\``
    }
  }

  function clearPreviewContent() {
    previewSource = undefined
    contentInPreview = ''
  }

  async function removeSource(source): void {
    // console.log('mt: source removed ', source)
    // folder source
    const commitIndex = $repo.commits.findIndex((c) => c.hash == source.hash)
    if (source.parent == 'compilationSource' || source.parent == 'copyTextSource') {
      findInTreeAndToggleSelected(source.abs, $repo.commits[commitIndex].fileTree, false)
      await $appStates.updateQDPX($repo, $settings, $appStates.actions)
    }
  }

  function showCodeInContentPreview(code: Code): void {
    console.log('showing code in content preview: ', code)
    clearPreviewContent()
    previewCode = code
    contentInPreview = `# Tag: *${code.code.value}*\n\n Applied to `
    for (const hash of code.commitHashes) {
      contentInPreview += `Commit #${hash.substring(0, 7)}\n\n`
    }
  }

  function getSourcesForCommits(commitHashes: any): any {
    console.log('getting all sources for commit list.')
    let res = $qdpx.sources.filter((s) => s.hash == '' || commitHashes.includes(s.hash))
    return res
  }
</script>

<!-- MAIN AREA -->
<div class="flex h-full w-full shrink-0 grow flex-row gap-2 overflow-hidden py-2">
  <div class="flex basis-1/4 flex-col gap-2 pb-2">
    {#key $qdpx.sources}
      <Pane title="Sources" class="h-[45%]">
        <div slot="body" class="w-full px-0">
          <ul class="w-full">
            {#each $qdpx.sources as source (source.name)}
              {#if source.parent == 'repository' || source.parent == 'copyTextSource' || source.parent == 'compilationSource' || source.parent == 'devlog'}
                <li
                  class="flex w-full flex-row items-center p-1 hover:cursor-pointer hover:bg-app hover:text-c-black {source.name ==
                  previewSource?.name
                    ? 'bg-[#ccc] font-bold'
                    : ''}">
                  <div class="" on:click={() => setSourcePreviewContent(source)}>{source.name}</div>
                  {#if source.parent != 'repository'}
                    <Button on:click={() => removeSource(source)} class="ms-auto h-8 w-8"
                      ><Trash2 class="inline-flex"></Trash2></Button>
                  {/if}
                </li>
              {/if}
            {/each}
            <!-- {#if $qdpx.commits}
              {#each $qdpx.commits as commit (commit.hash)}
                {#if findDevlogForCommit(commit.hash) != null}
                  <li><i class="bi bi-git"></i> #{commit.hashAbbrev}</li>
                  <ul class="ps-1">
                    {#each [findDevlogForCommit(commit.hash)] as source}
                      <li><TextSourcePreview {source} /></li>
                    {/each}
                  </ul>
                {/if}
              {/each}
            {/if} -->
          </ul>
        </div></Pane
      >{/key}
    <Pane title="Codebook" class="h-[45%]"
      ><div slot="body" class="flex flex-wrap gap-1">
        {#each $qdpx.codes as code (code.code.value)}
          <Button
            class="inline-flex items-center rounded-full border-0 border-c-black bg-magenta/30 px-2 py-1 dark:border-app dark:bg-c-black dark:text-app"
            on:click={() => showCodeInContentPreview(code)}
            ><Tag class="me-1 inline h-5 w-5" /><b>{code.code.value}</b></Button>
          <!-- , applied to:
              <ul class="m-2">
                {#each code.commitHashes as hash}
                  <li class="my-1 border-2 border-f-grey-100 ps-2 text-sm">
                    <CommitPillButton hashAbbrev={getCommit(hash).hashAbbrev} clickable={false} />
                    <p class="px-1 pt-1">{getCommit(hash).subject}</p>
                  </li>
                {/each}
              </ul> -->
        {/each}
      </div>
    </Pane>
    <Button primary class="btn btn-primary " type="button" disabled={$qdpx.commits.length <= 0} on:click={exportQDPX}
      ><PackageCheck class="me-1 inline-flex"></PackageCheck>Export QDPX</Button>
  </div>
  <Pane class="w-1/2">
    <div slot="header" class="flex w-full flex-row items-center justify-between">
      <span class="flex"
        >Content preview{contentInPreview != ''
          ? ' for ' + (previewSource != undefined ? 'source: ' + previewSource.name : 'code: ' + previewCode.code.value)
          : ''}</span>
      {#if contentInPreview != ''}
        <Button class="ms-auto flex h-8" on:click={clearPreviewContent}>Clear preview</Button>{/if}
    </div>
    <div slot="body" class="prose prose-base prose-neutral max-w-[90%] pt-2">
      {#if contentInPreview == '' || contentInPreview == undefined}
        No source or code selected.
      {:else if previewSource != undefined}
        <h1 class="text-2xl text-[#777]"><File class="me-1 inline-flex" /> {previewSource.name}</h1>
        {@html marked.parse(contentInPreview)}
      {:else if previewCode != undefined}
        <h1 class="text-2xl text-[#777]"><Tag class="me-1 inline-flex" /> {previewCode.code.value}</h1>
        <h2>Commits encoded</h2>
        {#each previewCode.commitHashes as hash (hash)}
          <p class="my-1 flex border-2">
            <span class="flex p-2">{getCommit(hash).subject}</span>
            <CommitPillButton
              hashAbbrev={getCommit(hash).hashAbbrev}
              clickable={false}
              class="ms-auto flex bg-f-grey-100/30 px-2 text-sm" />
          </p>
        {/each}

        <h2>Sources encoded</h2>
        {#each getSourcesForCommits(previewCode.commitHashes) as source}
          {#if source.parent == 'repository' || source.parent == 'copyTextSource' || source.parent == 'compilationSource' || source.parent == 'devlog'}
            <Button
              class="mb-1 flex w-full flex-row items-center border-0 border-[#ddd] p-1"
              on:click={() => setSourcePreviewContent(source)}>{source.name}</Button>
          {/if}
        {/each}
      {/if}
    </div>
  </Pane>
  <div class="flex w-1/4 grow flex-col">
    <Pane title="Metadata">Metadata</Pane>
  </div>
</div>
