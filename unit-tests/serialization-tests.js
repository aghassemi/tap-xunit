const test = require('tape');
const xmlbuilder = require('xmlbuilder');
const xml2js = require('xml2js');

[
    {
        name: 'Single assert',
        input: {
            extra: [],
            asserts: [ { ok: true, id: 3, name: 'should be equal' } ]
        },
        expected: {
            '$': { tests: '1', failures: '0', skipped: '0' },
            testcase: [
                { '$': { name: '#3 should be equal' } }
            ]
        }
    },
    {
        name: 'skipped assert',
        input: {
            extra: [],
            asserts: [ { skip: true, id: 3, ok: 'true', name: 'should be equal' } ]
        },
        expected: {
            '$': { tests: '1', failures: '0', skipped: '1' },
            testcase: [
                {
                    '$': { name: '#3 should be equal' },
                    skipped: ['']
                }
            ]
        }
    },
    {
        name: 'failed assert',
        input: {
            extra: [],
            asserts: [ { skip: false, id: 3, ok: false, name: 'should be equal' } ]
        },
        expected: {
            '$': { tests: '1', failures: '1', skipped: '0' },
            testcase: [
                {
                    '$': { name: '#3 should be equal' },
                    failure: ['']
                }
            ]
        }
    },
    {
        name: 'failed assert with diag',
        input: {
            extra: [],
            asserts: [ {
                skip: false, id: 3, ok: false, name: 'should be equal',
                diag: {
                    operator: 'fail',
                    at: 'Test'
                }
            } ]
        },
        expected: {
            '$': { tests: '1', failures: '1', skipped: '0' },
            testcase: [
                {
                    '$': { name: '#3 should be equal' },
                    failure: ['\n          ---\n            operator: fail\n            at: Test\n          ...\n      ']
                }
            ]
        }
    },
    {
        name: 'stdout logs',
        input: {
          extra: [ 'see me\n', 'me too\n' ],
          asserts: [
              { ok: true, id: 1, name: 'should be equal' },
              { ok: true, id: 2, name: 'should be equal' }
          ]
        },
        expected: {
            '$': { tests: '2', failures: '0', skipped: '0' },
            testcase: [
                { '$': { name: '#1 should be equal' } },
                { '$': { name: '#2 should be equal' } },
            ],
            sysout: [ 'see me\n', 'me too\n' ]
        }
    }
].forEach(testCase => {
    test('serializes: ' + testCase.name, assert => {
        var asserts = [testCase.input];
        var xml = xml2js.parseString(serialize(asserts), (err, parsed) => {
            var expected = {
                testsuites: {
                    testsuite: [testCase.expected]
                }
            };
            console.log('EXPECTED');
            console.dir(expected, {depth: null});
            console.log('ACTUAL');
            console.dir(parsed, {depth: null});
            assert.deepEqual(parsed, expected);
            assert.end();
        });
    });
});

function serialize (testCases) {
  var rootXml = xmlbuilder.create('testsuites');
  testCases.forEach(suite => {
      const suiteElement = rootXml.ele('testsuite');
      suiteElement.att('tests', suite.asserts.length);
      suiteElement.att('skipped', suite.asserts.filter(a => a.skip).length);
      suiteElement.att('failures', suite.asserts.filter(a => !a.ok).length);
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
