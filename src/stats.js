const { globalLog } = require('./logger');

const stats = {
  resourcesDownloaded: 0,
  sourceMapsFound: 0,
  filesRecovered: 0,
  outputDirectories: {},
  recoveredFilesExtensions: {}
};

const plural = (number, one) => {
  if (number === 1) return one;

  return one + 's';
}

const generateSummary = (completedStats) => {
  const s = completedStats;

  globalLog(
    `${s.sourceMapsFound} sourcemap ${plural(s.sourceMapsFound, 'file')} found, ` +
    `${s.filesRecovered} ${plural(s.filesRecovered, 'file')} unboxed.`
  );
};

module.exports = { generateSummary, stats };
