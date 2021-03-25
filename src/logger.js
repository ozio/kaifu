const chalk = require('chalk');

const loggerConfig = {
  verbose: false,
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

const createLogger = (module) => {
  return {
    log: (...messages) => log(`[${module}]`, ...messages),
    err: (...messages) => err(`[${module}]`, ...messages),
    warn: (...messages) => warn(`[${module}]`, ...messages),
  };
};

module.exports = { loggerConfig, createLogger, log, err, warn };
