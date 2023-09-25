<script>
  let message = ''

  export function setup() {
    let progressPerCommit = new Map()
    window.loader.onDownloadInProgress((event, data) => {
      if (data.message != '') {
        // if there is a message, just forward it to the footer
        message = data.message
        return
      } else if (!data.progress) {
        // no message and no data means that message should be cleared
        message = ''
        return
      }
      // has the download completed?
      if (data.progress.total < 0) {
        progressPerCommit.delete(data.hash)
      } else {
        progressPerCommit.set(data.hash, data)
      }
      message = `Downloading commits... (${
        data.commitCount - Array.from(progressPerCommit).length
      }/${data.commitCount})`
    })
  }
</script>

<div
  class="row container-fluid vw-100 flex-grow-0 p-2"
  class:text-bg-secondary={message == ''}
  class:text-bg-warning={message != ''}
>
  <div class="col">
    {#if message != ''}
      <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
      {message}
    {:else}
      Footer
    {/if}
  </div>
</div>
