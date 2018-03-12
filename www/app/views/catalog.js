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
           'change .search input' : 'search',
           'swipe main'         : 'handle_swipe', 
       },
       initialize:function(app){
          Base.Page.prototype.initialize.apply(this,arguments);          
          this.app = app;          
          this.products = new Product.ProductCollection([],app);          
          this.products.prepare_directory(this.app.dir);
          this.products.bind('refresh',_.bind(this.render,this));                    
          this.ready = this.products.load();           
          if (app.cart)this.set_order(app.cart);
        },        
        start:function(){
            var self  = this;
            this.ready.then(function(products){                
                self.app.get_product = function(product_id){
                    products = new Product.ProductCollection(products,this.app);            
                    return products.get(product_id);                    
                };
                self.render();
                self.show();
            });            
        },        
        set_order:function(cart){            
            this.cart = cart;         
            $('.cart .cart-num').html(cart.get_count());
            this.cart.bind('added',function(p){              
              $('.cart .cart-num').html(cart.get_count());
          });
        },        
        add_product:function(ev){            
            var card = $(event.target).closest('div.prod');                        
            var prod_id = card.data('id');            
            var product = this.products.get(prod_id);            
            var options = {qty:1};
            this.cart.add_product(product,options);            
        },
        save_cart:function(){
            this.cart.save();            
            //this.app.open_cart(this.cart.id);
        },
        select_categ:function(ev){
            var categ = $(ev.target).closest('.card.categ');
            var categ_id = categ.data('categ_id');            
            this.$el.find('.prod').hide();            
            this.$el.find('.prod[data-categ_id='+categ_id+']').show();
        },
        all_categ:function(){
            this.$el.find('.card.prod').show();
        },
        get_product:function(product_id){
            return this.products.find(product_id);
        },
        load_more:function(ev){
            var self = this;
            return this.products.fetch().done(
                    function(res){                        
                        self.products.save();
                        self.render();
                    });            
        },
        search:function(ev){
            console.log(this,ev,$(ev.currentTarget));
        },
        handle_swipe:function(ev){            
            var curTarget= $(ev.currentTarget);
            ev = ev.originalEvent;            
            if (ev.detail.dir == 'up' && curTarget.parent().scrollTop() > curTarget.height() ){                
                $('#loading').show()
                this.load_more().done(function(){$('#loading').hide()});
            }
        },
        
   });
   return CatalogView;
})