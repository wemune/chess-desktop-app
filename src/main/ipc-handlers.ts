import { ipcMain, BrowserWindow, WebContents, shell } from 'electron'
import { store, StoreSchema } from './store'
import { downloadUpdate, installUpdate } from './auto-updater'
import log from 'electron-log'
import { dirname } from 'path'
import { ZOOM_PERCENTAGES, percentageToZoomLevel, getClosestZoomIndex } from '../shared/constants'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import { CHESS_SELECTORS, buildHideCSS, buildShowCSS } from '../shared/chess-selectors'

let chessWebContents: WebContents | null = null

export function setChessWebContents(webContents: WebContents): void {
  chessWebContents = webContents
}

export function registerIpcHandlers(): void {
  ipcMain.on(IPC_CHANNELS.WINDOW.MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW.MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW.CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW.IS_MAXIMIZED, (event): boolean => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win?.isMaximized() ?? false
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS.GET, (): StoreSchema => {
    return store.store
  })

  ipcMain.on(IPC_CHANNELS.SETTINGS.SET, (_event, settings: Partial<StoreSchema>) => {
    if (settings.window) {
      const { width, height, x, y, isMaximized } = settings.window
      if (
        typeof width === 'number' && width > 0 &&
        typeof height === 'number' && height > 0 &&
        (x === undefined || typeof x === 'number') &&
        (y === undefined || typeof y === 'number') &&
        typeof isMaximized === 'boolean'
      ) {
        store.set('window', settings.window)
      } else {
        log.warn('Invalid window settings received:', settings.window)
      }
    }

    if (settings.notificationsEnabled !== undefined) {
      if (typeof settings.notificationsEnabled === 'boolean') {
        store.set('notificationsEnabled', settings.notificationsEnabled)
        log.info('Notifications setting updated:', settings.notificationsEnabled)
      } else {
        log.warn('Invalid notificationsEnabled setting received:', settings.notificationsEnabled)
      }
    }

    if (settings.chatEnabled !== undefined) {
      if (typeof settings.chatEnabled === 'boolean') {
        store.set('chatEnabled', settings.chatEnabled)
        log.info('Chat setting updated:', settings.chatEnabled)

        if (chessWebContents) {
          const cssCode = settings.chatEnabled
            ? buildShowCSS(CHESS_SELECTORS.CHAT)
            : buildHideCSS(CHESS_SELECTORS.CHAT)

          chessWebContents.insertCSS(cssCode).catch((err) => {
            log.error('Failed to toggle chat visibility:', err)
          })
        }
      } else {
        log.warn('Invalid chatEnabled setting received:', settings.chatEnabled)
      }
    }
  })

  ipcMain.on(IPC_CHANNELS.LOGS.OPEN_FOLDER, async () => {
    const logPath = log.transports.file.getFile().path
    const logDir = dirname(logPath)
    try {
      await shell.openPath(logDir)
      log.info('Opened logs folder:', logDir)
    } catch (err) {
      log.error('Failed to open logs folder:', err)
    }
  })

  ipcMain.handle(IPC_CHANNELS.PLATFORM.GET, (): NodeJS.Platform => {
    return process.platform
  })

  ipcMain.on(IPC_CHANNELS.WEBVIEW.GO_BACK, () => {
    if (!chessWebContents) {
      log.warn('webview:go-back called but chessWebContents is null')
      return
    }
    if (chessWebContents.navigationHistory.canGoBack()) {
      chessWebContents.navigationHistory.goBack()
    }
  })

  ipcMain.on(IPC_CHANNELS.WEBVIEW.GO_FORWARD, () => {
    if (!chessWebContents) {
      log.warn('webview:go-forward called but chessWebContents is null')
      return
    }
    if (chessWebContents.navigationHistory.canGoForward()) {
      chessWebContents.navigationHistory.goForward()
    }
  })

  ipcMain.handle(IPC_CHANNELS.WEBVIEW.CAN_GO_BACK, (): boolean => {
    return chessWebContents?.navigationHistory.canGoBack() ?? false
  })

  ipcMain.handle(IPC_CHANNELS.WEBVIEW.CAN_GO_FORWARD, (): boolean => {
    return chessWebContents?.navigationHistory.canGoForward() ?? false
  })

  ipcMain.on(IPC_CHANNELS.WEBVIEW.RELOAD, () => {
    if (!chessWebContents) {
      log.warn('webview:reload called but chessWebContents is null')
      return
    }
    chessWebContents.reload()
  })

  ipcMain.on(IPC_CHANNELS.WEBVIEW.ZOOM_IN, () => {
    if (!chessWebContents) {
      log.warn('webview:zoom-in called but chessWebContents is null')
      return
    }
    const currentZoom = chessWebContents.getZoomLevel()
    const currentIndex = getClosestZoomIndex(currentZoom)
    const nextIndex = Math.min(currentIndex + 1, ZOOM_PERCENTAGES.length - 1)
    const newZoom = percentageToZoomLevel(ZOOM_PERCENTAGES[nextIndex])
    chessWebContents.setZoomLevel(newZoom)
    store.set('zoomLevel', newZoom)
  })

  ipcMain.on(IPC_CHANNELS.WEBVIEW.ZOOM_OUT, () => {
    if (!chessWebContents) {
      log.warn('webview:zoom-out called but chessWebContents is null')
      return
    }
    const currentZoom = chessWebContents.getZoomLevel()
    const currentIndex = getClosestZoomIndex(currentZoom)
    const prevIndex = Math.max(currentIndex - 1, 0)
    const newZoom = percentageToZoomLevel(ZOOM_PERCENTAGES[prevIndex])
    chessWebContents.setZoomLevel(newZoom)
    store.set('zoomLevel', newZoom)
  })

  ipcMain.on(IPC_CHANNELS.WEBVIEW.ZOOM_RESET, () => {
    if (!chessWebContents) {
      log.warn('webview:zoom-reset called but chessWebContents is null')
      return
    }
    chessWebContents.setZoomLevel(0)
    store.set('zoomLevel', 0)
  })

  ipcMain.handle(IPC_CHANNELS.WEBVIEW.GET_ZOOM, (): number => {
    return chessWebContents?.getZoomLevel() ?? 0
  })

  ipcMain.on(IPC_CHANNELS.UPDATE.DOWNLOAD, () => {
    downloadUpdate()
  })

  ipcMain.on(IPC_CHANNELS.UPDATE.INSTALL, () => {
    installUpdate()
  })
}
