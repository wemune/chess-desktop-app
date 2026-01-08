import Store from 'electron-store'
import { ThemeId } from '../shared/themes'

export interface WindowConfig {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized: boolean
}

export interface StoreSchema {
  window: WindowConfig
  zoomLevel: number
  notificationsEnabled: boolean
  chatEnabled: boolean
  alwaysOnTop: boolean
  hardwareAcceleration: boolean
  soundMuted: boolean
  theme: ThemeId
  discordRpcEnabled: boolean
}

const defaults: StoreSchema = {
  window: {
    width: 1280,
    height: 800,
    isMaximized: false
  },
  zoomLevel: 0,
  notificationsEnabled: true,
  chatEnabled: true,
  alwaysOnTop: false,
  hardwareAcceleration: true,
  soundMuted: false,
  theme: 'default',
  discordRpcEnabled: true
}

export const store = new Store<StoreSchema>({ defaults })
