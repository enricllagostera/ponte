<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import { minimatch } from 'minimatch'
  import { codeOptions } from '../stores'
  import CodeSelect from './CodeSelect.svelte'

  export let action
  export let commitsToProcess
  // export let allCodeOptions

  const dispatch = createEventDispatcher()

  onMount(() => {
    action.codesToApply = action.codesToApply || []
    action.selectedCommits = action.selectedCommits || []
  })

  function onChanged(event) {
    // action.codesToApply = [...codesToApply]

    dispatch('actionUpdated', {
      action: action
    })
  }

  function onDeleted() {
    dispatch('actionDeleted', {
      action: action
    })
  }

  function updateCodes(codes, options) {
    for (const code of options) {
      let previousOptions = $codeOptions.filter((o) => o.value != code.value)
      $codeOptions = [...previousOptions, ...options]
    }
    action.codesToApply = [...codes]
  }

  function codesChanged(event) {
    console.log(event.detail)
    console.log('old', $codeOptions)
    updateCodes(event.detail.codes, event.detail.options)
    dispatch('actionUpdated', {
      action: action
    })
  }

  function matchCommitBySubjectAndBody(event) {
    if (event.target.value.length >= 0) {
      const subjectAndBodyArray = []
      commitsToProcess.forEach((c) => {
        if (minimatch(`${c.subject}\n${c.body}`, `**${event.target.value}**`)) {
          subjectAndBodyArray.push({
            hash: c.hash,
            subject: `${c.subject}`
          })
        }
      })
      action.searchPattern = event.target.value
      action.selectedCommits = subjectAndBodyArray
      dispatch('actionUpdated', {
        action: action
      })
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
        id="{`${action.name}-${action.guid}`}-selectionGlob"
        name="{`${action.name}-${action.guid}`}-selectionGlob"
        on:change={matchCommitBySubjectAndBody}
        on:input={matchCommitBySubjectAndBody}
        value={action.searchPattern}
        class="form-control"
        placeholder="Type pattern to select commits (e.g. fix)"
      />
    </div>

    <!-- <label for="tags">Codes to apply</label> -->
    <CodeSelect
      id="{`${action.name}-${action.guid}`}-codeSelect"
      initialOptions={$codeOptions}
      initialValues={action.codesToApply}
      on:codesChanged={codesChanged}
    />

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
        {#each action.codesToApply as code (code.value)}
          <li class="list-group-item">{code.value}</li>
        {/each}
      </ul>
    </div>
  </div>
</div>

<style>
</style>
