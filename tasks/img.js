'use strict';
const 
    _       = require('lodash'),
    gutil   = require('gulp-util'),
    img_min = require('gulp-imagemin'),
    merge   = require('merge-stream'),
    notify  = require('gulp-notify'),
    path    = require('path'),
    through = require('through2'),
    watch   = require('gulp-watch')
    ;


module.exports = function(gulp, name, config, sites, sync) {
    
    if(config == null)
        throw Error('Adding img task to gulp: no configuration provided');
    
    ['src', 'dest'].forEach(prop => {
        if(!_.has(config, prop))
            throw Error('Adding img task to gulp: property ' + prop + ' not provided in configuration');
    });
    
    gulp.task(name, function (cb) {
        
        let imgPaths = _.reduce(sites, (acc, siteConfig, sitePath) => {
            
            if(siteConfig.images)
            {
                acc.push(path.join(sitePath, siteConfig.images));        
            }               
                
            return acc;
            
        },[]);
        
        if(imgPaths.length === 0)
        {
            cb();
            return;
        }
        
        
        let compress = imgPaths.map(imgPath => function() {
            let error = false;
            let stream =
                gulp.src(imgPath, {base: config.src})
                .on('error', function(err) {
                    error = err;
                    
                    gutil.log(gutil.colors.red('Compressing images ') + gutil.colors.blue(imgPath) + gutil.colors.red(' Failure'));
                })
                .pipe(through.obj(function(chunk, enc, cb) {
                   
                    let rel = path.join(config.src, path.relative(config.src, chunk.path));
                    
                    gutil.log('Compressing images ' + gutil.colors.green(rel) + '...');

                    cb(null, chunk);
                }))
                .pipe(img_min())
                .pipe(through.obj(function(chunk, enc, cb) {
                    let rel = path.join(config.src, path.relative(config.src, chunk.path));
                    
                    if(error === false)
                        gutil.log('Compressing images ' + gutil.colors.green(rel) +  ' Complete');
                    
                    cb(null, chunk);
                }))
                .pipe(gulp.dest(config.dest));
                
            
            return stream;
        });
        
        if(config.watch)
            imgPaths
                .forEach((imgPath, i) => watch(imgPath, { ignoreInitial: true }, function() { compress[i](); sync.reload(); }));
                                 
        
        return _.reduce(compress, (merged, c) => merged.add(c()), merge());
        
    });
};        