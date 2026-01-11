import { ipcMain, shell } from 'electron'
import log from 'electron-log'
import { dirname } from 'path'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerLogsHandlers(): void {
  ipcMain.on(IPC_CHANNELS.LOGS.OPEN_FOLDER, async () => {
    const logPath = log.transports.file.getFile().path
    const logDir = dirname(logPath)
    try {
      await shell.openPath(logDir)
      log.info('Opened logs folder:', logDir)
    } catch (err) {
      log.error('Failed to open logs folder:', err)
    }
  })
}
