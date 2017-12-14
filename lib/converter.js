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
  var planPresent = false;

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

  tapParser.on('plan', function() {
    planPresent = true;
  });

  tapParser.on('assert', function(assert) {
    // no test name was given, so all asserts go in a single test
    if (!testCase) {
      testCase = newTest('Default');
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
          exitCode = 1;
          outStream.emit('error', err);
        }
      });
    }

    // treat # SKIP and # TODO the same
    // see https://github.com/aghassemi/tap-xunit/issues/8
    testSuites.forEach(function(suite) {
      suite.asserts.forEach(function(a) {
        a.skip = a.skip || a.todo;
        if (!a.ok && !a.skip) {
          exitCode = 1;
        }
      });
    });

    if (tapParser.sawValidTap && planPresent) {
      var xmlString = serialize(testSuites);
      outStream.push(xmlString + '\n');
    } else {
      // Fail, no valid tap found (normally means no plan line present)
      // Note that is a less strict check than TapParser's strict mode.
      exitCode = 1;
    }
    result.exitCode = exitCode;
    outStream.emit('end');
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
