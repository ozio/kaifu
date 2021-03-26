const chalk = require('chalk');
const fetch = require('node-fetch');
const { globalLog, globalWarning, createLogger } = require('./logger');
const { log, err } = createLogger(chalk.magenta('client'))

const wrap = (flag, text) => {
  return flag ? chalk.bold(text) : chalk.grey(text);
}

const client = async (url) => {
  const isSourceMap = url.endsWith('.map');

  try {
    globalLog(wrap(isSourceMap, `┌ ${url}`));
    log(`-> GET ${url}`);
    const response = await fetch(url);
    const contentLength = response.headers.get('content-length');
    globalLog(wrap(isSourceMap, `└ ${response.status} ${typeof contentLength === 'string' ? `[${contentLength} bytes]` : ''}`));
    log(`<- ${chalk.green(response.status)} -- ${response.headers.get('content-length')}`);
    return response;
  } catch (e) {
    globalLog(chalk.red(`└ ${e.message}`));
    err(`<- ${e.errno} ${e.response ? e.response.status : e.message}`);

    if (e.errno === 'SELF_SIGNED_CERT_IN_CHAIN') {
      globalWarning('You can use environment variable NODE_TLS_REJECT_UNAUTHORIZED=0 as a fast, but very unsecure, fix.')
    }

    throw e;
  }
};

module.exports = { client };
