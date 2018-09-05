# CLIENT

### Client -> Server

1. getOnlineUsers
```js
socket.emit('getOnlineUsers');
```
2. login p: usernameText
```js
socket.emit('login', 'username');
```
3. message p: text
```js
socket.emit('message', 'text');
```
4. removeMessage p: id
```js
socket.emit('removeMessage', id);
```
5. changeStatus p: status
```js
socket.emit('changeStatus', status)
```

### Server -> Client

1. login
```js 
socket.emit('showChat');
```
2. disconnect p: username
```js
io.emit('clientDisconnect', username);
```
3. newMessage p: user, msg, id 
```js
socket.broadcast.emit('newMessage', user, msg, id); 
```
4. getOnlineUsers p: onlineList, statusList
```js
socket.emit('getOnlineUsers', onlineList, statusList)
```
5. removeMessage p: id
```js
io.emit('removeMessage', id)
```
6. changeStatus p: user, status
```js
io.emit('changeStatus', user, status)
```

# ADMIN

### Client -> Server

1. adminLogin p: password
```js
socket.emit('adminLogin', password)
```
2. createNewRoom p: name, state
```js
socket.emit('createNewRoom', name, state)
```
3. setRoomState p: room, state
```js
socket.emit('setRoomState', room, state)
```
4. removeRoom p: room
```js
socket.emit('removeRoom', room)
```
5. requestChatRoom
```js
socket.emit('requestChatRooms')
```
6. whitelistUser p: user
```js 
socket.emit("whitelistUser", user)
```

### Server -> Client

1. yesYouAreAdmin
```js
socket.emit('yesYouAreAdmin');
```
2. responseChatRooms p: rooms
```js
socket.emit('responseChatRooms', data)
```
3. isPublic, isPrivate p: room
```js
socket.emit('isPublic', room)
socket.emit('isPrivate', room)
```
4. roomDeleted p: room
```js
socket.emit('roomDeleted', room)
```
5. roomCreate p: name, state
```js
socket.emit('roomCreate', name, state)
```
6. userWhitelisted p: user
```js 
socket.emit('userWhitelisted', user)
```
