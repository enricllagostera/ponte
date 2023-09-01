<script>
  import { createEventDispatcher } from 'svelte'
  import Svelecte from 'svelecte'
  import { minimatch } from 'minimatch'

  export let action
  export let commitsToProcess
  export let allCodeOptions

  const dispatch = createEventDispatcher()

  function onChanged() {
    dispatch('actionUpdated', {
      action: action
    })
  }

  function onDeleted() {
    dispatch('actionDeleted', {
      action: action
    })
  }

  action.options = []
  action.selectedCommits = []
  action.codesToApply = []

  function matchCommitBySubjectAndBody(event) {
    if (event.target.value.length >= 0) {
      const subjectAndBodyArray = []
      commitsToProcess.forEach((c) => {
        if (minimatch(`${c.subject}\n${c.body}`, `**${event.target.value}**`)) {
          subjectAndBodyArray.push({
            hashAbbrev: c.hashAbbrev,
            subject: `${c.subject}`
          })
        }
      })
      action.selectedCommits = subjectAndBodyArray
    }
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
    <div class="input-group mb-3">
      <div class="input-group-text"><i class="bi bi-git"></i></div>
      <input
        type="text"
        name="selectionGlob"
        id="tagCommitsByGlob-selectionGlob"
        on:change={matchCommitBySubjectAndBody}
        on:input={matchCommitBySubjectAndBody}
        class="form-control"
        placeholder="Type pattern to select commits (e.g. fix)"
      />
    </div>

    <!-- <label for="tags">Codes to apply</label> -->
    <div class="input-group mb-3">
      <div class="input-group-text"><i class="bi bi-tags"></i></div>
      <Svelecte
        options={allCodeOptions}
        creatable
        keepCreated
        multiple
        allowEditing="true"
        inputId="tagCommitByGlob"
        bind:readSelection={action.codesToApply}
        placeholder="Type or click to add or select codes"
      ></Svelecte>
    </div>

    <div class="card text-bg-secondary-subtle">
      <div class="card-header">
        <h6>Commits selected ({action.selectedCommits.length})</h6>
      </div>
      <ul class="list-group list-group-flush">
        {#each action.selectedCommits as tag}
          <li class="list-group-item">#{tag.hashAbbrev} - {tag.subject}</li>
        {/each}
      </ul>
      <div class="card-header">
        <h6>Codes to apply ({action.codesToApply.length})</h6>
      </div>
      <ul class="list-group list-group-flush">
        {#each action.codesToApply as code}
          <li class="list-group-item">{code.value}</li>
        {/each}
      </ul>
    </div>

    {#if action.selectedCommits.length > 0 && action.codesToApply.length > 0}
      <div class="card-body">
        <div class="d-grid gap-2">
          <button
            class="btn btn-outline-primary"
            type="button"
            id="applyCodeCommitGlob-execute"
            on:click={onChanged}><i class="bi bi-tags"></i> Apply codes</button
          >
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
</style>
