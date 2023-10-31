<script lang="ts">
  import { onMount } from 'svelte'
  import { Modal } from 'bootstrap'
  import { FilePlus, FolderOpen, Save, SunMoon, Trash2 } from 'lucide-svelte'

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
  import { fs } from './fileSystem'
  import NotificationFooter from './components/NotificationFooter.svelte'
  import type { PathLike } from 'fs-extra'
  import Button from './components/Button.svelte'
  import Dialog from './components/Dialog.svelte'
  import { createDialog } from '@melt-ui/svelte'

  const defaultQdpx = { sources: [], codes: [], commits: [] }

  let actionDropdown = false
  let commitsToProcess: Commit[] = []
  let actions = new ActionDB()
  let qdpx = { ...defaultQdpx }
  let repoInfoReady = false
  let repoLoader = {}
  let repoLoadingPromise = null
  let userRepoInfo = ''
  let footer: NotificationFooter

  // let showNewConfigDialog: boolean = false

  let newConfigDialog: Dialog
  let loadConfigDialog: Dialog

  $settings.darkTheme = false

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
    const dir = directory.children || []
    for (const dirent of dir) {
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
    userRepoInfo = ''
    $repo.userRepoInfo = 'enricllagostera/repo-to-qda'
    $repo.commits = []
    repoLoader = {}
    repoInfoReady = false
    repoLoadingPromise = null
    commitsToProcess = []
    actions = new ActionDB()
    qdpx = { ...defaultQdpx }
  }

  async function loadConfig(): Promise<void> {
    let loadOptions = {
      title: `Load RepoToQDA config...`
    }
    let loadReturn = await window.loader.loadDialog(loadOptions)
    if (!loadReturn) {
      return
    }
    let res = JSON.parse(loadReturn)
    resetConfig()
    $repo.userRepoInfo = res.userRepoInfo
    $repo.commits = await window.loader.loadRepoData($repo.userRepoInfo)
    actions.current = [...(res.actions as Action[])]
    for (const file of actions.manualImportFiles.selectedFiles) {
      findInTreeAndToggleSelected(
        file.rel,
        {
          name: '',
          rel: '',
          selected: false,
          children: $repo.commits.find((c) => c.hash == file.commitHash).fileTree as RepoDirent[]
        },
        true
      )
    }
    for (const folder of actions.manualImportFolderText.selectedFolders) {
      findInTreeAndToggleSelected(
        folder.rel,
        {
          name: '',
          rel: '',
          selected: false,
          children: $repo.commits.find((c) => c.hash == folder.commitHash).fileTree as RepoDirent[]
        },
        true
      )
    }
    $repo.commits = [...$repo.commits]
    const allApplyCodeCommitByGlob = actions.getAll('applyCodeCommitGlob')
    for (const act of allApplyCodeCommitByGlob) {
      $codeOptions = [...$codeOptions, ...act.codesToApply.map((ca) => ca.code)]
    }
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

  function toggleTheme(): void {
    $settings.darkTheme = !$settings.darkTheme

    if ($settings.darkTheme) {
      document.querySelector('html').classList.add('dark')
    } else {
      document.querySelector('html').classList.remove('dark')
    }
  }

  onMount(() => {
    console.log('Starting app...')
    footer.setup()
  })
</script>

<svelte:head>
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'" />
</svelte:head>

<!-- Main app structure -->
<main class="flex flex-col w-screen h-screen">
  <!-- Navbar row -->
  <div class="flex grow-0 w-screen">
    <!-- Navbar col -->
    <nav class="flex w-screen p-2 items-center">
      <h3 class="font-black text-3xl ps-4 me-20">RepoToQDA</h3>
      {#if $repo.commits.length == 0}
        <Button on:click={() => window.files.forceClearCache()}>
          <Trash2 class="me-2" />Clear local caches (all repos)
        </Button>
      {/if}

      <Button on:click={toggleTheme} class="ms-auto"><SunMoon class="me-2" />Toggle theme</Button>

      <Dialog title="New config?" onConfirm={resetConfig} bind:this={newConfigDialog} />
      <Button on:click={() => newConfigDialog.trigger()}
        ><FilePlus class="me-2" />New config</Button>

      <Button on:click={saveConfig}><Save class="me-2" />Save config</Button>

      <Dialog
        title="Are you sure you want to load config from a file?"
        onConfirm={loadConfig}
        bind:this={loadConfigDialog} />
      <Button on:click={() => loadConfigDialog.trigger()}
        ><FolderOpen class="me-2" />Open config</Button>

      {#if $repo.commits.length > 0}
        <Button
          on:click={() => navigator.clipboard.writeText(JSON.stringify($repo.commits))}
          title="">Copy commit data to clipboard</Button>
      {/if}
    </nav>
  </div>

  <!-- Main content row -->
  <div class="flex px-2 w-screen h-full overflow-hidden">
    <!-- Left col -->
    <div class="flex flex-col h-100 w-1/4 min-w-[200px]">
      <!-- Top left row+col -->
      {#key repoLoader}
        <RepoLoader
          on:repoDataLoaded={onLoadedRepoData}
          bind:loadPromise={repoLoadingPromise}
          class="grow-0 h-auto" />
      {/key}

      <!-- Bottom left row+col -->
      {#if repoInfoReady}
        <!-- The min-h-0 is needed for fbody and footer sizing -->
        <Pane title="Actions" class="grow min-h-0">
          <div slot="body">
            {#each [actions.manualIgnoreCommits, actions.manualImportFiles, actions.manualImportFolderText, actions.devlogCompilation, actions.individualCommitDevlog, actions.manualEncodeCommits] as action (action.guid)}
              <ActionListitem {action} on:actionUpdated={updateQdpx} />
            {/each}

            {#each actions.getAll('applyCodeCommitGlob') as action (action.guid)}
              <ActionApplyCodeCommitGlob
                {action}
                {commitsToProcess}
                on:actionUpdated={updateQdpx}
                on:actionDeleted={deleteActionFromList} />
            {/each}
          </div>
          <div slot="footer">
            <Button
              id="addActionDropdownBtn"
              class="btn btn-primary btn-sm dropdown-toggle my-2"
              type="button"
              aria-expanded={actionDropdown}
              on:click={toggleDropdown}>
              <i class="bi bi-plus-circle"></i>
              Add action
            </Button>
            <ul
              class="dropdown-menu"
              use:clickOutside
              on:click_outside={dismissAddActionsDropdown}
              class:show={actionDropdown}>
              <li>
                <Button
                  class="dropdown-item my-2"
                  type="button"
                  on:click={() => {
                    actions.current = actions.addApplyCodeCommitGlobTo()
                    actionDropdown = false
                  }}>
                  Apply codes to commits by pattern
                </Button>
              </li>
            </ul>
          </div>
        </Pane>
      {/if}
    </div>

    <!-- Center col -->
    <Pane
      title="Commits{$repo.commits.length > 0 ? ` for ${userRepoInfo}` : ''}"
      class="h-100 w-1/2 max-w-full">
      <div slot="body" class="flex flex-col">
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
              promise={repoLoadingPromise} />
          {/each}
        {:else}
          <p id="gitData">Waiting for repo data.</p>
        {/if}
      </div>
    </Pane>

    <!-- Right col -->
    <QdpxPreview qdpxData={qdpx} class="h-100 w-1/4 min-w-[200px]" />
  </div>

  <!-- Footer row: notifications area -->
  <NotificationFooter bind:this={footer} />
</main>
