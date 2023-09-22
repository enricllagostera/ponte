<script>
  import { v4 as uuid } from 'uuid'

  import { Modal } from 'bootstrap'

  import { repo, codeOptions } from './stores.js'

  import QdpxPreview from './components/QDPXPreview.svelte'
  import RepoLoader from './components/RepoLoader.svelte'
  import ActionListitem from './components/ActionListitem.svelte'
  import CommitListItem from './components/CommitListItem.svelte'
  import ActionApplyCodeCommitGlob from './components/ActionApplyCodeCommitGlob.svelte'
  import ActionImportFilesByGlob from './components/ActionImportFilesByGlob.svelte'
  import StaticAlert from './components/StaticAlert.svelte'
  import WaitingModal from './components/WaitingModal.svelte'

  import { clickOutside } from './clickOutside.js'
  import Pane from './components/Pane.svelte'
  import { onMount } from 'svelte'

  const supportedTextExts = ['md', 'txt', 'js', 'css', 'html']

  let actionDropdown = false
  let newConfigModalOpen = false

  let repoInfoLoaded = false
  let userRepoInfo = ''
  let allCommitsToProcess = []
  let downloadingCommits = []
  const defaultQdpx = { sources: [], codes: [], commits: [] }
  let qdpx = { ...defaultQdpx }

  let footerMessage = ''

  const defaultActions = [
    {
      name: 'manualIgnoreCommits',
      guid: uuid(),
      active: true,
      title: 'Manually ignore commits',
      description: 'Removes the selected commits from QDPX processing.',
      ignoredCommits: []
    },
    {
      name: 'manualImportFiles',
      guid: uuid(),
      active: true,
      title: 'Manually import files as sources commits',
      description: 'Includes selected files on QDPX processing.',
      selectedFiles: []
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

  let currentActions = [...defaultActions]

  function actionByName(actions, name) {
    return actions.filter((a) => a.name == name)[0]
  }

  function actionsByName(actions, name) {
    return actions.filter((a) => a.name == name)
  }

  function displayRepoData(_event) {
    repoInfoLoaded = true
    userRepoInfo = $repo.userRepoInfo
    allCommitsToProcess = [...$repo.commits]
    // actionByName(currentActions, 'manualIgnoreCommits').selectedCommits = allCommitsToProcess.map(
    //   (c) => c.hashAbbrev
    // )
    updateQdpxPreview()
  }

  function toggleIncludedCommit(event) {
    const hashAbbrev = event.detail.hashAbbrev
    const checked = event.detail.checked
    const actManualIgnore = actionByName(currentActions, 'manualIgnoreCommits')
    if (!checked) {
      actManualIgnore.ignoredCommits = [...actManualIgnore.ignoredCommits, hashAbbrev]
    } else {
      actManualIgnore.ignoredCommits = [
        ...actManualIgnore.ignoredCommits.filter((h) => h != hashAbbrev)
      ]
    }
    updateQdpxPreview()
  }

  async function updateQdpxPreview(event) {
    console.log('updating QDPX')
    let sources = []
    let manualIgnoreCommit = actionByName(currentActions, 'manualIgnoreCommits')
    if (manualIgnoreCommit.active) {
      allCommitsToProcess = [
        ...$repo.commits.filter((v) => manualIgnoreCommit.ignoredCommits.indexOf(v.hashAbbrev) < 0)
      ]
    } else {
      allCommitsToProcess = [...$repo.commits]
    }

    if (actionByName(currentActions, 'manualImportFiles').active) {
      const act = actionByName(currentActions, 'manualImportFiles')
      act.selectedFiles = []
      for (const commit of allCommitsToProcess) {
        for (const file of getAllSelectedFiles(commit.fileTree)) {
          act.selectedFiles.push(file)
          const ext = file.name.split('.')[file.name.split('.').length - 1]
          if (supportedTextExts.indexOf(ext) >= 0) {
            const content = await window.files.readFileAtCommit(file.rel, commit.hash)
            sources.push({
              parent: 'copyTextSource',
              content: content,
              name: `${file.rel} @ ${commit.hash.substring(0, 7)}`
            })
          }
        }
      }
    } else {
      allCommitsToProcess = [...$repo.commits]
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

    const allImportFilesByGlob = actionsByName(currentActions, 'importFilesByGlob')
    for (const act of allImportFilesByGlob) {
      if (act.active) {
        for (const file of act.selectedFiles) {
          const content = await window.files.readFileAtCommit(file.file, file.commit)
          sources.push({
            parent: 'copyTextSource',
            content: content,
            name: `${file.file} @ ${file.commit.substring(0, 7)}`
          })
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

  function dismissAddActionsDropdown(event) {
    //console.log(event)
    if (actionDropdown && event.detail.target.id != 'addActionDropdownBtn') {
      actionDropdown = false
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
    actionDropdown = false
  }

  function addImportFilesByGlob() {
    const adding = {
      name: 'importFilesByGlob',
      guid: uuid(),
      active: true,
      title: 'Import files as text sources',
      description:
        'Import files from the repository that match the following pattern. They will be read and added as text sources in the QDPX export.',
      selectedCommits: [],
      selectedFiles: [],
      searchPattern: '',
      inputCommitOption: 'latest'
    }
    currentActions.push(adding)
    currentActions = [...currentActions]
    actionDropdown = false
  }

  function removeApplyCodeCommitGlob(event) {
    const actionToRemove = currentActions.findIndex((a) => a.guid == event.detail.action.guid)
    currentActions.splice(actionToRemove, 1)
    currentActions = [...currentActions]
    updateQdpxPreview()
  }

  function removeImportFilesByGlob(event) {
    currentActions = [...currentActions.filter((a) => a.guid != event.detail.action.guid)]
    updateQdpxPreview()
  }

  function getAllSelectedFiles(directory) {
    let selected = []
    for (const dirent of directory) {
      if (dirent.children?.length > 0) {
        // is folder
        selected.push(...getAllSelectedFiles(dirent.children))
      } else if (!dirent.children) {
        // is file
        if (dirent.selected) {
          selected.push(dirent)
        }
      }
    }
    return selected
  }

  function findInTreeAndToggleSelected(abs, directory, value) {
    for (const dirent of directory) {
      if (dirent.children?.length > 0) {
        // is folder
        findInTreeAndToggleSelected(abs, dirent.children, value)
      } else if (!dirent.children && dirent.abs == abs) {
        dirent.selected = value
        return
      }
    }
  }

  // This is used to reactively restart a component
  let repoLoader = {}

  function resetConfig(_event) {
    $repo.userRepoInfo = ''
    $repo.commits = []
    repoLoader = {}
    repoInfoLoaded = false
    allCommitsToProcess = []
    currentActions = [...defaultActions]
    const manualIgnoreCommits = actionsByName(currentActions, 'manualIgnoreCommits')[0]
    manualIgnoreCommits.ignoredCommits = $repo.commits.map((i) => i.hashAbbrev)
    qdpx = { ...defaultQdpx }
  }

  async function loadConfig(e) {
    resetConfig()
    let loadOptions = {
      title: `Load RepoToQDA config...`
    }
    let res = await window.loader.loadDialog(loadOptions)
    const waitingModal = Modal.getInstance('#waitingLoadData')
    $repo.userRepoInfo = res.userRepoInfo
    $repo.commits = JSON.parse(await window.loader.loadRepoData($repo.userRepoInfo))
    currentActions = [...res.actions]
    const manualImportFiles = actionsByName(currentActions, 'manualImportFiles')
    for (const file of manualImportFiles[0].selectedFiles) {
      findInTreeAndToggleSelected(
        file.abs,
        $repo.commits.find((c) => c.hash == file.commitHash).fileTree,
        true
      )
    }
    $repo.commits = [...$repo.commits]
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

  function notifications() {
    let progressPerCommit = new Map()
    window.loader.onDownloadInProgress((event, data) => {
      // console.log(data)
      if (data.message != '') {
        // if there is a message, just forward it to the footer
        footerMessage = data.message
        return
      } else if (!data.progress) {
        // no message and no data means that message should be cleared
        footerMessage = ''
        return
      }
      // has the download completed?
      if (data.progress.total < 0) {
        progressPerCommit.delete(data.hash)
      } else {
        progressPerCommit.set(data.hash, data)
      }
      downloadingCommits = Array.from(progressPerCommit)
      footerMessage = `Downloading ${downloadingCommits.length} commits...`
    })
  }

  function checkIfActiveAtStart(hashAbbrev) {
    const manualIgnoreCommits = actionsByName(currentActions, 'manualIgnoreCommits')[0]
    return manualIgnoreCommits.ignoredCommits.indexOf(hashAbbrev) < 0
  }

  onMount(() => {
    console.log('Starting app...')
    // resetConfig()
  })
</script>

<svelte:head>
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
  />
</svelte:head>

<!-- Main app structure -->
<main class="container-fluid d-flex vh-100 max-vh100 flex-column" style="max-height: 100vh">
  <!-- Modals -->
  <StaticAlert
    open={newConfigModalOpen}
    dialog={{
      id: 'newConfig',
      title: 'Are you sure you want to start a new config?',
      message: 'You will lose any unsaved changes.',
      confirm: 'Start new config',
      executeOnConfirm: resetConfig
    }}
  />

  <!-- Navbar row -->
  <div class="row container-fluid vw-100 flex-grow-0">
    <!-- Navbar col -->
    <div class="col">
      <nav class="navbar border-bottom border-body">
        <div class="container-fluid justify-content-start">
          <span class="navbar-brand"><h3>RepoToQDA</h3></span>
          <button
            data-bs-toggle="modal"
            data-bs-target="#newConfig"
            class="btn btn-outline-primary ms-auto"
            type="button"
            on:click={() => (newConfigModalOpen = true)}
            ><i class="bi bi-file-plus-fill"></i> New config
          </button>

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
        </div>
      </nav>
    </div>
  </div>
  <!-- Main content row -->
  <div class="row flex-grow-1 py-2 g-2">
    <!-- Left col -->
    <div class="col d-flex flex-column">
      <!-- Top left row+col -->
      <div class="row" style:height={repoInfoLoaded ? '23%' : '35%'}>
        <div class="col d-flex">
          {#key repoLoader}
            <RepoLoader on:repoDataLoaded={displayRepoData} on:startLoading={notifications} />
          {/key}
        </div>
      </div>

      <!-- Bottom left row+col -->
      {#if repoInfoLoaded}
        <div class="row flex-grow-1">
          <div class="col d-flex">
            <Pane>
              <div slot="header" class="d-flex flex-grow-0 align-items-center w-100">
                <div class="mt-1">
                  <b>Actions</b>
                </div>
                <div class="ms-auto">
                  <div class="dropdown">
                    <button
                      id="addActionDropdownBtn"
                      class="btn btn-primary btn-sm dropdown-toggle"
                      type="button"
                      aria-expanded={actionDropdown}
                      on:click={() => {
                        actionDropdown = !actionDropdown
                      }}
                    >
                      <!-- aria-expanded="false" -->
                      <i class="bi bi-plus-circle"></i> Add action
                    </button>
                    <ul
                      class="dropdown-menu"
                      use:clickOutside
                      on:click_outside={dismissAddActionsDropdown}
                      class:show={actionDropdown}
                    >
                      <li>
                        <button
                          class="dropdown-item"
                          type="button"
                          on:click={addApplyCodeCommitGlob}
                          >Apply codes to commits by pattern</button
                        >
                      </li>
                      <li>
                        <button class="dropdown-item" type="button" on:click={addImportFilesByGlob}
                          >Import files by glob pattern</button
                        >
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div slot="body">
                <div class="list-group">
                  <ActionListitem
                    action={actionByName(currentActions, 'manualIgnoreCommits')}
                    on:actionUpdated={updateQdpxPreview}
                  />

                  <ActionListitem
                    action={actionByName(currentActions, 'manualImportFiles')}
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

                  {#each actionsByName(currentActions, 'importFilesByGlob') as action (action.guid)}
                    <ActionImportFilesByGlob
                      {action}
                      commitsToProcess={allCommitsToProcess}
                      on:actionUpdated={updateQdpxPreview}
                      on:actionDeleted={removeImportFilesByGlob}
                    />
                  {/each}
                </div>
              </div>
            </Pane>
          </div>
        </div>
      {/if}
    </div>

    <!-- Center col -->
    <div class="col d-flex overflow-hidden">
      <Pane>
        <div slot="header"><b>Source commits</b></div>
        <div slot="body">
          {#if repoInfoLoaded}
            {#each $repo.commits as commit (commit.hashAbbrev)}
              <CommitListItem
                {commit}
                {userRepoInfo}
                activeAtStart={checkIfActiveAtStart(commit.hashAbbrev)}
                on:toggleIncluded={toggleIncludedCommit}
                on:fileToggled={updateQdpxPreview}
              />
            {/each}
          {:else}
            <p id="gitData">Waiting for repo data.</p>
          {/if}
        </div>
      </Pane>
    </div>

    <!-- Right col -->
    <div class="col d-flex flex-column">
      <QdpxPreview qdpxData={qdpx} />
    </div>
  </div>

  <!-- Footer row: notifications area -->
  <div
    class="row container-fluid vw-100 flex-grow-0 p-2"
    class:text-bg-secondary={footerMessage == ''}
    class:text-bg-warning={footerMessage != ''}
  >
    <div class="col">
      {#if footerMessage != ''}
        <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
        {footerMessage}
      {:else}
        Footer
      {/if}
    </div>
  </div>
</main>
