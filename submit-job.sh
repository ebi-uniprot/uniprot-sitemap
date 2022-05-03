#!/usr/bin/env bash

bsub \
-q production-rh74 \
-J "uniprot-sitemap" \
-e log.e \
-o log.o \
-M 2000 \
-R"select[mem>2000] rusage[mem=2000] span[hosts=1]" \
-n 1 \
./run.sh