const shortenString = (string, maxLength = 30, cutPos = 'center') => {
  if (typeof string !== 'string') return string;
  if (string.length <= maxLength) return string;

  if (cutPos === 'center') {
    const size = Math.floor(maxLength / 2);

    return `${string.slice(0, size)}...${string.slice(size * -1)}`
  } else {
    return `...${string.slice(maxLength * -1)}`
  }
};

module.exports = { shortenString };
