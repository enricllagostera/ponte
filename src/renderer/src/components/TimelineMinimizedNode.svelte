<script>
  import { tweened } from 'svelte/motion'
  import CommitPillButton from './CommitPillButton.svelte'

  export let visualCommit
  export let commitData
  export let zoomLevel
  export let isCurrentCommit
  export let thisElement
  export let hoverHandler
  export let visualBox

  let { x, y, w } = visualCommit
  let h = 0
  visualBox = tweened({ x, y, h, w }, { duration: 200 })

  $: {
    x = visualCommit.x
    y = visualCommit.y
    h = $visualBox.h
    w = visualCommit.w
    visualBox.set({ x, y, w, h })
  }
</script>

<div
  class="group absolute z-[3] h-auto items-center overflow-hidden bg-neutral-300 text-base shadow-lg hover:border-c-black hover:bg-app {isCurrentCommit
    ? ' border-2 bg-c-white ring-4 ring-app'
    : ' border-2 border-c-black bg-c-white'}"
  bind:this={thisElement}
  bind:clientHeight={$visualBox.h}
  id="timeline_{commitData.hashAbbrev}"
  style:left="{$visualBox.x}px"
  style:top="{$visualBox.y}px"
  style:width="{$visualBox.w}px"
  class:text-base={zoomLevel == 'medium'}
  class:text-sm={zoomLevel == 'small'}
  class:text-xs={zoomLevel == 'tiny'}
  on:pointerenter={() => hoverHandler(commitData.hash)}
  on:pointerleave={() => hoverHandler('')}>
  <div class="relative flex flex-col">
    <p class="m-2 line-clamp-3 font-semibold" class:line-clamp-2={zoomLevel == 'tiny'}>
      {commitData.subject}
    </p>
    <div class="flex w-full flex-row place-items-end bg-[#ddd] py-1">
      <CommitPillButton
        smallIcons={zoomLevel < 0.7}
        class="w-full px-2 {zoomLevel == 'small' ? 'text-sm' : zoomLevel == 'tiny' ? 'text-xs' : 'text-base'}"
        forceDarkTheme={true}
        hashAbbrev={commitData.hashAbbrev}
        clickable={false} />
    </div>
  </div>
</div>
