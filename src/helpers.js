const axios = require("axios");

class RepoError extends Error {}
class BuildError extends Error {}

const childProcess = require("child_process");

/**
 * @param {string} command A shell command to execute
 * @return {Promise<string>} A promise that resolve to the output of the shell command, or an error
 * @example const output = await execute("ls -alh");
 */
function execute(command) {
  /**
   * @param {Function} resolve A function that resolves the promise
   * @param {Function} reject A function that fails the promise
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
   */
  return new Promise(function (resolve, reject) {
    /**
     * @param {Error} error An error triggered during the execution of the childProcess.exec command
     * @param {string|Buffer} standardOutput The result of the shell command execution
     * @param {string|Buffer} standardError The error resulting of the shell command execution
     * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
     */
    childProcess.exec(command, function (error, standardOutput, standardError) {
      if (error) {
        reject();

        return;
      }

      if (standardError) {
        reject(standardError);

        return;
      }

      resolve(standardOutput);
    });
  });
}

module.exports = {
  RepoError,
  BuildError,
  isRepoInfoValid,
  getGithubUrl: (userRepoInfo) => {
    if (userRepoInfo == "" || typeof userRepoInfo != "string") {
      throw new Error("Empty or invalid user/repo.");
    }
    return `https://github.com/${userRepoInfo}`;
  },
  validateGithubRepo: async (userRepoInfo) => {
    if (!isRepoInfoValid(userRepoInfo)) {
      throw new RepoError("Invalid repository info.");
    }
    try {
      const split = userRepoInfo.split("/");
      let url = `https://github.com/${split[0]}/${split[1]}`;
      let command = `git ls-remote --exit-code -h "${url}"`;
      let res = await execute(command);
      // const split = userRepoInfo.split("/");
      // let res = await axios.get(`https://github.com/${split[0]}/${split[1]}`);
      // return true;
    } catch (error) {
      if (error == undefined) {
        throw new RepoError("Repository could not be found (404).");
      } else if (error.response.status == 404) {
        throw new RepoError("Repository could not be found (404).");
      } else {
        throw new RepoError(`Unexpected error pinging repo. ${error.message}`);
      }
    }
  },
};

function isRepoInfoValid(repoInfo) {
  return repoInfo != undefined && typeof repoInfo == "string" && repoInfo != "";
}
