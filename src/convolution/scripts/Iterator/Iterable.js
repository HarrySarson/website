'use strict';

const
    checkIteratorsSupported = require('./_checkIteratorsSupported'),
    IterableBase = require('./IterableBase'),
    util = require('util')
;

checkIteratorsSupported('Iterator.combine');



module.exports = Iterable;
util.inherits(Iterable, IterableBase);

/**
 * Contruct an iterable from a generator. If no generator function is provided the function
 * returns an empty iterable, i.e. an iterable equivilent to [].
 *
 * The generator function can be any function that returns an iterator, this includes functions
 * declared `function* gen() {}`.
 *
 * `Iterable` objects are unchanged by iterating over them (unlike the iterable returned by generator functions)
 * so can be used multiple times, e.g. in multiple for...of loops
 *
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {Function} [generator] Generator function to create iterable with
 *
 * @example
 *
 * let gen = Array.prototype[Symbol.iterator].bind([1,2,3,4]);
 *
 * let iterable = gen();
 *
 * let imutable_iterable = new Iterator.Iterable(gen);
 *
 *
 * [...iterable];
 * // [1,2,3,4]
 *
 * [...imutable_iterable];
 * // [1,2,3,4]
 *
 * // iterable has been used up by iterating over it
 * [...iterable];
 * // []
 *
 * // imutable iterable is unchanged
 * [...imutable_iterable];
 * // [1,2,3,4]
 *
 * 
 *
 */
function Iterable(generator) {
    IterableBase.call(this);
    this[Symbol.iterator] = generator;    
}
