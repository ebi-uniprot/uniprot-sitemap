const {
  getNextURLFromHeaders,
  getPadLength,
  getWritableStream,
  getProgressBar,
  accessionCountPerFile,
  sitemapFile,
  customFetch,
} = require("../shared");

module.exports = ({ namespace, query = "*" } = {}) => {
  const baseURL = `https://rest.uniprot.org/${namespace}/search?format=json&query=${query}&fields=accession,date_modified`;
  async function* entryGenerator() {
    // Initial query, just for the size => allows to follow progress
    let response = await customFetch(`${baseURL}&size=0`, true);
    // first, yield the total
    yield +response.headers["x-total-results"];

    let nextURL = `${baseURL}&size=500`;
    let data;
    while (nextURL || data) {
      let responsePromise;
      // First, ask server for data for the next loop
      if (nextURL) {
        responsePromise = customFetch(nextURL);
      }

      // In the meantime, process the current payload
      for (const result of data?.results || []) {
        if (result) {
          // then yield each entry for the next pages
          yield {
            accession: result.primaryAccession,
            lastModified: result.entryAudit.lastAnnotationUpdateDate,
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

  const urlsPerEntry = 3;
  async function fileCreator() {
    const entryIterator = entryGenerator();

    const { value: total } = await entryIterator.next();

    const padLength = getPadLength(urlsPerEntry, total);
    let fileIndex = 0;
    let urlCountInFile = 0;

    console.log(
      `found ${total} entries for the query "${query}" in "${namespace}"`
    );
    const bar = getProgressBar(total);

    let { value: entry } = await entryIterator.next();

    while (entry) {
      const filename = `sitemap-${namespace}-${`${++fileIndex}`.padStart(
        padLength,
        "0"
      )}.xml.gz`;
      const writableStream = getWritableStream(filename);

      writableStream.write(sitemapFile.start);

      while (urlCountInFile + urlsPerEntry <= accessionCountPerFile && entry) {
        writableStream.write(
          sitemapFile.location(
            `https://www.uniprot.org/${namespace}/${entry.accession}/entry`,
            entry.lastModified
          )
        );
        writableStream.write(
          sitemapFile.location(
            `https://www.uniprot.org/${namespace}/${entry.accession}/publications`,
            entry.lastModified
          )
        );
        writableStream.write(
          sitemapFile.location(
            `https://www.uniprot.org/${namespace}/${entry.accession}/external-links`,
            entry.lastModified
          )
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
