const
    $       = require('jquery'),
    animate = require('animation-timer2'),
    math    = require('mathjs'),
    
    
    keyboardInput   = require('./keyboard')
    
    ;

let gameState = {
    paddle: {
        pos:    [math.complex(-1, 0), math.complex(+1,0)],
        speed:  [math.complex(0, 0),  math.complex( 0,0) ],
        height: 0.2
    },
    
    ball: {
        pos:    math.complex(0,0),
        speed:  math.complex(0,0)
    }
}

function toCanvasCoor(gameCoor) {
    
}

function square(x) {
    return x*x;
}

function sgn(x) {
    return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
}

let CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;

if (CP && CP.lineTo) {
    /*
     *    (x,y) is line begin coordinates
     *    (x2,y2) is line end coordinates
     *    dashArray should contain the lengths of dashes and will be cycled through
     */
    CP.dashedLine = function(x,y,x2,y2,dashArray) {
        if (!dashArray) 
        {
            dashArray=[10,5];
        }
        // beginning on line
        this.moveTo(x, y);
        // gradient
        let dx = (x2-x), dy = (y2-y);
        if(dx === 0) dx = 1e-15;
        let slope = dy/dx;
        
        // length of line
        let distRemaining = Math.sqrt( dx*dx + dy*dy );
        
        // cycles through dashes and gaps
        let dashIndex=0, draw=true;
        while (distRemaining>=0.1)
        {
            // length is taken from array or shortened if line is almost over
            let dashLength = Math.min(dashArray[dashIndex%dashArray.length],distRemaining);
            
            if (dashLength==0) 
            {
                dashLength = 0.001; // Hack for Safari
            }
        
            let xStep = sgn(dx) * dashLength / Math.sqrt(1 + slope*slope);
            
            // adjust x and y for next dash/gap
            x += xStep;
            y += slope*xStep;
            
            // draw dash or skip over a gap
            this[draw ? 'lineTo' : 'moveTo'](x,y);
            distRemaining -= dashLength;
            draw = !draw;
            ++dashIndex;
        }
    };
}

function fillNumber(context, x0, y0, width, height, lineWidth, number) {
    switch(number)
    {
        case 0:
            // top and bottom
            context.fillRect(x0,y0,width,lineWidth);
            context.fillRect(x0,y0+height-lineWidth,width,lineWidth);
            // sides
            context.fillRect(x0,y0,lineWidth,height);
            context.fillRect(x0+width-lineWidth,y0,lineWidth,height);
            break;
        case 1:
            // top (half width)
            context.fillRect(x0,y0,width/2+lineWidth/2,lineWidth);
            // vertical line
            context.fillRect(x0+width/2-lineWidth/2,y0,lineWidth,height);
            // base (full width)
            context.fillRect(x0,y0+height-lineWidth,width,lineWidth);
            break;
        case 2:
            // top, middle and bottom horizontal lines
            context.fillRect(x0,y0,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth)/2,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth),width,lineWidth);
            // vertical lines at top right and bottom left
            context.fillRect(x0+(width-lineWidth),y0,lineWidth,(height+lineWidth)/2);
            context.fillRect(x0,y0+(height-lineWidth)/2,lineWidth,(height+lineWidth)/2);
            break;
        case 3:
            // top, bottom horizontal lines
            context.fillRect(x0,y0,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth),width,lineWidth);
            // middle horizontal line (slightly shorter)
            context.fillRect(x0+width/5,y0+(height-lineWidth)/2,width*4/5,lineWidth);
            // vertical line at right
            context.fillRect(x0+(width-lineWidth),y0,lineWidth,height);
            break;
        case 4:
            // middle horizontal line
            context.fillRect(x0,y0+(height-lineWidth)/2,width,lineWidth);
            // vertical line at top left
            context.fillRect(x0,y0,lineWidth,(height+lineWidth)/2);
            // vertical line at right
            context.fillRect(x0+(width-lineWidth),y0,lineWidth,height);
            break;
        case 5:
            // top, middle and bottom horizontal lines
            context.fillRect(x0,y0,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth)/2,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth),width,lineWidth);
            // vertical lines at top left and bottom right
            context.fillRect(x0,y0,lineWidth,(height+lineWidth)/2);
            context.fillRect(x0+(width-lineWidth),y0+(height-lineWidth)/2,lineWidth,(height+lineWidth)/2);
            break;
        case 6:
            // top, middle and bottom horizontal lines
            context.fillRect(x0,y0,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth)/2,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth),width,lineWidth);
            // vertical line at left
            context.fillRect(x0,y0,lineWidth,height);
            // vertical line at bottom right
            context.fillRect(x0+(width-lineWidth),y0+(height-lineWidth)/2,lineWidth,(height+lineWidth)/2);
            break;
        case 7:
            // top (full width)
            context.fillRect(x0,y0,(width*4/5+lineWidth/2),lineWidth);
            // vertical line at leftish
            context.fillRect(x0+(width*4/5-lineWidth/2),y0,lineWidth,height);
            // horizontal line at middle (half width)
            context.fillRect(x0+(width-lineWidth)/2,y0+(height-lineWidth)/2,(width+lineWidth)/2,lineWidth);
            break;
        case 8:
            // top, middle and bottom horizontal lines
            context.fillRect(x0,y0,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth)/2,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth),width,lineWidth);
            // vertical line at left and right
            context.fillRect(x0,y0,lineWidth,height);
            context.fillRect(x0+(width-lineWidth),y0,lineWidth,height);
            break;
        case 9:
            // top, middle horizontal lines
            context.fillRect(x0,y0,width,lineWidth);
            context.fillRect(x0,y0+(height-lineWidth)/2,width,lineWidth);
            // vertical line at right
            context.fillRect(x0+(width-lineWidth),y0,lineWidth,height);
            // vertical line at top left
            context.fillRect(x0,y0,lineWidth,(height+lineWidth)/2);
            break;
    }
}
    
$(document).ready(function()
{
    
    let pause = function(k)
    {
        $("#pause").show();
        k.running = false;
    };
    let resume = function(k)
    {
        $("#pause").hide();
        setTimeout(function()
        {
            k.running = true;
        },400);    
    };
    
    let newGameStart = function()
    {
        keys.running = true;
        keys.newGame = false;
        resetAll();
        for(let i = 0; i < score.length; ++i)
            score[i] = 0;
        $("#newgame").hide();
        $("#pause").hide();
    };
    
        
    let SmartInterval = function(f,i)
    {
        this.id = 0;
        this.set(f,i);
    };

    SmartInterval.prototype.set = function(f,i)
    {
        if(typeof f !== 'function')
            return;
        if(typeof i === 'undefined')
            i = 1000;
        // clear existing interval
        if(this.id)
            clearInterval(this.id);
        this.id = setInterval(f,i);
    };
    SmartInterval.prototype.clear = function()
    {
        if(this.id !== 0)
        {
            clearInterval(this.id);
            this.id = 0;
        }
    };
    /*
     * x0 could alternatively be a function that sets the values of x and y
     * if so it must take a vector object as its first paramenter
     * 
     */
    let vector = function(x0,y0)
    {
        if(typeof x0 !== 'function')
        {
            this.reset = function()
            {
                this.x = x0;
                this.y = y0;
                return this;
            };
        }
        else 
        {
            this.reset = function()
            {
                return x0(this,arguments);
            };
        }
        this.reset();
    };
    
    let goldenRatio = 1.61803398875;
    let keys = keyboardInput($(document), pause, resume, newGameStart);
    let canvas = $("#map");
        
    canvas[0].width = canvas.parent().width();
    canvas[0].height = canvas.parent().height();
    let h = canvas[0].height;
    let w = canvas[0].width;
    
    let ctx = canvas[0].getContext("2d");
    
    
    let paddleCenter = [new vector(h*3/100,h/2), new vector(w-3*h/100,h/2)];
    let paddleSpeed = [0,0];
    let paddleHeight = Math.sqrt(h)*3;
    let paddleWidth =  h/50;
    let cpu = [false,false];
    let speedConst = 3/40*Math.pow(h,3/4);
    
    let score = [0,0];
    let roundLost = 0;
    let posReset = false;
    let downTime = 0.5;
    
    let ballCenter = new vector(w/2,h/2);
    let ballHeight = h/40;
    // ball will move with speed (magnitude) of w/150
    // at an angle which means it will hit the paddle without it being moved
    let ballVeloc = new vector(function(vec)
    {
        if(typeof vec.dir === 'undefined' || !vec.dir || (vec.dir !== 1 && vec.dir !== -1))
            vec.dir = (Math.random() < 0.5)*2-1;
        let maxAngle = Math.atan2((paddleHeight+ballHeight)/2.1,w/2-h/25-ballHeight/2);
        let magnitude = w/150;
        let angle = maxAngle * (Math.random() - 0.5);
        vec.x = magnitude*Math.cos(angle)*vec.dir;
        vec.y = magnitude*Math.sin(angle);
        vec.dir = 0;
        return vec;                                   
    });
    let ballAcel = w/125000;
    let canvasBackground = false;
    
    let resetAll = function    ()
    {
        ballCenter.reset();
        ballVeloc.reset();
        for(let i = 0; i < paddleCenter.length; ++i)
            paddleCenter[i].reset();    
    };
    
    let chooseCpu = function(el,isCpu,n)
    {
        cpu[n] = isCpu;
        if(isCpu)
        {
            el.html("CPU (CLICK TO CHANGE)");        
        }
        else
        {
            el.html("PLAYER (CLICK TO CHANGE)");
        }
    };
    chooseCpu($("#cpu1"),true,0);
    chooseCpu($("#cpu2"),false,1);
    $("#cpu1").click(function()
    {
        chooseCpu($(this),!cpu[0],0);
    });
    $("#cpu2").click(function()
    {
        chooseCpu($(this),!cpu[1],1);
        
    });
    $("#begin").click(function()
    {
        newGameStart();
    });
    $("#restart").click(function()
    {
        $("#pause").hide();
        keys.newGame = true;
        $("#newgame").show();
    });
    $("#restartWin").click(function()
    {
        $("#winner").hide();
        keys.newGame = true;
        $("#newgame").show();
    });
    $("#resume").click(function()
    {
        resume(keys);
    });
    
    let makeFlash = function(td)
    {
        let el = false;
        let flash = function(black)
        {
            if(el)
            {
                let c = (black) ? 'black' : 'white';
                el.css(
                {
                    'color': c
                });
                let t = (black) ? 300 : 300;
                setTimeout(function(){flash(!black);},t);
            }
        };
        td.mouseover(function()
        {
            el = $(this);
            let black = true;
            flash(black);
            
        }).mouseout(function()
        {
            el = false;
            $(this).css(
            {
                'color': ''
            });
        });
    };
    for(let i = 0; i < $(".select").length; ++i)
        makeFlash($($(".select")[i]));
    
    let checkScore = function()
    {
        for(let i = 0; i < score.length; ++i)
        {
            if(score[i] == 10)
            {
                $("#winName").html(i == 0 ? 'Left' : 'Right');
                $("#winner").show();
                keys.running = false;
            }
        }
    };
    
    let bounce = function(i)
    {
        let v1 = ballVeloc;
        let s1 = ballCenter;
        // x is position of ball in relation to center of paddle
        let x = paddleCenter[i].y - s1.y;
        // H is the height of the (paddle+half the ball)
        let H = paddleHeight/2 + ballHeight/2;
        let theta1 = Math.atan(-v1.y/Math.abs(v1.x));
        let k = x/H;
        
        let theta2 = sgn(v1.x)*(-k*Math.PI - 6*theta1)/8;        //-sgn(theta1)*((1-k)*Math.abs(theta1) + k*Math.PI/2);
        let tanTheta2 = Math.tan(theta2);
        
        ballVeloc.x = -sgn(v1.x) * Math.sqrt((square(v1.x) + square(v1.y))/(1 + square(tanTheta2)));
        ballVeloc.y = -tanTheta2 * ballVeloc.x;
    };
    
    
    // setup canvas
    let setupCanvas = function()
    {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = h/75;
        // draw top and bottom lines
        ctx.fillRect(h/50,h/50,w-h/25,h/50);
        ctx.fillRect(h/50,h*48/50,w-h/25,h/50);
        // draw dividing line
        ctx.beginPath();
        ctx.dashedLine(w/2,h*4/75,w/2,h*71/75,[h/75]);
        ctx.stroke();
    };
    setupCanvas();
    let tmp = document.createElement('img');
    tmp.onload = function()
    {
        canvasBackground = tmp;
    };
    tmp.src = canvas[0].toDataURL("image/png");

    
    // setup menus
    // note ratio of width to characters is same for all collumns
    let maxCharacters = 60; // most characters in any row
    let rows = 7;
    let testEl = $("#characterTest");
    let setupMenu = function(fontSize,lineHeight)
    {
        testEl.css(
        {
            'font-size': fontSize
        });
        let characterWidth = $("#characterTest").width();
        let widthNeeded = characterWidth*maxCharacters;
        let spaceAbove = h*(6+5*goldenRatio)/50;
        let maxHeight = (h-1.5*spaceAbove);
        if(widthNeeded >= w*4/5)
        {
            setupMenu(fontSize/2,lineHeight);
        }
        else
        {
            while(maxHeight < fontSize*lineHeight*rows)
            {
                if(lineHeight <= 1.2)
                {
                    setupMenu(fontSize/2,1.2);
                    return;
                }
                else
                {
                    lineHeight -= 0.2;
                }
            }
            $(".menu").css(
            {
                left: (w-widthNeeded)/2,
                top: spaceAbove,
                width: widthNeeded,
                'font-size': fontSize,
                'line-height': lineHeight
            });
            let pauseFont = Math.min(35/18*lineHeight*fontSize,fontSize*2);
            $(".large").css(
            {
                'font-size': pauseFont,
                'line-height': Math.min(lineHeight*7/3*fontSize/pauseFont,2)
            });
            $("#characterTest").remove();
        }
    };
    setupMenu(25,2);
    
    // for pause menu, 1/5th characters wide, 3/7ths rows high
    
    animate(controller => {
        controller.start();
        controller.on('animate', event => {    
            if(keys.running)
            {
                // move ball
                if(roundLost >= 0)
                {
                    roundLost -= 1/(event.fps*downTime);
                    if(roundLost < 0.5 && !posReset)
                    {
                        resetAll();
                        posReset = true;
                    }
                }
                else
                {
                    let accelarate = function(m)
                    {
                        ballVeloc[m] *= 1 + Math.abs(ballAcel/ballVeloc.x);                
                        ballCenter[m] += ballVeloc[m];                
                    };
                    accelarate('x');
                    accelarate('y');
                    // bounce ball off top/bottom
                    if((ballVeloc.y > 0                              // going down
                        &&
                        ballCenter.y + ballHeight/2 > h*24/25)         // below bottom
                            ||
                        (ballVeloc.y < 0                           // going up
                        &&
                        ballCenter.y - ballHeight/2 < h/25))         // above top
                        {
                            ballVeloc.y = -ballVeloc.y;
                        }
                    
                    // check paddles for ball hitting it
                    if(ballVeloc.x < 0)    // ball is going left
                    {
                        if(ballCenter.x <= (h/25+ballHeight/2))     // ball is to the left of the paddle
                        {
                            if(ballCenter.y + ballHeight/2 > paddleCenter[0].y - paddleHeight/2 &&
                                ballCenter.y - ballHeight/2 < paddleCenter[0].y + paddleHeight/2)
                            {
                                // bounce
                                bounce(0);
                                //ballVeloc.x = -ballVeloc.x;
                            }
                            else
                            {
                                // left loses, right gains 1 point
                                roundLost = 1;
                                posReset = false;
                                ballVeloc.dir = 1;
                                ++score[1];
                                checkScore();
                            }
                        }        
                    }
                    else                // ball is going right
                    {
                        if(ballCenter.x >= (w-h/25-ballHeight/2))     // ball is to the right of the paddle
                        {
                            if(ballCenter.y + ballHeight/2 > paddleCenter[1].y - paddleHeight/2 &&
                                ballCenter.y - ballHeight/2 < paddleCenter[1].y + paddleHeight/2)
                            {
                                // bounce
                                bounce(1);
                            }
                            else
                            {
                                // right loses, left gains 1 point
                                roundLost = 1;
                                posReset = false;
                                ballVeloc.dir = -1;
                                ++score[0];
                                checkScore();
                            }    
                        }
                    }
                    // move paddles
                    for(let i = 0; i < paddleCenter.length; ++i)
                    {
                        let dir, k, actualDirection, speed = speedConst;
                        if(cpu[i])
                        {
                            dir = (ballCenter.y < paddleCenter[i].y) ? -1 : 1;
                            let kV   = Math.abs(ballCenter.y - paddleCenter[i].y)/h;
                            let kH   = 1 - Math.abs(ballCenter.x - paddleCenter[i].x)/w;
                            k = kV*Math.sqrt(kH);
                            actualDirection = paddleSpeed[i];
                            speed *= 0.66;
                        }
                        else
                        {
                            dir = keys.direction[i];
                            k = 0.2;
                            actualDirection = dir;
                        }
                        if(actualDirection <= 0                                      // going up
                            &&
                            paddleCenter[i].y-paddleHeight/2 < h*2/50 + ballHeight*3/2)     // above top
                        {
                            paddleSpeed[i] = 0;
                            if(cpu[i])
                                paddleCenter[i].y = h*2/50 + ballHeight*3/2 + paddleHeight/2;            
                        }
                        else if(actualDirection >= 0                                       // going down
                                &&
                                paddleCenter[i].y+paddleHeight/2 > h*48/50 - ballHeight*3/2)     // below bottom
                        {
                            paddleSpeed[i] = 0;
                            if(cpu[i])
                                paddleCenter[i].y = h*48/50 - ballHeight*3/2 - paddleHeight/2;        
                        }
                        else
                        {
                            paddleSpeed[i] *= (1-k);
                            paddleSpeed[i] += (k)*dir;
                            paddleCenter[i].y += speed * paddleSpeed[i];
                        }
                        
                    }
                }
                
            }
                
            ctx.fillStyle = 'rgba(0,0,0,0.91)';
            ctx.fillRect(0,0,w,h);
            // draw stationary parts: centre and top/bottom lines
            if(canvasBackground)
            {
                ctx.drawImage(canvasBackground, 0, 0);
            }
            else
            {
                setupCanvas();
            }
            
            ctx.fillStyle = 'white';
            // draw paddles
            for(let i = 0; i < paddleCenter.length; ++i)
            {
                ctx.fillRect(paddleCenter[i].x-paddleWidth/2,paddleCenter[i].y-paddleHeight/2,paddleWidth,paddleHeight);
            }
            let numWidth = h*1/10;
            let numHeight = goldenRatio*numWidth;
            let lineWidth = h*1.5/150;
            // print score
            if(score[0] !== 10 && score[1] !== 10)
            {
                fillNumber(ctx,w*11/25-h*3/50,h*2/25,numWidth,numHeight,lineWidth,score[0]);
                fillNumber(ctx,w*14/25       ,h*2/25,numWidth,numHeight,lineWidth,score[1]);
            }
            else if(score[0] === 10)
            {
                fillNumber(ctx,w*11/25-h*3/50-numWidth*1.1,h*2/25,numWidth,numHeight,lineWidth,1);
                fillNumber(ctx,w*11/25-h*3/50         ,h*2/25,numWidth,numHeight,lineWidth,0);
                fillNumber(ctx,w*14/25                ,h*2/25,numWidth,numHeight,lineWidth,score[1]);
            }
            else if(score[1] === 10)
            {
                fillNumber(ctx,w*11/25-h*3/50  ,h*2/25,numWidth,numHeight,lineWidth,score[0]);
                fillNumber(ctx,w*14/25         ,h*2/25,numWidth,numHeight,lineWidth,1);
                fillNumber(ctx,w*14/25+numWidth*1.1,h*2/25,numWidth,numHeight,lineWidth,0);
            }
            // draw ball
            ctx.fillStyle = (roundLost > 0 && roundLost % 0.2 >= 0.1) ? 'red' : 'white';
            ctx.fillRect(ballCenter.x-ballHeight/2,ballCenter.y-ballHeight/2,ballHeight,ballHeight);
        });
    });
});