import * as Git from 'simple-git'
import fs from 'fs-extra'
import { run as gitLogFormat } from '@fabien0102/git2json'
import { emptyDirSync } from 'fs-extra'
import utils from './helpers'
import { Commit } from '../types'

/**
 *Loads Git log data from a GitHub repository.
 *
 * @class GitLogLoader
 */
class GitLogLoader {
  private git: Git.SimpleGit

  constructor() {
    this.git = Git.simpleGit()
  }

  async #cloneRepo(userRepoInfo, clonePath): Promise<Git.Response<string> | undefined> {
    let foundLocalClone = false
    if (fs.pathExistsSync(clonePath)) {
      try {
        Git.simpleGit(clonePath).log(['-n 1'])
        foundLocalClone = true
      } catch (error) {
        foundLocalClone = false
      }
    }
    if (foundLocalClone) {
      return
    }
    const url = await utils.getGithubUrl(userRepoInfo)
    emptyDirSync(clonePath)
    return await Git.simpleGit().clone(url, clonePath)
  }

  async loadFrom(userRepoInfo = '', clonePath = ''): Promise<Commit[]> {
    await this.#cloneRepo(userRepoInfo, clonePath)
    this.git = Git.simpleGit(clonePath)
    const commitData = await gitLogFormat({ path: clonePath })
    return commitData
  }

  async getFileList(tree: any): Promise<string[]> {
    const ft = await this.git.raw(['ls-tree', tree, '-r', '--name-only'])
    const res = ft.split('\n').filter((e) => e != '')
    return res
  }
}
export default GitLogLoader
