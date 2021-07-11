require("dotenv").config
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 8000;
const path = require('path');

let socketList = {};

app.use(express.static(path.join(__dirname, 'public')));

if (process.env.PROD) {
    app.use(express.static(path.join(__dirname, './client/build')));

    app.get('/*', function (req, res) {
        res.sendFile(path.join(__dirname, './client/build/index.html'));
    });
}


// Socket connection
io.on('connection', (socket) => {
    console.log(`New User connected: ${socket.id}`);
    //On user disconnect
    socket.on('disconnect', () => {
        socket.disconnect();
        console.log('User disconnected!');
    });
    //check user exists before joining
    socket.on('check user exists', ({ roomId, userName }) => {
        let error = false;

        io.sockets.in(roomId).clients((err, clients) => {
            clients.forEach((client) => {
                if (socketList[client] == userName) {
                    error = true;
                }
            });
            socket.emit('error user exists', { error });
        });
    });

    /**
     * Join Room
     */
    socket.on('join room', ({ roomId, userName }) => {
        // Socket Join RoomName
        socket.join(roomId);
        socketList[socket.id] = { userName, video: true, audio: true };

        // Set User List
        io.sockets.in(roomId).clients((err, clients) => {
            try {
                const users = [];
                clients.forEach((client) => {
                    // Add User List
                    users.push({ userId: client, info: socketList[client] });
                });
                socket.broadcast.to(roomId).emit('all users', users);
            } catch (e) {
                io.sockets.in(roomId).emit('error user exists', { err: true });
            }
        });
    });

    socket.on('add user', ({ userToCall, from, signal }) => {
        io.to(userToCall).emit('user joined', {
            signal,
            from,
            info: socketList[socket.id],
        });
    });

    socket.on('sending signal', ({ signal, to }) => {
        io.to(to).emit('accepting signal', {
            signal,
            answerId: socket.id,
        });
    });

    socket.on('send chat message', ({ roomId, msg, sender }) => {
        io.sockets.in(roomId).emit('receive chat message', { msg, sender });
    });

    socket.on('remove user', ({ roomId, user }) => {
        delete socketList[socket.id];
        socket.broadcast
            .to(roomId)
            .emit('user left', { userId: socket.id, userName: [socket.id] });
        io.sockets.sockets[socket.id].leave(roomId);
    });

    socket.on('change video audio', ({ roomId, switchTarget }) => {
        if (switchTarget === 'video') {
            socketList[socket.id].video = !socketList[socket.id].video;
        } else {
            socketList[socket.id].audio = !socketList[socket.id].audio;
        }
        socket.broadcast
            .to(roomId)
            .emit('change vid aud', { userId: socket.id, switchTarget });
    });
});

http.listen(PORT, () => {
    console.log(`Server is running at Port ${PORT}`);
});
