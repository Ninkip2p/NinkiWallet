var Bitcoin2 = require('bitcoinjs-lib');
var CryptoJS = require('crypto-js');

var assert = function(condition, message) {
	if (!condition) {
		throw message || "Assertion failed";
	}
};

//Checks if GUID is valid. Only takes lowercase, non-bracketed GUIDs.
var isRealGuid = function(potentialGuidAsString){
	if (!potentialGuidAsString) return false;
	if (typeof potentialGuidAsString != 'string') return false;
	if (potentialGuidAsString.length==0) return false;

	var guidRegex=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
	var match = potentialGuidAsString.match(guidRegex);
	return match ? true:false;
};

var encrypt = function (valueToEncrypt, passphrase) {
    assert(valueToEncrypt, "valueToEncrypt invalid");
    assert(passphrase, "Passphrase invalid");
    assert(typeof passphrase == 'string', "Passphrase invalid (non string)");

    valueToEncrypt = JSON.stringify(valueToEncrypt);

    var key = CryptoJS.enc.Hex.parse(passphrase);

    var iv = new Uint8Array(32);
    var ivbytes = [];
    window.crypto.getRandomValues(iv);
    for (var i = 0; i < iv.length; ++i) {
        ivbytes[i] = iv[i];
    }

    var ivwords = Bitcoin2.convert.bytesToWordArray(ivbytes);

    var encrypted = CryptoJS.AES.encrypt(valueToEncrypt, key, { iv: ivwords });

    //var test = encrypted.iv.toString();

    return encrypted;
};

var decrypt = function (encryptedObj, passphrase, iv) {
    assert(encryptedObj, "encryptedObj invalid");
    assert(passphrase, "Passphrase invalid");
    assert(typeof passphrase == 'string', "Passphrase invalid (non string)");

    var key = CryptoJS.enc.Hex.parse(passphrase);
    var iv = CryptoJS.enc.Hex.parse(iv);

    var decryptedObject = CryptoJS.AES.decrypt(encryptedObj, key, { iv: iv });

    var decryptutf = decryptedObject.toString(CryptoJS.enc.Utf8);
    var decryptjson = JSON.parse(decryptutf);
    return decryptjson;
};
