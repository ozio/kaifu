const path = require('path');
const chalk = require('chalk');
const fs = require('fs');
const { access, readdir, readFile } = fs.promises;
const { stats } = require('./stats');
const { createLogger } = require('./logger');
const { crawler } = require('./crawler');
const { generateOutputDirName } = require('./utils/generateOutputDirName');
const { detectInputType } = require('./utils/detectInputType');
const { unpack } = require('./unpack');
const { verboseLog } = createLogger(chalk.yellow('runner'))

const runner = async (input, flags) => {
  const inputType = await detectInputType(input);
  const outputDir = path.resolve(flags.outputDir || generateOutputDirName(input, inputType));

  stats.outputDirectories[outputDir] = true;

  verboseLog('Input type detected:', inputType);
  verboseLog('Output dir generated:', outputDir);

  try {
    await access(outputDir, fs.F_OK);
    if (!flags.overwrite) {
      throw new Error(`Directory or file '${outputDir}' already exist`)
    }
    verboseLog('Directory or file already exist, but passed following --overwrite/-w flag');
  } catch (e) {}

  switch (inputType) {
    case 'local-sourcemap':
      verboseLog(`Input "${input}" typed as "${inputType}" going to be unpacked`);
      await unpack(input, outputDir, flags);

      break;

    case 'directory':
      verboseLog(`Input "${input}" typed as "${inputType}" reading directory`);
      const files = await readdir(input);

      for await (const file of files) {
        if (file.endsWith('.map')) {
          verboseLog(`File ${file} will be unpacked`);
          await unpack(path.resolve(input, file), outputDir, flags)
        } else {
          verboseLog(`File ${file} will not be unpacked, because it is not a SourceMap file`);
        }
      }

      break;

    case 'list-or-inputs':
      verboseLog(`Input "${input}" typed as "${inputType}" reading file "${input}" with all inputs`);
      const file = await readFile(input, 'utf-8');
      const newInputs = file.split('\n').map(s => s.trim());
      verboseLog(`${newInputs.length} input(-s) has found`);

      for (const input of newInputs) {
        verboseLog(`Starting runner with input "${input}"`)
        await runner(input);
      }

      break;

    case 'remote-sourcemap':
    case 'remote-resource':
    case 'remote-html':
      verboseLog(`Input "${input}" typed as "${inputType}" starting crawler`);
      await crawler(input, inputType, outputDir, flags);
      break;

    default:
      break;
  }
};

module.exports = { runner };
