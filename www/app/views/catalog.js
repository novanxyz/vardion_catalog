define(function(require){
   var Base     = require('models/base');       
   var Product  = require('models/product');   
   var Cart     = require('models/cart');   
   var tmpl     = require('text!templates/catalog.html');
   var Utils    = require('utils');
   //qweb.add_template(tmpl);   
   var CatalogView = Base.Page.extend({
       _name : 'catalog',
       events : {
           'click .card.categ'  : 'select_categ',           
           'click nav a.navbar-brand': 'all_categ',
//           'click .card.prods'  : 'fetch',           
           'click a.cart'       : 'save_cart',
           'click a.btn.add'    : 'add_product',           
       },
       initialize:function(app){
          Base.Page.prototype.initialize.apply(this,arguments);          
          this.app = app;
          this.app.qweb.add_template(Utils.make_template(this._name,tmpl) );
          this.products = new Product.ProductCollection([],app);
          this.products.prepare_directory(app.dir);
          this.products.bind('refresh',_.bind(this.render,this));          
          var self = this;
          this.ready = this.products.fetch({success: function(cols,resp,opts){
                        console.log(this,resp);
                        //cols.save(resp);
                        //self.ready.resolve(resp);
                    },error:function(cols,err,opts){
                        console.log(err);
                        //self.ready.reject(err);
                    }
                }); 
                
          this.cart = new Cart({},app);          
          this.cart.bind('added',function(p){              
              console.log(this);
              var cnt =  self.cart.get_count();
              $('.cart .cart-num').html(cnt);
          });
        },        
//        render:function(){
//            var nav = $('nav');            
//            console.log(this.ready, this.products.models,this.app.qweb);
//            this.$el.html(this.app.qweb.render(this._name,this));
//            this.$el.prepend(nav);
//            
//        },
        start:function(){
            //this.products.fetch(); 
            console.log(this.ready);
            
            this.render();
            this.show();
        },
        show:function(){
            //$('main').hide();
            this.$el.show();
        },
        fetch:function(ev){
            console.log(ev);
            this.products.sync();
        },
        add_product:function(ev){
            var card = $(ev.currentTarget).closest('div.prod');                        
            var prod_id = card.data('id');
            console.log(ev,card,prod_id,this.products);
            var product = this.products.get(prod_id);
            console.log(product);
            var options = {};
            this.cart.add_product(product,options);
            console.log(this.cart);
        },
        fix_image:function(ev){
            console.log(ev);
            $(ev.currentTarget).attr*('src','/img/placeholder.png');
        },
        save_cart:function(){
            this.cart.save();
            this.app.navigate('cart');
            return true;
        },
        select_categ:function(ev){
            var categ = $(ev.currentTarget).closest('.card.categ');
            var categ_id = categ.data('categ_id');
            console.log(categ,categ_id,ev);
            this.$el.find('.prod').hide();
            console.log(this.$el.find('.prod[data-categ_id='+categ_id+']'));
            this.$el.find('.prod[data-categ_id='+categ_id+']').show();
        },
        all_categ:function(){
            this.$el.find('.card.prod').show();
        },
        
   });
   return CatalogView;
})