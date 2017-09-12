//server
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.sendFile(__dirname + '/client.html') );
http.listen(port,() => console.log('listening on *:' + port) );

const userMap = {};
const lobbyMap = {};
const roomMap = {};

//for making room objects
function Room(host, roomId) {
    this.host = host;
    this.id = roomId;
    this.members = [];
}

io.on('connection', socket => {
    
    let userId = socket.id;
    let name = 'error';
    
    //when the user tries to log in
    socket.on('login', username => {
        
        //if user with that user name is not already logged in
        if (!(username in userMap)) {
            
            name = username;
            
            //put user in userMap at key username
            userMap[name] = userId;
            lobbyMap[name] = userId;
            
            //sends command login back with name
            //so the client knows it is logged in with that name
            io.to(userId).emit('login', name);
            
            //lets up lobby showing all rooms
            io.to(userId).emit('lobby', roomMap);
        }
        
    });
    
    //when client sends chat to server
    socket.on('chat', message => {
        
        //for each user in the user map
        for (let username in userMap) {
            
            //send that user the chat message
            io.to(userMap[username]).emit('chat', message);
            
        }
        
    });
    
    //client tries to make new room
    socket.on('new', () => {
        
        //make a new room with random id
        let room = new Room(name, Math.random().toString(36));
        
        //put yourself in it
        room.members.push(name);
        
        //take yourself out of lobby
        delete lobbyMap[name];
        
        //put room in roomMap
        roomMap[room.id] = room;
        
        //send roomMap to peole in lobby
        for (let user in lobbyMap)
            io.to(lobbyMap[user]).emit('lobby', roomMap);
        
        //send room to youself
        io.to(userId).emit('room', room);
        
    });
    
    //client tries to join a room
    socket.on('join', roomId => {
        
        //get the room
        let room = roomMap[roomId];
        
        //put yourself in it
        room.members.push(name);
    
        //take yourself out of lobby
        delete lobbyMap[name];
        
        //send room to members
        for (let member in room.members)
            io.to(userMap[room.members[member]]).emit('room', room);
        
        //send lobby to everyone in lobby
        for (let user in lobbyMap)
            io.to(lobbyMap[user]).emit('lobby', roomMap);
        
    });
    
});