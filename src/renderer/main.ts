import { Titlebar } from './titlebar'
import { SettingsModal } from './settings-modal'
import { RestartDialog } from './restart-dialog'
import log from 'electron-log/renderer'

function setupLoadingIndicator() {
  const loadingBar = document.getElementById('loading-bar')
  if (!loadingBar) {
    log.error('Failed to setup loading indicator: loading-bar element not found')
    return
  }

  let loadingTimeout: number | null = null

  window.electronAPI.webview.onLoadStart(() => {
    loadingBar.classList.remove('hidden')
    loadingBar.classList.add('loading')

    if (loadingTimeout) clearTimeout(loadingTimeout)
    loadingTimeout = window.setTimeout(() => {
      loadingBar.classList.add('hidden')
      loadingBar.classList.remove('loading')
      log.warn('Loading timeout - took longer than 30 seconds')
    }, 30000)
  })

  window.electronAPI.webview.onLoadStop(() => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      loadingTimeout = null
    }
    loadingBar.classList.add('hidden')
    loadingBar.classList.remove('loading')
  })
}

function setupErrorHandling() {
  const errorOverlay = document.getElementById('error-overlay')
  const errorMessage = document.getElementById('error-message')
  const retryBtn = document.getElementById('error-retry')

  if (!errorOverlay || !errorMessage || !retryBtn) {
    log.error('Failed to setup error handling: missing required elements', {
      errorOverlay: !!errorOverlay,
      errorMessage: !!errorMessage,
      retryBtn: !!retryBtn
    })
    return
  }

  window.electronAPI.webview.onLoadError((error) => {
    if (!navigator.onLine) {
      errorMessage.textContent = 'No internet connection. Please check your network and try again.'
    } else {
      errorMessage.textContent = `Unable to connect to Chess.com: ${error.errorDescription}`
    }
    errorOverlay.classList.remove('hidden')
  })

  window.electronAPI.webview.onLoadStop(() => {
    errorOverlay.classList.add('hidden')
  })

  retryBtn.addEventListener('click', () => {
    window.electronAPI.webview.reload()
  })
}

function setupAutoUpdater() {
  const banner = document.getElementById('update-banner')
  const message = document.getElementById('update-message')
  const downloadBtn = document.getElementById('update-download-btn')
  const progressContainer = document.getElementById('update-progress')
  const progressLabel = document.getElementById('update-progress-label')
  const progressPercent = document.getElementById('update-progress-percent')
  const progressFill = document.getElementById('update-progress-fill')

  if (!banner || !message || !downloadBtn || !progressContainer || !progressLabel || !progressPercent || !progressFill) {
    log.error('Failed to setup auto-updater: missing required elements', {
      banner: !!banner,
      message: !!message,
      downloadBtn: !!downloadBtn,
      progressContainer: !!progressContainer,
      progressLabel: !!progressLabel,
      progressPercent: !!progressPercent,
      progressFill: !!progressFill
    })
    return
  }

  window.electronAPI.update.onAvailable((info) => {
    message.textContent = `Downloading update ${info.version}...`
    banner.classList.remove('hidden')
    document.body.classList.add('update-visible')

    const updateContent = document.querySelector('.update-content')
    updateContent?.classList.add('hidden')
    progressContainer.classList.remove('hidden')
  })

  window.electronAPI.update.onDownloadProgress((progress) => {
    const percent = Math.round(progress.percent)
    progressPercent.textContent = `${percent}%`
    progressFill.style.width = `${percent}%`
  })

  window.electronAPI.update.onDownloaded(() => {
    progressContainer.classList.add('hidden')
    const updateContent = document.querySelector('.update-content')
    updateContent?.classList.remove('hidden')
    message.textContent = 'Update ready! Will install on restart.'
    downloadBtn.onclick = () => window.electronAPI.update.install()
  })
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modifier = isMac ? e.metaKey : e.ctrlKey

    if ((modifier && e.key === 'r') || e.key === 'F5') {
      e.preventDefault()
      window.electronAPI.webview.reload()
    }

    if (modifier && (e.key === '=' || e.key === '+')) {
      e.preventDefault()
      window.electronAPI.webview.zoomIn()
    }

    if (modifier && (e.key === '-' || e.key === '_')) {
      e.preventDefault()
      window.electronAPI.webview.zoomOut()
    }

    if (modifier && e.key === '0') {
      e.preventDefault()
      window.electronAPI.webview.zoomReset()
    }

    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault()
      window.electronAPI.webview.goBack()
    }

    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault()
      window.electronAPI.webview.goForward()
    }
  })
}


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
