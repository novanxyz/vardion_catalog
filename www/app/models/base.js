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
                            $('#loading').show();
                        },
                        hide_loading:function(){
                            $('#loading').hide();
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
                          this.$el.on('click','.btn[name]',_.bind(this.button_handler,this));
                          this.ready = $.when();
                          return this;
                        },
                        
                        prepare:function(){
                            return true;
                            var tpl = require('text!templates/' + this._name +'.html');                              
                            this.app.qweb.add_template(Utils.make_template(this._name,tpl));
                        },
                        render:function(){                            
                            try {
                                this.$el.find('main').replaceWith(this.app.qweb.render(this._name,this));
                            }catch(ex){
                                console.log(ex);
                            }                                                        
                            return this;
                        },
                        start:function(){
                            var self = this;
                            this.ready.done(function(){
                                self.render();
                                self.show();
                            })
                            
                        },
                        show:function(){
                            $('main').hide();
                            this.$el.find('main').show();
                            this.hide_loading();
                        },
                        hide:function(){
                            this.$el.find('main').hide();
                        },
                        show_loading:function(){                            
                            $('#loading').show();
                        },
                        hide_loading:function(){                            
                            $('#loading').hide();
                        },                        
                        button_handler:function(ev){
                            console.log(this,ev, ($(ev.currentTarget).attr('name')));
                            return _.result(this,($(ev.currentTarget).attr('name')));
                        }
                    }),
        
    
    }        
});