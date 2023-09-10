import { writable } from 'svelte/store'

export const count = writable(0)

export const repo = writable({
  userRepoInfo: 'pippinbarr/itisasifyouweremakinglove',
  commits: []
})

export const codeOptions = writable([{ value: 'teste', label: 'teste' }])
