export class RestartDialog {
  private modal: HTMLElement
  private backdrop: HTMLElement
  private laterBtn: HTMLButtonElement
  private restartBtn: HTMLButtonElement

  constructor() {
    this.modal = document.getElementById('restart-dialog') as HTMLElement
    this.backdrop = this.modal.querySelector('.modal-backdrop') as HTMLElement
    this.laterBtn = document.getElementById('restart-later-btn') as HTMLButtonElement
    this.restartBtn = document.getElementById('restart-now-btn') as HTMLButtonElement

    this.bindEvents()

    window.addEventListener('show-restart-dialog', () => this.show())
  }

  private bindEvents(): void {
    this.laterBtn.addEventListener('click', () => this.close())
    this.backdrop.addEventListener('click', () => this.close())

    this.restartBtn.addEventListener('click', () => {
      window.electronAPI.app.restart()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.close()
      }
    })
  }

  show(): void {
    this.modal.classList.remove('hidden')
  }

  close(): void {
    this.modal.classList.add('hidden')
  }
}
