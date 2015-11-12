var app = require('express')();
var bodyParser = require('body-parser');
var path = require('path');
var mongo = require('mongodb');
var http = require('http').Server(app);
//var io = require('socket.io')(http);
var WebSocketServer = require('websocket').server;
var db;

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var url = 'mongodb://localhost:27017/testdb';
// Use connect method to connect to the Server 
MongoClient.connect(url, function(err, _db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");
  db = _db;
  //_db.close();
});

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}
app.use(allowCrossDomain);
// parse application/json 
app.use(bodyParser.json());
app.use(function(req,res,next) {
    req.db = db;
    next();
})

app.post('/hello', function (req, res) {
    console.log(req.body);
    console.log(req.body.type);
    res.send('Thanks.');
});

app.post('/projects/:project', function (req, res) {
   console.log("Got a POST request for the homepage");
   //var db = req.db;
   var data = req.body;
   var project = req.params.project;
   var type = data.type;
   var label = data.label;
   var value = data.value;
   var d = new Date();
   var timestamp = d.toISOString();

   //var collection = db.collection('documents');

   var payload = {
        "type": type,
        "label": label,
        "value": value,
        "timestamp": timestamp
   };

   //io.emit('hello', payload);
   res.send('Thanks');
   /*
   collection.insert(payload, function(err, doc) {
        if (err) {
            res.send("There was a problem adding the information to the database.");
        }
        else {
            io.emit('hello', payload);
            res.send('Thanks');
        }
   });
*/
});

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

app.get('/projects/:project', function(req, res) {
    //var db = req.db;
    var data = req.body;
    var project = req.params.project;
    var collection = db.collection(project);
    collection.find({}).toArray(function(err, docs) {
        console.log("got it");
        if (err) {
            res.send("There was a problem getting the information from the database.");
        }
        else {
            res.sendFile('index.html', { root: path.join(__dirname, './') });
        }
    });
});

// io.on('connection', function(socket){
//   console.log('a user connected');
//   io.emit('hello', "Well hello");
//   socket.on('chat message', function(msg){
//     console.log('message: ' + msg);
//   });
//   socket.on('disconnect', function(){
//     console.log('user disconnected');
//   });
// });

http.listen(81, function(){
  console.log('listening on *:3000');
});

wsServer = new WebSocketServer({
    httpServer: http,
    // You should not use autoAcceptConnections for production 
    // applications, as it defeats all standard cross-origin protection 
    // facilities built into the protocol and the browser.  You should 
    // *always* verify the connection's origin and decide whether or not 
    // to accept it. 
    autoAcceptConnections: false
});
 
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}

var connections = [];
var webclientconnection = false;
 
wsServer.on('request', function(request) {
    
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin 
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('arduino', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connections.push(connection);
    console.log("Number of connections: "+connections.length);
    
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            //console.log('Received Message: ' + message.utf8Data);
            //for (var i=0; i<connections.length; i+=1) {
            //    connections[i].sendUTF(message.utf8Data);   
            //}            
            if (message.utf8Data == 'Hello from Web Client') {
                console.log("found the web client!");
                webclientconnection = connection;
            }
            if (webclientconnection != false && connection != webclientconnection) {
                var re = new RegExp("'", 'g');
                var clean_data = message.utf8Data.replace(re,'"');
                var obj = JSON.parse(clean_data);
                var d = new Date();
                obj.timestamp = d.toISOString();
                webclientconnection.sendUTF(JSON.stringify(obj));
            }
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        for (var i=0; i<connections.length; i+=1) {
            if (connections[i] == connection) {
                connections.splice(i,1);
            }
        }
        if (connection == webclientconnection) {
            webclientconnection = false;
        }
        console.log("Number of connections: "+connections.length);
    });
    
    connection.sendUTF("Hallo Client!");
});