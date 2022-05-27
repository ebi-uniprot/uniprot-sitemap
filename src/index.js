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

const topTaxons = [
  9606, //	Homo sapiens
  10090, //	Mus musculus
  3702, //	Arabidopsis thaliana
  83333, //	Escherichia coli (strain K12)
  10116, //	Rattus norvegicus
  559292, //	Saccharomyces cerevisiae (strain ATCC 204508 / S288c)
  7227, //	Drosophila melanogaster
  9913, //	Bos taurus
  6239, //	Caenorhabditis elegans
  39947, //	Oryza sativa subsp. japonica
  224308, //	Bacillus subtilis (strain 168)
  7955, //	Danio rerio
  562, //	Escherichia coli
  9823, //	Sus scrofa
  9031, //	Gallus gallus
  694009, //	Severe acute respiratory syndrome coronavirus
  10658, //	Enterobacteria phage PRD1
  83332, //	Mycobacterium tuberculosis (strain ATCC 25618 / H37Rv)
  284812, //	Schizosaccharomyces pombe (strain 972 / ATCC 24843)
  3847, //	Glycine max
  4577, //	Zea mays
  9615, //	Canis lupus familiaris
  8355, //	Xenopus laevis
  9986, //	Oryctolagus cuniculus
  208964, //	Pseudomonas aeruginosa (strain ATCC 15692 / DSM 22644 / CIP 104116 / JCM 14847 / LMG 12228 / 1C / PRS 101 / PAO1)
  4565, //	Triticum aestivum
  9598, //	Pan troglodytes
  2697049, //	Severe acute respiratory syndrome coronavirus 2
  44689, //	Dictyostelium discoideum
  9544, //	Macaca mulatta
  8022, //	Oncorhynchus mykiss
  485, //	Neisseria gonorrhoeae
  9940, //	Ovis aries
  9483, //	Callithrix jacchus
  99287, //	Salmonella typhimurium (strain LT2 / SGSC1412 / ATCC 700720)
  3055, //	Chlamydomonas reinhardtii
  1280, //	Staphylococcus aureus
  9541, //	Macaca fascicularis
  4081, //	Solanum lycopersicum
  5833, //	Plasmodium falciparum
  9796, //	Equus caballus
  9601, //	Pongo abelii
  4097, //	Nicotiana tabacum
  112509, //	Hordeum vulgare subsp. vulgare
  90675, //	Camelina sativa
  29760, //	Vitis vinifera
  83334, //	Escherichia coli O157:H7
  237561, //	Candida albicans (strain SC5314 / ATCC MYA-2876)
  45351, //	Nematostella vectensis
  8030, //	Salmo salar
  11676, //	Human immunodeficiency virus 1
];

const topTaxonsQuery = topTaxons
  .map((taxon) => `(taxonomy_id:${taxon})`)
  .join(" OR ");

// Below, specify namespace (no default) and query (defaults to "*")
const fileGenerators = [
  // Website generic pages
  uniprotWebsiteFileGenerator({ namespace: "uniprot-website" }),
  // UniProtKB
  uniprotkbFileGenerator({
    namespace: "uniprotkb",
    query: `(reviewed:true) OR ${topTaxonsQuery}`,
  }),
  // UniRef
  unirefFileGenerator({
    namespace: "uniref",
    query: `(identity:0.5) AND (${topTaxonsQuery})`,
  }),
  // UniParc: skip, incredibly slow
  // uniparcFileGenerator({
  //   namespace: "uniparc",
  //   // database_facet:1 = UniProtKB
  //   query: "(active:*) AND (taxonomy_id:9606) AND (database_facet:1)",
  // }),
  // Proteomes
  proteomesFileGenerator({
    namespace: "proteomes",
    // Reference proteomes OR Other proteomes (excluded Redundant and Excluded)
    query: "(proteome_type:1) OR (proteome_type:2)",
  }),
  // Taxonomy
  supportingDataFileGenerator({ namespace: "taxonomy" }),
  // Keywords
  supportingDataFileGenerator({ namespace: "keywords" }),
  citationsFileGenerator({ namespace: "citations" }),
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

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
