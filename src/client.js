const chalk = require('chalk');
const fetch = require('node-fetch');
const { globalWarning, globalError, createLogger } = require('./logger');
const { log, err } = createLogger(chalk.magenta('client'))

const client = async (url) => {
  try {
    log(`Request ${url}`);
    const response = await fetch(url);
    log(`Response ${chalk.green(response.status)}, size: ${response.headers.get('content-length')}`);

    if (response.status >= 400) {
      globalError(`Request failed (${response.status})`);
    }

    return response;
  } catch (e) {
    err(`Request failed: ${e.errno}, ${e.response ? e.response.status : e.message}`);

    if (e.errno === 'SELF_SIGNED_CERT_IN_CHAIN') {
      globalWarning('You can use environment variable NODE_TLS_REJECT_UNAUTHORIZED=0 as a fast, but very unsecure, fix.')
    }

    throw e;
  }
};

module.exports = { client };
