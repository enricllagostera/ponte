import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs-extra'
import * as glob from 'glob'

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

export async function getFileStructure(folderPath) {
  let result = []
  const getDirectories = await fs.readdir(folderPath, { withFileTypes: true })
  const fileNames = getDirectories
    .filter((dirent) => !dirent.isDirectory())
    .map((dirent) => path.join(folderPath, dirent.name))

  result.push(...fileNames)

  const folderNames = getDirectories
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const folder of folderNames) {
    result.push(...(await getFileStructure(path.join(folderPath, folder))))
  }

  return result
}
