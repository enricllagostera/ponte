<script lang="ts">
  import { repo } from '../stores'
  import { createEventDispatcher } from 'svelte'
  import Pane from './Pane.svelte'

  const dispatch = createEventDispatcher()

  let confirmedRepoInfo = ''
  let confirmPromise = null
  export let loadPromise = null

  async function checkRepoInfo() {
    confirmPromise = window.loader.checkRepoInfo($repo.userRepoInfo)
    confirmedRepoInfo = await confirmPromise
  }

  async function loadRepo() {
    dispatch('startLoading')

    loadPromise = window.loader.loadRepoData($repo.userRepoInfo)
    $repo.commits = await loadPromise

    dispatch('repoDataLoaded', {
      commits: $repo.commits,
      userRepoInfo: $repo.userRepoInfo
    })
  }
</script>

<Pane successClass={$repo.commits.length > 0}>
  <div slot="header"><b>Repository setup</b></div>
  <div slot="body">
    {#if $repo.commits.length == 0}
      <p>The tool will load commits from the GitHub repository below.</p>
      {#if confirmedRepoInfo == ''}
        <div class="input-group mb-3">
          <input
            type="text"
            class="form-control"
            placeholder="myUsername/myRepo"
            aria-label="my username / my repo"
            aria-describedby="button-addon2"
            id="repoInfo"
            bind:value={$repo.userRepoInfo}
            class:disabled={confirmedRepoInfo != ''}
            disabled={confirmedRepoInfo != ''}
          />
          {#if confirmedRepoInfo == ''}
            <button
              class="btn btn-outline-primary"
              type="button"
              id="checkRepo"
              on:click={checkRepoInfo}
            >
              Check repo</button
            >
          {/if}
        </div>
      {/if}

      {#if confirmPromise != null}
        {#await confirmPromise then}
          {#if loadPromise == null && $repo.commits.length == 0}
            <button
              class="btn btn-primary mt-3 mb-3"
              type="button"
              id="loadRepo"
              on:click={loadRepo}
            >
              Load data from {$repo.userRepoInfo}
            </button>
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
      <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
      Checking if repository is available...
    {/if}
    {#if loadPromise != null && $repo.commits.length == 0}
      <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
      Preparing repository data...
    {/if}
  </div>
</Pane>
