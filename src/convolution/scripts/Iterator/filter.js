'use strict';

const
    checkIteratorsSupported = require('./_checkIteratorsSupported'),
    Iterable = require('./Iterable'),
    IterableBase = require('./IterableBase'),
    parseIteratee = require('lodash/iteratee')
;

checkIteratorsSupported('Iterator.combine');


module.exports = filter;

/**
 * Creates a new iterable containing values which the `predicate` returns truthy for. 
 *
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {Iterable} iterable Iterable to filter the values of.
 * @param {Function} [predicate = _.identity] Function to run each value though.
 *
 * @returns {Iterator.Iterable} New filtered iterable
 * @example
 *
 * [...Iterator.filter([0,1,2,3,4,5], val => val%2 === 0)]
 * // [0,2,4]
 * 
 * let mySet = new Set().add(1).add('a').add(NaN)
 *
 * [...Iterator.filter(mySet, value => _.isFinite)]
 * // [1]
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': true },
 *   { 'user': 'fred',   'age': 40, 'active': false }
 * ];
 *
 * [...Iterator.filter(users, function(o) { return !o.active; })];
 * // => objects for ['fred']
 *
 * // The `_.matches` iteratee shorthand.
 * [...Iterator.filter(users, { 'age': 36, 'active': true })];
 * // => objects for ['barney']
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * [...Iterator.filter(users, ['active', false])];
 * // => objects for ['fred']
 *
 * // The `_.property` iteratee shorthand.
 * [...Iterator.filter(users, 'active')];
 * // => objects for ['barney']
 *
 */
function filter(iterable, predicate) {

    predicate = parseIteratee(predicate);
    return new Iterable(function*() {
        for(let val of iterable)
            if( predicate(val) )
                yield val;
    });
}


IterableBase.prototype.filter = function(predicate) {
    return filter(this, predicate);
};
 