<script lang="ts">
  import * as d3 from 'd3'

  export let visualCommitSource
  export let sourceBox
  export let targetBox

  let s
  let t

  let path

  $: {
    s = $sourceBox
    t = $targetBox
    path = getLinkPath()
  }

  const linkHor = d3.link(d3.curveBumpX)
  const linkVer = d3.link(d3.curveStep)

  function getLinkPath() {
    if (visualCommitSource.band == 0) {
      return linkHor({
        source: [s.x, s.y + s.h * 0.5],
        target: [t.x + t.w, t.y + t.h * 0.5]
      })
    }

    return linkVer({
      source: [s.x + s.w * 0.5, s.y + s.h * 0.5],
      target: [t.x + t.w * 0.5, t.y + t.h * 0.5]
    })
  }
</script>

{#key path}
  <path d={path} fill="transparent" stroke={'#aaa'} stroke-width="3px"></path>
{/key}
