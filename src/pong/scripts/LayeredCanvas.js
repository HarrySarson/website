'use strict';

let $ = require('jquery'),
    _ = require('lodash');
  
function clearCanvas(context, w, h){
    // Store the current transformation matrix
    context.save();

    // Use the identity matrix while clearing the canvas
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, w, h);

    // Restore the transform
    context.restore();
}

function addLayer(w, h) {
    let canvas = document.createElement('canvas');
    
    canvas.width  = w;
    canvas.height = h;
    
    canvas.style = 'position: absolute';
    
    return canvas;
}

let Canvas = function(el, layers){
    
    
    el = $(el); // wrap in jquery
    layers = +layers; // coerse into number
    
    
    if(el.css('position') === 'static')
        el.css('postion', 'relative');
    
    this._width  = el.width();
    this._height = el.height();
    
    
    
    this._canvas  = _.times(layers, _.partial(addLayer,this._width, this._height));
    
    $(this._canvas).prependTo(el);    
    
    this._context = this._canvas.map( canvas => canvas.getContext('2d') );
    
    this._parent = el;
          
};

Object.defineProperties(Canvas.prototype, {
    parent: {
        enumerable: true,
        configurable: true,
        get: function() {
            return this._parent;
        }
    },
    width: {
        enumerable: true,
        configurable: true,
        get: function() {
            return this._width;
        }
    },
    height: {
        enumerable: true,
        configurable: true,
        get: function(){
            return this._height;
        }
    }
})

Canvas.CanvasLayer = function() { };

Canvas.CanvasLayer.prototype.session = function(cb) {
    
    this.context.save();
    
    cb.call(this, this);
    
    this.context.restore();
}


Canvas.prototype.resizeCanvas = function() {
    this._width  = this._parent.width();
    this._height = this._parent.height();
    let self = this;    
    this._canvas.forEach(function(canvas){
        canvas.width = self._width;
        canvas.height = self._height;
    });
};

Canvas.prototype.isResizeRequired = function() {
    return this._width !== this._parent.width() ||
            this._height !== this._parent.height();
};

Canvas.prototype.clear = function(){
    for(let i = 0, len = this.totallayers();
        i < len;
        ++i)
    {
        clearCanvas(this._context[i], this._width, this._height);
    }
};
  
Canvas.prototype.addlayers = function(layers){
    while(layers > 0)
    {
        let canvas = _.partialaddLayer(this._width, this._height);
        
        this._canvas.push(canvas);
        this._context.push(canvas.getContext('2d'));
    }
};

Canvas.prototype.getlayer = function(i) {
    
    if(!_.isLength(i))
        return null;
    
    let self = this;
    return _.assign(new Canvas.CanvasLayer(), { 
        get width   () { return self._width; }, 
        get height  () { return self._height; },
        get canvas  () { return $(self._canvas[i]); }, 
        get context () { return self._context[i]; }, 
        get parent  () { return self._parent; },
        get i       () { return i; },
        clear:  clearCanvas.bind(null, self._context[i], self._width, self._height)
    });    
};

Canvas.prototype[Symbol.iterator] = function* (){
    for(let i = 0; i < this.totallayers(); ++i){
        yield this.getlayer(i);
    }
}

Canvas.prototype.totallayers = function(){        
    return this._canvas.length;   
};

module.exports = Canvas;
  