import { BrowserWindow } from 'electron'
import pkg from 'electron-updater'
import log from 'electron-log'

const { autoUpdater } = pkg

let mainWindow: BrowserWindow | null = null

export function setMainWindow(window: BrowserWindow): void {
  mainWindow = window
}

export function initAutoUpdater(): void {
  if (process.env.NODE_ENV === 'development') {
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version)
    mainWindow?.webContents.send('update:available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate
    })
  })

  autoUpdater.on('update-not-available', () => {
    log.info('No updates available')
  })

  autoUpdater.on('error', (err) => {
    log.error('Update error:', err)
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded')
    mainWindow?.webContents.send('update:downloaded')
  })

  setTimeout(() => {
    autoUpdater.checkForUpdates()
  }, 3000)
}

export function downloadUpdate(): void {
  autoUpdater.downloadUpdate()
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall()
}
