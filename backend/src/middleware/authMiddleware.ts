import { type NextFunction, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        })
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as { 
            userId: number,
            email: string 
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email
        }

      next()
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid Token'
        })
    }
}