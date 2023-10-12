import simpleGit from 'simple-git'
import fs from 'fs-extra'
import { run as gitLogFormat } from '@fabien0102/git2json'
import { emptyDirSync } from 'fs-extra'
import utils from './helpers'

/**
 *Loads Git log data from a GitHub repository.
 *
 * @class GitLogLoader
 */
class GitLogLoader {
  /**
   *
   * @param {string} userRepoInfo Formatted as username/repo_name
   * @param {string} clonePath Path to where the Git repo will be cloned to.
   * @returns An object with repository data.
   */
  async loadFrom(userRepoInfo = '', clonePath = '') {
    await cloneRepo(userRepoInfo, clonePath)
    this.git = simpleGit(clonePath)
    const commitData = await gitLogFormat({ path: clonePath })
    return commitData
  }

  async getFileList(tree) {
    const ft = await this.git.raw(['ls-tree', tree, '-r', '--name-only'])
    const res = ft.split('\n').filter((e) => e != '')
    return res
  }

  async loadFileTree(commitTree) {
    return await this.getFileList(commitTree)
  }
}

export default GitLogLoader

async function cloneRepo(userRepoInfo, clonePath) {
  let foundLocalClone = false
  if (fs.pathExistsSync(clonePath)) {
    try {
      simpleGit(clonePath).log(['-n 1'])
      foundLocalClone = true
    } catch (error) {
      foundLocalClone = false
    }
  }
  if (foundLocalClone) {
    return
  }
  let url = await utils.getGithubUrl(userRepoInfo)
  emptyDirSync(clonePath)
  return await simpleGit().clone(url, clonePath)
}
