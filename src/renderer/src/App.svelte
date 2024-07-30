<script lang="ts">
  import { onMount } from 'svelte'
  import { FilePlus, FolderOpen, Save, Trash2 } from 'lucide-svelte'

  import RepoLoader from './components/RepoLoader.svelte'
  import NotificationFooter from './components/NotificationFooter.svelte'
  import Button from './components/Button.svelte'
  import Dialog from './components/Dialog.svelte'
  import MainTabs from './components/MainTabs.svelte'

  import { ActionDB } from './actions'
  import {
    autoencoders,
    allCodes,
    codesInCommit,
    commitsInCode,
    getCommitsInCode,
    addEncodingToCommits,
    getCodeIdByValue
  } from './stores/codes'
  import { repo, settings, appStates, initDevlogs } from './stores/stores'
  import {
    addAnnotation,
    annotations,
    getAnnotationContent,
    hasAnnotationForReference,
    removeAnnotation,
    updateAnnotation
  } from './stores/annotations'
  import { allSources, loadDevlogCompilation, resetSources } from './stores/sources'

  let repoLoader = {}
  let repoLoadingPromise = null
  let footer: NotificationFooter
  let newConfigDialog: Dialog
  let loadConfigDialog: Dialog

  $appStates.actions = new ActionDB()
  $settings.darkTheme = false

  function onLoadedRepoData(): void {
    $appStates.actions = new ActionDB()
    repoDataIsReady()
  }

  async function repoDataIsReady(): Promise<void> {
    $appStates.repoReady = true
    $appStates.updateQDPX()
    initDevlogs()
    await loadDevlogCompilation()
  }

  function resetConfig(): void {
    $repo.userRepoInfo = 'enricllagostera/ponte'
    $repo.commits = []
    repoLoader = {}
    $appStates.repoReady = false
    repoLoadingPromise = null
    $appStates.actions = new ActionDB()
    $allCodes.clear()
    commitsInCode.clear()
    codesInCommit.clear()
    $autoencoders = {
      onChangeEncoders: [],
      onSubjectEncoders: [],
      onDevlogEncoders: []
    }
    resetSources()
  }

  function findFirstCodeWithName(collection: [], targetCode) {
    let sameName = collection.filter((c) => targetCode.value == c.value)
    if (sameName.length > 0) {
      //console.log('loading same name: ', targetCode.value)
      return { ...sameName[0] }
    } else {
      return { ...targetCode }
    }
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
    $autoencoders = res.autoencoders
    $annotations = res.annotations
    resetSources(res.sourcesInfo)

    res.codesDB.forEach(([cd, co]) => {
      $allCodes.set(cd, co)
    })

    let groupedCodes = new Map()

    $allCodes.forEach((v, k) => {
      if (!groupedCodes.has(v.value)) {
        groupedCodes.set(v.value, [v])
      } else {
        groupedCodes.get(v.value).push(v)
      }
    })
    console.log(groupedCodes)

    res.commitsInCode.forEach(({ id, commitHashes }) => {
      let namedCode = $allCodes.get(id).value
      addEncodingToCommits(groupedCodes.get(namedCode)[0].id, commitHashes)
    })

    groupedCodes.forEach((codesInGroup, gk) => {
      let firstCodeReferenceId = codesInGroup[0].id
      if (!hasAnnotationForReference(firstCodeReferenceId)) {
        addAnnotation(firstCodeReferenceId, 'code', '')
      }
      let codesToRemove = codesInGroup.filter((code) => code.id != firstCodeReferenceId)
      for (const removing of codesToRemove) {
        let annotationContentForCode = $annotations.find((a) => a.reference == removing.id)?.content ?? ''
        updateAnnotation(
          firstCodeReferenceId,
          getAnnotationContent(firstCodeReferenceId) + '\n\n' + annotationContentForCode
        )
        removeAnnotation(removing.id)
        $allCodes.delete(removing.id)
      }
    })

    repoDataIsReady()
  }

  async function saveConfig(): Promise<void> {
    let serializedCodes = []
    for (const [codeName, codeValue] of $allCodes) {
      serializedCodes.push([codeName, codeValue])
    }
    let serializedCommitsInCode = []
    for (const [codeId, codeValue] of serializedCodes) {
      serializedCommitsInCode.push({ id: codeId, commitHashes: getCommitsInCode(codeId) })
    }
    const serializedSources = $allSources.map((s) => {
      const res = { ...s }
      if (res.children != undefined) {
        delete res.children
      }
      delete res.content
      return res
    })
    let saveOptions = {
      title: `Save Ponte config...`,
      data: {
        userRepoInfo: $repo.userRepoInfo,
        commitsInCode: serializedCommitsInCode,
        codesDB: serializedCodes,
        autoencoders: $autoencoders,
        sourcesInfo: serializedSources,
        annotations: [...$annotations]
      }
    }
    saveOptions = JSON.parse(JSON.stringify(saveOptions))
    await window.loader.saveDialog(saveOptions)
  }

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
    </nav>
  </div>

  <!-- Main content row -->
  <div class="flex h-full w-screen overflow-hidden px-2">
    {#if $appStates.repoReady == false}
      <!-- Left col -->
      <div class="h-100 flex w-full flex-col">
        <!-- Top left row+col -->
        {#key repoLoader}
          <RepoLoader on:repoDataLoaded={onLoadedRepoData} bind:loadPromise={repoLoadingPromise} />
        {/key}
      </div>
    {/if}

    {#key $appStates.repoReady}
      {#if $appStates.repoReady}
        <MainTabs></MainTabs>
      {/if}
    {/key}
  </div>

  <!-- Footer row: notifications area -->
  <NotificationFooter bind:this={footer} />
</main>
