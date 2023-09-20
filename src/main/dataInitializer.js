import GitLoader from './gitLogLoader'
import utils from './helpers'
import * as files from './fileSystemHandling'

import * as fs from 'fs-extra'
import { join } from 'path'
import AdmZip from 'adm-zip'

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

  // async downloadZip(commitHash, onProgressCb) {
  //   const zipUrl = utils.getGithubUrl(this.repoInfo) + '/archive/' + commitHash + '.zip'
  //   fs.emptyDirSync(this.zipsPath)
  //   const localFile = join(this.zipsPath, `${commitHash}.zip`)
  //   await utils.fetch(zipUrl, localFile, onProgressCb)
  //   const zip = new AdmZip(localFile)
  //   zip.extractAllTo(this.zipsPath)
  // }

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
              // console.log('extracted ', commitHash)
              const extractedZip = join(this.zipsPath, `${this.repoName}-${commitHash}`)
              fs.moveSync(extractedZip, pathToCommit)
              //fs.renameSync(extractedZip, pathToCommit)
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
}

export default DataInitializer
