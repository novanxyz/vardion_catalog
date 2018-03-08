define(['models/base','models/product','localstorage','utils'],function(Base,Product,localstorage,Utils){
   var Orderline = Base.Model.extend({
       defaults: Utils.get_defaults('sale.order.line'),
       initialize:function(data,options){   
           console.log(options,arguments);
           console.trace();
           
           this.product = options.product;
           this.order   = options.order;
           this.app     = options.order.app;
           
           arguments[0] = data;
           arguments[1] = this.app;
           Base.Model.prototype.initialize.apply(this,arguments);
        },               
        get_price:function(){
            return this.get('price_unit') * this.get('qty');
        },
        get_qty:function(){
            return this.get('qty');// + '' + this.product.get('uom_id')[1];
        },
        get_display_name:function(){            
            return this.product.get_display_name() + this.get('note');
        },
        get_subtotal:function(){
            return this.get('qty')  * this.get('price_unit') * ((100-this.get('discount'))/100);
        },
        toJSON:function(to_server){
            return _.extend(Backbone.Model.prototype.toJSON.apply(this,arguments), {
                'name' : this.get_display_name(),                
                'product_uom_qty':this.get('qty'),
                'product_uom': this.product.get('uom_id')[0],
            })
            
        },
        
   });
   var OrderlineCollection = Base.Collection.extend({
       model : Orderline,       
   });
   return Base.Model.extend({
        _name : 'sale.order',        
        _model: 'sale.order',        
        initialize:function(json,app){
            Base.Model.prototype.initialize.apply(this,arguments); 
            this.partner = null;
            this.orderlines = new OrderlineCollection([],app);    
            this.localStorage= new localstorage.LocalStorage(this.app.DB_ID + '_'+ this._name);                        
            
            if ( !json || _.isEmpty(json) ){                                                                        
                var ids = localStorage[this.localStorage.name];                        
                if (ids){
                    json = JSON.parse(localStorage[this.localStorage.name + '-' + ids.split(',')[0] ]);
                }else {
                    json = {'user_id':this.app.user.id};
                }                                
            }                                    
            console.log(json,_.isEmpty(json),localStorage[this.localStorage.name]);
            json = _.extend(Utils.get_defaults(this._model),json);
            this.fromJSON(json);
            this.save();
        },       
        add_product:function(product,options){            
            var line = this.orderlines.where({product_id:product.id});            
            if (line.length){
                line = line[0];
                line.set('qty', line.get('qty') + (options['qty'] || 1));
            }else{
                this.orderlines.add( new Orderline( 
                        _.extend(options,{'product_id':product.id,price_unit:product.get_price() }), 
                        product ));           
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
            //console.log(this,obj);
            return obj;
        },
        fromJSON:function(json){            
            json.date_order =  json.date_order ? new Date(json.date_order) : new Date();            
            if (json.order_line){
                var order_lines=[];
                for (var l in json.order_line) {
                    var line = json.order_line[l];
                    var product = this.app.get_product(line['product_id']);
                    order_lines.push(new Orderline(line,{'order':this,'product':product}));
                }
                delete json.order_line;
                this.orderlines.reset(order_lines);                                
            }            
            if (json.partner_id && _.isArray(json.partner_id)){
                this.partner = _.object(['id','name'],json.partner_id);
                json.partner_id = json.partner_id[0];
            }
            this.set(json);
            //console.log(this,json);
        },
        toJSON:function(to_server){
            var orderlines = this.orderlines.toJSON();                    
            var order = _.extend(Backbone.Model.prototype.toJSON.apply(this,arguments), 
                    { 'partner_id' : this.partner ? this.partner.id : 1,
                      'order_line' : orderlines,                      
                   } ) ;
            //console.log(orderlines);
            if (to_server){
                order['order_line'] = [];
                _(orderlines).each(function(line){
                    var cmd = line.id ? 1 : 0 ;                 
                    cmd = line.id && line.qty ? 1 : 2;
                    cmd = line.id ? cmd : 0;
                    if ( cmd || line.qty )
                        return order['order_line'].push([cmd,line.id,line]);
               });
               order['order_line'] = order['order_line'].filter(Boolean);
            }
            if (!order.client_order_ref) order.client_order_ref = this.id;            
            //if (isNaN(order.id)) delete order.id;            
            return order;
        },
        save:function(){
            console.log('save',this,this.toJSON());
            Backbone.Model.prototype.save.apply(this,arguments);
        },
        get_name:function(){
            return 'SO#' + this.get('client_order_ref').substr(-4);
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
            return this.get('date_order') instanceof Date ? this.get('date_order').toDateString() : this.get('date_order').substr(0,10);
        },
        confirm:function(){
            var rpc = this.app.get_rpc('/web/dataset/call_kw/' + this._model );            
            return rpc.call('action_confirm', [this.id],{});            
        },
       
   }, {
        load:function(cart_id){   
           if (isNaN(cart_id)){               
               var cart = JSON.parse(localStorage[cart_id] || '{}');   
               return cart;
           }
        },
   }) 
});