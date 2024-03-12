<script lang="ts">
  import { createToggle } from '@melt-ui/svelte'
  import { CheckSquare, Square, ToggleLeft, ToggleRight } from 'lucide-svelte'

  export let value = false
  export let name = ''

  const {
    elements: { root },
    states: { pressed }
  } = createToggle()

  pressed.set(value)

  $: {
    value = $pressed
    //console.log('changed internal:', value)
  }
</script>

<button
  {...$root}
  use:root
  aria-label={name}
  class="active:hover:ring-0! inline-flex items-center border-2 border-c-black bg-transparent p-2 text-center text-base font-medium text-c-black ring-offset-2 ring-offset-c-white hover:bg-c-black hover:text-c-white focus:outline-none focus-visible:z-10 focus-visible:border-2 focus-visible:ring-2 focus-visible:ring-c-black active:border-app active:bg-app active:text-c-black active:focus-visible:border-app disabled:bg-f-grey-200 disabled:text-c-white dark:border-c-white dark:text-c-white dark:ring-offset-c-black dark:hover:bg-c-white dark:hover:text-c-black dark:focus-visible:ring-c-white dark:active:text-c-black {$$restProps.class}">
  {#if value}
    <CheckSquare class="me-2" />
  {:else}
    <Square class="me-2 " />
  {/if}
  <slot />
</button>
