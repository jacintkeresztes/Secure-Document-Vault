import { pool } from '../db/connections.js'
import { type Request, type Response } from 'express'
import crypto from 'crypto'
import fs from 'fs/promises'
import { deleteFile } from '../utils/fileUtils.js'
import { encryptFile, decryptFile } from '../utils/crypto.js'

export async function handleFileUpload(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Missing fields'
            })
        }

        if (req.file.size > 20 * 1024 * 1024) {
            await deleteFile(req.file.path)
            return res.status(400).json({
                success: false,
                message: 'File size larger than 20 MB'
            })
        }

        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            })
        }
        const originalName = req.file.originalname
        const fileExtension = originalName.substring(originalName.lastIndexOf('.'))
        const fileSize = req.file.size

        const fileBuffer: Buffer = await fs.readFile(req.file.path)
        const hash = crypto.createHash('sha512').update(fileBuffer).digest()

        const filePath = `uploads/${hash.toString('hex')}${fileExtension}`
        
        const [existing] = await pool.execute(
            'SELECT id FROM files WHERE file_hash = ? AND user_id = ?',
            [hash, userId]
        );

        const e = existing as any
        if (e.length > 0) {
            await deleteFile(req.file.path)
            return res.status(409).json({
                success: false,
                message: 'File already exists'
            });
        }
        
       // Encryption
        let encryptedFile: Buffer, iv: Buffer,authTag: Buffer, encryptedDek: Buffer, dekIv: Buffer, dekAuthTag: Buffer

        try {
            const [userRows] = await pool.execute(
                'SELECT password_hash FROM users WHERE id = ?',
                [userId]
            )
            const users = userRows as any[]
            if (users.length === 0)  {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve user data'
                })
            }

            const passwordHash: string = users[0].password_hash;
            ({
                encryptedFile,
                iv,
                authTag,
                encryptedDek,
                dekIv,
                dekAuthTag
            } = encryptFile(fileBuffer, passwordHash))
        } catch (error) {
            console.error(error)
            return res.status(500).json({
                success: false,
                message: 'Failed to encrypt file'
            })
        }

        try {
            await fs.writeFile(filePath, encryptedFile)
            await deleteFile(req.file.path)
        } catch (error) {
            console.error(error)
            await deleteFile(req.file.path)
            return res.status(500).json({
                success: false,
                message: 'File write unsuccesful'
            })
        }
        
        let result: any
        try {
            [result] = await pool.execute(
                'INSERT INTO files (user_id, filename, filepath, file_size, iv, auth_tag, encrypted_dek, dek_iv, dek_auth_tag, file_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, originalName, filePath, fileSize, iv, authTag, encryptedDek, dekIv, dekAuthTag, hash]      
            )
        } catch (error) {
            console.error(error)
            await deleteFile(filePath)
            return res.status(500).json({
                success: false,
                message: 'Database insertion unsuccesful'
            })
        }

        return res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                id: result.insertId,
                filename: originalName,
                size: fileSize
            }
        })
    } catch (error) {
        console.error(error)
        if (req.file?.path) {
            await deleteFile(req.file.path)
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to upload file'
        })
    }
}

export async function handleFileDownload(req: Request, res: Response) {
    const fileId = req.params.id
    const userId = req.user?.userId
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        })
    }
    let results: any
    try {
        [results] = await pool.execute(
            'SELECT * FROM files WHERE id = ? AND user_id = ?',
            [fileId, userId] 
        )
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: 'Failed to communicate with database'
        })
    }
    
    const files = results as any[]

    if (files.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        })
    }

    const file = files[0]
    let fileBuffer: Buffer
    try {
        await fs.access(file.filepath)
        fileBuffer = await fs.readFile(file.filepath)
    } catch (error) {
        console.error(error)
        return res.status(404).json({
            success: false,
            message: 'File not found'
        })
    }

    // Decryption
    let decryptedFile: Buffer
    try {

        const [userRows] = await pool.execute(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        )

        const users = userRows as any[]
        if (users.length === 0)  {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve user data'
            })
        }

        const passwordHash: string = users[0].password_hash;
        

        decryptedFile = decryptFile(fileBuffer, passwordHash, file.iv, file.auth_tag, file.encrypted_dek, file.dek_iv, file.dek_auth_tag)
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: 'Failed to decrypt file'
        })
    }
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`)
    res.setHeader('Content-type', 'application/octet-stream')
    res.setHeader('Content-length', decryptedFile.length.toString())
    res.send(decryptedFile)
}

export async function handleDeleteFile(req: Request, res: Response) {
    const fileId = req.params.id
    const userId = req.user?.userId
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        })
    }
    let results: any
    try {
        [results] = await pool.execute(
            'SELECT * FROM files WHERE id = ? AND user_id = ?',
            [fileId, userId] 
        )
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: 'Failed to communicate with database'
        })
    }
    
    const files = results as any[]

    if (files.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        })
    }

    try {
        await pool.execute(
            'DELETE FROM files WHERE id = ? AND user_id = ?',
            [fileId, userId]
        )
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: 'Failed to delete file'
        })
    }

    const file = files[0]

    await deleteFile(file.filepath)
    return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
    })
}

export async function handleListFiles(req: Request, res: Response) {
    const userId = req.user?.userId
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        })
    }
    let results: any
    try {
        [results] = await pool.execute(
            'SELECT id, filename, file_size, upload_date FROM files WHERE user_id = ? ORDER BY upload_date DESC',
            [userId] 
        )
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: 'Failed to communicate with database'
        })
    }
    
    try {
        const files = results as any[]
        return res.status(200).json({
            success: true,
            files: files.map(f => ({
                id: f.id,
                original_name: f.filename,
                size: f.file_size,
                upload_date: f.upload_date
            }))
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: 'Failed to list files'
        })
    }
}
