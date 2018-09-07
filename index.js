// socket IO + webServer
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');

const adminlist = [];


const whitelistFile = './data/whitelist.json'
let whitelist = [];
if (fs.existsSync(whitelistFile)) {
	whitelist = require(whitelistFile)
} else {
	let data = ["Admin"]
	fs.writeFile(whitelistFile, JSON.stringify(data, null, 2), (err) => {
		if (!err) {
			whitelist = require(whitelistFile);
		} else {
			throw err;
		}
	})
}

const roomsFile = './data/chatrooms.json'
let rooms = [];
if (fs.existsSync(roomsFile)) {
	rooms = require(roomsFile)
} else {
	let data = [
		{
		  "name": "Lobby",
		  "public": true
		},
	]
	fs.writeFile(roomsFile, JSON.stringify(data, null, 2), (err) => {
		if (!err) {
			rooms = require(roomsFile)
		} else {
			throw err;
		}
	})
}

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

	socket._data = {
		username: null,
		status: null,
		loggedIn: false,
		whitelisted: false,
		room: null,
		admin: false
	};

	// Login Handler (Add new User and announce it)
	socket.on('login', function(username, cb){
		if (typeof username === 'string' && /^[a-zA-Z0-9]*$/.test(username) && username.length <= 12) {
			let keys = Object.keys(io.sockets.connected);
			let usernames = [];
			for (i = 0; i < keys.length; i++) {
				let key = keys[i];
				let data = io.sockets.connected[key]._data;
				usernames.push(data.username);
			}
			if (!usernames.includes(username)) {
				socket._data.username = username;
				socket._data.status = 'online';
				socket._data.loggedIn = true;
				if (whitelist.includes(username)) {
					socket._data.whitelisted = true;
				}
				cb({success: true}); // Hide Login Window and show Chat
				//io.emit('userConnected', username); // Send to all Clients -> New User connected
			} else {
				cb({success: false, error: 'Username is taken!'}); // SweetError if the Username extends 12 Chars
			}
		} else {
			cb({success: false, error: 'Username faulty! Max. 12 Letters, no special chars'}); // SweetError if the Username extends 12 Chars
		};
	});

	socket.on('listRooms', function(cb) {
		// copy rooms
		// Array.map function
		let roomsTemp;
		if (socket._data.whitelisted) {
			roomsTemp = rooms.map(rooms => { return {name: rooms.name, public: rooms.public, access: true} });
			cb(roomsTemp);
		} else {
			roomsTemp = rooms.map(rooms => {
				if (rooms.public) {
					return {name: rooms.name, public: rooms.public, access: true}
				} else {
					return {name: rooms.name, public: rooms.public, access: false}
				}
			});
			cb(roomsTemp);
		};
	});

	socket.on('joinRoom', function(roomName, cb) {
		if (typeof roomName === 'string' && /^[a-zA-Z0-9]*$/.test(roomName)) {
			let allowed = false;
			for (i = 0; i < rooms.length; i++) {
				if (rooms[i].name === roomName) {
					if (rooms[i].public) {
						allowed = true;
					} else {
						if (socket._data.whitelisted == true) {
							allowed = true;
						} else {
							cb({success: false, error: 'You are not whitelisted!'});
						}
					}
				}
			}
			if (allowed) {
				if (socket._data.room == null) {
					socket._data.room = roomName;
					socket._data.status = 'online';
					socket.join(roomName);
					socket.broadcast.to(roomName).emit('userJoined', {username: socket._data.username, status: socket._data.status});
					cb({success: true});
				} else {
					cb({success: false, error: 'You already joined a room!'});
				}
			}
		}
	});

	socket.on('listRoomUsers', function(cb) {
		if (socket._data.room !== null) {
			let keys = Object.keys(io.sockets.connected);
			let roomUsers = [];
			for (i = 0; i < keys.length; i++) {
				let key = keys[i];
				let data = io.sockets.connected[key]._data;
				if (io.sockets.connected[key]._data.room === socket._data.room) {
					roomUsers.push({
						username: data.username,
						status: data.status
					});
				}
			}
			cb(roomUsers);
		};
	});

	socket.on('leaveRoom', function(cb) {
		if (socket._data.room !== null) {
			io.to(socket._data.room).emit('userLeft', socket._data.username);
			socket.leave(socket._data.room);
			socket._data.room = null;
			cb(true);
		};
	});

	socket.on('sendMessage', function(message, cb) {
		if (typeof message === 'string') {
			if (socket._data.room !== null) {
				message = {'id': `${socket.id}:${Date.now()}`, 'username': socket._data.username, 'message': message};
				socket.broadcast.to(socket._data.room).emit('message', message);
				cb({success: true, message: message});
			} else {
				cb({success: false, error: 'Join a Room before sending a message!'})
			}
		}
	});

	socket.on('deleteMessage', function(messageId, cb) {
		if (socket._data.room !== null) {
			messageId = messageId.split(":");
			if (messageId[0] === socket.id) {
				io.to(socket._data.room).emit('deleteMessage', {'id': messageId.join(':')});
				cb({success: true})
			} else {
				cb({success: false, error: 'You can only delete your own messages!'})
			}
		} else {
			cb({success: false, error: 'You need to be in a room!'})
		}
	});

	socket.on('changeStatus', function(status, cb) {
		if (typeof status === 'string' && /^[a-zA-Z0-9]*$/.test(status)) {
			if (socket._data.room !== null) {
				socket._data.status = status;
				cb({success: true});
				io.to(socket._data.room).emit('changeStatus', {'username': socket._data.username, 'status': socket._data.status})
			};
			cb({success: false, error: 'You need to be in a room to change your Status!'})
		}
	});

	socket.on('disconnect', function() {
		if (socket._data.room !== null) {
			io.to(socket._data.room).emit('userLeft', socket._data.username);
		};
	});

	socket.on('adminLogin', function(pass, cb) {
		if (typeof pass === 'string' && /^[a-zA-Z0-9]*$/.test(pass) && pass == "1") {
			socket._data.admin = true;
			cb({success: true});
		} else {
			cb({sucess: false, error: 'Wrong Password!'})
		}
	})

	socket.on('createRoom', function(data, cb) {
		if (socket._data.admin && typeof data === 'object') {
			if (data.name.length >= 4 && data.name.length <= 12) {
				if (/^[a-zA-Z0-9]*$/.test(data.name)) {
					if (rooms.indexOf(rooms.find(rooms => rooms.name === data.name)) === -1 ) {
						fs.writeFile('./data/chatrooms.json', JSON.stringify(rooms.concat(data), null, 2), (err) => {
							if (err) {
								console.log(err)
								cb({
									success: false,
									error: 'Could not save Room'
								})
							} else {
								rooms.push({
									name: data.name,
									public: data.public
								})
								cb({
									success: true,
									data: data
								})
								let keys = Object.keys(io.sockets.connected);
								for (i = 0; i < keys.length; i++) {
									let key = keys[i];
									if (io.sockets.connected[key]._data.room == null) {
										io.to(`${key}`).emit('createRoom', {data: data, access: io.sockets.connected[key]._data.whitelisted})
									}
								}
							}
						});
					} else {
						cb({
							success: false,
							error: 'No Duplicate Room Names!'
						})
					}
				} else {
					cb({
						success: false,
						error: 'No Whitespaces/Special Chars in Room Names!'
					})
				}
			} else {
				cb({
					success: false,
					error: 'Room Name too short/long (min 4 Letters, max 12)'
				})
			}
		}
	})

	socket.on('deleteRoom', function(roomName, cb) {
		if (socket._data.admin && /^[a-zA-Z0-9]*$/.test(roomName) && typeof roomName === 'string') {
			let arrayIndex = rooms.indexOf(rooms.find(rooms => rooms.name === roomName))
			if (arrayIndex > -1) {
				const roomsCopy = rooms.map(room => Object.assign({}, room))
				roomsCopy.splice(arrayIndex, 1);
				fs.writeFile('./data/chatrooms.json', JSON.stringify(roomsCopy, null, 2), (err) => {
					if (err) {
						console.log(err)
						cb({
							success: false,
							error: 'Could not save Room!'
						})
					} else {
						rooms.splice(arrayIndex, 1)
						cb({
							success: true,
							room: roomName
						})
						let keys = Object.keys(io.sockets.connected);
						for (i = 0; i < keys.length; i++) {
							let key = keys[i];
							if (io.sockets.connected[key]._data.room == null) {
								io.to(`${key}`).emit('deleteRoom', {room: roomName, inroom: false})
							} else if (io.sockets.connected[key]._data.room === roomName) {
								io.sockets.connected[key].leave(io.sockets.connected[key]._data.room);
								io.sockets.connected[key]._data.room = null;
								io.to(`${key}`).emit('deleteRoom', {room: roomName, inroom: true})
							}
						}
					}
				});
			} else {
				cb({
					success: false,
					error: 'Room does not exist!'
				})
			}
		}
	})

	socket.on('changeRoomStatus', (data, cb) => {
		if (socket._data.admin && typeof data === 'object') {
			let arrayIndex = rooms.indexOf(rooms.find(rooms => rooms.name === data.name))
			const roomsCopy = rooms.map(room => Object.assign({}, room))
			roomsCopy[arrayIndex].public = data.public
			fs.writeFile('./data/chatrooms.json', JSON.stringify(roomsCopy, null, 2), (err) => {
				if (err) {
					console.log(err)
					cb({
						success: false,
						error: 'Could not save Room Status'
					})
				} else {
					rooms[arrayIndex].public = data.public
					cb({
						success: true,
						name: data.name,
						public: data.public
					})
					let keys = Object.keys(io.sockets.connected);
					for (i = 0; i < keys.length; i++) {
						let key = keys[i];
						if (io.sockets.connected[key]._data.room == null) {
							io.to(`${key}`).emit('changeRoomStatus', {data: data, access: io.sockets.connected[key]._data.whitelisted})
						}
					}
				}
			});
		}
	})

	socket.on('getWhitelist', function(cb) {
		if (socket._data.admin) {
			cb(whitelist)
		}
	})

	socket.on('removeFromWhitelist', function(name, cb) {
		if (socket._data.admin && typeof name === 'string') {
			let arrayIndex = whitelist.indexOf(name)
			const whitelistCopy = whitelist.slice()
			whitelistCopy.splice(arrayIndex, 1)
			fs.writeFile('./data/whitelist.json', JSON.stringify(whitelistCopy, null, 2), (err) => {
				if (err) {
					console.log(err)
					cb({
						success: false,
						error: 'Could not remove User from Whitelist'
					})
				} else {
					whitelist.splice(arrayIndex, 1)
					cb({
						success: true,
						name: name
					})
					let keys = Object.keys(io.sockets.connected);
					for (i = 0; i < keys.length; i++) {
						let key = keys[i];
						if (io.sockets.connected[key]._data.username == name) {
							io.sockets.connected[key]._data.whitelisted = false;
							if (io.sockets.connected[key]._data.room == null) {
								io.to(`${key}`).emit('changeWhitelistStatus', false)
							}
						}
					}
				}
			});
		}
	})

	socket.on('addToWhitelist', function(user, cb) {
		if (socket._data.admin && typeof user === 'string') {
			const whitelistCopy = whitelist.slice()
			whitelistCopy.push(user)
			fs.writeFile('./data/whitelist.json', JSON.stringify(whitelistCopy, null, 2), (err) => {
				if (err) {
					console.log(err)
					cb({
						success: false,
						error: 'Could not add User to Whitelist'
					})
				} else {
					whitelist.push(user)
					cb({
						success: true,
						name: user
					})
					let keys = Object.keys(io.sockets.connected);
					for (i = 0; i < keys.length; i++) {
						let key = keys[i];
						if (io.sockets.connected[key]._data.username == user) {
							io.sockets.connected[key]._data.whitelisted = true;
							if (io.sockets.connected[key]._data.room == null) {
								io.to(`${key}`).emit('changeWhitelistStatus', true)
							}
						}
					}
				}
			});
		}
	})

	/*
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

socket.on('requestWhitelist', function(fn) {
	if (adminlist.find(id => id.id === socket.id)) {
		fs.readFile('whitelist.json', (err, data) => {
		data = JSON.parse(data);
		fn(data)
		})
	}
})

socket.on('removeFromWhitelist', function(user, fn) {
	if (adminlist.find(id => id.id === socket.id)) {
		fs.readFile('whitelist.json', (err, data) => {
			data = JSON.parse(data);
			data.splice(user, 1);
			data = JSON.stringify(data);
			fs.writeFile('whitelist.json', data, (err) => { if (err) console.log(err) });
			fn(user);
		})
	}
})

socket.on('whitelistUser', function(user, fn) {
	if (adminlist.find(id => id.id === socket.id)) {
	fs.readFile('whitelist.json', (err, data) => {
		let test = 0;
		data = JSON.parse(data);
		data.push(user);
		console.log(data)
		test = data.length
		data = JSON.stringify(data);
		fs.writeFile('whitelist.json', data, (err) => { if (err) console.log(err) });
		fn(user, test)
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
})*/

});

http.listen(3000, function(){
console.log('listening on *:3000');
});
// - - - - - - - - - - - - - -
