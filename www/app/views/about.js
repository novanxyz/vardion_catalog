define(function(require){
  var Base     = require('models/base');             
  var Utils    = require('utils');             
  var tmpl     = require('text!templates/about.html');
  var AboutView = Base.Page.extend({
    _name : 'about',
    scan_license:function(){
        var project= prompt("Enter your Vardion Project Id");        
        if (!project) {
            return Utils.toast('To use this app on production mode, you need to set up licensed Vardion server');
        }
        project = project.trim();
        if (project){
            console.log('downloading license for project:', project);
        }
    },
   
    
    });
   return AboutView;
})