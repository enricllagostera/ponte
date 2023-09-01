<script>
  import { createEventDispatcher } from 'svelte'
  import { DateTime } from 'luxon'
  import { marked } from 'marked'

  export let commit
  export let userRepoInfo

  let active = true

  const dispatch = createEventDispatcher()
  function onToggleIncluded(hashAbbrev) {
    dispatch('toggleIncluded', {
      hashAbbrev: hashAbbrev
    })
  }
</script>

<div class="card my-3" class:text-bg-secondary={!active}>
  <div class="card-header">
    <i class="bi bi-git"></i> #{commit.hashAbbrev} <i class="bi bi-calendar-event"></i>
    {DateTime.fromMillis(commit.author.timestamp).toISODate()}, approx. {DateTime.fromMillis(
      commit.author.timestamp
    ).toRelative()}
  </div>
  <div class="card-body">
    <h6 class="card-title">{commit.subject}</h6>
    {#if commit.body != ''}
      <div class="commitBody text-secondary">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html marked.parse(commit.body)}
      </div>
    {/if}
  </div>
  <div class="card-footer d-flex d-flex flex-grow-0 align-items-center">
    <div class="mt-1">
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          bind:checked={active}
          on:change={onToggleIncluded(commit.hashAbbrev)}
          id="includeCheckbox_{commit.hashAbbrev}"
        />
        <label for="includeCheckbox_{commit.hashAbbrev}">Include in QDPX</label>
      </div>
    </div>
    <div class="ms-auto">
      <a
        name=""
        id=""
        class="btn btn-primary"
        href={`https://github.com/${userRepoInfo}/tree/${commit.hash}`}
        target="_blank"
        role="button"
      >
        <i class="bi bi-github"></i> Browse on Github</a
      >
    </div>
  </div>
</div>

<style>
  :global(.commitBody h1) {
    font-size: 1.5rem;
  }
</style>
