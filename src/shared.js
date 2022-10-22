const axios = require("axios");
const { sleep } = require("timing-functions");

const nextRE = /<([0-9a-zA-Z$\-_.+!*'(),?/:=&%]+)>; rel="next"/;

/* HELPER FUNCTIONS */
const getNextURLFromHeaders = (parsedHeaders) => {
  if (!parsedHeaders?.link) {
    return;
  }

  const match = nextRE.exec(parsedHeaders.link);
  return match?.[1];
};

/* XML WRITER HELPERS */
const sitemapIndexFile = {
  start: `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`,
  end: "</sitemapindex>",
  file: (loc) => `  <sitemap>
    <loc>${loc}</loc>
  </sitemap>
`,
};

const sitemapFile = {
  start: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`,
  end: "</urlset>",
  location: (loc, lastmod) => `  <url>
    <loc>${loc}</loc>${
    lastmod
      ? `
    <lastmod>${lastmod}</lastmod>`
      : ""
  }
  </url>
`,
};

/* NETWORK CALL ABSTRACTION */
const MAX_RETRIES = 20;

const customFetch = async (url, head = false) => {
  if (head) {
    // NOTE: bug in axios when using HEAD, change it back later after lib update
    return axios({ url, method: "GET" });
  }
  let count = 0;
  let response = {};
  while (true) {
    try {
      response = await axios(url);
      break;
    } catch (err) {
      if (count < MAX_RETRIES) {
        // exponential backoff (with magic numbers)
        await sleep(Math.pow(1.4, ++count) * 1000);
      } else {
        break;
      }
    }
  }
  return response;
};

/* CONSTANTS */
const accessionCountPerFile = 50_000;

const buildDir = "./build";

module.exports = {
  getNextURLFromHeaders,

  sitemapIndexFile,
  sitemapFile,

  customFetch,

  accessionCountPerFile,
  buildDir,
};
