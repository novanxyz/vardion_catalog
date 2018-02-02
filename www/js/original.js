function b64toBlob(base64, sliceSize) {
        contentType = 'image/png';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(base64);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

      var blob = new Blob(byteArrays, {type: contentType});
      return blob;
}

function saveImage(base64,path,filename){
        var fileDir = cordova.file.externalDataDirectory.replace(cordova.file.externalRootDirectory, '');

        var dir = fileDir + path;
        var filePath = dir + filename;
        data_dir.root.getDirectory(dir, { create: true }, function () {
        return data_dir.root.getFile(filePath,{'create':true},function(file){
                file.createWriter(function(writer){      
                    var blob = b64toBlob(base64)
                    writer.write(blob);
                });
            });
        });
}

function render_product(name){
    var products = JSON.parse(localStorage[name]);
    var categs = {};
    var prods = {};
    for (var i = 0; i < products.length; i++) {          
        categs[products[i].categ_id[0]] = products[i].categ_id[1];
    }
    prods = products
    var prod_tpl = _.template($('#prods_template').html());
    var prod_data = {prod : prods};
    $('#prods .row').html(prod_tpl(prod_data));


    categs = $.map(categs, function(value, index) {
        return {'id':index,'name' : value};
    });
    var categ_tpl = _.template($('#categs_template').html());
    var categ_data = {c: categs};
    $('#categs .card-deck').html(categ_tpl(categ_data));

    $('img').on('error', function(){
        $(this).attr('src', 'img/placeholder.png');
    });
}

function fetch_product(domain){
    return rpc(SERVER_URL+'/web/dataset/search_read',
                    { model  : 'product.product',
                      domain : [['sale_ok','=',true]],
                      fields : ['name','display_name','type','categ_id','list_price','available_in_pos','description_sale','image']|| [],
                      limit  : 80,
                      offset : 0,
                      context: {}
                  }).then(function(data){
                    data = data.records;
                    var images= {};
                    for (var i = 0; i < data.length; i++) {                        
                        images[data[i].id] = data[i].image;
                        delete data[i].image;
                    };
                    localStorage.setItem('DB', JSON.stringify(data));
                    for (var im in images ){
                        if(images[im] ){
                            saveImage(images[im], 'product.product/', im + '.png' );
                        }
                    }
                    render_product('DB');
                  }).fail(function(){
                    render_product('DB');
                  });
}

function render_orders(order){
 // render summary panel
 // render order line
 // render tab
 
}
