const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { SourceMapConsumer } = require('source-map');

const fixSource = (source) => {
  if (source.startsWith('../')) {
    return source.slice(3);
  }

  if (source.startsWith('webpack:///')) {
    return source.slice(11);
  }

  return source;
};

const unpack = async (sourceMapPath, outputDir, flags) => {
  const sourceMap = await fs.promises.readFile(sourceMapPath, 'utf-8');

  console.log();
  console.log('SourceMap:');
  console.log('  ', chalk.yellow.bold(sourceMapPath));
  console.log();
  console.log('Output Directory:')
  console.log('  ', chalk.yellow.bold(outputDir))
  console.log();
  console.log('Files unpacked:');

  await SourceMapConsumer.with(sourceMap, null, (consumer) => {
    consumer.sources.forEach(async (source) => {
      let sourceContent = consumer.sourceContentFor(source);

      if (!flags.skipEmpty) sourceContent = sourceContent || '';

      const fixedSource = fixSource(source);
      const filePath = path.resolve(outputDir, fixedSource);

      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, sourceContent);

      const outputString = `${filePath.replace(path.resolve(outputDir), '')}`;

      console.log(
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
};

module.exports = { unpack };
