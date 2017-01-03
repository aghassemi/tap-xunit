var xmlbuilder = require('xmlbuilder');
var sanitizeString = require('./sanitize-string');

module.exports = function serialize (testCases) {
  var rootXml = xmlbuilder.create('testsuites');
  testCases.forEach(function(suite) {
    var suiteElement = rootXml.ele('testsuite');
    var skipped;
    var failureElement;
    suiteElement.att('tests', suite.asserts.length);
    skipped = suite.asserts.filter(function (a) {
        return a.skip;
    }).length;
    if (skipped) {
      suiteElement.att('skipped', skipped);
    }
    suiteElement.att('failures', suite.asserts
      .filter(function (a) {
          return !a.ok && !a.skip;
      }).length);
    suiteElement.att('errors', '0');
    suiteElement.att('name', suite.testName || '');
    suite.asserts.forEach(function (a, i) {
      var testCaseElement = suiteElement.ele('testcase', {
          name: '#' + a.id + ' ' + a.name
      });
      if(a.skip) {
          testCaseElement.ele('skipped');
      }
      if(!a.ok && !a.skip) {
          failureElement = testCaseElement.ele('failure');
          if(a.diag) {
            failureElement.txt(formatFailure(a.diag));
          }
      }
      if(i === suite.asserts.length -1) {
        suite.extra.forEach(function (extraContent) {
          testCaseElement.ele('system-out', sanitizeString(extraContent));
        });
      }
    });
  });
  return rootXml.end({
    pretty: true,
    indent: '  ',
    newline: '\n'
  });
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
