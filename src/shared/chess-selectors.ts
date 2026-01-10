export const CHESS_SELECTORS = {
  CHAT: '.resizable-chat-area-component',
  RATINGS: [
    '[class*="rating"]',
    '[class*="player-rating"]',
    '.game-start-message-component',
    '.game-over-message-component'
  ].join(', ')
} as const

export function buildHideCSS(selector: string): string {
  return `${selector} { display: none !important; }`
}

export function buildShowCSS(selector: string): string {
  return `${selector} { display: block !important; }`
}
