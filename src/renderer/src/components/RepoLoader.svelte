<script>
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let repoInfoInput = 'enricllagostera/g2k'
  let confirmedRepoInfo = ''
  let confirmPromise = null
  let loadPromise = null
  let loadResponse = ''

  async function checkRepoInfo() {
    confirmPromise = window.loader.checkRepoInfo(repoInfoInput)
    confirmedRepoInfo = await confirmPromise
  }

  async function loadRepo() {
    loadPromise = window.loader.loadRepoData(repoInfoInput)
    loadResponse = await loadPromise

    dispatch('repoDataLoaded', {
      commits: loadResponse
    })
  }
</script>

<h2>Repository setup</h2>
<p>The tool will load commit information and files from the GitHub repository below.</p>
<div class="input-group mb-3">
  <input
    type="text"
    class="form-control"
    placeholder="myUsername/myRepo"
    aria-label="my username / my repo"
    aria-describedby="button-addon2"
    id="repoInfo"
    bind:value={repoInfoInput}
    class:disabled={confirmedRepoInfo != ''}
    disabled={confirmedRepoInfo != ''}
  />
  {#if confirmedRepoInfo == ''}
    <button class="btn btn-outline-primary" type="button" id="checkRepo" on:click={checkRepoInfo}>
      Check repo
    </button>
  {/if}
</div>

{#if confirmPromise != null}
  {#await confirmPromise}
    <small id="helpId" class="form-text text-muted">Checking GitHub repo...</small>
  {:then confirmedRepoInfo}
    <small id="helpId" class="form-text text-muted"
      >Ready to load data from <strong>{confirmedRepoInfo}</strong>.</small
    >

    {#if loadResponse == ''}
      <button class="btn btn-primary mt-3 mb-3" type="button" id="loadRepo" on:click={loadRepo}>
        Load repo data
      </button>
    {/if}
  {:catch error}
    <small id="helpId" class="form-text text-muted">{error.message}</small>
  {/await}
{:else if loadResponse == ''}<small id="helpId" class="form-text text-muted"
    >Write your GitHub repo information.</small
  >{/if}

<style>
</style>
