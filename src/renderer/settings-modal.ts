export class SettingsModal {
  private modal: HTMLElement
  private backdrop: HTMLElement
  private closeBtn: HTMLButtonElement
  private notificationsToggle: HTMLInputElement
  private chatToggle: HTMLInputElement
  private alwaysOnTopToggle: HTMLInputElement
  private openLogsBtn: HTMLButtonElement

  constructor() {
    this.modal = document.getElementById('settings-modal') as HTMLElement
    this.backdrop = this.modal.querySelector('.modal-backdrop') as HTMLElement
    this.closeBtn = document.getElementById('settings-close') as HTMLButtonElement
    this.notificationsToggle = document.getElementById('notifications-toggle') as HTMLInputElement
    this.chatToggle = document.getElementById('chat-toggle') as HTMLInputElement
    this.alwaysOnTopToggle = document.getElementById('always-on-top-toggle') as HTMLInputElement
    this.openLogsBtn = document.getElementById('open-logs-btn') as HTMLButtonElement

    this.bindEvents()
  }

  async init(): Promise<void> {
    const settings = await window.electronAPI.settings.get()
    this.notificationsToggle.checked = settings.notificationsEnabled ?? true
    this.chatToggle.checked = settings.chatEnabled ?? true
    this.alwaysOnTopToggle.checked = settings.alwaysOnTop ?? false
  }

  private bindEvents(): void {
    this.closeBtn.addEventListener('click', () => this.close())
    this.backdrop.addEventListener('click', () => this.close())

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
