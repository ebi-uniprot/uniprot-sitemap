#!/usr/bin/env node
const { program } = require("commander");

program
  .command("index", "generate the sitemap index out of the existing files")
  .command("clear", "clear the output directory")
  .command(
    "sitemap",
    "generate the sitemap individual files for specific namespaces"
  );

program.parse(process.argv);
