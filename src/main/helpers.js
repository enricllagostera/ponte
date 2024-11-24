import axios from 'axios';
import * as fs from 'fs-extra';
import { v4 as uuid } from 'uuid';
import { DateTime } from 'luxon';
import { normalize as normalizePath } from './normalize-path';

export class RepoError extends Error {}
export class BuildError extends Error {}

export { normalizePath };
/**
 * Check if username/reponame pair is valid.
 *
 * @param {string} repoInfo
 * @return {boolean}
 */
export function isRepoInfoValid(repoInfo) {
  if (repoInfo != undefined && typeof repoInfo == 'string' && repoInfo != '') {
    if (repoInfo.split('/').length == 2) return true;
  }
  return false;
}

export function getGithubUrl(userRepoInfo) {
  if (!this.isRepoInfoValid(userRepoInfo)) {
    throw new Error('Invalid user/repository info.');
  }
  return `https://github.com/${userRepoInfo}`;
}

export async function validateGithubRepo(userRepoInfo) {
  if (!isRepoInfoValid(userRepoInfo)) {
    throw new Error('Invalid user/repository info. Use `myUser/myRepository` format.');
  }

  const ghUrl = `https://github.com/${userRepoInfo}.git`;

  let res;
  try {
    res = await axios.get(ghUrl);
  } catch (error) {
    throw new Error(
      'Remote repository could not be reached. Make sure you are online and that the repository is publicly available.'
    );
  }
  if (res.status == 200) {
    return true;
  }
  return false;
}

export async function fetch(url, path, onProgressCb) {
  fs.ensureFileSync(path);
  const writer = fs.createWriteStream(path);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    onDownloadProgress: (progressEvent) => {
      const dataChunk = progressEvent;
      onProgressCb(dataChunk);
    }
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

export function guid() {
  return uuid().toUpperCase();
}

export function formatDate(dateTime) {
  return dateTime.toUTC().toFormat("yyyy-LL-dd'T'hh:mm:ss'Z'");
}

export function getNowDateTime() {
  return DateTime.utc().toFormat("yyyy-LL-dd'T'hh:mm:ss'Z'");
}

export function getISODate(timestamp) {
  return DateTime.fromMillis(timestamp).toISO();
}
