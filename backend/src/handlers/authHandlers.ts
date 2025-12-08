import { type Request, type Response } from 'express'
import argon2 from 'argon2'
import { pool } from '../db/connections.js'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export async function handleRegister(req: Request, res: Response) {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Missing fields'
        });
    }

    const [rows] = await pool.execute(
        'SELECT email FROM users WHERE email = ?',
        [email]
    );

    const users = rows as any[];
    
    if (users.length > 0) {
         return res.status(409).json({
            success: false,
            message: 'User already exists'
        })
    }

    const hash = await argon2.hash(password);

    const [result] = await pool.execute(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, hash]
    )

    res.status(201).json({
        success: true,
        message: 'User registered'
    })
}

export async function handleLogin(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing email or password'
            });
        }

        const [rows] = await pool.execute(
            'SELECT id, email, password_hash FROM users WHERE email = ?',
            [email]
        );

        const users = rows as any[];

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        const isValidPassword = await argon2.verify(user.password_hash, password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user.id, user.email)
        const refreshToken = generateRefreshToken(user.id, user.email)

        // Calculate expiry date (7 days from now)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        // Store refresh token in database
        await pool.execute(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, refreshToken, expiresAt]
        )

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: {
                id: user.id,
                email: user.email
            }
        })

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export async function handleRefresh(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token required'
            })
        }

        // Verify the refresh token
        let decoded: any
        try {
            decoded = jwt.verify(refreshToken, config.jwt.secret)
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            })
        }

        // Check if token exists in database and hasn't expired
        const [rows] = await pool.execute(
            'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
            [refreshToken]
        )

        const tokens = rows as any[]
        if (tokens.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired or invalid'
            })
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(decoded.userId, decoded.email)

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken
        })

    } catch (error) {
        console.error('Refresh error:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

export async function handleLogout(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token required'
            })
        }

        // Delete refresh token from database
        await pool.execute(
            'DELETE FROM refresh_tokens WHERE token = ?',
            [refreshToken]
        )

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        })

    } catch (error) {
        console.error('Logout error:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}