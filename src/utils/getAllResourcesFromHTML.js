const cheerio = require('cheerio');

const getAllResourcesFromHTML = async (html) => {
  let $;

  try {
    $ = cheerio.load(html);
  } catch (e) {
    return [];
  }

  const resources = [];

  $('script').each((_, item) => {
    resources.push($(item).attr('src'));
  });

  $('link').each((_, item) => {
    resources.push($(item).attr('href'));
  });

  return resources.filter(Boolean);
};

module.exports = { getAllResourcesFromHTML };
