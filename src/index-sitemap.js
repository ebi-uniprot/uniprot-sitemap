#!/usr/bin/env node
const fs = require("node:fs");

const { program, Option } = require("commander");

const { buildDir } = require("./shared");

const uniprotWebsiteFileCreator = require("./namespaces/uniprot-website");

const uniprotkbFileCreator = require("./namespaces/uniprotkb");
const unirefFileCreator = require("./namespaces/uniref");
const uniparcFileCreator = require("./namespaces/uniparc");
const proteomesFileCreator = require("./namespaces/proteomes");

const citationsFileCreator = require("./namespaces/citations");
const supportingDataFileCreator = require("./namespaces/supporting-data");
const databaseFileCreator = require("./namespaces/database");

const automaticAnnotationsFileCreator = require("./namespaces/automatic-annotations");

const articleCreator = require("./namespaces/articles");

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

const topTaxonsQuery = (cutoff = topTaxons.length) =>
  topTaxons
    .slice(0, cutoff)
    .map((taxon) => `(taxonomy_id:${taxon})`)
    .join(" OR ");

// Below, specify namespace (no default) and query (defaults to "*")
const fileCreators = {
  // Website generic pages
  "uniprot-website": uniprotWebsiteFileCreator({
    namespace: "uniprot-website",
  }),
  // UniProtKB
  uniprotkb: uniprotkbFileCreator({
    namespace: "uniprotkb",
    query: `(reviewed:true) OR ${topTaxonsQuery()} OR (annotation_score:5) OR (annotation_score:4) OR (annotation_score:3)`,
  }),
  // UniRef
  uniref: unirefFileCreator({
    namespace: "uniref",
    query: `${topTaxonsQuery()}`,
  }),
  // UniParc
  uniparc: uniparcFileCreator({
    namespace: "uniparc",
    // database_facet:1 = UniProtKB
    query: `(active:*) AND (${topTaxonsQuery(12)}) AND (database_facet:100)`,
  }),
  // Proteomes
  proteomes: proteomesFileCreator({
    namespace: "proteomes",
    query: "(proteome_type:1)",
  }),
  // Taxonomy
  taxonomy: supportingDataFileCreator({ namespace: "taxonomy" }),
  // Keywords
  keywords: supportingDataFileCreator({ namespace: "keywords" }),
  citations: citationsFileCreator({ namespace: "citations" }),
  // Diseases
  diseases: supportingDataFileCreator({ namespace: "diseases" }),
  // Database
  database: databaseFileCreator({ namespace: "database" }),
  // Locations
  locations: supportingDataFileCreator({ namespace: "locations" }),
  // UniRule
  unirule: automaticAnnotationsFileCreator({ namespace: "unirule" }),
  // ARBA
  arba: automaticAnnotationsFileCreator({ namespace: "arba" }),
  // Help
  help: articleCreator({ namespace: "help" }),
  // Release Notes
  "release-notes": articleCreator({ namespace: "release-notes" }),
};

program.addOption(
  new Option(
    '"-n,--namespaces <namespaces...>',
    "specify which namespaces to use to generate these sitemap files"
  )
    .choices(Object.keys(fileCreators))
    .makeOptionMandatory(true)
);

program.parse(process.argv);

const main = async ({ namespaces }) => {
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }

  for (const namespace of namespaces) {
    await fileCreators[namespace]();
  }
};

main(program.opts()).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
