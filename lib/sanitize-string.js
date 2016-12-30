var NOT_SAFE_IN_XML_1_0 = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm;
module.exports = function sanitizeString(str) {
    return str.replace(NOT_SAFE_IN_XML_1_0, '');
}
