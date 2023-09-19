<script>
  export let id
  export let successClass = false
</script>

<div class="row flex-grow-1">
  <div class="col d-flex">
    <div class="card rounded-0 m-1 flex-grow-1" class:text-bg-success={successClass}>
      <div class="card-header d-flex flex-grow-0 w-100" style="height:2.5rem">
        <slot name="header" />
      </div>
      <div class="card-body flexOverflow overflow-y-auto" {id}>
        <slot name="body" />
      </div>
      <div class="card-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</div>

<style>
  :global(.flexOverflow) {
    flex: 1 1 1px;
    min-width: 0;
    min-height: 0;
  }
</style>
