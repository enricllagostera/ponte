import type { QDPXData } from '../../types'

import { get } from 'svelte/store'

import { annotations } from './stores/annotations'
import { allSources, loadSourceContent } from './stores/sources'
import { repo } from './stores/stores'
import { getCodesAsAppliedCodes } from './stores/codes'

export async function exportQDPX(): Promise<void> {
  console.time('QDPX export timer')
  console.log('[EXPORT QDPX BUTTON] Starting.')

  const qdpxExportOptions = {
    title: `Save QDPX file...`
  }
  for (const source of get(allSources)) {
    if (!source.content || source.content == '') {
      await loadSourceContent(source)
    }
  }
  const qdpxData: QDPXData = {
    userRepoInfo: get(repo).userRepoInfo,
    sources: get(allSources),
    commits: get(repo).commits,
    codes: getCodesAsAppliedCodes(),
    annotations: [...get(annotations)]
  }
  await window.loader.exportQDPX(qdpxData, qdpxExportOptions)
  console.timeEnd('QDPX export timer')
}
