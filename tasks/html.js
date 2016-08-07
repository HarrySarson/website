'use strict';
const 
    _       = require('lodash'),
    inject  = require('gulp-inject-string'),
    gutil   = require('gulp-util'),
    watch   = require('gulp-watch'),
    merge   = require('merge-stream'),
    path    = require('path'),
    through = require('through2')
    ;


module.exports = function(gulp, name, config, sites, sync) {
    
    if(config == null)
        throw Error('Adding img task to gulp: no configuration provided');
    
    ['src', 'dest'].forEach(prop => {
        if(!_.has(config, prop))
            throw Error('Adding img task to gulp: property ' + prop + ' not provided in configuration');
    });
    
    gulp.task(name, function (cb) {
        
        let siteDetails = _.reduce(sites, (acc, siteConfig, sitePath) => {
            
            if(siteConfig.page == null)
            {
                gutil.log('Error: ' + 
                          gutil.colors.red('Site config file ' + 
                                           path.join(
                                                     config.src,
                                                     path.relative(config.src, sitePath),
                                                     config.browser
                                                     ) +
                                           ' does not define the html file for this site')
                          ); 
                gutil.log('Error: '.replace(/./g, ' ') + 
                          gutil.colors.red('Note property `page` must be defined')
                          );   
            }
            else
            {
                let obj = {
                    htmlPath: path.join(sitePath, siteConfig.page),
                    
                    script: '',
                    
                    style: ''
                }
                
                let addTag = function(type, loc, tag) { 
                    if(! (siteConfig[type] && siteConfig[type][loc]) )
                        return;
                    
                    obj[type] += tag + '\n';
                    
                }
                
                
                // create script tag strings to be added
                // NB libary tags go first
                
                if( siteConfig.script )
                {
                    addTag('script', 'lib',  '<script src="' + 
                                              '/' + 
                                              siteConfig.script.lib + 
                                              '"></script>');
                    addTag('script', 'main', '<script src="' + 
                                             path.posix.join(path.posix.dirname(siteConfig.script.main),
                                                             siteConfig.script.output) + 
                                             '"></script>');
                }
                
                if( siteConfig.style )
                {
                
                    addTag('style',  'lib',  '<link rel="stylesheet" type="text/css" href="' + 
                                             '/' + 
                                              siteConfig.style.lib + 
                                             '"/>');
                    addTag('style',  'main', '<link rel="stylesheet" type="text/css" href="' + 
                                             path.posix.join(path.posix.dirname(siteConfig.style.main),
                                                             siteConfig.style.output) + 
                                             '"/>');
                                             
                }
                
                acc.push(obj);
                
            }
            
            return acc;
            
        },[]);
        
        
        if(siteDetails.length === 0)
        {
            cb();
            return;
        }
        
        let parse = siteDetails.map(detail => function() {
            let error = false,
                filePath = detail.htmlPath,
                rel = path.normalize(filePath);
            
            
            let stream =
                gulp.src(filePath, {base: config.src})
                .on('error', function(err) {
                    error = err;
                    
                    gutil.log(gutil.colors.red('Parsing ') + gutil.colors.blue(rel) + gutil.colors.red(' Failure'));
                })
                .pipe(through.obj(function(chunk, enc, cb) {
                   
                    let rel = path.join(config.src, path.relative(config.src, chunk.path));
                    
                    gutil.log('Parsing ' + gutil.colors.green(rel) + '...');

                    cb(null, chunk);
                }))
                
                .pipe(inject.before('</head>', detail.style))
                
                .pipe(inject.before('</body>', detail.script))
                
                
                .pipe(through.obj(function(chunk, enc, cb) {
                    let rel = path.join(config.src, path.relative(config.src, chunk.path));
                    
                    if(error === false)
                        gutil.log('Parsing ' + gutil.colors.green(rel) + ' Complete')
                    
                    cb(null, chunk);
                }))
                
                .pipe(gulp.dest(config.dest));
            
            return stream;
        });
        
        if(config.watch)
            siteDetails
                .forEach((detail, i) => watch(detail.htmlPath,
                                                 { ignoreInitial: true }, 
                                                 function() { parse[i](); sync.reload(); }
                                                 ));
                                 
        
        return _.reduce(parse, (merged, p) => merged.add(p()), merge());
        
    });
};        