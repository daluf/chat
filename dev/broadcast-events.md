### User-Events

#### userJoined
* description: emitted to other users in a room when a new user joins the room
* payload: {username: string, status: string}

#### userLeft
* description: emitted to other users in a room when a user leaves the room
* payload: username - string

#### message
* description: emitted to users in a room when a user sends a new message
* payload: {id: string, username: string, message: string}
```
{id: "<SOCKET-ID-OF-SENDER>:<TIMESTAMP>", username: "daluf", message: "maaan ausbilder nerven echt"}
```

#### deleteMessage
* description: emitted to users in a room when a user deletes one of his previously sent messages
* payload: {id: string}
```
{id: "<SOCKET-ID-OF-SENDER>:<TIMESTAMP>"}
```

#### changeStatus
* description: emitted to users in a room when a user changes his status
* payload: {username: string, status: "online"|"away"|"busy"}
```
{username: "daluf", status: "away"}
```

#### disconnect
* description: emitted to users in a room when a user disconnects
* payload: username - string

#### createRoom
* description: show newly created room
* payload: {data: {name: string, public: boolean}, access: boolean}
```
{data: {name: "room1", public: true}, access: true}
```

#### deleteRoom
* description: remove room from list
* payload: {name: string, inroom: boolean}

#### changeRoomStatus
* description: change room status in list
* payload: {name: string, public: boolean}
```
{name: "room1", public: false}
```
