<script>
  import Panel from './components/Panel.svelte'
</script>

<main class="container-fluid d-flex vh-100 flex-column">
  <div class="row flex-grow-1">
    <div class="col bg-primary d-flex flex-column">
      <div class="row">
        <div class="col bg-info">Repo setup</div>
      </div>
      <div class="row flex-grow-1">
        <div class="col bg-light d-flex">
          <Panel panelInfo={{ title: 'Actions' }} />
        </div>
      </div>
    </div>
    <div class="col bg-warning"></div>
    <div class="col bg-danger"></div>
  </div>
</main>

<style>
  .fullHeight {
    height: calc(100vh - 32px);
  }

  .h25 {
    height: 25vh;
    max-height: 25vh;
  }
</style>
