<script lang="ts">
  export let title: string
  export let id: string = ''
  export let successClass: boolean = false
</script>

<!-- Panel -->
<div class="m-2 flex grow flex-col {$$restProps.class || ''}" class:text-bg-success={successClass}>
  <div class="flex w-full grow-0 bg-neutral-200 px-4 py-2 font-bold dark:bg-neutral-800">
    {title}
  </div>
  <div class="flex w-full shrink grow overflow-auto px-4 py-2 scrollbar-thin" {id}>
    <slot name="body" />
  </div>
  <div class="flex h-auto w-full grow-0 px-4 py-2">
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
