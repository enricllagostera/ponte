import * as Git from 'simple-git'
import fs from 'fs-extra'
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
  private clonePath: string

  constructor(clonePath: string) {
    this.clonePath = clonePath
    if (!fs.pathExistsSync(this.clonePath)) {
      emptyDirSync(this.clonePath)
    }
    this.git = Git.simpleGit(clonePath)
  }

  async #cloneRepo(userRepoInfo: string): Promise<Git.Response<string> | undefined> {
    let foundLocalClone = false
    if (fs.pathExistsSync(this.clonePath)) {
      try {
        console.log(await this.git.log(['-n 1']))
        foundLocalClone = true
      } catch (error) {
        foundLocalClone = false
      }
    }
    if (foundLocalClone) {
      return
    }
    const url = await utils.getGithubUrl(userRepoInfo)
    emptyDirSync(this.clonePath)
    return await Git.simpleGit().clone(url, this.clonePath, { '-n': null })
  }

  async loadFrom(userRepoInfo = ''): Promise<Commit[]> {
    await this.#cloneRepo(userRepoInfo)
    // const args = ['-C', path, 'log', `--pretty=format:%x01${prettyKeys}%x01`, '--name-status', '--date-order', '--all']
    const logData = await this.git.log({
      strictDate: true,
      '--all': null,
      '--full-history': null,
      // '--stat': null,
      // '--numstat': null,
      format: {
        hash: '%H',
        hashAbbrev: '%h',
        tree: '%T',
        treeAbbrev: '%t',
        parents: '%P',
        author_name: '%an',
        author_email: '%ae',
        author_timestamp: '%at',
        committer_name: '%cn',
        committer_email: '%ce',
        committer_timestamp: '%at',
        subject: '%s',
        body: '%b',
        refs: '%D',
        trailers: '%(trailers)'
      }
    })
    const commits: Commit[] = [...logData.all] as Commit[]
    for (const commit of commits) {
      commit.fileTree = []
      commit.author = {
        name: commit.author_name,
        timestamp: Number(commit.author_timestamp) * 1000
      }
      commit.committer = {
        name: commit.committer_name,
        timestamp: Number(commit.committer_timestamp) * 1000
      }
      commit.refs = commit.refs.split(',').map((b) => b.split(' ')[0])
      commit.branches = await this.getBranches(commit.hash)
      // commit.fileChangeStats = await this.git.raw(
      //   'log',
      //   commit.hash,
      //   '-1',
      //   '--all',
      //   '--name-status',
      //   '--pretty=%h'
      // )
    }
    return commits
  }

  async getFileList(tree: string): Promise<string[]> {
    const ft = await this.git.raw(['ls-tree', tree, '-r', '--name-only'])
    const res = ft.split('\n').filter((e) => e != '')
    return res
  }

  async getBranches(commitHash: string): Promise<string[]> {
    const ft = await this.git.branch(['-a', '--contains', commitHash])
    return ft.all.filter((b) => b.startsWith('remote'))
  }
}
export default GitLogLoader
