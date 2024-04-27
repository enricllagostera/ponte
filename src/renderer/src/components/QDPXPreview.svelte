<script lang="ts">
  import type { Commit, GUID, HASH, Source } from '../../../types'
  import { repo } from '../stores/stores'
  import { allCodes, autoencoders, getCommitsInCode } from '../stores/codes'
  import { removeSource, allSources, loadSourceContent } from '../stores/sources'
  import { annotations } from '../stores/annotations'

  import { marked } from 'marked'

  import { File, PackageCheck, Tag, Trash2 } from 'lucide-svelte'

  import Button from './Button.svelte'
  import Pane from './Pane.svelte'
  import CommitPillButton from './CommitPillButton.svelte'
  import Annotation from './Annotation.svelte'
  import { exportQDPX } from '../qdpxExport'

  let contentInPreview = ''
  let previewSource = undefined
  let previewCode = undefined

  function getCommit(hash: string): Commit {
    return $repo.commits.find((c) => c.hash == hash)
  }

  async function setSourcePreviewContent(source: Source): Promise<void> {
    clearPreviewContent()
    previewSource = source
    if (source.type == 'textFile') {
      contentInPreview = await loadSourceContent(source)
    } else if (source.type == 'folderCompilation') {
      contentInPreview = await loadSourceContent(source)
    } else if (source.type == 'devlogCompilation') {
      contentInPreview = source.content
    }
  }

  function clearPreviewContent(): void {
    previewSource = undefined
    previewCode = undefined
    contentInPreview = ''
  }

  function removeSourceFromListButton(source: Source): void {
    removeSource(source)
  }

  function showCodeInContentPreview(code: GUID): void {
    console.log('showing code in content preview: ', $allCodes.get(code))
    clearPreviewContent()
    previewCode = code
    contentInPreview = `# Tag: *${$allCodes.get(code).value}*\n\n Applied to `
    for (const hash of getCommitsInCode(code)) {
      contentInPreview += `Commit #${hash.substring(0, 7)}\n\n`
    }
  }

  function getSourcesForCommits(commitHashes: HASH[]): any {
    console.log('getting all sources for commit list.')
    let res = $allSources.filter((s) => s.commitHash == '' || commitHashes.includes(s.commitHash))
    return res
  }

  $: {
    console.log('Updating EXPORT PANEL')

    const someCodes = $allCodes
    const someEncoders = $autoencoders

    if (previewCode != undefined && $allCodes.get(previewCode) == undefined) {
      clearPreviewContent()
    }

    if (previewSource != undefined && $allSources.find((s) => s.id == previewSource.id) == undefined) {
      clearPreviewContent()
    }
  }
</script>

<!-- MAIN AREA -->
<div class="flex h-full w-full shrink-0 grow flex-row gap-2 overflow-hidden py-2">
  <div class="flex basis-1/4 flex-col gap-2 pb-2">
    {#key $allSources}
      <Pane title="Sources" class="h-[45%]">
        <div slot="body" class="w-full px-0">
          <ul class="w-full">
            {#each $allSources as source (source.id)}
              <li
                class="flex w-full flex-row items-center gap-1 p-1 {source.name == previewSource?.abs
                  ? 'bg-[#ccc] font-bold'
                  : ''}">
                <Button class="w-full border-[transparent]" on:click={() => setSourcePreviewContent(source)}
                  >{source.name}</Button>
                {#if source.type != 'devlogCompilation'}
                  <Button on:click={() => removeSourceFromListButton(source)} class="ms-auto h-8 w-8"
                    ><Trash2 class="inline-flex"></Trash2></Button>
                {/if}
              </li>
            {/each}
          </ul>
        </div></Pane
      >{/key}
    <Pane title="Codebook" class="h-[45%]">
      <div slot="body" class="flex flex-wrap gap-1">
        {#key $allCodes}
          {#each $allCodes as [codeId, codeObj] (codeId)}
            <Button
              class="inline-flex items-center rounded-full border-0 border-c-black px-2 py-1 dark:border-app dark:bg-c-black dark:text-app {previewCode ==
              codeId
                ? 'bg-app'
                : 'bg-transparent'}"
              on:click={() => showCodeInContentPreview(codeId)}
              ><Tag class="me-1 inline h-5 w-5" />{codeObj.value}</Button>
          {/each}
        {/key}
      </div>
    </Pane>
    <Button primary class="btn btn-primary " type="button" disabled={$repo.commits.length <= 0} on:click={exportQDPX}
      ><PackageCheck class="me-1 inline-flex"></PackageCheck>Export QDPX</Button>
  </div>
  <Pane class="w-1/2">
    <div slot="header" class="flex w-full flex-row items-center justify-between">
      {#if contentInPreview != ''}
        <span class="flex"
          >Content preview{contentInPreview != ''
            ? ' for ' +
              (previewSource != undefined
                ? 'source: ' + previewSource.name
                : 'code: ' + $allCodes.get(previewCode).value)
            : ''}</span>
        <Button class="ms-auto flex h-8" on:click={clearPreviewContent}>Clear preview</Button>
      {:else}
        <span class="flex">Content preview</span>
      {/if}
    </div>
    <div slot="body" class="prose prose-base prose-neutral max-w-[90%] pt-2">
      {#if contentInPreview == '' || contentInPreview == undefined}
        No source or code selected.
      {:else if previewSource != undefined}
        <h1 class="text-2xl text-[#777]"><File class="me-1 inline-flex" /> {previewSource.name}</h1>
        {@html marked.parse(contentInPreview)}
      {:else if previewCode != undefined}
        <h1 class="text-2xl text-[#777]"><Tag class="me-1 inline-flex" /> {$allCodes.get(previewCode).value}</h1>
        <h2>Commits encoded</h2>
        {#each getCommitsInCode(previewCode) as hash (hash)}
          <p class="my-1 flex border-2">
            <span class="flex p-2">{getCommit(hash).subject}</span>
            <CommitPillButton
              hashAbbrev={getCommit(hash).hashAbbrev}
              clickable={false}
              class="ms-auto flex bg-f-grey-100/30 px-2 text-sm" />
          </p>
        {/each}

        <h2>Sources encoded</h2>
        {#each getSourcesForCommits(getCommitsInCode(previewCode)) as source}
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
    {#key $annotations}
      <Pane title="Annotation">
        <div slot="body" class="w-full">
          {#if contentInPreview == '' || contentInPreview == undefined}
            No source or code selected.
          {:else}
            {#key contentInPreview}
              <Annotation
                reference={previewCode != undefined ? $allCodes.get(previewCode).id : previewSource.id}
                referenceType={previewCode != undefined ? 'code' : 'source'}></Annotation>
            {/key}
          {/if}
        </div>
      </Pane>
    {/key}
  </div>
</div>
