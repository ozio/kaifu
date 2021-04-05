const chalk = require('chalk');
const meow = require('meow');
const { generateSummary } = require('./stats');
const { unpacker } = require('./unpack');
const { stats } = require('./stats');
const { eventEmitter } = require('./eventemitter');
const { logo } = require('./utils/logo');
const { globalError, globalLog, createLogger, loggerConfig } = require('./logger');
const { verboseLog } = createLogger(chalk.gray('cli'));

const cli = meow(
`${logo}

Usage: kaifu [options...] <url|file|directory>
   -o,  --output-dir <dir>   Output directory.
   -w,  --overwrite          Overwrite files if already exist.
   -s,  --skip-empty         Don't create a file if it's empty.
   -m,  --merge              Unsafe merge all recovered trees in one folder.
        --short              Short summary.
   -v,  --verbose            Show everything.
        --version            Show current version.
   
Examples:
   kaifu --output-dir ./mdn https://developer.mozilla.org/
`,
  {
    description: false,
    flags: {
      outputDir: {
        type: 'string',
        alias: 'o',
      },

      overwrite: {
        type: 'boolean',
        alias: 'w',
      },

      short: {
        type: 'boolean',
      },

      skipEmpty: {
        type: 'boolean',
        alias: 's',
      },

      verbose: {
        type: 'boolean',
        alias: 'v',
      },

      merge: {
        type: 'boolean',
        alias: 'm',
      },

      skipUrl: {
        type: 'string',
      },
    },
  },
);

loggerConfig.verbose = cli.flags.verbose;

const { runner } = require('./runner');

(async () => {
  verboseLog('Initialized with following params:', cli.flags);
  verboseLog('With following inputs:', cli.input);

  if (cli.input.length === 0) {
    globalError('No input specified');
    process.exitCode = 1;

    return;
  }

  globalLog(`\n${logo}\n`);

  for (const input of cli.input) {
    await runner(input, cli.flags);
  }

  eventEmitter.on('crawler-queue-is-empty', async () => {
    await unpacker();
  });

  eventEmitter.on('unpack-queue-is-empty', () => {
    globalLog('');
    generateSummary(stats);
  })
})();
