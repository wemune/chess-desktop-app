import Store from 'electron-store'
import { StoreSchema } from '../shared/store'

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
  discordRpcEnabled: true,
  hideRatings: false
}

export const store = new Store<StoreSchema>({ defaults })
