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
           this.$el.on('change','input:radio',_.bind(this.partner_selected,this));           
           this.$el.on('keyup','.search input',_.bind(this.search,this));
           this.$el.on('click','.btn[name=open_contact]',_.bind(this.open_contact,this));
       },       
       show:function(params){           
           this.partners = Utils.get_partners();
           this.prev_view = $('body main:visible').hide();
           this.render();                     
           var self = this;
           this.bind_events();
           var def = $.Deferred();
           $('.btn[role=ok]').click(function(){               
               var vals = self.$el.find('input[name=partner]:checked').val();
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
           $('section.popup').remove();
       },
       search:function(ev){
            var q = this.$el.find('.search input').val().trim().toLowerCase();            
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
           $('.form.partner').hide();
           if (! partner) return;
           $('button[role=ok]').addClass('btn-primary');
           this.$el.find('#email').val('');
           this.$el.find('#phone').val('');
           this.$el.find('#name').val(partner.name);
           if (partner.phone) this.$el.find('#phone').val(partner.phone);
           if (partner.email) this.$el.find('#email').val(partner.email);
           $('.form.partner').show();
           setTimeout(function(){$('.form.partner').hide();},2500);
       },
       open_contact:function(){
           var self = this;
           function onContact(contact){
                contact = _.isArray(contact) ? contact[0]:contact;
                var partner = Utils.contactToPartner(contact);                                
                if (partner.email && partner.phone){
                    self.register_contact(partner);
                }else{
                    Utils.toast("Cannot use contact without email and phone");
                }
            }
            navigator.contacts.pickContact(onContact);                       
       },
       register_contact:function(partner){
            var rpc = this.app.get_rpc('/web/dataset/call_kw/res.partner');
            var self = this;
            return rpc.call('find_or_create',[partner], {context:this.app.context}  ).then(function(res){                                
                    partner.id = res;
                    self.partners.push(partner);
                    self.render();
                    var added = $('li.item[data-id='+res+']');
                    $('input:radio',added).click();
                    console.log(partner,added);                    
                    self.$el.find('.list.partner').animate( {scrollTop: added.offset().top - 56    },500);
//                }catch (ex){
//                    console.log("ERROR REGISTER CONTACT",ex);
//                }                                
            });
        },
       
    });   
})