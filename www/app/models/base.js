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
                        el: document.getElementsByTagName('body')[0],
                        withnav:true,
                        initialize:function(app){                          
                          this.app = app;                          
                          Backbone.View.prototype.initialize.apply(this,arguments);                          
                          if (!this._name) return this;
                          try {
                              
                              var tpl = require('text!templates/' + this._name +'.html');
                              //console.log(this,tpl);
                              this.app.qweb.add_template(Utils.make_template(this._name,tpl));
                          }catch(x){
                              console.log(x);
                          }
                          return this;
                        },
                        prepare:function(){
                            var tpl = require('text!templates/' + this._name +'.html');
                              //console.log(this,tpl);
                            this.app.qweb.add_template(Utils.make_template(this._name,tpl));
                        },
                        render:function(){
                            var nav = $('nav');                                        
                            try {
                                this.$el.html(this.app.qweb.render(this._name,this));
                            }catch(ex){
                                console.log(ex);
                            }
                            
                            this.$el.prepend(nav);
                            if (this.withnav){
                                this.$el.find('nav').show();
                            }else{
                                this.$el.find('nav').hide();                                
                            }
                            return this;
                        },
                        start:function(){
                            this.render();
                            this.$el.find('main').show().removeClass('hide');
                        },
                        show_loading:function(){
                            console.log('show loading');
                        },
                        hide_loading:function(){
                            console.log('hide loading');
                        },
                        show:function(){
                            $('main').hide();
                            this.$el.find('main').show();
                        },
                        hide:function(){
                            this.$el.find('main').hide();
                        }
                    }),
        
    
    }        
});