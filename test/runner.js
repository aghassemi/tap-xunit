var fs = require('fs');
var path = require('path');
var test = require('tape');
var concat = require('concat-stream');
var converter = require('../lib/converter.js');

var FILE_READ_OPTS = {
  encoding: 'utf-8'
};

runGoodInputTests('pass', 0); // input.pipe(xUnitConverter) == expected output
runGoodInputTests('fail', 1);
runBadInputTests(); // input.pipe(xUnitConverter) == parse error

function runGoodInputTests(subdir, exitCode) {
  var INPUT_DIR = 'test/input/' + subdir;
  var EXPECTED_DIR = 'test/expected/' + subdir;

  // tape does not support adding test() async, so we need to read the dir sync
  var testFiles = fs.readdirSync(INPUT_DIR);
  testFiles.forEach(function(filename) {
    test(filename, function(assert) {
      runTest(filename, assert);
    });
  });

  function runTest(filename, assert) {
    readTestFiles(filename, function(inputStream, expected) {
      var outputStream = concat(verifyResults);
      var tapToxUnitConverter = converter();
      var xUnitStream = inputStream.pipe(tapToxUnitConverter);
      xUnitStream.on('error', function(err) {
        assert.notOk(err, 'Should not get any parse errors');
      });
      xUnitStream.pipe(outputStream);

      function verifyResults(output) {
        output = output.toString();
        assert.deepEqual(output.trim(), expected.trim(), 'input/output match');
        assert.end();
        assert.equals(exitCode, tapToxUnitConverter.exitCode, 'exitCode match');
      }
    });
  }

  function readTestFiles(filename, cb) {
    var inputFilePath = path.join(INPUT_DIR, filename);
    var expectedFilePath = path.join(EXPECTED_DIR, filename);

    var inputStream = fs.createReadStream(inputFilePath, FILE_READ_OPTS);
    fs.readFile(expectedFilePath, FILE_READ_OPTS, function(err, output) {
      if (err) throw err;
      cb(inputStream, output);
    });
  }
}

function runBadInputTests() {
  var BAD_INPUT_DIR = 'test/bad';

  var testFiles = fs.readdirSync(BAD_INPUT_DIR);
  for (var i = 0; i < testFiles.length; i++) {
    var filename = testFiles[i];
    test('parse error: ' + filename, function(assert) {
      var badInputFilePath = path.join(BAD_INPUT_DIR, filename);
      var inputStream = fs.createReadStream(badInputFilePath, FILE_READ_OPTS);
      var tapToxUnitConverter = converter({strict:true});
      var xUnitStream = inputStream.pipe(tapToxUnitConverter);
      var numParseErrors = 0;
      xUnitStream.on('error', function(err) {
        assert.ok(err, err.message);
        numParseErrors++;
      });
      xUnitStream.on('end', function() {
        assert.ok(numParseErrors > 0, 'had ' + numParseErrors + ' parse errors');
        assert.end();
      });
    });
  }
}