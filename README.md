# About

This script generates a sitemap for uniprot currently using the first 500 entries returned from the UniProtKB query `(organism_id:9606) OR (reviewed:true)`.

# To run

**Only run on HX login nodes**

because:

1. [NVM](https://github.com/nvm-sh/nvm) has been installed on `noah-login` for `uni_adm`.
2. The built sitemap is rsync'd across to HH.

To generate and sync sitemaps:

```
./run.sh
```
