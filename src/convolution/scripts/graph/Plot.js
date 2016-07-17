const
    $       = require('jquery'),
    color   = require('tinycolor2'),

    argumentTemplate = require('../argument-template'),
    shapes  = require('./canvasShapes'),
    Line    = require('./Line')    
    
    ;

const
    hasOwn = Object.prototype.hasOwnProperty;
    
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

function clip(lower, upper, x) {
    return Math.max(lower, Math.min(upper, x));
}

    
/**
 * Creates an Object that can plot the graph to a canvas and then
 * interact with that plot
 *
 */ 
let Plot = module.exports = function Plot(args) {
    
    argumentTemplate(this, args, Plot.argumentTemplate);
        
    // http://scaledinnovation.com/analytics/splines/aboutSplines.html
    
    this._scaleX                  = this.width  / (this.graph.xmax - this.graph.xmin);
    this._scaleY                  = this.height / (this.graph.ymax - this.graph.ymin);
    
    this._yAxisDistanceFromLeft   = this._scaleX * -this.graph.xmin;
    this._xAxisDistanceFromTop    = this._scaleY * this.graph.ymax;
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
        smallestSide    = this.width < this.height ? 'width' : 'height';
    
    
    ctx.save();
    ctx.lineJoin = 'round';
    
    
    // draw axis
    
    ctx.strokeStyle = this.graph.axisColor;
    ctx.fillStyle   = color(this.graph.axisColor).lighten();
    ctx.lineWidth = arrowSize / 8;
    
    // x - axis
    if( this.graph.ymax > 0 && this.graph.ymin < 0 )
    {
        ctx.beginPath();
        if( arrowSize * 1.2 < this.width - this._yAxisDistanceFromLeft )
            shapes.arrow(ctx,
                         this.x,              this.y + this._xAxisDistanceFromTop,
                         this.x + this.width, this.y + this._xAxisDistanceFromTop,
                         arrowSize, Math.PI/6);
        else
        {
            ctx.lineTo(this.x,              this.y + this._xAxisDistanceFromTop);
            ctx.lineTo(this.x + this.width, this.y + this._xAxisDistanceFromTop);         
        }
        ctx.stroke();
        ctx.fill();
    }
    // y - axis
    if( this.graph.xmax > 0 && this.graph.xmin < 0 )
    {
        ctx.beginPath();
        if( arrowSize * 1.2 < this.height - this._xAxisDistanceFromTop )
            shapes.arrow(ctx,
                         this.x + this._yAxisDistanceFromLeft, this.y,
                         this.x + this._yAxisDistanceFromLeft, this.y + this.height,
                         arrowSize, Math.PI/6);
        else
        {
            ctx.lineTo(this.x + this._yAxisDistanceFromLeft, this.y);
            ctx.lineTo(this.x + this._yAxisDistanceFromLeft, this.y + this.height);
        }
        ctx.stroke();
    }
    
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
            vertlines   = this.width  / lineSpace,
            hozlines    = this.height / lineSpace,
            
            // align grid with axis
            
            hozbefore   = this._yAxisDistanceFromLeft % lineSpace,
            vertbefore  = this._xAxisDistanceFromTop  % lineSpace,
            
            // find index of grid line which is over axis and therefore will not be drawn
            
            hozNoDraw   = Math.floor(this._xAxisDistanceFromTop  / lineSpace),
            vertNoDraw  = Math.floor(this._yAxisDistanceFromLeft / lineSpace);
            
        
        for(let i = 0; i < hozlines; ++i)
        {
            // horizontal line
            
            let lineDist = vertbefore + lineSpace * i;
            
            if( i !== hozNoDraw && lineDist > lineSpace / 2 && lineDist < this.height - lineSpace/2 )
            {
                ctx.moveTo(this.x             , this.y + lineDist);
                ctx.lineTo(this.x + this.width, this.y + lineDist);
            }
        }
        for(let i = 0; i < vertlines; ++i) 
        {
            // vertical line
            
            let lineDist = hozbefore + lineSpace * i;
            
            if( i !== vertNoDraw && lineDist > lineSpace / 2 && lineDist < this.width - lineSpace/2 )
            {
                ctx.moveTo(this.x + lineDist, this.y);
                ctx.lineTo(this.x + lineDist, this.y + this.height);
            }
        }
        
        ctx.stroke();
    }
    
    let smoother = new Smoother(ctx, 0);
    
    let counter = 0;
    for( let line of Line.getLines(this.graph) )
    {
        
        ctx.strokeStyle = hasOwn.call(line, 'color') ? line.color : this.graph.colors[counter];
        ctx.lineWidth = arrowSize / 4;
        
        ctx.beginPath();
        
        smoother.smooth = line.smooth;
        
        
        for(let i = 0, len = Math.min(line.x.length, line.y.length);
            i < len;
            ++i)
        {
            let clipedX = clip(1, this.width-1,  this._yAxisDistanceFromLeft + this._scaleX * line.x[i]),
                clipedY = clip(1, this.height-1, this._xAxisDistanceFromTop  - this._scaleY * line.y[i]);
                
            smoother.smoothTo(this.x + clipedX, this.y + clipedY);
        }
        smoother.end();
        
        ctx.stroke();
        
        ++counter;
    }
    
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
 * Get position of mouse in coordinate system of graph
 * Function takes a mouse event object (for example the object passed to the onclick event handler)
 * and returns the position of that event using the coordinate system used to plot the graph.
 *
 * Note: this function uses pageX and pageY properties assuming they have already been normalized
 * by jquery or something similar
 *
 * Note: Graph#plot() must have been called atleast once to retrieve a valid position,
 * if Graph#plot() has not been called then this function returns `{ x:null, y:null }`
 *
 * @property {Jquery.Event} event Mouse event operator
 *
 *
 * @returns {Object} Object with x,y properties set to the position of the mouse event
 */
 

Plot.prototype.position = function position(event) {

    // todo this may not need to be called every time
    let offset = $(this.context.canvas).offset();
    
    return {
        x: (   event.pageX - offset.left - this._yAxisDistanceFromLeft ) / this._scaleX,
        y: ( - event.pageY + offset.top  + this._xAxisDistanceFromTop  ) / this._scaleY        
    }

}

