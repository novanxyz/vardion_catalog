define(function(require){
    var Base     = require('models/base');    
    var Utils    = require('utils');    
    var tmpl     = require('text!templates/cart.html');
    var Cart  = require('models/cart');   
   
    var CartView = Base.Page.extend({
       _name : 'cart',
       events:{
           'click a.date-select'        : 'select_date',
           'click a.partner-select'     : 'select_partner',
           'click a.register_contact'   : 'register_contact',
           'click a.update_contact'     : 'update_contact',
           'click a.add_cart'           : 'add_cart',
           'click a.cancel_cart'        : 'cancel_cart',           
//           'click a.navbar-brand'       : 'open_catalog',        
       },
       initialize:function(app){
          this.app = app;
          Base.Page.prototype.initialize.apply(this,arguments);                    
          //this.app.qweb.add_template(Utils.make_template('cart',tmpl) );                    
          this.cart = app.cart;          
          this.cart.bind('request',_.bind(this.show_loading,this));
          this.cart.bind('sync',_.bind(this.hide_loading,this));
          this.orders = new Backbone.Collection([this.cart]);
          this.ready = $.Deferred().resolve(this.cart);
        },
        start:function(cart_id){
            var self = this;

            this.ready.done(function(){
                var name = self.app.DB_ID + '_' + Cart.prototype._name;                         
                self.cart_ids = localStorage[name] || [] ;
                if (self.cart_ids.length){self.cart_ids = self.cart_ids.split(',');}
                console.log(self.cart_ids);
                self.cart.parse(cart_id);
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
                date: new Date(this.cart.get('date_order')),
                mode: 'date',
                androidTheme : datePicker.ANDROID_THEMES.THEME_HOLO_DARK,
            };
            var self = this;            
            datePicker.show(options, function(date){
                self.cart.set('date_order',new Date(date));
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
            var rpc = this.app.get_rpc('res.partner');
            var self = this;
            return rpc.call('res.partner','find_or_create',[this.cart.partner]).then(function(res){                
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
            if (this.cart.partner.id){
                if (!self.contact.ims){self.contact.ims = [];}
                this.contact.ims.push(new ContactField('vardion',this.cart.partner.id,true));
                this.contact.save(function(ret){console.log(self.contact, ' saved',ret);},null);
            }
            var uri = 'data/'+this.contact.id; 
            var contacts = startApp.set({
                    "application":"ContactsContract.Contacts.CONTENT_URI",
                    "uri": uri                    
            });
        },
        open_contact:function(){
            
        },
        get_notification:function(){
            $('.order .alert').show();            
            if (!this.cart.partner){
                return '<span>No Partner selected<span><a class="pull-right partner-select"><i class="material-icons">contacts</i></a>';
            }                        
            if (!this.cart.partner.email ) {
                return '<span>Partner doesn\'t have email<span><a class="pull-right update_contact"><i class="material-icons">contacts</i></a>';
            }
            if (!this.cart.partner.id ) {
                return '<span>Partner not registered<span><a class="pull-right register_contact"><i class="material-icons">cached</i></a>';
            }
            
            if (this.contact){
                var vardion_id  = (this.contact.ims) ? _(this.contact.ims).find(function(im){return im.type =='vardion'}) : false;                
                console.log(vardion_id , this.cart.partner.id);
                if (vardion_id.value != this.cart.partner.id) {
                    return '<span>Partner not synchronized yet<span><a class="pull-right update_contact"><i class="material-icons">account_box</i></a>';
                }
            }else{                
                return '<span>Partner not locally saved<span><a class="pull-right update_contact"><i class="material-icons">account_box</i></a>';                
            }
            
        },
//        open_catalog:function(params){      
//            this.app.catalog.start(params);            
//        }
    });
    return CartView;
});