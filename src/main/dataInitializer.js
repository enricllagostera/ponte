import GitLoader from './gitLogLoader'
import utils from './helpers'

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
  constructor(repoInfo, inputPath, processedPath) {
    if (!utils.isRepoInfoValid(repoInfo)) {
      throw new Error('Invalid repo info.')
    }
    this.repoInfo = repoInfo
    this.repoName = repoInfo.split('/')[1]
    this.inputPath = inputPath
    this.processedPath = processedPath
    this.gitLoader = new GitLoader()
  }

  async loadCommitsFromGit() {
    let res
    const clonePath = join(this.inputPath, 'clone')
    res = await this.gitLoader.loadFrom(this.repoInfo, clonePath)
    return res
  }

  async downloadZip(commitHash, onProgressCb) {
    const zipUrl = utils.getGithubUrl(this.repoInfo) + '/archive/' + commitHash + '.zip'
    const localZipsTarget = join(this.inputPath, 'zips')
    fs.emptyDirSync(localZipsTarget)
    const localFile = join(localZipsTarget, `${commitHash}.zip`)
    await utils.fetch(zipUrl, localFile, onProgressCb)
    const zip = new AdmZip(localFile)
    zip.extractAllTo(localZipsTarget)
  }

  async startDownloadZip(commitHash, onProgressCb) {
    const zipUrl = utils.getGithubUrl(this.repoInfo) + '/archive/' + commitHash + '.zip'
    const localZipsTarget = join(this.inputPath, 'zips')
    // fs.emptyDirSync(localZipsTarget)
    const localFile = join(localZipsTarget, `${commitHash}.zip`)
    return utils.fetch(zipUrl, localFile, onProgressCb)
  }

  extractAllZips(allCommitHashes) {
    const localZipsTarget = join(this.inputPath, 'zips')
    let promises = []

    for (const commitHash of allCommitHashes) {
      const localFile = join(localZipsTarget, `${commitHash}.zip`)
      const zip = new AdmZip(localFile)
      promises.push(
        new Promise((resolve, reject) => {
          try {
            zip.extractAllToAsync(localZipsTarget, true, true, () => {
              // console.log('extracted ', commitHash)
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
}

export default DataInitializer
