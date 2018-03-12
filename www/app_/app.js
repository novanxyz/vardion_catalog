define(function(require) {
    'use strict';
//    console.log(window,cordova,navigator);
//    var _ = require('underscore');    
//    var Backbone  = require('backbone');
    var Backbone    = require('rpc');
    var CatalogView = require('views/catalog');
    var CartView    = require('views/cart');    
    var AboutView   = require('views/about');    
//    var Nav = require('views/nav');    
    var Product = require('models/product');    
    var Cart = require('models/cart');    
    var QWeb2 = require('qweb');
    var Utils = require('utils');
        
    var App = Backbone.Router.extend({
        _name : 'apps_catalog',
        module: 'apps_catalog',
        routes: {
            '': 'default_action',
            '*actions': 'default_action',
            'cart' : 'open_cart',
            'cart/:order_id' : 'open_cart',
            'catalog' : 'open_catalog',
            'about' : 'open_about'
        },
        initialize:function(params){
          Backbone.Router.prototype.initialize.apply(this,arguments);          
          var url =  new URL(params.server_url);          
          this.url      = url.origin;
          this.dbname   = 'dbname' in params ? params.dbname : url.searchParams.get('db');
          this.DB_ID    = this._name + '@' + this.dbname;          
          this.qweb     = new QWeb2.Engine(),
          Utils.app     = this;          
          this.ready    = this.ensure_db();                 
        },
        prepare:function(){
            var rets = [];                       
            this.cart = new Cart(null,this);
            this.products = new Product.ProductCollection([],this);
            this.catalogView = new CatalogView(this);
            this.cartView = new CartView(this);
            //rets.push(this.products.load());
            //rets.push(this.catalogView.ready);
            //rets.push(this.cartView.ready);            
//            console.log(rets,this);
            return $.when.apply($, rets).promise();
        },
        default_action:function(params){
            return ;
        },
        open_cart:function(params){            
//            console.log(params);
            var cartView = new CartView(this);
            this.cartView.start();
        },
        open_catalog:function(params){      
//            console.log("params",params);
            var catalogView =  new CatalogView(this);
            this.catalogView.start();
        },
        open_about:function(){
            var ab = new AboutView(this);
            ab.start();            
        },
        open_help:function(){
            var help = new HelpView(this);
            help.start();            
        },        
        open_login:function(params){                        
            $('#login').show();     
            $('#loading').hide();            
            $('#loginbutton').on('click',_.bind(this.do_login,this));
        },        
        start:function(){
            //Backbone.history.start();       
            var self = this;
//            window.onhashchange = this.do_route;            
            this.ready.done(_.bind(this.default_action,this));
        },
//        do_route:function(){
//            var hash = window.location.hash;
//            console.log(hash)
//            console.log(this.routes,this.route);
//        },
        ensure_db:function(context){            
            if (!context){
                context =  JSON.parse(localStorage[this.DB_ID + '_context'] || '{}' );
            }                        
            if (_.isEmpty(context) || context.error){
                this.default_action = _.bind(this.open_login,this);
                return $.Deferred().resolve();                
            }else{
                this.default_action = _.bind(this.open_cart,this);
                localStorage[this.DB_ID + '_context'] = JSON.stringify(context);
                localStorage[this.DB_ID + '_session_id'] = context.session_id;
                return this.load_data(context);//.done(_.bind(this.default_action,this));            
            }            
        },
        do_login:function(){
          var self = this;          
          var rpc = this.get_rpc('/web/session/authenticate');
          var params = { db:this.dbname,
                         login:$('#username').val(),
                         password:$('#password').val() };
          $('#loading').show();
          localStorage.clear();
          return rpc.call(params).then(function(res){
              if (res.error){self.handle_exception(res.error);}
              if (res.result) {self.ensure_db(res.result);}
          });          
        },        
        load_data:function(context){
            // load all data necessary for app;
            // like currency, language, templates, etc;
            $('#loading').show();
            var self = this;            
            this.user = context;
            this.context = context.user_context;
            delete this.user.user_context;
            
            for (var cur in this.user.currencies){
                this.user.currency = this.user.currencies[cur];
                break;
            }
            delete this.user.currencies;            
            _.extend(this.qweb.default_dict,
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
            return $.when(deffile,self.prepare()).promise();
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
        },
        fetch_templates:function(fileEntry){
            var self = this;            
            $.get(this.url + '/web/webclient/qweb?mods='+ this.module).then(
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
            alert(err.message + "\n" + err.data.message );
            $('#loading').hide();
        },
        get_partner:function(partner_id){
            return {id: 1, name:'Test'};
            
        },
        get_product:function(product_id){
            return this.products.get(product_id);
        }
    });    
    return App;    
});

