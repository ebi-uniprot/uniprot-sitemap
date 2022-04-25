#!/usr/bin/env bash

# Terminate on any errors
set -e

# Ensure NVM is available
. ~/.nvm/nvm.sh

# Install LTS version of node
nvm install --lts

# Install all needed packages
npm install

# Run index.js script
node src/index.js

# Sync across to production machine
rsync -avz --delete build pg-001:/net/isilonP/public/rw/uniprot/uniprot-sitemap