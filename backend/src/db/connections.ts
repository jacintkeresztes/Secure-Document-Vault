import { createPool } from 'mysql2/promise'
import fs from 'fs'

const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'vault_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vault_db',
    ssl: {
        ca: fs.readFileSync('/app/certs/ca-cert.pem'),
        cert: fs.readFileSync('/app/certs/client-cert.pem'),
        key: fs.readFileSync('/app/certs/client-key.pem'),
        rejectUnauthorized: true
    }
}

export const pool = createPool(dbConfig);

export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed', error);
        return false;
    }
}

