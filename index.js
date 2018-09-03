var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

let userliste = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log(socket.id + ' disconnected');
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});