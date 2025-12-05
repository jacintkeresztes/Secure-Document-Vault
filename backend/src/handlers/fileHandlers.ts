import { pool } from '../db/connections.js'
import { type Request, type Response } from 'express'
import multer from 'multer'
import crypto from 'crypto'
import fs from 'fs/promises'

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

        const userId = 1
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
        
        try {
            await fs.rename(req.file.path, filePath)
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
                [userId, originalName, filePath, fileSize, Buffer.alloc(12), Buffer.alloc(16), Buffer.alloc(32), Buffer.alloc(12), Buffer.alloc(16), hash]           
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
    const userId = 1
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
    try {
        await fs.access(file.filepath)
    } catch (error) {
        console.error(error)
        return res.status(404).json({
            success: false,
            message: 'File not found'
        })
    }

    res.download(file.filepath, file.filename)
}

export async function handleDeleteFile(req: Request, res: Response) {
    const fileId = req.params.id
    const userId = 1
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
    const userId = 1
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
                filename: f.filename,
                size: f.file_size,
                uploadDate: f.upload_date
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

async function deleteFile(filePath: string) {
    try {
        await fs.rm(filePath)
    } catch (error) {
        console.error(error)
    }
}