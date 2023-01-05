import { URL } from 'node:url'

export const generateOutputDirName = (input, inputType) => {
  switch (inputType) {
    case 'local-sourcemap':
      return input.split('.').slice(0, -2).join('.')

    case 'directory':
      return `${input}__output`

    case 'remote-sourcemap':
    case 'remote-html':
      const { hostname } = new URL(input)
      return hostname

    default:
      break
  }
}
