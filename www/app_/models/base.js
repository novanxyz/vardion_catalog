define(function(require){
    var Backbone = require('backbone');    
    var Utils = require('utils');
    Backbone.emulateJSON = true;
    Backbone.emulateHTTP = true;
    var pop = [].pop;

    return {
        Model:      Backbone.Model.extend({                        
                        initialize:function(args,app){
                            this.app = app;            
                            if (arguments.length> 1){
                                pop.call(arguments);
                            }
                            Backbone.Model.prototype.initialize.apply(this,arguments);                    
                        },
                    }), 
        Collection: Backbone.Collection.extend({
                        initialize:function(data,app){                            
                            this.app = app;                            
                            if (arguments.length> 1){
                                pop.call(arguments);
                            }
                            Backbone.Collection.prototype.initialize.apply(this,arguments);                    
                        },
                    }),
        Widget:     Backbone.View.extend({
                        initialize:function(app){                            
                            this.app = app;                            
                            if (arguments.length> 1){
                                pop.call(arguments);
                            }
                            Backbone.View.prototype.initialize.apply(this,arguments);                    
                        },
                        start:function(){
                            this.render();
                            this.$el.show().removeClass('hide');
                        },
                        show_loading:function(){
                            console.log('show loading');
                        },
                        hide_loading:function(){
                            console.log('hide loading');
                        },
                        show:function(){                            
                            this.$el.show();
                        },
                        hide:function(){
                            this.$el.hide();
                        }
                    }),
                    
        Page:       Backbone.View.extend({
                        el: document.querySelector('main'),
                        initialize:function(app){                          
                          this.app = app;
                          //Backbone.View.prototype.initialize.apply(this,arguments);                                                                                
                          console.log(this._name,app,arguments);
                          try {                              
                              var tpl = require('text!templates/' + this._name +'.html');                              
                              this.app.qweb.add_template(Utils.make_template(this._name,tpl));
                          }catch(x){
                              console.log(x);
                          }
                          this.ready = $.when().promise();
//                          return this;
                        },
                        prepare:function(){
                            return true;
//                            var tpl = require('text!templates/' + this._name +'.html');                            
//                            this.app.qweb.add_template(Utils.make_template(this._name,tpl));
                        },
                        render:function(){
                            console.log(this._name);
                            console.trace();
                            try {                                
                                this.el.outerHTML = (this.app.qweb.render( this._name, this ));
                                console.log(this._name);
                            }catch(ex){
                                console.log('__render__' ,ex,this);
                            }                            
                            //return this;
                        },
                        show:function(){                            
                            $('body').addClass(this._name);
                            $('#loading').hide();        
                        },
                        hide:function(){
                            this.$el.hide();
                            $('body').removeClass(this._name);
                        },
                        start:function(){
                            this.render();
                            this.show();                            
                        },
                        show_loading:function(){
                              $('#loading').show();        
                        },
                        hide_loading:function(){
                              $('#loading').hide();        
                        }   
                    })
        
    
    }        
});