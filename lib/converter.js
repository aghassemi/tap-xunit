var parser = require('tap-parser');
var through = require('through2');
var duplexer = require('duplexer');
var xmlbuilder = require('xmlbuilder');
var extend = require('xtend');

module.exports = converter;

var defaults = {
  // Whether the TAP comments should not be used as test-suite names
  dontUseCommentsAsTestNames: false,

  // Whether . in test-suite names should be replaced with Unicode dot
  // NOTE: this feature exist because many xUnit reporters assume . in
  // test-suite name implies package hierarchy, which may not be the case.
  replaceWithUnicodeDot: false,

  // If specified, all test-suites will be prefixed with the given
  // package name.
  // NOTE: replaceWithUnicodeDot does not apply to package and . can be
  // used to specify package hierarchy.
  package: '',

  // Whether tap parser should be in strict mode or not, false by default.
  strict: false,
};

function converter(options) {
  options = extend(defaults, options);

  var outStream = through();
  var tapParser = parser();
  tapParser.strict = options.strict;

  var curTestXml;
  var noMoreTests = false;
  var curNumTests = 0;
  var curNumFailed = 0;
  var curNumSkipped = 0;
  
  var exitCode = 0;

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
      name: '#' + assert.id + ' ' + assert.name
    });

    curNumTests++;
    if (assert.skip) {
      curNumSkipped++;
      testCaseXml.ele('skipped');
    } else {
      if (!assert.ok) {
        curNumFailed++;
        exitCode = 1;
        var failureXml = testCaseXml.ele('failure');
        if(assert.diag) {
          failureXml.txt(formatFailure(assert.diag));
        }
      }
    }
  });

  tapParser.on('plan', function(p) {
    // we got to the end, ignore any tests after it
    closeCurTest();
    noMoreTests = true;
  });

  tapParser.on('complete', function(r) {
    // output any parse errors
    if (r.failures) {
      r.failures.forEach(function(fail) {
        if (fail.tapError) {
          var err = new Error('TAP parse error: ' + fail.tapError);
          outStream.emit('error', err);
        }
      });
    }
    // prettify and output the xUnit xml.
    var xmlString = rootXml.end({
      pretty: true,
      indent: '  ',
      newline: '\n'
    });
    outStream.push(xmlString + '\n');
    outStream.emit('end');
    result.exitCode = exitCode;
  });

  var result = duplexer(tapParser, outStream);

  return result;

  function newTest(testName) {
    testName = formatTestName(testName);
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

  function formatTestName(testName) {
    if (options.replaceWithUnicodeDot) {
      var unicodeDot = '\uFF0E'; //full width unicode dot
      testName = testName.replace(/\./g, unicodeDot);
    }

    if (options.package) {
      testName = options.package + '.' + testName;
    }
    if(testName.indexOf('#') === 0) {
      testName = testName.substr(1);
    }
    return testName.trim();
  }

  function formatFailure(diag) {
    var text = '\n          ---\n';

    for(var key in diag) {
      if(diag.hasOwnProperty(key) && diag[key] !== undefined) {
        var value = diag[key];
        text += '            '+key+': ' + (typeof value === 'object' ? JSON.stringify(value) : value) + '\n';
      }
    }

    text += '          ...\n      ';

    return text;
  }
}