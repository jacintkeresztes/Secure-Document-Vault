#!/bin/bash

# Certificate Generation Script for Secure Document Vault
# This script generates self-signed TLS certificates for development

set -e

# Configuration
CERT_DIR="./certs"
DOMAIN="vault.local"
DAYS_VALID=365
KEY_SIZE=2048

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Secure Document Vault Certificate Generator ===${NC}"
echo ""

# Create certificate directory
if [ ! -d "$CERT_DIR" ]; then
    echo "Creating certificate directory..."
    mkdir -p "$CERT_DIR"
fi

cd "$CERT_DIR"

# Step 1: Generate private key
echo -e "${YELLOW}[1/4] Generating RSA private key (${KEY_SIZE} bits)...${NC}"
openssl genrsa -out server.key $KEY_SIZE 2>/dev/null
chmod 400 server.key
echo -e "${GREEN}✓ Private key generated: server.key${NC}"
echo ""

# Step 2: Create OpenSSL configuration for SAN
echo -e "${YELLOW}[2/4] Creating OpenSSL configuration...${NC}"
cat > openssl.cnf <<EOF
[req]
default_bits = $KEY_SIZE
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C = PT
ST = Lisbon
L = Lisbon
O = University
OU = Cryptography Course
CN = $DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = *.$DOMAIN
DNS.3 = api.$DOMAIN
DNS.4 = localhost
IP.1 = 127.0.0.1
EOF
echo -e "${GREEN}✓ Configuration created: openssl.cnf${NC}"
echo ""

# Step 3: Generate Certificate Signing Request (CSR)
echo -e "${YELLOW}[3/4] Generating Certificate Signing Request...${NC}"
openssl req -new -key server.key -out server.csr -config openssl.cnf
echo -e "${GREEN}✓ CSR generated: server.csr${NC}"
echo ""

# Step 4: Generate self-signed certificate
echo -e "${YELLOW}[4/4] Generating self-signed certificate (valid for $DAYS_VALID days)...${NC}"
openssl x509 -req -days $DAYS_VALID -in server.csr -signkey server.key \
    -out server.crt -extensions v3_req -extfile openssl.cnf
chmod 444 server.crt
echo -e "${GREEN}✓ Certificate generated: server.crt${NC}"
echo ""

# Verify certificate
echo -e "${YELLOW}Verifying certificate...${NC}"
openssl x509 -in server.crt -text -noout | grep -A1 "Subject:"
openssl x509 -in server.crt -text -noout | grep -A3 "Subject Alternative Name"
echo ""

# Create combined PEM file (some servers need this)
cat server.crt server.key > server.pem
chmod 400 server.pem
echo -e "${GREEN}✓ Combined PEM created: server.pem${NC}"
echo ""

# Summary
echo -e "${GREEN}=== Certificate Generation Complete ===${NC}"
echo ""
echo "Generated files:"
echo "  - server.key  (Private key - KEEP SECRET)"
echo "  - server.crt  (Public certificate)"
echo "  - server.csr  (Certificate signing request)"
echo "  - server.pem  (Combined certificate + key)"
echo "  - openssl.cnf (OpenSSL configuration)"
echo ""
echo "Certificate Details:"
echo "  Domain: $DOMAIN"
echo "  Valid for: $DAYS_VALID days"
echo "  Key size: $KEY_SIZE bits"
echo "  Signature: SHA-256 with RSA"
echo ""
echo -e "${YELLOW}⚠ WARNING: This is a SELF-SIGNED certificate for DEVELOPMENT ONLY${NC}"
echo "Browsers will show security warnings. For production, use a CA-signed certificate."
echo ""

# Optional: Test certificate
read -p "Would you like to test the certificate with OpenSSL s_server? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting test server on https://localhost:4433"
    echo "Press Ctrl+C to stop"
    echo "Test with: curl -k https://localhost:4433"
    openssl s_server -key server.key -cert server.crt -accept 4433 -www
fi