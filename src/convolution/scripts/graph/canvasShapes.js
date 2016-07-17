

  
/**
 * Draw an arrow from (`x1`, `y1`) to (`x2`, `y2`) with an arrow head at (`x2`, `y2`)
 * The length of the head is equal `headSize`
 * The angle between the two sides of the arrow is equal to `headAngle`
 *
 *
 * @param {CanvasRenderingContext2D} ctx Context to draw onto
 * @param {Number} x1 x coordinate of start of the arrow
 * @param {Number} y1 y coordinate of start of the arrow
 * @param {Number} x2 x coordinate of end of the arrow
 * @param {Number} y2 y coordinate of end of the arrow
 * @param {Number} headSize length of the arrow head
 * @param {Number} headAngle internal angle of head in radians 
 *
 * @returns exports
 */
exports.arrow = function(ctx, x1, y1, x2, y2, headSize, headAngle) {
    
    // (x3, y3) is point on the line where the arrow ends
    
    // (x4, y4) and (x5, y5) are the ends on the arrows on each side of arrow
    
    
    let relHead = headSize / Math.hypot((x2 - x1), (y2 - y1)),
    
        x3  = relHead * x1 + (1 - relHead) * x2,
        y3  = relHead * y1 + (1 - relHead) * y2,
        
        k   = Math.tan(headAngle/2),
        
        x4  = x3 - k * (y3 - y2),
        x5  = x3 + k * (y3 - y2),
        
        y4  = y3 + k * (x3 - x2),
        y5  = y3 - k * (x3 - x2);
    
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x4, y4);
    ctx.lineTo(x5, y5);
    ctx.lineTo(x2, y2);
    
    console.log(k);
    
    // NB last line finishes at (x2, y2)
    // so if the arrow is part of a path then the next line will start at
    // the tip of the arrow head
    
    
    return exports;
}