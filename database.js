const fs = require('fs');

// Prepare Whitelist
function loadWhitelist(callback) {
	fs.exists('./data/whitelist.json', (exists) => {
		if (exists) {
			 fs.readFile('./data/whitelist.json', (err, data) => {
				if (err) {
					callback(err);
					return;
				}
				module.exports.whitelist = JSON.parse(data.toString('utf8'))
				callback(null)
			 })
		} else {
			const data = []
			fs.writeFile('./data/whitelist.json', JSON.stringify(data), (err) => {
				if (err) {
					callback(err);
					return;
				}
				module.exports.whitelist = data;
				callback(null)
			});
		}
	})
}

// Prepare Chatrooms
function loadChatRooms(callback) {
	fs.exists('./data/chatrooms.json', (exists) => {
		if (exists) {
			 fs.readFile('./data/chatrooms.json', (err, data) => {
				if (err) {
					callback(err);
					return;
				}
				module.exports.rooms = JSON.parse(data.toString('utf8'))
				callback(null)
			 })
		} else {
			const data = [{name: "Lobby", public: true}]
			fs.writeFile('./data/chatrooms.json', JSON.stringify(data, null, 2), (err) => {
				if (err) {
					callback(err);
					return;
				}
				module.exports.rooms = data;
				callback(null)
			});
		}
	})
}

// Create a Room and save it
function createRoom(data, callback) {
	module.exports.rooms.push({
		name: data.name,
		public: data.public
	})
	saveChatRooms((err) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null);
	});
}

// Delete a Room and save it
function deleteRoom(roomIndex, callback) {
	module.exports.rooms.splice(roomIndex, 1)
	saveChatRooms((err) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null);
	});
}

// Change Room Status and save it
function changeRoomStatus(data, callback) {
	module.exports.rooms[data.arrayIndex].public = data.public
	saveChatRooms((err) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null);
	});
}

// Add User to Whitelist and save it
function addToWhitelist(user, callback) {
	if (!module.exports.whitelist.includes(user)) {
		module.exports.whitelist.push(user);
		saveWhitelist((err) => {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	} else {
		callback('User is already whitelisted')
	}
}

// Remove User from Whitelist and save it
function removeFromWhitelist(user, callback) {
	if (module.exports.whitelist.includes(user)) {
		module.exports.whitelist.splice(module.exports.whitelist.indexOf(user), 1);
		saveWhitelist((err) => {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	} else {
		callback('User is not whitelisted')
	}
}

// Function to save Chatrooms
function saveChatRooms(callback) {
	fs.writeFile('./data/chatrooms.json', JSON.stringify(module.exports.rooms, null, 2), (err) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null);
	})
}

// Function to save Whitelist
function saveWhitelist(callback) {
	fs.writeFile('./data/whitelist.json', JSON.stringify(module.exports.whitelist, null, 2), (err) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null);
	})
}

function ensureDataFolderExists(path, callback) {
	fs.stat(path, (err, stats) => {
		if (err) {
			if (err.code === "ENOENT") {
				console.log('data folder not existing - - - creating one ');
				fs.mkdir(path, (err) => {
					if (err) {
						callback(err);
						return;
					}

					callback(null);
					return;
				});
			} else {
				callback(err);
			}
			return;
		}

		if (!stats.isDirectory()) {
			callback(new Error("data folder is a file!"));
			return;
		}

		callback(null)
	});
}

// Initialize ChatRooms and Whitelist
function init(callback) {
	ensureDataFolderExists("./data", (err) => {
		if (err) {
			console.log('Error: ', err)
			console.log('Could not ensure that data folder exists! Exiting...')
			process.exit(1);
		}

		loadChatRooms((err) => {
			if (err) {
				console.log('Error: ', err)
				console.log('Could not load ChatRooms! Exiting...')
				process.exit(1);
			}

			loadWhitelist((err) => {
				if (err) {
					console.log('Error: ', err)
					console.log('Could not load Whitelist! Exiting...')
					process.exit(1);
				}

				callback();
			});
		});
	});
};

module.exports = {
	whitelist: null,
	rooms: null,

	createRoom: createRoom,
	deleteRoom: deleteRoom,
	changeRoomStatus: changeRoomStatus,

	addToWhitelist: addToWhitelist,
	removeFromWhitelist: removeFromWhitelist,

	init: init,
};
