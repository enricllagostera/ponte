import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('loader', {
      checkRepoInfo: (repoInfo) => ipcRenderer.invoke('checkRepoInfo', repoInfo),
      loadRepoData: (repoInfo) => ipcRenderer.invoke('loadRepoData', repoInfo),
      getDevlogForCommit: (hashAbbrev, devlogConfig) =>
        ipcRenderer.invoke('getDevlogForCommit', hashAbbrev, devlogConfig),
      getDevlogCompilation: (devlogCompilationConfig) =>
        ipcRenderer.invoke('getDevlogCompilation', devlogCompilationConfig),
      saveDialog: (saveOptions) => ipcRenderer.invoke('saveDialog', saveOptions),
      loadDialog: (loadOptions) => ipcRenderer.invoke('loadDialog', loadOptions),
      exportQDPX: (exportOptions) => ipcRenderer.invoke('exportQDPX', exportOptions)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
