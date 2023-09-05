import { writable } from 'svelte/store'

export const count = writable(0)

export const repo = writable({
  userRepoInfo: 'enricllagostera/g2k',
  commits: []
})

export const codeOptions = writable([{ value: 'teste', label: 'teste' }])
