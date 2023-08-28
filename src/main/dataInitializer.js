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

  async downloadZip(commitHash) {
    const zipUrl = utils.getGithubUrl(this.repoInfo) + '/archive/' + commitHash + '.zip'
    const localZipsTarget = join(this.tempPath, 'zips')
    fs.emptyDirSync(localZipsTarget)
    const localFile = join(localZipsTarget, `${commitHash}.zip`)
    await utils.fetch(zipUrl, localFile)
    const zip = new AdmZip(localFile)
    zip.extractAllTo(localZipsTarget)
  }
}

export default DataInitializer
