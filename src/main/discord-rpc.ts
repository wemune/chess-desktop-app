import { Client } from '@xhayper/discord-rpc'
import log from 'electron-log'
import { WebContents } from 'electron'

const CLIENT_ID = '1458615395249291305'

let rpcClient: Client | null = null
let isConnected = false
let webContents: WebContents | null = null
let pollingInterval: NodeJS.Timeout | null = null
let startTimestamp: number = Date.now()

interface GameInfo {
  mode: 'playing' | 'analyzing' | 'spectating' | 'browsing' | 'puzzles' | 'puzzle-rush' | 'puzzle-battle' | 'daily' | 'practicing' | 'vs-computer'
  timeControl?: string
  opponent?: string
  url?: string
}

export async function initializeDiscordRPC(): Promise<void> {
  if (rpcClient) {
    log.info('Discord RPC already initialized')
    return
  }

  try {
    startTimestamp = Date.now()

    rpcClient = new Client({ clientId: CLIENT_ID })

    rpcClient.on('ready', () => {
      log.info('Discord RPC connected')
      isConnected = true
      setActivity()
    })

    rpcClient.on('disconnected', () => {
      log.info('Discord RPC disconnected')
      isConnected = false
    })

    await rpcClient.login()
  } catch (err) {
    log.error('Failed to initialize Discord RPC:', err)
    rpcClient = null
    isConnected = false
  }
}

export function destroyDiscordRPC(): void {
  if (!rpcClient) return

  try {
    stopPolling()
    rpcClient.destroy()
    log.info('Discord RPC destroyed')
  } catch (err) {
    log.error('Failed to destroy Discord RPC:', err)
  } finally {
    rpcClient = null
    isConnected = false
    webContents = null
  }
}

async function detectGameState(): Promise<GameInfo> {
  if (!webContents || webContents.isDestroyed()) {
    return { mode: 'browsing' }
  }

  try {
    const gameInfo = await webContents.executeJavaScript(`
      (function() {
        const url = window.location.pathname;

        if (url.startsWith('/puzzles/rush')) {
          return { mode: 'puzzle-rush' };
        }

        if (url.startsWith('/puzzles/battle')) {
          return { mode: 'puzzle-battle' };
        }

        if (url.startsWith('/puzzles')) {
          return { mode: 'puzzles' };
        }

        if (url.startsWith('/daily')) {
          return { mode: 'daily' };
        }

        if (url.startsWith('/practice')) {
          return { mode: 'practicing' };
        }

        if (url.startsWith('/play/computer')) {
          return { mode: 'vs-computer' };
        }

        if (url.startsWith('/events/')) {
          const hasChessBoard = !!document.querySelector('[class*="board"]');

          if (hasChessBoard) {
            let timeControl = null;
            const glyphElem = document.querySelector('[data-glyph*="game-time-"]');
            if (glyphElem) {
              const glyph = glyphElem.getAttribute('data-glyph');
              if (glyph) {
                const match = glyph.match(/game-time-(\\w+)/);
                if (match) {
                  timeControl = match[1];
                }
              }
            }

            return {
              mode: 'spectating',
              timeControl,
              opponent: null,
              url: window.location.href
            };
          }
        }

        const isEndedGame = url.startsWith('/game/live/');
        const isActiveGame = url.startsWith('/game/') && /^\\/game\\/\\d+/.test(url) && !isEndedGame;

        if (isEndedGame || isActiveGame) {
          const hasResignButton = !!document.querySelector('[class*="resign"]');
          const hasDrawButton = !!document.querySelector('[class*="draw-button"]');
          const hasRematchButton = !!document.querySelector('[class*="rematch"]');
          const hasNewGameButton = !!document.querySelector('[class*="new-game"]');

          let mode = 'browsing';

          if (isEndedGame) {
            mode = 'analyzing';
          } else if (isActiveGame) {
            if (hasRematchButton || hasNewGameButton) {
              mode = 'analyzing';
            } else if (hasResignButton || hasDrawButton) {
              mode = 'playing';
            } else {
              mode = 'spectating';
            }
          }

          let timeControl = null;
          const glyphElem = document.querySelector('[data-glyph*="game-time-"]');
          if (glyphElem) {
            const glyph = glyphElem.getAttribute('data-glyph');
            if (glyph) {
              const match = glyph.match(/game-time-(\\w+)/);
              if (match) {
                timeControl = match[1];
              }
            }
          }

          let opponent = null;
          if (mode === 'playing') {
            const opponentElem = document.querySelector('[class*="player-component"]:not([class*="player-bottom"]) [class*="username"]');

            if (opponentElem) {
              const opponentName = opponentElem.textContent?.trim() || null;

              let opponentRating = null;
              const ratingElem = document.querySelector('[class*="player-component"]:not([class*="player-bottom"]) [class*="rating"], [class*="player-component"]:not([class*="player-bottom"]) [class*="player-rating"]');

              if (ratingElem) {
                opponentRating = ratingElem.textContent?.trim();

                if (opponentRating) {
                  opponentRating = opponentRating.replace(/[()]/g, '');
                }
              }

              if (opponentName) {
                opponent = opponentRating ? opponentName + ' (' + opponentRating + ')' : opponentName;
              }
            }
          }

          return {
            mode,
            timeControl,
            opponent,
            url: window.location.href
          };
        }

        return { mode: 'browsing' };
      })()
    `)

    return gameInfo
  } catch (err) {
    log.error('Failed to detect game state:', err)
    return { mode: 'browsing' }
  }
}

function parseGameMode(timeControl: string | undefined): string {
  if (!timeControl) return 'Chess'

  const lowerTime = timeControl.toLowerCase();
  if (lowerTime === 'bullet') return 'Bullet'
  if (lowerTime === 'blitz') return 'Blitz'
  if (lowerTime === 'rapid') return 'Rapid'
  if (lowerTime === 'classical' || lowerTime === 'classic') return 'Classical'
  if (lowerTime === 'daily') return 'Daily'

  const match = timeControl.match(/(\d+)/)
  if (!match) return 'Chess'

  const minutes = parseInt(match[1])

  if (minutes < 3) return 'Bullet'
  if (minutes < 10) return 'Blitz'
  if (minutes < 30) return 'Rapid'
  return 'Classical'
}

function updateActivity(gameInfo: GameInfo): void {
  if (!rpcClient || !isConnected) {
    return
  }

  try {
    let state = 'Browsing Chess.com'
    let details: string | undefined

    if (gameInfo.mode === 'playing') {
      const gameMode = parseGameMode(gameInfo.timeControl)
      state = `Playing ${gameMode}`
      if (gameInfo.opponent) {
        details = `vs ${gameInfo.opponent}`
      }
    } else if (gameInfo.mode === 'vs-computer') {
      state = 'Playing vs Computer'
    } else if (gameInfo.mode === 'spectating') {
      const gameMode = parseGameMode(gameInfo.timeControl)
      state = `Watching a ${gameMode} Game`
    } else if (gameInfo.mode === 'analyzing') {
      state = 'Analyzing a Game'
    } else if (gameInfo.mode === 'puzzle-rush') {
      state = 'Playing Puzzle Rush'
    } else if (gameInfo.mode === 'puzzle-battle') {
      state = 'Playing Puzzle Battle'
    } else if (gameInfo.mode === 'puzzles') {
      state = 'Solving Puzzles'
    } else if (gameInfo.mode === 'daily') {
      state = 'Solving Daily Puzzle'
    } else if (gameInfo.mode === 'practicing') {
      state = 'Practicing'
    }

    rpcClient.user?.setActivity({
      state,
      details,
      largeImageKey: 'chess_logo',
      largeImageText: 'Chess Desktop App',
      buttons: [
        { label: 'Get the App', url: 'https://chessdesktop.app' }
      ],
      instance: false,
      startTimestamp
    })
  } catch (err) {
    log.error('Failed to update Discord activity:', err)
  }
}

export function setActivity(): void {
  if (!rpcClient || !isConnected) {
    log.warn('Cannot set activity: RPC not connected')
    return
  }

  updateActivity({ mode: 'browsing' })
  startPolling()
}

export function clearActivity(): void {
  if (!rpcClient || !isConnected) return

  try {
    rpcClient.user?.clearActivity()
  } catch (err) {
    log.error('Failed to clear Discord activity:', err)
  }
}

function startPolling(): void {
  stopPolling()

  pollingInterval = setInterval(async () => {
    const gameInfo = await detectGameState()
    updateActivity(gameInfo)
  }, 1000)

  detectGameState().then(updateActivity)
}

function stopPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

export function setDiscordWebContents(contents: WebContents): void {
  webContents = contents
}
