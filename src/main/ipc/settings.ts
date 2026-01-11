import { BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'
import { store } from '../store'
import { StoreSchema } from '../../shared/store'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { CHESS_SELECTORS, buildHideCSS, buildShowCSS } from '../../shared/chess-selectors'
import { THEMES, ThemeId } from '../../shared/themes'
import { initializeDiscordRPC, destroyDiscordRPC } from '../discord-rpc'
import { applyTheme } from '../theme'
import { getChessWebContents } from './webview'

export function registerSettingsHandlers(): void {
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

        const chessWebContents = getChessWebContents()
        if (chessWebContents) {
          const cssCode = settings.chatEnabled
            ? buildShowCSS(CHESS_SELECTORS.CHAT)
            : buildHideCSS(CHESS_SELECTORS.CHAT)

          chessWebContents.insertCSS(cssCode).catch((err: unknown) => {
            log.error('Failed to toggle chat visibility:', err)
          })
        }
      } else {
        log.warn('Invalid chatEnabled setting received:', settings.chatEnabled)
      }
    }

    if (settings.hideRatings !== undefined) {
      if (typeof settings.hideRatings === 'boolean') {
        store.set('hideRatings', settings.hideRatings)
        log.info('Hide ratings setting updated:', settings.hideRatings)

        const chessWebContents = getChessWebContents()
        if (chessWebContents) {
          const cssCode = settings.hideRatings
            ? buildHideCSS(CHESS_SELECTORS.RATINGS)
            : buildShowCSS(CHESS_SELECTORS.RATINGS)

          chessWebContents.insertCSS(cssCode).catch((err: unknown) => {
            log.error('Failed to toggle ratings visibility:', err)
          })
        }
      } else {
        log.warn('Invalid hideRatings setting received:', settings.hideRatings)
      }
    }

    if (settings.alwaysOnTop !== undefined) {
      if (typeof settings.alwaysOnTop === 'boolean') {
        store.set('alwaysOnTop', settings.alwaysOnTop)
        log.info('Always on top setting updated:', settings.alwaysOnTop)

        const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
        if (win) {
          win.setAlwaysOnTop(settings.alwaysOnTop)
        }
      } else {
        log.warn('Invalid alwaysOnTop setting received:', settings.alwaysOnTop)
      }
    }

    if (settings.hardwareAcceleration !== undefined) {
      if (typeof settings.hardwareAcceleration === 'boolean') {
        store.set('hardwareAcceleration', settings.hardwareAcceleration)
        log.info('Hardware acceleration setting updated:', settings.hardwareAcceleration)
      } else {
        log.warn('Invalid hardwareAcceleration setting received:', settings.hardwareAcceleration)
      }
    }

    if (settings.soundMuted !== undefined) {
      if (typeof settings.soundMuted === 'boolean') {
        store.set('soundMuted', settings.soundMuted)
        log.info('Sound muted setting updated:', settings.soundMuted)

        const chessWebContents = getChessWebContents()
        if (chessWebContents) {
          chessWebContents.setAudioMuted(settings.soundMuted)
        }
      } else {
        log.warn('Invalid soundMuted setting received:', settings.soundMuted)
      }
    }

    if (settings.theme !== undefined) {
      if (typeof settings.theme === 'string' && settings.theme in THEMES) {
        const themeId = settings.theme as ThemeId
        store.set('theme', themeId)
        log.info('Theme setting updated:', themeId)

        const chessWebContents = getChessWebContents()
        if (chessWebContents) {
          applyTheme(chessWebContents, themeId)
        }
      } else {
        log.warn('Invalid theme setting received:', settings.theme)
      }
    }

    if (settings.discordRpcEnabled !== undefined) {
      if (typeof settings.discordRpcEnabled === 'boolean') {
        store.set('discordRpcEnabled', settings.discordRpcEnabled)
        log.info('Discord RPC setting updated:', settings.discordRpcEnabled)

        if (settings.discordRpcEnabled) {
          initializeDiscordRPC()
        } else {
          destroyDiscordRPC()
        }
      } else {
        log.warn('Invalid discordRpcEnabled setting received:', settings.discordRpcEnabled)
      }
    }
  })
}
