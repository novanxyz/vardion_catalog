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
           'click a.cart'       : 'save_cart',
           'click a.btn.add'    : 'add_product',           
       },
       initialize:function(app){
          Base.Page.prototype.initialize.apply(this,arguments);          
          this.app = app;
          this.app.qweb.add_template(Utils.make_template(this._name,tmpl) );
          this.products = new Product.ProductCollection([],app);

          this.products.prepare_directory(this.app.dir);
          this.products.bind('refresh',_.bind(this.render,this));          
          var self = this;
          this.ready = this.products.load();           
          this.cart = new Cart({},app);          
          this.cart.bind('added',function(p){                            
              var cnt =  self.cart.get_count();
              $('.cart .cart-num').html(cnt);
          });
        },        
        start:function(){
            var self  = this;
            this.ready.then(function(){
                self.render();
                self.show();
            });
            
        },
        show:function(){
            this.$el.show();
        },
        fetch:function(ev){
            this.products.sync();
        },
        add_product:function(ev){
            var card = $(ev.currentTarget).closest('div.prod');                        
            var prod_id = card.data('id');            
            var product = this.products.get(prod_id);            
            var options = {qty:1};
            this.cart.add_product(product,options);            
        },
        save_cart:function(){
            this.cart.save();            
            this.app.open_cart(this.cart.id);
        },
        select_categ:function(ev){
            var categ = $(ev.currentTarget).closest('.card.categ');
            var categ_id = categ.data('categ_id');            
            this.$el.find('.prod').hide();            
            this.$el.find('.prod[data-categ_id='+categ_id+']').show();
        },
        all_categ:function(){
            this.$el.find('.card.prod').show();
        },
        
   });
   return CatalogView;
})