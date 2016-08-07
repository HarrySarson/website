'use strict';

const
    checkIteratorsSupported = require('./_checkIteratorsSupported'),
    isIterable = require('./isIterable'),
    Iterable = require('./Iterable'),
    map = require('./map'),
    partial = require('lodash/partial'),
    reduce = require('lodash/reduce'),
    mapValues = require('lodash/mapValues')
;

checkIteratorsSupported('Iterator.combine');

function mapCB(type, iterable) {
        
    if( !isIterable(iterable) )
        throw new Error('Iterator.combine(): the values of the ' + type + ' passed as a parameter are not iterable');
    
    return iterable[Symbol.iterator]()
}

function *IterableCombineGen(iterableOfIterables, finishLate) {
    
    let its = [...map(iterableOfIterables, mapCB.bind(null, 'iterable'))];
            
    let returnValues = [],
        values;
        
    let cb = finishLate 
        ? function lateCb(every, it, i) {
            
            if( returnValues.hasOwnProperty(i) )
                return every;
            
            let step = it.next();
            
            if( step.done )
            {
                returnValues[i] = step.value;
                return every;
            }
            else
            {
                values.push(step.value);
                return false;
            }
        }
        : function earlyCb(some, it, i) {
            let step = it.next();
                    
            if( step.done )
            {
                returnValues.push(step.value);
                return true;
            }
            else
            {
                values.push(step.value);
                return some;
            }
        };
        
    for(;;)
    {
        values = [];
        
        if( reduce(its, cb, !!finishLate) ) 
            return returnValues;
        else
            yield values;
        
    }  
}



function *ObjectCombineGen(objectOfIterables, finishLate) {
    
    let its = mapValues(objectOfIterables, mapCB.bind(null, 'object'));
        
    let returnValues = {},
        values;
        
    let cb = finishLate 
        ? function lateCb(every, it, key) {
            
            if( returnValues.hasOwnProperty(key) )
                return every;
            
            let step = it.next();
            
            if( step.done )
            {
                returnValues[key] = step.value;
                return every;
            }
            else
            {
                values[key] = step.value;
                return false;
            }
        }
        : function earlyCb(some, it, key) {
            let step = it.next();
                    
            if( step.done )
            {
                returnValues[key] = step.value;
                return true;
            }
            else
            {
                values[key] = step.value;
                return some;
            }
        };
    
    for(;;)
    {      
        values = {}  
        if( reduce(its, cb, !!finishLate) ) 
            return returnValues;
        else
            yield values;
        
    }  
}


/**
 * Combines a collection of iterables into a single iterable that has values which are collections
 * of the values returned by the iterators of each indevidual iterable.
 *
 * `collection` can either be an iterable whose values are iterables that will be combined
 * into an iterable whose value is an iterable containing the values of all the iterables
 * or an object whose own, enumerable properties are iterators to be combined into an
 * iterable whose value is an object whose own, enumberable properties are the values of
 * all the iterables.
 *
 * **Note**: By default the iterator is 'done' when the first of the iterators in the
 * collection is done. If the parameter `finishLate` is set to true then the iterator will
 * be 'done' when the last iterator in the collection is done. The values corresponding to 
 * 'done' iterators will in this case not be passed as values of the iterator.
 *
 * If `finishLate` is false (default), the return value of the iterator is, if the collection is
 * an iterable, an iterable containing only the return values of the iterators that are 'done' first or,
 * if the collection is an object, an object with only the properties corresponding to the first iterators
 * to be done set and the value of those properties being the return value of the iterator.
 *
 * If `finishLate` is true, the return value of the iterator is, if the collection is
 * an iterable, an iterable containing the return values of all iterables in the collection
 * even if they are undefined or, if the the collection is an object, an object with all
 * the own, enumerable properties of object defined as the return values of all the iterables.
 *
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {Iterable|Object} collection Collection of iterators
 * @param {Boolean} [finishLate = false] Iterator will be done only when all iterators are done
 *
 * @returns {Iterator.Iterable} Iterable containing collection of values
 * @example
 *
 * for(let coor of Iterator.combine({
 *   x: [1,2,3,4,5],
 *   y: [1,4,9,16,25]
 * })){
 *   context.lineTo(coor.x, coor.y);
 * }
 * 
 * let mySet = new Set();
 * mySet.add(1);
 * mySet.add(Math);
 *
 * let iterable = Iterator.combine([['a','b','c'], ['alpha','beta', 'gamma'], mySet]);
 * [...iterable];
 * // [['a', 'alpha', 1], ['b', 'beta', Math]]
 */
module.exports = function combine(collection, finishLate) {
    
    let gen = isIterable(collection)
        ? IterableCombineGen
        : ObjectCombineGen;
        
        
    return new Iterable(partial(gen, collection, finishLate));
};
 
 