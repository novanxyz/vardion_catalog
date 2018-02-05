define(['models/base','models/product','localstorage'],function(Base,Product,localstorage){
   var Orderline = Base.Model.extend({
       initialize:function(data,app){
           Base.Model.prototype.initialize.apply(this,arguments);           
           this.product = new Product.Product(app);           
       },       
        get_price:function(){
            return this.get('unit_price') * this.get('qty');
        },
        get_qty:function(){
            return 1;
        },
        get_display_name:function(){
            return this.product.get_name() + "\n" + this.get('name');
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
                this.orderlines.add({'product_id':product.id,qty:1,unit_price:product.get_price() });           
            }           
            this.trigger('added');
        },
        get_count:function(){
            return this.orderlines.length;
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
        load:function(){
           console.log(this);
        },
       get_name:function(){
            return 'SO#' + this.cid;
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
            return this.get('order_date').toDateString();
        }
       
   }) 
});