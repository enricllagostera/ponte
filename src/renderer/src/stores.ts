import { get, writable } from 'svelte/store'
import type { AppliedCode, CodeOption, Commit, Devlog, HASH, Source } from '../../types'
import { getAllFilesInFolder, getAllSelectedFiles, getAllSelectedFolders } from './fileSystem'

export const repo = writable({
  userRepoInfo: 'enricllagostera/ponte',
  commits: []
})

const allCodeOptions: CodeOption[] = []
export const codeOptions = writable(allCodeOptions)

export const settings = writable({
  supportedTextExts: ['md', 'txt', 'js', 'css', 'html', 'cs'],
  darkTheme: false
})

export const allCommits = writable<Commit[]>([])
export const allDevlogs = writable(new Map<HASH, Devlog>())

export async function initDevlogs(): Promise<void> {
  const all = get(allDevlogs)
  all.clear()
  for (const commit of get(repo).commits) {
    const newDevlog = await window.loader.getDevlogForCommit(commit.hash, {})
    all.set(commit.hash, newDevlog ?? {})
  }
  allDevlogs.set(all)
}

export function uniqueArray(array): Array<any> {
  return Array.from(new Set(array))
}

export const project = writable<{ commits: []; sources: [] }>({
  commits: [],
  sources: []
})

export const appStates = writable({
  mainView: 'blogroll' || 'timeline',
  mainViewScroll: 0,
  repoReady: false,
  actions: undefined,
  view: 'blogroll',
  commitInView: '',
  processSources: async () => {
    console.time('Process all sources')

    const repoValue = get(repo)
    const settingsValue = get(settings)
    const actionsValue = get(appStates).actions

    const sourcesInQDPX: Source[] = []
    let commitsToProcess = []

    if (actionsValue.manualIgnoreCommits.active) {
      commitsToProcess = [
        ...repoValue.commits.filter((v) => actionsValue.manualIgnoreCommits.ignoredCommits.indexOf(v.hash) < 0)
      ]
    } else {
      commitsToProcess = [...repoValue.commits]
    }

    if (actionsValue.manualImportFiles.active) {
      actionsValue.manualImportFiles.selectedFiles = []
      for (const commit of commitsToProcess) {
        for (const file of getAllSelectedFiles(commit.fileTree)) {
          actionsValue.manualImportFiles.selectedFiles.push(file)
          const ext = file.name.split('.')[file.name.split('.').length - 1]
          if (settingsValue.supportedTextExts.indexOf(ext) >= 0) {
            const content = await window.files.readFileAtCommit(file.rel, commit.hash)
            const fileTitle = `${file.rel} @ #${commit.hash.substring(0, 7)}`
            const contentWithHeader = `title:  ${fileTitle}\n\n${content}`
            sourcesInQDPX.push({
              type: 'textFile',
              content: contentWithHeader,
              originalExt: ext,
              abs: file.abs,
              name: fileTitle,
              commitHash: commit.hash
            })
          }
        }
      }
    } else {
      commitsToProcess = [...repoValue.commits]
    }

    if (actionsValue.manualImportFolderText.active) {
      actionsValue.manualImportFolderText.selectedFolders = []
      for (const commit of commitsToProcess) {
        for (const folder of getAllSelectedFolders(commit.fileTree)) {
          actionsValue.manualImportFolderText.selectedFolders.push(folder)
          const filesInFolder = getAllFilesInFolder(folder)
          const compilationSource = {
            type: 'compilationSource',
            content: `# Compilation for ${folder.rel} @ #${commit.hashAbbrev}`,
            originalExt: 'md',
            abs: folder.abs,
            name: `${folder.rel} @ ${commit.hash.substring(0, 7)}`,
            hash: commit.hash
          }
          for (const file of filesInFolder) {
            const ext = file.name.split('.')[file.name.split('.').length - 1]
            if (settingsValue.supportedTextExts.indexOf(ext) >= 0) {
              compilationSource.content += `\n\n## [${file.rel}]\n\n`
              if (ext == 'md') {
                compilationSource.content += await window.files.readFileAtCommit(file.rel, commit.hash)
              } else {
                const fileData = await window.files.readFileAtCommit(file.rel, commit.hash)
                compilationSource.content += `\`\`\`\n${fileData}\`\`\``
              }
            }
          }
          sourcesInQDPX.push(compilationSource)
        }
      }
    } else {
      commitsToProcess = [...repoValue.commits]
    }

    if (actionsValue.devlogCompilation.active) {
      const dScs = commitsToProcess.map((commit) => commit.hash)
      const compilationSource = await window.loader.getDevlogCompilation({
        selectedCommits: [...dScs]
      })
      sourcesInQDPX.push(compilationSource)
    }

    if (actionsValue.individualCommitDevlog.active) {
      for (const commit of commitsToProcess) {
        const newSource = await window.loader.getDevlogForCommit(commit.hash, {})
        newSource.type = 'devlog'
        sourcesInQDPX.push(newSource)
      }
    }

    allSources.set(sourcesInQDPX)
    console.timeEnd('Process all sources')
  },
  scrollIntoView: (view, hashAbbrev) => {
    const element = document.querySelector(`#${view}_${hashAbbrev}`)
    if (element) {
      console.log('element found', element)
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' })
      }, 0)
    } else {
      console.log('element not found')
    }
  },
  removeSource: (source) => {
    const snapshot = get(repo)
    const commit = snapshot.commits.find((c) => c.hash == source.hash) as Commit
    const allSelected = getAllSelectedFiles(commit.fileTree)
    const sourceToRemove = allSelected.find((s) => s.abs == source.abs)
    sourceToRemove.selected = false
    repo.set({ userRepoInfo: snapshot.userRepoInfo, commits: snapshot.commits })
  },
  updateQDPX: async () => {
    console.log('[STORES] Updating all project data.')
  }
})
