import fs from 'fs/promises'

export async function deleteFile(filePath: string) {
    try {
        await fs.rm(filePath)
    } catch (error) {
        console.error(error)
    }
}