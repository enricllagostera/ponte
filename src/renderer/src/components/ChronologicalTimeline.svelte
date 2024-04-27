<script lang="ts">
  import * as d3 from 'd3'
  import { appStates, repo } from '../stores/stores'
  import { allCodes, getCodeIdsInCommit } from '../stores/codes'
  import CommitPillButton from './CommitPillButton.svelte'
  import { DateTime } from 'luxon'

  import Button from './Button.svelte'
  import {
    ArrowLeft,
    ArrowLeftToLine,
    ArrowRight,
    ArrowRightToLine,
    Calendar,
    TagsIcon,
    GitBranch,
    User,
    Tag,
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

  let scaleX = undefined
  let timeExtent
  let fileChangesExtents
  let lineChangesExtents
  let gx, dates
  let rangeWidth = 3000

  let maxBand = 0
  let currentHover = ''
  let currentCommitIndex = 0
  let baseTimeUnitWidth = 380
  let commitsVisual = new Map()
  let scalingFactor = 1

  let timeSelected = ''
  let timeScale = null

  let nodeScale = '100%'
  let infoToggles = ['author', 'tags']

  const linkHor = d3.link(d3.curveBumpX)
  const linkVer = d3.link(d3.curveStep)

  commitsVisual = new Map()
  const commitsCopy = [...$repo.commits]
  let allDevlogs = {}
  commitsCopy.map(async (c) => (allDevlogs[c.hash] = await devlogWithTrailerContent(c.hash)))

  async function devlogWithTrailerContent(commitHash): Promise<string> {
    const dv = await window.loader.getDevlogForCommit(commitHash, {})
    return dv.content
  }

  let maxY = 0

  commitsCopy.reverse().forEach((c) => {
    commitsVisual.set(c.hash, { ...c, x: 0, y: 0, filtered: true, band: 0, codes: [] })
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
      c.lineChangeStats.reduce((acc, f) => acc + Number(f.is_binary || f.is_empty ? 0 : f.added_lines), 0)
    )
  )
  lineChangesExtents.deleted_lines = d3.extent(
    $repo.commits.map((c) =>
      c.lineChangeStats.reduce((acc, f) => acc + Number(f.is_binary || f.is_empty ? 0 : f.deleted_lines), 0)
    )
  )

  timeExtent = d3.extent(dates)

  $: {
    const timeUnit = timeSelected

    switch (timeUnit) {
      case 'hour1':
        timeScale = d3.timeHour.every(1)
        rangeWidth = d3.timeHour.count(timeExtent[0], timeExtent[1]) * baseTimeUnitWidth
        break
      case 'hour12':
        timeScale = d3.timeHour.every(12)
        rangeWidth = (d3.timeHour.count(timeExtent[0], timeExtent[1]) / 12) * baseTimeUnitWidth
        break
      case 'week1':
        timeScale = d3.timeWeek.every(1)
        rangeWidth = d3.timeWeek.count(timeExtent[0], timeExtent[1]) * baseTimeUnitWidth
        break
      case 'week2':
        timeScale = d3.timeWeek.every(2)
        rangeWidth = (d3.timeWeek.count(timeExtent[0], timeExtent[1]) / 2) * baseTimeUnitWidth
        break
      case 'month1':
        timeScale = d3.timeMonth.every(1)
        rangeWidth = d3.timeMonth.count(timeExtent[0], timeExtent[1]) * baseTimeUnitWidth
        break
      default:
        timeScale = d3.timeDay.every(1)
        rangeWidth = d3.timeDay.count(timeExtent[0], timeExtent[1]) * baseTimeUnitWidth
        break
    }

    if ($appStates.repoReady) {
      //rangeWidth = d3.timeDay.count(timeExtent[0], timeExtent[1]) * 250
      //d3.timeFormat('%Y-%m-%d')
      scaleX = d3.scaleTime(timeExtent, [0, rangeWidth]).nice(timeScale)
      const scaleWithZoom = d3.scaleTime(timeExtent, [0, rangeWidth * scalingFactor]).nice(timeScale)
      d3.select(gx)
        .call(d3.axisTop().scale(scaleWithZoom).ticks(timeScale).tickSize(30))
        .selectAll('text')
        .style('text-anchor', 'start')
        .attr('dx', '4px')
        .attr('dy', '4px')
        .attr('transform', 'rotate(-45)')
    }
    commitsVisual = commitsVisual
    rangeWidth = rangeWidth
    calcCommitPositions()
  }

  function getLinkFor(sourceHash: string, targetHash: string) {
    const cvSource = commitsVisual.get(sourceHash)
    const cvTarget = commitsVisual.get(targetHash)

    if (cvSource == undefined || cvTarget == undefined) {
      return
    }

    if (cvSource.band == 0) {
      return linkHor({
        source: [cvSource.x, cvSource.y + cvSource.h * 0.5],
        target: [cvTarget.x + cvTarget.w, cvTarget.y + cvTarget.h * 0.5]
      })
    }

    return linkVer({
      source: [cvSource.x + cvSource.w * 0.5, cvSource.y + cvSource.h],
      target: [cvTarget.x + cvTarget.w * 0.5, cvTarget.y]
    })
  }

  function calcCommitPositions(): void {
    maxBand = 0
    // let positionsCalculated = 0
    let lastBand = -1
    let lastX = 0
    for (const cv of commitsVisual) {
      const commit = cv[1]
      let thisX = scaleX(timeScale.floor(new Date(commit.committer.timestamp)))
      commit.y = 0
      if (thisX > lastX) {
        commit.x = thisX
        lastX = thisX
        lastBand = 0
        //commit.y = getCommitY(0)
        commit.band = lastBand
      } else {
        lastBand += 1
        commit.band = lastBand
        commit.x = thisX
        //commit.y = getCommitHeight(lastBand)
        lastX = thisX
      }
      if (lastBand > maxBand) {
        maxBand = lastBand
      }
      commit.col = commit.x == 0 ? 0 : 1 + Number(BigInt(Math.floor(commit.x)) / BigInt(baseTimeUnitWidth))
    }
    maxY = 0
    for (let i = 0; i < commitsCopy.length; i++) {
      const cy = getVisualCommitByIndex(i)
      cy.y = getCommitY(i)
      if (cy.y >= maxY) {
        maxY = cy.y
      }
    }
  }

  function getVisualCommitByIndex(index) {
    const commitData = commitsCopy[index]
    const cv = commitsVisual.get(commitData.hash)
    return cv
  }

  function getCommitY(index): number {
    const commitData = commitsCopy[index]
    const cv = commitsVisual.get(commitData.hash)
    if (cv.band == 0) {
      return 180 / scalingFactor
    }

    let accumY = getCommitHeight(index - 1) + 30 + getVisualCommitByIndex(index - 1).y

    return accumY
  }

  function getCommitHeight(index): number {
    // return 160 + band * ((commitHeight == 0 ? 160 : commitHeight) + 50)
    return getVisualCommitByIndex(index).h ?? 190
  }

  function scrollToIndex(index: number): void {
    const commits = [...$repo.commits].reverse()
    $appStates.commitInView = commits[index].hashAbbrev
    document
      .querySelector(`#timeline_${commits[index].hashAbbrev}`)
      .scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }

  $: {
    const cInView = $appStates.commitInView
    currentCommitIndex = [...$repo.commits].reverse().findIndex((c) => c.hashAbbrev == cInView)
  }

  $: {
    toggleFullText = toggleFullText
    filterKeyword = filterKeyword
    updateKeywordFilter()
  }

  const debounce = (callback: Function, wait = 300) => {
    let timeout: ReturnType<typeof setTimeout>
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => callback(...args), wait)
    }
  }

  let filterKeyword = ''
  let toggleFullText = false
  let filteredCommitsCount = 0

  function changeKeyword(e) {
    filterKeyword = e.target.value
    updateKeywordFilter()
  }

  function updateKeywordFilter() {
    filteredCommitsCount = 0
    for (let i = 0; i < $repo.commits.length; i++) {
      const commit = $repo.commits[i]

      const cv = commitsVisual.get(commit.hash)
      let found = false
      if (toggleFullText) {
        found = allDevlogs[commit.hash].toLowerCase().includes(filterKeyword.toLowerCase())
      } else {
        found = commit.subject.toLowerCase().includes(filterKeyword.toLowerCase())
      }
      cv.filtered = found
      if (cv.filtered) {
        filteredCommitsCount++
      }
    }
    commitsVisual = commitsVisual
  }

  function clearCommitFilter() {
    filterKeyword = ''
  }

  $: {
    scalingFactor = nodeScale == 'tiny' ? 0.5 : nodeScale == 'small' ? 0.7 : 1
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
        window.files.exportJsonCanvas(commitsVisual, $repo.userRepoInfo)
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

  {#key [scalingFactor, infoToggles, rangeWidth]}
    <div class="relative h-full" id="timeline_box">
      <svg
        width="{rangeWidth * scalingFactor}px"
        height="85"
        fill-opacity="1"
        class="absolute z-[1] font-bold"
        style:margin-top="{80 + $appStates.mainViewScroll}px"
        transform="translate(0, 0);">
        <g bind:this={gx} class="z-10" transform="translate(0, 85)"></g>
      </svg>
      <div
        class="absolute top-auto gap-0"
        id="commitTLView"
        style="transform: scale({scalingFactor}, {scalingFactor}); transform-origin: top left;">
        <svg
          width={rangeWidth}
          height="{maxY + 400}px"
          fill-opacity="0"
          class="absolute top-0 z-0 bg-neutral-200 fill-c-black stroke-c-black">
          {#each commitsVisual as [hash, commit], i (hash)}
            {#if commit.parents != ''}
              {#each commit.parents.split(' ') as child}
                {#if getLinkFor(commit.hash, child) != undefined}
                  <path
                    d={getLinkFor(commit.hash, child)}
                    fill="transparent"
                    stroke={currentCommitIndex == i || currentCommitIndex == i - 1 ? '#13d44e' : `#777`}
                    stroke-width="{currentCommitIndex == i || currentCommitIndex == i - 1 ? 8 : 3}px"></path>
                {/if}
              {/each}
            {/if}
            <line x1={commit.x} y1={0} x2={commit.x} y2="{maxY + 400}px" style:stroke-width={3} style:stroke={'#aaa'} />
          {/each}
        </svg>
        {#if $appStates.repoReady}
          {#each commitsVisual as [hash, commit], i (hash)}
            {#if commit.filtered}
              <div
                class="group absolute z-[3] h-fit w-[300px] items-center bg-c-white text-base shadow-lg hover:border-c-black hover:bg-app {currentCommitIndex ==
                i
                  ? ' border-2 bg-c-white ring-4 ring-app'
                  : ' border-2 border-c-black bg-c-white'}"
                bind:this={domCommits[i]}
                bind:clientHeight={commit.h}
                bind:clientWidth={commit.w}
                id="timeline_{commit.hashAbbrev}"
                style:left="{commit.x}px"
                style:top="{commit.y}px"
                on:pointerenter={() => (currentHover = commit.hash)}
                on:pointerleave={() => (currentHover = '')}>
                <div class={`relative flex flex-col ${filterKeyword != '' ? ' bg-app/25 ' : ''}`}>
                  <!-- {commit.col} -->
                  <p class="m-2 line-clamp-3 text-xl font-semibold">{commit.subject}</p>
                  <div class="flex items-center px-2 py-1">
                    <p class="w-fit gap-2">
                      {#if infoToggles.indexOf('author') > -1}
                        <span class="inline-flex items-center bg-f-info/40 px-1"
                          ><User class="mx-1 inline-flex h-4 w-4"></User>{commit.author_name}</span
                        >{/if}
                      {#if infoToggles.indexOf('branches') > -1}
                        {#each commit.branches as br}
                          <span class="inline-flex items-center bg-app/40 px-1"
                            ><GitBranch class="mx-1 inline-flex h-4 w-4"></GitBranch> {br.substring(15)}
                          </span>
                        {/each}
                      {/if}
                      {#if infoToggles.indexOf('tags') > -1}
                        {#key getCodeIdsInCommit(commit.hash)}
                          {#each getCodeIdsInCommit(commit.hash) as codeGUID}
                            <span class="me-1 inline-flex items-center rounded-full bg-magenta/30 px-2"
                              ><Tag class="mx-1 inline-flex h-4 w-4"></Tag> {$allCodes.get(codeGUID).value}
                            </span>
                          {/each}
                        {/key}
                      {/if}
                    </p>
                  </div>

                  <div class="flex items-center gap-1 px-2 py-1">
                    <p class="w-fit">
                      <Calendar class="mb-1 inline-flex h-4 w-4 text-xs" />
                      {DateTime.fromMillis(commit.author.timestamp).toFormat('yyyy-MM-dd, HH:mm')}
                    </p>

                    <Button
                      class="ms-auto"
                      on:click={() => {
                        currentCommitIndex = i
                        scrollToIndex(currentCommitIndex)
                      }}><Pin class="h-4 w-4" /></Button>
                    <Button class=""><TagsIcon class="h-4 w-4" /></Button>
                  </div>

                  {#if infoToggles.indexOf('file_diff') > -1}
                    <FileChangesDrawer {commit} {fileChangesExtents} />
                  {/if}
                  {#if infoToggles.indexOf('line_diff') > -1}
                    <LineChangesDrawer {commit} {lineChangesExtents} />
                  {/if}
                  <div class="flex w-full flex-row place-items-end bg-[#ddd] py-1">
                    <CommitPillButton
                      class="w-full px-2"
                      forceDarkTheme={true}
                      hashAbbrev={commit.hashAbbrev}
                      clickable={false} />
                  </div>
                </div>
              </div>
            {:else}
              <div
                class="group absolute z-[3] h-fit w-[300px] items-center bg-neutral-300 text-base shadow-lg hover:border-c-black hover:bg-app {currentCommitIndex ==
                i
                  ? ' border-2 bg-c-white ring-4 ring-app'
                  : ' border-2 border-c-black bg-c-white'}"
                bind:this={domCommits[i]}
                bind:clientHeight={commit.h}
                bind:clientWidth={commit.w}
                id="timeline_{commit.hashAbbrev}"
                style:left="{commit.x}px"
                style:top="{commit.y}px"
                on:pointerenter={() => (currentHover = commit.hash)}
                on:pointerleave={() => (currentHover = '')}>
                <div class="relative flex flex-col">
                  <p class="m-2 line-clamp-3 text-base font-semibold">{commit.subject}</p>
                  <div class="flex w-full flex-row place-items-end bg-[#ddd] py-1">
                    <CommitPillButton
                      class="w-full px-2"
                      forceDarkTheme={true}
                      hashAbbrev={commit.hashAbbrev}
                      clickable={false} />
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        {:else}
          Waiting for repo data.
        {/if}
      </div>
    </div>
  {/key}
</div>
