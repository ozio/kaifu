import { globalLog } from './logger.mjs'

const s = (num) => {
  if (num > 1) return 's'
  return ''
}

export const stats = {
  resourcesDownloaded: 0,
  sourceMapsFound: 0,
  filesRecovered: 0,
  outputDirectories: {},
  recoveredFilesExtensions: {},
}

export const generateSummary = (completedStats) => {
  const stats = completedStats
  const sMF = stats.sourceMapsFound
  const fR = stats.filesRecovered

  globalLog(`${sMF} sourcemap file${s(sMF)} found, ${fR} file${s(fR)} unboxed.`)
}
