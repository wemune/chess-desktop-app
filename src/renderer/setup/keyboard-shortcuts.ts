export function setupKeyboardShortcuts(): void {
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
