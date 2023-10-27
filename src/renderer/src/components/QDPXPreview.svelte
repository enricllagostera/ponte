<script lang="ts">
  import TextSourcePreview from './TextSourcePreview.svelte'
  import Pane from './Pane.svelte'
  import type { Commit } from '../../../types'
  import { repo } from '../stores'
  import Button from './Button.svelte'
  import { Files, GitCommit, Tag, Tags } from 'lucide-svelte'

  export let qdpxData

  function findDevlogForCommit(hash) {
    let res = qdpxData.sources.filter((s) => s.hash == hash)[0]
    return res
  }

  async function exportQDPX() {
    let qdpxExportOptions = {
      title: `Save QDPX file...`
    }
    await window.loader.exportQDPX(qdpxData, qdpxExportOptions)
  }

  function getCommit(hash: string): Commit {
    return $repo.commits.find((c) => c.hash == hash)
  }
</script>

<Pane title="QDPX Preview" class={$$restProps.class || ''}>
  <div slot="body" class="max-w-full">
    <h3><Files class="inline me-1" /> Sources</h3>
    <ul class=" my-2">
      {#each qdpxData.sources as source}
        {#if source.parent == 'repository' || source.parent == 'copyTextSource' || source.parent == 'compilationSource' || source.parent == 'devlog'}
          <li class="ms-2">
            <TextSourcePreview {source} />
          </li>
        {/if}
      {/each}
      {#if qdpxData.commits}
        {#each qdpxData.commits as commit (commit.hash)}
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

    <h3><Tags class="inline me-1" /> Codes</h3>
    <ul class="my-2">
      {#each qdpxData.codes as code}
        <li>
          <span class="bg-blue-300 text-zinc-800 rounded p-1 items-center"
            ><Tag class="inline me-1 w-5 h-5" /> <b>{code.code.value}</b></span
          >, applied to:
          <ul class="m-2">
            {#each code.commitHashes as hash}
              <li class="ps-2">
                <GitCommit class="inline me-1" /> #{getCommit(hash).hashAbbrev} - {getCommit(hash)
                  .subject}
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  </div>
  <div slot="footer">
    <Button
      class="btn btn-primary btn-sm"
      type="button"
      disabled={qdpxData.commits.length <= 0}
      on:click={exportQDPX}>Export QDPX</Button>
  </div>
</Pane>
