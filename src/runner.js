const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { stats } = require('./stats');
const { createLogger } = require('./logger');
const { crawler } = require('./crawler');
const { generateOutputDirName } = require('./utils/generateOutputDirName');
const { getInputType } = require('./utils/getInputType');
const { unpack } = require('./unpack');
const { log } = createLogger(chalk.yellow('runner'))

const runner = async (input, flags) => {
  const inputType = await getInputType(input);
  const outputDir = path.resolve(flags.outputDir || generateOutputDirName(input, inputType));

  stats.outputDirectories[outputDir] = true;

  log();
  log('Input type detected:', inputType);
  log('Output dir generated:', outputDir);
  log();

  try {
    log('Creating directory:', outputDir)
    await fs.promises.mkdir(outputDir);
    log('Directory created');
  } catch (e) {
    if (!flags.overwrite) {
      throw new Error(`Directory or file '${outputDir}' already exist`)
    }
    log('Directory or file already exist, but passed following --overwrite/-w flag');
  }

  switch (inputType) {
    case 'local-sourcemap':
      log(`Input "${input}" typed as "${inputType}" going to be unpacked`);
      await unpack(input, outputDir, cli.flags);

      break;

    case 'directory':
      log(`Input "${input}" typed as "${inputType}" reading directory`);
      const files = await fs.promises.readdir(input);

      for await (const file of files) {
        if (file.endsWith('.map')) {
          log(`File ${file} will be unpacked`);
          await unpack(path.resolve(input, file), outputDir, flags)
        } else {
          log(`File ${file} will not be unpacked, because it is not a SourceMap file`);
        }
      }

      break;

    case 'list-or-inputs':
      log(`Input "${input}" typed as "${inputType}" reading file "${input}" with all inputs`);
      const file = await fs.promises.readFile(input, 'utf-8');
      const newInputs = file.split('\n').map(s => s.trim());
      log(`${newInputs.length} input(-s) has found`);

      for (const input of newInputs) {
        log(`Starting runner with input "${input}"`)
        await runner(input);
      }

      break;

    case 'remote-sourcemap':
    case 'remote-resource':
    case 'remote-html':
      log(`Input "${input}" typed as "${inputType}" starting crawler`);
      await crawler(input, inputType, outputDir, flags);
      break;

    default:
      break;
  }
};

module.exports = { runner };
