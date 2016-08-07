'use strict';

/**
 * Solves the matrix equation A*y = x to find y.
 * `A` is a n x n matrix and `x` is vector containing n values
 *
 *
 * @static
 * @memberOf Iterator
 * @since 0.1.0
 * @param {Array} A An array containing n nested arrays each of length n that make up the rows of the matrix
 * @param {Array} x An array of length n
 *
 * @returns {Array} An 
 * @example
 *
 * for(let coor of Iterator.map([0,1,2,3,4,5], x => ({ x, y: Math.exp(x)))) {
 *   context.lineTo(coor.x, coor.y);
 * }
 * 
 * let mySet = new Set().add(1).add('a').add(NaN)
 *
 * [...Iterator.map(mySet, value => value + 1)]
 * // [2, 'a1', NaN]
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // The `_.property` iteratee shorthand.
 * [...Iterator.map(users, 'user');
 * // => ['barney', 'fred']
 *
 */
module.exports = function gauss(A, x) {
    let n = A.length;

    for (let i = 0; i < n; i++) 
    {
        
        // Search for maximum in this column
        // all values in the row with index less than i are zero
        let maxEl = Math.abs(A[i][i]),
            maxRow = i;
        
        for(let k = i + 1; k < n; k++) 
        {
            if( Math.abs(A[k][i]) > maxEl ) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        // Swap maximum row with current row (column by column)
        for(let k = i; k < n; k++) 
        {
            let tmp         = A[maxRow][k];
            A[maxRow][k]    = A[i][k];
            A[i][k]         = tmp;
        }
        // also swap values in x
        let tmp     = x[maxRow];
        x[maxRow]   = x[i];
        x[i]        = tmp;
        

        // Make all rows below this one 0 in current column
        for(let k = i + 1; k < n; k++) 
        {
            let c = A[k][i] / A[i][i];
            
            // set A[k][i] to zero
            A[k][i] = 0;
            
            // remaining elements in current row
            for(let j = i + 1; j < n; j++) 
            {
                A[k][j] -= c * A[i][j];
            }
            // in x
            x[k] -= c * x[i];
        }
    }
    
    
    // Solve equation A*x = b for an upper triangular matrix A
    var y = new Array(n);
    for(let i = n - 1; i >= 0; i--) 
    {
        y[i] = x[i] / A[i][i];
        for(let k = i - 1; k >= 0; k--) 
        {
            x[k] -= A[k][i] * y[i];
        }
    }
    return y;
}

let lodash = require('lodash');

module.exports.n = 5;
module.exports.A = () => lodash.times(module.exports.n, i => lodash.times(module.exports.n, i => Math.round((0.5-Math.random()) * 200)));
module.exports.x = () => lodash.times(module.exports.n, i => Math.round((0.5-Math.random()) * 200));