<script>
  export let qdpxData
</script>

<h2>QDPX Preview</h2>

{#if qdpxData.commits}
  {#each qdpxData.commits as commit (commit.hashAbbrev)}
    <p><i class="bi bi-git"></i> {commit.hashAbbrev}</p>
  {/each}
{/if}

<style>
</style>
