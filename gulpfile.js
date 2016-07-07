'use strict';

const
    _       = require('lodash'),
    b_sync  = require('browser-sync'),
    fs      = require('fs'),
    glob    = require('glob'),
    globby  = require('globby'),
    glob2b  = require('glob2base'),
    gulp    = require('gulp'),
    gutil   = require('gulp-util'),
    path    = require('path'),
    

    
    
    config = require('./config.json')
;

// check config defines required properties

if(config == null)
    throw Error('Gulp: no configuration provided, config.json file must be in same directory as gulp file');

['src', 'site', 'dest', 'browser'].forEach(prop => {
    if(!_.has(config, prop))
        throw Error('Ggulp: property ' + prop + ' not provided in configuration file');
});

const sites = (function() {
    
    let browserPaths = globby.sync(config.src + config.site + config.browser);
    
    
    let obj =  _.reduce(browserPaths, (acc, p) => {
        
        let jsonFile;
        
        try
        {
            jsonFile = fs.readFileSync(p);
            try
            {
                
                acc[path.dirname(p)] = JSON.parse(jsonFile);
            }
            catch(e)
            {
                gutil.log(gutil.colors.red('Error parsing JSON from configuration file: ') + gutil.colors.green(path.normalize(p)));            
                gutil.log(e + '');            
            }
        }
        catch(e)
        {
            gutil.log(gutil.colors.red('Error reading configuration file: ') + gutil.colors.green(path.normalize(p)));            
            gutil.log(e + '');      
throw e;            
        }
        return acc;
    }, {});    
    
    let len = Object.keys(obj).length;
    
    if(len > 0)
    {
        gutil.log(gutil.colors.cyan('Found ' + len + ' valid browser configuration file(s):'));
        _.forOwn(obj, function(conf, p) {
            gutil.log('\t' + gutil.colors.green(path.join(p, config.browser)) );
        });    
    }
    else 
    {
        gutil.log(gutil.colors.cyan('No valid browser configuration files found!'));
        return null;
    }
    return obj;    
})();

if(sites == null)
    gulp.task('default')
else
{

    const tasks = ['js', 'scss', 'img', 'html', 'lint', 'js_lib'];
    
    let sync = null;
    
    if(config.watch)
    {
    
        sync = b_sync.create();
        
        const startPath = config.site === '' ? null : glob2b(new glob.Glob(config.site));
        
        sync.init({
            server: config.dest,
            startPath: startPath
        })
    }
    tasks.forEach(function(taskName) {

        const task = require('./tasks/' + taskName + '.js');
        
        
        task(gulp, taskName, config, sites, sync);

    });
    
    
    gulp.task('default', tasks, function(cb) {
        gutil.log(gutil.colors.cyan('First build complete'));
        cb();
    });
}
















