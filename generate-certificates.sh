#!/bin/bash

set -e

echo "Generating TLS Certificates for Secure Document Vault..."

# Create certs directory
mkdir -p certs
cd certs

# Generate CA private key
echo "1/7 Generating CA private key..."
openssl genrsa -out ca-key.pem 2048 2>/dev/null

# Generate CA certificate
echo "2/7 Generating CA certificate..."
openssl req -new -x509 -days 365 -key ca-key.pem -out ca-cert.pem \
  -subj "/C=US/ST=State/L=City/O=SecureVault/OU=CA/CN=SecureVault-CA" 2>/dev/null

# Generate server private key
echo "3/7 Generating server private key..."
openssl genrsa -out server-key.pem 2048 2>/dev/null

# Generate server certificate signing request
echo "4/7 Generating server CSR..."
openssl req -new -key server-key.pem -out server-req.pem \
  -subj "/C=US/ST=State/L=City/O=SecureVault/OU=Server/CN=localhost" 2>/dev/null

# Sign server certificate with CA
echo "5/7 Signing server certificate..."
openssl x509 -req -days 365 -in server-req.pem -CA ca-cert.pem -CAkey ca-key.pem \
  -CAcreateserial -out server-cert.pem 2>/dev/null

# Generate client private key
echo "6/7 Generating client private key..."
openssl genrsa -out client-key.pem 2048 2>/dev/null

# Generate client certificate signing request
echo "7/7 Generating client certificate..."
openssl req -new -key client-key.pem -out client-req.pem \
  -subj "/C=US/ST=State/L=City/O=SecureVault/OU=Client/CN=backend-client" 2>/dev/null

# Sign client certificate with CA
openssl x509 -req -days 365 -in client-req.pem -CA ca-cert.pem -CAkey ca-key.pem \
  -CAcreateserial -out client-cert.pem 2>/dev/null

# Copy server cert/key for nginx compatibility
cp server-cert.pem server.crt
cp server-key.pem server.key

# Set permissions
chmod 644 *.pem *.crt 2>/dev/null || true
chmod 600 *-key.pem server.key 2>/dev/null || true

echo "All certificates generated successfully in ./certs/"
echo ""
echo "Generated files:"
echo "  - ca-cert.pem, ca-key.pem (Certificate Authority)"
echo "  - server-cert.pem, server-key.pem (Server certificates)"
echo "  - client-cert.pem, client-key.pem (Client certificates)"
echo ""
