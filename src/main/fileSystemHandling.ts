import { app } from 'electron'
import * as path from 'path'
// import * as fs from 'fs-extra'

export function getRepoClonePath(user: string, repo: string): string {
  return path.join(getPathForRepo(user, repo), 'clone')
}

export function getRepoZipsPath(user: string, repo: string): string {
  return path.join(getPathForRepo(user, repo), 'zips')
}

export function getAppGitDataPath(): string {
  return path.join(app.getPath('temp'), 'repo-to-qda/gitData')
}

export function getPathForRepo(user: string, repo: string): string {
  const user_repo = `${user}--${repo}`
  const repoRootFolder = path.join(getAppGitDataPath(), user_repo)
  return repoRootFolder
}

export function getPathForCommit(user: string, repo: string, commitHash: string): string {
  const repoBasePath = getPathForRepo(user, repo)
  return path.join(repoBasePath, 'commits', commitHash)
}
