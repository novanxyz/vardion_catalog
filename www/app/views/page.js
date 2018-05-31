define(function(require){
  var Base     = require('models/base');             
  var Utils    = require('utils');             
  var tmpl     = require('text!templates/home.html');
  
  var PageView = Base.Page.extend({
       _name : 'home',
       events:{           
       },
       initialize:function(app){          
          Base.Page.prototype.initialize.apply(this,arguments);
       },
       prepare:function(){
           var self = this;
           return;
           var models ={'website.menu/get_tree': {  'args':[1], 
                                                    'loaded':function(res){
                                                        console.log(res);
                                                        var rpc = this.app.get_rpc('/web/dataset/call');                                                       
                                                        return rpc.call('ir.ui.view','render_template',['website.homepage',self.app.context])
                                                                .then(_.bind(self.save_template,self));
                                                    } 
                                                },
                        
                        };
            Utils.get_data(models);
       },
       save_template:function(tmpl){
           console.log(tmpl);
       },
       start:function(){
           var href = window.location.hash;
           console.log('home');
           this.render('homepage');
       },
       render:function(page){
           var self = this;
           if (!$('head base').length )
                $('head').append('<base href="'+this.app.url+'">');
           try {
               $.get(this.app.url + '/page/'+page).then(function(html){
                   self.$el.find('main').replaceWith( $(html).find('main').addClass('page') ) ;   
               })               
           }catch(ex){
               console.log(page,ex);
           }
            
       }
  });
  
  return PageView;  
});