'use strict';

const
    checkIteratorsSupported = require('./_checkIteratorsSupported'),
    isFunction = require('lodash/isFunction'),
    IterableBase = require('./IterableBase'),
    util = require('util')
;

checkIteratorsSupported('Iterator.combine');

module.exports = NiceIterator;
util.inherits(NiceIterator, IterableBase);

/**
 * Wraps an iterator.
 * The `NiceIterator` object will conform to both the iterable protocol 
 * and the iterator protocol as well as implementing the `return()`
 * and `throw()` methods.
 *
 * **Note:** loosely based on https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Generator
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {iterator} iterator Iterator to wrap
 * 
 *
 */
function NiceIterator(iterator) {
    
    IterableBase.call(this);
    
    this._base = iterator;
    
    this._done = false;
    
    if( iterator == null || !isFunction(iterator.next) )
        throw new Error('iterator(): parameter is not iterable');
        
}

    
/**
 * @typedef Step
 * @type Object
 * @property {*} value Value returned by the iterator. May be omitted when done is true.
 * @property {boolean} done `true` if the iterator is past the end of the iterated sequence.
 * In this case `value` optionally specifies the return value of the iterator.
 */
 
function do_next(ni, value, funcname) {
    
    if( ni._done )
        return { value: undefined, done: true };
    
    let step = ni._base[funcname](value);
    
    if( step == null || step.done )
        ni._done = true;
    
    return step;
    
}
 
/**
 * Increments the iterator and returns an object with two properties done and value. 
 * You can also provide a parameter to the next method to send a value to the generator.
 *
 * @memberOf NiceIterator
 * @since 0.1.0
 * @param {*} [value] Value to send to the iterator.
 * 
 * @returns {Step} The next step.
 *
 */
NiceIterator.prototype.next = function(value) {
    return do_next(this, value, 'next');
}

/**
 * Returns the given value and finishes the generator.
 * If done is true, for `return(value)` aswell as for `next()`，the value will be undefined.
 *
 * @memberOf NiceIterator
 * @since 0.1.0
 * @param {*} [value] Value to return.
 * 
 * @returns {Step} The next step, done will be true.
 *
 */
NiceIterator.prototype.return = function(value) {
    
    if( this._done )
        return { value: undefined, done: true };
        
    this._done = true;    
        
    if( isFunction(this._base.return) )
        // call return but ignore result
        this._base.return(value);
    
    return { value, done: true}
        
}

/**
 * Resumes the execution of a generator by throwing an error into it 
 * and returns an object with two properties done and value.
 *
 * @memberOf NiceIterator
 * @since 0.1.0
 * @param {*} [exception] The exception to throw.
 * 
 * @returns {Step} The current step (Note iterator is not iterated)
 *
 */
NiceIterator.prototype.throw = function(value) {
      
    // hmm??
        
    if( isFunction(this._base.throw) )
        return do_next(this, value, 'throw')
    
    this._done = true;
        
    return value;
}

/**
 * `NiceIterator`'s conform to iterable protocol.
 *
 * @memberOf NiceIterator
 * @since 0.1.0
 * 
 * @returns {NiceIterator} Returns `this`.
 *
 */
NiceIterator.prototype[Symbol.iterator] = function() {
      
    return this;
}
