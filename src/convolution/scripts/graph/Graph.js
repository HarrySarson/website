const
 //   _       = require('lodash'),
// $       = require('jquery'),
 //   math    = require('mathjs'),
    
    argumentTemplate = require('../argument-template.js'),
    Line    = require('./Line.js'),
    Plot    = require('./Plot.js')
    
    ;
    
    

/**
 * @module Graph
 */


//const hasOwn = Object.prototype.hasOwnProperty;

    
 
 
/**
 * Creates a graph that can be drawn onto a canvas
 *
 * @param {Object} [args = {}] Property values, see below
 *
 */
let Graph = module.exports = function Graph(args) {
    
    argumentTemplate(this, args, Graph.argumentTemplate);
    
    this._ids = new Map();
    
}

Graph.argumentTemplate = argumentTemplate.template('Graph()', {
    xmax: argumentTemplate.number({
        default: 1,
        description: 'maximum value on x axis'
    }),
    ymax: argumentTemplate.number({
        default: 1,
        description: 'maximum value on y axis'
    }),
    xmin: argumentTemplate.number({
        default: -1,
        description: 'minimum value on x axis'
    }),
    ymin: argumentTemplate.number({
        default: -1,
        description: 'minimum value on y axis'
    }),
    colors: argumentTemplate.color({
        default: ['#FF0000', '#FF7F00', '#FFFF00' ,'#00FF00', '#0000FF', '#4B0082', '#8B00FF'],
        description: 'Color of lines plotted on the graph, in array form successive colors are used for successives lines plotted'
    }),
    axisColor: argumentTemplate.color({
        default: 'black',
        description: 'Color of axis of the graph'
    }),
    gridColor: argumentTemplate.requireOneOf({
        requirement: 'Falsy value'
    }, argumentTemplate.color({
        default: '#aaa',
        description: 'Omit this argument or set it as false for no grid, otherwise this defines the color of grid on the graph'
    }))
});


/**
 * Adds a `Line` to graph, when is next plotted this line will be drawn
 *
 */
Graph.prototype.add = function add(args) {
        
    args = argumentTemplate({graph: this}, args, add.argumentTemplate);
    
    return new Line(args);
}

Graph.prototype.add.argumentTemplate = 
    argumentTemplate.template('Graph#add()', argumentTemplate.withoutProperties(Line.argumentTemplate, 
                                                                     new Set(['graph'])
                                                                     ));


/**
 * Plots graph onto a canvas, returns an Object that can be used to 
 * interact with the plot, or to refresh the plot when some data changes
 *
 * @returns {module:./Plot} Object used to interact with plot
 */ 
Graph.prototype.plot = function plot(args) {
    
    args = argumentTemplate({
        graph: this     
    }, args, plot.argumentTemplate);
        
    return new Plot(args).draw();
    
}

Graph.prototype.plot.argumentTemplate = 
    argumentTemplate.template('Graph#plot()', argumentTemplate.withoutProperties(Plot.argumentTemplate, 
                                                                     new Set(['graph'])
                                                                     ));
    
