import { app, shell, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent, OpenDialogReturnValue } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'path'
import * as fs from 'fs-extra'
import { DateTime } from 'luxon'

import icon from '../../resources/icon.png?asset'
import * as files from './fileSystemHandling'
import QdpxExporter from './qdpxExport'
import utils from './helpers'
import DataInitializer from './dataInitializer'
import { clearCache } from './dataInitializer'
import { formatCodeAsHTML } from './docxBuilder'

import type { Commit, Devlog, HASH } from '../types'
import { parseTrailers } from './gitManager'
import { exportJsonCanvas } from './jsonCanvas'

import { v4 as uuid } from 'uuid'

let initializer: DataInitializer
let allCommits: Commit[]
let devlogCompilation: Devlog | undefined = undefined

function createWindow(): void {
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

  ipcMain.handle('checkRepoInfo', async (_event: IpcMainInvokeEvent, repoInfo) => {
    const url = utils.getGithubUrl(repoInfo)
    let res = false
    try {
      res = await utils.validateGithubRepo(repoInfo)
    } catch (error) {
      throw new Error((error as Error).message)
    }
    if (res) {
      return url
    }
    return ''
  })

  ipcMain.handle('loadRepoData', async (_event: IpcMainInvokeEvent, repoInfo) => {
    const inputGitDataPath = files.getAppGitDataPath()
    devlogCompilation = undefined
    initializer = new DataInitializer(repoInfo, inputGitDataPath)
    mainWindow.webContents.send('commitDownloadInProgress', {
      message: 'Cloning repository...'
    })
    allCommits = await initializer.loadCommitsFromGit((msg) => {
      mainWindow.webContents.send(
        'commitDownloadInProgress',
        {
          message: msg
        },
        false
      )
    })
    mainWindow.webContents.send('commitDownloadInProgress', {
      message: ''
    })
    return allCommits
  })

  ipcMain.handle('getDevlogForCommit', getDevlogForCommit)
  ipcMain.handle('getDevlogCompilation', getDevlogCompilation)
  ipcMain.handle('saveDialog', saveDialog)
  ipcMain.handle('loadDialog', loadDialog)
  ipcMain.handle('exportQDPX', exportQDPX)
  ipcMain.handle('runGlobOnCommit', runGlobOnCommit)
  ipcMain.handle('readFileAtCommit', readFileAtCommit)
  ipcMain.handle('convertCodeToHTML', formatCodeAsHTML)
  ipcMain.handle('showInExplorer', showInExplorer)
  ipcMain.handle('forceClearCache', clearCache)
  ipcMain.handle('exportJsonCanvas', exportJsonCanvas)

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

async function showInExplorer(_event: IpcMainInvokeEvent, filePath): Promise<void> {
  return shell.showItemInFolder(filePath)
}

async function readFileAtCommit(_event: IpcMainInvokeEvent, filePath, commitHash): Promise<string> {
  return await initializer.readFileAtCommit(filePath, commitHash)
}

async function runGlobOnCommit(_event: IpcMainInvokeEvent, pattern, commitHash): Promise<string[]> {
  return await initializer.runGlobOnCommit(pattern, commitHash)
}

async function exportQDPX(_event: IpcMainInvokeEvent, exportData, exportOptions): Promise<void> {
  let res
  try {
    res = await dialog.showSaveDialog({
      ...exportOptions,
      filters: [{ name: 'QDPX file', extensions: ['qdpx'] }]
    })
    if (res.canceled) {
      return
    }
  } catch (error) {
    return
  }
  const exporter = new QdpxExporter(join(app.getPath('temp'), 'repo-to-qda', 'qde'), exportData.userRepoInfo)
  await exporter.exportToFile(exportData, res.filePath)
}

async function loadDialog(_event: IpcMainInvokeEvent, loadOptions: Electron.OpenDialogOptions): Promise<string> {
  let dialogRes: OpenDialogReturnValue
  try {
    dialogRes = await dialog.showOpenDialog({
      ...loadOptions,
      filters: [{ name: 'Repo to QDA JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (dialogRes.canceled) {
      return ''
    }
    if (fs.existsSync(dialogRes.filePaths[0])) {
      return fs.readFileSync(dialogRes.filePaths[0], 'utf-8')
    }
    return ''
  } catch (error) {
    return ''
  }
}

async function saveDialog(_event: IpcMainInvokeEvent, saveOptions): Promise<void> {
  let res
  try {
    res = await dialog.showSaveDialog({
      ...saveOptions,
      filters: [{ name: 'Repo to QDA JSON', extensions: ['json'] }]
    })
  } catch (error) {
    res = undefined
  }
  // console.log(res)
  if (!res || res.canceled) {
    return
  } else {
    fs.ensureFileSync(res.filePath)
    fs.writeJSONSync(res.filePath, saveOptions.data)
  }
}

async function getDevlogForCommit(_event: IpcMainInvokeEvent, commitHash: string): Promise<Devlog> {
  const commitData = allCommits.filter((c) => c.hash == commitHash)[0]
  // basic devlog from commit message
  const commitISODate = DateTime.fromMillis(commitData.author.timestamp).toISODate()

  const devlogTrailers = parseTrailers(commitData.trailers).filter(({ key }) => key.toLowerCase() == 'devlog')
  const devlogs: Array<any> = []
  let devlogsContent = ''
  for (const trailer of devlogTrailers) {
    // loads file from latest commit

    let raw = ''
    try {
      raw = await initializer.readFileAtCommit(trailer.value, allCommits[0].hash)
    } catch (error) {
      raw = await initializer.readFileAtCommit(trailer.value, commitHash)
    }
    const newDevlog = initializer.parseFrontmatter(raw)
    if (!newDevlog) {
      devlogsContent += `\n\n${raw}`
      continue
    }
    devlogs.push(newDevlog)
    devlogsContent += `\n\n${newDevlog.content}`
  }

  const devlog: Devlog = {
    guid: uuid(),
    hashAbbrev: commitData.hashAbbrev,
    name: `Devlog for #${commitData.hashAbbrev} on ${commitISODate}`,
    originalExt: 'md',
    content: `
      #${commitData.hashAbbrev} ${commitData.subject}\n\n**Commit date**\n\n${DateTime.fromMillis(
        commitData.author.timestamp
      ).toISO()}\n\n**Commit message**\n\n${commitData.body}\n\n${devlogsContent}`.trim()
  }
  return devlog
}

async function getDevlogCompilation(_event: IpcMainInvokeEvent, devlogCompilationConfig): Promise<Devlog> {
  if (devlogCompilation != undefined) {
    return devlogCompilation
  }
  let comp = '# Devlog compilation\n\n'
  const selectedCommits = [...allCommits]
  for (let i = 0; i < selectedCommits.length; i++) {
    const sc = selectedCommits[i]
    const devlogContent = await getDevlogForCommit(_event, sc.hash)
    comp += `## ${devlogContent.content}\n\n---\n\n`
  }

  const devlog = {
    guid: uuid(),
    parent: 'repository',
    hashAbbrev: '',
    name: `Devlog compilation`,
    originalExt: 'md',
    content: comp,
    hash: ''
  }
  devlogCompilation = devlog

  return devlog
}
