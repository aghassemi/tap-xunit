[![Build Status](https://travis-ci.org/aghassemi/tap-xunit.png)](https://travis-ci.org/aghassemi/tap-xunit)
[![Issue Stats](http://issuestats.com/github/aghassemi/tap-xunit/badge/pr)](http://issuestats.com/github/aghassemi/tap-xunit)
[![Issue Stats](http://issuestats.com/github/aghassemi/tap-xunit/badge/issue)](http://issuestats.com/github/aghassemi/tap-xunit)
tap-xunit
=========

Converts [TAP](http://testanything.org/) to xUnit XML format.

TAP output from testing frameworks such as [tape](https://github.com/substack/tape) or [node-tap](https://github.com/isaacs/node-tap) can be piped directly to tap-xunit

```
node test.js | tap-xunit
```

![console window showing tap-xunit example](https://cloud.githubusercontent.com/assets/2099009/5288038/60d5a2da-7ae6-11e4-8d5a-5de497b4b597.jpg)

## Requirements

- Node.js 0.10 or higher

# Installation

```
npm install tap-xunit -g
```

# Usage
## CLI
```
node test.js | tap-xunit

less results.tap | tap-xunit --package="MyCompany.MyTool" > results.xml

```

By default TAP comments are used as test-suite names and considered to mark test boundaries. CLI flag ```--dontUseCommentsAsTestNames``` can be used to turn that feature off, in which case comments are ignored and
all assertions go inside a single ```<testsuite name="Default">``` with name ```Default```

## Library
```
var converter = require('tap-xunit');

// Optional configuration
var opts = {}

var tapToxUnitConverter = converter(opts);

tapInputStream.pipe(tapToxUnitConverter).pipe(xUnitOutStream);
```
## Options
Options can be passed as CLI arguments by being prefixed with ```--```

#### dontUseCommentsAsTestNames
*default*: ```false```

By default TAP comments are used as test-suite names and considered to mark test boundaries.
This option can be used to turn that feature off, in which case comments are ignored and
all assertions go inside a single ```<testsuite name="Default">``` with name ```Default```

#### replaceWithUnicodeDot
*default*: ```false```

Whether the '.' in test-suite names should be replaced with a Unicode homoglyph.
This feature exists because many xUnit reporters assume '.' in test-suite name implies package hierarchy, which may not be the case.

#### package
*default*: ```''```

If specified, all test-suites will be prefixed with the given package name.
NOTE: ```replaceWithUnicodeDot``` option does not apply to package and . can be used to specify package hierarchy.

## Example

Given the following TAP input:
```
TAP version 13
# Test Suite 1
ok 1 should pass
not ok 2 should fail
  ---
    operator: fail
    expected: true
    actual: false
  ...
1..2
```

tap-xunit will convert it to the following xUnit XML:
```xml
<?xml version="1.0"?>
<testsuites>
  <testsuite tests="2" failures="1" errors="0" name="Test Suite 1">
    <testcase name="#1 should pass"/>
    <testcase name="#2 should fail">
      <failure>
          ---
            operator: fail
            expected: true
            actual: false
          ...
      </failure>
    </testcase>
  </testsuite>
</testsuites>
```

# License
MIT

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin my-feature`
7. Submit a pull request

## Development

To set up the project for development:

```bash
git clone https://github.com/aghassemi/tap-xunit.git
cd tap-xunit
npm install
npm test
```
