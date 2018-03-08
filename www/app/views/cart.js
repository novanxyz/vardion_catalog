define(function(require){
    var Base     = require('models/base');    
    var Utils    = require('utils');    
    var tmpl     = require('text!templates/cart.html');
    var Cart  = require('models/cart');   
   
    var CartView = Base.Page.extend({
       _name : 'cart',
       events:{
           'swipe main': 'check_status',
       },
       initialize:function(app){          
          Base.Page.prototype.initialize.apply(this,arguments);                              
          this.cart =  new Cart({},app);          
          this.cart.bind('request',_.bind(this.show_loading,this));
          this.cart.bind('sync',_.bind(this.hide_loading,this));
          this.orders = new Backbone.Collection([this.cart]);
          this.ready = $.Deferred().resolve(this.card);
        },
        start:function(cart_id){
            var self = this;
            this.ready.done(function(){                                
                if (self.cart.get('partner_id')){
                    self.select_partner(self.cart.get('partner_id'));
                }else{
                    self.render();
                }                
                self.show();
            });
        },
        render:function(){            
            var name = this.app.DB_ID + '_' + Cart.prototype._name;       
            console.log(name);
            this.cart_ids = localStorage[name] || '' ;
            if (this.cart_ids.length){
                this.cart_ids = this.cart_ids.split(',');                
                console.log(this.cart_ids.indexOf(this.cart.get('client_order_ref')),this.cart.get('client_order_ref'));
            }                                
            Base.Page.prototype.render.apply(this,arguments);
        },
        add_cart:function(){
            if (!this.cart.get_count()) {
                return alert("Cannot create new order.\nPlease add product first.");
            }
            this.cart = new Cart({'user_id':this.app.user.uid,'date_order':new Date()},this.app);
            this.cart.save();
            this.render()
        },
        cancel_cart:function(){
            
        },
        select_date:function(){
            var options = {
                titleText : 'Order Date',
                date      : this.cart.get('date_order') ,
                mode      : 'date',                
                androidTheme : datePicker.ANDROID_THEMES.THEME_HOLO_DARK,
            };
            options['minDate'] = options.date.setDate(1);
            options['maxDate'] = options.date.setMonth(options.date.getMonth() + 1);
            console.log(this.cart,options);
            var self = this;            
            datePicker.show(options, function(date){
                self.cart.set('order_date',new Date(date));
                self.render();
            }, null);

        },
        select_partner:function(partner_id){
            var self = this;
            console.log(this,navigator.contacts);
            function onContact(contact){
                contact = _.isArray(contact) ? contact[0]:contact;
                self.cart.partner = Utils.contactToPartner(contact);
                console.log(contact,self.cart.partner);
                self.contact = contact;
                self.render();
            }
            
            if (partner_id){
                var clause = new ContactFindOptions();
                clause.multiple =false;
                clause.filter = partner_id;
                clause.contactFields = 'ims' ;
                clause.hasPhoneNumber=true;
                var fields       = [navigator.contacts.fieldType.ims];
                navigator.contacts.find(fields,onContact,null,clause);
            }else {
                navigator.contacts.pickContact(onContact);
            }            
        },
        register_contact:function(){
            var rpc = this.app.get_rpc('/web/dataset/call_kw/res.partner');
            var self = this;
            return rpc.call('find_or_create',[this.cart.partner], {}  ).then(function(res){                
                console.log(res,self.contact);
                self.cart.partner.id = res;
                self.cart.save();
                
                if (!self.contact.ims){
                    self.contact.ims = [];
                }
                
                try {
                    self.contact.ims.push(new ContactField('vardion',self.cart.partner.id,true));
                    console.log(self.contact);
                    self.contact.save(function(ret){
                                            self.render();
                                            console.log(self.contact , ' saved' , ret);
                                      },function(ret){
                                            console.log(self.contact , ' error' , ret);
                                    });
                }catch (ex){
                    console.log("ERROR REGISTER CONTACT",ex);
                }                                
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
        cancel_order:function(){
            this.cart.destroy();
            this.cart = new Cart({},this.app);
            this.render()
        },
        confirm_order:function(){
            var rpc = this.app.get_rpc('/web/dataset/call_kw/' + this.cart._model);
            var self = this;
            if (isNaN(this.cart.id)){                
                return rpc.call('create',[this.cart.toJSON(1)],{context:this.app.context})
                        .then(function(res){
                    console.log(res);
                    self.cart.set('id',res);
                    self.cart.id = res;
                    self.cart.save();
                });
            }else{
                return rpc.call('write',[this.cart.id,this.cart.toJSON(1)])
                        .then(function(res){
                    console.log(res);
                    self.cart.save();
                });
            }            
        },
        check_status:function(ev){
            var curTarget= $(ev.currentTarget);
            ev = ev.originalEvent;            
            if (ev.detail.dir == 'down' && curTarget.parent().scrollTop() == 0 ){                
                console.log('check_status');
            }
            
            if (ev.detail.dir == 'up'){
                $('#cart-buttons').show();
                $('#cart-buttons').blur(function(){$(this).hide()});
            } 
            if (ev.detail.dir == 'right')  {            
                console.log($('a.nav-link[aria-selected="true"]').attr('name') );
            } 
            if (ev.detail.dir == 'left')  {
                console.log($('a.nav-link[aria-selected="true"]').attr('name') );
            } 
            
            
        },
        
       
    });
    return CartView;
});