Cordova FileStorage Plugin
==========================

This plugin offers a wrapper around the handling with content and file URIs. It offers a functions for users to select a file on the device or dropbox and the read from it and write to it without the need to process the URIs used by android to describe files. 

Install
-------

Install with Cordova CLI

```$ cordova plugin add https://github.com/DFranzen/cordova-FileStorage.git```

JavaScript API
--------------

The API is accessible via the global object `fileStorage`. After the `deviceready` event has been fired, the functions can be accessed as the fields of this object:
```
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady () {
    console.log(fileStorage);
}
```

__open__

After this, a storage URI can be obtained from the user by calling
```fileStorage.open(success, error);```

It displays a choice to the user to open a file from android's standard file choosing dialog or the Dropbox app. After the user chooses, one of the callback functions is called with the result

```
function success (uri) {
    console.log(uri);
}

function error (errorMsg) {
    console.log(errorMsg);
}
```

The uri returned to the ```success``` function is a string representation of either a ```file://``` or ```content://``` describing a local or remote content. This string has to be passed to the other API functions to describe the chosen file.

__readFromUri__
To read the content of a file with the obtained uri call:
```
fileStorage.readFromUri(success, error, uri)
```
One of the callback functions will be called with the result:
```
function success (data) {
    console.log(data);
}

function error (errorMsg) {
    console.log(errorMsg);
}
```

__writeToUri__
To overwrite the content of a file with the obtained uri call:
```
fileStorage.writeToUri(success, error, uri, data)
```
The parameter `data` is a string which will be the content of the file described by uri on success. One of the callback functions will be called with the result:
```
function success () {
    console.log("written");
}

function error (errorMsg) {
    console.log(errorMsg);
}
```

__appendToUri__
To append a string to the content of a file with the obtained uri call:
```
fileStorage.appendToUri(success, error, uri, data)
```
One of the callback functions will be called with the result:
```
function success () {
    console.log("written");
}

function error (errorMsg) {
    console.log(errorMsg);
}
```

File Handling
-------------

If the runtime permission to read / write the file-system is not currently held by the app, all functions prompt the user to grant the permission and call the `error` callback with an appropriate error message. The API does *not* try to re-execute the operation after the permission has been granted.

All files which are read from and written to are opened if necessary and closed after the operation. No further handling is necessary.


Supported Platforms:
--------------------

Android

Tested on
---------

Cordova: 6.4.0
PhoneGap: 6.4.2

Android: 6.0.1