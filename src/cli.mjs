import chalk from 'chalk'
import meow from 'meow'
import { generateSummary, stats } from './stats.mjs'
import { unpacker } from './unpack.mjs'
import { eventEmitter } from './eventemitter.mjs'
import { logo } from './utils/logo.mjs'
import { createLogger, globalError, globalLog, loggerConfig } from './logger.mjs'
import { options, setOptions } from './options.mjs'

const { verboseLog } = createLogger(chalk.gray('cli'))

const cli = meow(
  `${logo}

Usage: kaifu [options...] <url|file|directory>

Options:
   -o,  --output-dir <dir>   Specify the output directory.
   -m,  --merge              Unsafely merge all unboxed trees into a single folder.
   -s,  --short              Display a short summary.
   -v,  --verbose            Provide detailed output.
   -q,  --quiet              Suppress most output messages (minimal output).
        --skip-empty         Skip unboxing of empty files.
        --version            Show the version number and exit.
   
Examples:
   kaifu --o ./mdn https://developer.mozilla.org/
   kaifu -sm https://developer.mozilla.org/
`,
  {
    importMeta: import.meta,
    description: false,
    flags: {
      outputDir: {
        type: 'string',
        aliases: ['o'],
      },

      merge: {
        type: 'boolean',
        aliases: ['m'],
      },

      short: {
        type: 'boolean',
        aliases: ['s'],
      },

      verbose: {
        type: 'boolean',
        aliases: ['v'],
      },

      skipEmpty: {
        type: 'boolean',
      },

      quiet: {
        type: 'boolean',
        aliases: ['q'],
      }
    },
  },
)

setOptions({ flags: cli.flags, input: cli.input })

loggerConfig.verbose = options.flags.verbose
loggerConfig.quiet = options.flags.quiet

;(
  async () => {
    const { runner } = await import('./runner.mjs')

    verboseLog('Initialization complete with the following parameters:', options.flags)
    verboseLog('Inputs provided:', options.input)

    if (options.input.length === 0) {
      globalError('No input specified.')
      process.exitCode = 1

      return
    }

    globalLog()
    globalLog(logo)
    globalLog()

    for (const input of options.input) {
      await runner(input)
    }

    eventEmitter.on('crawler-queue-is-empty', async () => {
      await unpacker()
    })

    eventEmitter.on('unpack-queue-is-empty', () => {
      globalLog('')
      generateSummary(stats)
    })
  }
)()
