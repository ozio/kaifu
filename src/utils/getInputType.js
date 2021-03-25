const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { getFirstLine } = require('./getFirstLine');

const getInputType = async (input) => {
  try {
    const url = new URL(input);

    if (!['http:', 'https:'].includes(url.protocol)) {
      console.log(`Input '${input}' using unsupported protocol: '${url.protocol}'`)
    }

    if (url.pathname.endsWith('.map')) {
      return 'remote-sourcemap';
    }

    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
      return 'remote-resource';
    }

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
