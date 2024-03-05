<script>
  import { slide } from 'svelte/transition'
  export let node
  export let index

  let showChildren = false
</script>

<div class="node items-start">
  <div
    class="flex items-start border-l-2 border-app"
    on:click={() => {
      showChildren = !showChildren
    }}>
    {#if node.children}
      <div
        class="ms-0 h-6 w-6 -rotate-90 text-app transition-transform"
        class:active={showChildren}>
        <svg focusable="false" viewBox="0 0 24 24">
          <path
            d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
            stroke="currentColor"
            fill="currentColor" />
        </svg>
      </div>
    {:else}
      <div class="w-2" />
    {/if}
    <slot {node} />
  </div>
  {#if node.children && showChildren}
    <div
      class="me-2 border-l-2 border-f-grey-100 ps-[0.65rem]"
      transition:slide|local={{ duration: 150 }}>
      {#each node.children as _node, i}
        <svelte:self node={_node} index={i} let:node>
          <slot {node} />
        </svelte:self>
      {/each}
    </div>
  {/if}
</div>

<style>
  .active {
    transform: rotate(0deg);
  }
</style>
