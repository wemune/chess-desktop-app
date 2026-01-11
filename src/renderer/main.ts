import log from 'electron-log/renderer'
import { Titlebar } from './components/titlebar'
import { SettingsModal } from './components/settings-modal'
import { RestartDialog } from './components/restart-dialog'
import { setupAutoUpdater, setupErrorHandling, setupKeyboardShortcuts, setupLoadingIndicator } from './setup'

async function init() {
  if (!window.electronAPI) {
    log.error('electronAPI not available!')
    return
  }

  try {
    const platform = await window.electronAPI.platform.get()
    document.body.classList.add(`platform-${platform}`)
  } catch (err) {
    log.error('Failed to get platform:', err)
  }

  try {
    const titlebar = new Titlebar()
    const settingsModal = new SettingsModal()
    const restartDialog = new RestartDialog()

    titlebar.onSettingsClick(() => settingsModal.open())

    await settingsModal.init()
  } catch (err) {
    log.error('Failed to initialize titlebar or settings:', err)
  }

  try {
    setupKeyboardShortcuts()
  } catch (err) {
    log.error('Failed to setup keyboard shortcuts:', err)
  }

  try {
    setupLoadingIndicator()
  } catch (err) {
    log.error('Failed to setup loading indicator:', err)
  }

  try {
    setupErrorHandling()
  } catch (err) {
    log.error('Failed to setup error handling:', err)
  }

  try {
    setupAutoUpdater()
  } catch (err) {
    log.error('Failed to setup auto-updater:', err)
  }
}

init()
