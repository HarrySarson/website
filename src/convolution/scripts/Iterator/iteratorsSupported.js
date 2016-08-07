const
    isSymbol = require('lodash/isSymbol')
;

/**
 * Boolean value indicating whether es6 iterators are supported.
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @value {boolean} True is iterators are supported, false otherwise
 */
 
const iteratorsSupported = typeof Symbol !== 'undefined' && isSymbol(Symbol.iterator);

module.exports = iteratorsSupported;
