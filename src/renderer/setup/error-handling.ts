import log from 'electron-log/renderer'

export function setupErrorHandling(): void {
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
