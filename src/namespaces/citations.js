const fs = require("fs");
const path = require("path");

const axios = require("axios");
const ProgressBar = require("progress");

const {
  getNextURLFromHeaders,
  accessionCountPerFile,
  buildDir,
  sitemapFile,
} = require("../shared");

module.exports = ({ namespace, query = "*" } = {}) => {
  const baseURL = `https://rest.uniprot.org/${namespace}/search?format=json&query=${query}&fields=id,publication_date`;
  async function* entryGenerator() {
    // Initial query, just for the size => allows to follow progress
    let response = await axios({ url: `${baseURL}&size=0`, method: "HEAD" });
    // first, yield the total
    yield +response.headers["x-total-records"];

    let nextURL = `${baseURL}&size=500`;
    let data;
    while (nextURL || data) {
      let responsePromise;
      // First, ask server for data for the next loop
      if (nextURL) {
        responsePromise = axios(nextURL);
      }

      // In the meantime, process the current payload
      for (const result of data?.results || []) {
        if (result) {
          let lastModified;
          try {
            [lastModified] = new Date(result.citation.publicationDate)
              .toISOString()
              .split("T");
          } catch (e) {
            lastModified = result.citation.publicationDate;
          }
          // then yield each entry for the next pages
          yield {
            accession: result.citation.id,
            lastModified,
          };
        }
      }

      // Wait for the next payload
      const response = await responsePromise;

      // Set variables for the next loop
      data = response?.data;
      nextURL = getNextURLFromHeaders(response?.headers);
    }
  }

  const urlsPerEntry = 1;
  async function* fileGenerator() {
    const entryIterator = entryGenerator();

    const { value: total } = await entryIterator.next();

    const padLength = `${Math.ceil(
      (total * urlsPerEntry) / accessionCountPerFile
    )}`.length;
    let fileIndex = 0;
    let urlCountInFile = 0;

    console.log(
      `found ${total} entries for the query "${query}" in "${namespace}"`
    );
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

    while (entry) {
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

      while (urlCountInFile + urlsPerEntry < accessionCountPerFile && entry) {
        writableStream.write(
          sitemapFile.location(
            `https://www.uniprot.org/${namespace}/${entry.accession}`,
            entry.lastModified
          )
        );
        bar.tick(1);
        urlCountInFile += urlsPerEntry;
        entry = (await entryIterator.next()).value;
      }

      writableStream.end(sitemapFile.end);
      urlCountInFile = 0;
      yield filename;
    }
  }

  return fileGenerator;
};
