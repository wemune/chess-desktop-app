import { BrowserWindow, WebContents, shell } from 'electron'
import log from 'electron-log'
import { store } from './store'
import { applyTheme } from './theme'
import { setChessWebContents } from './ipc/webview'
import { setDiscordWebContents } from './discord-rpc'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import { CHESS_SELECTORS, buildHideCSS } from '../shared/chess-selectors'
import { getUserAgent } from './window'
import { registerWebviewShortcuts } from './shortcuts'
import { isChessDotComURL, registerPermissionHandler } from './permissions'

const allowedExternalProtocols = new Set(['https:', 'http:', 'mailto:'])

const isAllowedExternalURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return allowedExternalProtocols.has(urlObj.protocol)
  } catch {
    return false
  }
}

const openExternalURL = (url: string): void => {
  if (!isAllowedExternalURL(url)) {
    log.warn('Blocked external URL with unsupported protocol:', url)
    return
  }

  shell.openExternal(url).catch((err) => {
    log.error('Failed to open external URL:', err)
  })
}

export function configureWebviewContents(contents: WebContents, mainWindow: BrowserWindow | null): void {
  if (contents.getType() !== 'webview') {
    return
  }

  setChessWebContents(contents)
  setDiscordWebContents(contents)
  contents.setUserAgent(getUserAgent())

  const savedZoom = store.get('zoomLevel')
  contents.setZoomLevel(savedZoom)

  const soundMuted = store.get('soundMuted')
  contents.setAudioMuted(soundMuted)

  registerWebviewShortcuts(contents)
  registerPermissionHandler(contents)

  contents.setWindowOpenHandler(({ url }) => {
    log.info('[WindowOpenHandler] Popup requested:', url)
    if (isChessDotComURL(url)) {
      log.info('[WindowOpenHandler] Loading chess.com URL in webview')
      contents.loadURL(url)
    } else {
      log.info('[WindowOpenHandler] Opening external URL')
      openExternalURL(url)
    }
    return { action: 'deny' }
  })

  contents.on('will-navigate', (event, url) => {
    if (!isChessDotComURL(url)) {
      event.preventDefault()
      openExternalURL(url)
    }
  })

  contents.on('did-start-loading', () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WEBVIEW.LOAD_START)
  })

  contents.on('did-stop-loading', () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WEBVIEW.LOAD_STOP)

    const chatEnabled = store.get('chatEnabled')
    if (!chatEnabled) {
      contents.insertCSS(buildHideCSS(CHESS_SELECTORS.CHAT)).catch((err) => {
        log.error('Failed to hide chat on page load:', err)
      })
    }

    const hideRatings = store.get('hideRatings')
    if (hideRatings) {
      contents.insertCSS(buildHideCSS(CHESS_SELECTORS.RATINGS)).catch((err) => {
        log.error('Failed to hide ratings on page load:', err)
      })
    }

    const theme = store.get('theme')
    applyTheme(contents, theme)
  })

  contents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode !== -3) {
      mainWindow?.webContents.send(IPC_CHANNELS.WEBVIEW.LOAD_ERROR, { errorCode, errorDescription, validatedURL })
    }
  })
}
