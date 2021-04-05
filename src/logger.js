const chalk = require('chalk');
const { name } = require('../package.json');

const loggerConfig = {
  verbose: false,
  quiet: false,
}

const verboseLog = (...messages) => {
  if (!loggerConfig.verbose) return;

  console.log(`${chalk.bold.bgBlackBright(name)}`, ...messages);
};

const verboseError = (...messages) => {
  if (!loggerConfig.verbose) return;

  console.log(`${chalk.blackBright.bold.bgRedBright(name)}`, ...messages);
};

const verboseWarning = (...messages) => {
  if (!loggerConfig.verbose) return;

  console.log(`${chalk.blackBright.bold.bgYellowBright(name)}`, ...messages);
};

const globalLog = (...messages) => {
  if (loggerConfig.quiet || loggerConfig.verbose) return;

  console.log(...messages);
};

const globalError = (...messages) => {
  if (loggerConfig.quiet || loggerConfig.verbose) return;

  console.error(chalk.red.bold('Error:'), ...messages);
};

const globalWarning = (...messages) => {
  if (loggerConfig.quiet || loggerConfig.verbose) return;

  console.warn(chalk.yellow.bold('Warning:'),...messages);
};

const createLogger = (module) => {
  return {
    verboseLog: (...messages) => verboseLog((module), ...messages),
    verboseError: (...messages) => verboseError((module), ...messages),
    verboseWarning: (...messages) => verboseWarning((module), ...messages),
  };
};

module.exports = {
  loggerConfig,
  createLogger,
  globalLog,
  globalError,
  globalWarning,
  verboseLog,
  verboseError,
  verboseWarning,
};
