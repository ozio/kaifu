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
   -o,  --output-dir <dir>   Output directory
   -m,  --merge              Unsafe merge all unboxed trees in one folder
   -s,  --short              Short summary
   -v,  --verbose            Make the operation more talkative
   -q,  --quiet              Make the operation less talkative
        --skip-empty         Do not unbox empty files
        --version            Show version number and exit
   
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

      merge: {
        type: 'boolean',
        alias: 'm',
      },

      short: {
        type: 'boolean',
        alias: 's',
      },

      verbose: {
        type: 'boolean',
        alias: 'v',
      },

      skipEmpty: {
        type: 'boolean',
      },

      /*
      skipUrl: {
        type: 'string',
      },

      overwrite: {
        type: 'boolean',
        alias: 'w',
      },
      */
    },
  },
);

loggerConfig.verbose = cli.flags.verbose;
loggerConfig.quiet = cli.flags.quiet;

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
