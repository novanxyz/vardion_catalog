requirejs.config({
	baseUrl: 'app',    
    //path mappings for module names not found directly under baseUrl
    paths: {
    	app:			'app',        
    	router:			'router',
    	utils:			'utils',
        jquery:     	'../lib/jquery/jquery-1.8.2.min',
        jqmconfig:		'../lib/jqm/jqm-config',        
        jqm:     		'../lib/jqm/jquery.mobile-1.2.0.min', 
        underscore: 	'../lib/underscore/underscore-1.4.1.min',
        backbone:   	'../lib/backbone/backbone-0.9.2.min',
        rpc:            '../lib/backbone/backbone.rpc',
        localstorage:   '../lib/backbone/backbone.localStorage.min',
        qweb:           '../lib/qweb/qweb2',
        text:       	'../lib/require/text-2.0.3.min',
        
        base:           'models/base',
        models:      	'models',
        collections:	'collections',
        views:			'views',
        templates:		'templates',
        catalogview:    'views/catalog'
        
    },
    shim: {
        underscore: {
          exports: "_"
        },
        backbone: {
            //These script dependencies should be loaded before loading
            //backbone.js
            deps: ['jquery', 'underscore'],
            //Once loaded, use the global 'Backbone' as the
            //module value.
            exports: 'Backbone'
        },
        qweb: {
            exports: 'qweb'
        },
        rpc: {
            deps:['backbone']
        },
//        localstorage: {
//            deps:['backbone']
//        },
//        jqmconfig: ['jquery'],
//        jqm: ['jquery','jqmconfig']
      }

});

require(['app','jquery'], function(App,$) {
//var App = require('app');
function onDeviceReady() {          
    var config = {'dbname': 'pos','server_url':'http://pos.vardion.com?db=pos'}   
    var catalog = new App(config);
    catalog.start();    
}

$(document).ready(function(){
    document.addEventListener("deviceready", onDeviceReady, false);
    
//    $('.navbar .navbar-brand').click(function(){
//            $('.page.cart').addClass('hide');
//            $('.page.catalogs').removeClass('hide');
//            $('.categs').removeClass('hide');
//            $('.prods').addClass('hide');
//    })
//    $(document).on('click','.card.categ',function(){
//            var cid = $(this).data('categ_id');
//            $('.categs').addClass('hide');
//            $('.prods').removeClass('hide');
//            $('.prods .prod').hide();
//            $('.prods .prod[data-categ_id='+cid+']').show();
//        })
//    $(document).on('click','.cart-toggle',function(){
//        $('.page.cart').removeClass('hide');
//        $('.page.catalogs').addClass('hide')
//    });
});

});