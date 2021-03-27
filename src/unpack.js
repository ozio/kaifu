const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { tree } = require('./utils/tree');
const { eventEmitter } = require('./eventemitter');
const { stats } = require('./stats');
const { globalLog } = require('./logger');
const { globalError } = require('./logger');
const { SourceMapConsumer } = require('source-map');
const { createLogger } = require('./logger');
const { log, err } = createLogger(chalk.green('unpack'));

class UnboxQueue {
  constructor() {
    this.queue = [];
  }

  add(record) {
    this.queue.push(record);
  }

  next() {
    return this.queue.shift();
  }
}

const unboxQueue = new UnboxQueue();

const fixSource = (source) => {
  if (source.startsWith('webpack:///')) {
    log('Source starts with wrong protocol (webpack:///). Fixing.')
    return source.slice(11);
  }

  return path.resolve('/', source).slice(1);
};

const unpacker = async () => {
  await unpackNextFile();
}

const unpackNextFile = async () => {
  const record = unboxQueue.next();

  if (!record) {
    eventEmitter.emit('unpack-queue-is-empty')
    return;
  }

  const {filePath, outputDir, flags, input} = record;

  await unpack(filePath, outputDir, flags, input);

  eventEmitter.emit('unpack-record-processed');
};

const unpack = async (sourceMapPath, outputDir, flags, input) => {
  const sourceMap = await fs.promises.readFile(sourceMapPath, 'utf-8');

  if (flags.short) {
    globalLog(` ▸ ${chalk.bold(input)}`);
  } else {
    globalLog();
    globalLog(` 📦 ${chalk.bold(input)}`);
  }

  let length = 0;
  let extensions = {};
  let treeString = '';

  try {
    log(`Start unpacking SourceMap "${sourceMapPath}" (${sourceMap.length} bytes)`)
    await SourceMapConsumer.with(sourceMap, null, async (consumer) => {
      length = consumer.sources.length;
      extensions = {};

      for (const source of consumer.sources) {
        log(` ${source}`);

        const onlyFileName = source.split('/').slice(-1).join('');
        if (onlyFileName.includes('.')) {
          const ext = onlyFileName.split('.').slice(-1).join('');
          if (!stats.recoveredFilesExtensions[ext]) stats.recoveredFilesExtensions[ext] = 0;
          stats.recoveredFilesExtensions[ext]++;
          if (!extensions[ext]) extensions[ext] = 0;
          extensions[ext]++;
        } else {
          if (!stats.recoveredFilesExtensions['Not specified']) stats.recoveredFilesExtensions['Not specified'] = 0;
          stats.recoveredFilesExtensions['Not specified']++;
          if (!extensions['Not specified']) extensions['Not specified'] = 0;
          extensions['Not specified']++;
        }

        let sourceContent = consumer.sourceContentFor(source);

        if (sourceContent) {
          log(`Source (${sourceContent.length} bytes)`);
        }

        if (!flags.skipEmpty) sourceContent = sourceContent || '';

        const fixedSource = fixSource(source);

        const filePath = path.resolve(outputDir, fixedSource);

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
        await fs.promises.writeFile(filePath, sourceContent);

        stats.filesRecovered++;

        treeString += `${filePath.replace(path.resolve(outputDir), '')}|${sourceContent ? sourceContent.length : 0}\n`;

        log(filePath.replace(path.resolve(outputDir), ''));
      }
    });
  } catch (e) {
    globalError(`Invalid format. ${e.message}`)
    err(`Error while unpacking "${sourceMapPath}": ${e.message}`)
  }

  if (!flags.short) {
    globalLog(tree(treeString));
  }

  try {
    await fs.promises.unlink(sourceMapPath);
  } catch (e) {
    globalLog(e.message)
  }
};

eventEmitter.on('unpack-record-processed', unpackNextFile);

module.exports = { unpack, unboxQueue, unpacker };
