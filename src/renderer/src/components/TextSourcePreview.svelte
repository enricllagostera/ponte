<script>
  export let source
</script>

<details>
  <summary class="fs-5"
    >{#if source.parent == 'repository'}
      <i class="bi bi-journals"></i>
    {:else if source.parent == 'compilationSource'}
      <i class="bi bi-folder"></i>
    {:else if source.parent == 'copyTextSource'}
      <i class="bi bi-file-text"></i>
    {/if}
    {source.name}</summary
  >
  <pre
    class="bg-primary-subtle text-body overflow-y border border-primary p-3 rounded-0">{source.content}</pre>
</details>

<style>
  pre {
    max-height: 20rem;
    width: 30rem;
    white-space: pre-wrap;
  }
</style>
