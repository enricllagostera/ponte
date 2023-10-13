<script>
  import TextSourcePreview from './TextSourcePreview.svelte'
  import Pane from './Pane.svelte'

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
</script>

<Pane>
  <div slot="header" class="d-flex flex-grow-0 align-items-center w-100">
    <div class="mt-1">
      <b>QDPX Preview</b>
    </div>
    <div class="ms-auto">
      <button
        class="btn btn-primary btn-sm"
        type="button"
        disabled={qdpxData.commits.length <= 0}
        on:click={exportQDPX}>Export QDPX</button
      >
    </div>
  </div>

  <div slot="body">
    <div class="text-primary">
      <h3><i class="bi bi-archive"></i> Sources</h3>
      <ul class=" list-unstyled my-2">
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
              <ul class="list-unstyled ps-1">
                {#each [findDevlogForCommit(commit.hash)] as source}
                  <li><TextSourcePreview {source} /></li>
                {/each}
              </ul>
            {/if}
          {/each}
        {/if}
      </ul>
    </div>

    <div class="text-success">
      <h3><i class="bi bi-tags"></i> Codes</h3>
      <ul class="my-2 list-unstyled">
        {#each qdpxData.codes as code}
          <li>
            <span class="text-bg-success rounded-1 p-1"
              ><i class="bi bi-tag-fill"></i> <b>{code.name}</b></span
            >, applied to:
            <ul class="list-unstyled m-2">
              {#each code.commits as commit}
                <li><i class="bi bi-git"></i> #{commit.hashAbbrev} - {commit.subject}</li>
              {/each}
            </ul>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</Pane>
