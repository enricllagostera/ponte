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
  aria-hidden="true"
>
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header bg-warning">
        <h1 class="modal-title fs-5" id="staticBackdropLabel">
          {dialog.title}
        </h1>
        <!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button> -->
      </div>
      <div class="modal-body">
        <div class="d-flex align-items-center">
          <div class="spinner-border me-2" role="status" aria-hidden="true"></div>
          {dialog.message}
        </div>
      </div>
    </div>
  </div>
</div>
