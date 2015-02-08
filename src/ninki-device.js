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
            if (chrome) {
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

    this.isBrowser = isBrowser;
    function isBrowser() {

        if (typeof window === 'undefined') {

            return false;

        } else {

            if (typeof window.cordova === 'undefined') {

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

}

module.exports = Device;
