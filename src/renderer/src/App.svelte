<script lang="ts">
  import { onMount } from 'svelte'
  import { Modal } from 'bootstrap'

  import QdpxPreview from './components/QDPXPreview.svelte'
  import RepoLoader from './components/RepoLoader.svelte'
  import ActionListitem from './components/ActionListitem.svelte'
  import CommitListItem from './components/CommitListItem.svelte'
  import ActionApplyCodeCommitGlob from './components/ActionApplyCodeCommitGlob.svelte'
  import ActionImportFilesByGlob from './components/ActionImportFilesByGlob.svelte'
  import StaticAlert from './components/StaticAlert.svelte'
  import WaitingModal from './components/WaitingModal.svelte'
  import Pane from './components/Pane.svelte'

  import type { Commit, RepoDirent, AppliedCode, Action } from '../../types'
  import { clickOutside } from './clickOutside'
  import { ActionDB } from './actions'
  import { repo, codeOptions, settings } from './stores'
  import NotificationFooter from './components/NotificationFooter.svelte'
  import type { PathLike } from 'fs-extra'

  const defaultQdpx = { sources: [], codes: [], commits: [] }

  let actionDropdown = false
  let commitsToProcess: Commit[] = []
  let actions = new ActionDB()
  let qdpx = { ...defaultQdpx }
  let repoInfoReady = false
  let repoLoader = {}
  let userRepoInfo = ''
  let footer: NotificationFooter
  let repoLoadingPromise = null

  function onLoadedRepoData(): void {
    // called when repo data is loaded via the repo loader gui
    actions = new ActionDB()
    repoDataIsReady()
  }

  function repoDataIsReady(): void {
    userRepoInfo = $repo.userRepoInfo
    commitsToProcess = [...$repo.commits]
    repoInfoReady = true
    updateQdpx()
  }

  function toggleIncludedCommit(event: CustomEvent): void {
    const hash = event.detail.hash
    const checked = event.detail.checked
    if (!checked) {
      actions.manualIgnoreCommits.ignoredCommits = [
        ...actions.manualIgnoreCommits.ignoredCommits,
        hash
      ]
    } else {
      actions.manualIgnoreCommits.ignoredCommits = [
        ...actions.manualIgnoreCommits.ignoredCommits.filter((h) => h != hash)
      ]
    }
    updateQdpx()
  }

  function commitEncoded(): void {
    updateQdpx()
  }

  async function updateQdpx(): Promise<void> {
    let sources = []
    if (actions.manualIgnoreCommits.active) {
      commitsToProcess = [
        ...$repo.commits.filter(
          (v) => actions.manualIgnoreCommits.ignoredCommits.indexOf(v.hash) < 0
        )
      ]
    } else {
      commitsToProcess = [...$repo.commits]
    }

    if (actions.manualImportFiles.active) {
      actions.manualImportFiles.selectedFiles = []
      for (const commit of commitsToProcess) {
        for (const file of getAllSelectedFiles(commit.fileTree)) {
          actions.manualImportFiles.selectedFiles.push(file)
          const ext = file.name.split('.')[file.name.split('.').length - 1]
          if ($settings.supportedTextExts.indexOf(ext) >= 0) {
            const content = await window.files.readFileAtCommit(file.rel, commit.hash)
            const fileTitle = `${file.rel} @ #${commit.hash.substring(0, 7)}`
            const contentWithHeader = `title:  ${fileTitle}\n\n${content}`
            sources.push({
              parent: 'copyTextSource',
              content: contentWithHeader,
              originalExt: ext,
              abs: file.abs,
              name: fileTitle
            })
          }
        }
      }
    } else {
      commitsToProcess = [...$repo.commits]
    }

    if (actions.manualImportFolderText.active) {
      actions.manualImportFolderText.selectedFolders = []
      for (const commit of commitsToProcess) {
        for (const folder of getAllSelectedFolders(commit.fileTree)) {
          actions.manualImportFolderText.selectedFolders.push(folder)
          const filesInFolder = getAllFilesInFolder(folder)
          let compilationSource = {
            parent: 'compilationSource',
            content: `# Compilation for ${folder.rel} @ #${commit.hashAbbrev}`,
            originalExt: 'md',
            abs: folder.abs,
            name: `${folder.rel} @ ${commit.hash.substring(0, 7)}`
          }
          for (const file of filesInFolder) {
            const ext = file.name.split('.')[file.name.split('.').length - 1]
            if ($settings.supportedTextExts.indexOf(ext) >= 0) {
              compilationSource.content += `\n\n## [${file.rel}]\n\n`
              if (ext == 'md') {
                compilationSource.content += await window.files.readFileAtCommit(
                  file.rel,
                  commit.hash
                )
              } else {
                const fileData = await window.files.readFileAtCommit(file.rel, commit.hash)
                compilationSource.content += `\`\`\`\n${fileData}\`\`\``
              }
            }
          }
          sources.push(compilationSource)
        }
      }
    } else {
      commitsToProcess = [...$repo.commits]
    }

    if (actions.devlogCompilation.active) {
      const dScs = commitsToProcess.map((commit) => commit.hash)
      const compilationSource = await window.loader.getDevlogCompilation({
        selectedCommits: [...dScs]
      })
      sources.push(compilationSource)
    }

    if (actions.individualCommitDevlog.active) {
      for (const commit of commitsToProcess) {
        const newSource = await window.loader.getDevlogForCommit(commit.hash, {})
        newSource.parent = 'devlog'
        sources.push(newSource)
      }
    }

    const allCodesToSendToQDPXExport: AppliedCode[] = []

    // encode commits manually
    if (actions.manualEncodeCommits.active) {
      for (const codeInAction of actions.manualEncodeCommits.codesToApply) {
        const getCodeOnExportList = allCodesToSendToQDPXExport.filter(
          (c) => c.code.value == codeInAction.code.value
        )
        if (getCodeOnExportList.length == 1) {
          getCodeOnExportList[0].commitHashes = [
            ...getCodeOnExportList[0].commitHashes,
            ...commitsToProcess
              .filter((c) => codeInAction.commitHashes.findIndex((ca) => ca == c.hash) >= 0)
              .map((r) => r.hash)
          ]
        } else {
          allCodesToSendToQDPXExport.push({
            code: { ...codeInAction.code },
            commitHashes: [
              ...commitsToProcess
                .filter((c) => codeInAction.commitHashes.findIndex((ca) => ca == c.hash) >= 0)
                .map((r) => r.hash)
            ]
          })
        }
      }
    }

    const allApplyCodeCommitByGlob = actions.getAll('applyCodeCommitGlob')
    for (const act of allApplyCodeCommitByGlob) {
      if (act.active) {
        for (const selectedCode of act.codesToApply) {
          const getCodeOnExportList = allCodesToSendToQDPXExport.filter(
            (c) => c.code.value == selectedCode.code.value
          )
          if (getCodeOnExportList.length == 1) {
            getCodeOnExportList[0].commitHashes = getCodeOnExportList[0].commitHashes.concat(
              selectedCode.commitHashes
            )
          } else {
            allCodesToSendToQDPXExport.push({
              code: { ...selectedCode.code },
              commitHashes: act.selectedCommits.map((sc) => sc.hash)
            })
          }
        }
      }
    }

    const allImportFilesByGlob = actions.getAll('importFilesByGlob')
    for (const act of allImportFilesByGlob) {
      if (act.active) {
        for (const file of act.selectedFiles) {
          const content = await window.files.readFileAtCommit(file.name, file.commitHash)
          const fileTitle = `${file.name} @ #${file.commitHash.substring(0, 7)}`
          const contentWithHeader = `title:  ${fileTitle}\n\n${content}`
          sources.push({
            parent: 'copyTextSource',
            originalExt: file.name.split('.')[file.name.split('.').length - 1],
            content: contentWithHeader,
            name: fileTitle
          })
        }
      }
    }
    qdpx = {
      commits: [...commitsToProcess],
      sources: [...sources],
      codes: [...allCodesToSendToQDPXExport]
    }
  }

  function dismissAddActionsDropdown(event: CustomEvent): void {
    //console.log(event)
    if (actionDropdown && event.detail.target.id != 'addActionDropdownBtn') {
      actionDropdown = false
    }
  }

  function getAllSelectedFolders(directory: RepoDirent[]): RepoDirent[] {
    let selected = []
    for (const dirent of directory) {
      if (dirent.children?.length > 0) {
        // is folder
        if (dirent.selected) {
          selected.push(dirent)
        }
        selected.push(...getAllSelectedFolders(dirent.children))
      }
    }
    return [...selected]
  }

  function getAllSelectedFiles(directory: RepoDirent[]): RepoDirent[] {
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

  function getAllFilesInFolder(folder: RepoDirent): RepoDirent[] {
    let selected = []
    for (const dirent of folder.children) {
      if (dirent.children?.length > 0) {
        // is folder
        selected.push(...getAllFilesInFolder(dirent))
      } else if (!dirent.children) {
        // is file
        selected.push(dirent)
      }
    }
    return selected
  }

  function findInTreeAndToggleSelected(abs: PathLike, directory: RepoDirent, value: boolean): void {
    for (const dirent of directory.children) {
      if (dirent.children?.length > 0) {
        // is folder
        if (dirent.abs == abs) {
          dirent.selected = value
          return
        }

        findInTreeAndToggleSelected(abs, dirent, value)
      } else if (!dirent.children && dirent.abs == abs) {
        dirent.selected = value
        return
      }
    }
  }

  function resetConfig(): void {
    $repo.userRepoInfo = ''
    $repo.commits = []
    repoLoader = {}
    repoInfoReady = false
    commitsToProcess = []
    actions = new ActionDB()
    qdpx = { ...defaultQdpx }
  }

  async function loadConfig(): Promise<void> {
    let loadOptions = {
      title: `Load RepoToQDA config...`
    }
    let res = JSON.parse(await window.loader.loadDialog(loadOptions))
    const waitingModal = Modal.getInstance('#waitingLoadData')
    if (!res) {
      waitingModal.toggle()
      return
    }
    resetConfig()
    $repo.userRepoInfo = res.userRepoInfo
    $repo.commits = await window.loader.loadRepoData($repo.userRepoInfo)
    actions.current = [...(res.actions as Action[])]
    for (const file of actions.manualImportFiles.selectedFiles) {
      findInTreeAndToggleSelected(
        file.abs,
        $repo.commits.find((c) => c.hash == file.commitHash).fileTree,
        true
      )
    }
    for (const folder of actions.manualImportFolderText.selectedFolders) {
      findInTreeAndToggleSelected(
        folder.abs,
        $repo.commits.find((c) => c.hash == folder.commitHash).fileTree,
        true
      )
    }
    $repo.commits = [...$repo.commits]
    const allApplyCodeCommitByGlob = actions.getAll('applyCodeCommitGlob')
    for (const act of allApplyCodeCommitByGlob) {
      $codeOptions = [...$codeOptions, ...act.codesToApply.map((ca) => ca.code)]
    }
    waitingModal.toggle()
    repoDataIsReady()
    updateQdpx()
  }

  async function saveConfig(): Promise<void> {
    let saveOptions = {
      title: `Save RepoToQDA config...`,
      data: {
        userRepoInfo: userRepoInfo,
        actions: [...actions.current]
      }
    }
    await window.loader.saveDialog(saveOptions)
  }

  function deleteActionFromList(event: CustomEvent): void {
    actions.current = actions.removeFrom(event.detail.action)
    updateQdpx()
  }

  function checkIfActiveAtStart(hash): boolean {
    return actions.manualIgnoreCommits.ignoredCommits.indexOf(hash) < 0
  }

  function toggleDropdown(): void {
    actionDropdown = !actionDropdown
  }

  onMount(() => {
    console.log('Starting app...')
    footer.setup()
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
    dialog={{
      id: 'newConfig',
      title: 'Are you sure you want to start a new config?',
      message: 'You will lose any unsaved changes.',
      confirm: 'Start new config',
      executeOnConfirm: resetConfig
    }}
  />
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
            ><i class="bi bi-file-plus-fill"></i> New config
          </button>

          <button
            class="btn btn-outline-primary ms-2"
            data-bs-toggle="modal"
            data-bs-target="#loadConfig"
            type="button"><i class="bi bi-file-arrow-up-fill"></i> Load config</button
          >

          <button class="btn btn-outline-primary ms-2" type="button" on:click={saveConfig}
            ><i class="bi bi-file-arrow-down-fill"></i> Save config</button
          >

          {#if $repo.commits.length > 0}
            <button
              type="button"
              class="btn btn-outline-primary ms-2"
              on:click={() => navigator.clipboard.writeText(JSON.stringify($repo.commits))}
              ><i class="bi bi-clipboard-plus"></i> Copy commit data to clipboard</button
            >
          {/if}
        </div>
      </nav>
    </div>
  </div>
  <!-- Main content row -->
  <div class="row flex-grow-1 py-2 g-2">
    <!-- Left col -->
    <div class="col d-flex flex-column">
      <!-- Top left row+col -->
      <div class="row" style:height={repoInfoReady ? '23%' : '35%'}>
        <div class="col d-flex">
          {#key repoLoader}
            <RepoLoader
              on:repoDataLoaded={onLoadedRepoData}
              bind:loadPromise={repoLoadingPromise}
            />
          {/key}
        </div>
      </div>

      <!-- Bottom left row+col -->
      {#if repoInfoReady}
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
                      on:click={toggleDropdown}
                    >
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
                          on:click={() => {
                            actions.current = actions.addApplyCodeCommitGlobTo()
                            actionDropdown = false
                          }}>Apply codes to commits by pattern</button
                        >
                      </li>
                      <li>
                        <button
                          class="dropdown-item"
                          type="button"
                          on:click={() => {
                            actions.current = actions.addImportFilesByGlobTo()
                            actionDropdown = false
                          }}>Import files by glob pattern</button
                        >
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div slot="body">
                <div class="list-group">
                  {#each [actions.manualIgnoreCommits, actions.manualImportFiles, actions.manualImportFolderText, actions.devlogCompilation, actions.individualCommitDevlog, actions.manualEncodeCommits] as action (action.guid)}
                    <ActionListitem {action} on:actionUpdated={updateQdpx} />
                  {/each}

                  {#each actions.getAll('applyCodeCommitGlob') as action (action.guid)}
                    <ActionApplyCodeCommitGlob
                      {action}
                      {commitsToProcess}
                      on:actionUpdated={updateQdpx}
                      on:actionDeleted={deleteActionFromList}
                    />
                  {/each}

                  {#each actions.getAll('importFilesByGlob') as action (action.guid)}
                    <ActionImportFilesByGlob
                      {action}
                      on:actionUpdated={updateQdpx}
                      on:actionDeleted={deleteActionFromList}
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
          {#if repoInfoReady}
            {#each $repo.commits as commit (commit.hash)}
              <CommitListItem
                {commit}
                {userRepoInfo}
                encodingAction={actions.manualEncodeCommits}
                activeAtStart={checkIfActiveAtStart(commit.hash)}
                on:toggleIncluded={toggleIncludedCommit}
                on:fileToggled={updateQdpx}
                on:folderToggled={updateQdpx}
                on:commitEncoded={commitEncoded}
                promise={repoLoadingPromise}
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
  <NotificationFooter bind:this={footer} />
</main>
