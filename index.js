// socket IO + webServer
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

let userlist = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/style.css', function(req, res){
  res.sendFile(__dirname + '/style.css');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('login', function(username){
    console.log(username);
    
    userlist.push({
        "id": socket.id,
        "user": username
    }) // Username + ID -> Array
    
    console.log(userlist) // Print Array for testing purposes
    
    socket.emit('showChat'); // Hide Login Window and show Chat
    socket.broadcast.emit('userConnected', username); // Send to all Clients -> New User connected
  });

  socket.on('disconnect', function(){
    console.log(socket.id + ' disconnected');
    // socket.broadcast.emit('clientDisconnect', ); <- WIP
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
// - - - - - - - - - - - - - -