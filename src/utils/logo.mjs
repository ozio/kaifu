import chalk from 'chalk'
import { getPackageJson } from './getPackageJson.mjs'

const { version } = await getPackageJson()

export const logo = chalk.bold(chalk.yellow(`Kaifū`) + ` v${version}`)
