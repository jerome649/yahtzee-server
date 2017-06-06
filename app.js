var express = require('express')
var bodyParser = require('body-parser');

var app = express()

singleComputer = function(number) {
  this.number = number;
}

singleComputer.prototype.compute = function(dices) {
  var res = 0;
  for (var i = 0; i < dices.length; i++) {
    if (dices[i] == this.number) {
      res += this.number;
    }
  }
  return res;
}

sameComputer = function(size) {
  this.size = size;
}

sameComputer.prototype.compute = function(dices) {
  var res = 0;
  for (var i = 0; i < dices.length - (this.size - 1); i++) {
    var all = true;
    for (var j = 0; j < this.size - 1; j++) {
      all = all && dices[i+j] == dices[i+j+1];
    }
    if (all) {
      res = this.size * dices[i];
    }
  }
  return res;
}

straightComputer = function(offset) {
  this.offset = offset;
}

straightComputer.prototype.compute = function(dices) {
  var all = true;
  for (var i = 0; i < dices.length; i++) {
    all = all && (dices[i] == i+this.offset);
  }
  if (all) {
    return 15;
  } else {
    return 0;
  }
}

yahtzeeComputer = function() {}

yahtzeeComputer.prototype.compute = function(dices) {
  var all = true;
  for (var i = 0; i < dices.length - 1; i++) {
    all = all && (dices[i] == dices[i+1]);
  }
  if (all) {
    return 50;
  } else {
    return 0;
  }
}

chanceComputer = function() {}

chanceComputer.prototype.compute = function(dices) {
  var res = 0;
  for (var i = 0; i < dices.length; i++) {
    res += dices[i];
  }
  return res;
}

fullHouseComputer = function() {}

fullHouseComputer.prototype.compute = function(dices) {
  var t1 = dices[0] == dices[1] && dices[1] == dices[2] && dices[3] == dices[4];
  var t2 = dices[0] == dices[1] && dices[2] == dices[3] && dices[3] == dices[4];
  if (t1 || t2) {
    var computer = new chanceComputer();
    return computer.compute(dices);
  }
  return 0;
}

doublePairComputer = function() {}

doublePairComputer.prototype.compute = function(dices) {
  if (dices[0] == dices[1] && dices[2] == dices[3]) {
    return 2 * (dices[0] + dices[2])
  }
  if (dices[1] == dices[2] && dices[3] == dices[4]) {
    return 2 * (dices[1] + dices[3])
  }
  return 0;
}

itemScore = function(computer) {
  this.done = false;
  this.score = 0;
  this.estimated = 0;
  this.computer = computer;
}

playerScore = function(name) {
  this.name = name;
  this.ones = new itemScore(new singleComputer(1));
  this.twos = new itemScore(new singleComputer(2));
  this.threes = new itemScore(new singleComputer(3));
  this.fours = new itemScore(new singleComputer(4));
  this.fives = new itemScore(new singleComputer(5));
  this.sixes = new itemScore(new singleComputer(6));
  this.pair = new itemScore(new sameComputer(2));
  this.doublePair = new itemScore(new doublePairComputer());
  this.threeOfAKind = new itemScore(new sameComputer(3));
  this.fourOfAKind = new itemScore(new sameComputer(4));
  this.smallStraight = new itemScore(new straightComputer(1));
  this.largeStraight = new itemScore(new straightComputer(2));
  this.fullHouse = new itemScore(new fullHouseComputer());
  this.chance = new itemScore(new chanceComputer());
  this.yahtzee = new itemScore(new yahtzeeComputer());
  this.singles = [
    this.ones,
    this.twos,
    this.threes,
    this.fours,
    this.fives,
    this.sixes
  ]
  this.complex = [
    this.pair,
    this.doublePair,
    this.threeOfAKind,
    this.fourOfAKind,
    this.smallStraight,
    this.largeStraight,
    this.fullHouse,
    this.chance,
    this.yahtzee
  ]
  this.bonus = 0;
  this.total = 0;
}

playerScore.prototype.computedEstimates = function(dices) {
  var all = this.singles.concat(this.complex);
  for (var i = 0; i < all.length; i++) {
    if (!all[i].done) {
      all[i].estimated = all[i].computer.compute(dices);
    }
  }
}

playerScore.prototype.updateScore = function() {
  var singles = 0;
  for (var i = 0; i < this.singles.length; i++) {
    singles += this.singles[i].done ? this.singles[i].score : 0;
  }
  this.bonus = singles >= 63 ? 50 : 0;
  this.total = singles + this.bonus;

  for (var i = 0; i < this.complex.length; i++) {
    this.total += this.complex[i].done ? this.complex[i].score : 0;
  }
}

yahtzeeBoard = function() {
  console.log("Creating a new yahtzee party !");
  this.scores = [new playerScore('Jerome'), new playerScore('Olivier')];
  this.player = Math.random() > 0.5 ? "Jerome" : "Olivier";
  this.dices = [0, 0, 0, 0, 0];
  this.launchDices(this.player, []);
  this.attempt = 2;
}

yahtzeeBoard.prototype.switchUser = function() {
  if (this.scores[0].name == this.player) {
    this.player = this.scores[1].name;
  } else {
    this.player = this.scores[0].name;
  }
}

yahtzeeBoard.prototype.getPlayerScore = function() {
  if (this.scores[0].name == this.player) {
    return this.scores[0];
  } else {
    return this.scores[1];
  }
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

yahtzeeBoard.prototype.launchDices = function(user, keep) {
  if (user.toLowerCase() != this.player.toLowerCase() || this.attempt == 0) {
    return;
  }

  var playerScore = this.getPlayerScore();

  for (var i = 0; i < 5; i++) {
    console.log(i);
    if (keep.indexOf(i) == -1) {
      this.dices[i] = randomIntFromInterval(1, 6);
    }
  }

  playerScore.computedEstimates(this.dices.concat().sort());
  this.attempt -= 1;
  console.log(this.dices);
}

yahtzeeBoard.prototype.validate = function(user, playedItem) {
  if (user.toLowerCase() != this.player.toLowerCase()) { return; }
  var item = this.getPlayerScore()[playedItem];
  if (item.done) { return; }

  item.done = true;
  item.score = item.estimated;
  item.updateScore();

  this.switchUser();
}

currentParty = new yahtzeeBoard();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());

app.get('/ping', function (req, res) {
  console.log("received a ping " + res);
  res.json({'message': 'Connected to yahtzee web api'});
})

app.get('/currentParty', function (req, res) {
  console.log("received a request for current party " + res);
  res.json(currentParty);
})

app.post('/throw', function (req, res) {
  currentParty.launchDices(req.body.user, req.body.keeps);
  res.json({"data": "ok"})
})

app.listen(3000);
