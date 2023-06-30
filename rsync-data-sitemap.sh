# Run from codon as uni_adm

rsync -av --delete --include='data-*' --exclude='*' /nfs/production/martin/uniprot/production/sitemap/prod/XXXX_XX/data/ noah-login:/net/isilonP/public/rw/uniprot/uniprot-sitemap/build
rsync -av --delete --include='data-*' --exclude='*' /nfs/production/martin/uniprot/production/sitemap/prod/XXXX_XX/data/ pg-001:/net/isilonP/public/rw/uniprot/uniprot-sitemap/build