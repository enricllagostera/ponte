<script>
  export let qdpxData

  function findDevlogForCommit(hashAbbrev) {
    let res = qdpxData.sources.filter((s) => s.hashAbbrev == hashAbbrev)[0]
    return res
  }
</script>

<h2>QDPX Preview</h2>

<div class="text-primary">
  <h3>Sources</h3>
  <ul>
    {#each qdpxData.sources as source}
      {#if source.parent == 'repository'}
        <li>
          <details>
            <summary><i class="bi bi-file-earmark-text"></i> {source.name}</summary>
            <pre
              style="max-height: 200px"
              class="bg-primary-subtle text-body">{source.content}</pre>
          </details>
        </li>
      {/if}
    {/each}
    {#if qdpxData.commits}
      {#each qdpxData.commits as commit (commit.hashAbbrev)}
        {#if findDevlogForCommit(commit.hashAbbrev) != null}
          <li><i class="bi bi-git"></i> #{commit.hashAbbrev}</li>
          <ul>
            {#each [findDevlogForCommit(commit.hashAbbrev)] as devlog}
              <li>
                <details>
                  <summary><i class="bi bi-file-earmark-text"></i> {devlog.name}</summary>
                  <pre style="max-height: 200px">{devlog.content}</pre>
                </details>
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    {/if}
  </ul>
</div>

<style>
</style>
