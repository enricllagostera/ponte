<script>
  import { repo } from '../stores.js'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let repoInfoInput = ''
  let confirmedRepoInfo = ''
  let confirmPromise = null
  let loadPromise = null
  let loadResponse = ''

  async function checkRepoInfo() {
    confirmPromise = window.loader.checkRepoInfo($repo.userRepoInfo)
    confirmedRepoInfo = await confirmPromise
  }

  async function loadRepo() {
    loadPromise = window.loader.loadRepoData($repo.userRepoInfo)
    $repo.commits = JSON.parse(await loadPromise)

    dispatch('repoDataLoaded', {
      commits: $repo.commits,
      userRepoInfo: $repo.userRepoInfo
    })
  }

  function reset() {
    repoInfoInput = ''
    confirmedRepoInfo = ''
    confirmPromise = null
    loadPromise = null
    loadResponse = ''
  }
</script>

<div class="card rounded-0 m-1" class:bg-success-subtle={$repo.commits.length > 0}>
  <div class="card-header rounded-0">
    <h5>Repository setup</h5>
  </div>
  <div class="card-body">
    {#if $repo.commits.length == 0}
      <p>The tool will load commit information and files from the GitHub repository below.</p>
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

      {#if confirmPromise != null}
        {#await confirmPromise then confirmedRepoInfo}
          <small id="helpId" class="form-text"
            >Ready to load data from <strong>{confirmedRepoInfo}</strong>.</small
          >
          <button class="btn btn-primary mt-3 mb-3" type="button" id="loadRepo" on:click={loadRepo}>
            Load repo data
          </button>
        {:catch error}
          <small id="helpId" class="form-text">{error.message}</small>
        {/await}
      {:else if loadResponse == ''}<small id="helpId" class="form-text text-muted"
          >Write your GitHub repo information.</small
        >{/if}
    {:else}
      <p>Information loaded for repository <strong>{$repo.userRepoInfo}</strong>.</p>
    {/if}
  </div>
  {#if confirmPromise != null && confirmedRepoInfo == ''}
    <div class="card-footer">
      <div class="d-flex align-items-center">
        <div class="spinner-border me-2" role="status" aria-hidden="true"></div>
        Checking if repository is available...
      </div>
    </div>{/if}
  {#if loadPromise != null && $repo.commits.length == 0}
    <div class="card-footer">
      <div class="d-flex align-items-center">
        <div class="spinner-border me-2" role="status" aria-hidden="true"></div>
        Loading repository data...
      </div>
    </div>
  {/if}
</div>

<style>
</style>
