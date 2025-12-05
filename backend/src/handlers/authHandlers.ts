import { type Request, type Response } from 'express'
import argon2 from 'argon2'
import { pool } from '../db/connections.js'

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

        // Get user from database
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

        // Verify password with Argon2
        const isValidPassword = await argon2.verify(user.password_hash, password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Success! (Later: generate JWT token here)
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email
            }
            // Later: add token here
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}