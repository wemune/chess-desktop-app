import { zoomLevelToPercentage } from '../../shared/constants'
import { createElement, ArrowLeft, ArrowRight, RotateCw, ZoomIn, ZoomOut, Settings, Minus, Square, Minimize2, X, Copy, CopyCheck } from 'lucide'
import log from 'electron-log/renderer'

export class Titlebar {
  private minimizeBtn: HTMLButtonElement
  private maximizeBtn: HTMLButtonElement
  private closeBtn: HTMLButtonElement
  private settingsBtn: HTMLButtonElement
  private navBackBtn: HTMLButtonElement
  private navForwardBtn: HTMLButtonElement
  private refreshBtn: HTMLButtonElement
  private copyUrlBtn: HTMLButtonElement
  private copyFeedback: HTMLElement
  private zoomInBtn: HTMLButtonElement
  private zoomOutBtn: HTMLButtonElement
  private zoomLevelDisplay: HTMLElement
  private settingsCallback: (() => void) | null = null

  constructor() {
    this.minimizeBtn = document.getElementById('minimize-btn') as HTMLButtonElement
    this.maximizeBtn = document.getElementById('maximize-btn') as HTMLButtonElement
    this.closeBtn = document.getElementById('close-btn') as HTMLButtonElement
    this.settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement
    this.navBackBtn = document.getElementById('nav-back') as HTMLButtonElement
    this.navForwardBtn = document.getElementById('nav-forward') as HTMLButtonElement
    this.refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement
    this.copyUrlBtn = document.getElementById('copy-url-btn') as HTMLButtonElement
    this.copyFeedback = document.getElementById('copy-feedback') as HTMLElement
    this.zoomInBtn = document.getElementById('zoom-in') as HTMLButtonElement
    this.zoomOutBtn = document.getElementById('zoom-out') as HTMLButtonElement
    this.zoomLevelDisplay = document.getElementById('zoom-level') as HTMLElement

    this.initializeIcons()
    this.bindEvents()
    this.updateMaximizeIcon()
    this.updateNavigationButtons()
    this.updateZoomDisplay()
  }

  private initializeIcons(): void {
    const iconSize = { width: 16, height: 16, strokeWidth: 2 }
    const controlSize = { width: 12, height: 12, strokeWidth: 2 }

    this.navBackBtn.appendChild(createElement(ArrowLeft, iconSize))
    this.navForwardBtn.appendChild(createElement(ArrowRight, iconSize))
    this.refreshBtn.appendChild(createElement(RotateCw, iconSize))
    this.copyUrlBtn.appendChild(createElement(Copy, iconSize))
    this.zoomInBtn.appendChild(createElement(ZoomIn, iconSize))
    this.zoomOutBtn.appendChild(createElement(ZoomOut, iconSize))
    this.settingsBtn.appendChild(createElement(Settings, iconSize))
    this.minimizeBtn.appendChild(createElement(Minus, controlSize))
    this.maximizeBtn.appendChild(createElement(Square, controlSize))
    this.closeBtn.appendChild(createElement(X, controlSize))
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

    this.refreshBtn.addEventListener('click', () => {
      window.electronAPI.webview.reload()
    })

    this.copyUrlBtn.addEventListener('click', async () => {
      await this.copyCurrentUrl()
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

    window.electronAPI.webview.onLoadStop(() => {
      this.updateNavigationButtons()
      this.updateZoomDisplay()
    })
  }

  private async updateMaximizeIcon(isMaximized?: boolean): Promise<void> {
    const maximized = isMaximized ?? await window.electronAPI.window.isMaximized()

    if (maximized) {
      this.maximizeBtn.title = 'Restore'
    } else {
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
    const percentage = zoomLevelToPercentage(zoomLevel)
    this.zoomLevelDisplay.textContent = `${percentage}%`
    this.zoomLevelDisplay.title = `Zoom: ${percentage}% (Click to reset)`
  }

  private async copyCurrentUrl(): Promise<void> {
    try {
      const url = await window.electronAPI.webview.getUrl()
      log.info('Copying URL to clipboard:', url)

      await navigator.clipboard.writeText(url)
      log.info('URL copied successfully')

      const iconSize = { width: 16, height: 16, strokeWidth: 2 }
      this.copyUrlBtn.innerHTML = ''
      this.copyUrlBtn.appendChild(createElement(CopyCheck, iconSize))

      this.copyFeedback.classList.remove('hidden', 'fade-out')

      setTimeout(() => {
        this.copyUrlBtn.innerHTML = ''
        this.copyUrlBtn.appendChild(createElement(Copy, iconSize))
        this.copyFeedback.classList.add('fade-out')

        setTimeout(() => {
          this.copyFeedback.classList.add('hidden')
          this.copyFeedback.classList.remove('fade-out')
        }, 300)
      }, 2000)
    } catch (error) {
      log.error('Failed to copy URL:', error)
    }
  }

  onSettingsClick(callback: () => void): void {
    this.settingsCallback = callback
  }
}
