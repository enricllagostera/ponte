import { get, writable } from 'svelte/store'
import type { GUID, HASH, RepoDirent, Source } from '../../../types'
import { repo, settings, uniqueArray } from './stores'
import type { PathLike } from 'fs-extra'
import { minimatch } from 'minimatch'
import { hasAnnotationForReference, removeAnnotation } from './annotations'

export const allSources = writable<Source[]>([])

export function resetSources(serializedSources: Source[] = []): void {
  const all = get(allSources)
  if (serializedSources.length == 0) {
    allSources.set([])
    return
  }
  for (const sourceInfo of serializedSources) {
    addSource(sourceInfo)
  }
  allSources.set(all.length > 0 ? all : get(allSources))
}

export function addSource(newSourceData: Source): void {
  const all = get(allSources)
  const localCopy = { ...newSourceData }
  if (!newSourceData?.id || newSourceData.id == '') {
    console.log('[SOURCE] Adding source')
    localCopy.id = createIdFromData(localCopy)
    localCopy.name = createNameFromData(localCopy)
    if (localCopy.type == 'textFile') {
      localCopy.originalExt = getExtension(newSourceData.abs as string)
    } else if (localCopy.type == 'folderCompilation') {
      localCopy.originalExt = undefined
    }
  }
  let foundSource = all.find((s) => s.id == localCopy.id)
  if (foundSource == undefined) {
    allSources.set(uniqueArray([...all, localCopy]))
  } else {
    console.log('[SOURCE] Updating existing source')
    foundSource = { ...localCopy }
    allSources.set(all)
  }
}

export function removeSource(sourceData: Source): void {
  const all = get(allSources)
  const targetId = createIdFromData(sourceData)
  if (sourceData.type == 'textFile' || sourceData.type == 'folderCompilation') {
    const targetFileTree = get(repo).commits.find((c) => c.hash == sourceData.commitHash)?.fileTree as RepoDirent[]
    const dirent = {
      name: '',
      rel: '',
      selected: false,
      children: targetFileTree
    }
    findInTreeAndToggleSelected(sourceData.abs, dirent, false)
    allSources.set(all.filter((s) => s.id != targetId))
    if (hasAnnotationForReference(targetId)) {
      removeAnnotation(targetId)
    }
  }
}

export async function loadSourceContent(source: Source): Promise<string> {
  if (source.content != undefined) {
    return source.content
  }
  let res = ''
  if (source.type == 'textFile') {
    res = await window.files.readFileAtCommit(source.rel, source.commitHash)
    source.content = res
    return res
  }
  if (source.type == 'folderCompilation') {
    const filesInFolder = getAllFilesInFolder(source.abs, source.commitHash)
    let content = ''
    for (const file of filesInFolder) {
      const ext = file.split('.')[file.split('.').length - 1]
      if (get(settings).supportedTextExts.indexOf(ext) >= 0) {
        content += `\n\n## [${file}]\n\n`
        if (ext == 'md') {
          content += await window.files.readFileAtCommit(file, source.commitHash)
        } else {
          const fileData = await window.files.readFileAtCommit(file, source.commitHash)
          content += `\`\`\`\n${fileData}\`\`\``
        }
      }
    }
    source.content = content
    return content
  }
  return res
}

export async function loadDevlogCompilation(): Promise<void> {
  const devlogCompilation = await window.loader.getDevlogCompilation({
    selectedCommits: get(repo).commits
  })
  const all = get(allSources)
  const devlogSource: Source = {
    id: 'devlogCompilation',
    type: 'devlogCompilation',
    content: devlogCompilation.content,
    name: 'Devlog compilation'
  }
  devlogSource.id = createIdFromData(devlogSource)
  let foundDevlogSource = all.find((s) => s.id == devlogSource.id)
  if (foundDevlogSource != undefined) {
    foundDevlogSource.content = devlogCompilation.content
  } else {
    all.push(devlogSource)
  }
  allSources.set([...all])
}

export function getAllFilesInFolder(folder: string, commitHash: HASH): string[] {
  const commit = get(repo).commits.find((c) => c.hash == commitHash)
  const selected = minimatch.match(commit.fileList, `${folder}/**`, { windowsPathsNoEscape: true })
  return selected
}

function findInTreeAndToggleSelected(abs: PathLike, directory: RepoDirent, value: boolean): void {
  const dir = directory.children || []
  for (const dirent of dir) {
    if (dirent.children?.length > 0) {
      // is folder
      if (dirent.abs == abs) {
        dirent.selected = value
        return
      }

      findInTreeAndToggleSelected(abs, dirent, value)
    } else if (!dirent.children && dirent.abs == abs) {
      dirent.selected = value
      return
    }
  }
}

function getExtension(filePathString: string): string {
  return filePathString.split('.')[filePathString.split('.').length - 1] ?? filePathString
}

function createIdFromData(sourceData: Source): GUID {
  if (sourceData.type == 'devlogCompilation') {
    return 'devlogCompilation'
  }
  return (sourceData.commitHash ?? 'PROJECT_INFO') + '--' + sourceData.abs
}

function createNameFromData(sourceData: Source): GUID {
  return `${sourceData.abs} @ ${sourceData.commitHash.substring(0, 7)}`
}
