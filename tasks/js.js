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
    rename  = require('gulp-rename'),
    source  = require('vinyl-source-stream'),
    smaps   = require('gulp-sourcemaps'),
    uglify  = require('gulp-uglify'),   
    wtchify = require('watchify')
    ;
    
module.exports = function(gulp, name, config, sites, sync) {
    
    if(config == null)
        throw Error('Adding js task to gulp: no configuration provided');
    
    ['src', 'site', 'dest'].forEach(prop => {
        if(!_.has(config, prop))
            throw Error('Adding js task to gulp: property ' + prop + ' not provided in configuration');
    });
    
    gulp.task(name, function (cb) {
        
        // merge stream instance that will contain all streams      
        let merged = merge();
        
        let siteCount = 0;
        
        _.forOwn(sites, function(siteConfig, sitePath) {
            
            if(siteConfig.script && siteConfig.script.main)
            {
                if(siteConfig.script.output == null)
                {
                    gutil.log('Error: ' + 
                              gutil.colors.red('Site config file ' + 
                                               path.join(
                                                         config.src,
                                                         path.relative(config.src, sitePath),
                                                         config.browser
                                                         ) +
                                               ' does not define javascript output file')
                              ); 
                    gutil.log('Error: '.replace(/./g, ' ') + 
                              gutil.colors.red('Note property `script.output` must be defined')
                              );   
                }
                else
                {
                    ++siteCount;
                    let scriptPath = path.join(sitePath, siteConfig.script.main);
                    // check if the main js file to bundle actually exists
                    fs.stat(scriptPath, function(err, stat) {
                    
                        if(err != null)
                        {
                            gutil.log(gutil.colors.red("In 'js' task when looking for file to bundle: ") + err);                   
                        }
                        else
                        {
                            // relative file name of main entry script file
                            let rel = path.normalize(scriptPath);
                            let browserifyConfig = siteConfig.browserify || {};
                            
                            // add watchify to configs
                            _.assign(browserifyConfig, wtchify.args);
                            
                            
                            let b = brwsify(scriptPath, browserifyConfig);
                            
                            // watch files and re-bundle on change
                            if(config.watch)
                                b = wtchify(b);
                            
                            // exclude libary files from bundle as they will be bundled seperately
                            if(config.libary && config.libary.script)
                            {
                                b.external([config.libary.script.require]);
                            }
                            
                            let bundle = function(do_sync) {
                                gutil.log('Bundling ' + gutil.colors.blue(rel) + '...');
                                return b.bundle()
                                    .on('error', function() {
                                        
                                        gutil.log(gutil.colors.red('Bundling ') + gutil.colors.blue(rel) + gutil.colors.red(' Failure'));  
                                        // Send error to notification center with gulp-notify
                                        notify.onError({
                                            title: "Error Bundling Javascript",
                                            message: "<%= error.message %>"
                                        }).apply(this, arguments);


                                        // Keep gulp from hanging on this task
                                        this.emit('end');
                                    })
                                    .on('end', function(){
                                        
                                        gutil.log('Bundling ' + gutil.colors.blue(rel) + ' Complete');  
                                        if(do_sync && sync)
                                            sync.reload();
                                    })
                                    
                                    .pipe(source(scriptPath))
                                    .pipe(buffer()) // convert stream to form that plugins can work with
                                    
                                    .pipe(smaps.init({loadMaps: true}))
                                        .pipe(uglify())
                                        .pipe(rename(siteConfig.script.output))
                                    .pipe(smaps.write('./'))
                                    
                                    .pipe(
                                        gulp.dest(
                                            path.dirname(
                                                path.join(config.dest, path.relative(config.src, scriptPath))
                                                )
                                            )
                                        );
                            }
                            if(config.watch)
                            {
                                b.on('update',  function(){
                                    bundle(true);
                                });
                            }
                            merged.add(bundle());                        
                        }
                    });
                }
            } 
        });
        
        if(siteCount === 0)
            cb();
        
        return merged;
    });
}   