import { get, writable } from 'svelte/store'
import type { AppliedCode, CodeOption } from '../../types'
import { repo, uniqueArray } from './stores'
import { minimatch } from 'minimatch'

export const allCodes = writable<AppliedCode[]>([])

export const codesInCommit = new Map<string, string[]>()
export const commitsInCode = new Map<string, string[]>()

export const commitEncodings = writable(codesInCommit)

export let commitEncodingsMap = undefined

export const codesDB = writable<Map<string, CodeOption>>(new Map())

export const autoencoders = writable({
  onChangeEncoders: []
})

export function initCommitEncodingsMap() {
  commitEncodingsMap = new Map()
  for (const commit of get(repo).commits) {
    commitEncodingsMap.set(commit.hash, writable([]))
  }
}

function addEncodingToCommit(codeValue: string, commitHash: string): void {
  const currDB = get(codesDB)
  currDB.set(codeValue, { id: codeValue, label: codeValue, value: codeValue })
  commitsInCode.set(codeValue, uniqueArray([...(commitsInCode.get(codeValue) ?? []), commitHash]))
  codesInCommit.set(commitHash, uniqueArray([...(codesInCommit.get(commitHash) ?? []), codeValue]))
  codesDB.set(currDB)
  if (commitEncodingsMap.get(commitHash) == undefined) {
    commitEncodingsMap.set(commitHash, writable(codesInCommit.get(commitHash)))
  } else {
    commitEncodingsMap.get(commitHash).set(codesInCommit.get(commitHash))
  }
  commitEncodings.set(codesInCommit)
}

function addEncodingToCommits(codeValue: string, commitHashes: string[]): void {
  const currDB = get(codesDB)
  currDB.set(codeValue, { id: codeValue, label: codeValue, value: codeValue })
  for (const ch of commitHashes) {
    commitsInCode.set(codeValue, uniqueArray([...(commitsInCode.get(codeValue) ?? []), ch]))
    codesInCommit.set(ch, uniqueArray([...(codesInCommit.get(ch) ?? []), codeValue]))
    if (commitEncodingsMap.get(ch) == undefined) {
      commitEncodingsMap.set(ch, writable(codesInCommit.get(ch)))
    } else {
      commitEncodingsMap.get(ch).set(codesInCommit.get(ch))
    }
  }
  codesDB.set(currDB)
  commitEncodings.set(codesInCommit)
}

function removeEncodingFromCommit(codeValue: string, commitHash: string): void {
  const currDB = get(codesDB)
  currDB.set(codeValue, { id: codeValue, label: codeValue, value: codeValue })
  commitsInCode.set(codeValue, uniqueArray([...(commitsInCode.get(codeValue) ?? [])].filter((ch) => ch != commitHash)))
  codesInCommit.set(commitHash, uniqueArray([...(codesInCommit.get(commitHash) ?? [])].filter((cd) => cd != codeValue)))
  if (commitsInCode.get(codeValue).length == 0) {
    commitsInCode.delete(commitHash)
    codesInCommit.delete(codeValue)
    commitEncodingsMap.get(commitHash).set([])
    currDB.delete(codeValue)
  }
  codesDB.set(currDB)
  commitEncodings.set(codesInCommit)
}

export function updateAllEncodings(): void {
  for (const commit of get(repo).commits) {
    updateEncodingsForCommit(codesInCommit.get(commit.hash) ?? [], commit.hash)
  }
}

export function updateEncodingsForCommit(codes: string[], commitHash: string): void {
  const oldCodes = codesInCommit.get(commitHash)?.map((h) => h)
  if (oldCodes != undefined) {
    for (const oldTag of oldCodes) {
      removeEncodingFromCommit(oldTag, commitHash)
    }
  }
  for (const code of codes) {
    addEncodingToCommit(code, commitHash)
  }
  for (const changeEncoder of get(autoencoders).onChangeEncoders) {
    const adding = encodeByChangesGlob(changeEncoder.glob, changeEncoder.code)
    addEncodingToCommits(changeEncoder.code, adding.commitHashes)
  }
}

export function encodeByChangesGlob(searchPattern: string, codeValueLabel: string): AppliedCode {
  let res: AppliedCode = {
    code: codeValueLabel,
    commitHashes: []
  }
  const searches = searchPattern.split('\n')
  const commits = get(repo).commits
  for (const commit of commits) {
    let findings = []
    for (const pattern of searches) {
      findings = [
        ...findings,
        ...minimatch.match(
          commit.fileChangeStats.map((f) => f.filepath ?? ''),
          pattern
        )
      ]
    }
    if (findings.length > 0) {
      res.commitHashes.push(commit.hash)
    }
  }
  return res
}

export function getCodesAsAppliedCodes() {
  let res = []
  for (const [codeName, codeOption] of get(codesDB)) {
    res.push({ code: codeOption, commitHashes: commitsInCode.get(codeName) ?? [] })
  }
  return res
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
