var test = require('tape');
var xmlbuilder = require('xmlbuilder');
var xml2js = require('xml2js');
var serialize = require('../lib/serialize');

[
    {
        name: 'Single assert',
        input: [{
            extra: [],
            asserts: [ { ok: true, id: 3, name: 'should be equal' } ],
            testName: 'hello test'
        }],
        expected: {
            testsuites: {
                testsuite: [{
                    '$': { name: 'hello test', tests: '1', failures: '0', errors: '0' },
                    testcase: [
                        { '$': { name: '#3 should be equal' } }
                    ]
                }]
            }
        }
    },
    {
        name: 'skipped assert',
        input: [{
            extra: [],
            asserts: [ { skip: true, id: 3, ok: 'true', name: 'should be equal' } ]
        }],
        expected: {
            testsuites: {
                testsuite: [{
                    '$': { tests: '1', failures: '0', skipped: '1', name: '', errors: '0' },
                    testcase: [
                        {
                            '$': { name: '#3 should be equal' },
                            skipped: ['']
                        }
                    ]
                }]
            }
        }
    },
    {
        name: 'failed assert',
        input: [{
            extra: [],
            asserts: [ { skip: false, id: 3, ok: false, name: 'should be equal' } ]
        }],
        expected: {
            testsuites: {
                testsuite: [{
                    '$': { tests: '1', failures: '1', name: '', errors: '0' },
                    testcase: [
                        {
                            '$': { name: '#3 should be equal' },
                            failure: ['']
                        }
                    ]
                }]
            }
        }
    },
    {
        name: 'failed assert with diag',
        input: [{
            extra: [],
            asserts: [ {
                skip: false, id: 3, ok: false, name: 'should be equal',
                diag: {
                    operator: 'fail',
                    at: 'Test'
                }
            } ]
        }],
        expected: {
            testsuites: {
                testsuite: [{
                    '$': { tests: '1', failures: '1', name: '', errors: '0' },
                    testcase: [
                        {
                            '$': { name: '#3 should be equal' },
                            failure: [
                                '\n          ---\n            operator: fail\n            at: Test\n          ...\n      ']
                        }
                    ]
                }]
            }
        }
    },
    {
        name: 'stdout logs',
        input: [{
          extra: [ 'see me\n', 'me too\n' ],
          asserts: [
              { ok: true, id: 1, name: 'should be equal' },
              { ok: true, id: 2, name: 'should be equal' }
          ]
        }],
        expected: {
            testsuites: {
                testsuite: [{
                    '$': { tests: '2', failures: '0', name: '', errors: '0' },
                    testcase: [
                        { '$': { name: '#1 should be equal' } },
                        {
                            '$': { name: '#2 should be equal' },
                            'system-out': [ 'see me\n', 'me too\n' ]
                        },
                    ],
                }]
            }
        }
    },
    {
        name: 'removes null characters from log',
        input: [{
          extra: [ '\u0000' ],
          asserts: [
              { ok: true, id: 1, name: 'should be equal' },
              { ok: true, id: 2, name: 'should be equal' }
          ]
        }],
        expected: {
            testsuites: {
                testsuite: [{
                    '$': { tests: '2', failures: '0', name: '', errors: '0' },
                    testcase: [
                        { '$': { name: '#1 should be equal' } },
                        {
                            '$': { name: '#2 should be equal' },
                            'system-out': [ '' ]
                        },
                    ],
                }]
            }
        }
    }
].forEach(function(testCase) {
    test('serializes: ' + testCase.name, function (assert) {
        var testSuites = testCase.input;
        var xml = xml2js.parseString(serialize(testSuites), function(err, parsed) {
            var expected = testCase.expected;
            console.log('EXPECTED');
            console.dir(expected, {depth: null});
            console.log('ACTUAL');
            console.dir(parsed, {depth: null});
            assert.deepEqual(parsed, expected);
            assert.end();
        });
    });
});
