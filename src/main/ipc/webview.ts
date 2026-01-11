import { WebContents, ipcMain } from 'electron'
import log from 'electron-log'
import { store } from '../store'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { ZOOM_PERCENTAGES, percentageToZoomLevel, getClosestZoomIndex } from '../../shared/constants'

let chessWebContents: WebContents | null = null

export function setChessWebContents(webContents: WebContents): void {
  chessWebContents = webContents
}

export function getChessWebContents(): WebContents | null {
  return chessWebContents
}

export function registerWebviewHandlers(): void {
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

  ipcMain.handle(IPC_CHANNELS.WEBVIEW.GET_URL, (): string => {
    return chessWebContents?.getURL() ?? ''
  })
}
