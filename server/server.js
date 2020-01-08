const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const path = require("path");

const {getMsg, getLocMsg} = require("./utils/message");
const {isRealString} = require("./utils/validation");
const {Users} = require("./utils/users");

var users = new Users();
var publicPath = path.join(__dirname, "../public");
var app = express();
var server = http.createServer(app);    // creating an http server sending express app as an argument
var io = socketIO(server);  // integrating socket io in the server

app.use(express.static(publicPath));    // serving the static html pages using express middleware

io.on("connection", (socket) => {   // establishing a listener for a new connection (in socket)
    console.log("New user connected");

    // socket.emit("newMessage", getMsg("Admin", "Welcome to the chat app"));  // welcome msg for the new user only

    // socket.broadcast.emit("newMessage", getMsg("Admin", "New user joined"));  // new user joined msg for everyone in chat grp except the new user

    socket.on('join', (params, callback) => {
        if (!isRealString(params.name) || !isRealString(params.room)) {
            return callback("Enter valid name and room name");
        }

        socket.join(params.room);
        users.removeUser(socket.id);
        users.addUser(socket.id, params.name, params.room);

        io.to(params.room).emit('updateUsersList', users.getUserList(params.room));
        socket.emit("newMessage", getMsg("Admin", "Welcome to the chat app"));
        socket.broadcast.to(params.room).emit("newMessage", getMsg("Admin", `${params.name} has joined`));

        callback();
    });

    socket.on("createMessage", (message, callback) => { // event listener for create message
        console.log("createMessage", message);

        var user = users.getUser(socket.id);
        if (user && isRealString(message.text)) {
            io.to(user.room).emit("newMessage", getMsg(user.name, message.text));
        }
        callback();

        // io.emit("newMessage", getMsg(message.from, message.text));  // emitting a new message event for all the connected users in chat grp
        // callback(); // event acknowledgement from the server to the client
    });

    socket.on("createLocationMessage", (coords) => {    // creating a listener for sending the location of the user
        var user = users.getUser(socket.id);
        if (user) {
            io.to(user.room).emit("newLocationMessage", getLocMsg(user.name, coords.lat, coords.long));
        }
        // io.emit("newLocationMessage", getLocMsg(coords.from, coords.lat, coords.long));
    });

    socket.on("disconnect", () => {
        console.log("User was disconnected");

        var user = users.removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('updateUsersList', users.getUserList(user.room));
            io.to(user.room).emit('newMessage', getMsg('Admin', `${user.name} has left`));
        }
    });
});

server.listen(3000, () => {
    console.log("Server started at 3000");
})