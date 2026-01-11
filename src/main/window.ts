import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { store } from './store'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import { registerMainWindowShortcuts } from './shortcuts'

export const getUserAgent = (): string => {
  const chromeVersion = process.versions.chrome
  if (process.platform === 'darwin') {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
  }
  if (process.platform === 'linux') {
    return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
  }
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
}

export function createMainWindow(): BrowserWindow {
  const windowConfig = store.get('window')
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const width = Math.min(windowConfig.width, screenWidth)
  const height = Math.min(windowConfig.height, screenHeight)

  let windowX = windowConfig.x !== undefined ? windowConfig.x : Math.floor((screenWidth - width) / 2)
  let windowY = windowConfig.y !== undefined ? windowConfig.y : Math.floor((screenHeight - height) / 2)

  if (windowX < 0 || windowX + width > screenWidth) {
    windowX = Math.floor((screenWidth - width) / 2)
  }
  if (windowY < 0 || windowY + height > screenHeight) {
    windowY = Math.floor((screenHeight - height) / 2)
  }

  const isMac = process.platform === 'darwin'
  const isLinux = process.platform === 'linux'
  const iconExt = isMac ? 'icon.icns' : isLinux ? 'icon.png' : 'icon.ico'
  const iconPath = process.env.NODE_ENV === 'development'
    ? join(__dirname, '../../resources', iconExt)
    : join(process.resourcesPath, iconExt)

  const mainWindow = new BrowserWindow({
    width,
    height,
    x: windowX,
    y: windowY,
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

  const alwaysOnTop = store.get('alwaysOnTop')
  mainWindow.setAlwaysOnTop(alwaysOnTop)

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send(IPC_CHANNELS.WINDOW.MAXIMIZE_CHANGE, true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send(IPC_CHANNELS.WINDOW.MAXIMIZE_CHANGE, false)
  })

  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds()
    store.set('window', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: mainWindow.isMaximized()
    })
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('platform', process.platform)
  })

  registerMainWindowShortcuts(mainWindow)

  return mainWindow
}
