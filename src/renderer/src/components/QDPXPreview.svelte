<script lang="ts">
  import TextSourcePreview from './TextSourcePreview.svelte'
  import Pane from './Pane.svelte'
  import type { Commit } from '../../../types'
  import { repo, qdpx } from '../stores'
  import Button from './Button.svelte'
  import { Files, GitCommit, Tag, Tags } from 'lucide-svelte'

  import { createEventDispatcher } from 'svelte'
  import CommitPillButton from './CommitPillButton.svelte'
  const dispatch = createEventDispatcher()

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
</script>

<Pane title="QDPX Preview" class={$$restProps.class || ''}>
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
</Pane>
