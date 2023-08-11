const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("repo_to_qdaAPI", {
  onGitData: (callback) => ipcRenderer.on("gitlog", callback),
});
