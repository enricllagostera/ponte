import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import * as fs from 'fs-extra'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DateTime } from 'luxon'

import QdpxExporter from './qdpxExport'
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
  ipcMain.handle('saveDialog', saveDialog, mainWindow)
  ipcMain.handle('loadDialog', loadDialog, mainWindow)
  ipcMain.handle('exportQDPX', exportQDPX, mainWindow)

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
  let exporter = new QdpxExporter()
  const qdeFolder = join(app.getPath('temp'), 'repo-to-qda', 'qde')
  const qdeSourcesFolder = join(app.getPath('temp'), 'repo-to-qda', 'qde', 'Sources')
  let allTs = []
  for (const source of exportData.sources) {
    const new_ts = await exporter.createTextSourceFromTextData(
      qdeSourcesFolder,
      source.name,
      source.content
    )
    new_ts.PlainTextSelection = []
    allTs.push(new_ts)
  }
  for (const code of exportData.codes) {
    let new_c = exporter.createCode(code.name)
    let matchCount = 0
    for (const commit of code.commits) {
      allTs.forEach((ts, i) => {
        const s = exportData.sources[i].content.indexOf(commit.hashAbbrev)
        if (s >= 0) {
          matchCount++
          const pts = exporter.createPlainTextSelection(
            `Match ${matchCount} of #${commit.hashAbbrev}`,
            s,
            s + commit.hashAbbrev.length
          )
          pts.Coding = exporter.createCoding(new_c['@guid'])
          ts.PlainTextSelection.push(pts)
        }
      })
    }
    exporter.appendCode(new_c)
  }

  for (const ts of allTs) {
    if (ts.PlainTextSelection.length == 0) {
      delete ts.PlainTextSelection
    }
    exporter.appendTextSource(ts)
  }

  await exporter.writeFile(qdeFolder, res.filePath)
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
  if (res.filePath == undefined) {
    return
  }
  fs.ensureFileSync(res.filePath)
  fs.writeJSONSync(res.filePath, saveOptions.data)
}

async function getDevlogForCommit(_event, commitHash) {
  const commitData = allCommits.filter((c) => c.hashAbbrev == commitHash)[0]
  // basic devlog from commit message
  const commitISODate = DateTime.fromMillis(commitData.author.timestamp).toISODate()
  const devlog = {
    hashAbbrev: commitData.hashAbbrev,
    name: `Devlog for #${commitData.hashAbbrev} on ${commitISODate}`,
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
    (c) => devlogCompilationConfig.selectedCommits.indexOf(c.hashAbbrev) >= 0
  )

  for (let i = 0; i < selectedCommits.length; i++) {
    const sc = selectedCommits[i]
    const devlogContent = await getDevlogForCommit(null, sc.hashAbbrev)
    comp += `## ${devlogContent.content}\n\n---\n\n`
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
