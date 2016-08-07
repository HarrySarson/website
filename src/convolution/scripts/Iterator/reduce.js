'use strict';

const
    checkIteratorsSupported = require('./_checkIteratorsSupported'),
    IterableBase = require('./IterableBase'),
    parseIteratee = require('lodash/iteratee')
;

checkIteratorsSupported('Iterator.combine');

 module.exports = reduce;

/**
 * Reduces `iterable` to a value which is the accumulated result of 
 * running all the values of `iterable` through `iteratee`, where each successive
 * invocation is supplied the return value of the previous. If `accumulator` is not
 * given, the first value of `iterable` is used as the initial value. The iteratee
 * is invoked with 2 arguments:
 * (accumulator, value). 
 *
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {Iterable} iterable Iterable to reduce values of.
 * @param {Function} [iteratee = _.identity] Function to run each value though.
 * @param [accumlator] Initial Value
 *
 * @returns Returns the accumalated value.
 * @example
 *
 * Iterator.reduce([1, 2], function(sum, n) {
 *   return sum + n;
 * }, 0);
 * // => 3
 *
 * let myMap = new Map().set('a', 1).set('b', 2).set('c', 1);
 *
 * Iterator.reduce(myMap, function(result, pair) {
 *   (result[pair[1]] || (result[pair[1]] = [])).push(pair[0]);
 *   return result;
 * }, {});
 * // => { '1': ['a', 'c'], '2': ['b'] }
 *
 * // alternatively
 * 
 * Iterator.reduce(myMap.keys(), function(result, key) {
 *   let value = myMap.get(key);
 *   (result[value] || (result[value] = [])).push(key);
 *   return result;
 * }, {});
 * // => { '1': ['a', 'c'], '2': ['b'] }
 *
 */
function reduce(iterable, iteratee, accumulator) {
    
    iteratee = parseIteratee(iteratee);

    let step,
        it = iterable[Symbol.iterator]();

    if( arguments.length < 3 && !(step = it.next()).done ) 
        accumulator = step.value;
    
    while( !(step = it.next()).done ) 
        accumulator = iteratee(accumulator, step.value);
    
    return accumulator;    
}
 
 
IterableBase.prototype.reduce = function(iteratee, accumulator) {
    return reduce(this, iteratee, accumulator);
}
 
 