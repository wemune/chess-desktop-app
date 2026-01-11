import { app, BrowserWindow } from 'electron'
import log from 'electron-log'
import { store } from './store'
import { registerIpcHandlers } from './ipc'
import { initAutoUpdater, setMainWindow } from './auto-updater'
import { initializeDiscordRPC, destroyDiscordRPC } from './discord-rpc'
import { createMainWindow, getUserAgent } from './window'
import { configureWebviewContents } from './webview'

log.transports.file.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info'
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'

const hardwareAcceleration = store.get('hardwareAcceleration')
if (!hardwareAcceleration) {
  log.info('Disabling hardware acceleration per user settings')
  app.disableHardwareAcceleration()
}

if (process.platform === 'win32') {
  app.setAppUserModelId('Chess Desktop App')
}

let mainWindow: BrowserWindow | null = null

app.userAgentFallback = getUserAgent()

const createAppWindow = (): void => {
  mainWindow = createMainWindow()
  setMainWindow(mainWindow)
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createAppWindow()
  initAutoUpdater()

  const discordRpcEnabled = store.get('discordRpcEnabled')
  if (discordRpcEnabled) {
    initializeDiscordRPC()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createAppWindow()
    }
  })
})

app.on('window-all-closed', () => {
  destroyDiscordRPC()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('web-contents-created', (_event, contents) => {
  configureWebviewContents(contents, mainWindow)
})
