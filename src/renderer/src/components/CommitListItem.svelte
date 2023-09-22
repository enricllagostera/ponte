<script>
  import { createEventDispatcher } from 'svelte'
  import { DateTime } from 'luxon'
  import { marked } from 'marked'

  import Tree from 'svelte-tree'

  export let activeAtStart = true
  export let commit
  export let userRepoInfo
  let active = activeAtStart

  let showFileTree = false

  const dispatch = createEventDispatcher()

  function onToggleIncluded(event) {
    dispatch('toggleIncluded', {
      checked: event.target.checked,
      hashAbbrev: commit.hashAbbrev
    })
  }

  function getExt(filename) {
    const ext = filename.split('.')[filename.split('.').length - 1]
    return ext
  }

  function toggleFile(event, node) {
    // console.log(event)
    node.selected = event.target.checked

    console.log(node)
    console.log(commit.fileTree)

    dispatch('fileToggled')
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
      <div class="commitBody text-body-secondary">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html marked.parse(commit.body)}
      </div>
    {/if}
  </div>
  <div class="card-body">
    <details
      class:border-end={showFileTree}
      class:border-2={showFileTree}
      class:border-primary={showFileTree}
      class="pe-2"
      bind:open={showFileTree}
    >
      <summary class="mb-2 btn btn-outline-primary"
        ><i class="bi bi-eye"></i> Preview files in this commit</summary
      >
      <Tree tree={commit.fileTree} let:node>
        <div
          class="d-flex align-items-center p-1 rounded-1"
          style:background-color={['md', 'css', 'js', 'txt', 'html'].indexOf(getExt(node.name)) < 0
            ? 'transparent'
            : '#eeeeff'}
        >
          {#if node.children}
            <i class="bi bi-folder"></i> {node.name}
          {:else}
            <input
              type="checkbox"
              name="selected"
              class="form-check-input"
              id=""
              disabled={['md', 'css', 'js', 'txt', 'html'].indexOf(getExt(node.name)) < 0}
              on:change={(e) => toggleFile(e, node)}
              checked={node.selected}
            />
            <i class="bi bi-file me-1"></i>
            {node.name}
            <button class="btn btn-link" on:click={window.files.showInExplorer(node.abs)}
              ><i class="bi bi-folder2-open"></i></button
            >

            <a
              name=""
              id=""
              href={`https://github.com/${userRepoInfo}/tree/${commit.hash}/${node.rel}`}
              target="_blank"
            >
              <i class="bi bi-github"></i>
            </a>
          {/if}
        </div>
      </Tree>
    </details>
  </div>

  <div class="card-footer d-flex d-flex flex-grow-0 align-items-center">
    <div class="mt-1">
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          bind:checked={active}
          on:change={onToggleIncluded}
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
