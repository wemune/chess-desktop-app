import { app, ipcMain } from 'electron'
import log from 'electron-log'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerAppHandlers(): void {
  ipcMain.on(IPC_CHANNELS.APP.RESTART, () => {
    log.info('Restarting application...')
    app.relaunch()
    app.quit()
  })
}
