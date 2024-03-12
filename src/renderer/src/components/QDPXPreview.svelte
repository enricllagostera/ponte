<script lang="ts">
  import TextSourcePreview from './TextSourcePreview.svelte'
  import Pane from './Pane.svelte'
  import type { Commit } from '../../../types'
  import { repo, qdpx } from '../stores'
  import Button from './Button.svelte'
  import { marked } from 'marked'

  import { Files, GitCommit, Tag, Tags } from 'lucide-svelte'

  import { createEventDispatcher } from 'svelte'
  import CommitPillButton from './CommitPillButton.svelte'
  import { getAllSelectedFiles } from '../fileSystem'
  const dispatch = createEventDispatcher()

  let contentInPreview = ''
  let previewSource = {}

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

  function setPreviewContent(source) {
    previewSource = source
    if (source.originalExt == 'md') {
      contentInPreview = source.content
    } else {
      contentInPreview = `\`\`\`\`${source.originalExt}\n${source.content}\n\`\`\`\``
    }
  }
</script>

<!-- MAIN AREA -->
<!-- <div class="flex h-full basis-full flex-col bg-purple-200"> -->
<div class="flex h-full w-full shrink-0 grow flex-row gap-2 overflow-hidden py-2">
  <div class="flex basis-1/4 flex-col gap-2 pb-2">
    <Pane title="Sources" class="h-1/2">
      <div slot="body" class="w-full">
        <ul class="w-full">
          {#each $qdpx.sources as source}
            {#if source.parent == 'repository' || source.parent == 'copyTextSource' || source.parent == 'compilationSource' || source.parent == 'devlog'}
              <li
                class="w-full p-1 hover:cursor-pointer hover:bg-app hover:text-c-black {source.name ==
                previewSource?.name
                  ? 'bg-c-black font-bold text-c-white'
                  : ''}">
                <div class="" on:click={() => setPreviewContent(source)}>{source.name}</div>
              </li>
            {/if}
          {/each}
          {#if $qdpx.commits}
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
          {/if}
        </ul>
      </div></Pane>
    <Pane title="Codebook" class="h-1/2"
      ><div slot="body">
        <ul>
          {#each $qdpx.codes as code}
            <li>
              <span
                class="items-center rounded-full border-2 border-c-black bg-app px-2 py-1 dark:border-app dark:bg-c-black dark:text-app"
                ><Tag class="me-1 inline h-5 w-5" /><b>{code.code.value}</b></span
              >, applied to:
              <ul class="m-2">
                {#each code.commitHashes as hash}
                  <li class="my-1 border-2 border-f-grey-100 ps-2 text-sm">
                    <CommitPillButton hashAbbrev={getCommit(hash).hashAbbrev} on:showCommitOnView />
                    <p class="p-2 pt-1">{getCommit(hash).subject}</p>
                  </li>
                {/each}
              </ul>
            </li>
          {/each}
        </ul>
      </div>
    </Pane>
  </div>

  <Pane title="Content preview{contentInPreview != '' ? ' for: ' + previewSource.name : ''}" class="w-1/2">
    <div slot="body" class="prose prose-base prose-neutral max-w-[90%] pt-2">
      {#if contentInPreview != undefined}
        {@html marked.parse(contentInPreview)}
      {:else}No source selected.{/if}
    </div>
  </Pane>
  <div class="flex w-1/4 grow flex-col">
    <Pane title="Metadata">Metadata</Pane>
  </div>
</div>
<!-- </div> -->

<!-- <Pane title="QDPX Preview" class={$$restProps.class || ''}>
  <div slot="body" class="max-w-full">
    <h3><Files class="me-1 inline" /> Sources</h3>
    <ul class=" my-2">
      {#each $qdpx.sources as source}
        {#if source.parent == 'repository' || source.parent == 'copyTextSource' || source.parent == 'compilationSource' || source.parent == 'devlog'}
          <li class="ms-2">
            <TextSourcePreview {source} />
          </li>
        {/if}
      {/each}
      {#if $qdpx.commits}
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
      {/if}
    </ul>

    <h3><Tags class="me-1 inline" /> Codes</h3>
    <ul class="my-2">
      {#each $qdpx.codes as code}
        <li>
          <span
            class="items-center rounded-full border-2 border-c-black bg-app px-2 py-1 dark:border-app dark:bg-c-black dark:text-app"
            ><Tag class="me-1 inline h-5 w-5" /> <b>{code.code.value}</b></span
          >, applied to:
          <ul class="m-2">
            {#each code.commitHashes as hash}
              <li class="my-1 border-2 border-f-grey-100 ps-2 text-sm">
                <CommitPillButton hashAbbrev={getCommit(hash).hashAbbrev} on:showCommitOnView />
                <p class="p-2 pt-1">{getCommit(hash).subject}</p>
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  </div>
  <div slot="footer">
    <Button
      primary
      class="btn btn-primary btn-sm"
      type="button"
      disabled={$qdpx.commits.length <= 0}
      on:click={exportQDPX}>Export QDPX</Button>
  </div>
</Pane> -->
