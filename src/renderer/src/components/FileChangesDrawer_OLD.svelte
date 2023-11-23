<script lang="ts">
  import type { Commit } from '../../../types'

  export let commit: Commit

  let height = 96
  let width = 200
</script>

<div class="relative block h-24 w-full">
  <svg {width} {height}>
    <circle
      cx={width * 0.25}
      cy={height / 2}
      stroke="white"
      fill={'green'}
      r={commit.fileChangeStats.filter((st) => st.operation == 'A').length * 4}></circle>
    <circle
      cx={width * 0.5}
      cy={height / 2}
      stroke="white"
      fill={'coral'}
      r={commit.fileChangeStats.filter((st) => st.operation == 'D').length * 4}></circle>
    <circle
      cx={width * 0.75}
      cy={height / 2}
      stroke="white"
      fill={'lightskyblue'}
      r={commit.fileChangeStats.filter((st) => st.operation == 'M').length * 4}></circle>
    <text x={20 - 10} y={23} fill="black" class="text-center font-bold"
      >A: {commit.fileChangeStats.filter((st) => st.operation == 'A').length}</text
    ><text x={100 - 10} y={23} fill="black" class="text-center font-bold"
      >D: {commit.fileChangeStats.filter((st) => st.operation == 'D').length}</text>
    <text x={60 - 10} y={23} fill="black" class="text-center font-bold"
      >M: {commit.fileChangeStats.filter((st) => st.operation == 'M').length}</text>
  </svg>
</div>
