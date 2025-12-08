#!/bin/sh

# Frontend Integrity Verification Script
# Verifies that critical configuration and code files haven't been tampered with

echo "========================================"
echo "Frontend Integrity Verification"
echo "========================================"

INTEGRITY_FILE="/usr/share/nginx/html/integrity.sha256"

if [ ! -f "$INTEGRITY_FILE" ]; then
    echo "ERROR: Integrity file not found at $INTEGRITY_FILE"
    exit 1
fi

cd /usr/share/nginx/html

echo "Verifying file integrity..."
if sha256sum -c "$INTEGRITY_FILE" -s; then
    echo "✓ All integrity checks passed"
    echo "✓ Frontend files verified successfully"
    exit 0
else
    echo "✗ INTEGRITY VIOLATION DETECTED!"
    echo "✗ One or more files have been modified"
    echo "✗ Container startup aborted for security"
    exit 1
fi
