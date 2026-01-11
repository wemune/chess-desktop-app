import { BrowserWindow, WebContents } from 'electron'
import { store } from './store'
import { ZOOM_PERCENTAGES, percentageToZoomLevel, getClosestZoomIndex } from '../shared/constants'

export function registerMainWindowShortcuts(window: BrowserWindow): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  window.webContents.on('before-input-event', (inputEvent, input) => {
    if (input.type !== 'keyDown') return

    const isMac = process.platform === 'darwin'
    const modifier = isMac ? input.meta : input.control

    if (modifier && input.shift && input.key.toLowerCase() === 'i') {
      inputEvent.preventDefault()
      if (window.webContents.isDevToolsOpened()) {
        window.webContents.closeDevTools()
      } else {
        window.webContents.openDevTools()
      }
    }
  })
}

export function registerWebviewShortcuts(contents: WebContents): void {
  contents.on('before-input-event', (inputEvent, input) => {
    if (input.type !== 'keyDown') return

    const isMac = process.platform === 'darwin'
    const modifier = isMac ? input.meta : input.control

    if (process.env.NODE_ENV === 'development' && input.key === 'F12') {
      inputEvent.preventDefault()
      if (contents.isDevToolsOpened()) {
        contents.closeDevTools()
      } else {
        contents.openDevTools()
      }
    }

    if ((modifier && input.key.toLowerCase() === 'r') || input.key === 'F5') {
      inputEvent.preventDefault()
      contents.reload()
    }

    if (input.alt && input.key === 'ArrowLeft') {
      inputEvent.preventDefault()
      if (contents.navigationHistory.canGoBack()) {
        contents.navigationHistory.goBack()
      }
    }

    if (input.alt && input.key === 'ArrowRight') {
      inputEvent.preventDefault()
      if (contents.navigationHistory.canGoForward()) {
        contents.navigationHistory.goForward()
      }
    }

    if (modifier && (input.key === '=' || input.key === '+')) {
      inputEvent.preventDefault()
      const currentZoom = contents.getZoomLevel()
      const currentIndex = getClosestZoomIndex(currentZoom)
      const nextIndex = Math.min(currentIndex + 1, ZOOM_PERCENTAGES.length - 1)
      const newZoom = percentageToZoomLevel(ZOOM_PERCENTAGES[nextIndex])
      contents.setZoomLevel(newZoom)
      store.set('zoomLevel', newZoom)
    }

    if (modifier && (input.key === '-' || input.key === '_')) {
      inputEvent.preventDefault()
      const currentZoom = contents.getZoomLevel()
      const currentIndex = getClosestZoomIndex(currentZoom)
      const previousIndex = Math.max(currentIndex - 1, 0)
      const newZoom = percentageToZoomLevel(ZOOM_PERCENTAGES[previousIndex])
      contents.setZoomLevel(newZoom)
      store.set('zoomLevel', newZoom)
    }

    if (modifier && input.key === '0') {
      inputEvent.preventDefault()
      contents.setZoomLevel(0)
      store.set('zoomLevel', 0)
    }
  })
}
