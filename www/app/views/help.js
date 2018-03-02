define(function(require){
   var Base     = require('models/base');       
   var tmpl     = require('text!templates/help.html');
   return Base.Page.extend({_name : 'help'});   
})