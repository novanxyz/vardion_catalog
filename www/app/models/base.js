define(function(require){
    var Backbone = require('backbone');    
    var Utils = require('utils');
    Backbone.emulateJSON = true;
    Backbone.emulateHTTP = true;
    var pop = [].pop;

    var Base = {
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
                Backbone.View.prototype.initialize.apply(this,arguments);                          
                if (!this._name) return this;
                try {

                    var tpl = require('text!templates/' + this._name +'.html');
                    //console.log(this,tpl);
                    this.app.qweb.add_template(Utils.make_template(this._name,tpl));
                }catch(x){
                    console.log(x);
                }
//                this.$el.on('click','.btn[name]',_.bind(this.button_handler,this));
                this.ready = $.when();
                return this;
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

    };
    Base.Popup = Base.Widget.extend({
        render:function(){                            
                try {                                
                    this.$el = $(this.app.qweb.render(this._name,_(this).clone()) );
                    this.$el.prependTo('body');
                }catch(ex){
                    console.log(ex);
                }                                                        
                return this;
            },
        show:function(){
            this.$el.modal('show');
        },
        close:function(){
                this.$el.remove();
            },
    });
    Base.Page = Base.Widget.extend({
                el: document.querySelector('body'),
                withnav:true,
                initialize:function(app){                          
                  Base.Widget.prototype.initialize.apply(this,arguments);                                                      
                  this.$el.on('click','.btn[name]',_.bind(this.button_handler,this));
                  return this;
                },                        
                prepare:function(){
                    return true;
                    var tpl = require('text!templates/' + this._name +'.html');                              
                    this.app.qweb.add_template(Utils.make_template(this._name,tpl));
                },
                render:function(){                            
                    try {                                
                        this.$el.find('main').replaceWith(this.app.qweb.render(this._name,_(this).clone()) );
//                        this.el = document.querySelector('main.page');
//                        this.$el = $(this.el);                        
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
                    $('main').show();
                    $('#loading').hide();
                    $('#menu').removeClass('show');
                },
                button_handler:function(ev){                            
                    var name = ($(ev.currentTarget).attr('name'));
//                    console.log(this,this.prototype,this.__proto__[name]);
                    return _.result(this,name);//.call(this,arguments);
                    return this.__proto__[name].call(this,arguments);
                    return _.bind(this.name,this).call(this,arguments);
                    //return _.result(this,namearguments);                            
                }        
    });
    return Base;
});