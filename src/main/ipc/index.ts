import { registerAppHandlers } from './app'
import { registerLogsHandlers } from './logs'
import { registerPlatformHandlers } from './platform'
import { registerSettingsHandlers } from './settings'
import { registerUpdateHandlers } from './update'
import { registerWebviewHandlers } from './webview'
import { registerWindowHandlers } from './window'

export function registerIpcHandlers(): void {
  registerWindowHandlers()
  registerSettingsHandlers()
  registerLogsHandlers()
  registerPlatformHandlers()
  registerWebviewHandlers()
  registerUpdateHandlers()
  registerAppHandlers()
}
