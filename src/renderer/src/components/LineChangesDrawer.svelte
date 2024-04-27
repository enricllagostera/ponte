<script lang="ts">
  import * as d3 from 'd3'
  import type { Commit } from '../../../types'
  import { repo } from '../stores/stores'

  export let commit: Commit
  export let lineChangesExtents

  let height = 48
  let width = 200
  $: {
    width
  }

  const allCommitsAdded = $repo.commits.map((c) =>
    c.lineChangeStats.reduce((acc, val) => acc + (val.is_binary ? 0 : Number(val.added_lines)), 0)
  )

  const allCommitsDeleted = $repo.commits.map((c) =>
    c.lineChangeStats.reduce((acc, val) => acc + (val.is_binary ? 0 : Number(val.deleted_lines)), 0)
  )

  const sumAdded = commit.lineChangeStats.reduce((acc, val) => acc + (val.is_binary ? 0 : Number(val.added_lines)), 0)
  const sumDeleted = commit.lineChangeStats.reduce(
    (acc, val) => acc + (val.is_binary ? 0 : Number(val.deleted_lines)),
    0
  )
  const ratioAdded = sumAdded / (sumAdded + sumDeleted)

  const quantileScaleAdded = d3.scaleQuantile(allCommitsAdded, [1, 2, 3, 4, 5])
  const quantileScaleDeleted = d3.scaleQuantile(allCommitsDeleted, [1, 2, 3, 4, 5])

  function getDescriptorAdded(sumAdded: Number) {
    switch (quantileScaleAdded(sumAdded)) {
      case 5:
        return 'Top 20%'

      case 4:
        return 'Top 40%'
      case 3:
        return 'Median'

      case 2:
        return 'Bottom 40%'

      case 1:
        return 'Bottom 20%'

      default:
        break
    }
  }

  function getDescriptorDeleted(sum: Number) {
    switch (quantileScaleDeleted(sum)) {
      case 5:
        return 'Top 20%'

      case 4:
        return 'Top 40%'
      case 3:
        return 'Median'

      case 2:
        return 'Bottom 40%'

      case 1:
        return 'Bottom 20%'

      default:
        break
    }
  }
</script>

<div
  class="relative block h-fit w-full border-t-2 border-t-f-grey-100 bg-c-white font-mono font-normal text-c-black"
  bind:clientWidth={width}>
  <div class="p-1 text-center font-bold">Lines diff: +{sumAdded}/-{sumDeleted}</div>
  <svg {width} {height}>
    <rect x={0} y={0} {width} {height} class="fill-c-black"></rect>
    <rect x={0} width={ratioAdded * width} y={0} height={height / 3} class="fill-green-light"></rect>
    <rect x={ratioAdded * width} width={(1 - ratioAdded) * width} y={0} height={height / 3} class="fill-red-light"
    ></rect>
    {#each { length: quantileScaleAdded(sumAdded) } as _, i}
      <rect x={3 + (i * width) / 5} y={height * 0.38} width={width / 5 - 6} height={height / 3 - 2} class="fill-green"
      ></rect>
    {/each}
    {#each { length: quantileScaleDeleted(sumDeleted) } as _, i}
      <rect x={3 + (i * width) / 5} y={height * 0.72} width={width / 5 - 6} height={height / 3 - 2} class="fill-red"
      ></rect>
    {/each}
    <text x={width / 2} dy={height * 0.21} text-anchor="middle" dominant-baseline="middle" class="fill-c-white"
      >Ratio</text>
    <text x={width / 2} dy={height * 0.55} text-anchor="middle" dominant-baseline="middle" class="fill-c-white"
      >Additions: {getDescriptorAdded(sumAdded)}</text>
    <text x={width / 2} dy={height * 0.86} text-anchor="middle" dominant-baseline="middle" class="fill-c-white"
      >Deletions: {getDescriptorDeleted(sumDeleted)}</text>
  </svg>
</div>
