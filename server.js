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

function User(name, userId) {
    this.name = name;
    this.id = userId;
    this.roomId = 'none';
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
            userMap[name] = new User(name, userId);
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
            io.to(userMap[username].id).emit('chat', message);
            
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
        
        //save roomId to user object
        userMap[name].roomId = room.id;
        
        //send roomMap to people in lobby
        for (let user in lobbyMap)
            io.to(lobbyMap[user]).emit('lobby', roomMap);
        
        //send room to youself
        io.to(userId).emit('room', room);
        
    });
    
    //client tries to join a room
    socket.on('join', id => {
        
        //get the room
        let room = roomMap[id];
        
        //put yourself in it
        room.members.push(name);
    
        //take yourself out of lobby
        delete lobbyMap[name];
    
        //save roomId to user object
        userMap[name].roomId = room.id;
        
        //send room to members
        for (let member in room.members)
            io.to(userMap[room.members[member]].id).emit('room', room);
        
        //send lobby to everyone in lobby
        for (let user in lobbyMap)
            io.to(lobbyMap[user]).emit('lobby', roomMap);
        
    });
    
    //receive room chat from client
    socket.on('room_chat', text => {
       
        //get the user's room
        let room = roomMap[userMap[name].roomId];
        
        //send chat to room members
        for (let member in room.members)
            io.to(userMap[room.members[member]].id).emit('room_chat', text);
        
    });
    
    //when a user wants to leave a room
    socket.on('leave', () => {
        
        let id = userMap[name].roomId;
        
        //get room
        let room = roomMap[id];
        
        //if you are only member
        if (room.members.length === 1) {
            
            //remove room from roomMap
            delete roomMap[id];
            
            //remove roomId from user obj
            userMap[name].roomId = 'none';
            
            //add yourself to lobby
            lobbyMap[name] = userId;
            
        }
        //if you are the host
        else if (room.host === name) {
            
            //add all members to lobby and remove their roomId
            for (let member in room.members) {
                userMap[room.members[member]].roomId = 'none';
                lobbyMap[room.members[member]] = userMap[room.members[member]].id;
            }
            
            //remove room from roomMap
            delete roomMap[id];
            
        }
        //if you are just a regular member
        else {
    
            //remove user from room
            room.members.splice(room.members.indexOf(name), 1);
            
            //add yourself to lobby
            lobbyMap[name] = userId;
            
            //remove roomId from user obj
            userMap[name].roomId = 'none';
            
        }
        
        //if the room still exists
        if (id in roomMap) {
            
            //send room to members
            for (let member in room.members)
                io.to(userMap[room.members[member]].id).emit('room', room);
            
        }
    
        //send roomMap to people in lobby
        for (let user in lobbyMap)
            io.to(lobbyMap[user]).emit('lobby', roomMap);
        
    });
    
    socket.on('disconnect', () => {
        
        //check if user logged in
        if (name in userMap) {
    
            //get the user
            let user = userMap[name];
    
            //if user is in a room
            if (user.roomId !== 'none') {
        
                let room = roomMap[user.roomId];
        
                //if user is host
                if (name === room.host) {
            
                    //add all members to lobby and remove their roomId
                    for (let member in room.members) {
                        userMap[room.members[member]].roomId = 'none';
                        lobbyMap[room.members[member]] = userMap[room.members[member]].id;
                    }
            
                    //delete room
                    delete roomMap[room.id];
            
                } else {
            
                    //otherwise just remove yourself from room and send room to members
                    room.members.splice(room.members.indexOf(name), 1);
                    for (let member in room.members)
                        io.to(userMap[room.members[member]].id).emit('room', room);
            
                }
        
            }
    
            //if user is in lobby, remove them
            if (name in lobbyMap)
                delete lobbyMap[name];
    
            //send roomMap to people in lobby
            for (let x in lobbyMap)
                io.to(lobbyMap[x]).emit('lobby', roomMap);
    
            //delete from userMap
            delete userMap[name];
            
        }
        
    });
    
});