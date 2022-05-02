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

/* CONSTANTS */
const accessionCountPerFile = 50_000;

const buildDir = "./build";

module.exports = {
  getNextURLFromHeaders,

  sitemapIndexFile,
  sitemapFile,

  accessionCountPerFile,
  buildDir,
};
