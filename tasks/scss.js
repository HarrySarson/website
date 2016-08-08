'use strict';
const 
    _       = require('lodash'),
    notify  = require('gulp-notify'),
    gutil   = require('gulp-util'),
    clean   = require('gulp-clean-css'),
    merge   = require('merge-stream'),
    path    = require('path'),
    prefix  = require('gulp-autoprefixer'),
    rename  = require('gulp-rename'),
    sass    = require('gulp-sass'),
    smaps   = require('gulp-sourcemaps'),
    watch   = require('gulp-watch')
    ;


module.exports = function(gulp, name, config, sites, sync) {
    
    if(config == null)
        throw Error('Adding scss task to gulp: no configuration provided');
    
    ['src', 'dest', 'browser'].forEach(prop => {
        if(!_.has(config, prop))
            throw Error('Adding scss task to gulp: property ' + prop + ' not provided in configuration');
    });
    
    gulp.task(name, function (cb) {
        
        let stylePaths = _.reduce(sites, (acc, siteConfig, sitePath) => {
            
            if(siteConfig.style && siteConfig.style.main)
            {
                if(siteConfig.style.output == null)
                {
                    gutil.log('Error: ' + 
                                  gutil.colors.red('Site config file ' + 
                                                   path.join(
                                                             config.src,
                                                             path.relative(config.src, sitePath),
                                                             config.browser
                                                             ) +
                                                   ' does not define scss output file')
                                  ); 
                        gutil.log('Error: '.replace(/./g, ' ') + 
                                  gutil.colors.red('Note property `style.output` must be defined')
                                  );  
                }
                acc.push({site: sitePath, main: siteConfig.style.main, output: siteConfig.style.output});            
            }               
                
            return acc;
            
        },[]);
        
        if(stylePaths.length === 0)
        {
            cb();
            return;
        }
        
        
        let getFilePath = stylePath => path.join(stylePath.site, stylePath.main);
        
        let errorFunc = error => {
            error = true;
            gutil.log(gutil.colors.red('Parsing ') + gutil.colors.blue(rel) + gutil.colors.red(' Failure'));
            return {
                title: "Error parsing scss",
                message: "<%= error.message %>"
            }
        };
        
        let firstRun = true;
        
        let parse = stylePaths.map(stylePath => function() {
            let error = false,
                filePath = getFilePath(stylePath),
                rel = path.normalize(filePath);
            
            gutil.log('Parsing ' + gutil.colors.green(rel) + '...');
            
            let stream =
                gulp.src(filePath, {base: config.src})
                .on('error', notify.onError(errorFunc))
                .on('end', function(){
                    if(error === false)
                        gutil.log('Parsing ' + gutil.colors.green(rel) + ' Complete');
                })
                .pipe(smaps.init())
                    .pipe(sass().on('error', notify.onError(errorFunc)))
                    .pipe(prefix())
                    .pipe(clean())
                    .pipe(rename({
                        basename: path.basename(stylePath.output, path.extname(stylePath.output)),
                        ext: path.extname(stylePath.output)
                    }))
                .pipe(smaps.write())
                .pipe(gulp.dest(config.dest));
                
            if( config.watch && sync != null && !firstRun )
                stream.pipe(sync.stream())
            
            return stream;
        });
        
        if( config.watch )
            stylePaths
                .forEach((stylePath, i) => watch(path.join(path.dirname(getFilePath(stylePath)), 
                                                           '**/*.{scss,sass,css}'
                                                           ),
                                                 { ignoreInitial: true }, 
                                                 parse[i]
                                                 ));
                                       
        let stream = _.reduce(parse, (merged, p) => merged.add(p()), merge());
        
        stream.on('end', function() {
            firstRun = false;
        });
        
        return stream;
    });
};  