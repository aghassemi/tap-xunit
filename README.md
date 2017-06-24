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


# License
MIT
