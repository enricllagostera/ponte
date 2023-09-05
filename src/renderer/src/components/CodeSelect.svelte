<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import Select from 'svelte-select'

  export let id
  export let initialOptions
  export let initialValues

  let filterText = ''
  let value = null
  let items

  const dispatch = createEventDispatcher()

  onMount(() => {
    value = initialValues
    items = [...initialOptions]
    console.log(value, items)
  })

  // function onChanged(event) {
  //   console.log(value, items)
  //   dispatch('codesChanged', {
  //     codes: value.map((v) => v.value),
  //     options: items.map((v) => v.options)
  //   })
  // }

  function handleFilter(e) {
    if (value?.find((i) => i.label === filterText)) return
    if (e.detail.length === 0 && filterText.length > 0) {
      const prev = items.filter((i) => !i.created)
      items = [...prev, { value: filterText, label: filterText, created: true }]
    }
  }

  function handleClear(e) {
    value = value || []
    const toRemove = Array.isArray(e.detail) ? e.detail : [e.detail]
    for (const rv of [...toRemove]) {
      value = [...value.filter((cv) => rv.value != cv.value)]
    }
    dispatch('codesChanged', {
      codes: value,
      options: items
    })
  }

  function handleChange(e) {
    items = items.map((i) => {
      delete i.created
      return i
    })
    dispatch('codesChanged', {
      codes: value,
      options: items
    })
  }
</script>

<div class="input-group mb-3">
  <div class="input-group-prepend"><i class="bi bi-tags"></i></div>
  <Select
    on:change={handleChange}
    multiple
    on:filter={handleFilter}
    on:clear={handleClear}
    bind:filterText
    bind:value
    {items}
    clearable
    multiFullItemClearable
    class="form-control"
  >
    <div slot="item" let:item>
      {item.created ? 'Add new: ' : ''}
      {item.label}
    </div>
  </Select>
</div>
