const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { globalLog } = require('./logger');
const { globalError } = require('./logger');
const { SourceMapConsumer } = require('source-map');
const { createLogger } = require('./logger');
const { log, err, warn } = createLogger(chalk.green('unpack'));

const fixSource = (source) => {
  log('Fixing source:', source)

  if (source.startsWith('webpack:///')) {
    log('Source starts with wrong protocol (webpack:///). Fixing.')
    return source.slice(11);
  }

  return path.resolve('/', source).slice(1);
};

const unpack = async (sourceMapPath, outputDir, flags, input) => {
  const sourceMap = await fs.promises.readFile(sourceMapPath, 'utf-8');

  globalLog();
  globalLog('URL:');
  globalLog('  ', chalk.yellow.bold(input));
  globalLog();
  globalLog('Output Directory:')
  globalLog('  ', chalk.yellow.bold(outputDir))
  globalLog();

  try {
    log(`Start unpacking SourceMap "${sourceMapPath}" (${sourceMap.length} bytes)`)
    await SourceMapConsumer.with(sourceMap, null, (consumer) => {
      consumer.sources.forEach(async (source) => {
        log(`Unpacking file: ${source}`);

        let sourceContent = consumer.sourceContentFor(source);

        log(`Source contents ${sourceContent.length} byte(-s)`);

        if (!flags.skipEmpty) sourceContent = sourceContent || '';
        if (!sourceContent) warn(`SourceMap file content is empty: "${source}"`);

        const fixedSource = fixSource(source);
        const filePath = path.resolve(outputDir, fixedSource);

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
        await fs.promises.writeFile(filePath, sourceContent);

        const outputString = `${filePath.replace(path.resolve(outputDir), '')}`;

        globalLog(
          chalk.grey(` @`),
          chalk.whiteBright(
            `${outputString.split('/').slice(0, -1).join('/')}/`
          ) +
          chalk.yellow.bold(
            outputString.split('/').slice(-1).join('/')
          )
        );
      });
    });
  } catch (e) {
    globalError(`Invalid SourceMap format: ${e.message}`)
    err(`Error while unpacking "${sourceMapPath}": ${e.message}`)
  }
};

module.exports = { unpack };
