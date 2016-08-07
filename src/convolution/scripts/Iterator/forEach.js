'use strict';

const
    checkIteratorsSupported = require('./_checkIteratorsSupported'),
    IterableBase = require('./IterableBase'),
    parseIteratee = require('lodash/iteratee')
;

checkIteratorsSupported('Iterator.combine');

module.exports = forEach;

/**
 * Iterates all values of `iterable` and invokes `iteratee` for each value.
 * The iteratee is invoked with one argument: (value).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 * *
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {Iterable} iterable Iterable to iterate through.
 * @param {Function} [iteratee = _.identity] Function to invoke for each value.
 *
 * @returns Returns `iterable`
 *
 * Iterator.forEach([1, 2], function(n) {
 *      console.log(n)
 * });
 * // => Logs `1` then `2`.
 *
 * let myMap = new Map().set('a', 1).set('b', 2).set('c', 1);
 *
 * Iterator.forEach(myMap, function(pair) {
 *   console.log(pair[0] + ': ' + pair[1]);
 * });
 * // => Logs `'a': 1` then `'b': 2` then `'c': 1`.
 *
 * // alternatively
 * 
 * Iterator.forEach(myMap.keys(), function(key) {
 *   console.log(key + ': ' + myMap.get(key));
 * }, {});
 * // => Logs `'a': 1` then `'b': 2` then `'c': 1`.
 */
function forEach(iterable, iteratee) {
    
    iteratee = parseIteratee(iteratee);
    
    for( let value of iterable )
        if(iteratee(value) === false)
            break;
        
    return iterable;
}

IterableBase.prototype.forEach = function(iteratee) {
    return forEach(this, iteratee);
}
 