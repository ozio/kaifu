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
    globalLog(e.message)
    return
  }

  const outputDir = path.resolve(flags.outputDir || generateOutputDirName(input, inputType))

  stats.outputDirectories[outputDir] = true

  verboseLog('Input type detected:', inputType)
  verboseLog('Output dir generated:', outputDir)

  try {
    await access(outputDir, fs.F_OK)
    if (!flags.overwrite) {
      // TODO: throw caught locally, something is wrong here
      throw new Error(`Directory or file '${outputDir}' already exist`)
    }
    verboseLog('Directory or file already exist, but passed following --overwrite/-w flag')
  } catch (e) {}

  switch (inputType) {
    case 'local-sourcemap':
      verboseLog(`Input "${input}" typed as "${inputType}" going to be unpacked`)
      await unpack(input, outputDir)

      break

    case 'directory':
      verboseLog(`Input "${input}" typed as "${inputType}" reading directory`)
      const files = await readdir(input)

      for await (const file of files) {
        if (file.endsWith('.map')) {
          verboseLog(`File ${file} will be unpacked`)
          await unpack(path.resolve(input, file), outputDir)
        } else {
          verboseLog(`File ${file} will not be unpacked, because it is not a SourceMap file`)
        }
      }

      break

    case 'list-or-inputs':
      verboseLog(`Input "${input}" typed as "${inputType}" reading file "${input}" with all inputs`)
      const file = await readFile(input, 'utf-8')
      const newInputs = file.split('\n').map(s => s.trim())
      verboseLog(`${newInputs.length} input(-s) has found`)

      for (const input of newInputs) {
        verboseLog(`Starting runner with input "${input}"`)
        await runner(input)
      }

      break

    case 'remote-sourcemap':
    case 'remote-resource':
    case 'remote-html':
      verboseLog(`Input "${input}" typed as "${inputType}" starting crawler`)
      await crawler(input, inputType, outputDir)
      break

    default:
      break
  }
}
