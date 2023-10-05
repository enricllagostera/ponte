import { writable } from 'svelte/store'

export const repo = writable({
  // userRepoInfo: 'pippinbarr/itisasifyouweremakinglove',
  userRepoInfo: '',
  commits: []
})

export const codeOptions = writable([{ value: 'teste', label: 'teste' }])
