import { get, writable } from 'svelte/store'
import type { AppliedCode, CodeOption, Commit } from '../../types'
import { getAllFilesInFolder, getAllSelectedFiles, getAllSelectedFolders } from './fileSystem'
import { allCodes } from './codes'

export const repo = writable({
  userRepoInfo: 'enricllagostera/ponte',
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

export const allCommits = writable<Commit[]>([])
export const allSources = writable([])

export function getCodesForCommit(hash) {
  const codes = get(allCodes)
  return codes.filter((ac) => ac.commitHashes.includes(hash)).map((ac) => ac.code)
}

export function getAppliedCodesForCommit(hash) {
  const codes = get(allCodes)
  return codes.filter((ac) => ac.commitHashes.includes(hash))
}

export function updateAppliedCodesForCommit(hash: string, nextCodes: []): void {
  // const codes = get(allCodes)
  // const allNextIds = nextCodes.map((nc) => nc.id)
  // // list of codes to remove
  // const codesToRemoveHash = getAppliedCodesForCommit(hash)
  //   .filter((eac) => allNextIds.includes(eac.id) == false)
  //   .forEach((eac) => {
  //     eac.commitHashes = eac.commitHashes.filter((h) => h != hash)
  //   })
  // allCodes.update((v) => v.filter((c) => c.commitHashes.length > 0))
  // let codesToAdd = []
  // for (const nextCode of nextCodes) {
  //   const nonExistingCode = codes.filter((c) => c.code.id == nextCode.id).length == 0
  //   if (nonExistingCode) {
  //     codesToAdd = [...codesToAdd, { code: nextCode, commitHashes: [hash] }]
  //     continue
  //   }
  //   const existingCodesToAddHash = codes.filter(
  //     (c) => c.code.id == nextCode.id && c.commitHashes.includes(hash) == false
  //   )
  //   for (const ecah of existingCodesToAddHash) {
  //     ecah.commitHashes = [...ecah.commitHashes, hash]
  //   }
  // }
  // allCodes.update((v) => [...v, ...codesToAdd])
  // const currAppliedCodes = getAppliedCodesForCommit(hash)
  // nextCodes.forEach((nc) => {
  //   const curr = currAppliedCodes.find((cac) => cac.code.id == nc.id)
  //   if (curr != undefined) {
  //     // update all existing codes to apply (in curr, in next)
  //     curr.commitHashes = Array.from(new Set([...curr.commitHashes, hash]))
  //   } else {
  //     // add new codes to apply (in new, not in old)
  //     get(allCodes).push({ code: nc, commitHashes: [hash] })
  //   }
  // })
  // // remove leftover codes to apply (in old, not in new)
  // const currentACs = getAppliedCodesForCommit(hash)
  // const deleteListACs = currentACs.filter((cc) => nextCodes.map((nn) => nn.id).includes(cc.code.id) == false).map(dc => dc.code.id)
  // allCodes.update((currValue) => {
  //   return currValue.filter(cv =>  deleteListACs.includes(cv.code.id) == false)
  // })
  // currAppliedCodes.forEach((ac) => { })
}

export function uniqueArray(array): Array {
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

    const sourcesInQDPX = []
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
      commitsToProcess = [...repoValue.commits]
    }

    if (actionsValue.manualImportFolderText.active) {
      actionsValue.manualImportFolderText.selectedFolders = []
      for (const commit of commitsToProcess) {
        for (const folder of getAllSelectedFolders(commit.fileTree)) {
          actionsValue.manualImportFolderText.selectedFolders.push(folder)
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
        newSource.parent = 'devlog'
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
    console.log('removing source via export panel')
    const snapshot = get(repo)
    const commit = snapshot.commits.find((c) => c.hash == source.hash) as Commit
    const allSelected = getAllSelectedFiles(commit.fileTree)
    const sourceToRemove = allSelected.find((s) => s.abs == source.abs)
    sourceToRemove.selected = false
    repo.set({ userRepoInfo: snapshot.userRepoInfo, commits: snapshot.commits })
  },
  updateQDPX: async () => {
    console.log('update qdpx via store')

    const repoValue = get(repo)
    const settingsValue = get(settings)
    const actionsValue = get(appStates).actions

    const sourcesInQDPX = []
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
      commitsToProcess = [...repoValue.commits]
    }

    if (actionsValue.manualImportFolderText.active) {
      actionsValue.manualImportFolderText.selectedFolders = []
      for (const commit of commitsToProcess) {
        for (const folder of getAllSelectedFolders(commit.fileTree)) {
          actionsValue.manualImportFolderText.selectedFolders.push(folder)
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
        newSource.parent = 'devlog'
        sourcesInQDPX.push(newSource)
      }
    }

    const allCodesToSendToQDPXExport: AppliedCode[] = []

    // encode commits manually
    if (actionsValue.manualEncodeCommits.active) {
      for (const codeInAction of actionsValue.manualEncodeCommits.codesToApply) {
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

    // const allApplyCodeCommitByGlob = actionsValue.getAll('applyCodeCommitGlob')
    // for (const act of allApplyCodeCommitByGlob) {
    //   if (act.active) {
    //     for (const selectedCode of act.codesToApply) {
    //       const getCodeOnExportList = allCodesToSendToQDPXExport.filter((c) => c.code.value == selectedCode.code.value)
    //       if (getCodeOnExportList.length == 1) {
    //         getCodeOnExportList[0].commitHashes = getCodeOnExportList[0].commitHashes.concat(selectedCode.commitHashes)
    //       } else {
    //         allCodesToSendToQDPXExport.push({
    //           code: { ...selectedCode.code },
    //           commitHashes: act.selectedCommits.map((sc) => sc.hash)
    //         })
    //       }
    //     }
    //   }
    // }

    const allImportFilesByGlob = actionsValue.getAll('importFilesByGlob')
    for (const act of allImportFilesByGlob) {
      if (act.active) {
        for (const file of act.selectedFiles) {
          const content = await window.files.readFileAtCommit(file.name, file.commitHash)
          const fileTitle = `${file.name} @ #${file.commitHash.substring(0, 7)}`
          const contentWithHeader = `title:  ${fileTitle}\n\n${content}`
          sourcesInQDPX.push({
            parent: 'copyTextSource',
            originalExt: file.name.split('.')[file.name.split('.').length - 1],
            content: contentWithHeader,
            name: fileTitle
          })
        }
      }
    }

    // for (const changeEncoder of get(autoencoder).onChangeEncoders) {
    //   const getCodeOnExportList = allCodesToSendToQDPXExport.filter((c) => c.code.value == changeEncoder.code.value)
    //   if (getCodeOnExportList.length == 1) {
    //     getCodeOnExportList[0].commitHashes = Array.from(
    //       new Set([...getCodeOnExportList[0].commitHashes, ...changeEncoder.commitHashes])
    //     )
    //   } else {
    //     allCodesToSendToQDPXExport.push({
    //       code: { ...changeEncoder.code },
    //       commitHashes: changeEncoder.commitHashes
    //     })
    //   }
    // }

    allSources.set(sourcesInQDPX)
    allCommits.set(commitsToProcess)
    // allCodes.set(allCodesToSendToQDPXExport)
  }
})
