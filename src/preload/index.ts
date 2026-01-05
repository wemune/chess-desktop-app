import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'

export interface StoreSchema {
  window: { width: number; height: number; x?: number; y?: number; isMaximized: boolean }
  zoomLevel: number
  notificationsEnabled: boolean
  chatEnabled: boolean
}

const electronAPI = {
  window: {
    minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW.MINIMIZE),
    maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW.MAXIMIZE),
    close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW.CLOSE),
    isMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW.IS_MAXIMIZED) as Promise<boolean>,
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
      ipcRenderer.on(IPC_CHANNELS.WINDOW.MAXIMIZE_CHANGE, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WINDOW.MAXIMIZE_CHANGE, listener)
    }
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.GET) as Promise<StoreSchema>,
    set: (settings: Partial<StoreSchema>) => ipcRenderer.send(IPC_CHANNELS.SETTINGS.SET, settings)
  },
  logs: {
    openFolder: () => ipcRenderer.send(IPC_CHANNELS.LOGS.OPEN_FOLDER)
  },
  platform: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.PLATFORM.GET) as Promise<NodeJS.Platform>
  },
  webview: {
    goBack: () => ipcRenderer.send(IPC_CHANNELS.WEBVIEW.GO_BACK),
    goForward: () => ipcRenderer.send(IPC_CHANNELS.WEBVIEW.GO_FORWARD),
    canGoBack: () => ipcRenderer.invoke(IPC_CHANNELS.WEBVIEW.CAN_GO_BACK) as Promise<boolean>,
    canGoForward: () => ipcRenderer.invoke(IPC_CHANNELS.WEBVIEW.CAN_GO_FORWARD) as Promise<boolean>,
    reload: () => ipcRenderer.send(IPC_CHANNELS.WEBVIEW.RELOAD),
    zoomIn: () => ipcRenderer.send(IPC_CHANNELS.WEBVIEW.ZOOM_IN),
    zoomOut: () => ipcRenderer.send(IPC_CHANNELS.WEBVIEW.ZOOM_OUT),
    zoomReset: () => ipcRenderer.send(IPC_CHANNELS.WEBVIEW.ZOOM_RESET),
    getZoom: () => ipcRenderer.invoke(IPC_CHANNELS.WEBVIEW.GET_ZOOM) as Promise<number>,
    onLoadStart: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on(IPC_CHANNELS.WEBVIEW.LOAD_START, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WEBVIEW.LOAD_START, listener)
    },
    onLoadStop: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on(IPC_CHANNELS.WEBVIEW.LOAD_STOP, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WEBVIEW.LOAD_STOP, listener)
    },
    onLoadError: (callback: (error: { errorCode: number; errorDescription: string; validatedURL: string }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, error: { errorCode: number; errorDescription: string; validatedURL: string }) => callback(error)
      ipcRenderer.on(IPC_CHANNELS.WEBVIEW.LOAD_ERROR, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WEBVIEW.LOAD_ERROR, listener)
    },
    onTriggerBack: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on(IPC_CHANNELS.WEBVIEW.TRIGGER_BACK, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WEBVIEW.TRIGGER_BACK, listener)
    },
    onTriggerForward: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on(IPC_CHANNELS.WEBVIEW.TRIGGER_FORWARD, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WEBVIEW.TRIGGER_FORWARD, listener)
    }
  },
  update: {
    onAvailable: (callback: (info: { version: string; releaseNotes: string; releaseDate: string }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, info: { version: string; releaseNotes: string; releaseDate: string }) => callback(info)
      ipcRenderer.on(IPC_CHANNELS.UPDATE.AVAILABLE, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE.AVAILABLE, listener)
    },
    onDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, progress: { percent: number; transferred: number; total: number }) => callback(progress)
      ipcRenderer.on(IPC_CHANNELS.UPDATE.DOWNLOAD_PROGRESS, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE.DOWNLOAD_PROGRESS, listener)
    },
    onDownloaded: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on(IPC_CHANNELS.UPDATE.DOWNLOADED, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE.DOWNLOADED, listener)
    },
    download: () => ipcRenderer.send(IPC_CHANNELS.UPDATE.DOWNLOAD),
    install: () => ipcRenderer.send(IPC_CHANNELS.UPDATE.INSTALL)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}
