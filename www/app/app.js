define(function(require) {
    'use strict';
    var Backbone  = require('rpc');
    var Product = require('models/product');
    var CatalogView = require('views/catalog');
    var CartView = require('views/cart');    
    var AboutView = require('views/about');
    var HelpView = require('views/help');    
    var QWeb2 = require('qweb');
    var Utils = require('utils');
        
    var App = Backbone.Router.extend({
        _name:  'apps_catalog',
        qweb:   new QWeb2.Engine(),        
        routes: {
            ''          : 'default_action',
            '*actions'  : 'default_action',
            'cart'      : 'open_cart',
            'cart/:order_id' : 'open_cart',
            'catalog'   : 'open_catalog',
        },
        initialize:function(config){
          Backbone.Router.prototype.initialize.apply(this,arguments);          
          var url       =  new URL(config.server_url);          
          this.url      = url.origin;
          this.dbname   = 'dbname' in config ? config.dbname : url.searchParams.get('db');
          this.DB_ID    = this._name + '@' + this.dbname;          
          this.modules  = config.modules || [] ;
          this.ready    = this.ensure_db();          
          Utils.app     = this;
        },
        prepare:function(){
            var rets = [];                        
            this.cartView = new CartView(this);                  
            this.catalogView = new CatalogView(this);
            console.log(typeof(this.cartView),typeof(this.catalogView));
            console.log(this.cartView,this.catalogView);
            rets.push(this.catalogView.prepare());
            rets.push(this.cartView.prepare());
            return $.when.apply($, rets).promise();
        },
        default_action:function(params){
            return ;
        },
        open_cart:function(params){            
            this.cartView.start();
            console.log(typeof(this.cartView),typeof(this.catalogView))
            console.log(this.cartView,this.catalogView);
        },
        open_catalog:function(params){                  
            this.catalogView.set_order(this.cartView.cart);
            this.catalogView.start();
            console.log(typeof(this.cartView),typeof(this.catalogView));
            console.log(this.cartView,this.catalogView);
        },
        open_login:function(params){            
            $('nav').hide();
<<<<<<< HEAD
            $('#loading').hide();
=======
>>>>>>> 82aef15568cbec5851131f0a6364eaa5f4e95138
            $('#login').show();            
            $('#loginbutton').on('click',_.bind(this.do_login,this));
        },
        do_login:function(){
          var self = this;          
          var rpc = new Backbone.Rpc({url: this.url + '/web/session/authenticate'});
          var params = { db:this.dbname,
                         login:$('#username').val(),
                         password:$('#password').val() };
          this.show_loading();
          localStorage.clear();
          return rpc.call(params,null).then(function(res){                            
<<<<<<< HEAD
              self.ensure_db(res.result).done(_.bind(self.default_action,self));
=======
              self.ensure_db(res);
>>>>>>> 82aef15568cbec5851131f0a6364eaa5f4e95138
          });
        },
        open_about:function(){
            var about = new AboutView(this);
            about.start();
        },
        open_help:function(){
            var help = new HelpView(this);
            help.start();
        },
        start:function(){
            Backbone.history.start();            
            this.ready.done(_.bind(this.default_action,this));
            window.onhashchange = _.bind(this.do_route,this);            
        },
        do_route:function(ev){            
            var [hash,params]  = window.location.hash.split(/[\/&]/);                                    
            hash = 'open_' + hash.substr(1);
            
            if (hash in this)
                return _.result(this,hash);
            this.default_action(params);
        },
        ensure_db:function(context){            
            if (!context){
                context =  JSON.parse(localStorage[this.DB_ID + '_context'] || '{}' );                            
            }            
            if (_.isEmpty(context)|| context.error){
                this.default_action = _.bind(this.open_login,this);
                return $.Deferred().resolve();                
            }else{
                this.default_action = _.bind(this.open_catalog,this);
                localStorage[this.DB_ID + '_context'] = JSON.stringify(context);
                localStorage[this.DB_ID + '_session_id'] = context.session_id;
                return this.load_data(context);            
            }                        
        },        
        show_loading:function(){
          $('#loading').show();
        },
        hide_loading:function(){
          $('#loading').hide();  
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
                    {user:this.user, context:this.context, today:new Date()},
                    Utils 
                    );                        
            var deffile = $.Deferred();
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {                   
                fs.root.getDirectory(self.dbname,{create:true},function(appdir){                     
                    self.dir = appdir;    
                    self.data_dir = appdir.nativeURL;
//                    appdir.getFile('templates.xml' ,{create:false},
//                                    _.bind(self.load_templates,self),
//                                    _.bind(self.fetch_templates,self));
                    deffile.resolve(self);
                });
            });                     
            Utils.app = this;
            return $.when(deffile,this.prepare()).promise();
        },        
        load_templates:function(fileEntry){           
            var self = this;            
            var deffile = $.Deferred();            
            fileEntry.file(function (file) {                
                var reader = new FileReader();
                reader.onloadend = function() {                    
                    self.qweb.add_template(this.result);
                    deffile.resolve(self);
                };
                reader.readAsText(file);

            }, _.bind(this.fetch_templates,this));
                
//            var login_tmpl = require('text!templates/login.html');
//            var catalog_tmpl = require('text!templates/catalog.html');
//            var cart_tmpl = require('text!templates/cart.html');
//            console.log(login_tmpl,catalog_tmpl,cart_tmpl)
//            this.qweb.add_template(Utils.make_template('login',login_tmpl));
//            this.qweb.add_template(Utils.make_template('catalog',catalog_tmpl));
//            this.qweb.add_template(Utils.make_template('cart',cart_tmpl));
        },
        fetch_templates:function(fileEntry){
            var self = this;
            console.log(this,fileEntry);
            if (!this.modules.length) return;
            $.get(this.url + '/web/webclient/qweb?mods='+ this.modules.join(',') ).then(
                function(resp){                                     
                    self.dir.getFile('templates.xml',{create:true},function(fileEntry){
                        fileEntry.createWriter(function(fileWriter){                           
                            fileWriter.onwriteend = function() {
                                console.log("Successful file write..." , fileEntry,resp);
                                self.load_templates(fileEntry);
                            };                            
                            fileWriter.write(new Blob([new XMLSerializer().serializeToString(resp.documentElement)], { type:'text/xml'})); 
                        });
                    })
                });
            
        },
        get_rpc:function(url){                    
            var server_url = url ? this.url+ url : this.url + '/web/dataset/call';
            var rpc_opts = {url: server_url ,
                            exceptionHandler:_.bind(this.handle_exception,this) };
            if ( this.user ){ rpc_opts['session_id'] = this.user.session_id;}
            return new Backbone.Rpc(rpc_opts);        
        },
        handle_exception:function(err){
            alert(err.message);
            $('#loading').hide();
        },
        get_product:function(product_id){
            var products = JSON.parse(localStorage[this.DB_ID + '_products' ] || '[]');                                  
            products = new Product.ProductCollection(products.records,this);            
            return products.get(product_id);
        },
        
    });    
    return App;    
});

