module.exports = function sanitizeString(str) {
    return str.replace(/[^\u000D\u00B7\u0020-\u007E\u00A2-\u00A4]/g,'');
}
