import path from 'node:path'
import { readFile, mkdir, writeFile, unlink } from 'node:fs/promises'
import chalk from 'chalk'
import { SourceMapConsumer } from 'source-map'
import { tree } from './utils/tree.mjs'
import { Queue } from './utils/queue.mjs'
import { eventEmitter } from './eventemitter.mjs'
import { stats } from './stats.mjs'
import { createLogger, globalError, globalLog } from './logger.mjs'
import { options } from './options.mjs'

const { verboseLog, verboseError } = createLogger(chalk.green('unpack'))

const POSTFIX = '__unboxed'
export const unboxQueue = new Queue()

const fixSource = (source) => {
  if (source.startsWith('webpack:///')) {
    verboseLog('Source starts with wrong protocol (webpack:///). Fixing.')
    return source.slice(11)
  }

  return path.resolve('/', source).slice(1)
}

export const unpacker = async () => {
  if (unboxQueue.queue.length > 0) {
    globalLog('')
    globalLog('Unboxing resources:')
  }

  await unpackNextFile()
}

const unpackNextFile = async () => {
  const record = unboxQueue.next()

  if (!record) {
    eventEmitter.emit('unpack-queue-is-empty')
    return
  }

  const { filePath, outputDir, input } = record

  await unpack(filePath, outputDir, input)

  eventEmitter.emit('unpack-record-processed')
}

export const unpack = async (sourceMapPath, outputDir, input) => {
  const flags = options.flags
  const sourceMap = await readFile(sourceMapPath, 'utf-8')
  const sourceMapFileName = sourceMapPath.split('/').slice(-1).join('')

  let length = 0
  let extensions = {}
  let treeString = ''

  try {
    verboseLog(`Start unpacking SourceMap "${sourceMapPath}" (${sourceMap.length} bytes)`)
    await SourceMapConsumer.with(sourceMap, null, async (consumer) => {
      length = consumer.sources.length
      extensions = {}

      if (flags.short) {
        globalLog(` ▸ ${
          chalk.bold(sourceMapFileName)
        } → ${
          outputDir.replace(path.resolve(), '.')
        }${
          flags.merge ? '' : `/${sourceMapFileName}${POSTFIX}`
        } ${chalk.grey(`[${length} file${length > 1 ? 's' : ''}]`)}`)
      } else {
        globalLog()
        globalLog(` 📦 ${chalk.bold(input)}`)
      }

      for (const source of consumer.sources) {
        verboseLog(` ${source}`)

        const onlyFileName = source.split('/').slice(-1).join('')
        if (onlyFileName.includes('.')) {
          const ext = onlyFileName.split('.').slice(-1).join('')
          if (!stats.recoveredFilesExtensions[ext]) stats.recoveredFilesExtensions[ext] = 0
          stats.recoveredFilesExtensions[ext]++
          if (!extensions[ext]) extensions[ext] = 0
          extensions[ext]++
        } else {
          if (!stats.recoveredFilesExtensions['Not specified']) stats.recoveredFilesExtensions['Not specified'] = 0
          stats.recoveredFilesExtensions['Not specified']++
          if (!extensions['Not specified']) extensions['Not specified'] = 0
          extensions['Not specified']++
        }

        let sourceContent = consumer.sourceContentFor(source)

        if (sourceContent) {
          verboseLog(`Source (${sourceContent.length} bytes)`)
        }

        if (!flags.skipEmpty) sourceContent = sourceContent || ''

        const fixedSource = fixSource(source)
        const filePath = path.resolve(outputDir, flags.merge ? '' : `${sourceMapFileName}${POSTFIX}`, fixedSource)

        await mkdir(path.dirname(filePath), { recursive: true })
        await writeFile(filePath, sourceContent)

        stats.filesRecovered++

        treeString += `${filePath.replace(path.resolve(outputDir), '')}|${sourceContent ? sourceContent.length : 0}\n`

        verboseLog(filePath.replace(path.resolve(outputDir), ''))
      }
    })
  } catch (e) {
    globalError(`Invalid format. ${e.message}`)
    verboseError(`Error while unpacking "${sourceMapPath}": ${e.message}`)
  }

  if (!flags.short) {
    globalLog(tree(treeString))
  }

  try {
    await unlink(sourceMapPath)
  } catch (e) {
    globalLog(e.message)
  }
}

eventEmitter.on('unpack-record-processed', unpackNextFile)
