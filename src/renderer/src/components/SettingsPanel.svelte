<script>
  import { autoencoders, updateAllEncodings } from '../codes'
  import Button from './Button.svelte'
  import Pane from './Pane.svelte'

  let filesToObserveText = '*/journal.md'
  let codeOnChange = 'journaling'

  function addOnChangedEncoding(codeOnChange, filesToObserveText) {
    console.log('encoding on change: ', codeOnChange, filesToObserveText)
    if (codeOnChange != '' && filesToObserveText != '') {
      $autoencoders.onChangeEncoders = [
        ...$autoencoders.onChangeEncoders,
        { glob: filesToObserveText, code: codeOnChange }
      ]
      updateAllEncodings()
    }
  }
</script>

<Pane title="Settings" class="flex h-full w-full shrink-0 grow flex-row gap-2 overflow-hidden py-2">
  <div slot="body">
    <h2 class="text-xl font-bold">Auto-encoding</h2>
    <!-- <div class="flex flex-row">
      <Button>Add changed file encoder</Button>
    </div> -->
    <div class="flex flex-row gap-2">
      <input bind:value={codeOnChange} placeholder="Code..." class="h-8" />
      <textarea bind:value={filesToObserveText} placeholder="Files to observe..." />
      <Button class="h-8" on:click={() => addOnChangedEncoding(codeOnChange, filesToObserveText)}>Run</Button>
      <!-- <GeneralToggle class="h-8">Active</GeneralToggle> -->
    </div>
    Applies<code>{codeOnChange}</code> to commits that changed the file(s): {filesToObserveText}.
  </div>
</Pane>
