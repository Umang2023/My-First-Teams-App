require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};

const socketToRoom = {};

io.on('connection', socket => {
    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
        console.log(usersInThisRoom);
        socket.emit("all users", usersInThisRoom);
        socket.emit("me", socket.id);
    });

    socket.on("sending signal", payload => {
        console.log("sending signal");
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        console.log("returning signal");
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on("updateMyMedia", ({ type, currentMediaStatus }) => {
        console.log("updateMyMedia");
        socket.broadcast.emit("updateUserMedia", { type, currentMediaStatus });
    });

    socket.on('disconnect', () => {
        console.log("disconnecting user");
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        socket.broadcast.emit("user left", socket.id);
        socket.removeAllListeners();
    });

    socket.on('change', (payload) => {
        socket.broadcast.emit('change', payload)
    });

    // socket.on("msgUser", ({ name, to, msg, sender }) => {
    //     io.to(to).emit("msgRcv", { name, msg, sender });
    // });
});
const PORT = process.env.PORT || 8000
if (process.env.PROD) {
    app.use(express.static(__dirname + '/client/build'));
    app.get('*', (request, response) => {
        response.sendFile(path.join(__dirname, 'client/build/index.html'));
    });
}

server.listen(process.env.PORT || 8000, () => console.log('server is running...'));


