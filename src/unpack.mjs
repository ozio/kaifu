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
    verboseLog('Fixing incorrect protocol (webpack:///).')
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
  const sourceMapFileName = path.basename(sourceMapPath)

  let length = 0
  let extensions = {}
  let treeString = ''

  try {
    verboseLog(`Unpacking SourceMap "${sourceMapPath}" (${sourceMap.length} bytes)`)
    await SourceMapConsumer.with(sourceMap, null, async (consumer) => {
      length = consumer.sources.length

      if (flags.short) {
        globalLog(` ▸ ${chalk.bold(sourceMapFileName)} → ${outputDir.replace(path.resolve(), '.')}${flags.merge
          ? ''
          : `/${sourceMapFileName}${POSTFIX}`} ${chalk.grey(`[${length} file${length > 1 ? 's' : ''}]`)}`)
      } else {
        globalLog()
        globalLog(` 📦 ${chalk.bold(input)}`)
      }

      for (const source of consumer.sources) {
        verboseLog(`Processing source: ${source}`)

        const onlyFileName = path.basename(source)
        const ext = path.extname(onlyFileName)
          .slice(1) || 'Not specified'

        stats.recoveredFilesExtensions[ext] = (stats.recoveredFilesExtensions[ext] || 0) + 1
        extensions[ext] = (extensions[ext] || 0) + 1

        let sourceContent = consumer.sourceContentFor(source)
        sourceContent = flags.skipEmpty ? sourceContent : sourceContent || ''

        if (sourceContent) {
          verboseLog(`Source content size: ${sourceContent.length} bytes`)
        }

        const fixedSource = fixSource(source)
        const filePath = path.resolve(outputDir, flags.merge ? '' : `${sourceMapFileName}${POSTFIX}`, fixedSource)

        await mkdir(path.dirname(filePath), { recursive: true })
        await writeFile(filePath, sourceContent)

        stats.filesRecovered++

        treeString += `${filePath.replace(path.resolve(outputDir), '')}|${sourceContent ? sourceContent.length : 0}\n`

        verboseLog(`File saved: ${filePath.replace(path.resolve(outputDir), '')}`)
      }
    })
  } catch (e) {
    globalError(`Failed to unpack. Error: ${e.message}`)
    verboseError(`Error while unpacking "${sourceMapPath}": ${e.message}`)
  }

  if (!flags.short) {
    globalLog(tree(treeString))
  }

  try {
    await unlink(sourceMapPath)
  } catch (e) {
    globalLog(`Error removing source map file: ${e.message}`)
  }
}

eventEmitter.on('unpack-record-processed', unpackNextFile)
