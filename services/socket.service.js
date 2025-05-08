import { Server } from 'socket.io'

let io = null

export function setupSocketAPI(server) {
    io = new Server(server, {
        cors: {
            origin: '*'
        }
    })

    io.on('connection', (socket) => {
        console.log('A user connected to socket server')

        socket.on('chat-join', (toyId) => {
            socket.join(toyId)
            console.log(`User joined room: ${toyId}`)
        })

        socket.on('chat-msg', (msg) => {
            console.log('Message received:', msg)
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
