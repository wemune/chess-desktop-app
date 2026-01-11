import { createElement, FileText, X } from 'lucide'
import { ThemeId } from '../../shared/themes'

export class SettingsModal {
  private modal: HTMLElement
  private backdrop: HTMLElement
  private closeBtn: HTMLButtonElement
  private themeSelect: HTMLSelectElement
  private notificationsToggle: HTMLInputElement
  private chatToggle: HTMLInputElement
  private alwaysOnTopToggle: HTMLInputElement
  private hardwareAccelerationToggle: HTMLInputElement
  private soundMutedToggle: HTMLInputElement
  private discordRpcToggle: HTMLInputElement
  private hideRatingsToggle: HTMLInputElement
  private openLogsBtn: HTMLButtonElement

  constructor() {
    this.modal = document.getElementById('settings-modal') as HTMLElement
    this.backdrop = this.modal.querySelector('.modal-backdrop') as HTMLElement
    this.closeBtn = document.getElementById('settings-close') as HTMLButtonElement
    this.themeSelect = document.getElementById('theme-select') as HTMLSelectElement
    this.notificationsToggle = document.getElementById('notifications-toggle') as HTMLInputElement
    this.chatToggle = document.getElementById('chat-toggle') as HTMLInputElement
    this.alwaysOnTopToggle = document.getElementById('always-on-top-toggle') as HTMLInputElement
    this.hardwareAccelerationToggle = document.getElementById('hardware-acceleration-toggle') as HTMLInputElement
    this.soundMutedToggle = document.getElementById('sound-muted-toggle') as HTMLInputElement
    this.discordRpcToggle = document.getElementById('discord-rpc-toggle') as HTMLInputElement
    this.hideRatingsToggle = document.getElementById('hide-ratings-toggle') as HTMLInputElement
    this.openLogsBtn = document.getElementById('open-logs-btn') as HTMLButtonElement

    this.initializeIcons()
    this.bindEvents()
  }

  private initializeIcons(): void {
    const iconSize = { width: 16, height: 16, strokeWidth: 2 }

    this.openLogsBtn.appendChild(createElement(FileText, iconSize))
    this.closeBtn.appendChild(createElement(X, iconSize))
  }

  async init(): Promise<void> {
    const settings = await window.electronAPI.settings.get()
    this.themeSelect.value = settings.theme ?? 'default'
    this.notificationsToggle.checked = settings.notificationsEnabled ?? true
    this.chatToggle.checked = settings.chatEnabled ?? true
    this.alwaysOnTopToggle.checked = settings.alwaysOnTop ?? false
    this.hardwareAccelerationToggle.checked = settings.hardwareAcceleration ?? true
    this.soundMutedToggle.checked = settings.soundMuted ?? false
    this.discordRpcToggle.checked = settings.discordRpcEnabled ?? true
    this.hideRatingsToggle.checked = settings.hideRatings ?? false
  }

  private bindEvents(): void {
    this.closeBtn.addEventListener('click', () => this.close())
    this.backdrop.addEventListener('click', () => this.close())

    this.themeSelect.addEventListener('change', () => {
      window.electronAPI.settings.set({
        theme: this.themeSelect.value as ThemeId
      })
    })

    this.notificationsToggle.addEventListener('change', () => {
      window.electronAPI.settings.set({
        notificationsEnabled: this.notificationsToggle.checked
      })
    })

    this.chatToggle.addEventListener('change', () => {
      window.electronAPI.settings.set({
        chatEnabled: this.chatToggle.checked
      })
    })

    this.alwaysOnTopToggle.addEventListener('change', () => {
      window.electronAPI.settings.set({
        alwaysOnTop: this.alwaysOnTopToggle.checked
      })
    })

    this.hardwareAccelerationToggle.addEventListener('change', () => {
      window.electronAPI.settings.set({
        hardwareAcceleration: this.hardwareAccelerationToggle.checked
      })
      window.electronAPI.restartDialog.show()
    })

    this.soundMutedToggle.addEventListener('change', () => {
      window.electronAPI.settings.set({
        soundMuted: this.soundMutedToggle.checked
      })
    })

    this.discordRpcToggle.addEventListener('change', () => {
      window.electronAPI.settings.set({
        discordRpcEnabled: this.discordRpcToggle.checked
      })
    })

    this.hideRatingsToggle.addEventListener('change', () => {
      window.electronAPI.settings.set({
        hideRatings: this.hideRatingsToggle.checked
      })
    })

    this.openLogsBtn.addEventListener('click', () => {
      window.electronAPI.logs.openFolder()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.close()
      }
    })
  }

  open(): void {
    this.modal.classList.remove('hidden')
  }

  close(): void {
    this.modal.classList.add('hidden')
  }
}
