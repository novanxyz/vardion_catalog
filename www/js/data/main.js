var SERVER_URL = 'http://pos.vardion.com';
var DB_ID = 'pos-catalog@';
var context = {};
var DB = {    
    get_backlogs:function(){
        return this.load('backlogs');       
    },
    get_workeds:function(){
        return this.load('workeds');        
    },
    get_products:function(){
        return this.load('products');        
    },
    get_packages:function(){
        return this.load('packages');
    },
    get_product:function(product_id){
        return _(this.get_products()).find({'id':product_id});
    },
    get_package:function(package_id){        
        return _(this.get_packages()).find({'id':package_id}) || _(this.get_packages()).find({'name':package_id});
    },
    load:function(name,def){
        if (!def) {def = '[]';}
        return JSON.parse(localStorage[DB_ID + name] || def);
    },
    save:function(name,data){
        localStorage[DB_ID + name] = JSON.stringify(data);        
    }
};
function login (db,username,password){
    var params = {};
    params.db = db;
    params.login = username;
    params.password = password;
    rpc(SERVER_URL+'/web/session/authenticate', params)
}
function search_read (){
    rpc(SERVER_URL+'/web/dataset/search_read',
    { model  : 'product.product',
      domain : [['sale_ok','=',true]],
      fields : ['name','display_name','type','categ_id','list_price','available_in_pos','description_sale','image']|| [],
      limit  : 80,
      offset : 0,
      context: {}
  })
}
function save_img(fileName,data){
    var fileDir = cordova.file.externalDataDirectory.replace(cordova.file.externalRootDirectory, '');
    var filePath = fileDir + fileName;
    var contentType = "image/png";
    var DataBlob = b64toBlob(data,contentType);
    fs.root.getFile(filePath, { create: true}, function (fileEntry) {
        writeFile(fileEntry, DataBlob, true).then(function(){
//            alert('done')
        });
    }, function(err) {alert(err)});
}

