define(function(require){
   var Base     = require('models/base');       
   var tmpl     = require('text!templates/catalog.html');
   var CatalogView = Base.Page.extend({
       _name : 'catalog',
       events : {
           'click .card.categ'  : 'select_categ',           
           'click nav a.navbar-brand': 'all_categ',
           'click a.cart'       : 'save_cart',
           'click a.btn.add'    : 'add_product',
           'change #search_input' : 'search_product',
           'click .header label.btn' :'load_more'
       },
       initialize:function(app){
          Base.Page.prototype.initialize.apply(this,arguments);                    
          this.products = app.products;
          var self = this;          
          this.cart = app.cart;
          this.cart.bind('added',function(p){console.log(p);
              $('.cart .cart-num').html(self.cart.get_count());});          
          this.ready = $.when(this.products.load()).promise();          
          console.log(app,this._name);
//          console.trace();
        },        
        start:function(){
            var self  = this;            
            this.ready.then(function(){
//                console.trace();
                console.log(self._name,self);
                self.render();
                self.show();           
                console.log(self._name,self);
                //$('.cart .cart-num').html(self.cart.get_count());
                //self.products.bind('refresh',_.bind(self.render,self));          
                //setTimeout(_.bind(self.retry_images,self),100000);
            });            
        },        
        retry_images:function(){
            var imgs = $('.prod img[src="img/placeholder.png"]').toArray();            
            for (var img in imgs){               
                img= imgs[img];
                img.src = this.app.url + '/web/image/product.product/' + img.name + '/image';
            }            
        },                
        fetch:function(ev){
            this.products.sync();
        },
        add_product:function(ev){
            console.log(ev);
            var card = $(ev.currentTarget).closest('div.prod');                                    
            var prod_id = card.data('id');            
            var product = this.products.get(prod_id);
            console.log(this,card,product);
            var opt = {qty:1};
            this.cart.add_product(product,opt);            
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
        search_product:function(ev){
            var q = $('#search_input').val();
            if (q.length < 3 )return;
        },
        load_more:function(){
            this.products.load();
        }
        
   });
   return CatalogView;
})