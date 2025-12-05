import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export function generateToken(userId: number, email: string) {
    return jwt.sign({
        iss: 'Secure Document Vault',
        userId: userId,
        email: email,
        },
        config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
        algorithm: 'HS512',
        }
    )
}
