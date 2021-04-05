const chalk = require('chalk');
const SPACES = 3;

const size = (size) => chalk.grey(size);

const sortFilesToTheEnd = (unordered) => {
  return Object.keys(unordered)
    .sort((a, b) => {
      if (!unordered[a].isFile && unordered[b].isFile) return -1;
      return 0;
    })
    .reduce(
      (obj, key) => {
        obj[key] = unordered[key];
        return obj;
      },
      {}
    );
};

const convertStringToTree = (string) => {
  const lines = string.split('\n')
    .sort()
    .map(line => line.split('/'))
  const treeObj = {}
  let name;

  lines.forEach(line => {
    let currentLevel = treeObj;

    while ((name = line.shift()) !== undefined) {
      if (name === '') {
        name = '.';
      }
      if (name.includes('|')) {
        const [filename, size] = name.split('|');
        if (!currentLevel[filename]) currentLevel[filename] = { isFile: true, size };
      } else {
        if (!currentLevel[name]) currentLevel[name] = {};
        currentLevel = currentLevel[name];
      }
    }
  });

  return treeObj;
}

const generateLinesOutput = (treeObj) => {
  let output = '';

  const render = (obj, level = 0, tails = {}) => {
    let indent = '';

    for (let i = 0; i < level; i++) {
      indent += tails[i] === true ? '  '.padEnd(SPACES) : ' │'.padEnd(SPACES);
    }

    const sortedObj = sortFilesToTheEnd(obj);
    const arr = Object.entries(sortedObj);

    return arr.forEach(([key, value], idx) => {
      const isLast = !arr[idx + 1];

      if (!value.isFile) {
        output += `${indent}${isLast ? ' └─' : ' ├─'} ${key}\n`;
        render(value, level + 1, {...tails, [level]: isLast});
      } else {
        output += `${indent}${isLast ? ' └─' : ' ├─'} ${key} ${size(`[${value.size} bytes]`)}\n`;
      }
    });
  };

  render(treeObj);

  return output.trimEnd();
}

const tree = (string) => {
  const treeObj = convertStringToTree(string);

  return generateLinesOutput(treeObj['.']);
};

module.exports = { tree };
