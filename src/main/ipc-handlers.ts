import { ipcMain, BrowserWindow, WebContents } from 'electron'
import { store, StoreSchema } from './store'
import { downloadUpdate, installUpdate } from './auto-updater'
import log from 'electron-log'
import { ZOOM_PERCENTAGES, percentageToZoomLevel, getClosestZoomIndex } from '../shared/constants'

let chessWebContents: WebContents | null = null

export function setChessWebContents(webContents: WebContents): void {
  chessWebContents = webContents
}

export function registerIpcHandlers(): void {
  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  ipcMain.handle('window:is-maximized', (event): boolean => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win?.isMaximized() ?? false
  })

  ipcMain.handle('settings:get', (): StoreSchema => {
    return store.store
  })

  ipcMain.on('settings:set', (_event, settings: Partial<StoreSchema>) => {
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
            ? '.resizable-chat-area-component { display: block !important; }'
            : '.resizable-chat-area-component { display: none !important; }'

          chessWebContents.insertCSS(cssCode).catch((err) => {
            log.error('Failed to toggle chat visibility:', err)
          })
        }
      } else {
        log.warn('Invalid chatEnabled setting received:', settings.chatEnabled)
      }
    }
  })

  ipcMain.handle('platform:get', (): NodeJS.Platform => {
    return process.platform
  })

  ipcMain.on('webview:go-back', () => {
    if (!chessWebContents) {
      log.warn('webview:go-back called but chessWebContents is null')
      return
    }
    if (chessWebContents.navigationHistory.canGoBack()) {
      chessWebContents.navigationHistory.goBack()
    }
  })

  ipcMain.on('webview:go-forward', () => {
    if (!chessWebContents) {
      log.warn('webview:go-forward called but chessWebContents is null')
      return
    }
    if (chessWebContents.navigationHistory.canGoForward()) {
      chessWebContents.navigationHistory.goForward()
    }
  })

  ipcMain.handle('webview:can-go-back', (): boolean => {
    return chessWebContents?.navigationHistory.canGoBack() ?? false
  })

  ipcMain.handle('webview:can-go-forward', (): boolean => {
    return chessWebContents?.navigationHistory.canGoForward() ?? false
  })

  ipcMain.on('webview:reload', () => {
    if (!chessWebContents) {
      log.warn('webview:reload called but chessWebContents is null')
      return
    }
    chessWebContents.reload()
  })

  ipcMain.on('webview:zoom-in', () => {
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

  ipcMain.on('webview:zoom-out', () => {
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

  ipcMain.on('webview:zoom-reset', () => {
    if (!chessWebContents) {
      log.warn('webview:zoom-reset called but chessWebContents is null')
      return
    }
    chessWebContents.setZoomLevel(0)
    store.set('zoomLevel', 0)
  })

  ipcMain.handle('webview:get-zoom', (): number => {
    return chessWebContents?.getZoomLevel() ?? 0
  })

  ipcMain.on('update:download', () => {
    downloadUpdate()
  })

  ipcMain.on('update:install', () => {
    installUpdate()
  })
}
