const simpleGit = require("simple-git");
const git2json = require("@fabien0102/git2json");
const fs = require("fs-extra");
const utils = require("./helpers");

/**
 *Loads Git log data from a GitHub repository.
 *
 * @class GitLogLoader
 */
class GitLogLoader {
  async loadFrom(userRepoInfo, clonePath) {
    await cloneRepo(userRepoInfo, clonePath);
    return await git2json.run({ path: clonePath });
  }
}

module.exports = GitLogLoader;

async function cloneRepo(userRepoInfo, clonePath) {
  let url = utils.getGithubUrl(userRepoInfo);
  fs.emptyDirSync(clonePath);
  return await simpleGit().clone(url, clonePath);
}
