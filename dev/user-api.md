## User-API

#### "socket-disconnect"
* side-effects:
	* if in-room:
		* remove from room
		* broadcast `disconnect` event to all users in the room

#### login
* description: upgrade a socket to a logged in user
* preqrequisites: not-logged-in, available username
* payload: username - string
* response: success flag - boolean
* side-effects:
	* mark user as logged-in

#### listRooms
* description: get all rooms on the server
* preqrequisites: logged-in socket
* payload: none
* response: list of rooms - {name: string, public: false, access: boolean}|{name: string, public: true}[]
```
[
    {name: "Geheimraum", public: false, access: true},
    {name: "Lobby", public: true},
    {name: "Ausbilderraum", public: false, access: false},
    "...."
]
```

#### joinRoom
* description: join a chatroom, giving us access to all new messages sent inside that room
* preqrequisites: logged-in socket, access-if-not-public, not-in-room
* payload: roomName - string
* response: success - boolean
* side-effects:
	* add user to room
	* broadcast `userJoined` event to all other users in the room

#### listRoomUsers
* description: get all users that are currently in the same room as the user
* preqrequisites: logged-in socket, in-room
* payload: none
* response: list of users - {username: string, status: "online"|"away"|"busy"}[]
```
[
	{username: "daluf", status: "away"},
	{username: "vtii", status: "busy"},
    "...."
]
```

#### leaveRoom
* description: leave a chatroom, giving us the possibility to join another room - the server also must stop sending us messages for the room
* preqrequisites: logged-in socket, in-room
* payload: none
* response: success - boolean
* side-effects:
	* remove user from room
	* broadcast `userLeft` event to all other users in the room

#### sendMessage
* description: send a message in the current room
* preqrequisites: logged-in socket, in-room
* payload: message - string
* response: success - boolean
* side-effects:
	* broadcast `message` event to all users in the room

#### deleteMessage
* description: delete a previously sent message
* prerequisites: logged-in socket, in-room, own-message
* payload: messageId - string
* response: success - boolean
* side-effects:
	* broadcast `deleteMessage` event to all users in the room

#### changeStatus
* descripion: set own status, eg: online, away, ...
* prerequisites: logged-in socket, in-room
* payload: newStatus - "online"|"away"|"busy"
* response: success - boolean
* side-effects:
	* mark user with newStatus
	* broadcast `changeStatus` event to all users in the room
