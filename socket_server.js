var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var request = require('request');
//var redis = require('redis');
app.use(bodyParser.json());

const port = 4000;
const nb_server_port=8000;
const server_address = "18.101.16.240"

server.listen(port, server_address);
 
io.use(function(socket, next){
  console.log("Authenticating!");
  var id_source = decodeURIComponent(socket.handshake.query.id_source);
  var auth_key = decodeURIComponent(socket.handshake.query.auth_key);
  var rpc_url = decodeURIComponent(socket.handshake.query.rpc_url);
  var connection_id = decodeURIComponent(socket.handshake.query.connection_id);
  authenticate_socket(id_source, auth_key, rpc_url, connection_id, next);
  return;       
});

authenticate_socket = function(id_source, auth_key, rpc_url, connection_id, next) {
  var auth_url = 'http://' + server_address + ':' + nb_server_port + rpc_url + '/pdf4/rpc?' + auth_key;
  console.log(auth_url);

  var callback = function(err, httpResponse, body) {
    var authenticated = false;
    var result = JSON.parse(body);
    if (result.status.errno) {
      //just display that there was an error for now
      if (errback !== undefined) {
        errback(result.status, result.payload);
      }
      authenticated = false;
    } else {
      authenticated =  true;
    }
    if (authenticated) {
      next();          
    } else {
      next(new Error('Authentication error'));                  
    }
  };

  var requestData = {'cid': connection_id, 'f': 'auth_socket_connection', 'a': JSON.stringify({id_source: id_source})}
  request.post({url: auth_url, formData: requestData}, callback);
}

io.sockets.on('connection', function (socket) {
    console.log("Connected!");
});

app.post('/socket_server', function(req, res, next) {
  var body = req.body;
  io.sockets.emit(body.type, body.comment);

  res.send({});
});