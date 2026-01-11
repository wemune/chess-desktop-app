import { BrowserWindow, WebContents } from 'electron'
import { store } from './store'
import { getChessWebContents } from './ipc/webview'
import { ZOOM_PERCENTAGES, percentageToZoomLevel, getClosestZoomIndex } from '../shared/constants'

function navigateBack(contents: WebContents | null): void {
  if (!contents) return
  if (contents.navigationHistory.canGoBack()) {
    contents.navigationHistory.goBack()
  }
}

function navigateForward(contents: WebContents | null): void {
  if (!contents) return
  if (contents.navigationHistory.canGoForward()) {
    contents.navigationHistory.goForward()
  }
}

type WebContentsEventName = Parameters<WebContents['on']>[0]

const appCommandEvent = 'app-command' as WebContentsEventName

function handleMouseNavigation(inputEvent: Electron.Event, input: Electron.Input, contents: WebContents | null): boolean {
  if (input.type !== 'mouseDown' && input.type !== 'mouseUp') {
    return false
  }

  const pointerInput = input as unknown as { button?: number | string; buttons?: number }
  const button = pointerInput.button
  const buttons = typeof pointerInput.buttons === 'number' ? pointerInput.buttons : 0
  const isBackButton = button === 'back' || button === 3 || (buttons & 8) === 8
  const isForwardButton = button === 'forward' || button === 4 || (buttons & 16) === 16

  if (isBackButton) {
    inputEvent.preventDefault()
    navigateBack(contents)
    return true
  }

  if (isForwardButton) {
    inputEvent.preventDefault()
    navigateForward(contents)
    return true
  }

  return false
}

export function registerMainWindowShortcuts(window: BrowserWindow): void {
  const handleAppCommand = (event: Electron.Event, command: string): void => {
    const chessContents = getChessWebContents()
    if (command === 'browser-backward') {
      event.preventDefault()
      navigateBack(chessContents)
      return
    }

    if (command === 'browser-forward') {
      event.preventDefault()
      navigateForward(chessContents)
    }
  }

  window.on('app-command', handleAppCommand)
  window.webContents.on(appCommandEvent, handleAppCommand)

  if (process.env.NODE_ENV !== 'development') {
    return
  }

  window.webContents.on('before-input-event', (inputEvent, input) => {
    if (handleMouseNavigation(inputEvent, input, getChessWebContents())) {
      return
    }

    if (process.env.NODE_ENV !== 'development') {
      return
    }

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
  contents.on(appCommandEvent, (appEvent: Electron.Event, command: string) => {
    if (command === 'browser-backward') {
      appEvent.preventDefault()
      navigateBack(contents)
      return
    }

    if (command === 'browser-forward') {
      appEvent.preventDefault()
      navigateForward(contents)
    }
  })

  contents.on('before-input-event', (inputEvent, input) => {
    if (handleMouseNavigation(inputEvent, input, contents)) {
      return
    }

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
