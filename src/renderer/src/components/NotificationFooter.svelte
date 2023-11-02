<script lang="ts">
  import { slide } from 'svelte/transition'

  let message = ''

  export function setup(): void {
    let progressPerCommit = new Map()
    window.loader.onDownloadInProgress(
      (
        _event: any,
        data: { message: string; progress: { total: number }; hash: any; commitCount: number }
      ) => {
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
      }
    )
  }
</script>

{#if message != ''}
  <div
    transition:slide
    class="flex flex-col grow-0 w-screen p-4 text-center bg-f-warn text-c-black">
    {#if message != ''}
      <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
      {message}
    {:else}
      Footer
    {/if}
  </div>
{/if}
