import crypto from 'crypto'

function generateIV() {
    return crypto.randomBytes(12)
}

export function encryptFile(fileBuffer: Buffer, userPasswordHash: string) {
    // 1. Generate DEK
    const dek = crypto.randomBytes(32)
    // 2. Generate IV
    const iv = generateIV()
    // 3. Encrypt file with AES-256-GCM <- DEK, IV -> AuthTag
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv)
    const encryptedFile = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
    ])
    const authTag = cipher.getAuthTag()
    // 4. Derive KEK from user password
    const kek = crypto.createHash('sha256').update(userPasswordHash).digest()
    // 5. Generate DEK_IV
    const dekIv = generateIV()
    // 6. Encrypt DEK <- KEK, DEK_IV -> DEKAuthTag
    const dekCipher = crypto.createCipheriv('aes-256-gcm', kek, dekIv)
    const encryptedDek = Buffer.concat([
        dekCipher.update(dek),
        dekCipher.final()
    ])
    const dekAuthTag = dekCipher.getAuthTag()

    // 7. Send back encrypted Buffer and everything else.
    return {
        encryptedFile,
        iv,
        authTag,
        encryptedDek,
        dekIv,
        dekAuthTag
    }
}

export function decryptFile(encryptedFile: Buffer, userPasswordHash: string, iv: Buffer, authTag: Buffer, encryptedDek: Buffer, dekIv: Buffer, dekAuthTag: Buffer) {  
    const kek = crypto.createHash('sha256').update(userPasswordHash).digest()

    const dekDecipher = crypto.createDecipheriv('aes-256-gcm', kek, dekIv)
    dekDecipher.setAuthTag(dekAuthTag)
    const dek = Buffer.concat([
        dekDecipher.update(encryptedDek),
        dekDecipher.final()
    ])
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv)
    decipher.setAuthTag(authTag)

    return Buffer.concat([
        decipher.update(encryptedFile),
        decipher.final()
    ])
}
