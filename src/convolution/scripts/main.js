'use strict';

const
    
    $   = require('jquery'),
    _   = require('lodash'),
    animate = require('animation-timer2'),
    math = require('mathjs'),

    clamp           = require('./util/clamp'),
    gauss           = require('./util/gauss'),
    Graph           = require('./graph/Graph'),
    Line            = require('./graph/Line'),
    LayeredCanvas   = require('./LayeredCanvas'),
    Iterator        = require('./Iterator')
    
    
    ;
    
let difference = (a, b) => Math.abs(a-b);
    
let square = x => x*x;
    
let impulseCanvas = new LayeredCanvas($('#impulse-graph')[0], 2);

function linSpace(from, to, n) {
    n = Math.floor(n);
    return n <= 0 ? [] :
            n === 1 ? [to] :
                _.times(n, i => from + (to - from) * i / (n - 1))
}

function intPow(num, exp)
{
    let result = 1.0;
    
    exp = exp|0; // coerse into integer
    
    while (exp > 0)
    {
        if (exp % 2 === 1)
            result *= num;
        exp >>= 1;
        num *= num;
    }

    return result;
}

animate(function(controller) {
    
    let impulseGraph  = new Graph({
            gridColor: '#EDB7B7',
            xmin: -1,
            xmax: 20,
            ymin: -5,
            ymax: 10
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
    
        raw = new Line({
            x: [],
            y: []
        }),
        
        adjusted = new Line({
            x: [],
            y: []
        }),
        
        y  = [],
        dy = [],
        
        brush_size = 4,
        
        grad_smooth = 8;
        
    impulseGraph.add({
        x: raw.x,
        y: raw.y,
        color: 'pink',
        marker: 'o'
    });
    
    adjusted.graph = [impulseGraph];
    adjusted.marker = '+';
    
    let quad = _.times(2, () => impulseGraph.add({
        x: [],
        y: [],
    }));
    
    let main_line = impulseGraph.add({
        x: [],
        y: [],
        color: 'black'
    });
    
    let gradLine = impulseGraph.add({
        x: [],
        y: [],
    });
    
    let rawGrad = impulseGraph.add({
        x: [],
        y: [],
    });
    
    
    let after = impulseGraph.add({
        x: [],
        y: [],
        color: main_line.color
        
    });
    
    let before = impulseGraph.add({
        x: [],
        y: [],
        color: main_line.color
    });
    
    
           
    let fitPoly = function(x, y, degree) {
        
        let coors = Iterator.combine({x,y});
        
        // see http://mathworld.wolfram.com/LeastSquaresFittingPolynomial.html
        
        let xTy = _.times(degree+1, _.constant(0)),
            xTx = _.times(degree+1, _.partial(_.times, degree+1, _.constant(0))),
            
            i = 0;
        
        // populate arrays
        // X^T * X * a = X^T * y (where a is vector of coefficients to be found)
        
        while( i <= degree ) {
            let xk_sum = 0,
                xk_y_sum = 0;
                
            for(let coor of coors) 
            {
                let xk = intPow(coor.x, i);
                
                xk_sum += xk;
                xk_y_sum += xk * coor.y;
            }        
            
            for(let j = 0; j <= i; ++j)
            {
                xTx[j][i-j] = xk_sum;
            }
            xTy[i] = xk_y_sum;
            ++i;
        }
        
        while( i <= 2*degree ) {
            let xk_sum = 0;
                
            for(let coor of coors) 
            {
                let xk = intPow(coor.x, i);
                
                xk_sum += xk;
            }        
            
            for(let j = i-degree; j <= degree; ++j)
            {
                xTx[j][i-j] = xk_sum;
            }
            ++i;
        }
        
        // solve for a
        return gauss(xTx, xTy);        
    }
    
    let arrayOffsetIterable = function(arr, offset) {
        
        if( offset == null )
            offset = 0;
        
        if( !_.isNumber(offset = +offset) )
            throw new Error('arrayOffsetIterable(): offset is not a number');
                            
        return new Iterator.Iterable(function*() {
            let len = arr.length,
                off = offset;
                
                
            if( off < 0 )
                off += len;
            
            off = Math.max(0, off);
            
            while(off < len)
                yield arr[off++];
        });
    };
    
    let arrayReverseIterable = function(arr) {
        return new Iterator.Iterable(function*() {
            let len = arr.length;
            
            while(len > 0)
                yield arr[--len];
        });
    };
    
    let HornerEvaluate = function(x, poly_arr)
    {
        return Iterator.reduce(arrayReverseIterable(poly_arr), (res, coeff) => res * x + coeff, 0);
    };
    
    let joinAfterTimout = null,
        lastAdjX = null,
        lastAdjY = null;
    
    $(impulseCanvas.parent).mousedown(function(event) {
        raw.x.length = main_line.x.length = raw.y.length = main_line.y.length 
            = gradLine.y.length = before.y.length = after.y.length = 0;
        
        
        lastAdjX = null;
        lastAdjY = null;
        
        let dxdt = 0, // how 'fast' line is drawn
            lastTime = null,
            joinedBefore = false,
            lastPageX = null,
            lastPageY = null;
            
        if( joinAfterTimout != null )
            clearTimeout(joinAfterTimout);
        
        $(event.currentTarget).on('mousemove.getImpulse', function(event) {
        
            
            let adj_x = null,
                adj_y = null;
            
            // always add first point
            if( lastAdjX == null )
            {
                lastAdjX = adj_x = event.pageX;
                lastAdjY = adj_y = event.pageY;
            }
            else
            {
                let y_step = event.pageY - lastAdjY,
                    x_step = event.pageX - lastAdjX,
                    
                
                    gradLim = 4,
                    
                    y_step_sign = Math.sign(y_step),
                
                    signedGradLim = gradLim * y_step_sign;
                    
                
                // case 1: new_x is behind previous x and the
                // nearest valid point is the previous one so don't plot
                if( x_step < 0 && y_step * signedGradLim < -x_step )
                    return;
                    
                   
                // case 2: new point is valid               
                if( y_step / signedGradLim < x_step )
                {
                    adj_x = event.pageX;
                    adj_y = event.pageY;
                }
                // case 3: new point is not valid so find nearest valid point
                else 
                {
                    let c = ( Math.abs(y_step) - gradLim * x_step ) / ( 1 + square(gradLim) );
                    
                    adj_x = event.pageX + c * gradLim;
                    adj_y = event.pageY - c * y_step_sign;
                }
                
                $('.info').children().eq(1).text(square(adj_x - lastAdjX) + ' + ' + square(adj_y - lastAdjY) + ' < 200');
            
                // ensure that new point is sufficiently different from previous point
                if( square(adj_x - lastAdjX) + square(adj_y - lastAdjY) < 200 )
                    return;
                
                    
                lastAdjX = adj_x;
                lastAdjY = adj_y;
            } 
            
            
                
            let now = performance.now(),
                dt = null;
            

            let { x: new_raw_x, y: new_raw_y } = plot.position({ x: event.pageX, y: event.pageY });
            let { x: new_x, y: new_y } = plot.position({ x: adj_x, y: adj_y });
            
            if( lastTime != null )
            {
                
                dt = now - lastTime;
            }
            lastTime = now;
            
            setTimeout(function(){
                
                // join up before
                if( joinedBefore === false && (_.last(raw.x) - raw.x[0]) > impulseGraph.range().x / 50 )
                {
                    joinedBefore = true;
                    if( raw.x[0] < 0.001 )
                    {
                        before.x = [0, raw.x[0]];
                        before.y = [0, raw.y[0]];
                    }
                    else
                    {
                        let quadratic = fitPoly(raw.x,
                                                raw.y, 
                                                2);
                        
                        let y1  = _.head(raw.y),
                            x1  = _.head(raw.x),
                            yD1 = quadratic[1] + 2*quadratic[2]*x1,
                            q   = ( y1 - yD1 * x1 ) / ( x1 * y1 ),
                            exp = Math.exp( q * x1 ),
                            A   = y1 / x1 * exp;
                            
                        quad[0].x = linSpace(x1 - impulseGraph.range().x / 50, x1 + impulseGraph.range().x / 50, 100);
                        quad[0].y = quad[0].x.map(_.partial(HornerEvaluate, _, quadratic));
                        
                        before.x = linSpace(x1, 0, 2 + Math.floor(x1 / impulseGraph.range().x * 200));
                        
                        let i = 0;
                        
                        let addY = function addY() {
                            before.y[i] =  A * before.x[i]  *  Math.exp( -q * before.x[i] );
                            ++i;
                            if( i < before.x.length )
                                setTimeout(addY, 2*( 2*i < before.x.length ?  Math.floor(before.x.length/2) - i : i - Math.ceil(before.x.length/2) ));
                        }
                        addY();
                    }
                }
                
                
                let dx = new_x - _.last(raw.x),
                    dy = new_y - _.last(raw.y),
                    range = impulseGraph.range();
                
                if( dt != null )
                {
                    let alpha = 0.9;
                    dxdt = ( dx / dt ) * alpha + dxdt * ( 1 - alpha );
                    
                    $('.info').children().eq(0).text(dxdt);
                }
                
                
                if( new_x < 0 )
                {
                    if( raw.x.length > 0 )
                        return;
                    else
                        new_x = 0;
                }    
                
                raw.x.push(new_raw_x);
                raw.y.push(new_raw_y);
                
                adjusted.x.push(new_x);
                adjusted.y.push(new_y);
                
                let i  = main_line.x.length;
                
                $('.info').children().eq(2).text(square(_.last(adjusted.x) - adjusted.x[i]) 
                            + ' + ' + square(_.last(adjusted.y) - adjusted.y[i]) + ' > ' + square(brush_size)
                            
                        + ' && ' + square(adjusted.x[i] - adjusted.x[0])
                            + ' + ' + square(adjusted.y[i] - adjusted.x[i]) + ' > ' + square(brush_size) );    
                
                for(let i = main_line.x.length; i < adjusted.x.length; ++i)
                    if(
                        square(_.last(adjusted.x) - adjusted.x[i]) 
                            + square(_.last(adjusted.y) - adjusted.y[i]) > square(brush_size)
                            
                        && square(adjusted.x[i] - adjusted.x[0])
                            + square(adjusted.y[i] - adjusted.x[i]) > square(brush_size)
                        )   main_line.x[i] = adjusted.x[i];
                
                // smooth y
                let smooth = 2;
        
                for(let len = adjusted.y.length, i = Math.max(0,len - smooth);
                    i < len;
                    ++i)
                {
                    let sum = 0,
                        minJ = (i > smooth ? -smooth : -i);
                        
                    let counter = 0;
                        
                    for(let j = minJ; j <= smooth; ++j)
                    {
                        let clampedJ = Math.min(j, len-i-1);
                        counter += (1 + smooth - Math.abs(clampedJ));
                        sum += adjusted.y[i+clampedJ] * (1 + smooth - Math.abs(clampedJ));
                    }    
                    
                    main_line.y[i] = sum / counter;
                }
                
                // calculate dy/dx based on adjusted y
                for(let len = adjusted.y.length, i = Math.max(2,len - smooth);
                    i < len;
                    ++i)
                {
                    let upp = Math.min(i+1, len-1);
                    let low = Math.max(i-1, 0);
                    
                    gradLine.x[i] = adjusted.x[i];
                    gradLine.y[i] = ( adjusted.y[upp] - adjusted.y[low] ) / (adjusted.x[upp] - adjusted.x[low]);
                }   
                
                // calculate dy/dx based on raw y
                for(let len = raw.y.length, i = Math.max(2,len - smooth);
                    i < len;
                    ++i)
                {
                    let upp = Math.min(i+1, len-1);
                    let low = Math.max(i-1, 0);
                    
                    rawGrad.x[i] = raw.x[i];
                    rawGrad.y[i] = ( raw.y[upp] - raw.y[low] ) / (raw.x[upp] - raw.x[low]);
                }    
                
                // smooth gradient
                /*
                for(let len = raw.y.length, i = Math.max(0,len - grad_smooth);
                    i < len;
                    ++i)
                {
                    let sum = 0,
                        maxJ = Math.min(grad_smooth, len-i-1),
                        minJ = (i > grad_smooth ? -grad_smooth : -i);
                        
                    let counter = 0;
                        
                    for(let j = minJ; j <= maxJ; ++j)
                    {
                        counter += (1 + grad_smooth - Math.abs(j));
                        sum += gradLine[i+j] * (1 + grad_smooth - Math.abs(j));
                    }    
                        
                    ....  .y[i] = sum / counter;
                }*/
            });
        }).one('mouseup', function(event) {
                
            $(event.currentTarget).off('mousemove.getImpulse'); 
             
            // join up after
            (function () {
                
                                        
                let quadratic = fitPoly(arrayOffsetIterable(main_line.x, -10),
                                        arrayOffsetIterable(main_line.y, -10), 
                                        2);
                
                
                let y2  = _.last(main_line.y),
                    x2  = _.last(main_line.x),
                    yD2 = quadratic[1] + 2*quadratic[2]*x2,
                    yDD2= 2*quadratic[2],
                    qnew= clamp(( Math.sqrt(Math.max(0,yD2*yD2-y2*yDD2)) - yD2 ) / y2,
                                3.5 * Math.abs(y2),
                                0.36),
                    q   = 0.3,
                    exp = Math.exp( q * x2 ),
                    A   = ( q * y2  + yD2 ) * exp,
                    B   = ( y2 - q * x2 * y2 - x2 * yD2 ) * exp
                
                quad[1].x = linSpace(x2 - impulseGraph.range().x / 50, x2 + impulseGraph.range().x / 50, 100);
                quad[1].y = quad[1].x.map(_.partial(HornerEvaluate, _, quadratic));
                
                after.x = linSpace(x2, impulseGraph.xmax, 100);
                
                let i = 0,
                    alpha = 1;
                
                function addY() {
                    let x = after.x[i];
                    after.y[i] = ( A*x + B ) *  Math.exp( -q * x );
                    ++i;
                    alpha /= 1.047;
                    if( i < after.x.length )
                        joinAfterTimout = setTimeout(addY, (after.x[i] - x) / (dxdt + 1e-5) * alpha);
                }
                addY();
            }());
        }); 
    });
    
    controller.start();
        
    controller.on('animate', function(event){
        plot.clear();
        plot.draw();
        
        
        
        $('.info').children().eq(3).text(brush_size); 
        
        impulseCanvas.getlayer(1).clear();
        impulseCanvas.getlayer(1).context.beginPath();
        impulseCanvas.getlayer(1).context.arc(lastAdjX - $(impulseCanvas.parent).offset().left, 
                                                lastAdjY - $(impulseCanvas.parent).offset().top, brush_size, 0, Math.PI * 2);
        impulseCanvas.getlayer(1).context.stroke();
    }).on('stop', function() {
        plot.clear();
        plot.draw();
    });
    
    
});
    