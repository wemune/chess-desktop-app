export class SettingsModal {
  private modal: HTMLElement
  private backdrop: HTMLElement
  private closeBtn: HTMLButtonElement

  constructor() {
    this.modal = document.getElementById('settings-modal') as HTMLElement
    this.backdrop = this.modal.querySelector('.modal-backdrop') as HTMLElement
    this.closeBtn = document.getElementById('settings-close') as HTMLButtonElement

    this.bindEvents()
  }

  async init(): Promise<void> {
  }

  private bindEvents(): void {
    this.closeBtn.addEventListener('click', () => this.close())
    this.backdrop.addEventListener('click', () => this.close())

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
