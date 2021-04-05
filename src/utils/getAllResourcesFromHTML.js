const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const list = fs.readFileSync(path.resolve(__dirname, '../../skip.txt'), 'utf-8');

const restrictedLinkParts = list
  .split('\n')
  .map(line => {
    const commentPosition = line.indexOf('#');

    if (commentPosition >= 0) {
      line = line.slice(0, commentPosition);
    }

    return line.trim();
  })
  .filter(line => line !== '')
;

const isThisLinkOK = (tagName, attrib = {}) => {
  if (tagName === 'link') {
    if (!attrib.href) return false;

    if (!(!attrib.rel || attrib.rel === 'stylesheet')) {
      return false;
    }

    if (restrictedLinkParts.some((part) => attrib.href.includes(part))) {
      return false;
    }
  }

  if (tagName === 'script') {
    if (!attrib.src) return false;

    if (restrictedLinkParts.some((part) => attrib.src.includes(part))) {
      return false;
    }
  }

  return true;
};

const getAllResourcesFromHTML = async (html) => {
  let $;

  try {
    $ = cheerio.load(html);
  } catch (e) {
    return [];
  }

  const resources = [];

  $('script').each((_, item) => {
    if (!isThisLinkOK('script', item.attribs)) return;

    resources.push($(item).attr('src'));
  });

  $('link').each((_, item) => {
    if (!isThisLinkOK('link', item.attribs)) return;

    resources.push($(item).attr('href'));
  });

  return resources.filter(Boolean);
};

module.exports = { getAllResourcesFromHTML };
