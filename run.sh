#!/usr/bin/env bash

# Terminate on any errors
set -e

# Ensure NVM is available
. ~/.nvm/nvm.sh

# Install LTS version of node
nvm install --lts

# Install all needed packages
npm install

# Run index.js scripts
# Clear build directory
node src/index.js clear

# Generate multiple sitemaps at once
node src/index.js sitemap --namespaces uniprotkb &
node src/index.js sitemap --namespaces uniref &
node src/index.js sitemap --namespaces uniparc &
node src/index.js sitemap --namespaces proteomes &
node src/index.js sitemap --namespaces taxonomy &
node src/index.js sitemap --namespaces citations &
node src/index.js sitemap --namespaces uniprot-website keywords diseases database locations unirule arba help release-notes &

wait

node src/index.js index

# Sync across to production machine
rsync -avz --delete build pg-001:/net/isilonP/public/rw/uniprot/uniprot-sitemap