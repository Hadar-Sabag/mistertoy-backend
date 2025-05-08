import { Server } from 'socket.io'
import { toyService } from '../api/toy/toy.service.js'

let io = null

export function setupSocketAPI(server) {
    io = new Server(server, {
        cors: {
            origin: '*'
        }
    })

    io.on('connection', (socket) => {
        console.log('A user connected to socket server')

        socket.on('chat-join', async (toyId) => {
            socket.join(toyId)
            console.log(`User joined room: ${toyId}`)
            const toy = await toyService.getById(toyId)
            const msgs = toy.msgs || []
            console.log(`Sending chat history with ${msgs.length} messages`)
            socket.emit('chat-history', msgs)
        })


        socket.on('chat-msg', async (msg) => {
            console.log('Message received:', msg)
            await toyService.addMsg(msg.toyId, {
                txt: msg.txt,
                from: msg.from,
                createdAt: Date.now()
            })
            io.to(msg.toyId).emit('chat-msg', msg)
        })

        socket.on('user-typing', ({ toyId, username }) => {
            socket.to(toyId).emit('user-typing', username)
        })

        socket.on('chat-leave', (toyId) => {
            socket.leave(toyId)
            console.log(`User left room: ${toyId}`)
        })

        socket.on('disconnect', () => {
            console.log('A user disconnected from socket server')
        })
    })
}
