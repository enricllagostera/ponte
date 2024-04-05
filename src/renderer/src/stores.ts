import { get, writable } from 'svelte/store'
import type { QDPXData, AppliedCode, CodeOption, Commit } from '../../types'
import { getAllFilesInFolder, getAllSelectedFiles, getAllSelectedFolders } from './fileSystem'

export const repo = writable({
  userRepoInfo: 'enricllagostera/repo-to-qda',
  // userRepoInfo: 'pippinbarr/v-r-5',
  // userRepoInfo: '',
  commits: []
})

const allCodeOptions: CodeOption[] = []
export const codeOptions = writable(allCodeOptions)

export const settings = writable({
  supportedTextExts: ['md', 'txt', 'js', 'css', 'html', 'cs'],
  darkTheme: false
})

export const qdpx = writable<QDPXData>({
  commits: [],
  sources: [],
  codes: []
})

export const appStates = writable({
  mainView: 'blogroll' || 'timeline',
  mainViewScroll: 0,
  repoReady: false,
  actions: undefined,
  view: 'blogroll',
  commitInView: '',
  scrollIntoView: (view, hashAbbrev) => {
    //console.log(view, hashAbbrev)
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
    console.log('removing source via export panel')
    const snapshot = get(repo)
    let commit = snapshot.commits.find((c) => c.hash == source.hash) as Commit
    const allSelected = getAllSelectedFiles(commit.fileTree)
    const sourceToRemove = allSelected.find((s) => s.abs == source.abs)
    sourceToRemove.selected = false
    repo.set({ userRepoInfo: snapshot.userRepoInfo, commits: snapshot.commits })
  },
  updateQDPX: async (repo, settings, actions) => {
    console.log('update qdpx via store')

    const sources = []
    let commitsToProcess = []

    if (actions.manualIgnoreCommits.active) {
      commitsToProcess = [...repo.commits.filter((v) => actions.manualIgnoreCommits.ignoredCommits.indexOf(v.hash) < 0)]
    } else {
      commitsToProcess = [...repo.commits]
    }

    if (actions.manualImportFiles.active) {
      actions.manualImportFiles.selectedFiles = []
      for (const commit of commitsToProcess) {
        for (const file of getAllSelectedFiles(commit.fileTree)) {
          actions.manualImportFiles.selectedFiles.push(file)
          const ext = file.name.split('.')[file.name.split('.').length - 1]
          if (settings.supportedTextExts.indexOf(ext) >= 0) {
            const content = await window.files.readFileAtCommit(file.rel, commit.hash)
            const fileTitle = `${file.rel} @ #${commit.hash.substring(0, 7)}`
            const contentWithHeader = `title:  ${fileTitle}\n\n${content}`
            sources.push({
              parent: 'copyTextSource',
              content: contentWithHeader,
              originalExt: ext,
              abs: file.abs,
              name: fileTitle,
              hash: commit.hash
            })
          }
        }
      }
    } else {
      commitsToProcess = [...repo.commits]
    }

    if (actions.manualImportFolderText.active) {
      actions.manualImportFolderText.selectedFolders = []
      for (const commit of commitsToProcess) {
        for (const folder of getAllSelectedFolders(commit.fileTree)) {
          actions.manualImportFolderText.selectedFolders.push(folder)
          const filesInFolder = getAllFilesInFolder(folder)
          const compilationSource = {
            parent: 'compilationSource',
            content: `# Compilation for ${folder.rel} @ #${commit.hashAbbrev}`,
            originalExt: 'md',
            abs: folder.abs,
            name: `${folder.rel} @ ${commit.hash.substring(0, 7)}`,
            hash: commit.hash
          }
          for (const file of filesInFolder) {
            const ext = file.name.split('.')[file.name.split('.').length - 1]
            if (settings.supportedTextExts.indexOf(ext) >= 0) {
              compilationSource.content += `\n\n## [${file.rel}]\n\n`
              if (ext == 'md') {
                compilationSource.content += await window.files.readFileAtCommit(file.rel, commit.hash)
              } else {
                const fileData = await window.files.readFileAtCommit(file.rel, commit.hash)
                compilationSource.content += `\`\`\`\n${fileData}\`\`\``
              }
            }
          }
          sources.push(compilationSource)
        }
      }
    } else {
      commitsToProcess = [...repo.commits]
    }

    if (actions.devlogCompilation.active) {
      const dScs = commitsToProcess.map((commit) => commit.hash)
      const compilationSource = await window.loader.getDevlogCompilation({
        selectedCommits: [...dScs]
      })
      sources.push(compilationSource)
    }

    if (actions.individualCommitDevlog.active) {
      for (const commit of commitsToProcess) {
        const newSource = await window.loader.getDevlogForCommit(commit.hash, {})
        newSource.parent = 'devlog'
        sources.push(newSource)
      }
    }

    const allCodesToSendToQDPXExport: AppliedCode[] = []

    // encode commits manually
    if (actions.manualEncodeCommits.active) {
      for (const codeInAction of actions.manualEncodeCommits.codesToApply) {
        const getCodeOnExportList = allCodesToSendToQDPXExport.filter((c) => c.code.value == codeInAction.code.value)
        if (getCodeOnExportList.length == 1) {
          getCodeOnExportList[0].commitHashes = [
            ...getCodeOnExportList[0].commitHashes,
            ...commitsToProcess
              .filter((c) => codeInAction.commitHashes.findIndex((ca) => ca == c.hash) >= 0)
              .map((r) => r.hash)
          ]
        } else {
          allCodesToSendToQDPXExport.push({
            code: { ...codeInAction.code },
            commitHashes: [
              ...commitsToProcess
                .filter((c) => codeInAction.commitHashes.findIndex((ca) => ca == c.hash) >= 0)
                .map((r) => r.hash)
            ]
          })
        }
      }
    }

    const allApplyCodeCommitByGlob = actions.getAll('applyCodeCommitGlob')
    for (const act of allApplyCodeCommitByGlob) {
      if (act.active) {
        for (const selectedCode of act.codesToApply) {
          const getCodeOnExportList = allCodesToSendToQDPXExport.filter((c) => c.code.value == selectedCode.code.value)
          if (getCodeOnExportList.length == 1) {
            getCodeOnExportList[0].commitHashes = getCodeOnExportList[0].commitHashes.concat(selectedCode.commitHashes)
          } else {
            allCodesToSendToQDPXExport.push({
              code: { ...selectedCode.code },
              commitHashes: act.selectedCommits.map((sc) => sc.hash)
            })
          }
        }
      }
    }

    const allImportFilesByGlob = actions.getAll('importFilesByGlob')
    for (const act of allImportFilesByGlob) {
      if (act.active) {
        for (const file of act.selectedFiles) {
          const content = await window.files.readFileAtCommit(file.name, file.commitHash)
          const fileTitle = `${file.name} @ #${file.commitHash.substring(0, 7)}`
          const contentWithHeader = `title:  ${fileTitle}\n\n${content}`
          sources.push({
            parent: 'copyTextSource',
            originalExt: file.name.split('.')[file.name.split('.').length - 1],
            content: contentWithHeader,
            name: fileTitle
          })
        }
      }
    }

    qdpx.set({
      commits: [...commitsToProcess],
      sources: [...sources],
      codes: [...allCodesToSendToQDPXExport]
    })
  }
})
