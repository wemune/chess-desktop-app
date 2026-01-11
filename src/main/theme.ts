import { WebContents } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'
import log from 'electron-log'
import { THEMES, ThemeId, buildThemeCSS } from '../shared/themes'

function getThemeImageDataUri(themePath: string | null): string | null {
  if (!themePath) return null

  try {
    const resourcesPath = process.env.NODE_ENV === 'development'
      ? join(__dirname, '../../resources/themes')
      : join(process.resourcesPath, 'themes')

    const imagePath = join(resourcesPath, themePath)
    const imageBuffer = readFileSync(imagePath)
    const base64 = imageBuffer.toString('base64')
    const ext = themePath.split('.').pop()
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

    return `data:${mimeType};base64,${base64}`
  } catch (err) {
    log.error('Failed to load theme image:', themePath, err)
    return null
  }
}

export function applyTheme(webContents: WebContents, themeId: ThemeId): void {
  const theme = THEMES[themeId]
  if (!theme) {
    log.warn('Unknown theme:', themeId)
    return
  }

  const dataUri = getThemeImageDataUri(theme.backgroundImagePath)
  const cssCode = buildThemeCSS(dataUri)
  webContents.insertCSS(cssCode).catch((err) => {
    log.error('Failed to apply theme:', err)
  })
}
