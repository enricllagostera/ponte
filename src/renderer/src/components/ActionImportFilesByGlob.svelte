<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import { repo } from './../stores'
  import { minimatch } from 'minimatch'

  export let action
  export let commitsToProcess
  // export let allCodeOptions

  const dispatch = createEventDispatcher()

  onMount(() => {
    action.selectedCommits = action.selectedCommits || []
    action.selectedFiles = action.selectedFiles || []
    action.inputCommitOption = action.inputCommitOption || 'latest'
  })

  function onChanged(event) {
    //matchFilesByPattern()

    dispatch('actionUpdated', {
      action: action
    })
  }

  function onDeleted() {
    dispatch('actionDeleted', {
      action: action
    })
  }

  function onCommitOptionChanged(event) {
    console.log(action.inputCommitOption)
    matchFilesByPattern()
  }

  function onFilePatternChanged(event) {
    action.searchPattern = event.target.value
    matchFilesByPattern()
  }

  async function matchFilesByPattern(event) {
    // action.searchPattern = event.detail.target.value
    action.selectedFiles = []
    let results = []
    if (action.inputCommitOption == 'latest') {
      let found = await window.files.runGlobOnCommit(action.searchPattern, $repo.commits[0].hash)
      results.push(...found.map((f) => ({ commit: $repo.commits[0].hash, file: f })))
    } else if (action.inputCommitOption == 'any') {
      for (const commit of $repo.commits) {
        let found = await window.files.runGlobOnCommit(action.searchPattern, commit.hash)
        results.push(...found.map((f) => ({ commit: commit.hash, file: f })))
      }
    }
    action.selectedFiles = [...results]
    dispatch('actionUpdated', {
      action: action
    })
  }

  function scrollToNewAction(node) {
    node.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
</script>

<div class="card my-3" use:scrollToNewAction>
  <div class="card-header" class:text-bg-secondary={!action.active}>
    <div class="row align-items-center">
      <div class="col">
        <div class="form-check form-switch fs-5">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            bind:checked={action.active}
            name={`${action.name}-${action.guid}`}
            on:change={onChanged}
            id={`${action.name}-${action.guid}`}
          />
          <h5 style:display="inline">
            {action.title}
          </h5>
          <button
            class="btn btn-danger"
            type="button"
            id="applyCodeCommitGlob-execute"
            on:click={onDeleted}><i class="bi bi-trash3-fill"></i></button
          >
        </div>
      </div>
    </div>
  </div>
  <div class="card-body">
    <div>{action.description}</div>
  </div>
  <div class="card-body">
    <div>
      <label>
        <input
          name="inputCommitOption"
          value={'latest'}
          bind:group={action.inputCommitOption}
          type="radio"
          on:change={onCommitOptionChanged}
        />
        Pick from latest commit
      </label>
      <label>
        <input
          name="inputCommitOption"
          value={'any'}
          bind:group={action.inputCommitOption}
          type="radio"
          on:change={onCommitOptionChanged}
        />
        Pick all possible commits
      </label>
    </div>
  </div>
  <div class="card-body">
    <div class="input-group mb-3">
      <div class="input-group-text"><i class="bi bi-git"></i></div>
      <input
        type="text"
        id="{`${action.name}-${action.guid}`}-selectionGlob"
        name="{`${action.name}-${action.guid}`}-selectionGlob"
        on:input={onFilePatternChanged}
        value={action.searchPattern}
        class="form-control"
        placeholder={`Type to pick files from ${action.inputCommitOption} commit`}
      />
    </div>

    <div class="card text-bg-secondary-subtle">
      <div class="card-header">
        <h6>Files selected ({action.selectedFiles.length})</h6>
      </div>
      <ul class="list-group list-group-flush">
        {#each action.selectedFiles as file}
          <li class="list-group-item">{file.file} @ {file.commit.substring(0, 7)}</li>
        {/each}
      </ul>
    </div>
  </div>
</div>

<style>
</style>
