#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const { buildDir, sitemapIndexFile } = require("./shared");

const uniprotWebsiteFileGenerator = require("./namespaces/uniprot-website");

const uniprotkbFileGenerator = require("./namespaces/uniprotkb");
const unirefFileGenerator = require("./namespaces/uniref");
const uniparcFileGenerator = require("./namespaces/uniparc");
const proteomesFileGenerator = require("./namespaces/proteomes");

const citationsFileGenerator = require("./namespaces/citations");
const supportingDataFileGenerator = require("./namespaces/supporting-data");
const databaseFileGenerator = require("./namespaces/database");

const automaticAnnotationsFileGenerator = require("./namespaces/automatic-annotations");

const articleGenerator = require("./namespaces/articles");

const publicPath = "https://www.uniprot.org/";

// Below, specify namespace (no default) and query (defaults to "*")
const fileGenerators = [
  // Website generic pages
  uniprotWebsiteFileGenerator({ namespace: "uniprot-website" }),
  // UniProtKB
  uniprotkbFileGenerator({
    namespace: "uniprotkb",
    query: "(organism_id:9606) OR (reviewed:true)",
  }),
  // UniRef
  unirefFileGenerator({
    namespace: "uniref",
    query: "(identity:0.5) AND (taxonomy_id:9606)",
  }),
  // UniParc: skip, incredibly slow
  // uniparcFileGenerator({
  //   namespace: "uniparc",
  //   query: "(active:*) AND (taxonomy_id:9606) AND (database_facet:1)",
  // }),
  // Proteomes
  proteomesFileGenerator({
    namespace: "proteomes",
    query: "(proteome_type:1)",
  }),
  // Taxonomy
  supportingDataFileGenerator({
    namespace: "taxonomy",
    query: "* AND (taxonomies_with:1_uniprotkb)",
  }),
  // Keywords
  supportingDataFileGenerator({ namespace: "keywords" }),
  citationsFileGenerator({
    namespace: "citations",
    query: "* AND (citations_with:1_uniprotkb)",
  }),
  // Diseases
  supportingDataFileGenerator({ namespace: "diseases" }),
  // Database
  databaseFileGenerator({ namespace: "database" }),
  // Locations
  supportingDataFileGenerator({ namespace: "locations" }),
  // UniRule
  automaticAnnotationsFileGenerator({ namespace: "unirule" }),
  // ARBA
  automaticAnnotationsFileGenerator({ namespace: "arba" }),
  // Help
  articleGenerator({ namespace: "help" }),
  // Release Notes
  articleGenerator({ namespace: "release-notes" }),
];

const main = async () => {
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.mkdirSync(buildDir);

  // Note: might want to pipe it through a gzip stream
  const writableStream = fs.createWriteStream(
    path.join(buildDir, "sitemap-index.xml")
  );
  writableStream.on("error", (error) => {
    console.log(
      `An error occured while writing to the index file. Error: ${error.message}`
    );
  });
  writableStream.write(sitemapIndexFile.start);
  for (const fileGenerator of fileGenerators) {
    for await (const filename of fileGenerator()) {
      writableStream.write(sitemapIndexFile.file(publicPath + filename));
    }
  }
  writableStream.end(sitemapIndexFile.end);
};

main().catch((err) => console.error(err.message));
