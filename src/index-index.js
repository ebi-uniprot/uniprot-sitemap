#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const { buildDir, sitemapIndexFile } = require("./shared");

const publicPath = "https://www.uniprot.org/";
const indexFilename = "sitemap-index.xml";

const main = () => {
  const filenames = fs.readdirSync(buildDir);

  // Note: might want to pipe it through a gzip stream
  const writableStream = fs.createWriteStream(
    path.join(buildDir, indexFilename)
  );
  writableStream.on("error", (error) => {
    console.log(
      `An error occured while writing to the index file. Error: ${error.message}`
    );
  });
  writableStream.write(sitemapIndexFile.start);
  for (const filename of filenames) {
    if (filename !== indexFilename && filename.endsWith(".xml")) {
      writableStream.write(sitemapIndexFile.file(publicPath + filename));
    }
  }
  writableStream.end(sitemapIndexFile.end);
};

main();
