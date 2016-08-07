const
    iteratorsSupported = require('./iteratorsSupported')
;

/**
 * Throws an exception if iterators are not supported.
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {String} [funcname] Name of the function to attach to error message
 * @throws Error
 */
 
module.exports = function checkIteratorsSupported(funcname) {
    
    const pre = funcname ? funcname + '(): ' : '' 
    
    if( !iteratorsSupported )
        throw new Error(pre + ' Iterators are not supported by the JavaScript engine');
    
};
