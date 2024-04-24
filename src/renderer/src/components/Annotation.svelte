<script lang="ts">
  import { marked } from 'marked'
  import Button from './Button.svelte'
  import { addAnnotation, getAnnotationContent, updateAnnotation } from '../annotations'
  import { onMount } from 'svelte'

  export let reference
  export let referenceType

  let isReadOnly = true
  let content = ''

  onMount(() => {
    content = getAnnotationContent(reference)
  })
</script>

<div class="w-full bg-yellow-100/50 p-2">
  {#if isReadOnly}
    <div class="prose prose-base prose-neutral my-2">
      {@html marked.parse(content)}
    </div>
    <Button
      on:click={() => {
        isReadOnly = false
        if (content == '') {
          addAnnotation(reference, referenceType, '')
        }
      }}>
      {content != '' ? 'Edit note' : 'Add note'}
    </Button>
  {:else}
    <textarea
      name="annotationContent"
      id="annotationContent"
      class="my-2 w-full"
      cols="30"
      rows="10"
      bind:value={content}></textarea>

    <!-- {#if content != ''}
      <Button
        on:click={() => {
          content = ''
        }}>Reset</Button>
    {/if} -->

    <Button
      on:click={() => {
        isReadOnly = true
        updateAnnotation(reference, content)
      }}>Save note</Button>
  {/if}
</div>
