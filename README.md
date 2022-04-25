# About

This script generates a sitemap for uniprot currently using the first 500 entries returned from the UniProtKB query `(organism_id:9606) OR (reviewed:true)`.

# To run

[NVM](https://github.com/nvm-sh/nvm) has been installed on `noah-login` for `uni_adm`.

```
nvm install --lts  # Install LTS version of node
npm install        # Install all needed packages
node src/index.js  # Run index.js script
```
