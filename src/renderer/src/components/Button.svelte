<script>
  export let primary = false
</script>

{#if primary}
  <button
    on:click
    type="button"
    class="active:hover:ring-0! inline-flex items-center border-2 border-app bg-app p-2 text-center text-base font-medium text-c-black ring-offset-2 ring-offset-c-white hover:border-c-black hover:bg-c-black hover:text-c-white focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-c-black active:border-c-black active:bg-transparent active:text-c-black disabled:bg-f-grey-200 disabled:text-c-white dark:ring-offset-c-black dark:hover:border-c-white dark:hover:bg-c-white dark:hover:text-c-black dark:focus-visible:ring-c-white dark:active:border-c-white dark:active:bg-c-white dark:active:text-c-black {$$restProps.class}">
    <slot />
  </button>
{:else}
  <button
    on:click
    type="button"
    class="active:hover:ring-0! inline-flex items-center border-2 border-c-black bg-transparent p-2 text-center text-base font-medium text-c-black ring-offset-2 ring-offset-c-white hover:bg-c-black hover:text-c-white focus:outline-none focus-visible:z-10 focus-visible:border-2 focus-visible:ring-2 focus-visible:ring-c-black active:border-app active:bg-app active:text-c-black active:focus-visible:border-app disabled:bg-f-grey-200 disabled:text-c-white dark:border-c-white dark:text-c-white dark:ring-offset-c-black dark:hover:bg-c-white dark:hover:text-c-black dark:focus-visible:ring-c-white dark:active:text-c-black {$$restProps.class}">
    <slot />
  </button>
{/if}
