require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require("path");
const mongoose = require('mongoose');
const { mongourl } = require('./config/keys')
const rooms = {};
const User = require('./models/User');
const users = [];
// mongoose.connect(mongourl);
mongoose.connect(mongourl, { useNewUrlParser: true, useUnifiedTopology: true });
const socketToRoom = {};

io.on('connection', socket => {
    socket.on("join room", roomID => {
        if (rooms[roomID]) {
            const length = rooms[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            rooms[roomID].push(socket.id);
        } else {
            rooms[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = rooms[roomID].filter(id => id !== socket.id);
        console.log(usersInThisRoom);
        socket.emit("all users", usersInThisRoom);
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

    // socket.on("add user in database", (payload) => {
    //     console.log(payload);
    // try {
    // if (users.length > 0) {
    //     const pastUser = users.find(user.id === socket.id);
    //     if (pastUser) {
    //         console.log("User already exists ");
    //     } else {
    //         const newUser = new User({
    //             name: userName,
    //             id: socket.id
    //         });
    //         newUser.save().then((savedUser) => {
    //             console.log(`${userName} has been added to the database`);
    //             users.push(newUser);
    //         })
    //     }
    // }
    // else {

    //     const newUser = new User({
    //         name: userName,
    //         id: socket.id
    //     });
    //     newUser.save().then((savedUser) => {
    //         console.log(`${userName} has been added to the database`);
    //         users.push(newUser);
    //     })

    // }
    //     } catch (err) {
    //         console.log(err);
    //     }
    // })

    // socket.on("delete user from database", (userId) => {
    //     console.log(userId);
    //     // const existingUser = users.find(user => user.id === userId);
    //     // if (!existingUser) {
    //     //     console.log("User doesn't exist in the database ");
    //     // } else {
    //     //     users.splice(users.findIndex(user => user.id === userId), 1);
    //     //     console.log(`${existingUser.name} has been removed from the database`);
    //     // }
    // })
    socket.on('disconnect', () => {
        console.log("disconnecting user");
        const roomID = socketToRoom[socket.id];
        let room = rooms[roomID];
        if (room) {
            const newroom = room.filter(id => id !== socket.id);
            delete room;

            rooms[roomID] = newroom;
        }
        else {
            delete rooms[roomID];
        }
        socket.broadcast.emit("user left", socket.id);
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


