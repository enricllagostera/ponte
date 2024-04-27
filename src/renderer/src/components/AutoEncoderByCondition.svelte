<script lang="ts">
  import { Plus, Tag, Trash2 } from 'lucide-svelte'
  import { getCodeIdByValue, getCommitsInCode } from '../stores/codes'
  import Button from './Button.svelte'
  import Pane from './Pane.svelte'

  let conditionsText = ''
  let codeValue = ''
  let codeValueDom
  let conditionTextDom

  export let title
  export let description
  export let encoders
  export let onAddEncoder
  export let onRemoveEncoder

  function onAdd(): void {
    onAddEncoder(codeValue, conditionsText)
    codeValueDom.value = ''
    conditionTextDom.value = ''
  }

  function onRemove(encoderId, codeValue): void {
    onRemoveEncoder(encoderId, codeValue)
  }
</script>

<Pane {title} class="h-[95%] w-1/3">
  <div slot="body" class="h-full w-full">
    <p>{description}</p>
    <div class="row-span-2 mt-2 flex flex-row flex-nowrap justify-between gap-2">
      <input bind:value={codeValue} placeholder="Code to apply..." class="h-8 w-[45%]" bind:this={codeValueDom} />
      <textarea
        bind:value={conditionsText}
        class="w-[45%]"
        placeholder="Pattern(s) to search..."
        bind:this={conditionTextDom} />
      <Button class="h-8 w-8 text-center" on:click={onAdd}><Plus></Plus></Button>
    </div>
    {#key encoders}
      {#if encoders.length > 0}
        <!-- <h2 class="my-2 font-bold">Active encoders</h2> -->
        {#each encoders as encoder (encoder.id)}
          <div class="mt-1 flex flex-row items-center justify-between gap-2 border-2 border-[#ccc] p-2">
            <span class="inline-flex items-center rounded-full bg-magenta/30 px-2 py-1"
              ><Tag class="inline-flex h-4"></Tag>{encoder.code}
              <span class="ms-2 rounded-full bg-magenta/70 px-2 text-sm text-white"
                >{getCommitsInCode(getCodeIdByValue(encoder.code)).length}</span>
            </span>
            from <code>{encoder.glob}</code>
            <Button class="ms-auto inline-flex h-8 w-8" on:click={() => onRemove(encoder.id, encoder.code)}
              ><Trash2></Trash2></Button>
          </div>
        {/each}
      {/if}
    {/key}
  </div>
</Pane>
