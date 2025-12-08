import express from "express"
import cors from 'cors'
import multer from 'multer'
import https from 'https'
import { testConnection } from "./db/connections.js"
import { handleRegister, handleLogin, handleRefresh, handleLogout } from './handlers/authHandlers.js'
import { handleListFiles, handleFileDownload, handleDeleteFile, handleFileUpload } from "./handlers/fileHandlers.js"
import { verifyToken } from "./middleware/authMiddleware.js"
import { config } from './config.js'

const app = express()
const port = config.port
const upload = multer({ dest:'uploads/temp' })

app.use(express.json())
app.use(cors())
app.use('/public', express.static('public'))

testConnection()

app.route('/api/login')
    .post(handleLogin)

app.route('/api/register')
    .post(handleRegister)

app.route('/api/refresh')
    .post(handleRefresh)

app.route('/api/logout')
    .post(handleLogout)

app.route('/api/upload')
    .post(upload.single('file'), verifyToken, handleFileUpload)

app.route('/api/files')
    .get(verifyToken, handleListFiles)

app.route('/api/files/:id')
    .get(verifyToken, handleFileDownload)

    .delete(verifyToken, handleDeleteFile)

https.createServer({
    cert: config.tls.cert,
    key: config.tls.key
}, app).listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`)
})