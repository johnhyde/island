#!/bin/bash

echo Running the build script for Flying Island novel site...

# Create site directory if it doesn't exist
mkdir -p site

echo "wordcounting..."
echo '<pre>' > "A9 wordcounts.jd"
./wordcount.sh >> "A9 wordcounts.jd"
echo '</pre>' >> "A9 wordcounts.jd"

echo "jqing..."
if ! command -v jq; then
  echo "jq is not installed; skipping json refresh. If a new chapter is missing from the site, this is why."
else
  # Find all johndown files, format them as JSON, and build the final JSON file
  find . -maxdepth 1 -name '[0-A][0-9]*.jd' | sort -V | \
    jq --raw-input --binary '{"filename": ., "title": sub("^./[0-A][0-9]* "; "") | sub("\\.jd$"; "")}' | \
    jq --slurp --binary '{"chapters": .}' > site/chapters.json
  echo "Generated site/chapters.json with $(jq '.chapters | length' site/chapters.json) chapters"
fi
