const path = require('path');
const { URL } = require('url');
const fs = require('fs');
const chalk = require('chalk');
const { stats } = require('./stats');
const { globalLog, createLogger } = require('./logger');
const { unboxQueue } = require('./unpack');
const { getInputURLType } = require('./utils/getInputType');
const { eventEmitter } = require('./eventemitter');
const { client } = require('./client');
const { getAllSourceMapsFromText } = require('./utils/getAllSourceMapsFromText');
const { resolveURL } = require('./utils/resolveURL');
const { getAllResourcesFromHTML } = require('./utils/getAllResourcesFromHTML');
const { generateRandomString } = require('./utils/generateRandomString');
const { log } = createLogger(chalk.blue('crawler'));

class DownloadQueue {
  constructor() {
    this.locked = false;
    this.queue = [];
    this.cache = {};
  }

  add(record) {
    log('New record in the queue', record);

    if (record.inputType === 'skip') {
      log('File skipped for some reason:', record.inputType, record.input)
      return;
    }

    if (this.cache[record.input]) return;
    this.cache[record.input] = true;

    if (!this.queue.some(r => r.input === record.input)) {
      this.queue.push(record);
      eventEmitter.emit('new-crawler-record');
    }
  }

  rollback(record) {
    log('Return record to the queue', record);

    this.queue.unshift(record);
  }

  next() {
    log('Next record requested');

    return this.queue.shift();
  }
}

const downloadQueue = new DownloadQueue();

let currentFlags;

const downloadNextFile = async () => {
  const nextFileRecord = downloadQueue.next();

  if (!nextFileRecord) {
    log('Records queue has ended');
    eventEmitter.emit('crawler-queue-is-empty');
    return;
  }

  return await downloadAndProcess(nextFileRecord)
}

const downloadAndProcess = async (record) => {
  const { input, outputDir } = record;

  let inputType = record.inputType;

  log('Is downloading locked now?', downloadQueue.locked);

  if (downloadQueue.locked) {
    downloadQueue.rollback(record);

    return;
  }

  log(`Starting download resource "${input} with type "${inputType}"`);

  downloadQueue.locked = true;

  const url = new URL(input);

  let response;

  try {
    log('Making request ...');
    const isSourceMap = input.endsWith('.map');

    if (isSourceMap) {
      globalLog(chalk.bold(` ▸ ${url}`));
      stats.sourceMapsFound++;
    } else {
      !currentFlags.short && globalLog(chalk.gray(` ▸ ${url}`));
      stats.resourcesDownloaded++;
    }

    response = await client(input);
  } catch (e) {
    inputType = 'skip';
    // globalLog(chalk.red(` ▸ ${e.message}`));
  }

  if (inputType === 'remote-sourcemap') {
    log('Parsing response ...');
    const text = await response.text();
    log('Generating filename ...');
    let filename = `sourcemap.${generateRandomString()}.map`;

    try {
      filename = url.pathname.split('/').slice(-1)[0];
    } catch (e) {}

    try {
      await fs.promises.lstat(path.resolve(outputDir, filename));
      const parts = filename.split('.');
      filename = `${parts.slice(0, -2).join('.')}.${generateRandomString()}.${parts.slice(-2).join('.')}`;
    } catch (e) {}

    log(`Done! Filename will be ${filename}`);

    try {
      await fs.promises.lstat(outputDir);
    } catch (e) {
      log(`Directory ${outputDir} doesn't exist. Creating ...`);
      await fs.promises.mkdir(outputDir);
    }

    log('Saving file ...');
    await fs.promises.writeFile(path.resolve(outputDir, filename), text, 'utf-8');
    log('File saved');

    unboxQueue.add({
      filePath: path.resolve(outputDir, filename),
      flags: currentFlags,
      outputDir,
      input,
    });
  }

  if (inputType === 'remote-html') {
    const html = await response.text();
    const resources = await getAllResourcesFromHTML(html);
    const sourceMaps = getAllSourceMapsFromText(html);

    resources.forEach(resource => {
      const newInput = resolveURL(input, resource);
      const inputType = getInputURLType(newInput);

      if (newInput.startsWith('http:') || newInput.startsWith('https:')) {
        downloadQueue.add({ input: newInput, inputType, outputDir });
      }
    });

    sourceMaps.forEach(sourceMap => {
      const newInput = resolveURL(input, sourceMap);
      const inputType = 'remote-sourcemap';

      downloadQueue.add({ input: newInput, inputType, outputDir });
    });
  }

  if (inputType === 'remote-resource') {
    const html = await response.text();
    const sourceMaps = getAllSourceMapsFromText(html);

    sourceMaps.forEach(sourceMap => {
      const newInput = resolveURL(input, sourceMap);
      const inputType = 'remote-sourcemap';

      downloadQueue.add({ input: newInput, inputType, outputDir });
    });
  }

  downloadQueue.locked = false;
  eventEmitter.emit('crawler-record-processed');
}

const crawler = async (input, inputType, outputDir, flags) => {
  currentFlags = flags;

  downloadQueue.add({ input, inputType, outputDir });
};

eventEmitter.on('crawler-record-processed', downloadNextFile);
eventEmitter.on('new-crawler-record', downloadNextFile);

module.exports = { crawler };
