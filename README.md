# Secure Document Vault

Secure file storage system with comprehensive cryptographic controls implementing TLS 1.2/1.3, AES-256-GCM encryption, Argon2id password hashing, and JWT authentication.

![Architecture Diagram](docs/architecture.png)

## Features

- **TLS 1.2/1.3** for all network communications
- **AES-256-GCM** file encryption with DEK/KEK architecture
- **Argon2id** password hashing (memory-hard, GPU-resistant)
- **JWT authentication** with refresh token mechanism (15min access, 7-day refresh)
- **X.509 certificates** (RSA-2048) for TLS
- **SHA-256 integrity verification** at container startup
- **Docker containerized** (nginx, Node.js, MySQL)

## Architecture

| Service | Container | Port | Protocol |
|---------|-----------|------|----------|
| Frontend | nginx:alpine | 443, 80 | HTTPS |
| Backend | node:20-alpine | 3000 | HTTPS |
| Database | mysql:8.0 | 3306 | TLS |

## Quick Start

### Prerequisites

Install Docker Desktop for your system:
- **Windows/Mac**: Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: `sudo apt-get install docker.io docker-compose` (Ubuntu/Debian) or `sudo yum install docker docker-compose` (RHEL/CentOS)

### Installation

Open a terminal and run these commands:

```bash
# 1. Clone the repository
git clone https://github.com/jacintkeresztes/Secure-Document-Vault.git
cd Secure-Document-Vault

# 2. Generate TLS certificates
chmod +x generate-certificates.sh
./generate-certificates.sh

# 3. Set up environment variables
cp .env.example .env
```

Edit the `.env` file with any text editor and set these values:
- `JWT_SECRET` → any random string (e.g., `mySecretKey12345`)
- `DB_PASSWORD` → database password (e.g., `dbPassword123`)
- `DB_ROOT_PASSWORD` → root database password (e.g., `rootPass456`)

```bash
# 4. Generate integrity checksums
chmod +x generate-checksums.sh
./generate-checksums.sh frontend
./generate-checksums.sh backend
./generate-checksums.sh backend/db

# 5. Build and start the application
docker-compose up --build -d

# 6. Wait ~30 seconds for services to start, then open your browser
```

**Access the application**: Open https://localhost in your browser

**Note**: You'll see a security warning about the certificate (because it's self-signed). Click "Advanced" → "Proceed to localhost" to continue.

### First Use

1. Click "Register" to create an account
2. Enter email and password
3. Login with your credentials
4. Upload files - they'll be encrypted automatically
5. Download/delete files as needed

### Stopping the Application

```bash
docker-compose down
```

### Troubleshooting

**Port already in use?**
```bash
# Check what's using port 443
sudo lsof -i :443
# Stop the application using it, or edit docker-compose.yml to use different ports
```

**Containers won't start?**
```bash
# Check logs
docker-compose logs
```

**Need to reset everything?**
```bash
docker-compose down -v  # Warning: deletes all data
```

## Security

**Cryptographic Components:**
- TLS 1.2/1.3 (RSA-2048, ECDHE key exchange)
- AES-256-GCM (authenticated encryption)
- Argon2id (64 MB memory, 3 iterations)
- HMAC-SHA512 (JWT signing)
- SHA-256 (integrity verification, KEK derivation)

**NIST SP 800-57 compliant** - All algorithms valid through 2030.

See `other/cbom.json` for complete cryptographic inventory.
