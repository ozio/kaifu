const chalk = require('chalk');
const { version } = require('../../package.json');

const logo = chalk.bold(
  `█▄▀ ▄▀█ █ █▀▀ █░█\n` +
  `█░█ █▀█ █ █▀░ █▄█ v${version}`
);

module.exports = { logo };
