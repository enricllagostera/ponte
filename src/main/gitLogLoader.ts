import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import fs from 'fs-extra'

// import fs from 'fs'
// import * as Git from 'simple-git'
// import { run as gitLogFormat } from '@fabien0102/git2json'

import { emptyDirSync } from 'fs-extra'
import utils from './helpers'
import { Commit } from '../types'

/**
 *Loads Git log data from a GitHub repository.
 *
 * @class GitLogLoader
 */
class GitLogLoader {
  private dir: string

  constructor(clonePath: string) {
    this.dir = clonePath
  }

  async #cloneRepo(userRepoInfo): Promise<void> {
    let foundLocalClone = false
    if (fs.pathExistsSync(this.dir)) {
      try {
        await git.log({ fs, dir: this.dir, depth: 1 })
        foundLocalClone = true
      } catch (error) {
        foundLocalClone = false
      }
    }
    if (foundLocalClone) {
      return
    }
    const url = await utils.getGithubUrl(userRepoInfo)
    emptyDirSync(this.dir)
    return await git.clone({ fs, http, dir: this.dir, url })
  }

  async loadFrom(userRepoInfo = '', clonePath = ''): Promise<Commit[]> {
    // git.clone({ fs, http, dir, url: 'https://github.com/isomorphic-git/lightning-fs' })
    // .then(console.log)
    await this.#cloneRepo(userRepoInfo, clonePath)
    const commitData = await git.log({ fs, dir: this.dir })
    let commits: Commit[] = []
    commits = commitData.map((cr) => {
      const commit: Commit = {
        hash: cr.oid,
        hashAbbrev: cr.oid.substring(0, 7),
        author: { ...cr.commit.author },
        committer: { ...cr.commit.committer },
        subject: cr.commit.message.split('\n')[0],
        body: cr.commit.message
          .substring(cr.commit.message.split('\n')[0].length, cr.commit.message.length)
          .trim(),
        refs: [],
        tree: cr.commit.tree,
        parents: cr.commit.parent,
        fileTree: []
      }
      commit.author.timestamp *= 1000
      commit.committer.timestamp *= 1000
      return commit
    })
    const remoteInfo = await git.getRemoteInfo({
      http,
      url: utils.getGithubUrl(userRepoInfo) + '.git'
    })
    console.log(remoteInfo)
    for (const c of commits) {
      c.branches = []
      for (const branchName in remoteInfo.refs.heads) {
        if (
          (await git.isDescendent({
            fs,
            dir: this.dir,
            oid: remoteInfo.refs.heads[branchName],
            ancestor: c.hash
          })) ||
          remoteInfo.refs.heads[branchName] == c.hash
        ) {
          c.branches.push(branchName)
        }
      }
    }
    return commits
  }

  // async getFileList(tree: any): Promise<string[]> {
  //   const ft = await this.git.raw(['ls-tree', tree, '-r', '--name-only'])
  //   const res = ft.split('\n').filter((e) => e != '')
  //   return res
  // }

  // async getBranches(commitHash: string): Promise<string[]> {
  //   const ft = await this.git.branch(['-a', '--contains', commitHash])
  //   return ft.all.filter((b) => b.startsWith('remote'))
  // }
}
export default GitLogLoader
