import { Titlebar } from './titlebar'
import { SettingsModal } from './settings-modal'

function setupLoadingIndicator() {
  const loadingBar = document.getElementById('loading-bar')
  if (!loadingBar) return

  let loadingTimeout: number | null = null

  window.electronAPI.webview.onLoadStart(() => {
    loadingBar.classList.remove('hidden')
    loadingBar.classList.add('loading')

    if (loadingTimeout) clearTimeout(loadingTimeout)
    loadingTimeout = window.setTimeout(() => {
      loadingBar.classList.add('hidden')
      loadingBar.classList.remove('loading')
      console.warn('Loading timeout - took longer than 30 seconds')
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

  if (!errorOverlay || !errorMessage || !retryBtn) return

  window.electronAPI.webview.onLoadError((error) => {
    errorMessage.textContent = `Unable to connect to Chess.com: ${error.errorDescription}`
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
  const dismissBtn = document.getElementById('update-dismiss-btn')
  const progressContainer = document.getElementById('update-progress')
  const progressLabel = document.getElementById('update-progress-label')
  const progressPercent = document.getElementById('update-progress-percent')
  const progressFill = document.getElementById('update-progress-fill')

  if (!banner || !message || !downloadBtn || !dismissBtn || !progressContainer || !progressLabel || !progressPercent || !progressFill) {
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

  dismissBtn.addEventListener('click', () => {
    banner.classList.add('hidden')
    document.body.classList.remove('update-visible')
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
    downloadBtn.textContent = 'Restart Now'
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
    console.error('electronAPI not available!')
    return
  }

  const platform = await window.electronAPI.platform.get()
  document.body.classList.add(`platform-${platform}`)

  const titlebar = new Titlebar()
  const settingsModal = new SettingsModal()

  titlebar.onSettingsClick(() => settingsModal.open())

  await settingsModal.init()

  setupKeyboardShortcuts()
  setupLoadingIndicator()
  setupErrorHandling()
  setupAutoUpdater()
}

init().catch(err => console.error('Init error:', err))
