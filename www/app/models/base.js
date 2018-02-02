define(function(require){
    var Backbone = require('backbone');
    var localstorage = require('localstorage');
    var Utils = require('utils');
    Backbone.emulateJSON = true;
    Backbone.emulateHTTP = true;
    var pop = [].pop;

    return {
        Model:      Backbone.Model.extend({
                        localStorage: new localstorage.LocalStorage(this._name),
                        initialize:function(args,app){
                            this.app = app;
                            pop.call(arguments);
                            Backbone.Model.prototype.initialize.apply(this,arguments);                    
                        },
                    }), 
        Collection: Backbone.Collection.extend({
                        localStorage: new localstorage.LocalStorage(this._name),
                        initialize:function(data,app){                            
                            this.app = app;
                            pop.call(arguments);
                            console.log(arguments);
                            Backbone.Collection.prototype.initialize.apply(this,pop);                    
                        },
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
                            console.log(this);
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
                    })
    
    }        
});