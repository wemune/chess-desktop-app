export const IPC_CHANNELS = {
  WINDOW: {
    MINIMIZE: 'window:minimize',
    MAXIMIZE: 'window:maximize',
    CLOSE: 'window:close',
    IS_MAXIMIZED: 'window:is-maximized',
    MAXIMIZE_CHANGE: 'window:maximize-change'
  },
  SETTINGS: {
    GET: 'settings:get',
    SET: 'settings:set'
  },
  LOGS: {
    OPEN_FOLDER: 'logs:open-folder'
  },
  PLATFORM: {
    GET: 'platform:get'
  },
  APP: {
    RESTART: 'app:restart'
  },
  WEBVIEW: {
    GO_BACK: 'webview:go-back',
    GO_FORWARD: 'webview:go-forward',
    CAN_GO_BACK: 'webview:can-go-back',
    CAN_GO_FORWARD: 'webview:can-go-forward',
    RELOAD: 'webview:reload',
    ZOOM_IN: 'webview:zoom-in',
    ZOOM_OUT: 'webview:zoom-out',
    ZOOM_RESET: 'webview:zoom-reset',
    GET_ZOOM: 'webview:get-zoom',
    LOAD_START: 'webview:load-start',
    LOAD_STOP: 'webview:load-stop',
    LOAD_ERROR: 'webview:load-error',
    TRIGGER_BACK: 'webview:trigger-back',
    TRIGGER_FORWARD: 'webview:trigger-forward'
  },
  UPDATE: {
    AVAILABLE: 'update:available',
    DOWNLOAD_PROGRESS: 'update:download-progress',
    DOWNLOADED: 'update:downloaded',
    DOWNLOAD: 'update:download',
    INSTALL: 'update:install'
  }
} as const
