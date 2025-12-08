#!/bin/sh

# Database Integrity Verification Script
# Verifies that init.sql and configuration files haven't been tampered with

echo "========================================"
echo "Database Integrity Verification"
echo "========================================"

INTEGRITY_FILE="/docker-entrypoint-initdb.d/integrity.sha256"

if [ ! -f "$INTEGRITY_FILE" ]; then
    echo "ERROR: Integrity file not found at $INTEGRITY_FILE"
    exit 1
fi

cd /docker-entrypoint-initdb.d

echo "Verifying file integrity..."
if sha256sum -c "$INTEGRITY_FILE" -s; then
    echo "✓ All integrity checks passed"
    echo "✓ Database init files verified successfully"
    exit 0
else
    echo "✗ INTEGRITY VIOLATION DETECTED!"
    echo "✗ One or more files have been modified"
    echo "✗ Container startup aborted for security"
    exit 1
fi
