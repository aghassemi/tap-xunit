var parser = require('tap-parser');
var through = require('through2');
var duplexer = require('duplexer');
var extend = require('xtend');
var serialize = require('./serialize');

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

  var testSuites = [];
  var testCase;
  var noMoreTests = false;
  var exitCode = 0;

  tapParser.on('comment', function(comment) {
    // comment specifies boundaries between testsuites, unless feature disabled.
    if (options.dontUseCommentsAsTestNames) {
      return;
    }
    if (noMoreTests) {
      return;
    }
    // create new test
    testCase = newTest(comment);
  });

  tapParser.on('assert', function(assert) {
    // no test name was given, so all asserts go in a single test
    if (!testCase) {
      testCase = newTest('Default');
    }

    if(!assert.ok) {
        exitCode = 1;
    }
    testCase.asserts.push(assert);
  });

  tapParser.on('extra', function (e) {
    if(testCase) {
        testCase.extra.push(e);
    }
  });

  tapParser.on('extra', function(line) {
  });

  tapParser.on('plan', function(p) {
    noMoreTests = true;
  });

  tapParser.on('complete', function(r) {
    // output any parse errors
    if(testCase && !testSuites.filter(function(ts) {
        return ts.id === testCase.id;
    }).length) {
      testSuites.push(testCase);
    }
    if (r.failures) {
      r.failures.forEach(function(fail) {
        if (fail.tapError) {
          var err = new Error('TAP parse error: ' + fail.tapError);
          outStream.emit('error', err);
        }
      });
    }
    var xmlString = serialize(testSuites);
    outStream.push(xmlString + '\n');
    outStream.emit('end');
    result.exitCode = exitCode;
  });

  var result = duplexer(tapParser, outStream);

  return result;

  function newTest(testName) {
    testSuites.push({
        id: testSuites.length,
        extra: [],
        asserts: [],
        testName: formatTestName(testName)
    });
    return testSuites[testSuites.length -1];
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
}
