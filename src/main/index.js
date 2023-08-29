import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DateTime } from 'luxon'

import utils from './helpers'
import DataInitializer from './dataInitializer'

let initializer
let allCommits

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  ipcMain.handle('checkRepoInfo', async (_event, repoInfo) => {
    const url = utils.getGithubUrl(repoInfo)
    let res = false
    try {
      res = await utils.validateGithubRepo(repoInfo)
    } catch (error) {
      throw new Error(error.message)
    }
    if (res) {
      return url
    }
    return ''
  })

  ipcMain.handle('loadRepoData', async (_event, repoInfo) => {
    const inputGitDataPath = join(app.getPath('temp'), 'repo-to-qda/inputGitData')
    const processedGitDataPath = join(app.getPath('temp'), 'repo-to-qda/processedGitData')
    initializer = new DataInitializer(repoInfo, inputGitDataPath, processedGitDataPath)
    allCommits = await initializer.loadCommitsFromGit()
    return JSON.stringify(allCommits)
  })

  ipcMain.handle('getDevlogForCommit', getDevlogForCommit)
  ipcMain.handle('getDevlogCompilation', getDevlogCompilation)

  ipcMain.handle('ping', () => 'pong')

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

async function getDevlogForCommit(_event, commitHash, devlogConfig) {
  const commitData = allCommits.filter((c) => c.hashAbbrev == commitHash)[0]
  // basic devlog from commit message
  const commitISODate = DateTime.fromMillis(commitData.author.timestamp).toISODate()
  const devlog = {
    hashAbbrev: commitData.hashAbbrev,
    name: `Devlog for #${commitData.hashAbbrev} on ${commitISODate}`,
    content: `${commitData.subject}\n\nCommit date: ${commitISODate}\n\nMessage:\n\n${
      commitData.body || 'Empty commit message.'
    }`
  }
  return devlog
}

async function getDevlogCompilation(_event, devlogCompilationConfig) {
  let comp = '# Devlog compilation\n\n'
  let selectedCommits = allCommits.filter(
    (c) => devlogCompilationConfig.selectedCommits.indexOf(c.hashAbbrev) >= 0
  )

  for (let i = 0; i < selectedCommits.length; i++) {
    const sc = selectedCommits[i]
    const devlogContent = await getDevlogForCommit(null, sc.hashAbbrev)
    comp += `## ${devlogContent.name}\n\n${devlogContent.content}\n\n---\n\n`
  }

  const devlog = {
    parent: 'repository',
    hashAbbrev: '',
    name: `Devlog compilation`,
    content: comp
  }

  return devlog
}
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
