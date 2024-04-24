<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { slide } from 'svelte/transition'
  import { FolderCheck, HardDriveDownload } from 'lucide-svelte'

  import Pane from './Pane.svelte'
  import Button from './Button.svelte'
  import { repo } from '../stores'

  const dispatch = createEventDispatcher()

  let confirmedRepoInfo = ''
  let confirmPromise = null
  export let loadPromise = null

  async function checkRepoInfo(): Promise<void> {
    // processes base github url, .git urls or just user/reponame pairs
    if ($repo.userRepoInfo.startsWith('https://github.com/')) {
      $repo.userRepoInfo = $repo.userRepoInfo.substring(19)
      if ($repo.userRepoInfo.endsWith('.git')) {
        $repo.userRepoInfo = $repo.userRepoInfo.slice(0, -4)
      }
    }
    if ($repo.userRepoInfo.endsWith('/')) {
      $repo.userRepoInfo = $repo.userRepoInfo.slice(0, -1)
    }
    confirmPromise = window.loader.checkRepoInfo($repo.userRepoInfo)
    confirmedRepoInfo = await confirmPromise
  }

  async function loadRepo(): Promise<void> {
    dispatch('startLoading')
    loadPromise = window.loader.loadRepoData($repo.userRepoInfo)
    $repo.commits = await loadPromise
    dispatch('repoDataLoaded', {
      commits: $repo.commits,
      userRepoInfo: $repo.userRepoInfo
    })
  }
</script>

<Pane successClass={$repo.commits.length > 0} title="Repository loader" class="my-auto me-auto ms-auto w-1/3">
  <div slot="body" class="flex flex-col">
    {#if $repo.commits.length == 0}
      {#if confirmedRepoInfo == ''}
        <p>The tool will load commits from the GitHub repository below.</p>
        <input
          type="text"
          placeholder="myUsername/myRepo"
          aria-label="my username / my repo"
          aria-describedby="button-addon2"
          id="repoInfo"
          bind:value={$repo.userRepoInfo}
          class="my-2 dark:bg-stone-800"
          class:disabled={confirmedRepoInfo != ''}
          disabled={confirmedRepoInfo != ''} />
        {#if confirmedRepoInfo == ''}
          <Button primary id="checkRepo" on:click={checkRepoInfo} class="my-2"
            ><FolderCheck class="me-2" /> Check repo</Button>
        {/if}
      {/if}

      {#if confirmPromise != null}
        {#await confirmPromise then}
          {#if loadPromise == null && $repo.commits.length == 0}
            <p>Repository is validated. Click to load commits info from GitHub or from a local cache, if available.</p>
            <Button primary type="button" id="loadRepo" on:click={loadRepo} class="my-2">
              <HardDriveDownload class="me-2" /> Load data
            </Button>
          {/if}
        {:catch error}
          <small id="helpId" class="form-text">{error.message}</small>
        {/await}
      {/if}
    {:else}
      <p>Information loaded for repository <strong>{$repo.userRepoInfo}</strong>.</p>
    {/if}
  </div>
  <div slot="footer">
    {#if confirmPromise != null && confirmedRepoInfo == ''}
      <div transition:slide class="bg-f-warn px-4 py-2 text-c-black" role="status">
        Checking if repository is available...
      </div>
    {/if}
    {#if loadPromise != null && $repo.commits.length == 0}
      <div transition:slide class="bg-f-warn px-4 py-2 text-c-black" role="status">Preparing repository data...</div>
    {/if}
  </div>
</Pane>
