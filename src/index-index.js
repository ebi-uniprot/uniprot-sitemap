#!/usr/bin/env node
const fs = require("node:fs");

const { getWritableStream, buildDir, sitemapIndexFile } = require("./shared");

const publicPath = "https://www.uniprot.org/";
const indexFilename = "sitemap-index.xml.gz";

const main = () => {
  const filenames = fs.readdirSync(buildDir);

  const writableStream = getWritableStream(indexFilename);

  writableStream.write(sitemapIndexFile.start);

  for (const filename of filenames) {
    if (filename !== indexFilename && filename.endsWith(".xml.gz")) {
      writableStream.write(sitemapIndexFile.file(publicPath + filename));
    }
  }

  writableStream.end(sitemapIndexFile.end);
};

main();
