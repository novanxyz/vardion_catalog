define(function(require){
    var Base     = require('models/base');    
    var Utils    = require('utils');    
    var tmpl     = require('text!templates/cart.html');
    var Cart  = require('models/cart');   
   
    var CartView = Base.Page.extend({
       _name : 'cart',
       events:{
           'swipe   section#cart-order' : 'handle_swipe',
           'click   li.line'            : 'select_line',
           'change  input.qty'          : 'update_qty',
           'blur    input.qty'          : 'update_qty',
           'blur    .so-list'           : 'deselect_line',
           'blur    texarea.note'       : 'update_note',
       },
       initialize:function(app){          
          Base.Page.prototype.initialize.apply(this,arguments);                              
          this.cart =  new Cart({},app);          
          this.cart.bind('request',_.bind(this.show_loading,this));
          this.cart.bind('sync',_.bind(this.hide_loading,this));
          this.orders = new Backbone.Collection([this.cart]);
          this.selected_line = null;
          this.auto_save = null;
//          this.ready = this.prepare();
//          console.log(this.ready);
        },
        prepare:function(){
            var models = { 'product.pricelist.item/search_read' : {'args': [[],[]] },
                           'account.payment.term/search_read'   : {'args': [[['active','=','true']],[]]},
                           'account.tax/search_read'            : {'args': [[['type_tax_use','=','sale']],[]]},
                           'sale.order/default_get'             : {'args': [["origin","order_line","currency_id","team_id","partner_id","amount_tax","delivery_count","company_id","note","picking_policy","state",
                                       "pricelist_id","project_id","incoterm","validity_date","warehouse_id","payment_term_id","fiscal_position_id"]]}
                        };
            var context = {context:this.app.context};            
            var self = this;
            var ls_name = this.app.DB_ID + '_settings';            
            function request(model,args,save_result){
                var rpc = self.app.get_rpc('/web/dataset/call_kw/' + model);
                var method = model.split('/').pop();                
                return rpc.call(method,args,context).then(save_result);
            }
            
            return Object.keys(models).reduce(function(prev,model){
                var _model = model.split('/').shift().replace(/\./g,'_');
                if ( localStorage[ls_name +'_'+_model] ) return prev;
                var save_result = (function(res){                    
                    localStorage[ls_name +'_'+_model] = JSON.stringify(res);
                });
                return prev.then(function(){return request(model,models[model],save_result) ; });
            },Promise.resolve());            
        },
        start:function(cart_id){
            var self = this;            
            
            if (!isNaN(cart_id)){
                this.select_cart(cart_id);
            }
            
            this.ready.done(function(){
                self.render();
                self.show();
            });
        },        
        render:function(){            
            var name = this.app.DB_ID + '_' + Cart.prototype._name;                   
            this.cart_ids = localStorage[name] || '' ;
            if (this.cart_ids.length){
                this.cart_ids = this.cart_ids.split(',');                
            }                                
            Base.Page.prototype.render.apply(this,arguments);
            if(this.selected_line) $('li.line[data-id='+ this.selected_line.cid +']').addClass('active');
        },
        update_summary:function(){
            this.$el.find('.cart h4.total-val').html(Utils.format_currency(this.cart.get_total()))
            this.$el.find("#order-status .modal-body").html(
                    this.cart.get('state') + '<br/>' +
                    this.cart.payment_term.name+'<br/>'+
                    this.cart.pricelist.get('name') +'<br/>'
                    );
        },
        add_cart:function(){
            var ids = this.cart_ids.filter(isNaN);
            if (ids.length){
                return Utils.toast("Can only create ONE unsubmitted order.\nPlease confirm current order first.");
            }            
            this.cart = new Cart({'user_id':this.app.user.uid,'date_order':new Date()},this.app);
            this.cart.save();            
            this.render();
        },
        select_cart:function(cart_id){
            cart_id = cart_id ? cart_id : $(event.target).data('id');
            var name = this.app.DB_ID + '_' + Cart.prototype._name + '-' + cart_id;
            var cart = localStorage[name] ;
            if (! cart ) return Utils.toast('Select order not available');
            cart = JSON.parse(cart);
            this.cart = new Cart(cart,this.app );
            this.trigger('change:cart',this.cart);
            this.render();            
        },
        cancel_cart:function(){
            
        },
        remove_cart:function(){            
            var id  = this.cart.id;
            var ids = this.cart_ids.filter(function(i){return i != id;});
            this.cart.destroy();
            if (ids.length){                                
                localStorage[this.app.DB_ID + '_' + Cart.prototype._name] = ids.join(',');
                this.select_cart(ids[0]);
            }else{
                this.add_cart();
            }
        },
        select_date:function(){
            var options = {
                titleText : 'Order Date',
                date      : this.cart.get('date_order') ,
                mode      : 'date',                
                androidTheme : datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT,
            };
            options['minDate'] = options.date.setDate(1);
            options['maxDate'] = options.date.setMonth(options.date.getMonth() + 1);            
            var self = this;            
            datePicker.show(options, function(date){
                self.cart.set('order_date',new Date(date));
                self.render();
            }, null);

        },
        select_partner:function(partner_id){
            var self = this;            
            return this.app.open_popup('partner',partner_id)
                    .then(function(partner){
                        self.cart.set('partner_id',partner.id);                        
                        self.cart.partner  = partner;
                        self.cart.save();
                        self.render();
                    });            
        },
        select_report:function(){            
            var options = [{'text':'Sale Order','value': this.app.url + '/report/pdf/sale.report_saleorder/' + this.cart.id }];
            
            for (var p in this.cart.get('picking_ids')) {                    
                options.push({'text':'Delivery ' , 
                    value:this.app.url + '/report/pdf/stock.report_picking/'+ this.cart.get('picking_ids')[p] })
            };
            for (var i in this.cart.get('invoice_ids')) {                    
                options.push({'text':'Invoice ' , 
                    value:this.app.url + '/report/pdf/account.report_invoice/'+ this.cart.get('invoice_ids')[i] })
            };
            console.log(options);
            var picker = {'title': 'Select Report',
                          'items': options,
                          'doneButtonLabel': 'Get Report',
                };
            return window.plugins.listpicker.showPicker(picker,
                    function(item){
                        console.log(item);
                        return navigator.app.loadUrl(item, { openExternal: true });
                        
                    });       
        },
        get_notification:function(){
            $('.order .alert').show();            
            if (!this.cart.partner){
                return '<span>No Partner selected</span><a class="pull-right btn" name="select_partner"><i class="material-icons">contacts</i></a>';
            }                        
            if (!this.cart.partner.email ) {
                return '<span>Partner doesn\'t have email</span><a class="pull-right btn" name="select_partner"><i class="material-icons">contacts</i></a>';
            }
//            if (!this.cart.partner.id ) {
//                return '<span>Partner not registered</span><a class="pull-right btn" name="register_contact"><i class="material-icons">cached</i></a>';
//            }
            
//            if (this.contact){
//                var vardion_id  = (this.contact.ims) ? _(this.contact.ims).find(function(im){return im.type =='vardion'}) : false;
//                if (vardion_id.value != this.cart.partner.id) {
//                    return '<span>Partner not synchronized yet</span><a class="pull-right btn" name="update_contact"><i class="material-icons">account_box</i></a>';
//                }
////            }else{                
////                return '<span>Partner not locally saved</span><a class="pull-right btn" name="update_contact"><i class="material-icons">account_box</i></a>';                
//            }            
            return '';
        },
        update_note:function(){            
            this.cart.set('note',$('textarea[name=note]').val());
            this.cart.save();
        },
        cancel_order:function(){
            var self = this;
            if (isNaN(this.cart.id)){
                this.remove_cart();
            }else if (this.cart.get('state') != 'done' || this.cart.get('state') != 'cancel' ) {
                var rpc = this.app.get_rpc('/web/dataset/call_kw/sale.order/action_cancel');
                rpc.call('action_cancel',[self.cart.id],{context:Object.assign(this.app.context,{'active_id':this.cart.id})} )
                   .then(function(res){                       
                        self.cart.set('state','cancel');
                        self.remove_cart();
                    });                
            }else{
                this.remove_cart();
                Utils.toast("Cannot cancel done order.\n You may delete it by ....");
            }                        
//            this.cart = new Cart({},this.app);
//            this.render();
        },
        confirm_order:function(){
            var rpc = this.app.get_rpc('/web/dataset/call_kw/' + this.cart._model);
            var self = this;            
            if (this.auto_save){
                clearTimeout(this.auto_save);
                this.cart.save();
            }
            
            var def = $.Deferred();
            if ( ['draft','sent'].indexOf(this.cart.get('state')) < 0 ) {
                Utils.toast(this.cart.get_name() + ' already confirmed or canceled');
                $('#cart-buttons').hide();
                return this.check_status();
            }
            if (isNaN(this.cart.id)){                
                rpc.call('create',[ this.cart.toJSON(1) ],{context:this.app.context})
                        .then(function(res){                           
                            self.cart.set('id',res);
                            self.cart.id = res;
                            //self.cart.save();             
                            def.resolve(self.cart.id);
                        });
            }else{
                rpc.call('write',[this.cart.id,this.cart.toJSON(1)],{context:this.app.context} )
                        .then(function(res){                            
                            //self.cart.save();
                            def.resolve(self.cart.id);
                        });
            }
            return def.then(function(order_id){
                rpc = self.app.get_rpc('/web/dataset/call_kw/sale.order/action_confirm');
                rpc.call('action_confirm',[self.cart.id],{context:Object.assign(self.app.context,{'active_id':order_id})} )
                   .then(function(res){                       
                        self.check_status();
                    });
            });
        },
        check_status:function(ev){           
           if ( isNaN(this.cart.id) ) return this.confirm_order();
           
           var order_fields = ['name','state','order_line','date_order','client_order_ref','warehouse_id','pricelist_id','invoice_status','amount_untaxed','amount_tax','payment_term_id','amount_total','picking_ids','invoice_ids'];
           var line_fields  = ['name','product_id','price_unit','discount','uom_id','tax_id','product_uom_qty','qty_delivered','qty_invoiced'];
                      
           var rpc1 = this.app.get_rpc('/web/dataset/call_kw/' + this.cart._model);           
           var rpc  = this.app.get_rpc('/web/dataset/call_kw/' + 'sale.order.line');           
           var $def = $.Deferred();
           var self = this;
           rpc1.call('read',[this.cart.id, order_fields],{context:this.app.context}).then(function (res){               
               res = res[0];
               var line_ids = res.order_line;
               rpc.call('read',[line_ids,line_fields],{context:self.app.context}).then(function(lines){                   
                   res.order_line = lines;
                   self.cart.fromJSON(res);
                   self.cart.save();
                   self.render();               
                   $def.resolve(self.cart);
               })               
           });
           return $def.always(function(){
                $('#order-status').toggle('modal');
           });           
        },        
        print:function(){
            if (isNaN(this.cart.id)) return Utils.toast('Cannot generate report for unconfirmed order');
            var url = Utils.get_report(this.cart._model,this.cart.id);
            return navigator.app.loadUrl(url, { openExternal: true });
        },
        send_email:function(){
            if (isNaN(this.cart.id)) return Utils.toast('Cannot generate report for unconfirmed order');
        },
        select_pricelist:function(){                        
            var self = this;
            var pricelist = Utils.get_pricelist();//.then(function(pricelist){
                pricelist = _(pricelist).map(function(p){return { 'text':p[1],value:p[0]};  });
                var picker = {'title': 'Select Pricelist',
                          'items': pricelist,
                          'selectedValue': self.cart.get('pricelist_id'),
                          'doneButtonLabel': 'Apply',
                        };
                window.plugins.listpicker.showPicker(picker,
                    function(item){
//                        console.log(item);
                        self.cart.set_pricelist(item);                        
                        self.render();
                        $('#order-buttons').show();
                    });       
            //});            
        },
        select_payterm:function(){
            var self = this;
            var terms = Utils.get_payment_terms();//.then(function(terms){
                terms = _(terms).map(function(t){return { 'text':t[1],value:t[0]};  });
                var picker = {'title': 'Select Pricelist',
                          'items': terms,
                          'selectedValue': self.cart.get('payment_term_id'),
                          'doneButtonLabel': 'Apply',
                        };
                window.plugins.listpicker.showPicker(picker,
                    function(item){
                        self.cart.set('payment_term_id',item);
                        var term = _(terms).where({value:item});
                        self.cart.payment_term = {id:term.value,name:term.text} ;
//                        self.render();
//                        $('#order-buttons').show();
                    });       
            //});            
        },
        handle_swipe:function(ev){            
            if (this.get_notification()){
                return Utils.toast('There is problem with your order.\nPlease resolve it first');
            }
            var curTarget = $(ev.currentTarget);  
            ev = ev.originalEvent;
            if (ev.detail.dir === 'up'){// && curTarget.parent().offsetTop() > 0){
               $('#cart-buttons').show();
//               $('#cart-buttons').blur(function(){$(this).hide();});
           }
           if (ev.detail.dir === 'down'){// && curTarget.parent().offsetTop() > 0){
               $('#cart-buttons').hide();
           }
           this.deselect_line();
//           console.log(curTarget,ev);
//           if (ev.detail.dir === 'left'){
//               var line = '';
//           }
           
        },       
        select_line:function(ev){
            //if ($(ev.currentTarget).hasClass('active')) return this.deselect_line();
            $('li.line').removeClass('active');   
            if ($('#order').hasClass('sale') || $('#order').hasClass('done') || $('#order').hasClass('cancel')  ) {
                return Utils.toast("Cannot edit confirmed/canceled order.");                
            }
            $(ev.currentTarget).addClass('active');            
            this.selected_line = this.cart.orderlines._byCid[$(ev.currentTarget).data('id')];            
        },
        deselect_line:function(){
            $('li.line').removeClass('active'); 
            this.selected_line     = null;            
        },
        update_qty:function(ev){                        
            var input = $('li.line.active input.qty');
            event.stopPropagation();
//            this.selected_line = this.car
            this.selected_line.set('qty',input.val());
            this.update_summary();
            clearTimeout(this.auto_save);
            this.auto_save = setTimeout( _.bind(this.cart.save,this.cart),15000);
        },
        remove_qty:function(){
            var curTarget =  event.target;
            event.stopPropagation();
            var input = $('input.qty',$(curTarget).closest('li.line.active'));            
            var qty = parseFloat(input.val());
            if (qty){
                input.val(qty - 1);
                this.update_qty();
            }            
        },
        add_qty:function(){
            var curTarget =  event.target;
            event.stopPropagation();
            var input = $('input.qty',$(curTarget).closest('li.line.active'));
            
            var qty = parseFloat(input.val());
            if (qty){
                input.val(qty + 1);
                this.update_qty();
            }
            
        },
    });
    return CartView;
});