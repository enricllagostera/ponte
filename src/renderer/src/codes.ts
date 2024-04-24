import { get, writable, type Writable } from 'svelte/store'
import type { AppliedCode, Code, HASH, GUID } from '../../types'
import { allDevlogs, repo, uniqueArray } from './stores'
import { minimatch } from 'minimatch'

export const allCodes = writable(new Map<GUID, Code>())
export const codesInCommit = new Map<HASH, Writable<GUID[]>>()
export const commitsInCode = new Map<GUID, Writable<HASH[]>>()

export const autoencoders = writable({
  onChangeEncoders: [],
  onSubjectEncoders: [],
  onDevlogEncoders: []
})

export function initCommitEncodingsMap(): void {
  if (commitsInCode.size > 0) {
    codesInCommit.clear()
    for (const [codeId, commitHashes] of commitsInCode) {
      for (const hash of get(commitHashes)) {
        const codesInCommitStore = codesInCommit.get(hash)
        if (codesInCommitStore != undefined) {
          codesInCommit.get(hash).set([...get(codesInCommitStore), codeId])
        } else {
          codesInCommit.get(hash).set([])
        }
      }
    }
  }
  get(allCodes).clear()
  for (const commit of get(repo).commits) {
    setCodesInCommit(commit.hash, [])
  }
}

function addEncodingToCommit(codeId: GUID, commitHash: HASH): void {
  const all = get(allCodes)
  const foundCode = all.get(codeId)
  if (foundCode == undefined) {
    console.error('Tried to add encoding for inexisting code GUID.')
    // all.set(codeId, { guid: codeId, label: codeId, value: codeId })
  }
  setCodesInCommit(commitHash, [codeId])
  setCommitsInCode(codeId, [commitHash])
}

export function addEncodingToCommits(codeId: GUID, commitHashes: HASH[]): void {
  for (const commitHash of commitHashes) {
    addEncodingToCommit(codeId, commitHash)
  }
}

function setCodesInCommit(commitHash: HASH, codeIds: GUID[], reset: boolean = false): void {
  let codesInCommitStore = codesInCommit.get(commitHash)
  if (codesInCommitStore == undefined) {
    //console.log('lazy initialization of codesInCommit for ' + commitHash)
    codesInCommitStore = writable([])
  }
  if (reset) {
    codesInCommitStore.set(uniqueArray([...codeIds]))
  } else {
    codesInCommitStore.set(uniqueArray([...get(codesInCommitStore), ...codeIds]))
  }
  codesInCommit.set(commitHash, codesInCommitStore)
}

function setCommitsInCode(codeId: GUID, commitHashes: HASH[], reset: boolean = false): void {
  const commitsInCodeStore = commitsInCode.get(codeId) ?? writable([])
  if (reset) {
    commitsInCodeStore.set(uniqueArray([...commitHashes]))
  } else {
    commitsInCodeStore.set(uniqueArray([...get(commitsInCodeStore), ...commitHashes]))
  }
  commitsInCode.set(codeId, commitsInCodeStore)
}

export function getCodeIdsInCommit(commitHash: HASH): GUID[] {
  const store = codesInCommit.get(commitHash)
  if (store == null) {
    return []
  }
  return get(store)
}

export function getCommitsInCode(codeId: GUID): HASH[] {
  const store = commitsInCode.get(codeId)
  if (store == null) {
    return []
  }
  return get(store)
}

export function removeEncodingFromCommit(codeId: GUID, commitHash: HASH): void {
  const all = get(allCodes)
  setCommitsInCode(codeId, uniqueArray([...getCommitsInCode(codeId)].filter((ch) => ch != commitHash)), true)

  setCodesInCommit(commitHash, uniqueArray([...getCodeIdsInCommit(commitHash)].filter((cd) => cd != codeId)), true)

  if (get(commitsInCode.get(codeId)).length == 0) {
    commitsInCode.get(codeId).set([])
    codesInCommit.get(commitHash).set([])
    commitsInCode.delete(commitHash)
    all.delete(codeId)
  }
}

export function removeEncodingFromAll(codeId: GUID): void {
  for (const commit of get(repo).commits) {
    removeEncodingFromCommit(codeId, commit.hash)
  }
  updateAllEncodings()
}

export function getCodeIdByValue(codeValue): GUID | undefined {
  const allCodeValues = Array.from(get(allCodes).values())
  return allCodeValues.find((v) => v.value == codeValue)?.id ?? undefined
}

export function updateAllEncodings(): void {
  const all = get(allCodes)

  for (const commit of get(repo).commits) {
    updateEncodingsForCommit(
      getCodeIdsInCommit(commit.hash).map((cid) => all.get(cid)),
      commit.hash
    )
  }
}

export function updateEncodingsForCommit(newCodes: Code[], commitHash: string): void {
  const all = get(allCodes)
  let oldCodes = []
  if (codesInCommit.get(commitHash) != undefined) {
    oldCodes = get(codesInCommit.get(commitHash))
  }
  if (oldCodes != undefined) {
    for (const oldTag of oldCodes) {
      removeEncodingFromCommit(oldTag, commitHash)
    }
  }
  for (const code of newCodes) {
    if (all.get(code.id) == undefined) {
      all.set(code.id, code)
    }
    addEncodingToCommit(code.id, commitHash)
  }
  for (const subjectEncoder of get(autoencoders).onSubjectEncoders) {
    if (all.get(subjectEncoder.id) == undefined) {
      all.set(subjectEncoder.id, { id: subjectEncoder.id, value: subjectEncoder.code })
    }
    const targetCommits = encodeBySubjectsGlob(subjectEncoder.glob)
    addEncodingToCommits(subjectEncoder.id, targetCommits)
  }
  for (const devlogEncoder of get(autoencoders).onDevlogEncoders) {
    if (all.get(devlogEncoder.id) == undefined) {
      all.set(devlogEncoder.id, { id: devlogEncoder.id, value: devlogEncoder.code })
    }
    const targetCommits = commitsToEncodeByDevlogGlob(devlogEncoder.glob)
    addEncodingToCommits(devlogEncoder.id, targetCommits)
  }
  for (const changeEncoder of get(autoencoders).onChangeEncoders) {
    if (all.get(changeEncoder.id) == undefined) {
      all.set(changeEncoder.id, { id: changeEncoder.id, value: changeEncoder.code })
    }
    const targetCommits = commitsToEncodeByChangesGlob(changeEncoder.glob)
    addEncodingToCommits(changeEncoder.id, targetCommits)
  }

  allCodes.set(all)
}

function commitsToEncodeByChangesGlob(searchPattern: string): HASH[] {
  const commitHashes = []
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
      commitHashes.push(commit.hash)
    }
  }
  return commitHashes
}

export function getCodesAsAppliedCodes(): AppliedCode[] {
  const res: AppliedCode[] = []
  for (const [codeId, codeValue] of get(allCodes)) {
    res.push({
      code: { id: codeId, value: codeValue.value, label: codeValue.value },
      commitHashes: get(commitsInCode.get(codeId)) ?? []
    })
  }
  return res
}

function encodeBySubjectsGlob(searchPattern: string): HASH[] {
  const commitHashes: HASH[] = []
  const searches = searchPattern.split('\n')
  const commits = get(repo).commits
  for (const commit of commits) {
    let findings = []
    for (const pattern of searches) {
      findings = [...findings, ...minimatch.match([commit.subject], `**${pattern}**`)]
    }
    if (findings.length > 0) {
      commitHashes.push(commit.hash)
    }
  }
  return commitHashes
}

function commitsToEncodeByDevlogGlob(searchPattern: string): HASH[] {
  const commitHashes: HASH[] = []
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
      commitHashes.push(commit.hash)
    }
  }
  return commitHashes
}
