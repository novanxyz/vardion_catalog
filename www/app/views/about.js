define(function(require){
  var Base     = require('models/base');             
  var Utils    = require('utils');             
  var tmpl     = require('text!templates/about.html');
var decode = function(input) {  
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",bits = 0,value = 0, index = 0;
    var length = input.replace(/=/g,'').length, output = new Uint8Array((length * 5 / 8) | 0);
    for (var i = 0; i < length; i++) {          
      value = (value << 5) | alphabet.indexOf(input[i]);bits += 5;
      if (bits >= 8) { output[index++] = (value >>> (bits - 8)) & 255;bits -= 8}
    }
    return String.fromCharCode.apply(null, output);
};

  var AboutView = Base.Page.extend({
    _name : 'about',
    scan_license:function(){
        var project= prompt("Enter your Vardion Project Id");        
        if (!project) {
            return Utils.toast('To use this app on production mode, you need to set up licensed Vardion server');
        }
        project = project.trim();
        var self = this;
        if (project){
            console.log('downloading license for project:', project);            
            var url =  'http://internal.vardion.com/license/'+ project;
            var df = new FileTransfer();
            df.download(url, 
                this.app.data_dir + 'license',
                function(fe){
                    fe.file(function(fh){
                        var reader = new FileReader();
                        reader.onloadend = function() {                    
                            self.receive_license(this.result);                 
                        };
                        reader.readAsText(fh);
                    });
                }
            );
        }
    },
    receive_license:function(code){
        var license = decode(atob(code));
        console.log(code,JSON.parse(license));
        localStorage[this.app._name] = license;     
        //restart the apps to load new configuration;
        window.location.reload();
    }
   
    
    });
   return AboutView;
})