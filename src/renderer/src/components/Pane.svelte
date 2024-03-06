<script lang="ts">
  export let title: string = ''
  export let id: string = ''
  export let successClass: boolean = false
</script>

<!-- Panel -->
<div class="flex flex-none flex-col {$$restProps.class || ''}" class:text-bg-success={successClass}>
  <div
    class="flex h-fit w-full grow-0 flex-row items-center bg-neutral-200 px-4 py-2 font-bold dark:bg-neutral-800">
    {#if title != ''}
      {title}
    {:else}
      <slot name="header" />
    {/if}
  </div>
  <div class="flex w-full overflow-scroll px-4 pt-2 scrollbar-thin" {id}>
    <slot name="body" />
  </div>
  {#if $$slots.footer}
    <div class="flex h-auto w-full grow-0 px-4 pt-2">
      <slot name="footer" />
    </div>
  {/if}
</div>
