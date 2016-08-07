const
    _       = require('lodash')
    
    ;


const 
    hasOwn      = Object.prototype.hasOwnProperty,
    funcnameSym = Symbol('funcname'),
    objSym      = Symbol('object');    
    
 
module.exports = argumentTemplate;
 
function isIterable(iterable) {
    return iterable !== null && _.isFunction(iterable[Symbol.iterator]);
}

const extraMap = {
    
    rename: (prop, templ) => {
        prop.key = hasOwn.call(templ, 'rename') ? templ.rename : prop.key;
    },
    coerce: (prop, templ) => {
        if( hasOwn.call(templ, 'coerce') )
            prop.val = templ.coerce(prop.val);
    }
    
}
    
function assignArgsWithFuncname(funcname, obj, args, template, extras) {
    
    if( extras == null )
        extras = [];
    else if( !_.isArray(extras) )
        extras = [extras];
    
    extras.push('coerce');
    
    _.forOwn(template, function(templ, key) {
        
        if(templ[objSym])
        {
            let val = {};
            
            if(hasOwn.call(args, key))
                val = args[key];
            
            obj[key] = assignArgsWithFuncname(funcname, {}, val, templ);
        }
        else
        {
            
            let valToSet = args[key], 
                keyToSet = key;
                
            if( !hasOwn.call(args, key) )
            {
                if(hasOwn.call(templ, 'default'))
                    valToSet = templ.default;
                else if(templ.optional)
                    return;
                else
                    throw new Error(funcname + ': argument ' + key + 
                        ' is required and has not been provided');
            }
            
            
            
            ( { val: valToSet, key: keyToSet } = 
                _.reduce(extras, 
                         (acc, extra) => {
                            if( !hasOwn.call(extraMap, extra) )
                                throw new Error(funcname + ': extra option ' + extra + ' is not valid');
                            
                            extraMap[extra](acc, templ)
                            return acc;
                         },                    
                         { val: valToSet, key: keyToSet }
                         ) );
                         
            if(templ.validate)
            {
                if(!templ.validate(valToSet))
                    throw new Error(funcname + ': argument ' + key + ' = ' + args[key] + 
                    ' does not meet requirement: ' + templ.requirement);
            }
            
            obj[keyToSet] = valToSet;
        }
    });
    
    return obj;    
}

function checkTemplate(funcname, template) {
    
    // maps renamed names back to the original property names
    let renamedNames = {};
    
    _.forOwn(template, (templ, key) => {
        
        if( templ[objSym] )
        {
            checkTemplate(funcname, templ);
            return;
        }
        
        if( templ.validate )
        {
            // check validate is a function
            if( !_.isFunction(templ.validate) )
                 throw new Error(funcname + ': argument template for property ' + key + 
                ' defines validation: ' + templ.validate + ' which is not a function');
            
            // check validate is accompanied by a requirement description
            // (note: requirement description do NOT have to be accompanied by validate function)
            if(!_.isString(templ.requirement))
                throw new Error(funcname + ': argument template for property ' + key + 
                ' includes a validation function but not a requirement description');
            
            
            // check default argument passes validation
            if(hasOwn.call(templ, 'default') && !templ.validate(templ.default))
                throw new Error(funcname + ': default value of ' + templ.default + ' for property ' + key + 
                ' does not meet requirement: ' + templ.requirement);
        }
        
        // check default and optional are not both set
        if(hasOwn.call(templ, 'default') && templ.optional)
                throw new Error(funcname + ': for property ' + key + 
                ' the optional flag is set but a default value is also provided');
        
        // check each argument has description
        if(!_.isString(templ.description))
            throw new Error(funcname + ': argument template for property ' + key + 
            ' does not include a description');
            
        // if property wishes to be renamed when arguments are
        // assigned then make sure that the renamed property does not clash
        // with any other property names
        if( hasOwn.call(templ, 'rename') )
        {
            // check against properties
            if( hasOwn.call(template, templ.rename) )
                // NB this throws even if the property that this property would clash with
                // will rename it self. e.g.
                // cost : {
                //     description: '...',
                //     rename: 'price'
                // },
                // price : {
                //     description: '...',
                //     rename: 'itemPrice'  
                // }
                // Will throw.
                throw new Error(funcname + ': argument template for property ' + key + 
                    ' would have the property renamed to ' + templ.rename + ' which classes with existing property');
                    
            // also check against properties that could be renamed to the same thing
            if( hasOwn.call(renamedNames, templ.rename) )
                throw new Error(funcname + ': argument template for property ' + key + 
                    ' would have the property renamed to ' + templ.rename + 
                    ' which classes with existing property ' + renamedNames[templ.rename] +
                    ' which will be renamed to the same thing');
        }
            
    });        
}



function argumentTemplate(obj, args, template, extras) {
    
    const funcname = template[funcnameSym];
    
    return assignArgsWithFuncname(funcname, obj, args, template, extras);
}

argumentTemplate.assign = argumentTemplate;

argumentTemplate.template = function template(funcname, template) {
    
    checkTemplate(funcname, template);
    
    template[funcnameSym] = funcname;
    return template;
}


argumentTemplate.requireOneOf = (...templates) => 
    _.assign({}, ...templates, {
        requirement: 
            _(templates)
                .map(_.property('requirement'))
                .reduce( (acc, req) => acc + ' or ' + req ),
        
        
        validate: val => _.some(templates, templ => templ.validate ? templ.validate(val) : true)

    });

argumentTemplate.withoutProperties = (sourceTemplate, toRemoveSet) => 
    _.reduce(sourceTemplate, (acc, templ, propertyName) => {
        
        if( !toRemoveSet.has(propertyName) )
            acc[propertyName] = templ;
        
        return acc;
        
    }, {});
    
function defaultObject(obj) {
    
    return typeof obj === 'undefined' ? {} : obj;
    
}

argumentTemplate.strictNumber = templ => _.assign(defaultObject(templ), {
    requirement: 'Any real number',
    validate: _.isFinite
});
    

argumentTemplate.number = templ => _.assign(defaultObject(templ), {
    requirement: 'value to a real number',
    validate: _.isFinite,
    coerce: Number
});

argumentTemplate.strictString = templ => _.assign(defaultObject(templ), {
    requirement: 'a string',
    validate: _.isString
});

argumentTemplate.object = templ => {
    templ[objSym] = true;
    return templ;
}

argumentTemplate.iterable = templ => _.assign(defaultObject(templ), {
    requirement: 'an iterable object defines obj[Symbol.iterator]. (see https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Iteration_protocols)',
    validate: isIterable    
});

argumentTemplate.color = templ => _.assign(defaultObject(templ), {
    requirement: 'string or any object representing a color that can be converted to a string, or an array of these'  
});

argumentTemplate.function = templ => _.assign(defaultObject(templ), {
    requirement: 'a function',
    validate: _.isFunction
});

argumentTemplate.boolean = templ => _.assign(defaultObject(templ), {
    requirement: 'value convertable boolean, `true` or `false`',
    validate: _.isBoolean,
    coerce: Boolean
});
   
argumentTemplate.false = templ => _.assign(defaultObject(templ), {
    requirement: 'value convertable to `false`, i.e. `false`, `null`, `undefined`, `0` or `NaN`',
    validate: val => !val,
    coerce: Boolean
});

argumentTemplate.strictFalse = templ => _.assign(defaultObject(templ), {
    requirement: '`false`',
    validate: val => val === false
});

// ERROR COERCING WHEN THERE ARE MULTIPLE OPTIONS FOR ARGUMENT TYPE
   

