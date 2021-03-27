const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { globalError } = require('../logger');
const { getFirstLine } = require('./getFirstLine');

const getInputURLType = (input) => {
  const url = new URL(input);

  const { protocol, pathname } = url;

  if (!['http:', 'https:'].includes(protocol)) {
    return 'skip';
  }

  if (pathname.endsWith('.map')) {
    return 'remote-sourcemap';
  }

  if (pathname.endsWith('.js') || pathname.endsWith('.css')) {
    return 'remote-resource';
  }

  if (pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.ico')) {
    return 'skip';
  }

  return 'remote-html';
};

const getInputType = async (input) => {
  try {
    return getInputURLType(input);
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
    globalError('Invalid input');
    throw e;
  }
};

module.exports = { getInputType, getInputURLType };
