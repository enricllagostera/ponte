<script lang="ts">
  import { autoencoders, getCodeIdByValue, removeEncodingFromAll, updateAllEncodings } from '../codes'
  import { v4 as uuid } from 'uuid'
  import AutoEncoderByCondition from './AutoEncoderByCondition.svelte'

  function addOnChangedEncoding(codeOnChange, filesToObserveText): void {
    console.log('encoding on change: ', codeOnChange, filesToObserveText)
    if (codeOnChange != '' && filesToObserveText != '') {
      console.log('adding new on change encoder')
      $autoencoders.onChangeEncoders = [
        ...$autoencoders.onChangeEncoders,
        { id: uuid(), glob: filesToObserveText, code: codeOnChange }
      ]
      updateAllEncodings()
      $autoencoders = $autoencoders
    }
  }

  function removeOnChangedEncoding(id, codeValue): void {
    $autoencoders.onChangeEncoders = $autoencoders.onChangeEncoders.filter((e) => e.id != id)
    removeEncodingFromAll(getCodeIdByValue(codeValue))
    $autoencoders = $autoencoders
  }

  function addOnSubjectEncoding(codeOnSubject, patterns): void {
    console.log('encoding on subject: ', codeOnSubject, patterns)
    if (codeOnSubject != '' && patterns != '') {
      console.log('adding new subject encoder')
      $autoencoders.onSubjectEncoders = [
        ...$autoencoders.onSubjectEncoders,
        { id: uuid(), glob: patterns, code: codeOnSubject }
      ]
      updateAllEncodings()
      $autoencoders = $autoencoders
    }
  }

  function removeOnSubjectEncoding(annotationId, codeValue): void {
    $autoencoders.onSubjectEncoders = $autoencoders.onSubjectEncoders.filter((e) => e.id != annotationId)
    removeEncodingFromAll(getCodeIdByValue(codeValue))
    $autoencoders = $autoencoders
  }

  function addOnDevlogEncoding(codeOnDevlog, patterns): void {
    console.log('encoding on devlog: ', codeOnDevlog, patterns)
    if (codeOnDevlog != '' && patterns != '') {
      console.log('adding new devlog encoder')
      $autoencoders.onDevlogEncoders = [
        ...$autoencoders.onDevlogEncoders,
        { id: uuid(), glob: patterns, code: codeOnDevlog }
      ]
      updateAllEncodings()
      $autoencoders = $autoencoders
    }
  }

  function removeOnDevlogEncoding(id, codeValue): void {
    $autoencoders.onDevlogEncoders = $autoencoders.onDevlogEncoders.filter((e) => e.id != id)
    removeEncodingFromAll(getCodeIdByValue(codeValue))
    $autoencoders = $autoencoders
  }
</script>

<div class="flex h-full w-full shrink-0 grow flex-col gap-2 overflow-hidden py-2">
  <h2 class="my-2 ms-4 text-xl font-bold">Auto-encoding</h2>
  <div class="flex h-full flex-row gap-2">
    <AutoEncoderByCondition
      title="Encode by file changes"
      description={`Apply code to commits in which the files in the glob patterns were changed. You can add one pattern per line.`}
      encoders={$autoencoders.onChangeEncoders}
      onAddEncoder={addOnChangedEncoding}
      onRemoveEncoder={removeOnChangedEncoding}>
    </AutoEncoderByCondition>
    <AutoEncoderByCondition
      title="Encode by commit subject"
      description={`Apply code to commits if their subject matches a pattern. You can add one pattern per line.`}
      encoders={$autoencoders.onSubjectEncoders}
      onAddEncoder={addOnSubjectEncoding}
      onRemoveEncoder={removeOnSubjectEncoding}>
    </AutoEncoderByCondition>
    <AutoEncoderByCondition
      title="Encode by commit message or devlog content"
      description={`Apply code to commits if their commit subject, message or devlog matches a pattern. You can add one pattern per line.`}
      encoders={$autoencoders.onDevlogEncoders}
      onAddEncoder={addOnDevlogEncoding}
      onRemoveEncoder={removeOnDevlogEncoding}>
    </AutoEncoderByCondition>
  </div>
</div>
