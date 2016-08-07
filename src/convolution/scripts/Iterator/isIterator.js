const
    isFunc = require('lodash/isFunction'),
    iteratorsSupported = require('./iteratorsSupported')
;

/**
 * Checks if `value` is an iterator according to es6 iterator protocols.
 * An object is an iterator when it implements a next() method.
 * https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Iteration_protocols#iterator
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
 * @example
 *
 * function MyIterable() { }
 * MyIterable.prototype[Symbol.iterator] = function*(){
 *   while(true) yield 1;
 * }
 * 
 * let iterableInstance = new MyIterable();
 *
 * Iterator.isIterable(iterableInstance);
 * // => false (this is an iterable but NOT an iterator)
 *
 * // generator function that is then called
 * Iterator.isIterable(iterableInstance[Symbol.iterator]());
 * // => true (this is both an iterator and also iterable)
 *
 * Iterator.isIterator([1, 2, 3][Symbol.iterator]());
 * // => true
 *
 * for(let i of [1])
 *   Iterator.isIterator(i)
 * // => false (i is equal to 1)
 */
module.exports = iteratorsSupported ? 
    function isIterator(value) {
  
      return value != null && isFunc(value.next);
      
    } :
    function isIterator(value) {
        return false;
    };

