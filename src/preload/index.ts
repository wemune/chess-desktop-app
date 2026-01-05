import { contextBridge, ipcRenderer } from 'electron'

export interface StoreSchema {
  window: { width: number; height: number; x?: number; y?: number; isMaximized: boolean }
}

const electronAPI = {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized') as Promise<boolean>,
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
      ipcRenderer.on('window:maximize-change', listener)
      return () => ipcRenderer.removeListener('window:maximize-change', listener)
    }
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get') as Promise<StoreSchema>,
    set: (settings: Partial<StoreSchema>) => ipcRenderer.send('settings:set', settings)
  },
  platform: {
    get: () => ipcRenderer.invoke('platform:get') as Promise<NodeJS.Platform>
  },
  webview: {
    goBack: () => ipcRenderer.send('webview:go-back'),
    goForward: () => ipcRenderer.send('webview:go-forward'),
    canGoBack: () => ipcRenderer.invoke('webview:can-go-back') as Promise<boolean>,
    canGoForward: () => ipcRenderer.invoke('webview:can-go-forward') as Promise<boolean>,
    reload: () => ipcRenderer.send('webview:reload'),
    zoomIn: () => ipcRenderer.send('webview:zoom-in'),
    zoomOut: () => ipcRenderer.send('webview:zoom-out'),
    zoomReset: () => ipcRenderer.send('webview:zoom-reset'),
    getZoom: () => ipcRenderer.invoke('webview:get-zoom') as Promise<number>,
    onLoadStart: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('webview:load-start', listener)
      return () => ipcRenderer.removeListener('webview:load-start', listener)
    },
    onLoadStop: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('webview:load-stop', listener)
      return () => ipcRenderer.removeListener('webview:load-stop', listener)
    },
    onLoadError: (callback: (error: { errorCode: number; errorDescription: string; validatedURL: string }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, error: { errorCode: number; errorDescription: string; validatedURL: string }) => callback(error)
      ipcRenderer.on('webview:load-error', listener)
      return () => ipcRenderer.removeListener('webview:load-error', listener)
    },
    onTriggerBack: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('webview:trigger-back', listener)
      return () => ipcRenderer.removeListener('webview:trigger-back', listener)
    },
    onTriggerForward: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('webview:trigger-forward', listener)
      return () => ipcRenderer.removeListener('webview:trigger-forward', listener)
    }
  },
  update: {
    onAvailable: (callback: (info: { version: string; releaseNotes: string; releaseDate: string }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, info: { version: string; releaseNotes: string; releaseDate: string }) => callback(info)
      ipcRenderer.on('update:available', listener)
      return () => ipcRenderer.removeListener('update:available', listener)
    },
    onDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, progress: { percent: number; transferred: number; total: number }) => callback(progress)
      ipcRenderer.on('update:download-progress', listener)
      return () => ipcRenderer.removeListener('update:download-progress', listener)
    },
    onDownloaded: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('update:downloaded', listener)
      return () => ipcRenderer.removeListener('update:downloaded', listener)
    },
    download: () => ipcRenderer.send('update:download'),
    install: () => ipcRenderer.send('update:install')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}
