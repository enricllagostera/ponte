<script lang="ts">
  export let title: string
  export let id: string = ''
  export let successClass: boolean = false
</script>

<!-- Panel -->
<div
  class="flex flex-col grow m-2 border-x-2 border-b-4 border-zinc-50 dark:border-zinc-900 {$$restProps.class ||
    ''}"
  class:text-bg-success={successClass}>
  <div class="flex grow-0 w-full font-bold px-4 py-2 bg-zinc-50 dark:bg-zinc-900">
    {title}
  </div>
  <div class="flex grow shrink w-full overflow-auto px-4 py-2 scrollbar-thin" {id}>
    <slot name="body" />
  </div>
  <div class="flex grow-0 w-full h-auto px-4 py-2">
    <slot name="footer" />
  </div>
</div>

<style>
  :global(.flexOverflow) {
    flex: 1 1 1px;
    min-width: 0;
    min-height: 0;
  }
</style>
