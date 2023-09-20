import { app } from 'electron'
import * as path from 'path'

export function getRepoClonePath(user, repo) {
  return path.join(getPathForRepo(user, repo), 'clone')
}

export function getRepoZipsPath(user, repo) {
  return path.join(getPathForRepo(user, repo), 'zips')
}

export function getAppGitDataPath() {
  return path.join(app.getPath('temp'), 'repo-to-qda/gitData')
}

export function getPathForRepo(user, repo) {
  const user_repo = `${user}--${repo}`
  const repoRootFolder = path.join(getAppGitDataPath(), user_repo)
  return repoRootFolder
}

export function getPathForCommit(user, repo, commitHash) {
  const repoBasePath = getPathForRepo(user, repo)
  return path.join(repoBasePath, 'commits', commitHash)
}
