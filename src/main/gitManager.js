import * as Git from 'simple-git';
import * as path from 'path';
import fs from 'fs-extra';
import { normalizePath, getGithubUrl } from './helpers';

// import { Commit, RepoDirent } from '../types';

/**
 *Loads Git log data from a GitHub repository.
 *
 * @class GitManager
 */
class GitManager {
  /**
   * Creates an instance of GitManager.
   * @param {string} clonePath
   * @memberof GitManager
   */
  constructor(clonePath) {
    this.clonePath = clonePath;
    if (!fs.pathExistsSync(this.clonePath)) {
      fs.emptyDirSync(this.clonePath);
    }
    this.git = Git.simpleGit(clonePath);
  }

  /**
   * cloneRepo
   *
   * @param {string} userRepoInfo
   * @return {*} git repo object
   * @memberof GitManager
   */
  async cloneRepo(userRepoInfo) {
    let foundLocalClone = false;
    if (fs.pathExistsSync(this.clonePath)) {
      try {
        console.log(await this.git.log(['-n 1']));
        foundLocalClone = true;
      } catch (error) {
        foundLocalClone = false;
      }
    }
    if (foundLocalClone) {
      return;
    }
    const url = await getGithubUrl(userRepoInfo);
    fs.emptyDirSync(this.clonePath);
    return await Git.simpleGit().clone(url, this.clonePath, { '-n': null });
  }

  async loadFrom(userRepoInfo = '', notifyProgressCb) {
    notifyProgressCb('Cloning repository...');
    await this.cloneRepo(userRepoInfo);
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
    });
    notifyProgressCb(`Processing commits...(0/${logData.all.length})`);
    const commits = [];
    for (const commitLog of logData.all) {
      const commit = {
        ...commitLog,
        fileTree: [],
        author: {
          name: commitLog.author_name,
          timestamp: Number(commitLog.author_timestamp) * 1000
        },
        fileList: [],
        committer: {
          name: commitLog.committer_name,
          timestamp: Number(commitLog.committer_timestamp) * 1000
        },
        refs: commitLog.refs.split(',').map((b) => b.split(' ')[0]),
        branches: await this.getBranches(commitLog.hash),
        fileChangeStats: [],
        lineChangeStats: [{ is_empty: true }]
      };

      let logFileChanges = await this.git.raw('show', commit.hash, '--name-status', '--pretty=%h');
      logFileChanges = logFileChanges.substring(logFileChanges.split('\n')[0].length + 2, logFileChanges.length).trim();
      commit.fileChangeStats = logFileChanges.split('\n').map((f) => {
        return {
          operation: f.split('\t')[0],
          filepath: f.split('\t')[1]
        };
      });
      const logLineChanges = await this.git.raw('show', commit.hash, '--numstat', '--pretty=%h');
      const splitLCs = logLineChanges.substring(logLineChanges.split('\n')[0].length + 2, logLineChanges.length).trim();
      //console.log(splitLCs)
      if (logLineChanges == '') {
        commit.lineChangeStats = [{ is_empty: true }];
      } else {
        commit.lineChangeStats = splitLCs.split('\n').map((l) => {
          const res = {
            is_empty: l.split('\t')[0] == '',
            is_binary: l.split('\t')[0] == '-',
            added_lines: l.split('\t')[0],
            deleted_lines: l.split('\t')[1],
            filepath: l.split('\t')[2]
          };
          return res;
        });
      }
      commit.fileList = await this.getFileList(commit.tree, commit.hash);
      commit.fileTree = await this.getFileTree(commit.tree, commit.hash);
      commits.push(commit);
      notifyProgressCb(`Processing commits...(${commits.length}/${logData.all.length})`);
    }
    return commits;
  }

  async getFileList(commitTree) {
    const paths = [...(await this.git.raw(['ls-tree', commitTree, '-r', '--name-only'])).trim().split('\n')];
    return paths;
  }

  async getFileTree(tree, commitHash) {
    const hierarchy = {};
    // var hierarchy = []
    // adapted from https://codereview.stackexchange.com/questions/158134/generate-a-nested-structure-based-on-a-list-of-file-paths
    const paths = [...(await this.git.raw(['ls-tree', tree, '-r', '--name-only'])).trim().split('\n')];
    paths.forEach(function (filePath) {
      filePath.split('/').reduce(function (r, e) {
        return r[e] || (r[e] = {});
      }, hierarchy);
    });
    return this.getTree(hierarchy, '', '', '', commitHash);
  }

  getTree(hierarchy, rootPath, folderPath, baseAbsPath, commitHash) {
    const res = [];
    for (const entry of Object.keys(hierarchy)) {
      const children = Object.keys(hierarchy[entry]);
      const childrenCount = children.length;
      // is file
      if (childrenCount <= 0) {
        res.push({
          name: entry,
          rel: normalizePath(path.relative(rootPath, path.join(folderPath, entry))),
          abs: normalizePath(path.join(baseAbsPath, folderPath, entry)),
          selected: false,
          commitHash: commitHash
        });
      } else {
        res.push({
          name: entry,
          rel: normalizePath(path.join(folderPath, entry)),
          abs: normalizePath(path.join(baseAbsPath, folderPath, entry)),
          selected: false,
          commitHash: commitHash,
          children: this.getTree(hierarchy[entry], rootPath, path.join(folderPath, entry), baseAbsPath, commitHash)
        });
      }
    }
    res.sort((a, b) => {
      if (a.children && !b.children) return -1;
      if (!a.children && b.children) return 1;
      return a < b ? 1 : 1;
    });
    return res;
  }

  async getBranches(commitHash) {
    const branchList = await this.git.branch(['-a', '--contains', commitHash]);
    return branchList.all.filter((b) => b.startsWith('remote'));
  }

  async getTextFileAt(filepath, commitHash) {
    const gitPath = filepath.split(path.sep).join(path.posix.sep);
    return (await this.git.showBuffer([`${commitHash}:${gitPath}`])).toString();
  }

  async getFileAt(filepath, commitHash) {
    const gitPath = filepath.split(path.sep).join(path.posix.sep);
    return await this.git.showBuffer([`${commitHash}:${gitPath}`]);
  }
}
export default GitManager;

export function parseTrailers(trailers = '') {
  if (trailers == '') {
    return [];
  }
  const res = [];
  const all = trailers.split('\n');
  for (const trailer of all) {
    const key = trailer.split(':')[0].trim();
    const value = trailer.split(':')[1].trim();
    res.push({ key, value });
  }
  return res;
}
