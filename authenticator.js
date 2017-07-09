var request = require('request');

var googleUrl = "https://www.googleapis.com/oauth2/v3/tokeninfo";

function Authenticator() {
  this.cache = {}
}

Authenticator.prototype.validateToken = function (token, callBack) {
  if (token in this.cache) {
    callBack(true, this.cache[token]);
  } else {
    this.askGoogle(token, callBack);
  }
}

Authenticator.prototype.askGoogle = function (token, callBack) {
  var self = this;

  var query = {
    url: googleUrl,
    qs: {id_token: token}
  };

  request(query, function (error, response, body) {
    var bodyObj = JSON.parse(body);
    if ("error_description" in bodyObj) {
      callBack(false, bodyObj["error_description"]);
    } else {
      self.cache[token] = bodyObj["email"];
      callBack(true, bodyObj["email"]);
    }
  });
}

module.exports.Authenticator = Authenticator;
