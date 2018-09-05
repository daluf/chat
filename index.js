// socket IO + webServer
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');

const userlist = [];
const adminlist = [];
let msgCounter = 0;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/admin', function(req, res){
  res.sendFile(__dirname + '/admin.html');
});

app.get('/style.css', function(req, res){
  res.sendFile(__dirname + '/style.css');
});

io.on('connection', function(socket){

  socket.on('adminLogin', function(pass) {
    if (pass == "1") {
      adminlist.push({
        "id": socket.id,
        "admin": true
      }) // ID -> Array
      socket.emit('yesYouAreAdmin');
      console.log(adminlist)
    }
  })

  socket.on('requestChatRooms', function() {
    if (adminlist.find(id => id.id === socket.id) || userlist.find(id => id.id === socket.id)) {
      fs.readFile('chatrooms.json', (err, data) => {
        if (err == null) {
          data = JSON.parse(data);
          socket.emit('responseChatRooms', data)
        } else {
          console.log(err);
        }
      });
    }
  })

  socket.on('setRoomState', function(room, state) {
    if (adminlist.find(id => id.id === socket.id)) {
      console.log('roomstate', room, state)
      fs.readFile('chatrooms.json', (err, data) => {
        if (err == null) {
          data = JSON.parse(data);
          console.log(data);
          if (state == "public") {
            data[room].privacy = "public"
            socket.emit('isPublic', room)
          } else if (state == "private") {
            data[room].privacy = "private"
            socket.emit('isPrivate', room)
          }
          data = JSON.stringify(data);
          fs.writeFile('chatrooms.json', data, (err) => { if (err) console.log(err) });
        }
      })
    }
  })

  socket.on('removeRoom', function(room) {
    if (adminlist.find(id => id.id === socket.id)) {
      fs.readFile('chatrooms.json', (err, data) => {
        if (err == null) {
          data = JSON.parse(data);
          delete data[room];
          data = JSON.stringify(data);
          socket.emit('roomDeleted', room)
          fs.writeFile('chatrooms.json', data, (err) => { if (err) console.log(err) });
        }
      })
    }
  })

  socket.on('createNewRoom', function(name, state) {
    if (adminlist.find(id => id.id === socket.id)) {
      fs.readFile('chatrooms.json', (err, data) => {
        if (err == null) {
          data = JSON.parse(data);
          data[name] = {"privacy": state};
          data = JSON.stringify(data);
          socket.emit('roomCreate', name, state)
          fs.writeFile('chatrooms.json', data, (err) => { if (err) console.log(err) });
        }
      })
    }
  })

  socket.on('whitelistUser', function(user) {
    if (adminlist.find(id => id.id === socket.id)) {
      fs.readFile('whitelist.json', (err, data) => {
        data = JSON.parse(data);
        data.push(user);
        console.log(data)
        data = JSON.stringify(data);
        fs.writeFile('whitelist.json', data, (err) => { if (err) console.log(err) });
        socket.emit('userWhitelisted', user)
      })
    }
  })

  // Login Handler (Add new User and announce it)
  socket.on('login', function(username){
    if (username.length <= 12) {
      let onlineList = [];
      for (let key in userlist) {
        onlineList.push(userlist[key].user)
      }
      if (!onlineList.includes(username)) {
        if (!userlist.find(id => id.id === socket.id)) {
          console.log(username);
          
          userlist.push({
              "id": socket.id,
              "user": username,
              "status": 'online',
              "msgIds": []
          }) // Username + ID -> Array
          
          console.log(userlist) // Print Array for testing purposes
          
          socket.emit('showChat'); // Hide Login Window and show Chat
          io.emit('userConnected', username); // Send to all Clients -> New User connected
        } else {
          socket.emit('alertError', 'Nice Try')
        }
      } else {
        socket.emit('alertError', 'Username is taken!'); // SweetError if the Username extends 12 Chars
      }
    } else {
      socket.emit('alertError', 'Username too long! Max. 12 Chars'); // SweetError if the Username extends 12 Chars
    }
  });

  // Disconnect Handler (Detect Disconnect and announce it)
  socket.on('disconnect', function(){
    console.log(socket.id + ' disconnected');
    
    if (userlist.find(id => id.id === socket.id)) {
      io.emit('clientDisconnect', userlist.find(id => id.id === socket.id).user); // Emit to all Clients that a User left
      let userIndex = userlist.indexOf(userlist.find(id => id.id === socket.id)) // Find element's index in array
      userlist.splice(userIndex, 1); // Remove the Item
    }
    
    console.log(userlist)
  });

  // Message Handler (Receive Message -> Send them to all Clients)
  socket.on('message', function(msg) {
    if (userlist.find(id => id.id === socket.id)) {
      msgCounter++;
      socket.emit('newMessage', userlist.find(id => id.id === socket.id).user, msg, msgCounter, true)
      socket.broadcast.emit('newMessage', userlist.find(id => id.id === socket.id).user, msg, msgCounter); // Send the new incoming Message to all Clients
      let userIndex = userlist.indexOf(userlist.find(id => id.id === socket.id))
      userlist[userIndex].msgIds.push(msgCounter);
      console.log(userlist);
    }
  })

  // Process Currently Online Users
  socket.on('getOnlineUsers', function() { // User requests all Online Users so they can be displayed
    let onlineList = [];
    let statusList = [];
    for (let key in userlist) {
      onlineList.push(userlist[key].user)
      statusList.push(userlist[key].status)
    }
    socket.emit('getOnlineUsers', onlineList, statusList)
  })

  // Function to remove a Message globally
  socket.on('removeMessage', function(id) {
    if (userlist.find(id => id.id === socket.id)) {
      let userIndex = userlist.indexOf(userlist.find(id => id.id === socket.id))
      if (userlist[userIndex].msgIds.includes(id)) {
        io.emit('removeMessage', id)
      }
    }
  })

  // Change User Status, save it and announce it
  socket.on('changeStatus', function(status) {
    if (userlist.find(id => id.id === socket.id)) {
      io.emit('changeStatus', userlist.find(id => id.id === socket.id).user, status)
      let userIndex = userlist.indexOf(userlist.find(id => id.id === socket.id))
      userlist[userIndex].status = status;
      console.log(userlist);
    }
  })

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
// - - - - - - - - - - - - - -