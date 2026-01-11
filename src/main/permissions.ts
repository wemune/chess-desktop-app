import { WebContents } from 'electron'
import log from 'electron-log'
import { store } from './store'

export const isChessDotComURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    const validHostname = urlObj.hostname === 'www.chess.com' || urlObj.hostname === 'chess.com'
    return validHostname && urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

export function registerPermissionHandler(contents: WebContents): void {
  contents.session.setPermissionRequestHandler((requestingContents, permissionName, callback) => {
    if (permissionName === 'notifications' && isChessDotComURL(requestingContents.getURL())) {
      const notificationsEnabled = store.get('notificationsEnabled')
      if (notificationsEnabled) {
        log.info('Granting notification permission to chess.com')
        callback(true)
      } else {
        log.info('Denying notification permission (disabled in settings)')
        callback(false)
      }
    } else {
      log.warn('Denying permission request:', permissionName)
      callback(false)
    }
  })
}
