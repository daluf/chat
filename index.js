// socket IO + webServer
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');


const adminlist = [];

const database = require('./database.js')

database.init(() => {
	console.log(database.rooms)

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
	});

	http.listen(3000, function(){
	console.log('listening on *:3000');
	});
	// - - - - - - - - - - - - - -
})
