import { get, writable } from 'svelte/store'
import type { AppliedCode, CodeOption } from '../../types'
import { allDevlogs, repo, uniqueArray } from './stores'
import { minimatch } from 'minimatch'

export const allCodes = writable<AppliedCode[]>([])

export const codesInCommit = new Map<string, string[]>()
export const commitsInCode = new Map<string, string[]>()

export const commitEncodings = writable(codesInCommit)

export let commitEncodingsMap = undefined

export const codesDB = writable<Map<string, CodeOption>>(new Map())

export const autoencoders = writable({
  onChangeEncoders: [],
  onSubjectEncoders: [],
  onDevlogEncoders: []
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

export function removeEncodingFromCommit(codeValue: string, commitHash: string): void {
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

export function removeEncodingFromAllEncodings(codeValue): void {
  for (const commit of get(repo).commits) {
    removeEncodingFromCommit(codeValue, commit.hash)
    updateEncodingsForCommit(codesInCommit.get(commit.hash) ?? [], commit.hash)
  }
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
  for (const subjectEncoder of get(autoencoders).onSubjectEncoders) {
    const adding = encodeBySubjectsGlob(subjectEncoder.glob, subjectEncoder.code)
    addEncodingToCommits(subjectEncoder.code, adding.commitHashes)
  }
  for (const devlogEncoder of get(autoencoders).onDevlogEncoders) {
    const adding = encodeByDevlogGlob(devlogEncoder.glob, devlogEncoder.code)
    addEncodingToCommits(devlogEncoder.code, adding.commitHashes)
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

function encodeBySubjectsGlob(searchPattern: string, codeValueLabel: string): AppliedCode {
  let res: AppliedCode = {
    code: codeValueLabel,
    commitHashes: []
  }
  const searches = searchPattern.split('\n')
  const commits = get(repo).commits
  for (const commit of commits) {
    let findings = []
    for (const pattern of searches) {
      findings = [...findings, ...minimatch.match([commit.subject], `**${pattern}**`)]
    }
    if (findings.length > 0) {
      res.commitHashes.push(commit.hash)
    }
  }
  return res
}

function encodeByDevlogGlob(searchPattern: string, codeValueLabel: string): AppliedCode {
  let res: AppliedCode = {
    code: codeValueLabel,
    commitHashes: []
  }
  const searches = searchPattern.split('\n')
  const commits = get(repo).commits
  for (const commit of commits) {
    let findings = []
    const dl = allDevlogs.get(commit.hash)?.content
    for (const pattern of searches) {
      const found =
        commit.subject.toLowerCase().indexOf(pattern.toLowerCase()) > -1 ||
        commit.body.toLowerCase().indexOf(pattern.toLowerCase()) > -1 ||
        dl.toLowerCase().indexOf(pattern.toLowerCase()) > -1
      if (found) {
        findings = [...findings, commit.hash]
      }
    }
    if (findings.length > 0) {
      res.commitHashes.push(commit.hash)
    }
  }
  return res
}
