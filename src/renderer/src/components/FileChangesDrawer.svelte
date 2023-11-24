<script lang="ts">
  import * as d3 from 'd3'
  import type { Commit } from '../../../types'

  export let commit: Commit
  export let fileChangesExtents

  let height = 48
  let width = 200
  $: {
    width
  }
  // let additionsScale = d3.scaleLinear(fileChangesExtents.additions, [0, width])
  // let modificationsScale = d3.scaleLinear(fileChangesExtents.modifications, [0, width])
  // let deletionsScale = d3.scaleLinear(fileChangesExtents.deletions, [0, width])

  // console.log(commit.hashAbbrev, commit.fileChangeStats)
  let modCount = commit.fileChangeStats.filter(
    (st) =>
      st.operation.startsWith('M') ||
      st.operation.startsWith('R') ||
      st.operation.startsWith('C') ||
      st.operation.startsWith('T')
  ).length
  let ratioAdd =
    commit.fileChangeStats.filter((st) => st.operation.startsWith('A')).length /
    commit.fileChangeStats.length
  let ratioMod =
    commit.fileChangeStats.filter(
      (st) =>
        st.operation.startsWith('M') ||
        st.operation.startsWith('R') ||
        st.operation.startsWith('C') ||
        st.operation.startsWith('T')
    ).length / commit.fileChangeStats.length
  let ratioDel =
    commit.fileChangeStats.filter(
      (st) => st.operation.startsWith('D') || st.operation.startsWith('X')
    ).length / commit.fileChangeStats.length
</script>

<div
  class="relative block h-fit w-full border-t-2 border-t-f-grey-100 bg-c-white font-mono font-normal text-c-black"
  bind:clientWidth={width}>
  <div class="p-1 text-center font-bold">Files diff: {commit.fileChangeStats.length}</div>
  <svg {width} {height}>
    <rect x="0" y="0" {width} height={height / 3}></rect>
    <rect x={0} width={width * ratioAdd + 1} y={0} {height} class="fill-yellow"></rect>
    <rect x={width * ratioAdd} width={width * ratioMod + 1} y={0} {height} class="fill-blue"></rect>
    <rect
      x={width * (ratioAdd + ratioMod)}
      width={width * ratioDel + 1}
      y={0}
      {height}
      class="fill-orange"></rect>
    <text
      x={width / 2}
      y={height * 0.25 - 3}
      text-anchor="middle"
      dominant-baseline="middle"
      class="fill-c-white"
      >Additions: {commit.fileChangeStats.filter((st) => st.operation == 'A').length}</text>
    <text
      x={width / 2}
      dy={height * 0.5 + 1}
      text-anchor="middle"
      dominant-baseline="middle"
      class="fill-c-white">Mods or renamed: {modCount}</text>
    <text
      x={width / 2}
      dy={height * 0.75 + 4}
      text-anchor="middle"
      dominant-baseline="middle"
      class="fill-c-white"
      >Deletions: {commit.fileChangeStats.filter((st) => st.operation == 'D').length}</text>
  </svg>
</div>
