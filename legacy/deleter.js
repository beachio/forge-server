(function() {
  var fetch, http, rimraf;

  rimraf = require('rimraf');

  http = require('http');
  https = require('https');
  fetch = function() {
    return https.request({
      host: 'getforge.com',
      path: '/deployed.json'
    }, function(response) {
      var str;

      str = "";
      response.on('data', function(chunk) {
        return str += chunk;
      });
      return response.on('end', function() {
        var domain, domains, _i, _len, _results,
          _this = this;

        if (response.statusCode === 200) {
          domains = JSON.parse(str);
          _results = [];
          for (_i = 0, _len = domains.length; _i < _len; _i++) {
            domain = domains[_i];
            _results.push(rimraf("/tmp/cache/" + domain, function() {}));
          }
          return _results;
        }
      });
    }).end();
  };

  fetch();

  setInterval(fetch, 10000);

}).call(this);
