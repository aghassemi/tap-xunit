var parser = require('tap-parser');
var through = require('through2');
var duplexer = require('duplexer');
var xmlbuilder = require('xmlbuilder');

module.exports = converter;

function converter() {
  var outStream = through();
  var tapParser = parser(function(r) {

    // create the xunit XML

    // output any parse errors
    if (r.errors) {
      r.errors.forEach(function(parseErr) {
        var err = new Error('TAP parse error: ' + parseErr.message + '. line: ' + parseErr.line);
        outStream.emit('error', err);
      });
    }
    outStream.emit('end');
  });

  var result = duplexer(tapParser, outStream);

  return result;
}