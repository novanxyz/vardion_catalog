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
        format_currency:function(value){            
            var currency = this.app.user.currency;
            value = parseFloat(value).formatMoney(currency.digits[1],",",'.') ;
            return currency.position == 'before' ? currency.symbol + ' ' + value : value + ' '+ currency.symbol ;
        },
        saveBase64:function (folderpath,filename,content,contentType){
            // Convert the base64 string in a Blob
            console.log('cordova', cordova.file.dataDirectory)
//            folderpath = cordova.file.dataDirectory + ;
            console.log(folderpath)
//            return resolveLocalFileSystemURL(folderpath, function(dir){
//                console.log(dir)
//            })
            return this.app.dir.getDirectory(folderpath,{'create':false},function(dir){
                console.log('dir',dir)
                dir.getFile(filename, {create:true}, function(file) {
                    //console.log("File created succesfully.", file, folderpath,filename);                    
                    file.createWriter(function(fileWriter) {
                        console.log("Writing content to file", file,folderpath, filename);
                        var DataBlob = Utils.b64toBlob(content,contentType);
                        fileWriter.write(DataBlob);
                    }, function(){
                        console.log('Unable to save file in path '+ folderpath,filename);
                    });
                });
            },function(err){
                console.log(err,folderpath);
            });
        },
        contactToPartner:function(contact){
            var phone   = _(contact.phoneNumbers).find(function(ph){return ph.type === 'work' || ph.pref;});
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
                    country : address.country.toUpperCase == 'INDONESIA' ? 'ID':'US',
                });
            }
            
            var vardion_id = (contact.ims) ? _(contact.ims).find(function(im){return im.type =='vardion'}) : false;
            if (vardion_id){partner.id = vardion_id.value;}
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
        }
    }
    return Utils
})