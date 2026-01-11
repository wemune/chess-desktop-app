import log from 'electron-log/renderer'

export function setupLoadingIndicator(): void {
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
