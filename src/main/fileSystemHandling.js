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

export async function getFileList(folderPath) {
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
    result.push(...(await getFileList(path.join(folderPath, folder))))
  }

  return result
}

export async function getFileTree(folderPath, baseFolder, commitHash) {
  let result = []
  const getDirectories = await fs.readdir(folderPath, { withFileTypes: true })

  const folderNames = getDirectories
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const folder of folderNames) {
    // ...(await getFileList(path.join(folderPath, folder)))
    let newFolder = {
      name: folder,
      abs: path.join(folderPath, folder),
      rel: path.relative(folderPath, path.join(folderPath, folder))
    }
    newFolder.children = [
      ...(await getFileTree(path.join(folderPath, folder), baseFolder, commitHash))
    ]
    if (newFolder.children.length == 0) delete newFolder.children
    result.push(newFolder)
  }

  const fileNames = getDirectories
    .filter((dirent) => !dirent.isDirectory())
    .map((dirent) => {
      return {
        name: dirent.name,
        abs: path.join(folderPath, dirent.name),
        rel: path.relative(baseFolder, path.join(folderPath, dirent.name)),
        selected: false,
        commitHash: commitHash
      }
    })

  result.push(...fileNames)

  return result
}
