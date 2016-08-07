'use strict';

const
    checkIteratorsSupported = require('./_checkIteratorsSupported'),
    Iterable = require('./Iterable'),
    IterableBase = require('./IterableBase'),
    parseIteratee = require('lodash/iteratee')
;

checkIteratorsSupported('Iterator.combine');

module.exports = map;

/**
 * Creates a new iterable whose iterators will have values coresponding to the value
 * of the iterator of the original iterable run through `iteratee`.
 * The iteratee is invoked with only one argument (value). 
 *
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {Iterable} iterable Iterable to map values of.
 * @param {Function} [iteratee = _.identity] Function to run each value though.
 *
 * @returns {Iterator.Iterable} New mapped iterable
 * @example
 *
 * for(let coor of Iterator.map([0,1,2,3,4,5], x => ({ x, y: Math.exp(x)))) {
 *   context.lineTo(coor.x, coor.y);
 * }
 * 
 * let mySet = new Set().add(1).add('a').add(NaN)
 *
 * [...Iterator.map(mySet, value => value + 1)]
 * // [2, 'a1', NaN]
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // The `_.property` iteratee shorthand.
 * [...Iterator.map(users, 'user');
 * // => ['barney', 'fred']
 *
 */
function map(iterable, iteratee) {
     
    iteratee = parseIteratee(iteratee);
        
    return new Iterable(function*() {
        for(let val of iterable)
            yield iteratee(val);
    });

}
 
IterableBase.prototype.map = function(iteratee) {
    return map(this, iteratee);
};
 