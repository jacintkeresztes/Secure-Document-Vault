import express from "express"
import cors from 'cors'
import multer from 'multer'
import { testConnection } from "./src/db/connections.js"
import { handleRegister, handleLogin } from './src/handlers/authHandlers.js'
import { handleListFiles, handleFileDownload, handleDeleteFile, handleFileUpload } from "./src/handlers/fileHandlers.js"

const app = express()
const port = 3000
const upload = multer({ dest:'uploads/temp' })

app.use(express.json())
app.use(cors())
app.use('/public', express.static('public'))

testConnection()

app.route('/api/login')
    .post((req, res) => {
        handleLogin(req, res)
    })

app.route('/api/register')
    .post((req, res) => {
        handleRegister(req, res)
    })

app.route('/api/upload')
    .post(upload.single('file'), (req, res) => {
        // handleSessionAuth(req, res, next)
        handleFileUpload(req, res)
    })

app.route('/api/files')
    .get((req, res) => {
        // handleSessionAuth(req, res, next)
        handleListFiles(req, res)
    })

app.route('/api/files/:id')
    .get((req, res) => {
        // handleSessionAuth(req, res, next)
        handleFileDownload(req, res)
    })

    .delete((req, res) => {
        // handleSessionAuth(req, res, next)
        handleDeleteFile(req, res)
    })

app.listen(port, () => {
    console.log('🚀 Server running on port 3000')
})