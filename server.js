import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { authRoutes } from './api/auth/auth.routes.js'
import { toyRoutes } from './api/toy/toy.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import http from 'http'
import { setupSocketAPI } from './services/socket.service.js' 


const app = express()
const server = http.createServer(app)


// App Configuration
app.use(cookieParser()) // for res.cookies
app.use(express.json()) // for req.body
app.set('query parser', 'extended') // for req.query

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'))
} else {
    const corsOptions = {
        origin: [
            'http://127.0.0.1:3000',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ],
        credentials: true,
    }
    app.use(cors(corsOptions))
}

app.use('/api/toy', toyRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

setupSocketAPI(server)

// Fallback
// app.get('/*all', (req, res) => {
//     res.sendFile(path.resolve('public/index.html'))
// })

// Listen will always be the last line in our server!
const port = process.env.PORT || 3031
// app.listen(port, () => {
//     console.log(`Server listening on port http://127.0.0.1:${port}/`)
// })

server.listen(port, () => {
    console.log(`Server listening on port http://127.0.0.1:${port}/`)
})

