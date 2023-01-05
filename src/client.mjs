import chalk from 'chalk'
import { createLogger, globalError, globalLog } from './logger.mjs'
import { request } from './utils/request.mjs'
import pj from '../package.json' assert { type: 'json' }

const { name, version, homepage } = pj
const userAgent = `${name}/${version} (+${homepage})`

const { verboseLog, verboseError } = createLogger(chalk.magenta('client'))

verboseLog('User-agent will be', chalk.yellow(userAgent))

export const client = async (url) => {
  try {
    verboseLog(`Request ${url}`)

    const response = await request(url, {
      'User-Agent': userAgent,
    })

    verboseLog(`Response ${chalk.green(response.status)}, size: ${response.headers['content-length']}`)

    if (response.status >= 400) {
      globalError(`Request failed (${response.status})`)
      throw new Error(`Request failed (${response.status})`)
    }

    return response
  } catch (e) {
    verboseError(`Request failed: ${e.errno}, ${e.response ? e.response.status : e.message}`)

    if (e.errno === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
      globalError('The website is using self-signed certificate.')
      globalLog('You could use environment variable NODE_TLS_REJECT_UNAUTHORIZED=0 as a fast, but very unsecure fix.')
    }

    if (e.errno === 'SELF_SIGNED_CERT_IN_CHAIN') {
      globalError('There is a self-signed certificate in chain.')
      globalLog('You could use environment variable NODE_TLS_REJECT_UNAUTHORIZED=0 as a fast, but very unsecure fix.')
    }

    if (e.errno === 'ENOTFOUND') {
      globalError('Request failed. Check URL or your internet connection.')
    }

    throw e
  }
}
