<script>
  import { v4 as uuid } from 'uuid'

  import { Modal } from 'bootstrap'

  import { repo, codeOptions } from './stores.js'

  import QdpxPreview from './components/QDPXPreview.svelte'
  import RepoLoader from './components/RepoLoader.svelte'
  import ActionListitem from './components/ActionListitem.svelte'
  import CommitListItem from './components/CommitListItem.svelte'
  import ActionApplyCodeCommitGlob from './components/ActionApplyCodeCommitGlob.svelte'
  import StaticAlert from './components/StaticAlert.svelte'
  import WaitingModal from './components/WaitingModal.svelte'

  let repoInfoLoaded = false
  let userRepoInfo = ''
  let allInputCommits = []
  let allCommitsToProcess = []

  const defaultQdpx = { sources: [], codes: [], commits: [] }
  let qdpx = { ...defaultQdpx }

  const defaultActions = [
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
    // {
    //   name: 'applyCodesCommit',
    //   guid: uuid(),
    //   active: false,
    //   title: 'Generate one devlog per commit',
    //   description: 'Adds a separate text source with devlog information for each commit.',
    //   selectedCommits: []
    //   searchPattern: ''
    // },
  ]

  let currentActions = [...defaultActions]

  function actionByName(actions, name) {
    return actions.filter((a) => a.name == name)[0]
  }

  function actionsByName(actions, name) {
    return actions.filter((a) => a.name == name)
  }

  function displayRepoData(_event) {
    repoInfoLoaded = true
    allInputCommits = $repo.commits
    userRepoInfo = $repo.userRepoInfo
    allCommitsToProcess = [...allInputCommits]
    allCommitsToProcess.forEach(
      (c) =>
        (actionByName(currentActions, 'manualIgnoreCommits').selectedCommits[c.hashAbbrev] = true)
    )
    updateQdpxPreview()
  }

  function toggleIncludedCommit(event) {
    const hashAbbrev = event.detail.hashAbbrev
    const actManualIgnore = actionByName(currentActions, 'manualIgnoreCommits')
    actManualIgnore.selectedCommits[hashAbbrev] = !actManualIgnore.selectedCommits[hashAbbrev]
    updateQdpxPreview()
  }

  async function updateQdpxPreview(event) {
    console.log('updating QDPX')
    let sources = []
    if (actionByName(currentActions, 'manualIgnoreCommits').active) {
      allCommitsToProcess = [
        ...allInputCommits.filter(
          (v) => actionByName(currentActions, 'manualIgnoreCommits').selectedCommits[v.hashAbbrev]
        )
      ]
    } else {
      allCommitsToProcess = [...allInputCommits]
    }

    if (actionByName(currentActions, 'devlogCompilation').active) {
      const dScs = []
      allCommitsToProcess.forEach((commit) => {
        dScs.push(commit.hashAbbrev)
      })
      const compilationSource = await window.loader.getDevlogCompilation({
        selectedCommits: [...dScs]
      })
      sources.push(compilationSource)
    }

    if (actionByName(currentActions, 'individualCommitDevlog').active) {
      for (const commit of allCommitsToProcess) {
        sources.push(await window.loader.getDevlogForCommit(commit.hashAbbrev, {}))
      }
    }

    const allCodesToSendToQDPXExport = []
    // [{name: string, commits: [...hash]}]

    const allApplyCodeCommitByGlob = actionsByName(currentActions, 'applyCodeCommitGlob')
    for (const act of allApplyCodeCommitByGlob) {
      if (act.active) {
        for (const selectedCode of act.codesToApply) {
          const getCodeOnExportList = allCodesToSendToQDPXExport.filter(
            (c) => c.name == selectedCode.value
          )
          if (getCodeOnExportList.length == 1) {
            getCodeOnExportList.commits = getCodeOnExportList.commits.concat(
              selectedCode.selectedCommits
            )
          } else {
            allCodesToSendToQDPXExport.push({
              name: selectedCode.value,
              commits: act.selectedCommits
            })
          }
        }
      }
    }
    console.log(qdpx.codes)
    qdpx = {
      commits: [...allCommitsToProcess],
      sources: [...sources],
      codes: [...allCodesToSendToQDPXExport]
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
      selectedCommits: [],
      // selectedCommits: [ hash0, hash1 ]
      codesToApply: [],
      // codesToApply: [{ value, label }]
      searchPattern: ''
    }
    currentActions.push(adding)
    currentActions = [...currentActions]
  }

  function removeApplyCodeCommitGlob(event) {
    const actionToRemove = currentActions.findIndex((a) => a.guid == event.detail.action.guid)
    currentActions.splice(actionToRemove, 1)
    currentActions = [...currentActions]
    updateQdpxPreview()
  }

  // This is used to reactively restart a component
  let repoLoader = {}

  function resetConfig(_event) {
    $repo.userRepoInfo = ''
    $repo.commits = []
    repoLoader = {}
    repoInfoLoaded = false
    allInputCommits = []
    allCommitsToProcess = []
    currentActions = [...defaultActions]
    qdpx = { ...defaultQdpx }
  }

  async function loadConfig(_event) {
    resetConfig()
    let loadOptions = {
      title: `Load RepoToQDA config...`
    }
    let res = await window.loader.loadDialog(loadOptions)
    const waitingModal = Modal.getInstance('#waitingLoadData')
    $repo.userRepoInfo = res.userRepoInfo
    $repo.commits = JSON.parse(await window.loader.loadRepoData($repo.userRepoInfo))
    currentActions = [...res.actions]
    const allApplyCodeCommitByGlob = actionsByName(currentActions, 'applyCodeCommitGlob')
    for (const act of allApplyCodeCommitByGlob) {
      $codeOptions = [...$codeOptions, ...act.codesToApply]
    }
    waitingModal.toggle()
    displayRepoData()
    updateQdpxPreview()
  }

  async function saveConfig(_event) {
    let saveOptions = {
      title: `Save RepoToQDA config...`,
      data: {
        userRepoInfo: userRepoInfo,
        actions: [...currentActions]
      }
    }
    let res = await window.loader.saveDialog(saveOptions)
    console.log(res)
  }
</script>

<svelte:head>
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
  />
</svelte:head>

<main class="container-fluid d-flex vh-100 max-vh100 flex-column">
  <div class="row container-fluid vw-100 flex-grow-0">
    <div class="col">
      <nav class="navbar border-bottom border-body">
        <form class="container-fluid justify-content-start">
          <span class="navbar-brand"><h3>RepoToQDA</h3></span>
          <button
            class="btn btn-outline-primary ms-auto"
            data-bs-toggle="modal"
            data-bs-target="#newConfig"
            type="button"
          >
            <i class="bi bi-file-plus-fill"></i> New config</button
          >
          <StaticAlert
            dialog={{
              id: 'newConfig',
              title: 'Are you sure you want to start a new config?',
              message: 'You will lose any unsaved changes.',
              confirm: 'Start new config',
              executeOnConfirm: resetConfig
            }}
          />
          <button
            class="btn btn-outline-primary ms-2"
            data-bs-toggle="modal"
            data-bs-target="#loadConfig"
            type="button"><i class="bi bi-file-arrow-up-fill"></i> Load config</button
          >
          <StaticAlert
            dialog={{
              id: 'loadConfig',
              title: 'Are you sure you want to load config from a file?',
              message: 'You will lose any unsaved changes.',
              confirm: 'Load config from a file',
              showNextModalWithId: 'waitingLoadData',
              executeOnConfirm: loadConfig
            }}
          />
          <WaitingModal
            dialog={{
              id: 'waitingLoadData',
              title: 'Loading repository data...',
              message: 'Please wait, downloading commit information can take a few minutes...'
            }}
          />
          <button class="btn btn-outline-primary ms-2" type="button" on:click={saveConfig}
            ><i class="bi bi-file-arrow-down-fill"></i> Save config</button
          >
        </form>
      </nav>
    </div>
  </div>
  <div class="row flex-grow-1 py-2 g-2">
    <div class="col d-flex flex-column">
      <div class="row">
        <div class="col">
          {#key repoLoader}
            <RepoLoader on:repoDataLoaded={displayRepoData} />
          {/key}
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

              <div class="card-body flexOverflow overflow-y-auto" id="actionsTop">
                <div class="list-group">
                  <ActionListitem
                    action={actionByName(currentActions, 'manualIgnoreCommits')}
                    on:actionUpdated={updateQdpxPreview}
                  />

                  <ActionListitem
                    action={actionByName(currentActions, 'devlogCompilation')}
                    on:actionUpdated={updateQdpxPreview}
                  />

                  <ActionListitem
                    action={actionByName(currentActions, 'individualCommitDevlog')}
                    on:actionUpdated={updateQdpxPreview}
                  />

                  {#each actionsByName(currentActions, 'applyCodeCommitGlob') as action (action.guid)}
                    <ActionApplyCodeCommitGlob
                      {action}
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
      <div class="card rounded-0 m-1 flex-grow-1" class:text-bg-secondary={!repoInfoLoaded}>
        <div class="card-header d-flex flex-grow-0 align-items-end">
          <h5>Source commits</h5>
        </div>
        <div class="card-body flexOverflow overflow-y-auto">
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
