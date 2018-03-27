define(function(require){
  var Base     = require('models/base');             
  var Utils    = require('utils');             
  var tmpl     = require('text!templates/login.html');

  return Base.Page.extend({
    _name : 'login',    
    events: {
        'keypress input': 'enable_button',
    },
    enable_button:function(){
        if ($('.login-form.user:visible')) {
            if ($('#username').val() && $('#username').val()) return $('a[name=do_login]').removeAttr('disabled');
            return $('a[name=do_login]').attr('disabled','disabled');
        }else{
            if ($('#name').val() && $('#email').val() && $('#phone').val() ) return $('a[name=guest_login]').removeAttr('disabled');
            return $('a[name=guest_login]').attr('disabled','disabled');
        }
        
    },
    do_login:function(){
        console.trace();
        var self = this;          
        var rpc = this.app.get_rpc('/web/session/authenticate');
        var params = { db      : this.app.dbname,
                       login   : $('#username').val(),
                       password: $('#password').val() };
        this.show_loading();
        localStorage.clear();
        
        localStorage[this.app._name] = JSON.stringify(this.app.config);
        return rpc.call('authenticate',params,{}).then(function(res){                            
            console.log(res);
            self.app.ensure_db(res).done(_.bind(self.app.default_action,self));
        }).fail(function(err){
            Utils.toast("Login Failed.\nPlease confirm your credential on server.");
        });
    },
    guest_login:function(){
        console.trace();
        var params = { 'name'    : $('[name=name]').val(),
                       'phone'   : $('[name=phone]').val(),
                       'email'   : $('[name=email]').val(),
                      }                      
        var rpc = this.app.get_rpc('/web/session/authenticate');
        console.log(params);
    },
    
});
 
})