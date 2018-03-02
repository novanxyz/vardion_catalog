define(['models/base','models/product','localstorage'],function(Base,Product,localstorage){
   var Orderline = Base.Model.extend({
       defaults: {
           'qty': 1,
           'discount':0,
           'note': '',
       },
       initialize:function(data,product){
           console.log(data,product,arguments);
           this.product = product;
           this.app = product.app;
           arguments[0] = data;
           arguments[1] = this.app;
           Base.Model.prototype.initialize.apply(this,arguments);
       },       
        get_price:function(){
            return this.get('unit_price') * this.get('qty');
        },
        get_qty:function(){
            return this.get('qty');
        },
        get_display_name:function(){            
            return this.product.get_display_name() + this.get('note');
        },
        get_subtotal:function(){
            return this.get('qty')  * this.get('unit_price') * ((100-this.get('discount'))/100);
        },
        
   });
   var OrderlineCollection = Base.Collection.extend({
       model : Orderline,       
   });
   return Base.Model.extend({
        _name : 'sale.order',        
        initialize:function(json,app){
            Base.Model.prototype.initialize.apply(this,arguments);           
            this.orderlines = new OrderlineCollection([],app);    
            this.localStorage= new localstorage.LocalStorage(this.app.DB_ID + '_'+ this._name),            
            this.set('order_date',new Date());
        },       
        add_product:function(product,options){
            console.log(product,options);
            var line = this.orderlines.where({product_id:product.id});
            console.log(line);
            if (line.length){
                line = line[0];
                line.set('qty', line.get('qty') + 1);
            }else{
                this.orderlines.add( new Orderline( _.extend(options,{'product_id':product.id,unit_price:product.get_price() }), product ));           
            }           
            this.trigger('added');
        },
        get_count:function(){
            return this.orderlines.length;
        },
        parse:function(obj){
            if (!_.isObject(obj)){
                obj = this.localStorage.find(obj);
            }
            console.log(this,obj);
        },
        toJSON:function(){
          var orderlines = this.orderlines.toJSON();
          console.log(orderlines);
          return { 'id' : this.id,
                   'partner_id' : 1,
                   'date_order' : new Date(),
                   'order_line' : orderlines }  ;
        },
        save:function(){
            console.log('save',this.toJSON());
            Backbone.Model.prototype.save.apply(this,arguments);
        },
        get_name:function(){
            return 'SO#' + this.cid;
        },
        get_total_price:function(){
            return this.orderlines.reduce(function(p,c){
                console.log(p,c);
                return p + c.get_subtotal();
            },0);
        },
        get_partner:function(){
            if (this.partner){
                return this.partner.name + ' ('+ this.partner.phone + ')';
            }
            return 'No Partner selected';
        },
        get_order_date:function(){
            return this.get('order_date').toDateString();
        }
       
   }, {
        load:function(cart_id){
           console.log(this.toString(),cart_id);
           if (isNaN(cart_id)){               
               var cart = JSON.parse(localStorage[cart_id] || '{}');
               return cart;
           }
        },
   }) 
});