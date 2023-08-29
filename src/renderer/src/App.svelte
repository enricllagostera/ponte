<script>
  import QdpxPreview from './components/QDPXPreview.svelte'
  import RepoLoader from './components/RepoLoader.svelte'
  import { DateTime } from 'luxon'

  let repoInfoLoaded = false
  let allInputCommits = []
  let allCommitsToProcess = []
  let qdpx = {}
  let actions = {
    manualIgnoreCommits: {
      active: true,
      selectedCommits: {}
    },
    individualCommitDevlog: {
      active: false
    },
    devlogCompilation: {
      active: true
    }
  }

  qdpx.sources = []

  function displayRepoData(event) {
    repoInfoLoaded = true
    allInputCommits = JSON.parse(event.detail.commits)
    allCommitsToProcess = [...allInputCommits]
    allCommitsToProcess.forEach(
      (c) => (actions.manualIgnoreCommits.selectedCommits[c.hashAbbrev] = true)
    )
  }

  async function updateQdpxPreview(_event) {
    console.log('updating QDPX')
    let sources = []
    if (actions.manualIgnoreCommits.active) {
      allCommitsToProcess = [
        ...allInputCommits.filter((v) => actions.manualIgnoreCommits.selectedCommits[v.hashAbbrev])
      ]
    } else {
      allCommitsToProcess = [...allInputCommits]
    }

    if (actions.devlogCompilation.active) {
      const dScs = []
      allCommitsToProcess.forEach((commit) => {
        dScs.push(commit.hashAbbrev)
      })
      const compilationSource = await window.loader.getDevlogCompilation({
        selectedCommits: [...dScs]
      })
      sources.push(compilationSource)
    }

    if (actions.individualCommitDevlog.active) {
      for (const commit of allCommitsToProcess) {
        sources.push(await window.loader.getDevlogForCommit(commit.hashAbbrev, {}))
      }
    }
    qdpx = { commits: [...allCommitsToProcess], sources: [...sources] }
  }

  function toggleIncludedCommit(hashAbbrev) {
    actions.manualIgnoreCommits.selectedCommits[hashAbbrev] =
      !actions.manualIgnoreCommits.selectedCommits[hashAbbrev]
    updateQdpxPreview()
  }
</script>

<svelte:head>
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
  />
</svelte:head>

<main class="container-fluid text-left p-3 vh-100">
  <div class="row align-items-top">
    <div class="col">
      <RepoLoader on:repoDataLoaded={displayRepoData} />
      {#if repoInfoLoaded}
        <h2 class="my-3">Actions</h2>
        <div class="list-group">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">Manually ignore commits</h5>
            <input
              class="form-check-input"
              type="checkbox"
              bind:checked={actions.manualIgnoreCommits.active}
              name="executeAction"
              on:change={updateQdpxPreview}
            />
            <label class="form-check-label align-text-start" for="executeAction"> Activate </label>
          </div>
          <p class="mb-1">Removes the selected commits from QDPX processing.</p>

          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">Generate a devlog compilation</h5>
            <input
              class="form-check-input"
              type="checkbox"
              bind:checked={actions.devlogCompilation.active}
              name="executeAction"
              on:change={updateQdpxPreview}
            />
            <label class="form-check-label align-text-start" for="executeAction"> Activate </label>
          </div>
          <p class="mb-1">
            Generates a single source with the contents of the devlogs for all processed commits.
          </p>

          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">Generate a devlog per commit</h5>
            <input
              class="form-check-input"
              type="checkbox"
              bind:checked={actions.individualCommitDevlog.active}
              name="executeAction"
              on:change={updateQdpxPreview}
            />
            <label class="form-check-label align-text-start" for="executeAction"> Activate </label>
          </div>
          <p class="mb-1">Adds a text source with devlog information for each commit.</p>
        </div>

        <button
          class="btn btn-primary my-3"
          type="button"
          id="loadRepo"
          on:click={updateQdpxPreview}
        >
          Update QDPX preview
        </button>
      {/if}
    </div>
    <div class="col" class:bg-secondary-subtle={!repoInfoLoaded}>
      <h2>Source commits</h2>
      {#if repoInfoLoaded}
        {#each allInputCommits as commit (commit.hashAbbrev)}
          <div class="card my-3">
            <div class="card-body">
              <h5 class="card-title">{commit.subject}</h5>
              <h6 class="card-subtitle mb-2 text-body-secondary">
                <i class="bi bi-git"></i> #{commit.hashAbbrev} <i class="bi bi-calendar-event"></i>
                {DateTime.fromMillis(commit.author.timestamp).toISODate()}
              </h6>
              {#if commit.body != ''}
                <p>{commit.body}</p>
              {/if}
            </div>
            <div class="card-footer">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  on:change={toggleIncludedCommit(commit.hashAbbrev)}
                  id="includeCheckbox_{commit.hashAbbrev}"
                  checked
                />
                <label class="form-check-label" for="includeCheckbox_{commit.hashAbbrev}">
                  Include in QDPX
                </label>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <p id="gitData">Waiting for repo data.</p>
      {/if}
    </div>
    <div class="col" class:bg-secondary-subtle={!repoInfoLoaded}>
      <QdpxPreview qdpxData={qdpx} />
    </div>
  </div>
</main>

<style>
</style>
