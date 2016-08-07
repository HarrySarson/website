'use strict';

const 
    _       = require('lodash'),
    brwsify = require('browserify'),
    buffer  = require('vinyl-buffer'),
    fs      = require('fs'),
    gutil   = require('gulp-util'),
    merge   = require('merge-stream'),
    notify  = require('gulp-notify'),
    path    = require('path'),
    resolve = require('resolve'),
    source  = require('vinyl-source-stream'),
    smaps   = require('gulp-sourcemaps'),
    uglify  = require('gulp-uglify')
    ;
    
module.exports = function(gulp, name, config, sites, sync) {
    
    if(config == null)
        throw Error('Adding js_lib task to gulp: no configuration provided');
    
    ['src'].forEach(prop => {
        if(!_.has(config, prop))
            throw Error('Adding js_lib task to gulp: property ' + prop + ' not provided in configuration');
    });
    
    gulp.task(name, function (cb) {
        
        if(config.libary && config.libary.script)
        {
            let opts = config.libary.script;
            
            if(!_.isArray(opts.require))
            {
                gutil.log('Error: ' + 
                          gutil.colors.red('Main config file does not define libary script require files')
                          ); 
                gutil.log('Error: '.replace(/./g, ' ') + 
                          gutil.colors.red('Note property `libary.script.require` must be an array of files to include in libary')
                          );
                cb();
                return;
            }    
            if(opts.output == null)
            {
                gutil.log('Error: ' + 
                          gutil.colors.red('Main config file does not define libary script output file')
                          ); 
                gutil.log('Error: '.replace(/./g, ' ') + 
                          gutil.colors.red('Note property `libary.script.output` must be defined')
                          );
                cb();
                return;
            }       
            
            let browserifyConfig    = config.libary.browserify || {},
                outputFile          = config.libary;
                
            _.assign(browserifyConfig, { debug: config.watch });
               
            let b = brwsify(browserifyConfig);
            
            opts.require.forEach(function(id) {
                b.require(resolve.sync(id), { expose: id });
            });
            
            
            gutil.log('Bundling libary ' + gutil.colors.blue(opts.output) + '...');
            
            
            let stream = b.bundle()
                .on('error', notify.onError({
                    title: "Error Bundling Libary",
                    message: "<%= error.message %>"
                }))
                .on('end', function(){
                    gutil.log('Bundling libary ' + gutil.colors.blue(opts.output) + ' Complete'); 
                })  
                
                .pipe(source(opts.output))
                .pipe(buffer()); // convert stream to form that plugins can work with
            
            if( config.debug )
                stream
                    .pipe(smaps.init({loadMaps: true}))
                        .pipe(uglify())
                    .pipe(smaps.write())
                
            stream
                .pipe(gulp.dest(config.dest));
                
            return stream;
        }
    });
}   