import axios from 'axios'
import * as fs from 'fs-extra'
import { v4 as uuid } from 'uuid'
import { DateTime } from 'luxon'

class RepoError extends Error {}
class BuildError extends Error {}

export default {
  RepoError,
  BuildError,
  isRepoInfoValid,
  getGithubUrl: (userRepoInfo) => {
    if (!isRepoInfoValid(userRepoInfo)) {
      throw new Error('Invalid user/repository info.')
    }
    return `https://github.com/${userRepoInfo}`
  },
  validateGithubRepo: async (userRepoInfo) => {
    if (!isRepoInfoValid(userRepoInfo)) {
      throw new Error('Invalid user/repository info. Use `myUser/myRepository` format.')
    }

    const ghUrl = `https://github.com/${userRepoInfo}.git`

    let res
    try {
      res = await axios.get(ghUrl)
    } catch (error) {
      throw new Error(
        'Remote repository could not be reached. Make sure you are online and that the repository is publicly available.'
      )
    }
    if (res.status == 200) {
      return true
    }
    return false
  },
  fetch: async (url, path) => {
    fs.ensureFileSync(path)
    const writer = fs.createWriteStream(path)
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  },
  guid: () => {
    return uuid().toUpperCase()
  },
  formatDate: (dateTime) => {
    return dateTime.toUTC().toFormat("yyyy-LL-dd'T'hh:mm:ss'Z'")
  },
  getNowDateTime: () => {
    return DateTime.utc().toFormat("yyyy-LL-dd'T'hh:mm:ss'Z'")
  }
}

function isRepoInfoValid(repoInfo) {
  if (repoInfo != undefined && typeof repoInfo == 'string' && repoInfo != '') {
    if (repoInfo.split('/').length == 2) return true
  }
  return false
}
