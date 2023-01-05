import path from 'node:path'
import fs from 'node:fs'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { URL } from 'node:url'
import chalk from 'chalk'
import { stats } from './stats.mjs'
import { createLogger, globalLog } from './logger.mjs'
import { unboxQueue } from './unpack.mjs'
import { detectInputURLType } from './utils/detectInputType.mjs'
import { eventEmitter } from './eventemitter.mjs'
import { client } from './client.mjs'
import { getAllSourceMapsFromText } from './utils/getAllSourceMapsFromText.mjs'
import { resolveURL } from './utils/resolveURL.mjs'
import { getAllResourcesFromHTML } from './utils/getAllResourcesFromHTML.mjs'
import { generateRandomString } from './utils/generateRandomString.mjs'
import { Queue } from './utils/queue.mjs'
import { options } from './options.mjs'

const { verboseLog } = createLogger(chalk.blue('crawler'))

const { flags } = options

const downloadQueue = new Queue(record => record.input)
downloadQueue.on('new-record', () => eventEmitter.emit('new-crawler-record'))

const downloadNextFile = async () => {
  const nextFileRecord = downloadQueue.next()

  if (nextFileRecord) return await downloadAndProcess(nextFileRecord)

  verboseLog('Records queue has ended')
  eventEmitter.emit('crawler-queue-is-empty')
}

const downloadAndProcess = async (record) => {
  const { input, outputDir } = record

  let inputType = record.inputType

  verboseLog('Is downloading locked now?', downloadQueue.locked)

  if (downloadQueue.locked) {
    downloadQueue.rollback(record)

    return
  }

  verboseLog(`Starting download resource "${input}" with type "${inputType}"`)

  downloadQueue.locked = true

  const url = new URL(input)

  let response

  try {
    verboseLog('Making request ...')
    const isSourceMap = input.endsWith('.map')

    if (isSourceMap) {
      globalLog(chalk.bold(` ▸ ${url}`))
      stats.sourceMapsFound++
    } else {
      globalLog(chalk.dim(` ▸ ${url}`))
      stats.resourcesDownloaded++
    }

    response = await client(input)
  } catch (e) {
    inputType = 'skip'
    console.log(e)
  }

  if (inputType === 'remote-sourcemap') {
    verboseLog('Parsing response ...')
    const text = await response.text()
    verboseLog('Generating filename ...')
    let filename = `sourcemap.${generateRandomString()}.map`

    try {
      filename = url.pathname.split('/').slice(-1)[0]
    } catch (e) {}

    try {
      await access(path.resolve(outputDir, filename), fs.F_OK)
      const parts = filename.split('.')
      filename = `${parts.slice(0, -2).join('.')}.${generateRandomString()}.${parts.slice(-2).join('.')}`
    } catch (e) {}

    verboseLog(`Filename will be ${filename}`)

    try {
      await access(outputDir, fs.F_OK)
    } catch (e) {
      verboseLog(`Directory ${outputDir} doesn't exist. Creating ...`)
      await mkdir(outputDir)
    }

    verboseLog('Saving file ...')
    await writeFile(path.resolve(outputDir, filename), text, 'utf-8')
    verboseLog('File saved')

    const filePath = path.resolve(outputDir, filename)

    unboxQueue.add({ filePath, outputDir, input })
  }

  if (inputType === 'remote-html') {
    const html = await response.text()
    const resources = await getAllResourcesFromHTML(html)
    const sourceMaps = getAllSourceMapsFromText(html)

    resources.forEach(resource => {
      const newInput = resolveURL(input, resource)
      const inputType = detectInputURLType(newInput)

      if (newInput.startsWith('http:') || newInput.startsWith('https:')) {
        if (inputType === 'skip') return

        downloadQueue.add({ input: newInput, inputType, outputDir })
      }
    })

    sourceMaps.forEach(sourceMap => {
      const newInput = resolveURL(input, sourceMap)
      const inputType = 'remote-sourcemap'

      downloadQueue.add({ input: newInput, inputType, outputDir })
    })
  }

  if (inputType === 'remote-resource') {
    const html = await response.text()
    const sourceMaps = getAllSourceMapsFromText(html)

    sourceMaps.forEach(sourceMap => {
      const newInput = resolveURL(input, sourceMap)
      const inputType = 'remote-sourcemap'

      downloadQueue.add({ input: newInput, inputType, outputDir })
    })
  }

  downloadQueue.locked = false
  eventEmitter.emit('crawler-record-processed')
}

export const crawler = async (input, inputType, outputDir) => {
  globalLog('Loading resources:')
  !flags.short && globalLog()

  downloadQueue.add({ input, inputType, outputDir })
}

eventEmitter.on('crawler-record-processed', downloadNextFile)
eventEmitter.on('new-crawler-record', downloadNextFile)
