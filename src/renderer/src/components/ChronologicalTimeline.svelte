<script lang="ts">
  import * as d3 from 'd3'
  import { allDevlogs, appStates, repo } from '../stores/stores'
  import { allCodes, getCodeIdsInCommit } from '../stores/codes'
  import { DateTime } from 'luxon'

  import Button from './Button.svelte'
  import {
    ArrowLeft,
    ArrowLeftToLine,
    ArrowRight,
    ArrowRightToLine,
    Calendar,
    GitBranch,
    User,
    Tag,
    Play,
    X,
    Filter,
    Pin,
    Move,
    Save
  } from 'lucide-svelte'
  import FileChangesDrawer from './FileChangesDrawer.svelte'
  import LineChangesDrawer from './LineChangesDrawer.svelte'
  import ScaleSelect from './ScaleSelect.svelte'
  import TimelineZoomSelect from './TimelineZoomSelect.svelte'
  import InfoToggleBar from './InfoToggleBar.svelte'
  import GeneralToggle from './GeneralToggle.svelte'
  import TimelineNode from './TimelineNode.svelte'
  import type { VisualCommit } from '../../../types'
  import TimelineNodeLink from './TimelineNodeLink.svelte'
  import { onMount } from 'svelte'

  export let parentBox

  let scaleX = undefined
  let timeExtent
  let fileChangesExtents
  let lineChangesExtents
  let gx, dates
  let rangeWidth = 3000

  let maxBand = 0
  let currentHover = ''
  let currentCommitIndex = 0
  const baseTimeUnitWidth = 400
  const baseCommitWidthRatio = 0.9

  let scalingFactor = 1

  let timeSelected = ''
  let timeScale = null

  let nodeScale = 'medium%'
  let infoToggles = ['author', 'tags']

  let maxY = 0

  let visualCommits: VisualCommit[] = []
  let nodesHeight: number[] = []
  let nodesY: number[] = []
  let commitBoxes = []

  let filterKeyword = ''
  let toggleFullText = false
  let filteredCommitsCount = 0

  let menuOffsetY = 140
  let parentLeft = 0
  let parentWidth = 0

  let timelineContainer

  const reversedHashes = [...$repo.commits.map((c) => c.hash)].reverse()

  reversedHashes.forEach((c) => {
    visualCommits.push({
      commitHash: c,
      x: 0,
      y: 0,
      h: 100,
      w: baseTimeUnitWidth,
      filtered: true,
      band: 0,
      col: 0,
      autoHeight: 0
    })

    nodesHeight.push(0)
    nodesY.push(0)
  })

  dates = $repo.commits.map((c) => c.committer.timestamp) ?? []

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
      c.lineChangeStats.reduce((acc, f) => acc + Number(f.is_binary || f.is_empty ? 0 : f.added_lines), 0)
    )
  )
  lineChangesExtents.deleted_lines = d3.extent(
    $repo.commits.map((c) =>
      c.lineChangeStats.reduce((acc, f) => acc + Number(f.is_binary || f.is_empty ? 0 : f.deleted_lines), 0)
    )
  )

  timeExtent = d3.extent(dates)

  timeScale = d3.timeDay.every(1)
  rangeWidth = d3.timeDay.count(timeExtent[0], timeExtent[1]) * (baseTimeUnitWidth * scalingFactor)
  scaleX = d3.scaleTime(timeExtent, [0, rangeWidth]).nice(timeScale)

  function calcCommitPositions(): VisualCommit[] {
    console.log('RECALC')
    const referenceWidth = baseTimeUnitWidth * scalingFactor
    const commitWidth = referenceWidth * baseCommitWidthRatio
    maxBand = 0
    maxY = 0
    let lastBand = -1
    let lastX = 0
    let index = 0
    const localCVs = [...visualCommits]
    for (const cv of localCVs) {
      const commitData = $repo.commits.find((c) => c.hash == cv.commitHash)
      let thisX = scaleX(timeScale.floor(new Date(commitData.committer.timestamp)))
      if (thisX > lastX) {
        cv.x = thisX
        lastX = thisX
        lastBand = 0
        cv.band = lastBand
      } else {
        lastBand += 1
        cv.band = lastBand
        cv.x = thisX
        lastX = thisX
      }
      if (lastBand > maxBand) {
        maxBand = lastBand
      }
      cv.col = cv.x == 0 ? 0 : 1 + Math.floor(cv.x / referenceWidth)
      cv.w = commitWidth

      if (cv.band == 0) {
        nodesY[index] = 0 + menuOffsetY
      } else {
        let accumY = (nodesHeight[index - 1] ?? 0) + 35 * scalingFactor + nodesY[index - 1]
        nodesY[index] = accumY
      }
      if (nodesY[index] >= maxY) {
        maxY = nodesY[index]
      }
      index += 1
    }
    visualCommits = [...localCVs]
    return localCVs
  }

  function calcCommitHeights(): void {
    //console.log('RECALC HEIGHTS')
    maxBand = 0
    maxY = 0
    let index = 0
    for (const cv of visualCommits) {
      if (cv.band == 0) {
        nodesY[index] = 0 + menuOffsetY
      } else {
        let accumY = (nodesHeight[index - 1] ?? 0) + 35 * scalingFactor + nodesY[index - 1]
        nodesY[index] = accumY
      }
      if (nodesY[index] >= maxY) {
        maxY = nodesY[index]
      }
      index += 1
    }
  }

  function getVisualCommitByHash(hash): VisualCommit | undefined {
    const cv = visualCommits.find((c) => c.commitHash == hash)
    return cv
  }

  function getVisualCommitByIndex(index): VisualCommit | undefined {
    const cv = visualCommits.find((c) => c.commitHash == reversedHashes[index])
    return cv
  }

  function scrollToIndex(index: number): void {
    const commits = [...$repo.commits].reverse()
    $appStates.commitInView = commits[index].hashAbbrev
    document
      .querySelector(`#timeline_${commits[index].hashAbbrev}`)
      .scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }

  const debounce = (callback: Function, wait = 300) => {
    let timeout: ReturnType<typeof setTimeout>
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => callback(...args), wait)
    }
  }

  function changeKeyword(e): void {
    filterKeyword = e.target.value
    updateKeywordFilter()
  }

  function updateKeywordFilter(): void {
    filteredCommitsCount = 0
    for (let i = 0; i < $repo.commits.length; i++) {
      const commit = $repo.commits[i]
      const localCV = getVisualCommitByHash(commit.hash)
      let found = false
      if (toggleFullText) {
        found = $allDevlogs.get(commit.hash).content.toLowerCase().includes(filterKeyword.toLowerCase())
      } else {
        found = commit.subject.toLowerCase().includes(filterKeyword.toLowerCase())
      }
      localCV.filtered = found
      if (localCV.filtered) {
        filteredCommitsCount++
      }
    }
  }

  function clearCommitFilter(): void {
    filterKeyword = ''
  }

  function onCommitNodeHover(newCommitHash): void {
    currentHover = newCommitHash
  }

  function onChangedNodeHeight(changedVC: VisualCommit, newHeight: number): void {
    let index = reversedHashes.findIndex((c) => c == changedVC.commitHash)
    nodesHeight[index] = newHeight
    calcCommitHeights()
  }

  $: {
    const cInView = $appStates.commitInView
    currentCommitIndex = reversedHashes.findIndex((c) => c.indexOf(cInView) == 0)
  }

  $: {
    toggleFullText = toggleFullText
    filterKeyword = filterKeyword
    updateKeywordFilter()
    calcCommitHeights()
    calcCommitPositions()
  }

  $: {
    console.log('timeline left')
    if (parentBox != undefined) {
      parentLeft = parentBox.scrollLeft
      parentWidth = parentBox.clientWidth
    }
  }

  $: {
    // console.log('REACTIVITY TRIGGERED', parentBox)
    infoToggles = infoToggles
    scalingFactor = nodeScale == 'tiny' ? 0.6 : nodeScale == 'small' ? 0.7 : 1
    const timeUnit = timeSelected
    const scaledTimeUnitWidth = baseTimeUnitWidth * scalingFactor

    switch (timeUnit) {
      case 'hour1':
        timeScale = d3.timeHour.every(1)
        rangeWidth = (d3.timeHour.count(timeExtent[0], timeExtent[1]) + 1) * scaledTimeUnitWidth
        break
      case 'hour12':
        timeScale = d3.timeHour.every(12)
        rangeWidth = (d3.timeHour.count(timeExtent[0], timeExtent[1]) / 12 + 1) * scaledTimeUnitWidth
        break
      case 'week1':
        timeScale = d3.timeWeek.every(1)
        rangeWidth = (d3.timeWeek.count(timeExtent[0], timeExtent[1]) + 1) * scaledTimeUnitWidth
        break
      case 'week2':
        timeScale = d3.timeWeek.every(2)
        rangeWidth = (d3.timeWeek.count(timeExtent[0], timeExtent[1]) / 2 + 1) * scaledTimeUnitWidth
        break
      case 'month1':
        timeScale = d3.timeMonth.every(1)
        rangeWidth = (d3.timeMonth.count(timeExtent[0], timeExtent[1]) + 1) * scaledTimeUnitWidth
        break
      default:
        timeScale = d3.timeDay.every(1)
        rangeWidth = (d3.timeDay.count(timeExtent[0], timeExtent[1]) + 1) * scaledTimeUnitWidth
        break
    }

    scaleX = d3.scaleTime(timeExtent, [0, rangeWidth]).nice(timeScale)

    d3.timeFormat('%Y-%m-%d')
    d3.select(gx)
      .call(d3.axisTop().scale(scaleX).ticks(timeScale).tickSize(30))
      .selectAll('text')
      .style('text-anchor', 'start')
      .attr('dx', '8px')
      .attr('dy', '22px')
      .attr('fill', 'black')
      .attr('fill-opacity', '1')
      .attr('stroke', 'none')
      .classed('font-semibold', true)
      .classed('text-sm', true)
      .classed('font-sans', true)

    calcCommitPositions()
  }
</script>

<div class="flex w-full flex-col">
  <div
    class="fixed left-0 top-auto z-10 flex w-full flex-row flex-wrap items-center justify-stretch gap-x-4 gap-y-2 bg-c-white px-6 py-2">
    <div class="flex h-8 flex-row items-center gap-x-0">
      <Move class="inline-flex pe-1"></Move>Navigation
      <Button
        class="ms-2 h-8 w-8 justify-center border-r-0"
        on:click={() => {
          currentCommitIndex = 0
          scrollToIndex(currentCommitIndex)
        }}><ArrowLeftToLine /></Button>
      <Button
        class=" mx-0 h-8 w-8 justify-center border-x-0"
        on:click={() => {
          currentCommitIndex -= 1
          if (currentCommitIndex < 0) {
            currentCommitIndex = 0
          }
          scrollToIndex(currentCommitIndex)
        }}><ArrowLeft /></Button>
      <Button
        class=" h-8 w-8 justify-center border-x-0"
        on:click={() => {
          scrollToIndex(currentCommitIndex)
        }}><Pin /></Button>
      <Button
        class=" h-8 w-8 justify-center border-x-0"
        on:click={() => {
          currentCommitIndex += 1
          if (currentCommitIndex > $repo.commits.length - 1) {
            currentCommitIndex = $repo.commits.length - 1
          }
          scrollToIndex(currentCommitIndex)
        }}><ArrowRight /></Button>
      <Button
        class=" h-8 w-8 justify-center border-l-0"
        on:click={() => {
          currentCommitIndex = $repo.commits.length - 1
          scrollToIndex(currentCommitIndex)
        }}><ArrowRightToLine /></Button>
    </div>
    <ScaleSelect bind:selectedUnit={timeSelected}></ScaleSelect>
    <TimelineZoomSelect bind:selectedZoom={nodeScale}></TimelineZoomSelect>
    <InfoToggleBar bind:info={infoToggles}></InfoToggleBar>
    <Button
      class="flex h-8 items-center justify-center gap-x-1"
      on:click={() => {
        window.files.exportJsonCanvas(visualCommits, $repo.userRepoInfo)
      }}><Save class="inline-flex" />Export to Obsidian</Button>
    <div class="flex h-8 w-full flex-row items-center gap-x-1">
      <Filter class="inline-flex"></Filter>Filter
      <input
        type="text"
        placeholder="Search commits..."
        on:input={debounce(changeKeyword)}
        value={filterKeyword}
        class="h-8 border-2 border-r-0" />
      <Button class="-ms-2 h-8 p-0" on:click={clearCommitFilter}><X></X></Button>
      <GeneralToggle class="h-8 w-[120px]" bind:value={toggleFullText}>Full-text</GeneralToggle>
      {#key filterKeyword}
        {#if filteredCommitsCount > 0}
          {#if filterKeyword != ''}
            Showing {filteredCommitsCount} commits with '{filterKeyword}' (out of {$repo.commits.length} commits).
          {:else}
            Showing all {$repo.commits.length} commits.
          {/if}
        {:else}
          No commits to show with '{filterKeyword}'.
        {/if}
      {/key}
    </div>
  </div>

  <div class="relative h-full" id="timeline_box">
    <div class="absolute gap-0" id="commitTLView" bind:this={timelineContainer}>
      {#if $appStates.repoReady}
        {#each visualCommits as cv, i (cv.commitHash)}
          {@const commitData = $repo.commits.find((c) => c.hash == cv.commitHash)}
          <TimelineNode
            {commitData}
            {parentBox}
            {parentLeft}
            {parentWidth}
            hoverHandler={onCommitNodeHover}
            calculatedY={nodesY[i]}
            handleHeightChanged={onChangedNodeHeight}
            isCurrentCommit={currentCommitIndex == i}
            visualCommit={cv}
            zoomLevel={nodeScale}
            bind:visualBox={commitBoxes[i]}>
            <div class={`relative flex flex-col`}>
              <div class="flex items-center px-2 py-1">
                <p class="w-fit gap-2">
                  {#if infoToggles.indexOf('author') > -1}
                    <span class="inline-flex items-center bg-f-info/40 px-1"
                      ><User class="mx-1 inline-flex h-4 w-4"></User>{commitData.author_name}</span
                    >{/if}
                  {#if infoToggles.indexOf('branches') > -1}
                    {#each commitData.branches as br}
                      <span class="inline-flex items-center bg-app/40 px-1"
                        ><GitBranch class="mx-1 inline-flex h-4 w-4"></GitBranch> {br.substring(15)}
                      </span>
                    {/each}
                  {/if}
                  {#if infoToggles.indexOf('tags') > -1}
                    {#key getCodeIdsInCommit(commitData.hash)}
                      {#each getCodeIdsInCommit(commitData.hash) as codeGUID}
                        <span class="me-1 inline-flex items-center rounded-full bg-magenta/30 px-2"
                          ><Tag class="mx-1 inline-flex h-4 w-4"></Tag> {$allCodes.get(codeGUID).value}
                        </span>
                      {/each}
                    {/key}
                  {/if}
                </p>
              </div>

              <div class="my-1 flex h-5 items-center gap-1 px-2">
                <p class="w-fit">
                  <Calendar class="mb-1 inline-flex h-4 w-4 text-xs" />
                  {DateTime.fromMillis(commitData.author.timestamp).toFormat('yyyy-MM-dd, HH:mm')}
                </p>

                <Button
                  class="ms-auto"
                  on:click={() => {
                    currentCommitIndex = i
                    scrollToIndex(currentCommitIndex)
                  }}><Pin class="h-3 w-3" /></Button>

                <Button
                  class=""
                  on:click={() => {
                    console.log('play')
                  }}><Play class="h-3 w-3" /></Button>
              </div>

              {#if infoToggles.indexOf('file_diff') > -1}
                <FileChangesDrawer commit={commitData} {fileChangesExtents} />
              {/if}
              {#if infoToggles.indexOf('line_diff') > -1}
                <LineChangesDrawer commit={commitData} {lineChangesExtents} />
              {/if}
            </div>
          </TimelineNode>
        {/each}
      {:else}
        Waiting for repo data.
      {/if}

      <svg
        width={rangeWidth}
        height="{maxY + 400}px"
        fill-opacity="0"
        class="absolute top-0 z-0 bg-gradient-to-r from-purple-100 via-amber-100 to-teal-100 fill-c-black stroke-c-black">
        <!-- Draws the vertical guideline for each group of commits -->
        {#each visualCommits as cv (cv.commitHash)}
          <line x1={cv.x} y1={0} x2={cv.x} y2="{maxY + 400}px" style:stroke-width={5} style:stroke={'#fff'} />
        {/each}

        <!-- Draws the link connectors between commits -->
        {#each commitBoxes as sourceBox, i}
          {@const visualCommit = getVisualCommitByIndex(i)}
          {@const commitData = $repo.commits.find((c) => c.hash == visualCommit.commitHash)}
          {@const commitParents = commitData.parents}
          {#each commitParents.split(' ') ?? [] as child}
            {@const targetBox = commitBoxes[reversedHashes.findIndex((c) => c == child)]}
            {#if commitData.parents != ''}
              <TimelineNodeLink {sourceBox} {targetBox} visualCommitSource={visualCommit}></TimelineNodeLink>
            {/if}
          {/each}
        {/each}

        <!-- Draws the top axis in a "sticky" position ignoring vertical scroll -->
        <g bind:this={gx} class="z-10" transform="translate(0, {menuOffsetY - 20 + $appStates.mainViewScroll})"></g>
      </svg>
    </div>
  </div>
</div>
