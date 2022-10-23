const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const axios = require("axios");
const { sleep } = require("timing-functions");
const ProgressBar = require("progress");

const nextRE = /<([0-9a-zA-Z$\-_.+!*'(),?/:=&%]+)>; rel="next"/;

/* CONSTANTS */
const accessionCountPerFile = 50_000;

const buildDir = "./build";

/* HELPER FUNCTIONS */
const getNextURLFromHeaders = (parsedHeaders) => {
  if (!parsedHeaders?.link) {
    return;
  }

  const match = nextRE.exec(parsedHeaders.link);
  return match?.[1];
};

const getPadLength = (urlsPerEntry, total) =>
  `${Math.ceil((total * urlsPerEntry) / accessionCountPerFile)}`.length;

const getWritableStream = (filename) => {
  const gzipStream = zlib.createGzip();
  const fileStream = fs.createWriteStream(path.join(buildDir, filename));
  gzipStream.pipe(fileStream);
  gzipStream.on("error", (error) => {
    console.error(
      `An error occured while compressing ${filename}. Error: ${error.message}`
    );
  });
  fileStream.on("error", (error) => {
    console.error(
      `An error occured while writing to ${filename}. Error: ${error.message}`
    );
  });
  return gzipStream;
};

const getProgressBar = (total) =>
  new ProgressBar(
    "🗺  [:bar] generating sitemap URLs :rate entries per second :percent :etas",
    {
      complete: "=",
      incomplete: " ",
      width: 20,
      total,
    }
  );

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
        const sleepTime = Math.pow(1.4, ++count);
        console.error("Failed to fetch", url, `retrying in ${sleepTime}s`);
        await sleep(sleepTime * 1000);
      } else {
        console.error("Failed to fetch", url, `giving up...`);
        break;
      }
    }
  }
  return response;
};

module.exports = {
  getNextURLFromHeaders,
  getPadLength,
  getWritableStream,
  getProgressBar,

  sitemapIndexFile,
  sitemapFile,

  customFetch,

  accessionCountPerFile,
  buildDir,
};
