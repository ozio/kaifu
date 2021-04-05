const cheerio = require('cheerio');

const restrictedLinkParts = [
  'yastatic.net',
  's.w.org',
  'static.criteo.net/js/ld',
  'code.jquery.com/jquery-',
  'vk.com/js/api/openapi.js',
  'cdn.jsdelivr.net',
  'ssp.rambler.ru/capirs_async.js',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'api.mindbox.ru/scripts/v1/tracker.js',
  'api.flocktory.com/v2/loader.js',
  'bootstrapcdn.com',

  /* Google */
  'ajax.googleapis.com',
  'pagead2.googlesyndication.com',
  'www.googletagmanager.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com',
  'google-analytics.com',
  'google-analytics.com/analytics.js',
  'www.google.com/recaptcha/api.js',
  'www.googletagservices.com/tag/js/gpt.js',
  'www.googleoptimize.com/optimize.js'
];

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
