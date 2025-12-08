#!/bin/bash

# Script to generate SHA256 checksums for all files in a directory
# Usage: ./generate-checksums.sh <directory>

if [ $# -eq 0 ]; then
    echo "Error: No directory provided"
    echo "Usage: ./generate-checksums.sh <directory>"
    exit 1
fi

TARGET_DIR="$1"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Directory '$TARGET_DIR' does not exist"
    exit 1
fi

OUTPUT_FILE="$TARGET_DIR/integrity.sha256"

echo "Generating checksums for files in: $TARGET_DIR"
echo "Output file: $OUTPUT_FILE"
echo ""

# Remove old checksums file if it exists
rm -f "$OUTPUT_FILE"

# Find all files (not directories) and generate checksums
# Using find to handle files recursively
find "$TARGET_DIR" -type f -not -path "*/integrity.sha256" | while read -r file; do
    # Calculate relative path from target directory
    rel_path="${file#$TARGET_DIR/}"

    # Generate checksum (using relative path for portability)
    (cd "$TARGET_DIR" && sha256sum "$rel_path") >> "$OUTPUT_FILE"
done

# Sort the checksums file for consistency
sort -o "$OUTPUT_FILE" "$OUTPUT_FILE"

echo "Checksums generated successfully"
echo ""
echo "Files included:"
wc -l < "$OUTPUT_FILE"
