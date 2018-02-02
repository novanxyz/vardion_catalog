package com.dfranzen.cordova;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.charset.Charset;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.database.DatabaseUtils;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.util.Log;


import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONException;


public class FileStorage extends CordovaPlugin {

    private static final String ACTION_OPEN = "open";
    private static final String ACTION_APPEND_TO_URI = "append_to_uri";
    private static final String ACTION_READ_FROM_URI = "read_from_uri";
    private static final String ACTION_WRITE_TO_URI = "write_to_uri";
    
    private static final int PICK_FILE_REQUEST = 1;

    public static final String READ_PERM = Manifest.permission.READ_EXTERNAL_STORAGE;
    public static final int READ_REQ  = 1;
    public static final String WRITE_PERM = Manifest.permission.WRITE_EXTERNAL_STORAGE;
    public static final int WRITE_REQ = 2;
    public static final String MANAGE_PERM = Manifest.permission.MANAGE_DOCUMENTS;
    public static final int MANAGE_REQ = 3;
    
    public static final int RESULT_CANCELED = Activity.RESULT_CANCELED;
    public static final int RESULT_OK = Activity.RESULT_OK;
	
    CallbackContext callback;

    @Override
    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext) throws JSONException {

        if (action.equals(ACTION_OPEN)) {
            chooseFile(callbackContext);
            return true;
	} else if (action.equals(ACTION_WRITE_TO_URI)) {
	    Uri uri = Uri.parse(args.getString(0));
	    String data = args.getString(1);
	    writeToUri(callbackContext,uri,data);
	    return true;
	} else if (action.equals(ACTION_APPEND_TO_URI)) {
	    Uri uri = Uri.parse(args.getString(0));
	    String data = args.getString(1);
	    appendToUri(callbackContext,uri,data);
	    return true;
	} else if (action.equals(ACTION_READ_FROM_URI)) {
	    Uri uri = Uri.parse(args.getString(0));
	    readFromUri(callbackContext,uri);
	    return true;
	}

        return false;
    }

    public void writeToUri(CallbackContext callbackContext, Uri uri, String data) {
	try {
	    if (!cordova.hasPermission(WRITE_PERM)) {
		cordova.requestPermission(this,WRITE_REQ,WRITE_PERM);
		callbackContext.error("Permission _WRITE_EXTERNAL_STORAGE_ has been requested");
	    } else if (!cordova.hasPermission(READ_PERM)) {
		cordova.requestPermission(this,READ_REQ,READ_PERM);
		callbackContext.error("Permission _READ_EXTERNAL_STORAGE_ has been requested");
	    } else {
		ContentResolver contentResolver = cordova.getActivity().getContentResolver();
		OutputStream outStream = contentResolver.openOutputStream(uri, "w");
		outStream.write(data.getBytes(Charset.forName("UTF-8")));
		outStream.flush();
		outStream.close();
		
		callbackContext.success();
	    }
	} catch (FileNotFoundException e) {
	    callbackContext.error(e.getMessage());
	} catch (IOException e) {
	    callbackContext.error(e.getMessage());
	}
    }

    public void appendToUri(CallbackContext callbackContext, Uri uri, String data) {
	try {
	    if (!cordova.hasPermission(WRITE_PERM)) {
		cordova.requestPermission(this,WRITE_REQ,WRITE_PERM);
		callbackContext.error("Permission _WRITE_EXTERNAL_STORAGE_ has been requested");
	    } else if (!cordova.hasPermission(READ_PERM)) {
		cordova.requestPermission(this,READ_REQ,READ_PERM);
		callbackContext.error("Permission _READ_EXTERNAL_STORAGE_ has been requested");
	    } else {
		ContentResolver contentResolver = cordova.getActivity().getContentResolver();
		OutputStream outStream = contentResolver.openOutputStream(uri, "wa");
		outStream.write(data.getBytes(Charset.forName("UTF-8")));
		outStream.flush();
		outStream.close();
		
		callbackContext.success();
	    }
	} catch (FileNotFoundException e) {
	    callbackContext.error(e.getMessage());
	} catch (IOException e) {
	    callbackContext.error(e.getMessage());
	}
    }

    public void readFromUri(CallbackContext callbackContext, Uri uri) {
	try {
	    if (!cordova.hasPermission(READ_PERM)) {
		cordova.requestPermission(this,READ_REQ,READ_PERM);
		callbackContext.error("Permission _READ_EXTERNAL_STORAGE_ has been requested");
	    } else {
		ContentResolver contentResolver = cordova.getActivity().getContentResolver();
		InputStream inStream = contentResolver.openInputStream(uri);
		
		java.util.Scanner s = new java.util.Scanner(inStream).useDelimiter("\\A");
		String data = s.hasNext() ? s.next() : "";
		inStream.close();
		
		callbackContext.success(data);
	    }
	} catch (FileNotFoundException e) {
	    callbackContext.error(e.getMessage());
	}catch (IOException e) {
	    callbackContext.error(e.getMessage());
	}
    }
    
    public void chooseFile(CallbackContext callbackContext) {
	Intent pickIntent = new Intent(Intent.ACTION_PICK);
	pickIntent.setType("text/*");
	pickIntent.addCategory(Intent.CATEGORY_OPENABLE);
	
	Intent dropboxIntent = new Intent(Intent.ACTION_GET_CONTENT);
	dropboxIntent.setPackage("com.dropbox.android");
	dropboxIntent.setType("text/*");
	dropboxIntent.addCategory(Intent.CATEGORY_OPENABLE);

	Intent documentIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT); //ACTION_CREATE_DOCUMENT);  //ACTION_OPEN_DOCUMENT  //ACTION_GET_CONTENT
	documentIntent.setType("text/*");
        documentIntent.addCategory(Intent.CATEGORY_OPENABLE);
	
	Intent chooserIntent = Intent.createChooser(pickIntent, "Select a file to add");
	chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{documentIntent, dropboxIntent});
	
	cordova.startActivityForResult(this, chooserIntent, PICK_FILE_REQUEST);

        PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
        pluginResult.setKeepCallback(true);
        callback = callbackContext;
        callbackContext.sendPluginResult(pluginResult);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
	if (callback == null) {
	    return;
	}

	if (resultCode != RESULT_OK) {
	    callback.error(resultCode);
	    return; 
	}
	
	Uri uri = data.getData();
	if (uri.getScheme() == "content") {
	    final int takeFlags = data.getFlags()
		& (Intent.FLAG_GRANT_READ_URI_PERMISSION
		   | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
	    // Check for the freshest data.
	    final Context context = this.cordova.getActivity();
	    context.getContentResolver().takePersistableUriPermission(uri, takeFlags);
	}

        if (requestCode == PICK_FILE_REQUEST) {
	    callback.success(uri.toString());
        }
    }
}
