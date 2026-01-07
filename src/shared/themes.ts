export interface Theme {
  id: string
  name: string
  backgroundImagePath: string | null
}

export const THEMES: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'Default',
    backgroundImagePath: null
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    backgroundImagePath: 'dark.png'
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson',
    backgroundImagePath: 'red.png'
  },
  nebula: {
    id: 'nebula',
    name: 'Nebula',
    backgroundImagePath: 'nebula.jpeg'
  }
}

export type ThemeId = keyof typeof THEMES

export function buildThemeCSS(dataUri: string | null): string {
  if (dataUri) {
    return `
      :root {
        --theme-background-override-image: url(${dataUri}) !important;
      }
    `
  }
  return `
    :root {
      --theme-background-override-image: none !important;
    }
  `
}
