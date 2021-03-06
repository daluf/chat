## Admin-API

#### adminLogin
* description: upgrade a socket to a logged in admin
* preqrequisites: not-logged-in
* payload: password - string
* response: {success: boolean, error?: string}
* side-effects:
	* mark admin as admin-logged-in

#### listRooms
* description: get all rooms on the server
* preqrequisites: admin-logged-in socket
* payload: none
* response: list of rooms - {name: string, public: false}[]
```
[
    {name: "Geheimraum", public: false},
    {name: "Lobby", public: true},
    {name: "Ausbilderraum", public: false},
    "...."
]
```

#### createRoom
* description: create a new chatroom on the server
* preqrequisites: admin-logged-in socket, available room name
* payload: {name: string, public: boolean}
* response: {success: boolean, error?: string, data: {name: string, public: boolean}}
* side-effects: 
	* show created room
	* save new room into JSON
	* broadcast `createRoom` event to logged-in and not-in-room users

#### deleteRoom
* description: delete a chatroom from the server
* preqrequisites: admin-logged-in socket, created room 
* payload: roomName - string
* response: {success: boolean, error?: string}
* side-effects: 
	* remove users from deleted room
	* delete room
	* remove room from JSON
	* broadcast `deleteRoom` event to (logged-in and not-in-room users) and (in-room users)

#### changeRoomStatus
* description: change room status
* preqrequisites: admin-logged-in socket, created room
* payload: {name: string, public: boolean}
* response: {success: boolean, error?: string}
* side-effects: 
	* show new room status
	* save room status into JSON
	* broadcast `changeRoomStatus` event to logged-in not-in-room users

#### getWhitelist
* description: get all whitelisted users and show them
* preqrequisites: admin-logged-in socket
* payload: none
* response: list of whitelisted users []
* side-effects: 
	* show whitelisted users
```
[
	"daluf",
	"vtii",
	"..."
]
```

#### addToWhitelist
* description: add user to whitelist
* preqrequisites: admin-logged-in socket, user not whitelisted
* payload: username - string
* response: success flag - boolean
* side-effects: 
	* show whitelisted user
	* save whitelisted user into JSON
	* send `changeWhitelistStatus` event with new whitelistStatus to user

#### removeFromWhitelist
* description: remove user from whitelist
* preqrequisites: admin-logged-in socket, user whitelisted
* payload: username - string
* response: {success: boolean, error?: string}
* side-effects: 
	* remove whitelisted user
	* remove whitelisted user from JSON
	* send `changeWhitelistStatus` event with new whitelistStatus to user 
