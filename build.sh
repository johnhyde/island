#!/bin/bash

# Build script for Flying Island novel site
# Scans for numbered chapter files and generates chapters.json

echo "Scanning for chapter files..."

# Create temporary file for chapter data
temp_file=$(mktemp)

# Find all numbered markdown files and process them in order
find . -maxdepth 1 -name '[0-9][0-9]*.md' -type f | sort -V | while read filepath; do
    # Remove the ./ prefix
    file="${filepath#./}"
    
    # Extract the base filename without extension
    basename_no_ext="${file%.md}"
    
    # Remove the number prefix (e.g., "01 " -> "")
    title_part="${basename_no_ext#[0-9][0-9] }"
    
    # If there's no space after numbers, try without space
    if [ "$title_part" = "$basename_no_ext" ]; then
        title_part="${basename_no_ext#[0-9][0-9]}"
    fi
    
    # Capitalize each word (handle spaces properly)
    title=$(echo "$title_part" | sed 's/\b\w/\U&/g')
    
    # Write to temp file
    echo "$file|$title" >> "$temp_file"
    
    echo "Found: $file -> $title"
done

# Create site directory if it doesn't exist
mkdir -p site

# Now build the JSON file
echo '{' > site/chapters.json
echo '  "chapters": [' >> site/chapters.json

first_chapter=true
while IFS='|' read -r filename title; do
    # Add comma if not the first chapter
    if [ "$first_chapter" = false ]; then
        echo "," >> site/chapters.json
    fi
    first_chapter=false
    
    # Write the chapter entry (without trailing comma)
    echo "    {" >> site/chapters.json
    echo "      \"filename\": \"$filename\"," >> site/chapters.json
    echo "      \"title\": \"$title\"" >> site/chapters.json
    echo -n "    }" >> site/chapters.json
done < "$temp_file"

# Close the JSON
echo "" >> site/chapters.json
echo "  ]" >> site/chapters.json
echo "}" >> site/chapters.json

# Clean up
rm "$temp_file"

echo "Generated site/chapters.json with $(grep -c '"filename"' site/chapters.json) chapters"