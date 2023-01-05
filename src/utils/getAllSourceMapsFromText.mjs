const regex = /sourceMappingURL=([^=*]+\.map)/gmi

export const getAllSourceMapsFromText = (text) => {
  let arr
  const sourcemaps = []

  while ((arr = regex.exec(text)) !== null) {
    sourcemaps.push(arr[1])
  }

  return sourcemaps
}
