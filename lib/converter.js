var parser = require('tap-parser');
var through = require('through2');
var duplexer = require('duplexer');
var xmlbuilder = require('xmlbuilder');

module.exports = converter;

function converter() {
  var outStream = through();
  var tapParser = parser();
  var curFailureXml;
  var curTestXml;
  var noMoreTests = false;
  var curNumTests = 0;
  var curNumFailed = 0;

  // create the xunit XML
  var rootXml = xmlbuilder.create('testsuites');

  tapParser.on('comment', function(comment) {
    // close the previous test if there is one.
    if (curTestXml) {
      curTestXml.att('tests', curNumTests);
      curTestXml.att('failures', curNumFailed);
      curTestXml.att('errors', 0);
    }

    if (noMoreTests) {
      return;
    }

    // we have no choice but to assume comment specifies boundries between testsuites.
    newTest(comment);
  });

  tapParser.on('assert', function(assert) {
    // no test name was given, so all asserts go in a single test
    if (!curTestXml) {
      newTest('Default');
    }

    var testCaseXml = curTestXml.ele('testcase', {
      name: '#' + assert.number + ' ' + assert.name
    });
    curNumTests++;
    if (!assert.ok) {
      curNumFailed++;
      curFailureXml = testCaseXml.ele('failure');
    }
  });

  tapParser.on('extra', function(extra) {
    // we have no choice but to assume extras belong to the last failed assession
    if (curFailureXml && extra) {
      curFailureXml.txt(extra);
    }
  });

  tapParser.on('plan', function(p) {
    noMoreTests = true;
  });

  tapParser.on('results', function(r) {
    // output any parse errors
    if (r.errors) {
      r.errors.forEach(function(parseErr) {
        var err = new Error('TAP parse error: ' + parseErr.message + '. line: ' + parseErr.line);
        outStream.emit('error', err);
      });
    }
    var xmlString = rootXml.end({
      pretty: true,
      indent: '  ',
      newline: '\n'
    });
    outStream.push(xmlString);
    outStream.emit('end');
  });

  var result = duplexer(tapParser, outStream);

  return result;

  function newTest(testName) {
    curNumTests = 0;
    curNumFailed = 0;
    curTestXml = rootXml.ele('testsuite', {
      name: testName
    });
  }
}