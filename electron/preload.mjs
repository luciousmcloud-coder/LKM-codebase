import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("lkmDesktop", {
  getModels: () => ipcRenderer.invoke("lkm:get-models"),
  scanModels: () => ipcRenderer.invoke("lkm:scan-models"),
  getRuntime: () => ipcRenderer.invoke("lkm:get-runtime"),
  runtimeAction: (action, modelId) => ipcRenderer.invoke("lkm:runtime-action", action, modelId),
  sendChat: (payload) => ipcRenderer.invoke("lkm:send-chat", payload),
  getPreferences: () => ipcRenderer.invoke("lkm:get-preferences"),
  setPreferences: (patch) => ipcRenderer.invoke("lkm:set-preferences", patch),
  getAttachments: () => ipcRenderer.invoke("lkm:get-attachments"),
  attachFiles: () => ipcRenderer.invoke("lkm:attach-files"),
  importFolder: () => ipcRenderer.invoke("lkm:import-folder"),
  getExports: () => ipcRenderer.invoke("lkm:get-exports"),
  exportLatest: () => ipcRenderer.invoke("lkm:export-latest"),
});
