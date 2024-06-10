<script>
  import { tweened } from 'svelte/motion'
  import CommitPillButton from './CommitPillButton.svelte'
  import { writable } from 'svelte/store'
  import { appStates } from '../stores/stores'

  export let visualCommit
  export let commitData
  export let zoomLevel
  export let isCurrentCommit
  export let hoverHandler
  export let handleHeightChanged
  export let parentBox
  export let parentLeft
  export let parentWidth
  // OUTPUT
  export let contentHeight = 0
  export let calculatedY = 0
  export let visualBox = writable({ x: 0, y: 0, w: 0, h: 0 })

  let localCV = {}
  let autoHeight = 0
  let tweenBox = tweened({ x: 0, y: 0, w: 0, h: 0 }, { duration: 200 })
  let isActive = true

  $: {
    //console.log('VB: parent changed')
    let l = parentLeft
    if (parentBox != undefined) {
      // the randomness helps to mitigate the issue of too many nodes switching  on/off on the same frame, even if it might create some redundancies. this makes the scrolling smoother.
      isActive =
        $appStates.mainViewLeft - visualCommit.w - Math.random() * 10 <= visualCommit.x &&
        visualCommit.x <= $appStates.mainViewLeft + $appStates.mainViewWidth + visualCommit.w + Math.random() * 10
    }
  }

  $: {
    // console.log('VB: visualCommit changed')
    localCV = { ...visualCommit }
  }

  $: {
    //console.log('VB:Height changed')
    contentHeight = autoHeight
    handleHeightChanged(visualCommit, autoHeight)
  }

  $: {
    //console.log('VB:Updating tween target')
    tweenBox.set({ x: localCV.x, y: calculatedY, h: autoHeight, w: localCV.w })
  }

  $: {
    // console.log('VB:Tweening')
    $visualBox = $tweenBox
  }
</script>

{#if isActive}
  <div
    class="group absolute z-[3] h-fit items-center overflow-hidden text-base shadow-lg hover:border-c-black hover:bg-app {isCurrentCommit
      ? ' border-4 bg-c-white ring-4 ring-app'
      : ' border-2 border-c-black bg-c-white'}"
    bind:clientHeight={autoHeight}
    id="timeline_{commitData.hashAbbrev}"
    style:left="{$tweenBox.x}px"
    style:top="{$tweenBox.y}px"
    style:width="{$tweenBox.w}px"
    class:bg-neutral-400={!visualCommit.filtered}
    class:bg-app={visualCommit.filtered}
    class:text-base={zoomLevel == 'medium'}
    class:text-sm={zoomLevel == 'small'}
    class:text-xs={zoomLevel == 'tiny'}
    on:pointerenter={() => hoverHandler(commitData.hash)}
    on:pointerleave={() => hoverHandler('')}>
    <div class="relative flex flex-col">
      <!-- {$visualBox.h} - {$visualBox.y} -->
      <p
        class="mx-2 mb-1 mt-2 line-clamp-3 font-semibold"
        class:line-clamp-2={zoomLevel == 'tiny'}
        class:line-clamp-3={zoomLevel == 'small' || zoomLevel == 'medium'}>
        {commitData.subject}
      </p>
      {#if visualCommit.filtered}
        <slot />
      {/if}
      <div class="flex w-full flex-row place-items-end py-1">
        <CommitPillButton
          class="w-full bg-transparent px-2"
          {zoomLevel}
          forceDarkTheme={true}
          hashAbbrev={commitData.hashAbbrev}
          clickable={false} />
      </div>
    </div>
  </div>
{:else}
  <div
    class="group absolute z-[3] h-24 items-center overflow-hidden text-base shadow-lg hover:border-c-black hover:bg-app"
    id="timeline_{commitData.hashAbbrev}"
    style:left="{visualCommit.x}px"
    style:top="{visualCommit.y}px"
    style:width="{visualCommit.w}px">
  </div>
{/if}
