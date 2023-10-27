<script>
  import { slide } from 'svelte/transition'
  export let node
  export let index

  let showChildren = false
</script>

<div class="node items-start">
  <div
    class="flex items-start border-l-2 border-blue-500"
    on:click={() => {
      showChildren = !showChildren
    }}>
    {#if node.children}
      <div
        class="w-6 h-6 -rotate-90 transition-transform text-blue-500"
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
    <div class="ps-3 me-2 border-l-2 border-blue-500" transition:slide|local={{ duration: 150 }}>
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
  /* .node .content {
    display: flex;
    align-items: start;
    border-left: 3px rgba(39, 126, 232, 0.744) solid;
  }
  .node .content:hover {
    cursor: pointer;
  }
  .node .content .button {
    width: 20px;
    height: 20px;
    transform: rotate(-90deg);
    transition: transform 0.15s;
  }
  .node .content .button.active {
    transform: rotate(0deg);
  }
  .node .content .spacer {
    width: 20px;
    height: 20px;
  }
  .node .content .name {
    margin-left: 10px;
    font-size: 15px;
  }
  .children {
    padding-left: 20px;
    border-left: 3px rgba(39, 126, 232, 0.744) solid;
  } */
</style>
