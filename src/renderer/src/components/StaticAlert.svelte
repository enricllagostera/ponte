<script>
  export let dialog
</script>

<div
  class="modal"
  id={dialog.id}
  data-bs-backdrop="static"
  data-bs-keyboard="false"
  tabindex="-1"
  aria-labelledby="staticBackdropLabel"
  aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="staticBackdropLabel">
          {dialog.title}
        </h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">{dialog.message}</div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>

        {#if dialog.showNextModalWithId != ''}
          <button
            type="button"
            class="btn btn-danger"
            data-bs-toggle="modal"
            data-bs-target={`#${dialog.showNextModalWithId}`}
            on:click={dialog.executeOnConfirm}>{dialog.confirm}</button>
        {:else}
          <button type="button" class="btn btn-danger" data-bs-dismiss="modal" on:click={dialog.executeOnConfirm}
            >{dialog.confirm}</button>
        {/if}
      </div>
    </div>
  </div>
</div>
