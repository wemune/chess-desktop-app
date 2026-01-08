import { Client } from '@xhayper/discord-rpc'
import log from 'electron-log'

const CLIENT_ID = '1458615395249291305'

let rpcClient: Client | null = null
let isConnected = false

export async function initializeDiscordRPC(): Promise<void> {
  if (rpcClient) {
    log.info('Discord RPC already initialized')
    return
  }

  try {
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
    rpcClient.destroy()
    log.info('Discord RPC destroyed')
  } catch (err) {
    log.error('Failed to destroy Discord RPC:', err)
  } finally {
    rpcClient = null
    isConnected = false
  }
}

export function setActivity(): void {
  if (!rpcClient || !isConnected) {
    log.warn('Cannot set activity: RPC not connected')
    return
  }

  try {
    rpcClient.user?.setActivity({
      state: 'On Chess.com',
      largeImageKey: 'chess_logo',
      largeImageText: 'Chess Desktop App',
      buttons: [
        { label: 'Get the App', url: 'https://chessdesktop.app' }
      ],
      instance: false,
      startTimestamp: Date.now()
    })
  } catch (err) {
    log.error('Failed to set Discord activity:', err)
  }
}

export function clearActivity(): void {
  if (!rpcClient || !isConnected) return

  try {
    rpcClient.user?.clearActivity()
  } catch (err) {
    log.error('Failed to clear Discord activity:', err)
  }
}
