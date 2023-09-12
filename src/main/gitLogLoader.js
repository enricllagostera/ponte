import simpleGit from 'simple-git'
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
    return await gitLogFormat({ path: clonePath })
  }
}

export default GitLogLoader

async function cloneRepo(userRepoInfo, clonePath) {
  let url = await utils.getGithubUrl(userRepoInfo)
  emptyDirSync(clonePath)
  return await simpleGit().clone(url, clonePath)
}
