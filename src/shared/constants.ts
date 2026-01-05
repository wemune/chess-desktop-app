export const ZOOM_PERCENTAGES = [33, 50, 67, 75, 90, 100, 110, 125, 150, 175, 200, 225, 250] as const

export const ZOOM_DEFAULT_INDEX = ZOOM_PERCENTAGES.indexOf(100)

export function percentageToZoomLevel(percentage: number): number {
  return Math.log(percentage / 100) / Math.log(1.2)
}

export function zoomLevelToPercentage(zoomLevel: number): number {
  return Math.round((1.2 ** zoomLevel) * 100)
}

export function getClosestZoomIndex(currentZoomLevel: number): number {
  const currentPercentage = zoomLevelToPercentage(currentZoomLevel)
  let closestIndex = 0
  let minDiff = Math.abs(ZOOM_PERCENTAGES[0] - currentPercentage)

  for (let i = 1; i < ZOOM_PERCENTAGES.length; i++) {
    const diff = Math.abs(ZOOM_PERCENTAGES[i] - currentPercentage)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = i
    }
  }

  return closestIndex
}
