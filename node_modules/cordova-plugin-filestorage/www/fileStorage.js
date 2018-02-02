module.exports = {
    open: function (success, failure) {
        window.cordova.exec(success, failure, "FileStorage", "open", []);
    },
    openPath: function (success, failure) {
        window.cordova.exec(success, failure, "FileStorage", "open_path", []);
        },
    readFromUri: function (success, failure, uri) {
        window.cordova.exec(success, failure, "FileStorage", "read_from_uri", [uri]);
    },
    writeToUri: function (success, failure, uri, data) {
        window.cordova.exec(success, failure, "FileStorage", "write_to_uri", [uri, data]);
    },
    appendToUri: function (success, failure, uri, data) {
        window.cordova.exec(success, failure, "FileStorage", "append_to_uri", [uri, data]);
    }
};
