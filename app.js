var port = process.env.PORT || 3000;

var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var WebSocket = require('ws');
var yahtzeeBoard = require('./yahtzee').yahtzeeBoard;
var Authenticator = require('./authenticator').Authenticator;

var app = express()

var server = https.createServer({
      key: fs.readFileSync('./ssl/key.pem'),
      cert: fs.readFileSync('./ssl/cert.pem')
    }, app);

var wss = new WebSocket.Server({ server });

function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

var currentParty = new yahtzeeBoard(process.argv[2], process.argv[3]);
var authenticator = new Authenticator();

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
  authenticator.validateToken(req.body.token, function(r, user) {
    if (r) {
      currentParty.launchDices(user, req.body.keeps);
      broadcast(currentParty);
      res.json({"data": "ok"});
    } else {
      res.json({"data": "not authorized"});
    }
  });
})

app.post('/validate', function (req, res) {
  authenticator.validateToken(req.body.token, function(r, user) {
    if (r) {
      currentParty.validate(user, req.body.playedItem);
      broadcast(currentParty);
      res.json({"data": "ok"})
    } else {
      res.json({"data": "not authorized"});
    }
  });
})

server.listen(port, function listening() {
  console.log('Listening on %d', server.address().port);
});
