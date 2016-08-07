'use strict';

const
    _ = require('lodash');

function iterateIterable(iterableOfIterables, cb) {
    let its = [];
    
    for(let iterable of iterableOfIterables)
        its.push(iterable[Symbol.iterator]());
    
    console.log(its);
    
    let values = [];
    
    // quits when first iterator is done
    for(;;)
    {
        if( !_.every(its, (it, i) => {
                let step = it.next();
                console.log(step);
                values[i] = step.value;
                return !step.done;
            }) ) 
            return;
            
        cb(values);
        
    }  
}

function iterateObject(objectOfIterables, cb) {
    
    let its = _.mapValues(objectOfIterables, iterable =>
            iterable[Symbol.iterator]()
        );
    
    
    let values = {};
    
    // quits when first iterator is done
    for(;;)
    {
        if( !_.every(its, (it, name) => {
           let step = it.next();
           values[name] = step.value;
           return !step.done;
           
        }) ) return;
        
        cb(values);
        
    }  
}

module.exports = function eachForEach(iterableOrObject, cb) {
    
    if( _.isFunction(iterableOrObject[Symbol.iterator]) )
        iterateIterable(iterableOrObject, cb);
    else
        iterateObject(iterableOrObject, cb);
    
    
}
    