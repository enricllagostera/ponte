<script lang="ts">
  import { onMount } from 'svelte'
  import { Copy, FilePlus, FolderOpen, Save, /*SunMoon,*/ Trash2 } from 'lucide-svelte'

  import RepoLoader from './components/RepoLoader.svelte'

  import type { RepoDirent, Action, QDPXData } from '../../types'
  import { ActionDB } from './actions'
  import { repo, codeOptions, settings, appStates, project, initDevlogs } from './stores'
  import NotificationFooter from './components/NotificationFooter.svelte'
  import type { PathLike } from 'fs-extra'
  import Button from './components/Button.svelte'
  import Dialog from './components/Dialog.svelte'

  import MainTabs from './components/MainTabs.svelte'
  import { initCommitEncodingsMap } from './codes'

  const defaultQdpx = { sources: [], codes: [], commits: [] } as QDPXData

  let repoLoader = {}
  let repoLoadingPromise = null
  let userRepoInfo = ''
  let footer: NotificationFooter

  // let showNewConfigDialog: boolean = false

  let newConfigDialog: Dialog
  let loadConfigDialog: Dialog

  $appStates.actions = new ActionDB()
  $project = { ...defaultQdpx }
  $settings.darkTheme = false

  function onLoadedRepoData(): void {
    // called when repo data is loaded via the repo loader gui
    $appStates.actions = new ActionDB()
    repoDataIsReady()
  }

  function repoDataIsReady(): void {
    userRepoInfo = $repo.userRepoInfo
    $appStates.repoReady = true
    $appStates.updateQDPX()
    initCommitEncodingsMap()
    initDevlogs()
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
    $appStates.repoReady = false
    repoLoadingPromise = null
    $appStates.actions = new ActionDB()
    $project = { ...defaultQdpx }
  }

  async function loadConfig(): Promise<void> {
    let loadOptions = {
      title: `Load Ponte config...`
    }
    let loadReturn = await window.loader.loadDialog(loadOptions)
    if (!loadReturn) {
      return
    }
    let res = JSON.parse(loadReturn)
    resetConfig()
    $repo.userRepoInfo = res.userRepoInfo
    $repo.commits = await window.loader.loadRepoData($repo.userRepoInfo)
    $appStates.actions.current = [...(res.actions as Action[])]
    for (const file of $appStates.actions.manualImportFiles.selectedFiles) {
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
    for (const folder of $appStates.actions.manualImportFolderText.selectedFolders) {
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
    const allApplyCodeCommitByGlob = $appStates.actions.getAll('applyCodeCommitGlob')
    for (const act of allApplyCodeCommitByGlob) {
      $codeOptions = [...$codeOptions, ...act.codesToApply.map((ca) => ca.code)]
    }
    repoDataIsReady()
    $appStates.updateQDPX()
  }

  async function saveConfig(): Promise<void> {
    let saveOptions = {
      title: `Save Ponte config...`,
      data: {
        userRepoInfo: userRepoInfo,
        actions: [...$appStates.actions.current]
      }
    }
    await window.loader.saveDialog(saveOptions)
  }

  // function toggleTheme(): void {
  //   $settings.darkTheme = !$settings.darkTheme
  //   if ($settings.darkTheme) {
  //     document.querySelector('html').classList.add('dark')
  //   } else {
  //     document.querySelector('html').classList.remove('dark')
  //   }
  // }

  const versionInfo = `${__VERSION__}-${new Date().toISOString().substring(0, 10).replaceAll('-', '')}`

  onMount(() => {
    console.log('Starting app... Main view: ', $appStates.mainView)
    footer.setup()
  })
</script>

<svelte:head>
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'" />
</svelte:head>

<!-- Main app structure -->
<main class="flex h-screen w-screen flex-col">
  <!-- Navbar row -->
  <div class="flex w-screen grow-0">
    <!-- Navbar col -->
    <nav class="flex w-screen items-center p-2">
      <h3 class="me-20 ps-4 text-3xl font-black">
        Ponte <span class="text-sm font-normal"> v{versionInfo}</span>
      </h3>
      {#if $repo.commits.length == 0}
        <Button on:click={() => window.files.forceClearCache()}>
          <Trash2 class="me-2" /> Clear all local data
        </Button>
      {/if}

      <!-- <Button on:click={toggleTheme} class="me-2 ms-auto"><SunMoon class="me-2" />Toggle theme</Button> -->

      <div class="me-2 ms-auto inline-flex p-0">
        <Dialog title="New config?" onConfirm={resetConfig} bind:this={newConfigDialog} />
        <Button class="border-e-0" on:click={() => newConfigDialog.trigger()}
          ><FilePlus class="me-2" />New config</Button>

        <Dialog
          title="Are you sure you want to load config from a file?"
          onConfirm={loadConfig}
          bind:this={loadConfigDialog} />
        <Button on:click={() => loadConfigDialog.trigger()}><FolderOpen class="me-2" />Open config</Button>

        <Button class="border-s-0" on:click={saveConfig}><Save class="me-2" />Save config</Button>
      </div>

      {#if $repo.commits.length > 0}
        <Button class="me-2" on:click={() => navigator.clipboard.writeText(JSON.stringify($repo.commits))} title=""
          ><Copy class="me-2" /> Copy commit data to clipboard</Button>
      {/if}
    </nav>
  </div>

  <!-- Main content row -->
  <div class="flex h-full w-screen overflow-hidden px-2">
    {#if $appStates.repoReady == false}
      <!-- Left col -->
      <div class="h-100 flex w-1/4 min-w-[200px] flex-col">
        <!-- Top left row+col -->
        {#key repoLoader}
          <RepoLoader
            on:repoDataLoaded={onLoadedRepoData}
            bind:loadPromise={repoLoadingPromise}
            class="h-auto grow-0" />
        {/key}
      </div>
    {/if}

    {#if $appStates.repoReady}
      <MainTabs></MainTabs>
    {/if}
  </div>

  <!-- Footer row: notifications area -->
  <NotificationFooter bind:this={footer} />
</main>
