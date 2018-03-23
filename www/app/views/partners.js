define(function(require){
    var Base     = require('models/base');       
    var Utils    = require('utils');       
    var tmpl     = require('text!templates/partners.html');
    $.fn.serializeObject = function(){
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
    return Base.Popup.extend({
        _name : 'partners',    
        events:{
            'click btn[name=open_contact]': 'open_contact',
            
        },
       initialize:function(app){
           Base.Popup.prototype.initialize.apply(this,arguments);
           var models = {'res.partner/search_read':
                            [[['customer','=',true],['active','=',true],],
                             ['id','name','display_name','email','phone','barcode','image_small','type','ref','street','street','city','zip','is_company']],                            
                        };
           this.ready = Utils.get_data(models);
       },
       bind_events:function(){
           console.log(this.$el);
           $('input:radio').change(_.bind(this.partner_selected,this));           
           $('#search_input').keyup(_.bind(this.search,this));
       },       
       show:function(params){           
           this.partners = Utils.get_partners();
           this.prev_view = $('body main:visible').hide();
           this.render();                     
           var self = this;
           this.bind_events();
           var def = $.Deferred();
           $('.btn[role=ok]').click(function(){               
               var vals = self.$el.find('input[name=partner]').val();
               console.log(vals);
               def.resolve(vals);
           });
           $('.btn[role=cancel]').click(function(){
               def.reject();
           });
           def.always(_.bind(this.close,this));
           this.$el.show();
           return def;
       },
       close:function(){
           this.prev_view.show();
           this.$el.remove();           
       },
       search:function(ev){
            var q = $(this).val().trim().toLowerCase();            
            if (q.length < 3) return $('li.item').show();
            $('li.item').hide();
            _(this.partners).each(function(p){
                if (p.name.toLowerCase().indexOf(q) >=0 ) return $('li.item[data-id='+p.id+']').show();
                if (p.phone && p.phone.indexOf(q) >=0 ) return $('li.item[data-id='+p.id+']').show();
                if (p.street && p.street.toLowerCase().indexOf(q) >=0 ) return $('li.item[data-id='+p.id+']').show();
                if (p.city && p.city.toLowerCase().indexOf(q) >=0 ) return $('li.item[data-id='+p.id+']').show();
                if (p.barcode && p.barcode.toLowerCase().indexOf(q) >=0 ) return $('li.item[data-id='+p.id+']').show();
            });                           
            if ($('li.item:visible').length == 1 ) {
                $('li.item:visible input').click();                    
            }
            if (ev.keyCode == 13 && $('li.item:visible input:checked').length == 1 ){
                $('.btn[role=ok]').click();        
            }                 
       },
       partner_selected:function(ev){           
           var partner_id = this.$el.find('li.item input[name=partner]:checked').val();
           var partner = _(this.partners).find(function (p) {return p.id == partner_id;});           
           console.log(partner_id,partner);
           $('.form.partner').hide();
           if (! partner) return;
           this.$el.find('#email').val('');
           this.$el.find('#phone').val('');
           this.$el.find('#name').val(partner.name);
           if (partner.phone) this.$el.find('#phone').val(partner.phone);
           if (partner.email) this.$el.find('#email').val(partner.email);
           $('.form.partner').show();
           setTimeout(function(){$('.form.partner').hide();},12000);
       },
       open_contact:function(){
           var self = this;
           function onContact(contact){
                contact = _.isArray(contact) ? contact[0]:contact;
                self.cart.partner = Utils.contactToPartner(contact);
                //console.log(contact,self.cart.partner);
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
       
    });   
})