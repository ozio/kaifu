import chalk from 'chalk'
import pj from '../../package.json' assert { type: 'json' }

const { version } = pj

export const logo = chalk.bold(chalk.yellow(`Kaifū`) + ` v${version}`)
