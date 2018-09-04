// socket IO + webServer
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const userlist = [];
let msgCounter = 0;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/style.css', function(req, res){
  res.sendFile(__dirname + '/style.css');
});

io.on('connection', function(socket){

  // Login Handler (Add new User and announce it)
  socket.on('login', function(username){
    if (username.length <= 12) {
      let onlineList = [];
      for (let key in userlist) {
        onlineList.push(userlist[key].user)
      }
      if (!onlineList.includes(username)) {
        console.log(username);
        
        userlist.push({
            "id": socket.id,
            "user": username,
            "msgIds": []
        }) // Username + ID -> Array
        
        console.log(userlist) // Print Array for testing purposes
        
        socket.emit('showChat'); // Hide Login Window and show Chat
        io.emit('userConnected', username); // Send to all Clients -> New User connected
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
    }

    let userIndex = userlist.indexOf(userlist.find(id => id.id === socket.id)) // Find element's index in array
    userlist.splice(userIndex, 1); // Remove the Item
    
    console.log(userlist)
  });

  // Message Handler (Receive Message -> Send them to all Clients)
  socket.on('message', function(msg) {
    msgCounter++;
    socket.emit('newMessage', userlist.find(id => id.id === socket.id).user, msg, msgCounter, true)
    socket.broadcast.emit('newMessage', userlist.find(id => id.id === socket.id).user, msg, msgCounter); // Send the new incoming Message to all Clients
    let userIndex = userlist.indexOf(userlist.find(id => id.id === socket.id))
    userlist[userIndex].msgIds.push(msgCounter);
    console.log(userlist);
  })

  // Process Currently Online Users
  socket.on('getOnlineUsers', function() { // User requests all Online Users so they can be displayed
    let onlineList = [];
    for (let key in userlist) {
      onlineList.push(userlist[key].user)
    }
    socket.emit('getOnlineUsers', onlineList)
  })

  socket.on('removeMessage', function(id) {
    let userIndex = userlist.indexOf(userlist.find(id => id.id === socket.id))
    if (userlist[userIndex].msgIds.indexOf('id')) {
      io.emit('removeMessage', id)
    }
  })

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
// - - - - - - - - - - - - - -