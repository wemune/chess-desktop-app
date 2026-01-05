export class Titlebar {
  private minimizeBtn: HTMLButtonElement
  private maximizeBtn: HTMLButtonElement
  private closeBtn: HTMLButtonElement
  private settingsBtn: HTMLButtonElement
  private navBackBtn: HTMLButtonElement
  private navForwardBtn: HTMLButtonElement
  private zoomInBtn: HTMLButtonElement
  private zoomOutBtn: HTMLButtonElement
  private zoomLevelDisplay: HTMLElement
  private settingsCallback: (() => void) | null = null
  private updateInterval: number | null = null

  constructor() {
    this.minimizeBtn = document.getElementById('minimize-btn') as HTMLButtonElement
    this.maximizeBtn = document.getElementById('maximize-btn') as HTMLButtonElement
    this.closeBtn = document.getElementById('close-btn') as HTMLButtonElement
    this.settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement
    this.navBackBtn = document.getElementById('nav-back') as HTMLButtonElement
    this.navForwardBtn = document.getElementById('nav-forward') as HTMLButtonElement
    this.zoomInBtn = document.getElementById('zoom-in') as HTMLButtonElement
    this.zoomOutBtn = document.getElementById('zoom-out') as HTMLButtonElement
    this.zoomLevelDisplay = document.getElementById('zoom-level') as HTMLElement

    this.bindEvents()
    this.updateMaximizeIcon()
    this.updateNavigationButtons()
    this.updateZoomDisplay()
  }

  private bindEvents(): void {
    this.minimizeBtn.addEventListener('click', () => {
      window.electronAPI.window.minimize()
    })

    this.maximizeBtn.addEventListener('click', () => {
      window.electronAPI.window.maximize()
    })

    this.closeBtn.addEventListener('click', () => {
      window.electronAPI.window.close()
    })

    this.settingsBtn.addEventListener('click', () => {
      this.settingsCallback?.()
    })

    this.navBackBtn.addEventListener('click', async () => {
      window.electronAPI.webview.goBack()
      setTimeout(() => this.updateNavigationButtons(), 100)
    })

    this.navForwardBtn.addEventListener('click', async () => {
      window.electronAPI.webview.goForward()
      setTimeout(() => this.updateNavigationButtons(), 100)
    })

    this.zoomInBtn.addEventListener('click', () => {
      window.electronAPI.webview.zoomIn()
      setTimeout(() => this.updateZoomDisplay(), 50)
    })

    this.zoomOutBtn.addEventListener('click', () => {
      window.electronAPI.webview.zoomOut()
      setTimeout(() => this.updateZoomDisplay(), 50)
    })

    this.zoomLevelDisplay.addEventListener('click', () => {
      window.electronAPI.webview.zoomReset()
      setTimeout(() => this.updateZoomDisplay(), 50)
    })

    window.electronAPI.window.onMaximizeChange((isMaximized) => {
      this.updateMaximizeIcon(isMaximized)
    })

    this.updateInterval = window.setInterval(() => {
      this.updateNavigationButtons()
      this.updateZoomDisplay()
    }, 500)
  }

  private async updateMaximizeIcon(isMaximized?: boolean): Promise<void> {
    const maximized = isMaximized ?? await window.electronAPI.window.isMaximized()
    const svg = this.maximizeBtn.querySelector('svg')
    if (!svg) return

    if (maximized) {
      svg.innerHTML = `
        <rect x="3" y="0" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
        <rect x="0" y="3" width="8" height="8" fill="#272522" stroke="currentColor" stroke-width="1"/>
      `
      this.maximizeBtn.title = 'Restore'
    } else {
      svg.innerHTML = `
        <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/>
      `
      this.maximizeBtn.title = 'Maximize'
    }
  }

  private async updateNavigationButtons(): Promise<void> {
    const canGoBack = await window.electronAPI.webview.canGoBack()
    const canGoForward = await window.electronAPI.webview.canGoForward()

    this.navBackBtn.disabled = !canGoBack
    this.navForwardBtn.disabled = !canGoForward
  }

  private async updateZoomDisplay(): Promise<void> {
    const zoomLevel = await window.electronAPI.webview.getZoom()
    const percentage = Math.round((1.2 ** zoomLevel) * 100)
    this.zoomLevelDisplay.textContent = `${percentage}%`
    this.zoomLevelDisplay.title = `Zoom: ${percentage}% (Click to reset)`
  }

  onSettingsClick(callback: () => void): void {
    this.settingsCallback = callback
  }

  destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }
}
