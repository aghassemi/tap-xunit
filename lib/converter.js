var parser = require('tap-parser');
var through = require('through2');
var duplexer = require('duplexer');
var xmlbuilder = require('xmlbuilder');
var extend = require('xtend');

module.exports = converter;

var defaults = {
  dontUseCommentsAsTestNames: false
};

function converter(options) {
  options = extend(defaults, options);

  var outStream = through();
  var tapParser = parser();

  var curFailureXml;
  var curTestXml;
  var noMoreTests = false;
  var curNumTests = 0;
  var curNumFailed = 0;
  var curNumSkipped = 0;

  // create the xunit XML root
  var rootXml = xmlbuilder.create('testsuites');

  tapParser.on('comment', function(comment) {
    // comment specifies boundaries between testsuites, unless feature disabled.
    if (options.dontUseCommentsAsTestNames) {
      return;
    }
    if (noMoreTests) {
      return;
    }
    // close the current test, if any.
    closeCurTest();
    // create new test
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

    // we keep track of current failure xml node since "extras" become the stack trace
    curFailureXml = null;
    curNumTests++;
    if (isSkipped(assert.name)) {
      curNumSkipped++;
      testCaseXml.ele('skipped');
    } else {
      if (!assert.ok) {
        curNumFailed++;
        curFailureXml = testCaseXml.ele('failure');
      }
    }
  });

  tapParser.on('extra', function(extra) {
    // we assume extras belong to the failed assertion if there is one, otherwise they are ignored
    if (curFailureXml && extra) {
      curFailureXml.txt(extra);
    }
  });

  tapParser.on('plan', function(p) {
    // we got to the end, ignore any tests after it
    closeCurTest();
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
    // prettify and output the xUnit xml.
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
    curNumSkipped = 0;
    curTestXml = rootXml.ele('testsuite', {
      name: testName
    });
  }

  function closeCurTest() {
    // close the previous test if there is one.
    if (curTestXml) {
      curTestXml.att('tests', curNumTests);
      curTestXml.att('failures', curNumFailed);
      if (curNumSkipped > 0) {
        curTestXml.att('skipped', curNumSkipped);
      }
      curTestXml.att('errors', 0);
    }
  }
}

function isSkipped(name) {
  // considered skipped if ends with skip directive.
  var suffix = "# SKIP";
  return name.trim().indexOf(suffix, this.length - suffix.length) !== -1;
}