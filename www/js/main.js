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
    window['app'] = catalog;
}

function initSwipe(){
    var touchCnt = 1, startElement = null,startTime = 0,tolerance=56,startPos ={},startTouch;
    function distance(p1,p2)  {
        return Math.round(Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2)));
     }
    function angle(p1,p2) {
        var d = Math.abs(p2.x - p1.x);
        return Math.round(Math.acos(d / Math.sqrt(Math.pow(d, 2) + Math.pow(p2.y - p1.y, 2))) * 57.3);
    }
    function direction(p1,p2){
      if ( Math.abs(p2.x - p1.x) < tolerance )  return p2.y < p1.y ? 'up':'down';
      if ( Math.abs(p2.y - p1.y) < tolerance)  return p2.x > p1.x ? 'right':'left';
      return 'diagonal';
    }
    
    document.addEventListener('touchstart',function(ev){
        //ev.preventDefault();
        //console.log('START:',ev);                
        startTouch = ev.touches[0];        
        startTime = ev.timeStamp;
        startElement = startTouch.target;
    },false);
    document.addEventListener('touchmove',function(ev){
        ev.preventDefault();
        //console.log(ev);
    },false);    
    document.addEventListener('touchend',function(ev){
        //ev.preventDefault();
        
        if ( ev.changedTouches.length ) {            
        var endTouch = ev.changedTouches[0];
        var endPos   = {x:endTouch.clientX,y:endTouch.clientY};
        var startPos = {x:startTouch.clientX,y:startTouch.clientY};
        var event = new CustomEvent('swipe', {'bubbles':true, 
                               detail: {'dir': direction(startPos,endPos),
                                        'delay': ev.timeStamp - startTime,
                                        'angle': angle(startPos,endPos),
                                        'distance': distance(endPos,startPos),
                                        'startElement': startElement,
                                        'startPos': startPos,
                                        'endPos' : endPos,
                                        'endTouch':endTouch,
                                        'startTouch':startTouch
                                }});
        }
        //console.log("END:",ev,event);
        document.dispatchEvent(event,{'bubbles':true});
        startElement.dispatchEvent(event);
    },false);        
}

$(document).ready(function(){
    document.addEventListener("deviceready", onDeviceReady, false);
    initSwipe();
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