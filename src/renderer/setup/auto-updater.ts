import log from 'electron-log/renderer'

export function setupAutoUpdater(): void {
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
