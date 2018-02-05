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
           
       },
       initialize:function(app){
          this.app = app;
          Base.Page.prototype.initialize.apply(this,arguments);                    
          //this.app.qweb.add_template(Utils.make_template('cart',tmpl) );
          
          var cart_id = localStorage['cart'];
          var cart = {'user_id':app.user.uid};
          console.log(cart_id);
          if (cart_id){
              cart_id = cart_id.split(',')[0];
              cart = JSON.parse(localStorage['cart'+ cart_id] || '{}');
          }            
          this.cart =  new Cart(cart,app);                    
          this.cart.bind('request',_.bind(this.show_loading,this));
          this.cart.bind('sync',_.bind(this.hide_loading,this));
          this.orders = new Backbone.Collection([this.cart]);
        },
        add_cart:function(){
            
        },
        cancel_cart:function(){
            
        },
        select_date:function(){
            var options = {
                date: new Date(this.cart.get('order_date')),
                mode: 'date',
                androidTheme : datePicker.ANDROID_THEMES.THEME_HOLO_DARK,
            };
            var self = this;            
            datePicker.show(options, function(date){
                self.cart.set('order_date',new Date(date));
                self.render();
            }, null);

        },
        select_partner:function(){
            var self = this;
            navigator.contacts.pickContact(function(contact){                
                self.cart.partner = Utils.contactToPartner(contact);
                console.log(contact,self.cart.partner);
                self.contact = contact;
                self.render();
            });
        },
        register_contact:function(){
            var rpc = new Backbone.Rpc({url: this.app.url + '/web/dataset/call'});
            var self = this;
            return rpc.call('res.partner','find_or_create',[this.cart.partner]).then(function(res){                
                console.log(res);
                self.cart.partner.id = res
                if (!self.contact.ims){
                    self.contact.ims = [];
                }
                
                self.contact.ims.push(new ContactField('vardion',self.cart.partner.id,true));
                self.contact.save(function(){console.log(self.contact, ' saved');},null);
                self.render();
            });
        },
        update_contact:function(){
            if (! this.contact) {
                this.contact =  navigator.contacts.create(Utils.partnerToContact(this.cart.partner));
            }
            this.contact.ims.push(new ContactField('vardion',this.cart.partner.id,true));
            this.contact.save(function(){console.log(this.contact, ' saved');},null);
        },
        open_contact:function(){
            
        },
        get_notification:function(){
            $('.order .alert').show();            
            if (!this.cart.partner){
                return '<span>No Partner selected<span><a class="pull-right partner-select"><i class="material-icons">contacts</i></a>';
            }                        
            if (!this.cart.partner.email ) {
                return '<span>Partner doesn\'t have email<span><a class="pull-right partner-select"><i class="material-icons">contacts</i></a>';
            }
            if (!this.cart.partner.id ) {
                return '<span>Partner not registered<span><a class="pull-right register_contact"><i class="material-icons">cached</i></a>';
            }
            
            if (this.contact){
                var vardion_id  = (this.contact.ims) ? _(this.contact.ims).find(function(im){return im.type =='vardion'}) : false;                
                console.log(vardion_id , this.cart.partner.id);
                if (vardion_id != this.cart.partner.id) {
                    return '<span>Partner not synchronized yet<span><a class="pull-right update_contact"><i class="material-icons">account_box</i></a>';
                }
            }else{                
                return '<span>Partner not locally saved<span><a class="pull-right update_contact"><i class="material-icons">account_box</i></a>';                
            }
            
        },
       
    });
    return CartView;
});