define(function(require){
   var Base     = require('models/base');       
   var tmpl     = require('text!templates/about.html');
   var Utils    = require('utils');
   //qweb.add_template(tmpl);   
   var AboutView = Base.Page.extend({
        _name : 'about'
    });
   return AboutView;
})