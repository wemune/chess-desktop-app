import { ThemeId } from './themes'

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
  hideRatings: boolean
}
