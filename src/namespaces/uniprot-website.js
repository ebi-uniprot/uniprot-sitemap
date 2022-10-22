const fs = require("fs");
const path = require("path");

const ProgressBar = require("progress");

const { accessionCountPerFile, buildDir, sitemapFile } = require("../shared");

module.exports = ({ namespace } = {}) => {
  const pages = [
    "", // Home page
    "blast",
    "align",
    "peptide-search",
    "id-mapping",
    "contact",
    "help",
    // Note: add landing pages, whenever we have them
    "uniprotkb?query=*",
    "uniref?query=*",
    "uniparc?query=*",
    "proteomes?query=*",
    "taxonomy?query=*",
    "keywords?query=*",
    "citations?query=*",
    "diseases?query=*",
    "database?query=*",
    "locations?query=*",
    "unirule?query=*",
    "arba?query=*",
    "help?query=*",
    "release-notes?query=*",
  ];

  async function* entryGenerator() {
    // first, yield the total
    yield pages.length;

    for (const page of pages) {
      yield page;
    }
  }

  const urlsPerEntry = 1;
  async function fileCreator() {
    const entryIterator = entryGenerator();

    const { value: total } = await entryIterator.next();

    const padLength = `${Math.ceil(
      (total * urlsPerEntry) / accessionCountPerFile
    )}`.length;
    let fileIndex = 0;
    let urlCountInFile = 0;

    console.log(`found ${total} pages in ${namespace}`);
    const bar = new ProgressBar(
      "🗺  [:bar] generating sitemap URLs :rate entries per second :percent :etas",
      {
        complete: "=",
        incomplete: " ",
        width: 20,
        total,
      }
    );

    let { value: entry } = await entryIterator.next();

    while (typeof entry === "string") {
      const filename = `sitemap-${namespace}-${`${++fileIndex}`.padStart(
        padLength,
        "0"
      )}.xml`;
      const writableStream = fs.createWriteStream(
        path.join(buildDir, filename)
      );

      // Note: might want to pipe it through a gzip stream
      writableStream.write(sitemapFile.start);

      writableStream.on("error", (error) => {
        console.log(
          `An error occured while writing to the index file. Error: ${error.message}`
        );
      });

      while (
        urlCountInFile + urlsPerEntry < accessionCountPerFile &&
        typeof entry === "string"
      ) {
        writableStream.write(
          sitemapFile.location(`https://www.uniprot.org/${entry}`)
        );
        bar.tick(1);
        urlCountInFile += urlsPerEntry;
        entry = (await entryIterator.next()).value;
      }

      writableStream.end(sitemapFile.end);
      urlCountInFile = 0;
    }
  }

  return fileCreator;
};
