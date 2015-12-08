var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var redis = require('redis');
var fs = require('fs');

app.listen(8088);
 
function handler(req, res){
    fs.readFile(__dirname + '/index.html', function(err,data){
        if(err){
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
        res.writeHead(200);
        console.log("Listening on port 8088");
        res.end(data);
    });
}
 
//var store = redis.createClient();
var pub = redis.createClient();
var sub = redis.createClient();

var rooms = [];
var users = [];
var messages = [];
 
io.sockets.on('connection', function (client) {
    
    sub.subscribe("chat");

    sub.on("message", function (channel, message) {
        client.emit("message", message);
    });

    client.on("join", function (user) {
        users.push(user);
        var message = {
            username : user.username,
            timestamp : new Date().toString(),
            content :  'joined the chat'
        }
        pub.publish("chat", JSON.stringify(message));
    });
    client.on("message", function (message) {
        message.timestamp = new Date().toString();
        messages.push(message);
        pub.publish("chat", JSON.stringify(message));//gets caught above in sub.on("message")
    });
    client.on('reconnecting', function () {
        console.log("reconnecting");
    });
    client.on('disconnect', function () {
        console.log("DISCONNECT")
        pub.publish("chat", client.id + " disconnected");
        sub.quit();
    });
     
  });