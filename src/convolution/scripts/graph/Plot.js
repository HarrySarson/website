const
    $       = require('jquery'),
    _       = require('lodash'),
    color   = require('tinycolor2'),

    argumentTemplate = require('../argument-template'),
    eachForEach      = require('../util/each-for-each.js'),
    Iterator         = require('../Iterator'),
    shapes  = require('./canvasShapes'),
    Line    = require('./Line')   
    
    ;

const
    hasOwn = Object.prototype.hasOwnProperty,
    
    markers = {
        
        o: function(context, x, y, recRad) { // Circle
            context.moveTo(x-recRad, y);
            context.arc(x, y, recRad, 0, 2*Math.PI);
        },
        '+': function(context, x, y, recRad) { // Plus sign
            context.moveTo(x - recRad, y);
            context.lineTo(x + recRad, y);
            
            context.moveTo(x, y - recRad);
            context.lineTo(x, y +    recRad);            
        },
        '*': function(context, x, y, recRad) { // Asterisk
        
        },
        '.': function(context, x, y, recRad) { // Point
        
        },
        x: function(context, x, y, recRad) { // Cross
        
        },
        s: function(context, x, y, recRad) { // Square
        
        },
        d:      function(context, x, y, recRad) { // Diamond
        
        },
        '^':    function(context, x, y, recRad) { // Upward-pointing triangle
        
        },
        v:      function(context, x, y, recRad) { // Downward-pointing triangle
        
        },
        '>':    function(context, x, y, recRad) { // Right-pointing triangle
        
        },
        '<':    function(context, x, y, recRad) { // Left-pointing triangle
        
        },
        p:      function(context, x, y, recRad) { // Pentagram
        
        },
        h:      function(context, x, y, recRad) { // Hexagram
        
        },
        
    }
    
function Smoother(ctx, smooth) {
    this.ctx = ctx;
    this.smooth = smooth;
    
    this.reset();
}

Smoother.prototype.reset = function reset() {
    
    this.x2 = 
    this.y2 = 
    
    this.x1 = 
    this.y1 = 
    
    this.x2cp = 
    this.y2cp = null;
}

Smoother.prototype.smoothTo = function smoothTo(x, y) {
    
    if(this.x1 != null)
    {
        let x2cp_next = this.x1,
            y2cp_next = this.y1;

        if(this.x2 != null)
        {
            // 3rd, 4th, 5th, etc points
            
            if(this.smooth !== 0)
            {
                let d01 = Math.hypot(this.x1 - this.x2, this.y1 - this.y2),
                    d12 = Math.hypot(x       - this.x1, y       - this.y1),
                    
                    fa = this.smooth * d01 / (d01 + d12),   // scaling factor for triangle Ta
                    fb = this.smooth - fa,                  // ditto for Tb
                    
                    x1cp = this.x1 - fa * (x - this.x2),
                    y1cp = this.y1 - fa * (y - this.y2);
                    
                    x2cp_next += fb * (x - this.x2);
                    y2cp_next += fb * (y - this.y2);
                
                this.ctx.bezierCurveTo(this.x2cp,this.y2cp,x1cp,y1cp,this.x1,this.y1);
            }
            else
            {
                this.ctx.lineTo(this.x1, this.y1);
            }
        }       
        else
        {
            // 2nd point
            this.ctx.lineTo(this.x1, this.y1);
        }
        // 2nd, 3rd, 4th, etc points
        
        this.x2cp = x2cp_next;
        this.y2cp = y2cp_next;
        
        
        this.x2 = this.x1;
        this.y2 = this.y1;
    }
    else
    {
        // 1st point
    }
    
    this.x1 = x;
    this.y1 = y;
}

Smoother.prototype.end = function end() {
    
    // for last point
    if(this.x1 && this.x2)
    {
        this.ctx.quadraticCurveTo(this.x2cp, this.y2cp, this.x1, this.y1);
    }
    else
    {
        // only one point, cannot do a line so just move to the first point
        this.ctx.lineTo(this.x2,this.y2);
    }
    
    // reset state for next line
    this.reset();
}

    
/**
 * Creates an Object that can plot the graph to a canvas and then
 * interact with that plot
 *
 */ 
let Plot = module.exports = function Plot(args) {
    
    argumentTemplate(this, args, Plot.argumentTemplate);
        
    // http://scaledinnovation.com/analytics/splines/aboutSplines.html
    
}


Plot.argumentTemplate = argumentTemplate.template('Plot()', {
    graph: {
        description: 'a Graph object (see module:./Graph.js), to plot onto the canvas'
    },
    context: {
        description: 'a CanvasRenderingContext2D object to plot graph onto',         
    },
    x : argumentTemplate.number({
        description: 'x-coordinate for starting point of graph',
    }),
    y : argumentTemplate.number({
        description: 'y-coordinate for starting point of graph',
    }),
    width : argumentTemplate.number({
        description: 'width of graph',
    }),
    height: argumentTemplate.number({
        description: 'height of graph',
    })
});


/**
 * Draws graph onto canvas.
 *
 * @returns {Plot} this.
 */ 
Plot.prototype.draw = function draw() {
    
    const 
        ctx             = this.context,
        arrowSize       = Math.sqrt(this.width + this.height) / 4,
        arrowAngle      = Math.PI/6,
        smallestSide    = this.width < this.height ? 'width' : 'height',
        arrowSideLegth  = arrowSize * Math.tan(arrowAngle/2),
                
    // slightly smaller drawing box so that the edges of arrows are always visible
        left            = this.x      +     arrowSideLegth + 1,
        top             = this.y      +     arrowSideLegth + 1,
        width           = this.width  - 2 * arrowSideLegth - 2,
        height          = this.height - 2 * arrowSideLegth - 2,
        
        range           = this.graph.range(),
        
        scale = { 
            x: width  / range.x,
            y: height / range.y
        },
    
    
        yAxisDistanceFromLeft   = scale.x * -this.graph.xmin,
        xAxisDistanceFromTop    = scale.y * this.graph.ymax;
        
    
    
    ctx.save();
    ctx.lineJoin = 'round';
    
    // clip to bigger box
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.clip();
    
    
    // draw grid
    if( this.graph.gridColor )
    {
        ctx.strokeStyle = this.graph.gridColor;
        ctx.lineWidth = arrowSize / 12;
        
        ctx.beginPath();
        
        const 
            lines       = 10;
            
        let
            lineSpace   = this[smallestSide] / (lines),
            vertlines   = width  / lineSpace,
            hozlines    = height / lineSpace,
            
            // align grid with axis
            
            hozbefore   = yAxisDistanceFromLeft % lineSpace,
            vertbefore  = xAxisDistanceFromTop  % lineSpace,
            
            // find index of grid line which is over axis and therefore will not be drawn
            
            hozNoDraw   = Math.floor(xAxisDistanceFromTop  / lineSpace),
            vertNoDraw  = Math.floor(yAxisDistanceFromLeft / lineSpace);
            
        
        for(let i = 0; i < hozlines; ++i)
        {
            // horizontal line
            
            let lineDist = vertbefore + lineSpace * i;
            
            if( i !== hozNoDraw && lineDist > lineSpace / 2 && lineDist < height - lineSpace/2 )
            {
                ctx.moveTo(left        , top + lineDist);
                ctx.lineTo(left + width, top + lineDist);
            }
        }
        for(let i = 0; i < vertlines; ++i) 
        {
            // vertical line
            
            let lineDist = hozbefore + lineSpace * i;
            
            if( i !== vertNoDraw && lineDist > lineSpace / 2 && lineDist < width - lineSpace/2 )
            {
                ctx.moveTo(left + lineDist, top);
                ctx.lineTo(left + lineDist, top + height);
            }
        }
        
        ctx.stroke();
    }
    
    // draw axis
    
    ctx.strokeStyle = this.graph.axisColor;
    ctx.fillStyle   = color(this.graph.axisColor).lighten();
    ctx.lineWidth = arrowSize / 8;
    
    // x - axis
    if( this.graph.ymax >= 0 && this.graph.ymin <= 0 )
    {
        ctx.beginPath();
        if( arrowSize * 1.2 < width - yAxisDistanceFromLeft )
            shapes.arrow(ctx,
                         left,         top + xAxisDistanceFromTop,
                         left + width, top + xAxisDistanceFromTop,
                         arrowSize, arrowAngle);
        else
        {
            ctx.lineTo(left,         top + xAxisDistanceFromTop);
            ctx.lineTo(left + width, top + xAxisDistanceFromTop);         
        }
        ctx.stroke();
        ctx.fill();
    }
    // y - axis
    if( this.graph.xmax >= 0 && this.graph.xmin <= 0 )
    {
        ctx.beginPath();
        if( arrowSize * 1.2 < xAxisDistanceFromTop )
            shapes.arrow(ctx,
                         left + yAxisDistanceFromLeft, top + height,
                         left + yAxisDistanceFromLeft, top,
                         arrowSize, arrowAngle);
        else
        {
            ctx.lineTo(left + yAxisDistanceFromLeft, top);
            ctx.lineTo(left + yAxisDistanceFromLeft, top + height);
        }
        ctx.stroke();
        ctx.fill();
    }
    
    let smoother = new Smoother(ctx, 0),
        colorIndex = 0;
    
    let counter = 0;
    for( let line of Line.getLines(this.graph) )
    {
    
        let markFunc = line.marker;
        
        if( _.isString(markFunc) )
            markFunc = markers[markFunc] || false;
        
        ctx.strokeStyle = line.color === Line.defaultColorSymbol ? this.graph.colors[colorIndex++] : line.color;
        ctx.lineWidth = arrowSize / 4;
        
        ctx.beginPath();
        
        smoother.smooth = line.smooth;
        
        
        for(let coor of Iterator.combine({ x: line.x, y: line.y }))
        {
            let relX = yAxisDistanceFromLeft + scale.x * coor.x,
                relY = xAxisDistanceFromTop  - scale.y * coor.y;
               
            smoother.smoothTo(left + relX, top + relY);
        }
        
        smoother.end();
        
        if(markFunc)
            for(let coor of Iterator.combine({ x: line.x, y: line.y }))
            {
                let relX = yAxisDistanceFromLeft + scale.x * coor.x,
                    relY = xAxisDistanceFromTop  - scale.y * coor.y;
                
                markFunc(ctx, left + relX, top + relY, arrowSize/2);
                
            }
            
        ctx.stroke();
        
        
        ++counter;
    }
    
    ctx.restore();
    
    return this;    
}


/**
 * Clears the region of the canvas that graphs are plotted to.
 *
 * @returns {Plot} this.
 */ 
Plot.prototype.clear = function clear() {
    this.context.clearRect(this.x, this.y, this.width, this.height);
}



/**
 * Get the scale used to transform plot coordinates to canvas coordinates.
 *
 *
 * @returns {Object} Object with properties `x` and `y` set to the horizontal and vertical scales respectively.
 */
Plot.prototype.scale = function scale() {
    const 
        arrowSize       = Math.sqrt(this.width + this.height) / 4,
        arrowAngle      = Math.PI/6,
        arrowSideLegth  = arrowSize * Math.tan(arrowAngle/2),
                
        width           = this.width  - 2 * arrowSideLegth - 2,
        height          = this.height - 2 * arrowSideLegth - 2,
        
        range           = this.graph.range();
        
    return { 
        x: width  / range.x,
        y: height / range.y
    }; 
}
 
/**
 * Get position of mouse in coordinate system of graph
 * Function takes an object representing the position of the mouse relative to the page
 * and returns the position of that event using the coordinate system used to plot the graph.
 *
 *
 *
 * @param {Object} pagePosition Postion of mouse relative to page.
 * @param {number} pagePosition.x Distance of mouse from left of page.
 * @param {number} pagePosition.y Distance of mouse from top of page.
 *
 *
 * @returns {Object} Object with x,y properties set to the position of the mouse event
 */
Plot.prototype.position = function position(pagePosition) {

    // todo this may not need to be called every time
    let offset = $(this.context.canvas).offset();
    
    const 
        ctx             = this.context,
        arrowSize       = Math.sqrt(this.width + this.height) / 4,
        arrowAngle      = Math.PI/6,
        arrowSideLegth  = arrowSize * Math.tan(arrowAngle/2),
                
    // slightly smaller drawing box so that the edges of arrows are always visible
        left            = this.x      +     arrowSideLegth + 1,
        top             = this.y      +     arrowSideLegth + 1,
        width           = this.width  - 2 * arrowSideLegth - 2,
        height          = this.height - 2 * arrowSideLegth - 2,
        
        range           = this.graph.range(),
        
        scale = { 
            x: width  / range.x,
            y: height / range.y
        };
    
        
    return {
        x: (   pagePosition.x - offset.left - left ) / scale.x + this.graph.xmin,
        y: ( - pagePosition.y + offset.top  + top  ) / scale.y + this.graph.ymax   
    }

}

