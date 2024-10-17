import chalk from 'chalk'
import fetch from 'node-fetch'
import { createLogger, globalError, globalLog } from './logger.mjs'
import { getPackageJson } from './utils/getPackageJson.mjs'

const { name, version, homepage } = await getPackageJson()

const userAgent = `${name}/${version} (+${homepage})`

const { verboseLog, verboseError } = createLogger(chalk.magenta('client'))

verboseLog('User-Agent set to:', chalk.yellow(userAgent))

export const client = async (url) => {
  try {
    verboseLog(`Sending request to: ${url}`)

    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent },
    })

    verboseLog(`Response received: ${chalk.green(response.status)}, Content-Length: ${response.headers['content-length'] || 'unknown'}`)

    if (response.status >= 400) {
      const errorMsg = `Request failed with status code: ${response.status}`
      globalError(errorMsg)
      throw new Error(errorMsg)
    }

    return response
  } catch (e) {
    verboseError(`Request error: ${e.errno || 'unknown'}, Status: ${e.response ? e.response.status : e.message}`)

    if (e.errno === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
      globalError('The website is using a self-signed certificate.')
      globalLog('Consider setting the environment variable NODE_TLS_REJECT_UNAUTHORIZED=0 as a temporary workaround, but note that this is insecure.')
    }

    if (e.errno === 'SELF_SIGNED_CERT_IN_CHAIN') {
      globalError('A self-signed certificate was detected in the certificate chain.')
      globalLog('Consider setting the environment variable NODE_TLS_REJECT_UNAUTHORIZED=0 as a temporary workaround, but note that this is insecure.')
    }

    if (e.errno === 'ENOTFOUND') {
      globalError('Request failed. Please verify the URL or check your internet connection.')
    }

    throw e
  }
}
