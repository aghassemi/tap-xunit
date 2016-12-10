const xmlbuilder = require('xmlbuilder');

module.exports = function serialize (testCases) {
  var rootXml = xmlbuilder.create('testsuites');
  testCases.forEach(suite => {
      const suiteElement = rootXml.ele('testsuite');
      suiteElement.att('tests', suite.asserts.length);
      const skipped = suite.asserts.filter(a => a.skip).length;
      if (skipped) {
          suiteElement.att('skipped', skipped);
      }
      suiteElement.att('failures', suite.asserts.filter(a => !a.ok).length);
      suiteElement.att('errors', '0');
      suiteElement.att('name', suite.testName || '');
      suite.asserts.forEach(a => {
        const testCaseElement = suiteElement.ele('testcase', {
            name: '#' + a.id + ' ' + a.name
        });
        if(a.skip) {
            testCaseElement.ele('skipped');
        }
        if(!a.ok) {
            const failureElement = testCaseElement.ele('failure');
            if(a.diag) {
              failureElement.txt(formatFailure(a.diag));
            }
        }
      });
      suite.extra.forEach(e => {
        suiteElement.ele('sysout', e);
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
