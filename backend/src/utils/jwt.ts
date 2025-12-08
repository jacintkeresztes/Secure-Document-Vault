import jwt, { type SignOptions } from 'jsonwebtoken'
import { config } from '../config.js'

export function generateToken(userId: number, email: string, expiresIn?: any) {
    const options: SignOptions = {
        expiresIn: expiresIn,
        algorithm: 'HS512',
    }

    return jwt.sign({
        iss: 'Secure Document Vault',
        userId: userId,
        email: email,
    },
    config.jwt.secret,
    options)
}

export function generateAccessToken(userId: number, email: string) {
    return generateToken(userId, email, '15m')
}

export function generateRefreshToken(userId: number, email: string) {
    return generateToken(userId, email, '7d')
}
