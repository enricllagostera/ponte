<script lang="ts">
  import * as d3 from 'd3'
  import { appStates, repo } from '../stores'
  import CommitPillButton from './CommitPillButton.svelte'
  import { DateTime } from 'luxon'

  import Button from './Button.svelte'
  import {
    ArrowLeft,
    ArrowLeftToLine,
    ArrowRight,
    ArrowRightToLine,
    Calendar,
    Minus,
    PlusIcon,
    Target
  } from 'lucide-svelte'

  import FileChangesDrawer from './FileChangesDrawer.svelte'
  import LineChangesDrawer from './LineChangesDrawer.svelte'

  let scaleX = undefined
  let timeExtent
  let fileChangesExtents
  let lineChangesExtents
  let gx, dates
  let rangeWidth = 3000
  let baseZoom = 50
  let zoomMultiplier = 1

  let commitsShownPerBand = new Map()
  let maxBand = 0
  let currentHover = ''
  let commitHeight = 0
  let currentCommitIndex = 0
  let baseCommitTileWidth = 230
  let commitsVisual = new Map()
  let scalingFactor = 1

  const link = d3.link(d3.curveBumpX)

  commitsVisual = new Map()
  const commitsCopy = [...$repo.commits]
  commitsCopy.reverse().forEach((c) => {
    commitsVisual.set(c.hash, { ...c, x: 0, y: 0, band: 0 })
  })
  dates = $repo.commits.map((c) => c.committer.timestamp)
  fileChangesExtents = {}
  fileChangesExtents.additions = d3.extent(
    $repo.commits.map((c) => c.fileChangeStats.filter((f) => f.operation == 'A').length)
  )
  fileChangesExtents.modifications = d3.extent(
    $repo.commits.map((c) => c.fileChangeStats.filter((f) => f.operation == 'M').length)
  )
  fileChangesExtents.deletions = d3.extent(
    $repo.commits.map((c) => c.fileChangeStats.filter((f) => f.operation == 'D').length)
  )
  lineChangesExtents = {}
  lineChangesExtents.added_lines = d3.extent(
    $repo.commits.map((c) =>
      c.lineChangeStats.reduce(
        (acc, f) => acc + Number(f.is_binary || f.is_empty ? 0 : f.added_lines),
        0
      )
    )
  )
  lineChangesExtents.deleted_lines = d3.extent(
    $repo.commits.map((c) =>
      c.lineChangeStats.reduce(
        (acc, f) => acc + Number(f.is_binary || f.is_empty ? 0 : f.deleted_lines),
        0
      )
    )
  )

  timeExtent = d3.extent(dates)

  $: {
    if ($appStates.repoReady) {
      rangeWidth = d3.timeDay.count(timeExtent[0], timeExtent[1]) * (baseZoom * zoomMultiplier)
      scaleX = d3.scaleTime(timeExtent, [0, rangeWidth]).nice(d3.timeDay.every(7))
      d3.select(gx)
        .call(
          d3
            .axisTop()
            .scale(scaleX)
            .ticks(d3.timeDay.every(7))
            .tickSize(20)
            .tickFormat(d3.timeFormat('%Y-%m-%d'))
        )
        .selectAll('text')
        .style('text-anchor', 'start')
        .attr('dx', '4px')
        .attr('dy', '4px')
        .attr('transform', 'rotate(-45)')
    }
    calcCommitPositions()
  }

  function getLinkFor(sourceHash: string, targetHash: string, xOffset = 0, yOffset = 0) {
    if (commitsVisual.get(targetHash) == undefined) {
      console.log('invalid target')
      return link({
        source: [
          commitsVisual.get(sourceHash).x + xOffset,
          commitsVisual.get(sourceHash).y + yOffset
        ],
        target: [
          commitsVisual.get(sourceHash).x + xOffset,
          commitsVisual.get(sourceHash).y + yOffset
        ]
      })
      return
    }
    //console.log('getting link')
    return link({
      source: [
        commitsVisual.get(sourceHash).x + xOffset,
        commitsVisual.get(sourceHash).y + yOffset
      ],
      target: [commitsVisual.get(targetHash).x + xOffset, commitsVisual.get(targetHash).y + yOffset]
    })
  }

  function calcCommitPositions(): void {
    maxBand = 0
    commitsShownPerBand = new Map()
    let positionsCalculated = 0
    let curr = 0
    for (const cv of commitsVisual) {
      const commit = cv[1]
      curr++
      let thisX = scaleX(new Date(commit.committer.timestamp))
      if (commitsShownPerBand.size == 0) {
        maxBand = 0
        commitsShownPerBand.set(0, { x: thisX, y: getCommitY(0), band: 0 })
        commit.x = thisX
        commit.y = getCommitY(0)
        commit.band = 0
        positionsCalculated++
        continue
      }

      let candidate = { x: thisX, y: 0, band: 0 }
      for (let b = 0; b < commitsShownPerBand.size; b++) {
        const lastCommitInBand = commitsShownPerBand.get(b)
        candidate.band = b
        if (lastCommitInBand.x + baseCommitTileWidth * scalingFactor < candidate.x) {
          candidate.y = getCommitY(candidate.band)
          commitsShownPerBand.set(b, { ...candidate })
          commit.x = candidate.x
          commit.y = candidate.y
          commit.band = candidate.band
          positionsCalculated++
          break
        }
      }
      // already calculated this position
      if (positionsCalculated >= curr) {
        continue
      }
      maxBand += 1
      candidate.band = maxBand
      candidate.y = getCommitY(candidate.band)
      commitsShownPerBand.set(candidate.band, { ...candidate })
      commit.x = candidate.x
      commit.y = candidate.y
      commit.band = candidate.band
      positionsCalculated++
    }
  }

  function getCommitY(band): number {
    // return 160 + band * ((commitHeight == 0 ? 160 : commitHeight) + 50)
    return 160 + band * (280 + 50) * scalingFactor
  }

  function scrollToIndex(index: number): void {
    const commits = [...$repo.commits].reverse()
    document
      .querySelector(`#timeline_${commits[index].hashAbbrev}`)
      .scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }
</script>

<div class="fixed left-4 top-auto z-10 -m-2 bg-c-white p-4">
  <Button
    class="h-8 w-8 justify-center"
    on:click={() => {
      zoomMultiplier *= 1.5
      if (zoomMultiplier >= 1.0) {
        scalingFactor = 1.0 < zoomMultiplier ? 1.0 : zoomMultiplier
      }
      console.log(zoomMultiplier, scalingFactor)
    }}><PlusIcon /></Button>
  <Button
    class=" h-8 w-8 justify-center"
    on:click={() => {
      zoomMultiplier *= 0.5
      if (zoomMultiplier <= 1.0) {
        scalingFactor = 0.6 > zoomMultiplier ? 0.6 : zoomMultiplier
      }
      console.log(zoomMultiplier, scalingFactor)
    }}><Minus /></Button>
  <Button
    class=" h-8 w-8 justify-center"
    on:click={() => {
      currentCommitIndex = 0
      scrollToIndex(currentCommitIndex)
    }}><ArrowLeftToLine /></Button>
  <Button
    class=" h-8 w-8 justify-center"
    on:click={() => {
      currentCommitIndex -= 1
      if (currentCommitIndex < 0) {
        currentCommitIndex = 0
      }
      scrollToIndex(currentCommitIndex)
    }}><ArrowLeft /></Button>
  <Button
    class=" h-8 w-8 justify-center"
    on:click={() => {
      scrollToIndex(currentCommitIndex)
    }}><Target /></Button>
  <Button
    class=" h-8 w-8 justify-center"
    on:click={() => {
      currentCommitIndex += 1
      if (currentCommitIndex > $repo.commits.length - 1) {
        currentCommitIndex = $repo.commits.length - 1
      }
      scrollToIndex(currentCommitIndex)
    }}><ArrowRight /></Button>
  <Button
    class=" h-8 w-8 justify-center"
    on:click={() => {
      currentCommitIndex = $repo.commits.length - 1
      scrollToIndex(currentCommitIndex)
    }}><ArrowRightToLine /></Button>
</div>
<div class="relative h-full font-mono text-sm" style:height="{getCommitY(maxBand + 1)}px">
  <div class="absolute top-0">
    {#key rangeWidth}
      <svg
        id="topAxis"
        width={rangeWidth}
        height="{getCommitY(maxBand + 1)}px"
        class="absolute fill-c-black stroke-c-black"
        transform="translate(0, 0)">
        {#each commitsVisual as [hash, commit] (hash)}
          {#if commit.parents == ''}
            <circle cx={commit.x + 75} cy={commit.y} r="10" fill={'black'} stroke="transparent" />
          {:else}
            {#each commit.parents.split(' ') as child}
              {#each commit.branches.reverse() as branch, i}
                <path
                  d={getLinkFor(commit.hash, child, 75)}
                  fill="transparent"
                  stroke={'#888'}
                  stroke-width="4px"></path>
                <circle
                  cx={commit.x + 75}
                  cy={commit.y}
                  r="10"
                  fill={'black'}
                  stroke="transparent" />
              {/each}
            {/each}
          {/if}
          <line
            x1={commit.x}
            y1={0}
            x2={commit.x}
            y2="{getCommitY(maxBand + 1)}px"
            style:stroke-width={currentHover == commit.hash ? 4 : 1}
            style:stroke={currentHover == commit.hash ? '#101010' : '#ccc'}
            style:z-index={currentHover == commit.hash ? '10' : '0'}
            transform="translate(0, 0)" />
        {/each}
        <g
          bind:this={gx}
          class="text-xs"
          transform="translate(0, {$appStates.mainViewScroll + 130})"></g>
      </svg>
    {/key}
  </div>
  <div class="absolute block h-full" id="commitTLView">
    {#if $appStates.repoReady}
      {#key rangeWidth}
        {#each commitsVisual as [hash, commit], i (hash)}
          <div
            class="group absolute block h-fit w-56 items-center bg-c-white pt-2 text-sm shadow-lg hover:border-c-black hover:bg-app {currentCommitIndex ==
            i
              ? 'z-10 border-y-8 border-c-black bg-c-white'
              : 'z-0 border-y-2 border-c-black bg-c-white'}"
            bind:clientHeight={commitHeight}
            id="timeline_{commit.hashAbbrev}"
            style:left="{commit.x}px"
            style:top="{getCommitY(commit.band)}px"
            style="transform: scale({scalingFactor}, {scalingFactor}); transform-origin: top left;"
            on:pointerenter={() => (currentHover = commit.hash)}
            on:pointerleave={() => (currentHover = '')}>
            <CommitPillButton
              class="absolute -top-5 left-14"
              forceDarkTheme={true}
              hashAbbrev={commit.hashAbbrev}
              clickable={false} />
            <div class="relative p-0">
              <div class="my-2 flex items-center">
                <p class="ms-2 w-fit">
                  <Calendar class="mb-1 inline-block h-4 w-4 text-xs" />
                  {DateTime.fromMillis(commit.author.timestamp).toFormat('yyyy-MM-dd, HH:mm')}
                </p>
                <Button
                  class="me-2 ms-auto"
                  on:click={() => {
                    currentCommitIndex = i
                    scrollToIndex(currentCommitIndex)
                  }}><Target class="h-3 w-3" /></Button>
              </div>
              <!-- <div class="flex w-full items-center">
                
              </div> -->

              <p class="m-2 mb-4 line-clamp-3 text-sm">{commit.subject}</p>
              <FileChangesDrawer {commit} {fileChangesExtents} />
              <LineChangesDrawer {commit} {lineChangesExtents} />
            </div>
          </div>
        {/each}
      {/key}
    {:else}
      Waiting for repo data.
    {/if}
  </div>
</div>
