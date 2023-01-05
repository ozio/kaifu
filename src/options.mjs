export const options = {}

export const setOptions = (opts) => {
  Object.assign(options, opts)

  for (let value in options) {
    Object.freeze(options[value])
  }

  Object.freeze(options)
}
