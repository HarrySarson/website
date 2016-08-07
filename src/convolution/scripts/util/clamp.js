module.exports = function clamp(value, lower, upper) {
    
    if( lower > upper )
        [lower, upper] = [upper, lower];
    
    return value > upper 
        ? upper
        : value < lower
            ? lower
            : value;
}