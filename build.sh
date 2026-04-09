#!/bin/bash

echo Running the build script for Flying Island novel site...

# Create site directory if it doesn't exist
mkdir -p site

#TODO: refactor this script more.

wordcount_page() {
  echo "wordcounting..."
  echo '<pre>'
  ./wordcount.sh
  echo '</pre>'
}

echo wordcounting...
wordcount_page >"A9 wordcounts.jd"

jq_json() {
  # Find all johndown files, format them as JSON, and build the final JSON file
  find . -maxdepth 1 -name '[0-A][0-9]*.jd' | sort -V | \
    jq --raw-input --binary '{"filename": ., "title": sub("^./[0-A][0-9]* "; "") | sub("\\.jd$"; "")}' | \
    jq --slurp --binary '{"chapters": .}'
}

#use this same logic in the filter, maybe?? Or maybe use stderr better and pass through the file untouched if there is no jq?
if ! command -v jq; then
  echo "jq is not installed; skipping json refresh. If a new chapter is missing from the site, this is why."
else
  echo "jqing..."
  jq_json >site/chapters.json
  echo "Generated site/chapters.json with $(jq '.chapters | length' site/chapters.json) chapters"
fi
