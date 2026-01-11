import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerPlatformHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.PLATFORM.GET, (): NodeJS.Platform => {
    return process.platform
  })
}
