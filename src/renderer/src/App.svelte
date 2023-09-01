<script>
  import { v4 as uuid } from 'uuid'

  import QdpxPreview from './components/QDPXPreview.svelte'
  import RepoLoader from './components/RepoLoader.svelte'
  import ActionListitem from './components/ActionListitem.svelte'
  import CommitListItem from './components/CommitListItem.svelte'
  import ActionApplyCodeCommitGlob from './components/ActionApplyCodeCommitGlob.svelte'

  let repoInfoLoaded = false
  let userRepoInfo = ''
  let allInputCommits = []
  let allCommitsToProcess = []
  let allCodeOptions = []
  let qdpx = { sources: [], codes: [], commits: [] }

  let newActions = [
    {
      name: 'manualIgnoreCommits',
      guid: uuid(),
      active: true,
      title: 'Manually ignore commits',
      description: 'Removes the selected commits from QDPX processing.',
      selectedCommits: []
    },
    {
      name: 'devlogCompilation',
      guid: uuid(),
      active: true,
      title: 'Generate devlog compilation',
      description:
        'Generates a single source with the contents of the devlogs for all processed commits.',
      selectedCommits: []
    },
    {
      name: 'individualCommitDevlog',
      guid: uuid(),
      active: false,
      title: 'Generate one devlog per commit',
      description: 'Adds a separate text source with devlog information for each commit.',
      selectedCommits: []
    }
  ]

  function actionByName(actions, name) {
    return actions.filter((a) => a.name == name)[0]
  }

  function actionsByName(actions, name) {
    return actions.filter((a) => a.name == name)
  }

  function displayRepoData(event) {
    repoInfoLoaded = true
    allInputCommits = JSON.parse(event.detail.commits)
    userRepoInfo = event.detail.userRepoInfo
    allCommitsToProcess = [...allInputCommits]
    allCommitsToProcess.forEach(
      (c) => (actionByName(newActions, 'manualIgnoreCommits').selectedCommits[c.hashAbbrev] = true)
    )
    updateQdpxPreview()
  }

  function toggleIncludedCommit(event) {
    const hashAbbrev = event.detail.hashAbbrev
    const actManualIgnore = actionByName(newActions, 'manualIgnoreCommits')
    actManualIgnore.selectedCommits[hashAbbrev] = !actManualIgnore.selectedCommits[hashAbbrev]
    updateQdpxPreview()
  }

  async function updateQdpxPreview(_event) {
    console.log('updating QDPX')
    let sources = []
    if (actionByName(newActions, 'manualIgnoreCommits').active) {
      allCommitsToProcess = [
        ...allInputCommits.filter(
          (v) => actionByName(newActions, 'manualIgnoreCommits').selectedCommits[v.hashAbbrev]
        )
      ]
    } else {
      allCommitsToProcess = [...allInputCommits]
    }

    if (actionByName(newActions, 'devlogCompilation').active) {
      const dScs = []
      allCommitsToProcess.forEach((commit) => {
        dScs.push(commit.hashAbbrev)
      })
      const compilationSource = await window.loader.getDevlogCompilation({
        selectedCommits: [...dScs]
      })
      sources.push(compilationSource)
    }

    if (actionByName(newActions, 'individualCommitDevlog').active) {
      for (const commit of allCommitsToProcess) {
        sources.push(await window.loader.getDevlogForCommit(commit.hashAbbrev, {}))
      }
    }

    const allCodesToApply = []

    const allApplyCodeCommitByGlob = actionsByName(newActions, 'applyCodeCommitGlob')
    for (const act of allApplyCodeCommitByGlob) {
      if (act.active) {
        act.codesToApply.forEach((selectedCode) => {
          const getCode = allCodesToApply.filter((c) => c.code == selectedCode.value)
          if (getCode.length == 1) {
            getCode.commits = getCode.commits.concat(selectedCode.selectedCommits)
          } else {
            allCodesToApply.push({ name: selectedCode.value, commits: act.selectedCommits })
          }
        })
      }
    }
    console.log(qdpx.codes)
    qdpx = {
      commits: [...allCommitsToProcess],
      sources: [...sources],
      codes: [...allCodesToApply]
    }
  }

  function addApplyCodeCommitGlob() {
    const adding = {
      name: 'applyCodeCommitGlob',
      guid: uuid(),
      active: true,
      title: 'Apply codes to commits by pattern',
      description:
        'Apply codes to commits based on their subject and body information (i.e. devlog).',
      selectedCommits: []
    }
    newActions.push(adding)
    newActions = [...newActions]
  }

  function removeApplyCodeCommitGlob(event) {
    const actionToRemove = newActions.findIndex((a) => a.guid == event.detail.action.guid)
    newActions.splice(actionToRemove, 1)
    newActions = [...newActions]
    updateQdpxPreview()
  }
</script>

<svelte:head>
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
  />
</svelte:head>

<main class="container-fluid d-flex vh-100 max-vh100 flex-column">
  <div class="row flex-grow-1 py-2 g-2">
    <div class="col d-flex flex-column">
      <div class="row">
        <div class="col">
          <RepoLoader on:repoDataLoaded={displayRepoData} />
        </div>
      </div>

      {#if repoInfoLoaded}
        <div class="row flex-grow-1">
          <div class="col d-flex">
            <div class="card rounded-0 m-1 flex-grow-1">
              <div class="card-header d-flex flex-grow-0 align-items-end">
                <div class="mt-1">
                  <h5>Actions</h5>
                </div>
                <div class="ms-auto">
                  <div class="dropdown">
                    <button
                      class="btn btn-primary dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i class="bi bi-plus-circle"></i> Add action
                    </button>
                    <ul class="dropdown-menu">
                      <li>
                        <button
                          class="dropdown-item"
                          type="button"
                          on:click={addApplyCodeCommitGlob}
                          >Apply codes to commits by pattern</button
                        >
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="card-body flexOverflow overflow-y-scroll" id="actionsTop">
                <div class="list-group">
                  <ActionListitem
                    action={actionByName(newActions, 'manualIgnoreCommits')}
                    on:actionUpdated={updateQdpxPreview}
                  />

                  <ActionListitem
                    action={actionByName(newActions, 'devlogCompilation')}
                    on:actionUpdated={updateQdpxPreview}
                  />

                  <ActionListitem
                    action={actionByName(newActions, 'individualCommitDevlog')}
                    on:actionUpdated={updateQdpxPreview}
                  />

                  {#each actionsByName(newActions, 'applyCodeCommitGlob') as action (action.guid)}
                    <ActionApplyCodeCommitGlob
                      {action}
                      {allCodeOptions}
                      commitsToProcess={allCommitsToProcess}
                      on:actionUpdated={updateQdpxPreview}
                      on:actionDeleted={removeApplyCodeCommitGlob}
                    />
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="col d-flex overflow-hidden">
      <div class="card rounded-0 m-1 flex-grow-1">
        <div class="card-header d-flex flex-grow-0 align-items-end">
          <h5>Source commits</h5>
        </div>
        <div class="card-body flexOverflow overflow-y-scroll">
          {#if repoInfoLoaded}
            {#each allInputCommits as commit (commit.hashAbbrev)}
              <CommitListItem {commit} {userRepoInfo} on:toggleIncluded={toggleIncludedCommit} />
            {/each}
          {:else}
            <p id="gitData">Waiting for repo data.</p>
          {/if}
        </div>
        <!-- <div class="card-footer flex-grow-0 text-muted">Footer</div> -->
      </div>
    </div>
    <div class="col d-flex flex-column">
      <QdpxPreview qdpxData={qdpx} />
    </div>
  </div>
</main>

<style>
  .max-vh100 {
    max-height: 100vh;
  }

  :global(.flexOverflow) {
    flex: 1 1 1px;
    min-width: 0;
    min-height: 0;
  }
</style>
