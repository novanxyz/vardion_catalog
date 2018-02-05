define(['models/base','utils','rpc'],function(Base,Utils,Backbone){
    var Product = Base.Model.extend({     
        _name : 'product',
        get_image_url:function(){          
          return cordova.file.dataDirectory  +'files/pos/product.product/image/'+ this.id +'.png';          
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
            //console.log(this);
            return Utils.saveBase64( 'product.product/image',  id + '.png',base64,'image/png');
        },
    });
    
    var ProductCollection = Base.Collection.extend({
        _name : 'products',
        model:  Product,                
        url:    'http://pos.vardion.com/web/dataset/search_read',
        rpc:    new Backbone.Rpc({namespaceDelimiter:'',
                    errorHandler: function (error) {console.log('Code: ' + error.code + ' Message: ' + error.message);}
                }),        
        offset: 0,
        search_param:function(){
            return {
                model:  'product.product',                
                context:{lang:'en_US','tz':'Asia/Jakarta','uid':1},
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
            var products = JSON.parse(localStorage['DB']);            
            //products = {records:products};
            //products = _(products.records).map(function(p){return new Product(p);});            
            this.add(products);
            this.trigger('refresh');
        },
        save:function(){
            var json = {records:this.toJSON()};
            console.log(json,this.localStorage);
            this.sync('update');
        },
        parse:function(res){        
            this.offset = this.length + res.records.length;
            return res.records;
        }, 
        prepare_directory:function(dir){
            console.log(dir);
            dir.getDirectory('product.product',{create:true},function(proddir){
                proddir.getDirectory('image',{create:true},function(imagedir){
                });
            });
        }
        
    });

    return {
        Product             : Product, 
        ProductCollection   : ProductCollection
    };
})