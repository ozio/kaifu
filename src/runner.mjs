import path from 'node:path'
import fs from 'node:fs'
import { access, readdir, readFile } from 'node:fs/promises'
import chalk from 'chalk'
import { createLogger, globalLog } from './logger.mjs'
import { options } from './options.mjs'
import { stats } from './stats.mjs'
import { crawler } from './crawler.mjs'
import { generateOutputDirName } from './utils/generateOutputDirName.mjs'
import { detectInputType } from './utils/detectInputType.mjs'
import { unpack } from './unpack.mjs'

const { verboseLog } = createLogger(chalk.yellow('runner'))
const { flags } = options

export const runner = async (input) => {
  let inputType

  try {
    inputType = await detectInputType(input)
  } catch (e) {
    globalLog(`Error detecting input type: ${e.message}`)
    return
  }

  const outputDir = path.resolve(flags.outputDir || generateOutputDirName(input, inputType))

  stats.outputDirectories[outputDir] = true

  verboseLog('Input type detected:', inputType)
  verboseLog('Output directory generated:', outputDir)

  try {
    await access(outputDir, fs.F_OK)
    if (!flags.overwrite) {
      throw new Error(`Directory or file '${outputDir}' already exists`)
    }
    verboseLog('Directory or file already exists, but proceeding due to --overwrite flag')
  } catch (e) {
    if (e.code !== 'ENOENT') {
      globalLog(`Error accessing output directory: ${e.message}`)
      return
    }
  }

  switch (inputType) {
    case 'local-sourcemap':
      verboseLog(`Processing local sourcemap input: "${input}"`)
      await unpack(input, outputDir)
      break

    case 'directory':
      verboseLog(`Processing directory input: "${input}"`)
      const files = await readdir(input)
      for await (const file of files) {
        if (file.endsWith('.map')) {
          verboseLog(`Unpacking file: ${file}`)
          await unpack(path.resolve(input, file), outputDir)
        } else {
          verboseLog(`Skipping file: ${file} (not a SourceMap)`)
        }
      }
      break

    case 'list-or-inputs':
      verboseLog(`Processing list of inputs from file: "${input}"`)
      const fileContent = await readFile(input, 'utf-8')
      const newInputs = fileContent.split('\n')
        .map(s => s.trim())
      verboseLog(`${newInputs.length} input(s) found`)
      for (const newInput of newInputs) {
        verboseLog(`Starting runner for input: "${newInput}"`)
        await runner(newInput)
      }
      break

    case 'remote-sourcemap':
    case 'remote-resource':
    case 'remote-html':
      verboseLog(`Processing remote input: "${input}" (type: "${inputType}")`)
      await crawler(input, inputType, outputDir)
      break

    default:
      globalLog(`Unknown input type: "${inputType}". Skipping processing.`)
      break
  }
}
