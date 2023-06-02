#!/usr/bin/env bash

# Run from codon as uni_adm

rsync -av --delete --include='data-*' --exclude='*' /nfs/production/martin/uniprot/production/sitemap/prod/2023_02/data/ noah-login:/net/isilonP/public/rw/uniprot/uniprot-sitemap/build
rsync -av --delete --include='data-*' --exclude='*' /nfs/production/martin/uniprot/production/sitemap/prod/2023_02/data/ pg-001:/net/isilonP/public/rw/uniprot/uniprot-sitemap/build