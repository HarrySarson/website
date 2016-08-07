'use strict';

const
    checkIteratorsSupported = require('./_checkIteratorsSupported'),
    NiceIterator = require('./NiceIterator')
;

checkIteratorsSupported('Iterator.combine');

  
/**
 * Creates an iterator from the given iterable object.
 * The returned value will conform to both the iterable protocol 
 * and the iterator protocol as well as implementing the `return()`
 * and `throw()` methods.
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {Iterable} [iterable = []] Iterable to iterate.
 * 
 * @returns An iterable;
 *
 */
module.exports = function(iterable) {
    
    let it = iterable[Symbol.iterator]();
        
    return NiceIterator(it);
}
