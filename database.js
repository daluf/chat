const fs = require('fs');

// whitelist
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
			const data = '[]'
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

loadWhitelist((err) => {
	if (err) {
		console.log('Error: ', err)
		console.log('Could not load Whitelist! Exiting...')
		process.exit(1);
	}
})

// chatrooms
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

function saveChatRooms(callback) {
	fs.writeFile('./data/chatrooms.json', JSON.stringify(module.exports.rooms, null, 2), (err) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null);
	})
}

function saveWhitelist(callback) {
	fs.writeFile('./data/whitelist.json', JSON.stringify(module.exports.whitelist, null, 2), (err) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null);
	})
}



function init(callback) {
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
}

module.exports = {
	whitelist: null,
	rooms: null,
	init: init,
};
