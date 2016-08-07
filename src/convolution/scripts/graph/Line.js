const
 //   color   = require('tinycolor2'),
    _ = require('lodash'),

    argumentTemplate = require('../argument-template'),
    Iterator = require('../Iterator')
    ;

 
let weakGraphRef = new WeakMap(),
    hasProp      = Object.prototype.hasOwnProperty;

/**
 *  Adds `line` to the weak graph entry for `graph`
 * Either appends to the existing set of lines or makes
 * a new one
 *
 * @parameter {module:Graph} graph to attach line to
 * @parameter {Line} line to attach to graph
 *
 *
 */
function weakGraphAdd(graph, line) {
    
    let graphRef = weakGraphRef.get(graph) || new Set();
    
    graphRef.add(line);
    
    weakGraphRef.set(graph, graphRef);
}

/**
 * Removes `line` from the weak graph entry for `graph`
 * delting from the existing set of lines which may leave an
 * empty set
 *
 * @parameter {module:Graph} graph to attach line to
 * @parameter {Line} line to attach to graph
 *
 *
 */
function weakGraphRemove(graph, line) {
    
    let graphRef = weakGraphRef.get(graph);
    
    if( graphRef )
        graphRef.delete(line);
}
    
/**
 * Creates an Object that represents and manages an indevidual line on
 * a Graph. To attach the line to a graph either pass the argument 'graph'
 * in the arguments object or set the property Line#graph. To detact the graph
 * set Line#graph to any falsy value and to change which graph the line is attached
 * to set Line#graph to another graph.
 *
 */ 
let Line = module.exports = function Line(args) {
    
    argumentTemplate(this, args, Line.argumentTemplate, 'rename');
      
    // use weakGraphRef to link the graph to its lines
    // without having to add properties to the Graph object
    
    this._graph.forEach(graph =>
        weakGraphAdd(graph, this));
        
        
    
    
    this._animation_queue = [];
    this._animation_args = null;
    
};


Line.defaultColorSymbol = Symbol();


Line.argumentTemplate = argumentTemplate.template('Line()', {
    graph: argumentTemplate.iterable({
        default: [],
        description: 'Graph objects (see module:./Graph.js), if provided the line will be added to that graph',
        rename: '_graph'
    }),
    color: argumentTemplate.color({
        default: Line.defaultColorSymbol,
        description: 'Color of this line, default colors are defined the graph object'
    }),
    smooth: argumentTemplate.number({
        default: 0.2,
        description: 'Control how much the line is smoothed at corners, set to zero for no smoothing which speed up plotting'
    }),
    x: argumentTemplate.requireOneOf(
        argumentTemplate.strictFalse(),    
        argumentTemplate.iterable({
            default: false,
            description: 'x-coordinates of points to plot, if `false` or undefined this defaults ' +
             'to an array of integers corresponing to the index of the y-coordinate',
            rename: '_x'
        })),
    y: argumentTemplate.iterable({
        default: [],
        description: 'y-coordinates of points to plot',
        rename: '_y'
    }),
    marker: argumentTemplate.requireOneOf(
        argumentTemplate.strictString(), 
        argumentTemplate.function(),
        {
            default: false,
            description: 'marker for points plotted, if this value is falsy or an unregonised string no markers will be plotted, if it ' +
                'is a function that function will be invoked with arguments (context, x, y, recomendedRadius) and should draw the marker ' +
                'onto the context, use moveTo to move the pen to the start of the shape drawn and don\'t call beginPath or stroke. ' + 
                'see http://uk.mathworks.com/help/matlab/ref/plot.html#inputarg_LineSpec for valid strings'
        })
});


Object.defineProperties(Line.prototype, {
    graph: {
        configurable: true,
        enumerable: true,
        get: function() { return this._graph },
        set: function(val) {
            this._graph.forEach(graph =>
                weakGraphRemove(graph, this));
                
            if( val != null )
            {
                if( !_.isArray(val) )
                    val = [val];
            
                this._graph = val;
                
                this._graph.forEach(graph =>
                    weakGraphAdd(graph, this));
            }
        }
    },
    x: {
        configurable: true,
        enumerable: true,
        get: function() { 
            let self = this;
            
            if( this._animation_queue.length === 0 )
                return this._x || function*() { 
                    
                    for(let i = 0; i < self._y.length; ++i) 
                    { 
                        yield i;
                    }
                }();
            
            throw new Error('Line: animations not implemented yet');
        },
        set: function(val) {
            this._x = val;
        }
    },
    y: {
        configurable: true,
        enumerable: true,
        get: function() { 
            if( this._animation_queue.length === 0 )
                return this._y;
            
            throw new Error('Line: animations not implemented yet');
        },
        set: function(val) {
            this._y = val;
        }
    },
    coors: {
        configurable: true,
        enumerable: true,
        get: function() { 
        
            return Iterator.combine({x: this.x, y: this.y});
                
        }
    }
})
    
/**
 * Get a iterator to the lines that are attributed to a particular graph
 *
 * @parameter {module:Graph.js} graph The graph whose lines should be retrieved
 *
 * @returns {iterator} return set of lines
 *
 * @example
 * 
 * // prints the color of each line on graph
 * for( let line of Line.getLines(graph) ) 
 * {
 *      console.log(line.color);
 * }
 * 
 */ 
Line.getLines = function* (graph) {
    // delegate to Set
    yield* (weakGraphRef.get(graph) || new Set());
}
/**
 * Smoothly transitions the line from one position to another
 *
 */ 
Line.prototype.animate = function animate(args) {
    
    args = argumentTemplate({}, args, animate);
      
    args.time_stamp = performance.now();
    
    this._animation_args = args;    
}

Line.prototype.animate.argumentTemplate = argumentTemplate.template('Line#animate()', {
    x: argumentTemplate.boolean({
        optional: true,
        description: 'should changes in x-coordinates be animate, defaults to previous state'
    }),
    y: argumentTemplate.boolean({
        optional: true,
        description: 'should changes in yx-coordinates be animate, defaults to previous state'
    }),
    easing: argumentTemplate.function({
        default: p => 0.5 - Math.cos( p * Math.PI ) / 2, // 'swing'
        description: 'function that specifies the speed at which the animation progresses at different points within the animation' + 
            'function will be called with values in range 0 to 1 and should return values also in that range'
    }),
    queue: argumentTemplate.boolean({
        default: true,
        description: 'should animations be placed in a queue, if false animations will begin immediately'
    }),
    duration: argumentTemplate.number({
        default: 400,
        description: 'number of miliseconds to take transitioning between the two lines'
    }),
    complete: argumentTemplate.function({
        default: function() {},
        description: 'function that will be called when animation is complete'
    })
});
