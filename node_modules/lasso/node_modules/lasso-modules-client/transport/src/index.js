exports.codeGenerators = {
    define: require('./code-define'),
    run: require('./code-run'),
    installed: require('./code-installed'),
    main: require('./code-main'),
    remap: require('./code-remap'),
    builtin: require('./code-builtin'),
    ready: require('./code-ready'),
    searchPath: require('./code-search-path')
};

exports.getClientPath = require('./getClientPath');
exports.normalizeMain = require('./normalizeMain');