import Store from 'electron-store'

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
}

const defaults: StoreSchema = {
  window: {
    width: 1280,
    height: 800,
    isMaximized: false
  },
  zoomLevel: 0
}

export const store = new Store<StoreSchema>({ defaults })
