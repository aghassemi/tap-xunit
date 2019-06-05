var test = require('tape');
var sanitizeString = require('../lib/sanitize-string');

[
    '\u0000',
    '\u0001',
    '\u000B',
    '\uD800',
    '\uFDD0',
].forEach(function(invalidCharacter){
    test(
        'it strips the invalid character:' + invalidCharacter.charCodeAt(0),
        function(assert){
            assert.equal(sanitizeString(invalidCharacter), '');
            assert.end();
        }
    );
});

[
    '\u000A',
    '\u000D',
].forEach(function(validCharacter){
    test(
        'it doesn\'t strip the valid character:' + validCharacter.charCodeAt(0),
        function(assert){
            assert.equal(sanitizeString(validCharacter), validCharacter);
            assert.end();
        }
    );
});
