const chalk = require('chalk');

const loggerConfig = {
  verbose: false,
  silent: false,
}

const log = (...messages) => {
  if (!loggerConfig.verbose) return;

  console.log(`[${chalk.cyan.bold('kaifu')}]`, ...messages);
};

const err = (...messages) => {
  if (!loggerConfig.verbose) return;

  console.log(`[${chalk.red.bold('kaifu')}]`, ...messages);
};

const warn = (...messages) => {
  if (!loggerConfig.verbose) return;

  console.log(`[${chalk.yellow.bold('kaifu')}]`, ...messages);
};

const globalLog = (...messages) => {
  if (loggerConfig.silent) return;

  console.log(...messages);
};

const globalError = (...messages) => {
  if (loggerConfig.silent) return;

  console.error(chalk.red.bold('Error:'), ...messages);
};

const globalWarning = (...messages) => {
  if (loggerConfig.silent) return;

  console.warn(chalk.yellow.bold('Warning:'),...messages);
};

const createLogger = (module, verboseOnly = false) => {
  return {
    log: (...messages) => log(`[${module}]`, ...messages),
    err: (...messages) => err(`[${module}]`, ...messages),
    warn: (...messages) => warn(`[${module}]`, ...messages),
  };
};

module.exports = { loggerConfig, createLogger, globalLog, globalError, globalWarning, log, err, warn };
