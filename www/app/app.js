define(function(require) {
    'use strict';
    console.log(window,cordova,navigator);
//    var _ = require('underscore');    
//    var Backbone  = require('backbone');
    var Backbone  = require('rpc');
    var CatalogView = require('views/catalog');
    var CartView = require('views/cart');    
    var QWeb2 = require('qweb');
    var Utils = require('utils');
    console.log(CartView,CatalogView);
    var DB_ID = 'app-catalog@';    
    var App = Backbone.Router.extend({
        qweb:   new QWeb2.Engine(),        
        routes: {
            '': 'default_action',
            '*actions': 'default_action',
            'cart' : 'open_cart',
            'catalog' : 'open_catalog',
        },
        initialize:function(params){
          Backbone.Router.prototype.initialize.apply(this,arguments);          
          var url =  new URL(params.server_url);          
          this.url      = url.origin;
          this.dbname   = params.dbname;
          this.DB_ID    = DB_ID + this.dbname;
          this.data_dir = cordova.file.dataDirectory + this.dbname +'/';
          this.ensure_db();          
          
          Utils.app = this;
          //this.prepare().done(this.start);
        },
        prepare:function(){
            var rets = [];
            this.catalog = new CatalogView(this);
            this.cart = new CartView(this);
            rets.push(this.catalog.prepare());
            rets.push(this.cart.prepare());
            return $.when.apply($, rets).promise();
        },
        default_action:function(params){
            return ;
        },
        open_cart:function(params){
            console.log(params);
            var cart = new CartView(this);
            cart.start();
        },
        open_catalog:function(params){      
            console.log(params);
            var catalog =  new CatalogView(this);
            catalog.ready.then(_.bind(catalog.start,catalog)).fail(function(err){
                console.log(err);
            });
        },
        open_login:function(params){
            
            $('nav').hide();
            $('#login').show();            
            $('#loginbutton').click(_.bind(this.do_login,this));
        },        
        start:function(){
            Backbone.history.start();
            //Backbone.Router.prototype.start.apply(this,arguments);            
        },
        ensure_db:function(context){            
            if (!context){
                context =  JSON.parse(localStorage[this.DB_ID + '_context'] || '{}' );                            
            }            
            if (_.isEmpty(context)){
                this.default_action = _.bind(this.open_login,this);
            }else{
                this.default_action = _.bind(this.open_cart,this);
                localStorage[this.DB_ID + '_context'] = JSON.stringify(context);
            }            
            this.load_data(context).done(this.default_action);            
        },
        do_login:function(){
          var self = this;          
          var rpc = new Backbone.Rpc({url: this.url + '/web/session/authenticate'});
          var params =  {db:this.dbname,
                        login:$('#username').val(),password:$('#password').val()};
          this.show_loading();
          return rpc.query('call',params).then(function(res){
              console.log(this.xhr);
              self.ensure_db(res.result);
          });
        },
        show_loading:function(){
            
        },
        hide_loading:function(){
            
        },
        load_data:function(context){
          // load all data necessary for app;
          // like currency, language, templates, etc;
            var self = this;
            
            this.user = context;
            this.context = context.user_context;
            delete this.user.user_context;
            
            for (var cur in this.user.currencies){
                this.user.currency = this.user.currencies[cur];
                break;
            }
            delete this.user.currencies;            
            $.extend(this.qweb.default_dict,
                    this.user,
                    this.context,
                    {today:new Date()},
                    Utils,
                    );
            
            console.log(this.qweb);
            
            var rets = [ ];            
            var deffile = $.Deferred();
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {                   
                fs.root.getDirectory(self.dbname,{create:true},function(appdir){                     
                    self.dir = appdir;                
                    deffile.resolve(self);
                });
            });
            
            rets.push(deffile);
                
            return $.when.apply($, rets).promise();
        },        
        load_templates:function(){
//            var login_tmpl = require('text!templates/login.html');
//            var catalog_tmpl = require('text!templates/catalog.html');
//            var cart_tmpl = require('text!templates/cart.html');
//            console.log(login_tmpl,catalog_tmpl,cart_tmpl)
//            this.qweb.add_template(Utils.make_template('login',login_tmpl));
//            this.qweb.add_template(Utils.make_template('catalog',catalog_tmpl));
//            this.qweb.add_template(Utils.make_template('cart',cart_tmpl));
        },
    });    
    return App;    
});

