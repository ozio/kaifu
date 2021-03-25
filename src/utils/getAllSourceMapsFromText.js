const regex = /sourceMappingURL=([^=*]+\.map)/gmi;

const getAllSourceMapsFromText = (text) => {
  let arr;
  const sourcemaps = [];

  while ((arr = regex.exec(text)) !== null) {
    sourcemaps.push(arr[1]);
  }

  return sourcemaps;
};

module.exports = { getAllSourceMapsFromText };
