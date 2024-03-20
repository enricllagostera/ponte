<script>
  export let source
</script>

<details>
  <summary
    >{#if source.parent == 'repository'}
      <i class="bi bi-journals"></i>
    {:else if source.parent == 'compilationSource'}
      <i class="bi bi-folder"></i>
    {:else if source.parent == 'copyTextSource'}
      <i class="bi bi-file-text"></i>
    {/if}
    {source.name}</summary>
  <pre class="overflow-auto border-1 max-h-48 h-100 w-100 whitespace-pre-wrap p-2 text-sm">{source.content}</pre>
</details>
