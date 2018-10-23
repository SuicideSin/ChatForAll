var mongojs = require("mongojs");
var db = mongojs(process.env.MONGOLAB_URI,['account']);
var express = require('express');
var moment = require('moment');
var emoji = require('node-emoji');
const bcrypt = require('bcrypt');
var app = express();
var serv = require('http').Server(app);
app.use(express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

var SOCKET_LIST = {};

var User = function(data){
	var self={};
	self.id = data.id;
	self.username = data.username;
	User.list[self.id] = self;
	return self;
}

var previousUser = null;

User.list = {};
User.onConnect = function(socket,username){
	var user = User({
		username:username,
		id:socket.id
	});

	for(var i in SOCKET_LIST){
		SOCKET_LIST[i].emit('clearUser','');
		for(var j in User.list){
			SOCKET_LIST[i].emit('addUser',entities.encode(User.list[j].username));
		}
	}

	socket.on('sendMsg',function(data){
		var message = '';
		for(var i in data){
			if(data[i].startsWith(":") && emoji.hasEmoji(data[i].substring(1,data[i].length)))
				message += emoji.get(data[i].substring(1,data[i].length)) + ' ';
			else message += data[i] + ' ';
		}
		if(user.username === previousUser){
			for(var i in SOCKET_LIST){	
				SOCKET_LIST[i].emit('updateChat',entities.encode(message));
			}
		}
		else{
			for(var i in SOCKET_LIST){
				SOCKET_LIST[i].emit('updateChat','<hr><b>' + entities.encode(user.username)+'</b> '+
												 '<span style="color:gray;font-size:12px">' + moment().add(7, 'hours').format('hh:mm:ss') + '</span><br>'
												 +entities.encode(message));
			}
			previousUser = user.username;
		}
	});

	socket.on('privateMsg',function(data){
		if(user.username == data.sendTo) SOCKET_LIST[user.id].emit('invalidSend','');
		else{
			var message = '';
			for(var i in data.msg){
				if(i == 0) continue;
				if(data.msg[i].startsWith(":") && emoji.hasEmoji(data.msg[i].substring(1,data.msg[i].length)))
					message += emoji.get(data.msg[i].substring(1,data.msg[i].length)) + ' ';
				else message += data.msg[i] + ' ';
			}
			var sent = false;
			for(var i in User.list){
				if(User.list[i].username == data.sendTo){
					SOCKET_LIST[User.list[i].id].emit('updateChat','<span style="background-color:yellow"><b>From ' + entities.encode(user.username)+': </b> '+entities.encode(message)+'</span>');
					sent = true;
					break;
				}
			}
			if(!sent) SOCKET_LIST[user.id].emit('invalidUser',data.sendTo);
			else SOCKET_LIST[user.id].emit('updateChat','<span style="background-color:yellow"><b>To ' + entities.encode(data.sendTo)+': </b> '+entities.encode(message)+'</span>');
		}
	});
}
User.onDisconnect = function(socket){
	delete User.list[socket.id];
}

var isValidPassword = function(data,cb){
	db.account.find({username:data.username},function(err,res){
		if(res.length > 0){
			bcrypt.compare(data.password, res[0].password, function(err, res) {
		      if(res) {
		      	cb(true);
		      } else {
		      	cb(false);
		      } 
		    });
		}
		else
			cb(false);
	});
}

var isUsernameTaken = function(data,cb){
	db.account.find({username:data.username},function(err,res){
		if(res.length > 0)
			cb(true);
		else
			cb(false);
	});
}
var addUser = function(data){
	bcrypt.hash(data.password, 10, function(err, hash) {
    	db.account.insert({username:data.username,password:hash},function(err){});
    });
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	socket.on('userSignin',function(data){
		isValidPassword(data,function(res){
			if(res){
				User.onConnect(socket,data.username);
				socket.emit('signinCheck',{success:true});
			} else{
				if(data.username.length > 0 && data.password.length > 0)
					socket.emit('signinCheck',{success:false});
			}
		});
	});
	socket.on('userSignup',function(data){
		isUsernameTaken(data,function(res){
			if(res){
				socket.emit('signupCheck',-1);//{success:false});
			} else{
				if(data.username.length > 0 && data.password.length > 0){
					addUser(data);
					socket.emit('signupCheck',0);//{success:true});
				}
			}
		});
	});
	
	socket.on('disconnect',function(){
		for(var i in User.list){
			if(socket.id === User.list[i].id){
				if(User.list[i].username === previousUser)
					previousUser = null;
				break;
			}
		}
		delete SOCKET_LIST[socket.id];
		User.onDisconnect(socket);
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('clearUser','');
			for(var j in User.list){
				SOCKET_LIST[i].emit('addUser',entities.encode(User.list[j].username));
			}
		}
	});
});
