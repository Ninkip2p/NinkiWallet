var localStorage = require('browser-storage');

function Device() {


    this.isChromeApp = isChromeApp;
    function isChromeApp() {


        if (typeof window === 'undefined') {

            return false;

        }

        if (isCordova()) {
            return false;
        }

        var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
        if (is_chrome) {
            if (!(typeof chrome === 'undefined')) {
                if (chrome.app) {
                    if (chrome.app.runtime) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    this.isNode = isNode;
    function isNode() {

        if (typeof window === 'undefined') {

            return true;

        } else {
            return false;
        }

    }

    this.isCordova = isCordova;
    function isCordova() {

        if (typeof window === 'undefined') {
            return false;
        } else {
            if (typeof window.cordova === 'undefined') {
                return false;
            }
            else {
                return true;
            }
        }

    }

    this.isiOS = isiOS;
    function isiOS() {

        if (typeof window === 'undefined') {
            return false;
        } else {
            if (typeof window.cordova === 'undefined') {
                return false;
            }
            else {
                if (device.platform == "iOS") {

                    return true;

                } else {

                    return false;

                }
            }
        }

    }


    this.isBrowser = isBrowser;
    function isBrowser() {

        if (typeof window === 'undefined') {

            return false;

        } else {

            if (typeof window.cordova === 'undefined') {

                //switch to false for mob 
                return true;

            } else {

                return false;
            }

        }

    }

    this.getStorageItem = getStorageItem;
    function getStorageItem(cname, callback) {


        if (isChromeApp()) {

            chrome.storage.local.get(cname, function (result) {

                if (result[cname]) {
                    result = result[cname];
                } else {
                    result = "";
                }

                return callback(result);

            });

        } else {

            if (localStorage.getItem(cname)) {
                return callback(localStorage.getItem(cname));
            } else {
                return callback('');
            }

        }

    }

    this.setStorageItem = setStorageItem;
    function setStorageItem(cname, cvalue) {


        if (isChromeApp()) {

            var obj = {};
            obj[cname] = cvalue;
            chrome.storage.local.set(obj, function () {

                console.log("saved");

            });

        }
        else {

            localStorage.setItem(cname, cvalue);

        }


    }

    this.deleteStorageItem = deleteStorageItem;
    function deleteStorageItem(cname) {


        if (isChromeApp()) {

            chrome.storage.local.remove(cname, function () {

                console.log("deleted");

            });

        } else {

            localStorage.removeItem(cname);

        }
    }




    this.setSecureStorageObject = setSecureStorageObject;
    function setSecureStorageObject(cname, cvalue, key, encryptor, expiry) {


        if (isChromeApp()) {

            var encp = encryptor(cvalue, key);
            var ptok = {};
            ptok.ct = encp.toString();
            ptok.iv = encp.iv.toString();

            if (expiry) {
                ptok.date = new Date();
                ptok.expiry = expiry;
            }

            var ptoken = JSON.stringify(ptok);

            var obj = {};
            obj[cname] = ptoken

            chrome.storage.local.set(obj, function () {

                console.log("saved");

            });

        }
        else {

            var encp = encryptor(cvalue, key);
            var ptok = {};
            ptok.ct = encp.toString();
            ptok.iv = encp.iv.toString();

            if (expiry) {
                ptok.date = new Date();
                ptok.expiry = expiry;
            }

            var ptoken = JSON.stringify(ptok);
            localStorage.setItem(cname, ptoken);

        }


    }


    this.getSecureStorageObject = getSecureStorageObject;
    function getSecureStorageObject(cname, key, decryptor, asbytes, callback) {

        if (isChromeApp()) {

            chrome.storage.local.get(cname, function (result) {

                result = result[cname];

                if (!(typeof result === 'undefined')) {
                    var decryptok = true;
                    var datac = "";
                    try {

                        var enc = JSON.parse(result);

                        if (enc.date) {
                            if (enc.expiry) {
                                var currentdate = new Date();
                                if (((new Date) - new Date(enc.date)) < enc.expiry) {
                                    datac = decryptor(enc.ct, key, enc.iv, asbytes);
                                }
                            }
                        } else {
                            datac = decryptor(enc.ct, key, enc.iv, asbytes);

                        }

                    } catch (error) {
                        decryptok = false;
                    }

                    result = "";
                    if (decryptok) {
                        result = datac;
                    }
                    return callback(result);

                } else {

                    return callback("");

                }



            });

        } else {

            if (localStorage.getItem(cname)) {

                result = localStorage.getItem(cname);

                if (result != "") {
                    var decryptok = true;
                    var datac = "";
                    try {
                        var enc = JSON.parse(result);

                        if (enc.date) {
                            if (enc.expiry) {
                                var currentdate = new Date();
                                if (((new Date) - new Date(enc.date)) < enc.expiry) {
                                    datac = decryptor(enc.ct, key, enc.iv, asbytes);
                                }
                            }
                        } else {
                            datac = decryptor(enc.ct, key, enc.iv, asbytes);
                        }
                      
                    } catch (error) {
                        decryptok = false;
                    }

                    result = "";
                    if (decryptok) {
                        result = datac;
                    }

                }

                return callback(result);

            } else {
                return callback('');
            }

        }

    }


}

module.exports = Device;
