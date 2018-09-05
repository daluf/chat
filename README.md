# CLIENT

### Client -> Server

1. getOnlineUsers
```js
socket.emit('getOnlineUsers');
```
2. login p: usernameText
```js
socket.emit('login', username);

example:
socket.emit('login', 'Manfred');
```
3. message p: text
```js
socket.emit('message', text);

example:
socket.emit('message', 'Hello');
```
4. removeMessage p: id
```js
socket.emit('removeMessage', id);

example:
socket.emit('removeMessage', 5);
```
5. changeStatus p: status
```js
socket.emit('changeStatus', status)

example:
socket.emit('changeStatus', 'away');
```

### Server -> Client

1. login
```js 
socket.emit('showChat');
```
2. disconnect p: username
```js
io.emit('clientDisconnect', username);

example:
io.emit('clientDisconnect', 'Manfred');
```
3. newMessage p: user, msg, id 
```js
io.emit('newMessage', user, msg, id);

example:
io.emit('newMessage', 'Manfred', 'Hello', 5);
```
4. getOnlineUsers p: onlineList, statusList
```js
socket.emit('getOnlineUsers', onlineList, statusList);

example:
let onlineList = ["Manfred"];
let statusList = ["online"];
socket.emit('getOnlineUsers', onlineList, statusList);
```
5. removeMessage p: id
```js
io.emit('removeMessage', id);

example:
io.emit('removeMessage', 5);
```
6. changeStatus p: user, status
```js
io.emit('changeStatus', user, status);

example:
io.emit('changeStatus', 'Manfred', 'away');
```

# ADMIN

### Client -> Server

1. adminLogin p: password
```js
socket.emit('adminLogin', password)

example:
socket.emit('adminLogin', 'secretPass')
```
2. createNewRoom p: name, state
```js
socket.emit('createNewRoom', name, state)

example:
socket.emit('createNewRoom', 'Room 1', 'public')
```
3. setRoomState p: name, state
```js
socket.emit('setRoomState', name, state)

example:
socket.emit('setRoomState', 'Room 1', 'private')
```
4. removeRoom p: room
```js
socket.emit('removeRoom', room)

example:
socket.emit('removeRoom', 'Room 1')
```
5. requestChatRoom
```js
socket.emit('requestChatRooms')
```
6. whitelistUser p: user
```js 
socket.emit('whitelistUser', user)

example:
socket.emit('whitelistUser', 'Manfred')
```

### Server -> Client

1. yesYouAreAdmin
```js
socket.emit('yesYouAreAdmin');
```
2. responseChatRooms p: rooms
```js
socket.emit('responseChatRooms', data)

example:
let chatRooms = {"Room 1":{"privacy":"public"},"Room 2":{"privacy":"private"}}

socket.emit('responseChatRooms', chatRooms)
```
3. isPublic, isPrivate p: room
```js
socket.emit('isPublic', room)
socket.emit('isPrivate', room)

example:
socket.emit('isPublic', 5)
```
4. roomDeleted p: room
```js
socket.emit('roomDeleted', room)

example:
socket.emit('roomDeleted', 'Room 1')
```
5. roomCreate p: name, state
```js
socket.emit('roomCreate', name, state)

example:
socket.emit('roomCreate', 'Room 1', 'public')
```
6. userWhitelisted p: user
```js 
socket.emit('userWhitelisted', user)

example:
socket.emit('userWhitelisted', 'Manfred')
```
