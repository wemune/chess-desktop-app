export class SettingsModal {
  private modal: HTMLElement
  private backdrop: HTMLElement
  private closeBtn: HTMLButtonElement
  private notificationsToggle: HTMLInputElement
  private chatToggle: HTMLInputElement

  constructor() {
    this.modal = document.getElementById('settings-modal') as HTMLElement
    this.backdrop = this.modal.querySelector('.modal-backdrop') as HTMLElement
    this.closeBtn = document.getElementById('settings-close') as HTMLButtonElement
    this.notificationsToggle = document.getElementById('notifications-toggle') as HTMLInputElement
    this.chatToggle = document.getElementById('chat-toggle') as HTMLInputElement

    this.bindEvents()
  }

  async init(): Promise<void> {
    const settings = await window.electronAPI.settings.get()
    this.notificationsToggle.checked = settings.notificationsEnabled ?? true
    this.chatToggle.checked = settings.chatEnabled ?? true
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
