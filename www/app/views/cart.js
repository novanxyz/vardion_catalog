define(function(require){
    var Base     = require('models/base');    
    var Utils    = require('utils');    
    var tmpl     = require('text!templates/cart.html');
    var Cart  = require('models/cart');   
   
    var CartView = Base.Page.extend({
       _name : 'cart',
       events:{
           'click a.date-select'        : 'select_date',
           'click a.select_partner'     : 'select_partner',
           'click a.register_contact'   : 'register_contact',
           'click a.update_contact'     : 'update_contact',
           'click a.add_cart'           : 'add_cart',
           'click a.cancel_cart'        : 'cancel_cart',           
       },
       initialize:function(app){          
          Base.Page.prototype.initialize.apply(this,arguments);                              
          var DB_ID = this.app.DB_ID +'_'+ Cart.prototype._name;
          var cart_id = localStorage[DB_ID];
          var cart = {'user_id':app.user.uid};          
          if (cart_id){
              cart_id = cart_id.split(',')[0];
              cart_id = DB_ID + '-' + cart_id;
              cart = Cart.load(cart_id);
          }            
          
          this.cart =  new Cart(cart,app);
          console.log(cart,this.cart);
          this.cart.bind('request',_.bind(this.show_loading,this));
          this.cart.bind('sync',_.bind(this.hide_loading,this));
          this.orders = new Backbone.Collection([this.cart]);
          this.ready = $.Deferred().resolve(this.card);
        },
        start:function(cart_id){
            var self = this;
            this.ready.done(function(){
                var name = self.app.DB_ID + '_' + Cart.prototype._name;                         
                self.cart_ids = localStorage[name] || [] ;
                if (self.cart_ids.length){
                    self.cart_ids = self.cart_ids.split(',');
                    if (!cart_id){
                        cart_id = self.cart_ids[0];
                    }
                }                                
                console.log(self.cart_ids,cart_id,self.cart);                
                //self.cart = self.cart.localStorage.find(cart_id);
                //self.cart.parse(cart_id);
                self.render();
                self.show();
            });
        },
        add_cart:function(){
            
        },
        cancel_cart:function(){
            
        },
        select_date:function(){
            var options = {
                titleText : 'Order Date',
                date      : new Date(this.cart.get('date_order')),
                mode      : 'date',                
                androidTheme : datePicker.ANDROID_THEMES.THEME_HOLO_DARK,
            };
            options['minDate'] = options.date.setDate(1);
            options['maxDate'] = options.date.setMonth(options.date.getMonth() + 1);
            console.log(options);
            var self = this;            
            datePicker.show(options, function(date){
                self.cart.set('order_date',new Date(date));
                self.render();
            }, null);

        },
        select_partner:function(){
            var self = this;
            console.log(this,navigator.contacts);
            navigator.contacts.pickContact(function(contact){                
                self.cart.partner = Utils.contactToPartner(contact);
                console.log(contact,self.cart.partner);
                self.contact = contact;
                self.render();
            },function(err){
                console.log('Error: ' + err);
            });
        },
        register_contact:function(){
            var rpc = this.app.get_rpc('/web/dataset/call_kw');
            var self = this;
            return rpc.call('res.partner','find_or_create',[this.cart.partner], {}  ).then(function(res){                
                console.log(res,self.contact);
                self.cart.partner.id = res;
                if (!self.contact.ims){
                    self.contact.ims = [];
                }
                
                self.contact.ims.push(new ContactField('vardion',self.cart.partner.id,true));
                self.contact.save(function(ret){console.log(self.contact , ' saved' , ret);},null);
                self.render();
            });
        },
        update_contact:function(){
            if (! this.contact) {
                this.contact =  navigator.contacts.create(Utils.partnerToContact(this.cart.partner));
            }
            var self = this;
            if (!self.contact.ims){self.contact.ims = [];}
            this.contact.ims.push(new ContactField('vardion',this.cart.partner.id,true));
            this.contact.save(function(ret){console.log(self.contact, ' saved',ret);},null);
        },
        open_contact:function(){
            
        },
        get_notification:function(){
            $('.order .alert').show();            
            if (!this.cart.partner){
                return '<span>No Partner selected</span><a class="pull-right btn" name="select_partner"><i class="material-icons">contacts</i></a>';
            }                        
            if (!this.cart.partner.email ) {
                return '<span>Partner doesn\'t have email</span><a class="pull-right btn" name="select_partner"><i class="material-icons">contacts</i></a>';
            }
            if (!this.cart.partner.id ) {
                return '<span>Partner not registered</span><a class="pull-right btn" name="register_contact"><i class="material-icons">cached</i></a>';
            }
            
            if (this.contact){
                var vardion_id  = (this.contact.ims) ? _(this.contact.ims).find(function(im){return im.type =='vardion'}) : false;
                if (vardion_id.value != this.cart.partner.id) {
                    return '<span>Partner not synchronized yet</span><a class="pull-right btn" name="update_contact"><i class="material-icons">account_box</i></a>';
                }
            }else{                
                return '<span>Partner not locally saved</span><a class="pull-right btn" name="update_contact"><i class="material-icons">account_box</i></a>';                
            }            
        },
       
    });
    return CartView;
});