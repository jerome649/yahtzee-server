var port = process.env.PORT || 3000;

var express = require('express')
var bodyParser = require('body-parser');
var http = require('http');
var WebSocket = require('ws');
var yahtzeeBoard = require('./yahtzee').yahtzeeBoard;

var app = express()

var server = http.createServer(app);
var wss = new WebSocket.Server({ server });

function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

currentParty = new yahtzeeBoard();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());

app.get('/ping', function (req, res) {
  console.log("received a ping");
  res.json({'message': 'Connected to yahtzee web api'});
})

app.get('/currentParty', function (req, res) {
  console.log("received a request for current party");
  res.json(currentParty);
})

app.post('/throw', function (req, res) {
  currentParty.launchDices(req.body.user, req.body.keeps);
  broadcast(currentParty);
  res.json({"data": "ok"})
})

app.post('/validate', function (req, res) {
  currentParty.validate(req.body.user, req.body.playedItem);
  broadcast(currentParty);
  res.json({"data": "ok"})
})

server.listen(port, function listening() {
  console.log('Listening on %d', server.address().port);
});
