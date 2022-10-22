#!/usr/bin/env bash

bsub \
-q production \
-J "uniprot-sitemap" \
-eo log.e \
-oo log.o \
-M 1000 \
-R"select[mem>1000] rusage[mem=1000] span[hosts=1]" \
-n 2 \
./run.sh