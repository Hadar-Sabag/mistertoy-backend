import cors from 'cors'
import express from 'express'
import path from 'path'

import { toyService } from './services/toy.service.js'
import { userService } from './services/user.service.js'
import cookieParser from 'cookie-parser'

const app = express()

// App Configuration
const corsOptions = {
    origin: [
        'http://127.0.0.1:3031',
        'http://localhost:3031',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5173',
        'http://localhost:5174',
    ],
    credentials: true,
}

// Express Config:
app.use(express.static('public'))
app.use(express.json())
app.use(cors(corsOptions))
app.set('query parser', 'extended')
app.use(cookieParser()) 

// **************** Toys API ****************:

app.get('/api/toy', async (req, res) => {
    const { txt, inStock, labels, pageIdx, sortBy } = req.query

    const filterBy = {
        txt: txt || '',
        inStock: inStock || null,
        labels: labels || [],
        pageIdx: +pageIdx || 0,
        sortBy: sortBy || { type: '', sortDir: 1 },
    }

    try {
        const toys = await toyService.query(filterBy)
        console.log('inside query');
        res.send(toys)
    } catch (err) {
        console.log('Cannot load toys', err)
        res.status(400).send('Cannot load toys')
    }
})

app.get('/api/toy/:toyId', async (req, res) => {
    const { toyId } = req.params
    try {
        const toy = await toyService.get(toyId)
        res.send(toy)
    } catch (err) {
        console.log('Cannot get toy', err)
        res.status(400).send(err)
    }
})

app.post('/api/toy', async (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot add car')

    const { name, price, labels } = req.body

    const toy = {
        name,
        price: +price,
        labels,
    }

    try {
        const savedToy = await toyService.save(toy, loggedinUser)
        res.send(savedToy)
    } catch (err) {
        console.log('Cannot add toy', err)
        res.status(400).send('Cannot add toy')
    }
})

app.put('/api/toy/:toyId', async (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot update car')

    const { name, price, labels } = req.body
    const { toyId } = req.params

    const toy = {
        _id: toyId,
        name,
        price: +price,
        labels,
    }

    try {
        const savedToy = await toyService.save(toy, loggedinUser)
        res.send(savedToy)
    } catch (err) {
        console.log('Cannot update toy', err)
        res.status(400).send('Cannot update toy')
    }
})

app.delete('/api/toy/:toyId', async (req, res) => {
    console.log("req: ", req.cookies)
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    console.log("loggedinUser: ", loggedinUser)
    if (!loggedinUser) return res.status(401).send('Cannot remove toy')

    const { toyId } = req.params

    try {
        await toyService.remove(toyId, loggedinUser)
        res.send()
    } catch (err) {
        console.log('Cannot delete toy', err)
        res.status(400).send('Cannot delete toy, ' + err)
    }
})

// User API
app.get('/api/user', (req, res) => {
    userService.query()
        .then(users => res.send(users))
        .catch(err => {
            loggerService.error('Cannot load users', err)
            res.status(400).send('Cannot load users')
        })
})



app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params

    userService.getById(userId)
        .then(user => res.send(user))
        .catch(err => {
            loggerService.error('Cannot load user', err)
            res.status(400).send('Cannot load user')
        })
})

// Auth API
app.post('/api/auth/login', (req, res) => {
    const credentials = req.body

    userService.checkLogin(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(401).send('Invalid Credentials')
            }
        })
        .catch(err => {
            loggerService.error('Cannot login', err)
            res.status(400).send('Cannot login')
        })
})

app.post('/api/auth/signup', (req, res) => {
    const credentials = req.body

    userService.save(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(400).send('Cannot signup')
            }
        })
        .catch(err => {
            loggerService.error('Cannot signup', err)
            res.status(400).send('Cannot signup')
        })
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out!')
})


app.put('/api/user', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(400).send('No logged in user')
    const { diff } = req.body
    if (loggedinUser.score + diff < 0) return res.status(400).send('No credit')
    loggedinUser.score += diff
    return userService.save(loggedinUser)
        .then(user => {
            const token = userService.getLoginToken(user)
            res.cookie('loginToken', token)
            res.send(user)
        })
        .catch(err => {
            loggerService.error('Cannot edit user', err)
            res.status(400).send('Cannot edit user')
        })
})

// Fallback
app.get('/*all', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

// Listen will always be the last line in our server!
const port = process.env.PORT || 3031
app.listen(port, () => {
    console.log(`Server listening on port http://127.0.0.1:${port}/`)
})
