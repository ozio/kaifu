const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { globalLog } = require('../logger');
const { getFirstLine } = require('./getFirstLine');

const getInputType = async (input) => {
  try {
    const url = new URL(input);

    const { protocol, pathname } = url;

    if (!['http:', 'https:'].includes(protocol)) {
      globalLog(`Input '${input}' using unsupported protocol: '${protocol}'`)
    }

    if (pathname.endsWith('.map')) {
      return 'remote-sourcemap';
    }

    if (pathname.endsWith('.js') || pathname.endsWith('.css')) {
      return 'remote-resource';
    }

    // if (pathname.endsWith('.png') || pathname.endsWith('')) {}

    return 'remote-html';
  } catch (e) {}

  try {
    const res = await fs.promises.lstat(path.resolve(input));

    if (res.isDirectory()) {
      return 'directory';
    }

    if (res.isFile()) {
      if (input.endsWith('.map')) {
        return 'local-sourcemap';
      }

      try {
        const firstLine = await getFirstLine(path.resolve(input));

        if (firstLine.trim() === '') {
          throw new Error(`Unknown file format: ${path.resolve(input)}`);
        }

        await getInputType(firstLine);

        return 'list-or-inputs';
      } catch (e) {
        throw e;
      }
    }
  } catch (e) {
    throw e;
  }
};

module.exports = { getInputType };
