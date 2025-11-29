# Secure-Document-Vault

This project is about a Secure Document Vault. The user accesses the web application via a website, log in or registers. After that they can upload or download files which will be encrypted and stored in the database.

# Technologies
## Frontend
- Lightweight client-side rendering without fancy animations.
- HTML, CSS, JS, BootStrap

## Backend
- Async I/O ideal for file operations. Typescript adds extra type safety. Express is a node.js web framework
- Node.js with Typescript, Express.js

## Third-Party
- Twilio for email, sms notification

## Database
- MySQL 8

## Container architecture
```text
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐  │
│  │ Frontend │  │ Backend  │  │ MySQL │  │
│  │          │  │          │  │       │  │
│  │ Port 443 │  │ Port 3000│  │ 3306  │  │
│  └──────────┘  └──────────┘  └───────┘  │
│        │              │           │     │
│        └──────TLS─────┴───────────┘     │
│                                         │
└─────────────────────────────────────────┘
         │
         └─────> External: Twilio API
```
## Cryptography
- TLS 1.3: encryption of HTTP traffic
- AES-256-GCM for file encryption, data at rest
- Argon2id library for hashing passwords
- JWT with HMAC-SHA256 for authenticated sessions (npm jsonwebtoken)
- npm crypto for general hashing and random key/IV generation
- *Post-Quantum:* ML-KEM for key encapsulation in future

## Hosting
- Containerized with Docker Compose
- Frontend, Backend, DB separated
- Hosted possibly on DigitalOcean Droplet or self host

## Domain
- Primary domain: vault.local
- Frontend: https://vault.local:443
- Backend api: https://api.vault.local:3000

## Certificates
- Self-signed with OpenSSL

# Functionalities
- Login, Authentication
- File upload
- File download

# Data flows
## User registration
```text
Client                  Backend                 Database
  |                        |                        |
  |--POST /api/register--->|                        |
  | {email, password}      |                        |
  |                        |                        |
  |                        |--Hash password-------->|
  |                        |  Argon2id(password,    |
  |                        |  random_salt)          |
  |                        |                        |
  |                        |--Store user----------->|
  |                        |  {email, hash, salt}   |
  |                        |                        |
  |<---201 Created---------|                        |
  |                        |                        |
```
## Login/Auth
```text
Client                  Backend                 Database
  |                        |                        |
  |--POST /api/login------>|                        |
  | {email, password}      |                        |
  |                        |                        |
  |                        |--Retrieve user-------->|
  |                        |<--{email,hash,salt}----|
  |                        |                        |
  |                        |--Verify password-------|
  |                        |  Argon2id.verify()     |
  |                        |                        |
  |                        |--Generate JWT----------|
  |                        |  sign({user_id, email},|
  |                        |       JWT_SECRET,      |
  |                        |       {expiresIn:24h}) |
  |                        |                        |
  |<---200 OK--------------|                        |
  | {token: "..."}         |                        |
  |                        |                        |
```
## File upload
```text
Client                  Backend                 Database
  |                        |                        |
  |--POST /api/upload----->|                        |
  | Authorization: Bearer  |                        |
  | Content-Type: multipart|                        |
  | File: document.pdf     |                        |
  |                        |                        |
  |                        |--Verify JWT----------->|
  |                        |  HMAC.verify(token)    |
  |                        |                        |
  |                        |--Hash original file----|
  |                        |  SHA512(file_data)     |
  |                        |  => file_hash          |
  |                        |                        |
  |                        |--Generate DEK----------|
  |                        |  crypto.randomBytes(32)|
  |                        |  => DEK                |
  |                        |                        |
  |                        |--Generate IV-----------|
  |                        |  crypto.randomBytes(12)|
  |                        |  => IV                 |
  |                        |                        |
  |                        |--Encrypt file----------|
  |                        |  AES-256-GCM(          |
  |                        |    key: DEK,           |
  |                        |    iv: IV,             |
  |                        |    data: file_data     |
  |                        |  )                     |
  |                        |  => ciphertext + tag   |
  |                        |                        |
  |                        |--Wrap DEK--------------|
  |                        |  AES-256-GCM(          |
  |                        |    key: KEK,           |
  |                        |    iv: kek_iv,         |
  |                        |    data: DEK           |
  |                        |  )                     |
  |                        |  => encrypted_DEK      |
  |                        |                        |
  |                        |--Store record--------->|
  |                        |  INSERT INTO files:    |
  |                        |  {                     |
  |                        |    user_id,            |
  |                        |    filename,           |
  |                        |    ciphertext,         |
  |                        |    encrypted_dek,      |
  |                        |    iv,                 |
  |                        |    auth_tag,           |
  |                        |    file_hash,          |
  |                        |    upload_timestamp    |
  |                        |  }                     |
  |                        |<-----------------------|
  |                        |                        |
  |                        |--Notify via Twilio---->|
  |                        |  POST api.twilio.com   |
  |                        |  "File uploaded"       |
  |                        |                        |
  |<---200 OK--------------|                        |
  | {file_id, message}     |                        |
  |                        |                        |
```
## File download
```text
Client                  Backend                 Database
  |                        |                        |
  |--GET /api/file/123---->|                        |
  | Authorization: Bearer  |                        |
  |                        |                        |
  |                        |--Verify JWT----------->|
  |                        |                        |
  |                        |--Authorization check---|
  |                        |  Verify user_id owns   |
  |                        |  file_id               |
  |                        |                        |
  |                        |--Retrieve record------>|
  |                        |<--{encrypted file data}|
  |                        |                        |
  |                        |--Unwrap DEK------------|
  |                        |  AES-256-GCM.decrypt(  |
  |                        |    key: KEK,           |
  |                        |    iv: kek_iv,         |
  |                        |    data: encrypted_dek |
  |                        |  )                     |
  |                        |  => DEK                |
  |                        |                        |
  |                        |--Decrypt file----------|
  |                        |  AES-256-GCM.decrypt(  |
  |                        |    key: DEK,           |
  |                        |    iv: IV,             |
  |                        |    data: ciphertext,   |
  |                        |    tag: auth_tag       |
  |                        |  )                     |
  |                        |  => plaintext_file     |
  |                        |                        |
  |                        |--Verify integrity------|
  |                        |  SHA512(plaintext_file)|
  |                        |  compare with file_hash|
  |                        |                        |
  |<---200 OK--------------|                        |
  | Content-Type: app/pdf  |                        |
  | Content-Disposition    |                        |
  | {decrypted file data}  |                        |
  |                        |                        |
```
# File tree
```text
Secure-Document-Vault
 ┣ backend
 ┃ ┣ src
 ┃ ┃ ┣ models
 ┃ ┃ ┣ routes
 ┃ ┃ ┣ services
 ┃ ┃ ┗ app.ts
 ┃ ┣ .env
 ┃ ┣ Dockerfile
 ┃ ┣ package-lock.json
 ┃ ┗ package.json
 ┣ frontend
 ┃ ┣ public
 ┃ ┃ ┣ css
 ┃ ┃ ┗ js
 ┃ ┣ views
 ┃ ┃ ┣ index.html
 ┃ ┃ ┣ login.html
 ┃ ┃ ┣ logout.html
 ┃ ┃ ┗ upload.html
 ┃ ┣ Dockerfile
 ┃ ┣ app.ts
 ┃ ┣ package-lock.json
 ┃ ┗ package.json
 ┣ .dockerignore
 ┣ .gitignore
 ┣ README.md
 ┣ cbom.json
```