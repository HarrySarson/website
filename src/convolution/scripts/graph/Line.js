const
 //   color   = require('tinycolor2'),

    argumentTemplate = require('../argument-template')
    ;

 
let weakGraphRef = new WeakMap();

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
    
    if(this._graph)
        weakGraphAdd(this._graph, this);
    
    this._animation_queue = [];
    this._animation_args = null;
    
}


Line.argumentTemplate = argumentTemplate.template('Line()', {
    graph: {
        default: null,
        description: 'an optional Graph object (see module:./Graph.js), if provided the line will be added to that graph',
        rename: '_graph'
    },
    color: argumentTemplate.color({
        optional: true,
        description: 'Color of this line, default colors are defined the graph object'
    }),
    smooth: argumentTemplate.number({
        default: 0.2,
        description: 'Control how much the line is smoothed at corners, set to zero for no smoothing which speed up plotting'
    }),
    x: argumentTemplate.iterable({
        description: 'x-coordinates of points to plot',
        rename: '_x'
    }),
    y: argumentTemplate.iterable({
        description: 'y-coordinates of points to plot',
        rename: '_y'
    })
});


Object.defineProperties(Line.prototype, {
    graph: {
        configurable: true,
        enumerable: true,
        get: function() { return this._graph },
        set: function(val) {
            if( this.graph )
                weakGraphRemove(this._graph, this);
            else if( val )
                weakGraphAdd(val, this);
            
            this._graph = val || null;
        }
    },
    x: {
        configurable: true,
        enumerable: true,
        get: function() { 
            if( this._animation_queue.length === 0 )
                return this._x;
            
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
