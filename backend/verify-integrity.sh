#!/bin/sh

# Backend Integrity Verification Script
# Verifies that critical configuration and code files haven't been tampered with

echo "========================================"
echo "Backend Integrity Verification"
echo "========================================"

INTEGRITY_FILE="/app/integrity.sha256"

if [ ! -f "$INTEGRITY_FILE" ]; then
    echo "ERROR: Integrity file not found at $INTEGRITY_FILE"
    exit 1
fi

cd /app

echo "Verifying file integrity..."
if sha256sum -c "$INTEGRITY_FILE" -s; then
    echo "✓ All integrity checks passed"
    echo "✓ Backend files verified successfully"
    exit 0
else
    echo "✗ INTEGRITY VIOLATION DETECTED!"
    echo "✗ One or more files have been modified"
    echo "✗ Container startup aborted for security"
    exit 1
fi
