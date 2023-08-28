<script>
  import icons from './assets/icons.svg'
  import Versions from './components/Versions.svelte'

  // const getMyName = (async () => {
  //   return await window.loader.onLoaded()
  // })()

  let repoInfoInput = ''
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
  }
</script>

<main class="container-fluid text-left p-3">
  <div class="row align-items-top">
    <div class="col">
      <h2>Left</h2>
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
          <button
            class="btn btn-outline-primary"
            type="button"
            id="checkRepo"
            on:click={checkRepoInfo}
          >
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

          <button class="btn btn-primary mt-3 mb-3" type="button" id="loadRepo" on:click={loadRepo}>
            Load repo data
          </button>
        {:catch error}
          <small id="helpId" class="form-text text-muted">{error.message}</small>
        {/await}
      {:else}<small id="helpId" class="form-text text-muted"
          >Write your GitHub repo information.</small
        >{/if}
    </div>
    <div class="col" class:bg-secondary-subtle={confirmedRepoInfo == ''}>
      <h2>Center</h2>
      {#if confirmedRepoInfo == ''}
        <p id="gitData">Waiting for repo data.</p>
      {:else}
        {#await loadPromise then loadResponse}
          <p>{loadResponse}</p>
        {/await}
        Show repo data.
      {/if}
    </div>
    <div class="col bg-secondary-subtle">
      <h2>Right</h2>
      Waiting for repo data.
    </div>
  </div>
</main>

<style>
</style>
