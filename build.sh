#!/bin/bash

# Create site directory if it doesn't exist
mkdir -p site

WORDCOUNT_FILE="A9 wordcounts.jd"
CHAPTERS_FILE="site/chapters.json"

wordcount_page() {
  echo '<pre>'
  ./wordcount.sh
  echo '</pre>'
}

jq_json() {
  # Find all johndown files, format them as JSON, and build the final JSON file
  find . -maxdepth 1 -name '[0-A][0-9]*.jd' | sort -V | \
    jq --raw-input --binary '{"filename": ., "title": sub("^./[0-A][0-9]* "; "") | sub("\\.jd$"; "")}' | \
    jq --slurp --binary '{"chapters": .}'
}

all() {
  echo Running the build script for Flying Island novel site...

  echo "wordcounting to $WORDCOUNT_FILE..."
  wordcount_page >"$WORDCOUNT_FILE"

  #use this same logic in the filter, maybe?? Or maybe use stderr better and pass through the file untouched if there is no jq?
  if ! command -v jq; then
    echo "jq is not installed; skipping json refresh. If a new chapter is missing from the site, this is why."
  else
    echo "jqing..."
    jq_json >"$CHAPTERS_FILE"
    echo "Generated site/chapters.json with $(jq '.chapters | length' site/chapters.json) chapters"
  fi
}

#dispatching for the git filters, or do the normal thing if no arguments are given.
if [ "$1" == "$WORDCOUNT_FILE" ]; then
  wordcount_page
elif [ "$1" == "$CHAPTERS_FILE" ]; then
  jq_json
else
  all
fi
