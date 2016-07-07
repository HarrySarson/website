'use strict';
const 
    _       = require('lodash'),
    eslint  = require('gulp-eslint'),
    gutil   = require('gulp-util'),
    merge   = require('merge-stream'),
    notify  = require('gulp-notify'),
    path    = require('path'),
    through = require('through2'),
    watch   = require('gulp-watch')
    ;


module.exports = function(gulp, name, config, sites, sync) {
    
    if(config == null)
        throw Error('Adding lint task to gulp: no configuration provided');
    
    ['src', 'site', 'browser'].forEach(prop => {
        if(!_.has(config, prop))
            throw Error('Adding lint task to gulp: property ' + prop + ' not provided in configuration');
    });
    
    gulp.task(name, function (cb) {
        
        let jsPaths = _.reduce(sites, (acc, siteConfig, sitePath) => {
            
            if(siteConfig.script && siteConfig.script.main)
            {
                acc.push(path.join(sitePath, 
                                   path.dirname(siteConfig.script.main),
                                   '**/*.js'
                                   ));
            }
            return acc;
        }, []);
        
        
        if(jsPaths.length === 0)
        {
            cb();
            return;
        }
        
        let errorFunc = error => {
            error = true;
            gutil.log(gutil.colors.red('Parsing ') + gutil.colors.blue(rel) + gutil.colors.red(' Failure'));
            return {
                title: "Error parsing scss",
                message: "<%= error.message %>"
            }
        };
        
        let lint = jsPaths.map(jsPath => function() {
                        
            let stream =
                gulp.src(jsPath, {base: config.src})
                .on('error', notify.onError(errorFunc))
                .pipe(through.obj(function(chunk, enc, cb) {
                   
                    let rel = path.join(config.src, path.relative(config.src, chunk.path));
                    
                    gutil.log('Linting ' + gutil.colors.green(rel) + '...');

                    cb(null, chunk);
                }))
                .pipe(eslint())
                .pipe(notify(function(file) {
                    
                    let rel = path.join(config.src, path.relative(config.src, file.path));
                    
                    let outcome = file.eslint.messages.length === 0 ? 'Success' : 'Failure';
                    
                    gutil.log('Linting ' + gutil.colors.green(rel) + ' ' + outcome);
            
                    return file.eslint.messages.length === 0 ? false : 
                    {
                        title: 'In file: ' + rel + ' (' + file.eslint.messages[0].line + ':' + 
                                file.eslint.messages[0].column + ')',
                        message: file.eslint.messages[0].message
                    };
                }));
                
            
            return stream;
        });
        
        if(config.watch)
            jsPaths
                .forEach((jsPath, i) => watch(jsPath, { ignoreInitial: true }, lint[i]));
                                 
        
        return _.reduce(lint, (merged, l) => merged.add(l()), merge());
        
    });
};  