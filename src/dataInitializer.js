const GitLoader = require("./gitLogLoader");
const utils = require("./helpers");

const fs = require("fs-extra");
const { join } = require("path");
const log = require("npmlog");
const downloadLib = require("download");
const AdmZip = require("adm-zip");

class DataInitializer
{
  /**
   *Creates an instance of DataInitializer.
   * @param {*} repoInfo
   * @param {string} [sourceAbsPath] This should be an absolute path.
   * @memberof DataInitializer
   */
  constructor(repoInfo, sourceAbsPath, tempPath)
  {
    if (!utils.isRepoInfoValid(repoInfo))
    {
      throw new Error("Invalid repo info.");
    }
    this.repoInfo = repoInfo;
    this.sourceAbsPath = sourceAbsPath;
    this.tempPath = tempPath;
    this.gitLoader = new GitLoader();
  }

  async loadCommitsFromGit()
  {
    let res;
    try
    {
      const clonePath = join(this.tempPath, "clone");
      res = await this.gitLoader.loadFrom(this.repoInfo, clonePath);
      return res;
    } catch (error)
    {
      throw error;
    }
  }

  async prepareAnnotations(annotationsFolder) 
  {
    log.verbose("ARCH", `Copying annotations from ${annotationsFolder}.`);

    try
    {
      let dest = join(this.sourceAbsPath, "annotations");
      fs.emptyDirSync(dest);
      if (fs.existsSync(annotationsFolder))
      {
        await fs.copy(annotationsFolder, dest);
        log.verbose("ARCH", "Copied annotations to " + dest + ".");
      } else
      {
        // No devlog folder on source, so just skips.
        log.verbose(
          "ARCH",
          "No annotations at " + annotationsFolder + ". Skipping..."
        );
      }
    } catch (error)
    {
      log.warn("ARCH", `Error copying annotations. ${error} Skipping...`);
    }
  }

  async prepareDevlogs(allCommits, devlogsFolder)
  {
    if (
      allCommits == undefined ||
      !Array.isArray(allCommits) ||
      allCommits.length == 0
    )
    {
      throw new Error("Invalid commit data.");
    }

    const commitHash = allCommits[0].hash;
    let src = join(this.tempPath, "zips", commitHash, devlogsFolder);
    log.verbose(
      "ARCH",
      `Copying devlogs from dev repo's latest commit (#${allCommits[0].hashAbbrev}).`
    );
    try
    {
      let dest = join(this.sourceAbsPath, "devlogs");
      fs.emptyDirSync(dest);
      if (fs.existsSync(src))
      {
        fs.copySync(src, dest, { overwrite: true, errorOnExist: true });
        log.verbose("ARCH", "Copied devlogs to " + dest + ".");
      } else
      {
        // No devlog folder on source, so just skips.
        log.verbose("ARCH", "No devlogs at " + src + ". Skipping...");
      }
    } catch (error)
    {
      log.verbose("ARCH", `Error copying devlogs. ${error} Skipping...`);
    }
    return 0;
  }

  // Create a method that downloads all zips in parallel, using the downloadZip, and handling errors (skipping on fail).
  async downloadZip(commitHash)
  {
    const zipUrl =
      utils.getGithubUrl(this.repoInfo) + "/archive/" + commitHash + ".zip";
    const localTarget = join(this.tempPath, "zips", commitHash.toString());
    if (fs.pathExistsSync(localTarget))
    {
      log.verbose(
        "ARCH",
        `Local folder found. Skipping download for #${commitHash}.`
      );
      return 0;
    } else
    {
      log.verbose("ARCH", `Downloading zip for #${commitHash}...`);
    }
    let res = await downloadLib(zipUrl, localTarget, {
      extract: true,
      strip: 1,
    });
    if (res == undefined)
    {
      throw new Error("Invalid commit hash.");
    }
    return 0;
  }

  async saveCommitsToBuilderSrc(commitData)
  {
    for (let i = 0; i < commitData.length; i++)
    {
      const commit = commitData[i];
      let dest = join(
        this.sourceAbsPath,
        "commits",
        `${commit.hashAbbrev}.json`
      );
      await fs.outputJson(dest, commit);
    }
  }

  async saveRepoInfoToBuilderSrc(userRepo)
  {
    var repoData = {
      name: userRepo,
      url: utils.getGithubUrl(userRepo),
    };
    let dest = join(this.sourceAbsPath, "_data/repo.json");
    return fs.outputJson(dest, repoData);
  }

  async saveBuildsInfoToBuilderSrc(commitsWithBuilds)
  {
    let dest = join(this.sourceAbsPath, "_data/builds.json");
    return fs.outputJson(dest, commitsWithBuilds);
  }

  async preparePlayableBuilds(
    allCommits,
    tempAbsPath,
    outputAbsPath,
    buildsRelPath = null,
    buildAsZip
  )
  {
    // Confirms that build path is valid
    if (
      buildsRelPath == null ||
      buildsRelPath == "" ||
      typeof buildsRelPath != "string"
    )
    {
      throw new utils.BuildError("Invalid builds folder.");
    }
    // For each commit, copy from temp/zips/<hash> to _site/builds/<hash>/
    let copyingPromises = [];
    allCommits.forEach((commit) =>
    {
      let src = join(tempAbsPath, "zips", commit.hash, buildsRelPath);
      let dest = join(outputAbsPath, "commits", commit.hashAbbrev, "play");
      if (buildAsZip)
      {
        copyingPromises.push(copyBuildAsZip(src, dest, commit.hashAbbrev));
      } else
      {
        copyingPromises.push(copyBuild(src, dest));
      }
    });
    let res = await Promise.allSettled(copyingPromises);
    let buildsCopiedCount = 0;
    let commitsWithBuilds = {};
    res.forEach((ops, i) =>
    {
      if (ops.status == "rejected")
      {
        log.verbose("ARCH", `Build folder not copied: ${ops.reason}`);
      } else
      {
        buildsCopiedCount += 1;
        commitsWithBuilds[allCommits[i].hash] = {};
        commitsWithBuilds[allCommits[i].hash].hasBuild = true;
        commitsWithBuilds[allCommits[i].hash].isZip = buildAsZip;
      }
    });
    log.verbose(
      "ARCH",
      `Copied ${buildsCopiedCount}/${res.length} playable builds.`
    );
    return commitsWithBuilds;
  }
}

async function copyBuild(src, dest)
{
  if (!fs.existsSync(src))
  {
    throw new utils.BuildError("Source build folder not found.");
  }
  return fs.copy(src, dest);
}

async function copyBuildAsZip(src, dest, id)
{
  if (!fs.existsSync(src))
  {
    throw new utils.BuildError("Source build folder not found.");
  }
  let zip = new AdmZip();
  await zip.addLocalFolderPromise(src, "");
  return zip.writeZipPromise(join(dest, `build_${id}.zip`));
}

module.exports = DataInitializer;
