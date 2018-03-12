define(['models/base','models/product','localstorage'],function(Base,Product,localstorage){
   var Orderline = Base.Model.extend({
       initialize:function(data,product){                      
           console.log(arguments);           
           Base.Model.prototype.initialize.apply(this,arguments);                      
           if (product.app){
               this.product = product;
               this.app = product.app;
           }else{
               this.app = this.collection.app;
           }
           if(!_.isEmpty(data))this.parse(data);
       },       
        get_price:function(){
            return this.get('unit_price') * this.get('qty');
        },
        get_qty:function(){
            return 1;
        },
        get_display_name:function(){            
            return this.product.get_display_name() +  ( this.get('name') || '' );
        },
//        toJSON:function(){
//           var json = Backbone.Model.prototype.toJSON.call(this);
//           //console.log(json);
//           return json;
//        }
        parse:function(json){            
            if (!this.product){                
                this.product = this.app.products.get(json.product_id);                
            }
            return json;
        }
        
   });
   var OrderlineCollection = Base.Collection.extend({
       model : Orderline,       
   });
   return Base.Model.extend({
        _name : 'sale.order',        
        initialize:function(json,app){
            Base.Model.prototype.initialize.apply(this,arguments);            
            this.orderlines = new OrderlineCollection([],app);    
            this.localStorage = new localstorage.LocalStorage(this.app.DB_ID + '_'+ this._name);
            if (json) this.parse(json);            
        },       
        add_product:function(product,options){
            var line = this.orderlines.where({product_id:product.id});            
            if (line.length){
                line = line[0];
                line.set('qty', line.get('qty') + options.qty );
            }else{
                this.orderlines.add( new Orderline( _.extend(options,{'product_id':product.id,unit_price:product.get_price() }), product ));           
            }           
            this.trigger('added');
        },
        get_count:function(){
            return this.orderlines.length;
        },
        toJSON:function(){
          var orderlines = this.orderlines.toJSON();
          var json = Backbone.Model.prototype.toJSON.call(this);
          return { 'id' : this.id,
                   'partner_id' : 1,
                   'date_order' : new Date(),
                   'order_line' : orderlines }  ;
        },
        save:function(){
            Backbone.Model.prototype.save.apply(this,arguments);
        },
        parse:function(cart_id){            
            var data = {'order_date': new Date()};           
        
           if (_.isObject(cart_id) && !_.isEmpty(cart_id)){
              data = cart_id;
           }else {
                if (!cart_id || _.isEmpty(cart_id) ){
                    var name = this.app.DB_ID + '_' + this._name;               
                    cart_id = localStorage[name];
                }
                if (cart_id){
                    cart_id = cart_id.split(',')[0];
                    var name = this.app.DB_ID + '_' + this._name + '-'+ cart_id;               
                    data = JSON.parse(localStorage[name]) ;
                }
           }
           this.orderlines.reset(data.order_line);           
           delete data.order_line;
           data['date_order'] = new Date(data['date_order']);
           this.set(data);                      
           if (data.partner_id) this.partner  = this.app.get_partner(data.partner_id);
        },
        get_name:function(){
             return 'SO#' ;//+ this.get('id').substr(-4);
         },
         get_total_price:function(){
             return 1000000;

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
       
   }) 
});