const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

// Events
// - crawler-queue-is-empty
// - crawler-record-processed
// - new-crawler-record
// - unpack-queue-is-empty
// - unpack-record-processed

module.exports = { eventEmitter };
