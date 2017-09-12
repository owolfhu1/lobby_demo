//server
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.sendFile(__dirname + '/client.html') );
http.listen(port,() => console.log('listening on *:' + port) );

const userMap = {};

io.on('connection', socket => {
    
    let userId = socket.id;
    let name = 'error';
    
    //when the user tries to log in
    socket.on('login', username => {
        
        console.log('loggin in');
        
        //if user with that user name is not already logged in
        if (!(username in userMap)) {
            
            console.log('logining in for realz');
            
            name = username;
            //put user in userMap at key username
            userMap[name] = userId;
            
            //sends command login back with name
            //so the client knows it is logged in with that name
            io.to(userId).emit('login', name);
            
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
    
});