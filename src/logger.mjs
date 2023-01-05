import chalk from 'chalk'
import pj from '../package.json' assert { type: 'json' }

const { name } = pj

export const loggerConfig = {
  verbose: false,
  quiet: false,
}

export const verboseLog = (...messages) => {
  if (!loggerConfig.verbose) return

  console.log(`${chalk.bold.bgBlackBright(name)}`, ...messages)
}

export const verboseError = (...messages) => {
  if (!loggerConfig.verbose) return

  console.log(`${chalk.blackBright.bold.bgRedBright(name)}`, ...messages)
}

export const verboseWarning = (...messages) => {
  if (!loggerConfig.verbose) return

  console.log(`${chalk.blackBright.bold.bgYellowBright(name)}`, ...messages)
}

export const globalLog = (...messages) => {
  if (loggerConfig.quiet || loggerConfig.verbose) return

  console.log(...messages)
}

export const globalError = (...messages) => {
  if (loggerConfig.quiet || loggerConfig.verbose) return

  console.error(chalk.red.bold('Error:'), ...messages)
}

export const globalWarning = (...messages) => {
  if (loggerConfig.quiet || loggerConfig.verbose) return

  console.warn(chalk.yellow.bold('Warning:'), ...messages)
}

export const createLogger = (module) => {
  return {
    verboseLog: (...messages) => verboseLog((module), ...messages),
    verboseError: (...messages) => verboseError((module), ...messages),
    verboseWarning: (...messages) => verboseWarning((module), ...messages),
  }
}
