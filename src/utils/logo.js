const chalk = require('chalk');
const { version } = require('../../package.json');

const logo = chalk.bold(
  chalk.yellow(`Kaifū`) + ` v${version}`
);

module.exports = { logo };
