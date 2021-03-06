define(function(require){    
    
Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 0 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
var Utils = {
    makeTemplate:function (file){
        file = 'text!'+file;
        var tmpl = require(file);
        var name = 'catalog';        
        tmpl = '<templates><t t-name="'+name+'">' + tmpl + '</t></templates>';
        tmpl = tmpl.replace(/(<input.+?\/?>)/g,function(m){return m.replace(">","/>");} );       
        return tmpl;
    },
    make_template:function (name,tmpl){                        
        tmpl = '<templates><t t-name="'+name+'">' + tmpl + '</t></templates>';
        tmpl = tmpl.replace(/(<input.+?\/?>)/g,function(m){return m.replace(">","/>");} );       
        return tmpl;
    },
    b64toBlob: function(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

      var blob = new Blob(byteArrays, {type: contentType});
      return blob;
    },
    get_data:function(models,key){
        var context = {context:this.app.context};            
        var self = this;
        var ls_name = key ? this.app.DB_ID + '_' + key : this.app.DB_ID;            
        function request(model,args,save_result){
            var rpc = self.app.get_rpc('/web/dataset/call_kw/' + model);
            var method = model.split('/').pop();                
            return rpc.call(method,args,context).then(save_result);
        }
//        console.log(models);    
        return Object.keys(models).reduce(function(prev,model){
            var _model  = model.split('/').shift().replace(/\./g,'_');
            var args    = _.isArray(models[model])? models[model] : models[model]['args'];            
            var loaded  = _.isArray(models[model]) ? function(res){localStorage[ls_name +'_'+_model] = JSON.stringify(res);}:models[model]['loaded']; 
            if ( localStorage[ls_name +'_'+_model] && _.isArray(models[model])  ) return prev;
//            console.log(model,_model,args,loaded);
            return prev.then(function(){return request(model,args,loaded ) ; });
        },Promise.resolve());  
    },
    format_currency:function(value){            
        var currency = this.app.user.currency;
        value = parseFloat(value).formatMoney(currency.digits[1],",",'.') ;
        return currency.position == 'before' ? currency.symbol + ' ' + value : value + ' '+ currency.symbol ;
    },
    saveBase64:function (folderpath,filename,content,contentType){
        // Convert the base64 string in a Blob            
        return this.app.dir.getDirectory(folderpath,{'create':true},function(dir){
            dir.getFile(filename, {create:true}, function(file) {
                //console.log("File created succesfully.", file, folderpath,filename);                    
                file.createWriter(function(fileWriter) {
                    //console.log("Writing content to file", folderpath,filename);
                    var DataBlob = Utils.b64toBlob(content,contentType);
                    fileWriter.write(DataBlob);
                }, function(){
                    console.log('Unable to save file in path '+ folderpath,filename);
                });
            });
        },function(err){
//            console.log(err,folderpath);
        });

    },
    contactToPartner:function(contact){
//        console.log(contact);        
        if (!contact){return false;}
        var phone   = _(contact.phoneNumbers).find(function(ph){return ph.type === 'work' || ph.pref;} );
        phone = phone ? phone: contact.phoneNumbers[0];                                   
        var partner = {
            name    : contact.name.formatted,
            phone   : phone.value,
        }
        if (contact.emails) {
            var email =   _(contact.emails).find(function(em){return em.type === 'work' || em.pref;});            
            if (email){
                partner.email = email.value;
            }else{
                partner.email = contact.emails[0].value;                
            }
        }

        var address = (contact.addresses) ?  _(contact.addresses).find(function(addr){ return addr.type == 'work' || addr.pref}) : null; 
        if (address){
            Object.assign(partner,{
                street  : address.streetAddress,
                city    : address.locality,
                zip     : address.postalCode,
                country : address.country && address.country.toUpperCase == 'INDONESIA' ? 'ID':'US',
            });
        }

        var vardion_id = (contact.ims) ? _(contact.ims).find(function(im){return im.type =='vardion'}) : false;
        if (vardion_id){partner.id = parseInt(vardion_id.value) ;}
        return partner;

    },
    partnerToContact:function(partner){
        var contact = {"displayName": partner.name};

        if (partner.phone){
            contact.phoneNumbers.push(new ContactField('work',partner.phone,false));
        }
        if (partner.email){
            contact.emails.push(new ContactField('work',partner.email,false));
        }
        if (partner.street){
            var address = new ContactAddress({type:'work',streetAddress:partner.street,
                                            locality:partner.city, postalCode:partner.zip});
            contact.addresses.push(address);
        }

        return contact;
    },
    toast:function(msg){
        var def = $.Deferred();
        window.plugins.toast.showWithOptions({
                message: msg,
                duration: "short", // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
                position: "top",
                addPixelsY: 175,  // added a negative value to move it up a bit (default 0)
      //                  addPixelsX: 50,
                styling: {
                  opacity: 0.75, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
      //                    backgroundColor: '#FF0000', // make sure you use #RRGGBB. Default #333333
      //                    textColor: '#FFFFFF', // Ditto. Default #FFFFFF
      //                    textSize: 20.5, // Default is approx. 13.
                  cornerRadius: 20, // minimum is 0 (square). iOS default 20, Android default 100
                  horizontalPadding: 20, // iOS default 16, Android default 50
                  verticalPadding: 16 // iOS default 12, Android default 30
                },
            },function(res){def.resolve(res);}
        );
        return def;
    },
    get_partners:function(){
        var db = localStorage[this.app.DB_ID + '_res_partner'] || '[]';
        return JSON.parse(db);            
    },
    get_product:function(product_id){
      var products = JSON.parse(localStorage['apps_catalog@pos_products' ] || '[]');                      
      products = products.records;      
      return _(products).where({'id':product_id});  
    },
    get_pricelist:function(){
        var list = JSON.parse(localStorage[DB_ID + '_settings_product_pricelist_item']);
        return _(list).map(function(p){return p.pricelist_id});        
    },
    get_payment_terms:function(){
        var terms = JSON.parse(localStorage[DB_ID + '_settings_account_payment_term']);
        return _(terms).map(function(t){return [t.id,t.display_name]});        
    },
    get_report:function(model,id){
        var reports = {'sale.order':'sale.report_saleorder'};
        return this.app.url + '/report/pdf/' + reports[model] +'/' + id ;
    },
    get_defaults:function(model){
        //console.log(this);
        var dict= {
            'sale.order.line' : {'qty': 1,'discount':0,'note': '',},
            'sale.order'      : JSON.parse(localStorage['apps_catalog@pos' + '_settings_sale_order']),
            };
        return _.result(dict,model);
    }
}

return Utils;
})