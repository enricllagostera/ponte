<script>
  import TextSourcePreview from './TextSourcePreview.svelte'

  export let qdpxData

  function findDevlogForCommit(hashAbbrev) {
    let res = qdpxData.sources.filter((s) => s.hashAbbrev == hashAbbrev)[0]
    return res
  }

  async function exportQDPX(_event) {
    let qdpxExportOptions = {
      title: `Save QDPX file...`
    }
    await window.loader.exportQDPX(qdpxData, qdpxExportOptions)
  }
</script>

<div class="card rounded-0 m-1 flex-grow-1" class:text-bg-secondary={!qdpxData.commits.length > 0}>
  <div class="card-header d-flex flex-grow-0 align-items-end">
    <div class="mt-1">
      <h5>QDPX Preview</h5>
    </div>
    <div class="ms-auto">
      <button
        class="btn btn-primary"
        type="button"
        disabled={!qdpxData.commits.length > 0}
        on:click={exportQDPX}>Export QDPX</button
      >
    </div>
  </div>
  <div class="card-body flexOverflow overflow-y-auto">
    <div class="text-primary">
      <h3><i class="bi bi-archive"></i> Sources</h3>
      <ul class=" list-unstyled my-2">
        {#each qdpxData.sources as source}
          {#if source.parent == 'repository'}
            <li class="ms-2"><TextSourcePreview {source} /></li>
          {/if}
        {/each}
        {#if qdpxData.commits}
          {#each qdpxData.commits as commit (commit.hashAbbrev)}
            {#if findDevlogForCommit(commit.hashAbbrev) != null}
              <li><i class="bi bi-git"></i> #{commit.hashAbbrev}</li>
              <ul class="list-unstyled ps-1">
                {#each [findDevlogForCommit(commit.hashAbbrev)] as source}
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
  <!-- <div class="card-footer flex-grow-0 text-muted">Footer</div> -->
</div>
