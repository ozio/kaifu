const chalk = require('chalk');
const { name } = require('../package.json');

const loggerConfig = {
  verbose: false,
  silent: false,
}

const log = (...messages) => {
  if (!loggerConfig.verbose) return;

  console.log(`${chalk.bold.bgBlackBright(name)}`, ...messages);
};

const err = (...messages) => {
  if (!loggerConfig.verbose) return;

  console.log(`${chalk.blackBright.bold.bgRedBright(name)}`, ...messages);
};

const warn = (...messages) => {
  if (!loggerConfig.verbose) return;

  console.log(`${chalk.blackBright.bold.bgYellowBright(name)}`, ...messages);
};

const globalLog = (...messages) => {
  if (loggerConfig.silent || loggerConfig.verbose === true) return;

  console.log(...messages);
};

const globalError = (...messages) => {
  if (loggerConfig.silent || loggerConfig.verbose === true) return;

  console.error(chalk.red.bold('Error:'), ...messages);
};

const globalWarning = (...messages) => {
  if (loggerConfig.silent || loggerConfig.verbose === true) return;

  console.warn(chalk.yellow.bold('Warning:'),...messages);
};

const createLogger = (module) => {
  return {
    log: (...messages) => log((module), ...messages),
    err: (...messages) => err((module), ...messages),
    warn: (...messages) => warn((module), ...messages),
  };
};

module.exports = { loggerConfig, createLogger, globalLog, globalError, globalWarning, log, err, warn };
