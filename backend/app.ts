import express from "express";
import path from "path";
import cors from 'cors';
import { testConnection } from "./src/db/connections.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors())
app.use('/public', express.static('public'))

testConnection();

app.route('/api/login')
    .post((req, res) => {       
        // handleLogin(req); 
    })

app.route('/api/register')
    .post((req, res) => {
        // registerUser(req);
    })

app.route('/api/upload')
    .post((req, res) => {
        // handleFile(req);
    })

app.route('/api/files/:id')
    .get((req, res) => {
        // getFile(req);
    })

    .delete((req, res) => {
        // deleteFile(req);
    })

app.listen(port, () => {
    console.log('Listening on port 3000');
})