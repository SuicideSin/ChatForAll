var socket = io();
	
var startPage = document.getElementById('startPage');
var usernameInputSignIn = document.getElementById('user_usernameSignIn');
var usernameInputSignUp = document.getElementById('user_usernameSignUp');
var signin = document.getElementById('signinButton');
var signup = document.getElementById('signupButton');
var signinBack = document.getElementById('backButtonSignIn');
var signupBack = document.getElementById('backButtonSignUp');
var signinLnk = document.getElementById('signinButtonLink');
var signupLnk = document.getElementById('signupButtonLink');
var passwordInputSignIn = document.getElementById('user_passwordSignIn');
var passwordInputSignUp = document.getElementById('user_passwordSignUp');
var logout = document.getElementById('logoutButton');
var send = document.getElementById('chatSendButton');
var users = document.getElementById('usersOnline');
var chat = document.getElementById('chatArea');
var chatMsg = document.getElementById('chatMsg');
var chatbox = document.getElementById('chatbox');

window.setInterval(function() {
	var elem = document.getElementById('chatArea');
	elem.scrollTop = elem.scrollHeight;
}, 1000);

signin.onclick = function(){
	socket.emit('userSignin',{username:usernameInputSignIn.value,password:passwordInputSignIn.value});
}
signup.onclick = function(){
	socket.emit('userSignup',{username:usernameInputSignUp.value,password:passwordInputSignUp.value});
}
signinLnk.onclick = function(){
	startPage.style.display = 'none';
	signInPage.style.display = 'block';
}
signupLnk.onclick = function(){
	startPage.style.display = 'none';
	signUpPage.style.display = 'block';
}
backButtonSignUp.onclick = function(){
	signUpPage.style.display = 'none';
	startPage.style.display = 'block';
}
backButtonSignIn.onclick = function(){
	signInPage.style.display = 'none';
	startPage.style.display = 'block';
}

socket.on('signinCheck',function(data){
	if(data.success){
		signInPage.style.display = 'none';
		chatPage.style.display = 'inline-block';
	} else
		alert("Sign in unsuccessful.");
});

socket.on('signupCheck',function(data){
	if(data == 0) alert("Sign up successful.");
	else if(data == -1) alert("The username is already taken.");
});


socket.on('clearUser',function(data){
	users.innerHTML = '<h2 style="text-align:center;font-size:20px;">Users Online</h2>';
});

socket.on('addUser',function(data){
	users.innerHTML += '<div style="text-align:center;">' + data + '</div>';
});
	
socket.on('updateChat',function(data){
	chat.innerHTML += '<div>' + data + '</div>';
});

socket.on('invalidSend',function(data){
	alert("You can't send a private message to yourself!");
});

socket.on('invalidUser',function(data){
	alert("User " + data + " is not online.");
});

chatbox.onsubmit = function(e){
	e.preventDefault();
	if(chatMsg.value.length > 0){
		if(chatMsg.value.startsWith('\\')){
			var message = chatMsg.value.split(' ');
			socket.emit('privateMsg',{sendTo: message[0].substring(1,message[0].length), msg: message});
		}
		else{
			var message = chatMsg.value.split(' ');
			socket.emit('sendMsg',message);
		}
	}
	chatMsg.value = '';
}

send.onclick = function(){
	if(chatMsg.value.length > 0){
		if(chatMsg.value.startsWith('\\')){
			var message = chatMsg.value.split(' ');
			socket.emit('privateMsg',{sendTo: message[0].substring(1,message[0].length), msg: message});
		}
		else{
			var message = chatMsg.value.split(' ');
			socket.emit('sendMsg',message);
		}
	}
	chatMsg.value = '';
}
	
logout.onclick = function(){
	socket.emit('disconnect');
	socket.disconnect();
	location.reload(true);
}