const
    
    $   = require('jquery'),
    _   = require('lodash'),
    animate = require('animation-timer2'),

    Graph           = require('./graph/Graph'),
    LayeredCanvas   = require('./LayeredCanvas')
    
    
    ;
    
let difference = (a, b) => Math.abs(a-b);
    
let impulseCanvas = new LayeredCanvas($('#impulse-graph')[0], 1);

function linSpace(from, to, n) {
    
    return n <= 0 ? [] :
            n === 1 ? [to] :
                _.times(n, i => from + (to - from) * i / (n - 1))
}

animate(function(controller) {
    
    let impulseGraph  = new Graph({
            gridColor: '#EDB7B7',
            xmin: -1,
            xmax: 20,
            ymin: -3,
            ymax: 5
        }),

        plot = impulseGraph.plot({
            context: impulseCanvas.getlayer(0).context,
            x: 5, 
            y: 5, 
            width: impulseCanvas.width - 30, 
            height: impulseCanvas.height - 30,
            gridColor: 'red',
            smooth: 0.3
        }),
    
        x = [],
        raw_y = [],
        smoothed_y = [],
        y  = [],
        dy = [],
        grad_x = [],
        grad_y = [],
        
        smooth = 8;
        
    impulseGraph.add({
        x,
        y: smoothed_y           
    });
    
    impulseGraph.add({
        x: grad_x,
        y: grad_y        
    });
    
    let lin = impulseGraph.add({
        x: [],
        y: []        
    })
       
    $(plot.context.canvas).mousedown(function(event) {
        
        x.length = grad_x.length = raw_y.length = 0;
        
        $(event.currentTarget).on('mousemove.getImpulse', function(event) {
            let { x: new_x, y: new_y } = plot.position(event);
            
            
            
            if( x.length === 0 || raw_y.length === 0 ||  new_x - _.last(x) > 0.01 )
            {
                let dx = ( new_x - _.last(x) ),
                    grad = ( new_y - _.last(raw_y) ) / dx ,
                    grad_lim = 3;
                
                if( grad > grad_lim )
                    new_y = _.last(raw_y) + grad_lim * dx;
                
                if( grad < -grad_lim )
                    new_y = _.last(raw_y) - grad_lim * dx;
                
                x.push(new_x);
                raw_y.push(new_y);
            }
            
            // smooth y
            for(let len = raw_y.length, i = Math.max(0,len - smooth);
                i < len;
                ++i)
            {
                let sum = 0,
                    maxJ = Math.min(smooth, len-i-1),
                    minJ = (i > smooth ? -smooth : -i);
                    
                let counter = 0;
                    
                for(let j = minJ; j <= maxJ; ++j)
                {
                    counter += (1 + smooth - Math.abs(j));
                    sum += raw_y[i+j] * (1 + smooth - Math.abs(j));
                }    
                    
                smoothed_y[i] = sum / counter;
            }
            
            // calculate dy/dx based on smoothed y
            for(let len = raw_y.length, i = Math.max(2,len - smooth);
                i < len;
                ++i)
            {
                let upp = Math.max(i+1, len-1);
                let low = Math.max(i-1, 0);
                
                grad_x[i] = x[i];
                grad_y[i] = ( smoothed_y[upp] - smoothed_y[low] ) / (x[upp] - x[low]);
            }    

               
            
        }).one('mouseup', function(event) {
                
            $(event.currentTarget).off('mousemove.getImpulse'); 
            
            let n       = 20,
                sum_xy  = 0,
                sum_x   = 0,
                sum_y   = 0,
                sum_x2  = 0;
                
            for(let len = x.length, i = len - n;
                i < len; ++i)
            {
                sum_xy  += x[i] * raw_y[i];
                sum_x   += x[i];
                sum_y   += raw_y[i];
                sum_x2  += x[i] * x[i];
            }    

            let beta    = ( sum_xy - sum_x * sum_y / n ) / ( sum_x2 - sum_x * sum_x / n ),
                alpha   = ( sum_y - beta * sum_x ) / n,
                
                dx      = ( x[x.length-1] - x[x.length-n] ) / n;
                
            lin.x = _.times(2*n, i => x[x.length-n] + dx * i);
            lin.y = lin.x.map( x_val => beta + alpha*x_val ); 
             
            controller.stop();
        });
        
        controller.start();
    });
    
       
    controller.on('animate', function(event){
        plot.clear();
        plot.draw();
    }).on('stop', function() {
        plot.clear();
        plot.draw();
    });
    
    
});