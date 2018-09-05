### User-Events

#### userJoined
* description: emitted to other users in a room when a new user joins the room
* payload: username - string

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
{username: "vtii", status: "busy"}
```

#### disconnect
* description: emitted to users in a room when a user disconnects
* payload: username - string