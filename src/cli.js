const chalk = require('chalk');
const meow = require('meow');
const { logo } = require('./utils/logo');
const { createLogger, loggerConfig } = require('./logger');
const { log } = createLogger(chalk.gray('cli'));

const cli = meow(
`${logo}

Usage: kaifu [options...] <url|file|directory>
   -o,  --output-dir <dir>   Output directory.
   -w,  --overwrite          Overwrite files if already exist.
   -s,  --skip-empty         Don't create a file if sourcemap is empty.
   -l,  --list <file>        Use a list of several inputs.
        --verbose            Show everything.
   -v,  --version
   
Examples:
   kaifu --output-dir ./reddit https://reddit.com
`,
  {
    flags: {
      outputDir: {
        type: 'string',
        alias: 'o',
      },

      overwrite: {
        type: 'boolean',
        alias: 'w',
      },

      skipEmpty: {
        type: 'boolean',
        alias: 's',
      },

      list: {
        type: 'string',
        alias: 'l',
      },

      verbose: {
        type: 'boolean',
      },
    },
  },
);

loggerConfig.verbose = cli.flags.verbose;

const { runner } = require('./runner');

(async () => {
  console.log(`\n${logo}\n`);

  log('Initialized with following params:');

  for (const flag in cli.flags) {
    log(`   ${flag}:`, cli.flags[flag]);
  }

  log();
  log('With following inputs:');

  for (const input of cli.input) {
    log(`   "${input}"`);
  }

  log();

  if (cli.input.length === 0) {
    console.error(chalk.red('Error: No input sources were defined'));
    process.exitCode = 1;

    return;
  }

  for (const input of cli.input) {
    log('Runner started with input', input);
    await runner(input, cli.flags);
    log('Runner ended with input', input);
  }
})();
