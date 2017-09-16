# Browser chat lobby demo using: node.js, socket.io, express 

# This is a demo of a basic chat lobby with features:
  - Login to lobby by giving it a name.
  - Live chat with all logged in users.
  - Create a room for private chat.
  - Join existing rooms.
  - Host can remove users from their room.
  - Room is removed when host leaves room.
  - Handles users disconnecting diffrently depending on if user is:
      - in a room.
      - a host.
      - in main lobby.
      - logged out.

# To run this localy:
  - Install node.js
  - Check that it is installed:
      - enter 'node -v' into the terminal. 
      - should return your version of node if installed correctly.
  - Navigate to folder project is cloned to in terminal.
  - Enter 'node server.js'
      - The terminal should say: "Listening on *:3000"
  - Navigate to local host 3000 in a browser. (open in multiple windows to see how the clients interact with eachother)
