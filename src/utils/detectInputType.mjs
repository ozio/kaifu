import fs from 'node:fs'
import path from 'node:path'
import { URL } from 'node:url'
import { globalError } from '../logger.mjs'
import { getFirstLine } from './getFirstLine.mjs'

export const detectInputURLType = (input) => {
  const url = new URL(input)

  const { protocol, pathname } = url

  if (!['http:', 'https:'].includes(protocol)) {
    return 'skip'
  }

  if (pathname.endsWith('.map')) {
    return 'remote-sourcemap'
  }

  if (pathname.endsWith('.js') || pathname.endsWith('.css')) {
    return 'remote-resource'
  }

  if (pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.ico')) {
    return 'skip'
  }

  return 'remote-html'
}

export const detectInputType = async (input) => {
  try {
    return detectInputURLType(input)
  } catch (e) {}

  try {
    const res = await fs.promises.lstat(path.resolve(input))

    if (res.isDirectory()) {
      return 'directory'
    }

    if (res.isFile()) {
      if (input.endsWith('.map')) {
        return 'local-sourcemap'
      }

      try {
        const firstLine = await getFirstLine(path.resolve(input))

        if (firstLine.trim() === '') {
          throw new Error(`Unknown file format: ${path.resolve(input)}`)
        }

        await detectInputType(firstLine)

        return 'list-or-inputs'
      } catch (e) {
        throw e
      }
    }
  } catch (e) {
    globalError(`Invalid input (${input})`)
    throw e
  }
}
