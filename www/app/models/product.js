define(['models/base','utils','localstorage'],function(Base,Utils,localstorage){
    var Product = Base.Model.extend({     
        _name : 'product',
        initialize:function(args,app){
          Base.Model.prototype.initialize.apply(this,arguments);          
          this.app = app.collection.app;
        },
        get_image_url:function(app){          
          app = app || this.app;          
          return app.data_dir + 'product.product/image/'+ this.id +'.png';          
        },
        get_display_name:function(){
            return this.get('name');
        },
        get_display_price:function(){
            return this.get('list_price');
        },
        get_price:function(){
            return this.get('list_price');
        },
        parse:function(json){            
            if (json.image){
                this.save_image(json.id,json.image);
            }            
            delete json.image;
            json.categ_id = json.categ_id ? {id: json.categ_id[0],name:json.categ_id[1].split('/').pop().trim() } : false;
            return json;
        },
        save_image:function(id,base64){
            return Utils.saveBase64( 'product.product/image',  id + '.png',base64,'image/png');
        },
    });
    
    var ProductCollection = Base.Collection.extend({
        _name : 'products',
        model:  Product,                
        offset: 0,
        initialize:function(args,app){
          Base.Collection.prototype.initialize.apply(this,arguments);          
          this.rpc = this.app.get_rpc('/web/dataset/search_read'),                  
          this.localStorage= new localstorage.LocalStorage(this.app.DB_ID + '_'+ this._name);            
        },
        search_param:function(){
            return {
                model:  'product.product', 
                context: this.app.context,
                domain: [['sale_ok','=',true],['available_in_pos','=',true]],
                fields: ['id','name','description_sale','default_code','barcode','categ_id','list_price','standard_price','qty_available','image'],
                limit: 25,
                offset: this.offset,
            }
        },
        methods: {
            read: ['call', 'search_param' ],
        },
        get_categories:function(){
            var categs = _.chain(this.models)
                    .pluck('attributes')
                    .pluck('categ_id')
                    .reduce(function(p,c){p[c.id] = c.name; return p;},{})
                    .map(function(c,i){return {id:i,name: c };})
                    .value();            
            return categs;            
        },
        load:function(){
            var products = JSON.parse(localStorage[this.localStorage.name] || '[]');                        
            if (products.length) {                         
                this.add(products.records);
                this.trigger('refresh');
                return $.Deferred().resolve(products.records);
            }            
            return this.fetch().done(_.bind(this.save,this));            
        },
        save:function(){
            var json = {records:this.toJSON(),length:this.length};            
            localStorage[this.localStorage.name] = JSON.stringify(json);            
        },
        parse:function(res){        
            this.offset = this.length + res.records.length;
            return res.records;
        }, 
        prepare_directory:function(dir){                        
            dir = dir || this.app.dir;
            console.log(this.app);
            console.trace();
            if (!dir && this.app.data_dir ) {return resolveLocalFileSystemURL(this.app.data_dir,_.bind(this.prepare_directory,this));}            
            if (!dir) return;
            dir.getDirectory('product.product',{create:true},function(proddir){
                proddir.getDirectory('image',{create:true},function(imagedir){
                });
            });
        },
        clean:function(){
            this.localStorage._clear();
        }
        
    });

    return {
        Product             : Product, 
        ProductCollection   : ProductCollection
    };
})