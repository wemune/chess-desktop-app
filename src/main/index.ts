import { app, BrowserWindow, screen, shell, dialog } from 'electron'
import { join } from 'path'
import { store } from './store'
import { registerIpcHandlers, setChessWebContents } from './ipc-handlers'
import { initAutoUpdater, setMainWindow } from './auto-updater'
import log from 'electron-log'
import { ZOOM_PERCENTAGES, percentageToZoomLevel, getClosestZoomIndex } from '../shared/constants'

if (process.platform === 'win32') {
  app.setAppUserModelId('Chess Desktop App')
}

let mainWindow: BrowserWindow | null = null

const getUserAgent = (): string => {
  const chromeVersion = process.versions.chrome
  if (process.platform === 'darwin') {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
  } else if (process.platform === 'linux') {
    return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
  }
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
}

const isChessDotComURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    const validHostname = urlObj.hostname === 'www.chess.com' || urlObj.hostname === 'chess.com'
    return validHostname && urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

app.userAgentFallback = getUserAgent()

function createWindow(): void {
  const windowConfig = store.get('window')
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const width = Math.min(windowConfig.width, screenWidth)
  const height = Math.min(windowConfig.height, screenHeight)

  let x = windowConfig.x !== undefined ? windowConfig.x : Math.floor((screenWidth - width) / 2)
  let y = windowConfig.y !== undefined ? windowConfig.y : Math.floor((screenHeight - height) / 2)

  if (x < 0 || x + width > screenWidth) {
    x = Math.floor((screenWidth - width) / 2)
  }
  if (y < 0 || y + height > screenHeight) {
    y = Math.floor((screenHeight - height) / 2)
  }

  const isMac = process.platform === 'darwin'
  const isLinux = process.platform === 'linux'
  const iconExt = isMac ? 'icon.icns' : isLinux ? 'icon.png' : 'icon.ico'
  const iconPath = process.env.NODE_ENV === 'development'
    ? join(__dirname, '../../resources', iconExt)
    : join(process.resourcesPath, iconExt)

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    trafficLightPosition: isMac ? { x: 15, y: 12 } : undefined,
    backgroundColor: '#312e2b',
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      webviewTag: true,
      contextIsolation: true,
      sandbox: false,
      devTools: process.env.NODE_ENV === 'development'
    }
  })

  if (windowConfig.isMaximized) {
    mainWindow.maximize()
  }

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximize-change', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximize-change', false)
  })

  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      store.set('window', {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized: mainWindow.isMaximized()
      })
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('platform', process.platform)
  })

  setMainWindow(mainWindow)
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  initAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('web-contents-created', (_event, contents) => {
  if (contents.getType() === 'webview') {
    setChessWebContents(contents)
    contents.setUserAgent(getUserAgent())

    const savedZoom = store.get('zoomLevel')
    contents.setZoomLevel(savedZoom)

    contents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return

      const isMac = process.platform === 'darwin'
      const modifier = isMac ? input.meta : input.control

      if ((modifier && input.key.toLowerCase() === 'r') || input.key === 'F5') {
        event.preventDefault()
        contents.reload()
      }

      if (input.alt && input.key === 'ArrowLeft') {
        event.preventDefault()
        if (contents.navigationHistory.canGoBack()) {
          contents.navigationHistory.goBack()
        }
      }

      if (input.alt && input.key === 'ArrowRight') {
        event.preventDefault()
        if (contents.navigationHistory.canGoForward()) {
          contents.navigationHistory.goForward()
        }
      }

      if (modifier && (input.key === '=' || input.key === '+')) {
        event.preventDefault()
        const currentZoom = contents.getZoomLevel()
        const currentIndex = getClosestZoomIndex(currentZoom)
        const nextIndex = Math.min(currentIndex + 1, ZOOM_PERCENTAGES.length - 1)
        const newZoom = percentageToZoomLevel(ZOOM_PERCENTAGES[nextIndex])
        contents.setZoomLevel(newZoom)
        store.set('zoomLevel', newZoom)
      }

      if (modifier && (input.key === '-' || input.key === '_')) {
        event.preventDefault()
        const currentZoom = contents.getZoomLevel()
        const currentIndex = getClosestZoomIndex(currentZoom)
        const prevIndex = Math.max(currentIndex - 1, 0)
        const newZoom = percentageToZoomLevel(ZOOM_PERCENTAGES[prevIndex])
        contents.setZoomLevel(newZoom)
        store.set('zoomLevel', newZoom)
      }

      if (modifier && input.key === '0') {
        event.preventDefault()
        contents.setZoomLevel(0)
        store.set('zoomLevel', 0)
      }
    })

    contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === 'notifications' && isChessDotComURL(webContents.getURL())) {
        const notificationsEnabled = store.get('notificationsEnabled')
        if (notificationsEnabled) {
          log.info('Granting notification permission to chess.com')
          callback(true)
        } else {
          log.info('Denying notification permission (disabled in settings)')
          callback(false)
        }
      } else {
        log.warn('Denying permission request:', permission)
        callback(false)
      }
    })

    contents.setWindowOpenHandler(({ url }) => {
      log.info('[WindowOpenHandler] Popup requested:', url)
      if (isChessDotComURL(url)) {
        log.info('[WindowOpenHandler] Loading chess.com URL in webview')
        contents.loadURL(url)
      } else {
        log.info('[WindowOpenHandler] Opening external URL')
        shell.openExternal(url)
      }
      return { action: 'deny' }
    })

    contents.on('will-navigate', (event, url) => {
      if (!isChessDotComURL(url)) {
        event.preventDefault()
        shell.openExternal(url)
      }
    })

    contents.on('did-start-loading', () => {
      mainWindow?.webContents.send('webview:load-start')
    })

    contents.on('did-stop-loading', () => {
      mainWindow?.webContents.send('webview:load-stop')

      const chatEnabled = store.get('chatEnabled')
      if (!chatEnabled) {
        contents.insertCSS('.resizable-chat-area-component { display: none !important; }').catch((err) => {
          log.error('Failed to hide chat on page load:', err)
        })
      }
    })

    contents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      if (errorCode !== -3) {
        mainWindow?.webContents.send('webview:load-error', { errorCode, errorDescription, validatedURL })
      }
    })
  }
})
