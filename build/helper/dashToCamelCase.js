function dashToCamelCase( myStr ) {
    return myStr.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
}

module.exports = dashToCamelCase;
