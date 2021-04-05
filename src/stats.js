const { globalLog } = require('./logger');

const stats = {
  resourcesDownloaded: 0,
  sourceMapsFound: 0,
  filesRecovered: 0,
  outputDirectories: {},
  recoveredFilesExtensions: {}
};

const generateSummary = (completedStats) => {
  const s = completedStats;

  globalLog(
    `${s.sourceMapsFound} sourcemap file${s.sourceMapsFound !== 1 ? 's' : ''} found, ` +
    `${s.filesRecovered} file${s.filesRecovered !== 0 ? 's' : ''} unboxed.`
  );
};

module.exports = { generateSummary, stats };
