
module.exports = function keyboardInput($element, pause, resume, newGameStart)
{
    
    let key = {};
    
    
    key.direction = [0,0];
    key.running = false;
    key.newGame = true;
    
    console.log($element);
    $element.keydown(function(event)
    {
        let prev = true;
        switch(event.which)
        {
            case 38: key.direction[1] = -1; break; // Up       (right up)
            case 40: key.direction[1] = +1; break; // Down     (right down)
            case 87: key.direction[0] = -1; break; // W        (left up)
            case 83: key.direction[0] = +1; break; // S        (right down)
            default: prev = false;
        }
        if(prev)
            event.preventDefault();
        
        // P key restarts the game
        if (event.which === 80) 
        {
            if(key.running)
            {
                pause(key);
            }
            else
            {
                resume(key);
            }
        }
        // enter creates new game if on menu screen
        else if(event.which === 13 && key.newGame)
        {
            newGameStart();
        }
    
    }).keyup(function(event)
    {
        switch(event.which)
        {
            case 38: if(key.direction[1] === -1) key.direction[1] = 0; break;
            case 40: if(key.direction[1] === +1) key.direction[1] = 0; break;
            case 87: if(key.direction[0] === -1) key.direction[0] = 0; break;
            case 83: if(key.direction[0] === +1) key.direction[0] = 0; break;
        }  
    });
    return key;
}