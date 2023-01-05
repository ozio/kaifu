import EventEmitter from 'node:events'

export class Queue extends EventEmitter {
  constructor(getCacheKey) {
    super()

    this.getCacheKey = getCacheKey

    this.locked = false
    this.queue = []
    this.cache = {}
  }

  add(record) {
    if (this.getCacheKey) {
      const cacheKey = this.getCacheKey(record)

      if (this.cache[cacheKey]) {
        return
      }

      this.cache[cacheKey] = true
    }

    this.queue.push(record)
    this.emit('new-record', record)
  }

  rollback(record) {
    this.queue.unshift(record)
    this.emit('rollback-record', record)
  }

  next() {
    const record = this.queue.shift()
    this.emit('request-next-record', record)

    return record
  }
}
