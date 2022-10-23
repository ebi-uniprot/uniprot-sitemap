#!/usr/bin/env node
const fs = require("node:fs");

const { buildDir } = require("./shared");

const main = () => {
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.mkdirSync(buildDir);
};

main();
