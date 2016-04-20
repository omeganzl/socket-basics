var PORT = process.env.PORT || 3000;
var moment = require('moment');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static(__dirname + '/public'));

var clientInfo = {};

//send current users to provided socket
function sendCurrentUsers(socket) {
	var info = clientInfo[socket.id];
	var users = [];

	if (typeof info === 'undefined') {
		return;
	}

	Object.keys(clientInfo).forEach(function(socketId) {
		var userInfo = clientInfo[socketId];

		if (info.room === userInfo.room) {
			users.push(userInfo.name);
		}
	});

	socket.emit('message', {
		name: 'System',
		text: 'Current Users: ' + users.join(', '),
		timestamp: moment.valueOf()
	})
}

function sendPrivate(socket, message) {
	var info = clientInfo[socket.id];
	console.log(message);
	var stripCommand = message.text.slice(9);
	console.log(stripCommand);
	var user = stripCommand.split(":")
	console.log(user);
	var sendUser = user[0];
	console.log(sendUser)
	var privMessage = user[1];
	var users = [];

	Object.keys(clientInfo).forEach(function(socketId) {
		var userInfo = clientInfo[socketId];

		if (info.room === userInfo.room) {
			users.push(userInfo.name);
			console.log("sendPrivate result: " + users);
		}

	});


	for (var i = 0; i < users.length; i++) {
		console.log(sendUser);
		console.log(typeof sendUser);
		if (users[i] === sendUser) {
			console.log("MATCHED NAME!");
			console.log(clientInfo[socket.id])
			message.timestamp = moment().valueOf();
			io.to(clientInfo[socket.id].name).emit('message', privMessage);
		} else {
			console.log("USER NOT FOUND");
		}
	}


	// users.forEach(function(sendUser) {
	// 	console.log("users: " + users);
	// 	console.log("sendUser: " + sendUser);
	// 	if (users === sendUser) {
	// 		console.log("MATCHED NAME!");
	// 	} else {
	// 		console.log("USER NOT FOUND");
	// 	}
	// });
}

io.on('connection', function(socket) {
	console.log('User connected via socket.io!');

	socket.on('disconnect', function() {
		var userData = clientInfo[socket.id];
		if (typeof userData !== 'undefined') {
			socket.leave(userData);
			io.to(userData.room).emit('message', {
				name: 'System',
				text: userData.name + ' has left!',
				timestamp: moment().valueOf()
			});
			delete clientInfo[socket.id];
		}
	});

	socket.on('joinRoom', function(req) {
		clientInfo[socket.id] = req;
		socket.join(req.room);
		socket.broadcast.to(req.room).emit('message', {
			name: 'System',
			text: req.name + ' has joined!',
			timestamp: moment().valueOf()
		});
	});

	socket.on('message', function(message) {
		console.log('message received: ' + message.text);

		if (message.text === '@currentUsers') {
			sendCurrentUsers(socket);
		} else if (message.text.startsWith('@private')) {
			sendPrivate(socket, message);
		} else {
			message.timestamp = moment().valueOf();
			io.to(clientInfo[socket.id].room).emit('message', message);

		}


	});

	socket.emit('message', {
		name: 'System',
		text: 'Welcome to chat application!',
		timestamp: moment().valueOf()
	});
});

http.listen(PORT, function() {
	console.log('Server Started!');
});