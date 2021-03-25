const path = require('path');
const { URL } = require('url');
const fs = require('fs');
const chalk = require('chalk');
const fetch = require('node-fetch');
const EventEmitter = require('events');
const { getAllSourceMapsFromText } = require('./utils/getAllSourceMapsFromText');
const { resolveURL } = require('./utils/resolveURL');
const { getAllResourcesFromHTML } = require('./utils/getAllResourcesFromHTML');
const { unpack } = require('./unpack');
const { generateRandomString } = require('./utils/generateRandomString');
const { createLogger } = require('./logger');
const radio = new EventEmitter();
const { log } = createLogger(chalk.blue('crawler'));

class Queue {
  locked = false;
  queue = [];

  add = (record) => {
    log('New record in queue', record);

    if (!this.queue.includes(record)) {
      this.queue.push(record);
      radio.emit('new-record')
    }
  }

  rollback = (record) => {
    log('Return record to queue', record);

    this.queue.unshift(record);
  }

  next = () => {
    log('Next record requested');

    if (this.queue.length === 0) {
      log('Records queue has finished');
    }

    return this.queue.shift();
  }
}

const queue = new Queue();

let currentFlags;

const downloadNextFile = async () => {
  const nextFileRecord = queue.next();

  if (!nextFileRecord) return;

  return await downloadAndProcess(nextFileRecord)
}

const downloadAndProcess = async (record) => {
  const { input, inputType, outputDir } = record;

  log('Is downloading locked now?', queue.locked);

  if (queue.locked) {
    queue.rollback(record);

    return;
  }

  log(`Starting download resource "${input} with type "${inputType}"`);

  queue.locked = true;

  const url = new URL(input);

  if (inputType === 'remote-sourcemap') {
    log('Creating request ...');
    const response = await fetch(input);
    log('Done! Parsing response ...');
    const text = await response.text();
    log('Done! Generating filename ...');
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

    log('Saving file ...');
    await fs.promises.writeFile(path.resolve(outputDir, filename), text, 'utf-8');
    log('File saved');

    await unpack(path.resolve(outputDir, filename), outputDir, currentFlags);
    await fs.promises.unlink(path.resolve(outputDir, filename));
  }

  if (inputType === 'remote-html') {
    log('Creating request ...');
    const response = await fetch(input);
    const html = await response.text();
    const resources = await getAllResourcesFromHTML(html);
    const sourceMaps = getAllSourceMapsFromText(html);

    resources.forEach(resource => {
      const newInput = resolveURL(input, resource);
      const inputType = 'remote-resource';

      queue.add({ input: newInput, inputType, outputDir });
    });

    sourceMaps.forEach(sourceMap => {
      const newInput = resolveURL(input, sourceMap);
      const inputType = 'remote-sourcemap';

      queue.add({ input: newInput, inputType, outputDir });
    });
  }

  if (inputType === 'remote-resource') {
    log('Creating request ...');
    const response = await fetch(input);
    const html = await response.text();
    const sourceMaps = getAllSourceMapsFromText(html);

    sourceMaps.forEach(sourceMap => {
      const newInput = resolveURL(input, sourceMap);
      const inputType = 'remote-sourcemap';

      queue.add({ input: newInput, inputType, outputDir });
    });
  }

  queue.locked = false;
  radio.emit('record-processed');
}

const crawler = async (input, inputType, outputDir, flags) => {
  currentFlags = flags;

  queue.add({ input, inputType, outputDir });
};

radio.on('record-processed', () => log('event handled: "record-processed"'));
radio.on('record-processed', downloadNextFile);
radio.on('new-record', () => log('event handled: "new-record"'));
radio.on('new-record', downloadNextFile);

module.exports = { crawler };
