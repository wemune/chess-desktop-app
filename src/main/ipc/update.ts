import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { downloadUpdate, installUpdate } from '../auto-updater'

export function registerUpdateHandlers(): void {
  ipcMain.on(IPC_CHANNELS.UPDATE.DOWNLOAD, () => {
    downloadUpdate()
  })

  ipcMain.on(IPC_CHANNELS.UPDATE.INSTALL, () => {
    installUpdate()
  })
}
