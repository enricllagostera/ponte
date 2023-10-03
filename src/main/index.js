import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'path'
import * as fs from 'fs-extra'
import { DateTime } from 'luxon'

import icon from '../../resources/icon.png?asset'
import * as files from './fileSystemHandling'
import QdpxExporter from './qdpxExport'
import utils from './helpers'
import DataInitializer from './dataInitializer'
import { formatCodeAsHTML } from './docxBuilder'

let initializer
let allCommits

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
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
    const inputGitDataPath = files.getAppGitDataPath()
    initializer = new DataInitializer(repoInfo, inputGitDataPath)
    mainWindow.webContents.send('commitDownloadInProgress', {
      message: 'Cloning repository...'
    })
    allCommits = await initializer.loadCommitsFromGit()

    let downloadPromises = []
    for (const commit of allCommits) {
      downloadPromises.push(
        initializer
          .startDownloadZip(commit.hash, (info) => {
            // console.log(info)
            mainWindow.webContents.send('commitDownloadInProgress', {
              hash: commit.hash,
              progress: info,
              message: '',
              commitCount: allCommits.length
            })
          })
          .then(() => {
            mainWindow.webContents.send('commitDownloadInProgress', {
              hash: commit.hash,
              progress: { total: -1 },
              message: '',
              commitCount: allCommits.length
            })
          })
      )
    }

    await Promise.allSettled(downloadPromises)
    console.log('finished downloading all')
    const allExtractions = initializer.extractAllZips(allCommits.map((c) => c.hash))
    mainWindow.webContents.send('commitDownloadInProgress', {
      message: 'Extracting ZIPs. This might take a while...'
    })
    await Promise.allSettled(allExtractions)
    mainWindow.webContents.send('commitDownloadInProgress', {
      message: 'Getting file structure for each commit...'
    })
    console.log('finished extracting all')

    let fileStructurePromises = []
    for (const commit of allCommits) {
      fileStructurePromises.push(
        files
          .getFileTree(
            initializer.getExtractedZipPathForCommit(commit.hash),
            initializer.getExtractedZipPathForCommit(commit.hash),
            commit.hash
          )
          .then(async (info) => {
            commit.fileTree = info
            // commit.fileTree = await files.getFileTree(
            // initializer.getExtractedZipPathForCommit(commit.hash)
          })
      )
    }

    await Promise.allSettled(fileStructurePromises)
    mainWindow.webContents.send('commitDownloadInProgress', {
      message: ''
    })

    return JSON.stringify(allCommits)
  })

  ipcMain.handle('getDevlogForCommit', getDevlogForCommit)
  ipcMain.handle('getDevlogCompilation', getDevlogCompilation)
  ipcMain.handle('saveDialog', saveDialog, mainWindow)
  ipcMain.handle('loadDialog', loadDialog, mainWindow)
  ipcMain.handle('exportQDPX', exportQDPX, mainWindow)
  ipcMain.handle('runGlobOnCommit', runGlobOnCommit)
  ipcMain.handle('readFileAtCommit', readFileAtCommit)
  ipcMain.handle('convertCodeToHTML', (e, c) => formatCodeAsHTML(c))
  ipcMain.handle('showInExplorer', showInExplorer)

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

async function showInExplorer(_event, filePath) {
  return shell.showItemInFolder(filePath)
}

async function readFileAtCommit(_event, filePath, commitHash) {
  return await initializer.readFileAtCommit(filePath, commitHash)
}

async function runGlobOnCommit(_event, pattern, commitHash) {
  return await initializer.runGlobOnCommit(pattern, commitHash)
}

async function exportQDPX(_event, exportData, exportOptions) {
  let res
  try {
    res = await dialog.showSaveDialog(null, {
      ...exportOptions,
      filters: [{ name: 'QDPX file', extensions: ['qdpx'] }]
    })
    if (res.canceled) {
      return
    }
  } catch (error) {
    return
  }
  const exporter = new QdpxExporter(join(app.getPath('temp'), 'repo-to-qda', 'qde'))
  await exporter.exportToFile(exportData, res.filePath)
}

async function loadDialog(_event, loadOptions) {
  let res
  try {
    res = await dialog.showOpenDialog(null, {
      ...loadOptions,
      filters: [{ name: 'Repo to QDA JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (res.canceled) {
      return
    }
    if (fs.existsSync(res.filePaths[0])) {
      res = fs.readJSONSync(res.filePaths[0])
    }
    return res
  } catch (error) {
    res = undefined
  }
  return res
}

async function saveDialog(_event, saveOptions) {
  let res
  try {
    res = await dialog.showSaveDialog(null, {
      ...saveOptions,
      filters: [{ name: 'Repo to QDA JSON', extensions: ['json'] }]
    })
  } catch (error) {
    res = undefined
  }
  console.log(res)
  if (!res || res.canceled) {
    return
  } else {
    fs.ensureFileSync(res.filePath)
    fs.writeJSONSync(res.filePath, saveOptions.data)
  }
}

async function getDevlogForCommit(_event, commitHash) {
  const commitData = allCommits.filter((c) => c.hash == commitHash)[0]
  // basic devlog from commit message
  const commitISODate = DateTime.fromMillis(commitData.author.timestamp).toISODate()
  const devlog = {
    hashAbbrev: commitData.hashAbbrev,
    name: `Devlog for #${commitData.hashAbbrev} on ${commitISODate}`,
    originalExt: 'md',
    content: `[Devlog] #${commitData.hashAbbrev} : ${
      commitData.subject
    }\n\nCommit date: ${DateTime.fromMillis(commitData.author.timestamp).toISO()}\n\nMessage:\n\n${
      commitData.body || 'Empty commit message.'
    }`
  }
  return devlog
}

async function getDevlogCompilation(_event, devlogCompilationConfig) {
  let comp = '# Devlog compilation\n\n'
  let selectedCommits = allCommits.filter(
    (c) => devlogCompilationConfig.selectedCommits.indexOf(c.hash) >= 0
  )

  for (let i = 0; i < selectedCommits.length; i++) {
    const sc = selectedCommits[i]
    const devlogContent = await getDevlogForCommit(null, sc.hash)
    comp += `## ${devlogContent.content}\n\n---\n\n`
  }

  const devlog = {
    parent: 'repository',
    hashAbbrev: '',
    name: `Devlog compilation`,
    originalExt: 'md',
    content: comp
  }

  return devlog
}

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
