const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET not set in .env')

const DB_PASSWORD = process.env.DB_PASSWORD
if (!DB_PASSWORD) throw new Error('DB_PASSWORD not set in .env')

export const config = {
    port: parseInt(process.env.PORT || '3000'),

    db: {
        host: process.env.DB_HOST || 'mysql',
        port: parseInt(process.env.DB_PORT || '3306'),
        name: process.env.DB_NAME || 'vault_db',
        user: process.env.DB_USER || 'vault_user',
        password: DB_PASSWORD
    },

    jwt: {
        secret: JWT_SECRET,
        expiresIn: '24h' as const
    }
}
