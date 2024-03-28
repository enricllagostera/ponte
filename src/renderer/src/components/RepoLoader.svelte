<script lang="ts">
  import { repo } from '../stores'
  import { createEventDispatcher } from 'svelte'
  import Pane from './Pane.svelte'
  import Button from './Button.svelte'
  import { FolderCheck, HardDriveDownload } from 'lucide-svelte'
  import { slide } from 'svelte/transition'

  const dispatch = createEventDispatcher()

  let confirmedRepoInfo = ''
  let confirmPromise = null
  export let loadPromise = null

  async function checkRepoInfo(): Promise<void> {
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

<Pane successClass={$repo.commits.length > 0} title="Repository loader" class={$$restProps.class}>
  <div slot="body">
    {#if $repo.commits.length == 0}
      <p>The tool will load commits from the GitHub repository below.</p>
      {#if confirmedRepoInfo == ''}
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
