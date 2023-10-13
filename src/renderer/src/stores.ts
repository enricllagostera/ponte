import { writable } from 'svelte/store'
import type { CodeOption } from '../../types'

export const repo = writable({
  userRepoInfo: 'pippinbarr/v-r-5',
  // userRepoInfo: '',
  commits: []
})

const allCodeOptions: CodeOption[] = []
export const codeOptions = writable(allCodeOptions)

export const settings = writable({
  supportedTextExts: ['md', 'txt', 'js', 'css', 'html', 'cs']
})
