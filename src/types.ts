import type fsExtra = require('fs-extra')

declare global {
  const __VERSION__: string
  interface Window {
    loader: {
      checkRepoInfo: (userRepoInfo: string) => Promise<boolean>
      saveDialog: (saveOptions: unknown) => void
      loadDialog: (loadOptions: unknown) => any
      loadRepoData: (userRepoInfo: string) => Commit[]
      onDownloadInProgress: (notificationData?: any) => any
      exportQDPX: (qdpxData: QDPXData, qdpxExportOptions: any) => void
      getDevlogCompilation: (compilationOptions: any) => Promise<any>
      getDevlogForCommit: (commitHash: string, devlogOptions: any) => Promise<any>
    }
    electron: unknown
    files: {
      forceClearCache: () => Promise<void>
      readFile: (rel: fsExtra.PathLike) => Promise<string | Buffer>
      readFileAtCommit: (rel: fsExtra.PathLike, commitHash: string) => Promise<string>
      showInExplorer: (abs: fsExtra.PathLike) => void
      runGlobOnCommit: (searchPattern: string, commitHash: string) => []
    }
  }
}

export type Action = {
  name: string
  guid: string
  active: boolean
  title: string
  description: string
  selectedCommits?: Commit[]
  ignoredCommits?: string[]
  filesToObserve?: string[]
  selectedFiles?: RepoDirent[]
  selectedFolders?: RepoDirent[]
  codesToApply?: AppliedCode[]
  searchPattern?: string
  inputCommitOption?: 'latest' | 'any'
}

export type QDPXData = {
  sources: []
  commits: []
  codes: []
}

export type CodeOption = {
  id: string
  value: string
  label: string
  created?: boolean
}

export type RepoDirent = {
  name: string
  selected: boolean
  abs?: fsExtra.PathLike
  rel: fsExtra.PathLike
  children?: RepoDirent[]
  commitHash?: string
}

export type RepoInfo = {
  userName: string
  repoName: string
}

export type Commit = {
  hash: string
  hashAbbrev: string
  author: CommitAuthor
  committer: CommitAuthor
  subject: string
  body: string
  refs: string[]
  tree: string
  treeAbbrev: string
  branches: string[]
  fileTree: RepoDirent[]
  fileChangeStats: { operation: string; filepath: string }[]
  lineChangeStats: {
    added_lines?: number | string
    deleted_lines?: number | string
    is_binary?: boolean
    is_empty?: boolean
    filepath?: string
  }[]
  trailers?: string
  appliedCodes?: AppliedCode[]
}

export type CommitAuthor = {
  name: string
  timestamp: number
}

export type Devlog = {
  parent?: string
  hashAbbrev: string
  name: string
  originalExt: string
  content: string
}

export type AppliedCode = {
  code: { id: string; value: string; label: string }
  commitHashes: string[]
}
