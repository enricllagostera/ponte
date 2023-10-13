<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let action

  const dispatch = createEventDispatcher()

  function onChanged(): void {
    dispatch('actionUpdated', {
      state: action
    })
  }
</script>

<div class="card my-3">
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
        </div>
      </div>
    </div>
  </div>
  <div class="card-body">
    <div>{action.description}</div>
  </div>
</div>
