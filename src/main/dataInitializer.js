import * as fs from 'fs-extra'
import { join, resolve, relative } from 'path'
import AdmZip from 'adm-zip'
import { glob } from 'glob'

import GitLoader from './gitLogLoader'
import utils from './helpers'
import * as files from './fileSystemHandling'

class DataInitializer {
  /**
   *Creates an instance of DataInitializer.
   * @param {*} repoInfo
   * @param {string} [dataFolderPath] This should be an absolute path.
   * @memberof DataInitializer
   */
  constructor(repoInfo, inputPath) {
    if (!utils.isRepoInfoValid(repoInfo)) {
      throw new Error('Invalid repo info.')
    }
    this.repoInfo = repoInfo
    this.userName = repoInfo.split('/')[0]
    this.repoName = repoInfo.split('/')[1]
    this.repoPath = inputPath
    this.gitLoader = new GitLoader()
    this.zipsPath = files.getRepoZipsPath(this.userName, this.repoName)
    this.clonePath = files.getRepoClonePath(this.userName, this.repoName)
  }

  async loadCommitsFromGit() {
    let res
    res = await this.gitLoader.loadFrom(this.repoInfo, this.clonePath)
    return res
  }

  async getFileList(commitTree) {
    return this.gitLoader.getFileList(commitTree)
  }

  async convertToFileTree(fileList, baseAbsPath, commitHash) {
    let tree = []
    let hierarchy = {}
    // var hierarchy = []
    // adapted from https://codereview.stackexchange.com/questions/158134/generate-a-nested-structure-based-on-a-list-of-file-paths
    let paths = [...fileList]
    paths.forEach(function (filePath) {
      filePath.split('/').reduce(function (r, e) {
        return r[e] || (r[e] = {})
      }, hierarchy)
    })
    tree = this.getTree(hierarchy, '', '', baseAbsPath, commitHash)

    return tree
  }

  getTree(hierarchy, rootPath, folderPath, baseAbsPath, commitHash) {
    let res = []
    for (const entry of Object.keys(hierarchy)) {
      let children = Object.keys(hierarchy[entry])
      let childrenCount = children.length
      // is file
      if (childrenCount <= 0) {
        res.push({
          name: entry,
          rel: relative(rootPath, join(folderPath, entry)),
          abs: join(baseAbsPath, folderPath, entry),
          selected: false,
          commitHash: commitHash
        })
      } else {
        res.push({
          name: entry,
          rel: join(folderPath, entry),
          abs: join(baseAbsPath, folderPath, entry),
          selected: false,
          commitHash: commitHash,
          children: this.getTree(hierarchy[entry], rootPath, join(folderPath, entry), baseAbsPath)
        })
      }
    }
    return res
  }
  async startDownloadZip(commitHash, onProgressCb) {
    const zipUrl = utils.getGithubUrl(this.repoInfo) + '/archive/' + commitHash + '.zip'
    const localFile = join(this.zipsPath, `${commitHash}.zip`)
    return utils.fetch(zipUrl, localFile, onProgressCb)
  }

  extractAllZips(allCommitHashes) {
    let promises = []
    for (const commitHash of allCommitHashes) {
      const localFile = join(this.zipsPath, `${commitHash}.zip`)
      const zip = new AdmZip(localFile)
      promises.push(
        new Promise((resolve, reject) => {
          try {
            const pathToCommit = files.getPathForCommit(this.userName, this.repoName, commitHash)
            fs.removeSync(pathToCommit)
            zip.extractAllToAsync(this.zipsPath, true, false, () => {
              const extractedZip = join(this.zipsPath, `${this.repoName}-${commitHash}`)
              fs.moveSync(extractedZip, pathToCommit)
              resolve(commitHash)
            })
          } catch (error) {
            reject(error)
          }
        })
      )
    }
    return promises
  }

  getExtractedZipPathForCommit(commitHash) {
    const localZipFolder = files.getPathForCommit(this.userName, this.repoName, commitHash)
    return localZipFolder
  }

  async runGlobOnCommit(pattern, commitHash) {
    const g = await glob(pattern, {
      cwd: files.getPathForCommit(this.userName, this.repoName, commitHash)
    })
    return g
  }

  async readFileAtCommit(filePath, commitHash) {
    const fullPathAtCommit = join(
      files.getPathForCommit(this.userName, this.repoName, commitHash),
      filePath
    )
    return await fs.readFile(fullPathAtCommit, 'utf-8')
  }

  showFilesAsTree(files, commitHash) {
    let tree = []
    for (const file of files) {
      resolve(files.getPathForCommit(this.userName, this.repoName, commitHash), file)
    }

    return tree
  }
}

export default DataInitializer
