define(function(require){
   var Base     = require('models/base');             
   var tmpl     = require('text!templates/about.html');
   var AboutView = Base.Page.extend({_name : 'about'});
   return AboutView;
})