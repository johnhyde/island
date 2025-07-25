#!/bin/bash

# Build script for Flying Island novel site

# Create site directory if it doesn't exist
mkdir -p site

# Find all markdown files, format them as JSON, and build the final JSON file
find . -maxdepth 1 -name '[0-9][0-9]*.md' | sort -V | \
  jq -R '{"filename": ., "title": sub("^./[0-9]+ "; "") | sub("\\.md$"; "")}' | \
  jq -s '{"chapters": .}' > site/chapters.json

echo "Generated site/chapters.json with $(jq '.chapters | length' site/chapters.json) chapters"
