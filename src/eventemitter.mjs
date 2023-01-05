import EventEmitter from 'node:events'

// Events
// - crawler-queue-is-empty
// - crawler-record-processed
// - new-crawler-record
// - unpack-queue-is-empty
// - unpack-record-processed

export const eventEmitter = new EventEmitter();
