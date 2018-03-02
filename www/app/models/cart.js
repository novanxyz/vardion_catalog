define(['models/base','models/product','localstorage','utils'],function(Base,Product,localstorage,Utils){
   var Orderline = Base.Model.extend({
       defaults: {'qty': 1,'discount':0,'note': '',},
       initialize:function(data,product){
           console.log(data,product,arguments);           
           if (product instanceof Product.Product ){               
                this.product = product;
                this.app = product.app;
           }else{
               console.log('from collections',product.collection,Utils);
               this.app = product.collection.app;
               this.product = this.app.get_product(data['product_id']);
           }
           
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
            this.partner = null;
            this.orderlines = new OrderlineCollection([],app);    
            this.localStorage= new localstorage.LocalStorage(this.app.DB_ID + '_'+ this._name),            
            this.set('date_order',new Date());
            this.set('user_id',app.user.uid);
            if ( !_.isEmpty(json) ){                            
                this.fromJSON(json);
            }
            console.log("==================INIINI=================",this);
        },       
        add_product:function(product,options){            
            var line = this.orderlines.where({product_id:product.id});            
            if (line.length){
                line = line[0];
                line.set('qty', line.get('qty') + (options['qty'] || 1));
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
        fromJSON:function(json){            
            json.date_order = new Date(json.date_order);
            if (json.order_line){
                this.orderlines.reset(json.order_line);
                delete json.order_line;
            }
            
            if (json.partner_id && _.isArray(json.partner_id)){
                this.partner = _.object(['id','name'],json.partner_id);
                json.partner_id = json.partner_id[0];
            }
            this.set(json);
            console.log(this,json);
        },
        toJSON:function(){
          var orderlines = this.orderlines.toJSON();
          console.log(orderlines);
          return  _.extend(Backbone.Model.prototype.toJSON.apply(this,arguments), 
                    { 'partner_id' : this.partner ? this.partner.id : 1,
                      'order_line' : orderlines 
                   } ) ;
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
            return this.get('date_order').toDateString();
        }
       
   }, {
        load:function(cart_id){   
           if (isNaN(cart_id)){               
               var cart = JSON.parse(localStorage[cart_id] || '{}');   
               return cart;
           }
        },
   }) 
});