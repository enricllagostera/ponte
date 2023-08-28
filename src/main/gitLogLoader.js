import simpleGit from 'simple-git'
import { run } from '@fabien0102/git2json'
import { emptyDirSync } from 'fs-extra'
import utils from './helpers'

/**
 *Loads Git log data from a GitHub repository.
 *
 * @class GitLogLoader
 */
class GitLogLoader {
  async loadFrom(userRepoInfo, clonePath) {
    await cloneRepo(userRepoInfo, clonePath)
    return await run({ path: clonePath })
  }
}

export default GitLogLoader

async function cloneRepo(userRepoInfo, clonePath) {
  let url = await utils.getGithubUrl(userRepoInfo)
  emptyDirSync(clonePath)
  return await simpleGit().clone(url, clonePath)
}
