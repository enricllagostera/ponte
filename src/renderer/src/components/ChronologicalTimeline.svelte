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
    Play,
    PlusIcon,
    Target,
    FileDiff,
    Diff
  } from 'lucide-svelte'
  import FileChangesDrawer from './FileChangesDrawer.svelte'
  import LineChangesDrawer from './LineChangesDrawer.svelte'
  import Toggle from './Toggle.svelte'

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

  let toggleFileChangeDrawer = false
  let toggleLineChangeDrawer = false

  const link = d3.link(d3.curveBumpX)

  commitsVisual = new Map()
  const commitsCopy = [...$repo.commits]
  commitsCopy.reverse().forEach((c) => {
    commitsVisual.set(c.hash, { ...c, x: 0, y: 0, band: 0 })
  })
  let domCommits = [...commitsVisual.values()].map((i) => i.hash + '')
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
      scaleX = d3.scaleTime(timeExtent, [0, rangeWidth]).nice(d3.timeDay.every(15))
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
    const someNumber = rangeWidth
    rangeWidth = toggleFileChangeDrawer ? rangeWidth : rangeWidth
    rangeWidth = toggleLineChangeDrawer ? rangeWidth : rangeWidth
    console.log(someNumber)
  }

  function getLinkFor(
    sourceHash: string,
    targetHash: string,
    xOffsetOrigin = 0,
    yOffsetOrigin = 0,
    xOffsetDest = 0,
    yOffsetDest = 0
  ) {
    if (commitsVisual.get(targetHash) == undefined) {
      // console.log('invalid target')
      return link({
        source: [
          commitsVisual.get(sourceHash).x + xOffsetOrigin,
          commitsVisual.get(sourceHash).y + yOffsetOrigin
        ],
        target: [
          commitsVisual.get(sourceHash).x + xOffsetOrigin,
          commitsVisual.get(sourceHash).y + yOffsetOrigin
        ]
      })
    }
    return link({
      source: [
        commitsVisual.get(sourceHash).x + xOffsetOrigin,
        commitsVisual.get(sourceHash).y + yOffsetOrigin
      ],
      target: [
        commitsVisual.get(targetHash).x + xOffsetDest,
        commitsVisual.get(targetHash).y + yOffsetDest
      ]
    })
  }

  function calcCommitPositions(): void {
    maxBand = 0
    commitsShownPerBand = new Map()
    let positionsCalculated = 0
    let curr = 0
    let lastBand = 0
    for (const cv of commitsVisual) {
      const commit = cv[1]
      curr++
      let thisX = scaleX(new Date(commit.committer.timestamp))
      let candidate = { x: thisX, y: 0, band: lastBand }

      // no bands yet
      if (commitsShownPerBand.size == 0) {
        maxBand = 0
        commitsShownPerBand.set(0, { x: thisX, y: getCommitY(0), band: 0 })
        commit.x = thisX
        commit.y = getCommitY(0)
        commit.band = 0
        positionsCalculated++
        continue
      }

      for (let b = lastBand - 1; b >= 0 && b > lastBand - 2; b--) {
        const lastCommitInBand = commitsShownPerBand.get(b)
        candidate.band = b
        thisX = lastCommitInBand.x + baseCommitTileWidth
        if (thisX < candidate.x) {
          candidate.y = getCommitY(candidate.band)
          commitsShownPerBand.set(b, { ...candidate })
          commit.x = candidate.x
          commit.y = candidate.y
          commit.band = candidate.band
          lastBand = candidate.band
          positionsCalculated++
          break
        }
      }
      // already calculated this position
      if (positionsCalculated >= curr) {
        continue
      }

      for (let b = 0; b < commitsShownPerBand.size; b++) {
        const lastCommitInBand = commitsShownPerBand.get(b)
        candidate.band = b
        thisX = lastCommitInBand.x + baseCommitTileWidth
        if (thisX < candidate.x) {
          candidate.y = getCommitY(candidate.band)
          commitsShownPerBand.set(b, { ...candidate })
          commit.x = candidate.x
          commit.y = candidate.y
          commit.band = candidate.band
          lastBand = candidate.band
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
      lastBand = candidate.band
      positionsCalculated++
    }
  }

  function getCommitY(band): number {
    // return 160 + band * ((commitHeight == 0 ? 160 : commitHeight) + 50)
    return (
      180 * band +
      120 +
      (toggleFileChangeDrawer && band > 0 ? 100 * band : 0) +
      (toggleLineChangeDrawer && band > 0 ? 100 * band : 0)
    )
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
      zoomMultiplier *= 1.25
      if (zoomMultiplier >= 1.0) {
        scalingFactor = 1.0 < zoomMultiplier ? 1.0 : zoomMultiplier
      }
      console.log(zoomMultiplier, scalingFactor)
    }}><PlusIcon /></Button>
  <Button
    class=" h-8 w-8 justify-center"
    on:click={() => {
      zoomMultiplier *= 0.75
      if (zoomMultiplier <= 1.0) {
        scalingFactor = 0.7 > zoomMultiplier ? 0.7 : zoomMultiplier
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
  <Toggle class="h-8" name="File changes" bind:value={toggleFileChangeDrawer}
    ><FileDiff /> File changes</Toggle>
  <Toggle class="h-8" name="Line changes" bind:value={toggleLineChangeDrawer}
    ><Diff /> Line changes</Toggle>
</div>
<!-- style:height="{getCommitY(maxBand + 1)}px" -->
<div
  class="relative h-full font-mono text-sm"
  id="timeline_box"
  style="transform: scale({scalingFactor}, {scalingFactor}); transform-origin: top left;">
  {#key rangeWidth}
    <div class="absolute top-0">
      <svg
        id="topAxis"
        width={rangeWidth}
        height="{getCommitY(maxBand + 1)}px"
        class="absolute fill-c-black stroke-c-black"
        transform="translate(0, 0)">
        {#each commitsVisual as [hash, commit], i (hash)}
          {#if commit.parents == ''}
            <circle
              cx={commit.x + commit.w}
              cy={getCommitY(commit.band) + commit.h}
              r="10"
              fill={'black'}
              stroke="transparent" />
          {:else}
            {#each commit.parents.split(' ') as child}
              {#each commit.branches as br}
                <path
                  d={getLinkFor(commit.hash, child, 0, 0, commit.w, commitsVisual.get(child).h)}
                  fill="transparent"
                  stroke={currentCommitIndex == i || currentCommitIndex == i - 1
                    ? '#13d44e'
                    : `#999`}
                  stroke-width="{currentCommitIndex == i || currentCommitIndex == i - 1 ? 8 : 3}px"
                ></path>
                <circle
                  cx={commit.x + commit.w}
                  cy={getCommitY(commit.band) + commit.h}
                  r="10"
                  fill={`#999`}
                  stroke="transparent" />
                <circle
                  cx={commit.x}
                  cy={getCommitY(commit.band)}
                  r="10"
                  fill={`#999`}
                  stroke="transparent" />
              {/each}
            {/each}
          {/if}
          <line
            x1={commit.x}
            y1={0}
            x2={commit.x}
            y2="{getCommitY(maxBand + 1)}px"
            style:stroke-width={currentHover == commit.hash || currentCommitIndex == i ? 4 : 1}
            style:stroke={currentHover == commit.hash || currentCommitIndex == i
              ? '#101010'
              : '#ccc'}
            style:z-index={currentHover == commit.hash || currentCommitIndex == i ? '10' : '0'}
            transform="translate(0, 0)" />
        {/each}
        <g
          bind:this={gx}
          class="text-xs"
          transform="translate(0, {$appStates.mainViewScroll + 130})"></g>
      </svg>
    </div>
  {/key}
  <div class="relative h-full gap-0" id="commitTLView">
    {#if $appStates.repoReady}
      {#key rangeWidth}
        {#each commitsVisual as [hash, commit], i (hash)}
          <div
            class="group absolute h-fit w-56 items-center bg-c-white pt-3 text-sm shadow-lg hover:border-c-black hover:bg-app {currentCommitIndex ==
            i
              ? 'z-10 border-2 bg-c-white ring-4 ring-app'
              : 'z-0 border-2 border-c-black bg-c-white'}"
            bind:this={domCommits[i]}
            bind:clientHeight={commit.h}
            bind:clientWidth={commit.w}
            id="timeline_{commit.hashAbbrev}"
            style:left="{commit.x}px"
            style:top="{getCommitY(commit.band)}px"
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
                <Button
                  class="me-2 ms-auto"
                  on:click={() => {
                    currentCommitIndex = i
                    scrollToIndex(currentCommitIndex)
                  }}><Play class="h-3 w-3" /></Button>
              </div>
              <p class="m-2 mb-4 line-clamp-3 text-sm">{commit.subject}</p>
              {#if toggleFileChangeDrawer}
                <FileChangesDrawer {commit} {fileChangesExtents} />
              {/if}
              {#if toggleLineChangeDrawer}
                <LineChangesDrawer {commit} {lineChangesExtents} />
              {/if}
            </div>
          </div>
        {/each}
      {/key}
    {:else}
      Waiting for repo data.
    {/if}
  </div>
</div>
