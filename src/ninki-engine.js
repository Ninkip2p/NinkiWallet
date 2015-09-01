//ninki-engine

var Bitcoin = require('bitcoinjs-lib');
var openpgp = require('openpgp');
var CryptoJS = require('crypto-js');
var API = require('./ninki-api');
var device = require('./ninki-device');
var BIP39 = require('./bip39');
var uuid = require('node-uuid');
var sjcl = require('sjcl');
var sanitizer = require('sanitizer');
var crypto = require('crypto');

function Engine() {

    this.m_network = "mainnet";
    this.m_walletinfo = {};
    this.m_sharedid = '';
    this.m_twoFactorOnLogin = false;
    this.m_nickname = '';
    this.m_profileImage = '';
    this.m_statusText = '';
    this.m_guid = '';
    this.m_oguid = '';
    this.m_password = '';
    this.m_settings = {};
    this.m_validate = false;
    this.m_fingerprint = '';
    this.m_secret = '';
    this.m_migrateBeta12fa = false;
    this.m_invoiceTax = 0.1;
    this.m_offlineKeyBackup = false;
    //keys for PGP
    this.m_privKey = '';
    this.m_pubKey = '';
    this.m_privKeyRaw = '';
    this.m_pubKeyRaw = '';
    //online EC key
    this.m_onlineKey = [];
    this.m_deviceKey = [];
    this.m_deviceSecKey = [];
    this.m_regToken = '';
    this.m_deviceToken = [];
    this.m_APIToken = '';
    this.m_appInitialised = false;
    this.m_watchOnly = false;

    m_this = this;

    this.Device = new device();


    this.appHasInit = appHasInit;
    function appHasInit() {

        if (m_this.m_sharedid.length > 0) {
            return true;
        } else {
            return false;
        }

    }

    this.serialize = serialize;
    function serialize() {

        var serTarget = {};
        serTarget.m_walletinfo = m_this.m_walletinfo;
        serTarget.m_sharedid = m_this.m_sharedid;
        //serTarget.m_twoFactorOnLogin = m_this.m_twoFactorOnLogin;
        serTarget.m_nickname = m_this.m_nickname;
        //serTarget.m_profileImage = m_this.m_profileImage;
        //serTarget.m_statusText = m_this.m_statusText;
        serTarget.m_guid = m_this.m_guid;
        //serTarget.m_settings = m_this.m_settings;
        serTarget.m_fingerprint = m_this.m_fingerprint;
        //serTarget.m_secret = m_this.m_secret;
        serTarget.m_invoiceTax = m_this.m_invoiceTax;

        serTarget.m_privKeyRaw = m_this.m_privKeyRaw;
        serTarget.m_pubKeyRaw = m_this.m_pubKeyRaw;

        return JSON.stringify(serTarget);

    }

    this.initialize = initialize;
    function initialize(cache) {

        m_this.m_walletinfo = cache.m_walletinfo;
        m_this.m_sharedid = cache.m_sharedid;
        //m_this.m_twoFactorOnLogin = cache.m_twoFactorOnLogin;
        m_this.m_nickname = cache.m_nickname;
        //m_this.m_profileImage = cache.m_profileImage;
        //m_this.m_statusText = cache.m_statusText;
        m_this.m_guid = cache.m_guid;
        //m_this.m_settings = cache.m_settings;
        m_this.m_fingerprint = cache.m_fingerprint;
        //m_this.m_secret = cache.m_secret;
        m_this.m_invoiceTax = cache.m_invoiceTax;

        var privKeys = openpgp.key.readArmored(cache.m_privKeyRaw);
        var publicKeys = openpgp.key.readArmored(cache.m_pubKeyRaw);

        if (privKeys.keys[0].decrypt(m_this.m_sharedid)) {
            m_this.m_privKey = privKeys.keys[0];
        }

        m_this.m_pubKey = publicKeys.keys[0];


        cache = {};
    }


    this.setSecDeviceKey = setSecDeviceKey;
    function setSecDeviceKey() {
        //set a secondary encryption key that does not
        //require the PIN each time to retreive
        m_this.m_deviceSecKey = SHA256(m_this.m_deviceKey);
    }

    this.appHasLoaded = appHasLoaded;
    function appHasLoaded() {

        // m_this.m_password = '';

    }


    this.isRealGuid = isRealGuid;
    //Checks if GUID is valid. Only takes lowercase, non-bracketed GUIDs.
    function isRealGuid(potentialGuidAsString) {

        if (!potentialGuidAsString) return false;
        if (typeof potentialGuidAsString != 'string') return false;
        if (potentialGuidAsString.length == 0) return false;

        var guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
        var match = potentialGuidAsString.match(guidRegex);
        return match ? true : false;
    }

    //remove this method
    //generate server side
    this.fillElementWithGuid = fillElementWithGuid;
    function fillElementWithGuid(element) {
        //assert(element, "Element not specified");
        element.val(uuid.v4());
    }

    this.getguid = getguid;
    function getguid() {
        //assert(element, "Element not specified");
        return uuid.v4();
    }



    //use this in production

    function getRandomValues(b) {
        var rng = new Uint8Array(b);
        window.crypto.getRandomValues(rng);
        return rng;
    }

    this.generateToken = generateToken;
    function generateToken() {

        var rng = getRandomValues(32);

        var bytes = [];
        for (var i = 0; i < rng.length; ++i) {
            bytes[i] = rng[i];
        }

        return Bitcoin.convert.bytesToHex(bytes);

    }


    //only use for testing

    //    function getRandomValues(b) {

    //        var rng = new Uint8Array(b);
    //        if (typeof window === 'undefined') {
    //            //this is to support the test scripts
    //            //which are executed using node.js
    //            var buf = crypto.randomBytes(256);
    //            rng = new Uint8Array(buf);

    //        } else {

    //            window.crypto.getRandomValues(rng);
    //        }

    //        return rng;
    //    }

    sjcl.codec.bytes = {
        /** Convert from a bitArray to an array of bytes. */
        fromBits: function (arr) {
            var out = [], bl = sjcl.bitArray.bitLength(arr), i, tmp;
            for (i = 0; i < bl / 8; i++) {
                if ((i & 3) === 0) {
                    tmp = arr[i / 4];
                }
                out.push(tmp >>> 24);
                tmp <<= 8;
            }
            return out;
        },
        /** Convert from an array of bytes to a bitArray. */
        toBits: function (bytes) {
            var out = [], i, tmp = 0;
            for (i = 0; i < bytes.length; i++) {
                tmp = tmp << 8 | bytes[i];
                if ((i & 3) === 3) {
                    out.push(tmp);
                    tmp = 0;
                }
            }
            if (i & 3) {
                out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
            }
            return out;
        }
    };

    this.zeroOnlineKey = zeroOnlineKey;
    function zeroOnlineKey() {
        for (var i = 0; i < this.m_onlineKey.length; ++i) {
            this.m_onlineKey[i] = 0;
        }
    }

    this.zeroDeviceKey = zeroDeviceKey;
    function zeroDeviceKey() {
        for (var i = 0; i < this.m_deviceKey.length; ++i) {
            this.m_deviceKey[i] = 0;
        }
    }

    function zeroWordArray(obj) {
        for (var i = 0; i < obj.words.length; ++i) {
            obj.words[i] = 0;
        }
    }

    this.zeroByteArray = zeroByteArray;
    function zeroByteArray(obj) {
        for (var i = 0; i < obj.length; ++i) {
            obj[i] = 0;
        }
    }

    this.encrypt = encrypt;
    function encrypt(valueToEncrypt, passphrase) {

        valueToEncrypt = JSON.stringify(valueToEncrypt);

        var key = Bitcoin.convert.bytesToWordArray(passphrase);

        var iv = getRandomValues(32);

        var ivbytes = [];
        for (var i = 0; i < iv.length; ++i) {
            ivbytes[i] = iv[i];
        }

        var ivwords = Bitcoin.convert.bytesToWordArray(ivbytes);

        var encrypted = CryptoJS.AES.encrypt(valueToEncrypt, key, { iv: ivwords });

        zeroWordArray(key);

        return encrypted;
    };


    this.encryptNp = encryptNp;
    function encryptNp(valueToEncrypt, passphrase) {

        valueToEncrypt = Bitcoin.convert.bytesToWordArray(valueToEncrypt);

        var key = Bitcoin.convert.bytesToWordArray(passphrase);

        var iv = getRandomValues(32);

        var ivbytes = [];
        for (var i = 0; i < iv.length; ++i) {
            ivbytes[i] = iv[i];
        }

        var ivwords = Bitcoin.convert.bytesToWordArray(ivbytes);

        var encrypted = CryptoJS.AES.encrypt(valueToEncrypt, key, { iv: ivwords, padding: CryptoJS.pad.NoPadding });

        zeroWordArray(key);

        return encrypted;
    };

    this.decrypt = decrypt;
    function decrypt(encryptedObj, passphrase, iv) {

        //word arrays
        var key = Bitcoin.convert.bytesToWordArray(passphrase);
        var iv = CryptoJS.enc.Hex.parse(iv);

        var decryptedObject = CryptoJS.AES.decrypt(encryptedObj, key, { iv: iv });

        zeroWordArray(key);

        var decryptutf = decryptedObject.toString(CryptoJS.enc.Utf8);

        zeroWordArray(decryptedObject);

        var decryptjson = JSON.parse(decryptutf);
        return decryptjson;
    };


    this.decryptNp = decryptNp;
    function decryptNp(encryptedObj, passphrase, iv, asbytes) {

        //word arrays
        var key = Bitcoin.convert.bytesToWordArray(passphrase);
        var iv = CryptoJS.enc.Hex.parse(iv);

        var decryptedObject = CryptoJS.AES.decrypt(encryptedObj, key, { iv: iv, padding: CryptoJS.pad.NoPadding });

        zeroWordArray(key);

        var ret = null;
        if (asbytes) {
            ret = Bitcoin.convert.wordArrayToBytes(decryptedObject);
        } else {
            ret = decryptedObject.toString(CryptoJS.enc.Hex);
        }

        zeroWordArray(decryptedObject);

        return ret;

    };

    function SHA256(bytes) {

        var wa = Bitcoin.convert.bytesToWordArray(bytes);
        var wa2 = Bitcoin.Crypto.SHA256(wa);
        var ret = Bitcoin.convert.wordArrayToBytes(wa2);

        zeroWordArray(wa);
        zeroWordArray(wa2);

        return ret;

    }

    var hmac = function (key) {
        var hasher = new sjcl.misc.hmac(key, sjcl.hash.sha1);
        this.encrypt = function () {
            return hasher.encrypt.apply(hasher, arguments);
        };
    };

    this.pbkdf2 = pbkdf2;
    function pbkdf2(password, salt) {

        var passwordSalt = sjcl.codec.utf8String.toBits(salt);
        var derivedKey = sjcl.misc.pbkdf2(password, passwordSalt, 1000, 256, hmac);

        var bkey = sjcl.codec.bytes.fromBits(derivedKey);

        return bkey;
    }

    this.setPass = setPass;
    function setPass(pass, salt) {
        m_this.m_password = pbkdf2(pass, salt);
        m_this.m_deviceSecKey = m_this.m_password;

    }

    this.setStretchPass = setStretchPass;
    function setStretchPass(pass) {
        m_this.m_password = pass;
    }


    this.getEncHotHash = getEncHotHash;
    function getEncHotHash(callback) {

        m_this.Device.getStorageItem("hk" + m_this.m_guid, function (hk) {

            if (hk) {

                m_this.Device.getStorageItem("hkiv" + m_this.m_guid, function (hkiv) {

                    if (hkiv) {

                        var data = "{\"enc\":\"" + hk + "\", \"iv\":\"" + hkiv + "\"}";

                        return callback(false, data);

                    } else {

                        return callback(true, "ErrMissing");
                    }

                });

            } else {

                return callback(true, "ErrMissing");

            }

        });

    }


    this.restoreHotHash = restoreHotHash;

    function restoreHotHash(hothash, callback) {

        //validate against loaded hot public key
        var validseed = true;
        try {
            var bipHot = Bitcoin.HDWallet.fromSeedHex(hothash, m_this.m_network);
            if (m_this.m_walletinfo.hotPub != bipHot.toString()) {
                validseed = false;
            }
        } catch (error) {

            validseed = false;
        }

        if (validseed) {


            saveHotHash(Bitcoin.convert.hexToBytes(hothash), function (err, result) {

                if (!err) {
                    return callback(false, hothash);
                } else {
                    return callback(err, result);
                }

            });

        } else {

            return callback(true, "ErrSeedInvalid");

        }


    }


    this.getTwoFactorToken = getTwoFactorToken;
    function getTwoFactorToken(key, callback) {

        m_this.Device.getStorageItem("ninki_rem", function (tft) {

            var jtft = JSON.parse(tft);

            var fatoken = decryptNp(jtft.ct, key, jtft.iv);

            return callback(false, fatoken);

        });

    }

    this.getHotHash = getHotHash;
    function getHotHash(key, callback) {

        //to do: validate key against stored public key
        //needs to be done incase user changed their password on a different machine

        if (m_this.Device.isChromeApp() || m_this.Device.isNode() || m_this.Device.isBrowser()) {

            m_this.Device.getStorageItem("hk" + m_this.m_guid, function (result) {

                var hk = result;

                m_this.Device.getStorageItem("hkiv" + m_this.m_guid, function (resultiv) {

                    var hkiv = resultiv

                    var hothash = '';

                    var iserror = false;
                    try {
                        //get hothash as bytes
                        m_this.m_onlineKey = decryptNp(hk, m_this.m_password, hkiv, true);
                    } catch (error) {
                        iserror = true;
                    }

                    if (!iserror) {

                        //validate against loaded hot public key
                        var validseed = true;
                        try {
                            var bipHot = new Bitcoin.HDWallet(m_this.m_onlineKey, m_this.m_network);
                            if (m_this.m_walletinfo.hotPub != bipHot.toString()) {
                                validseed = false;
                            }
                        } catch (error) {

                            validseed = false;
                        }

                        if (validseed) {

                            if (m_this.m_deviceKey.length > 0) {
                                //incase we are simulating mobile devices on chrome
                                m_this.Device.getStorageItem("ninki_rem", function (tft) {

                                    if (tft != "") {

                                        var jtft = JSON.parse(tft);

                                        var fatoken = decryptNp(jtft.ct, m_this.m_deviceKey, jtft.iv);

                                        return callback(false, "", fatoken);
                                    } else {

                                        return callback(false, "", "");

                                    }

                                });
                            } else {

                                return callback(false, "", "");

                            }


                        } else {

                            return callback(true, "invalid");

                        }


                    } else {

                        return callback(true, "missing");
                    }

                });



            });

        } else {


            m_this.Device.getStorageItem("ninki_h", function (hk) {


                if (hk) {

                    var hothash = '';
                    var iserror = false;
                    try {

                        var enc = JSON.parse(hk);
                        //get hothash as bytes
                        m_this.m_onlineKey = decryptNp(enc.ct, m_this.m_deviceKey, enc.iv, true);

                    } catch (error) {
                        iserror = true;
                    }
                    if (!iserror) {

                        //validate against loaded hot public key
                        var validseed = true;
                        try {
                            var bipHot = new Bitcoin.HDWallet(m_this.m_onlineKey, m_this.m_network);
                            if (m_this.m_walletinfo.hotPub != bipHot.toString()) {
                                validseed = false;
                            }
                        } catch (error) {

                            validseed = false;
                        }

                        if (validseed) {

                            //get the two factor code also

                            m_this.Device.getStorageItem("ninki_rem", function (tft) {

                                if (tft != "") {
                                    var jtft = JSON.parse(tft);

                                    var fatoken = decryptNp(jtft.ct, m_this.m_deviceKey, jtft.iv);

                                    return callback(false, "", fatoken);
                                } else {

                                    return callback(false, "", "");

                                }

                            });

                        } else {

                            return callback(true, "invalid");

                        }

                    } else {

                        return callback(true, "missing");
                    }

                } else {

                    return callback(true, "missing");

                }


            });

        }

    }

    this.saveHotHash = saveHotHash;
    function saveHotHash(hotHash, callback) {

        //before we encrypt validate the hash matches the logged in public key
        var validseed = true;
        try {
            var bipHot = new Bitcoin.HDWallet(hotHash, m_this.m_network);
            if (m_this.m_walletinfo.hotPub != bipHot.toString()) {
                validseed = false;
            }
        } catch (error) {
            validseed = false;
        }

        if (validseed) {

            var encHotHash = encryptNp(hotHash, m_this.m_password);

            if (m_this.Device.isChromeApp() || m_this.Device.isNode() || m_this.Device.isBrowser()) {

                m_this.Device.setStorageItem('hk' + m_this.m_guid, encHotHash.toString());
                m_this.Device.setStorageItem('hkiv' + m_this.m_guid, encHotHash.iv.toString());

            } else {

                var htok = {};
                htok.ct = encHotHash.toString();
                htok.iv = encHotHash.iv.toString();
                var hkey = JSON.stringify(htok);

                m_this.Device.setStorageItem('ninki_h', hkey);

            }

            callback(false, "ok");

        } else {

            callback(true, "invalid");

        }


    }


    //create wallet
    //create a new wallet and save to the server
    this.createWallet = createWallet;
    function createWallet(guid, password, username, emailAddress, callback, progress) {

        m_this.m_oguid = guid;

        var bytes = [];
        for (var i = 0; i < guid.length; ++i) {
            bytes.push(guid.charCodeAt(i));
        }

        m_this.m_guid = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();


        //check if the username already exists
        API.doesAccountExist(username.toLowerCase(), emailAddress.toLowerCase(), function (err, accExists) {

            if (accExists.UserExists) {

                return callback(true, "ErrUserExists");

            }
            else if (accExists.EmailExists) {

                return callback(true, "ErrEmailExists");

            }
            else {


                progress('stretching password...');


                setTimeout(function () {

                    //stretch the password with the local guid as a salt
                    m_this.m_password = pbkdf2(password, m_this.m_oguid);

                    password = '';

                    //create a new wallet
                    makeNewWallet(username, emailAddress, getKeys, function (err, walletInformation, userToken) {

                        if (err) {

                            return callback(true, "ErrCreateAccount");

                        } else {

                            m_this.m_sharedid = userToken;

                            //wallet creation is successful
                            //set variables
                            //add the usertoken to the wallet
                            walletInformation.wallet.googleAuthSecret = "";
                            walletInformation.wallet.sharedid = userToken;

                            //
                            var recpacket = encryptNp(m_this.m_password, m_this.m_walletinfo.hckey);

                            walletInformation.wallet.recPacket = recpacket.toString();
                            walletInformation.wallet.recPacketIV = recpacket.iv.toString();

                            //save the wallet to the server
                            progress('saving data...');

                            setTimeout(function () {

                                API.post("/api/1/u/createaccount2", walletInformation.wallet, function (err, response) {

                                    if (err) {

                                        return callback(err, "ErrSavePacket");

                                    } else {

                                        //set the session
                                        API.registerToken(response);
                                        m_this.m_APIToken = response;

                                        //pass back the wallet and info to the calling function
                                        return callback(false, walletInformation);
                                    }
                                });

                            }, 50);

                        }

                    }, progress);

                }, 50);
            }

        });
    }



    //create wallet
    //create a new wallet and save to the server
    this.createWalletApp = createWalletApp;
    function createWalletApp(guid, username, callback, progress) {

        m_this.m_oguid = guid;

        var bytes = [];
        for (var i = 0; i < guid.length; ++i) {
            bytes.push(guid.charCodeAt(i));
        }

        m_this.m_guid = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();


        //create a new wallet

        makeNewWallet(username, '', getKeysForMobile, function (err, walletInformation, userToken) {

            if (err) {

                return callback(true, "ErrCreateAccount");

            } else {

                m_this.m_sharedid = userToken;

                //wallet creation is successful
                //set variables
                //add the usertoken to the wallet
                walletInformation.wallet.googleAuthSecret = "";
                walletInformation.wallet.sharedid = userToken;

                //
                var recpacket = encryptNp(m_this.m_password, m_this.m_walletinfo.hckey);

                walletInformation.wallet.recPacket = recpacket.toString();
                walletInformation.wallet.recPacketIV = recpacket.iv.toString();

                //save the wallet to the server
                progress('saving data...');

                setTimeout(function () {

                    API.post("/api/1/u/createaccount2", walletInformation.wallet, function (err, response) {

                        if (err) {

                            return callback(err, "ErrSavePacket");

                        } else {

                            //set the session
                            API.registerToken(response);
                            m_this.m_APIToken = response;

                            //pass back the wallet and info to the calling function
                            return callback(false, walletInformation);
                        }
                    });

                }, 50);

            }

        }, progress);

    }



    //function makeNewWallet
    //this function calls the server which generates the Ninki key pair to be used for the wallet
    //the server returns the public key to the client so that it can be saved in the user's encrypted packet
    function makeNewWallet(nickname, email, getkeys, callback, progress) {


        //TODO add some more param checking
        //rename this function
        setTimeout(function () {


            progress('creating account...');

            API.getMasterPublicKeyFromUpstreamServer(m_this.m_oguid, function (err, ninkiPubKey, userToken, secret) {
                if (err) {
                    return callback(err, "ErrCreateAccount");
                } else {
                    makeNewWalletPacket(nickname, email, ninkiPubKey, userToken, secret, getkeys, function (err, walletInformation) {
                        if (err) {
                            return callback(err, walletInformation);
                        } else {
                            return callback(err, walletInformation, userToken);
                        }
                    }, progress);
                }
            });
        }, 50);
    }


    function getKeys(dummy, callback) {

        var rnghot = getRandomValues(16);

        var hotKeyBytes = [];
        for (var i = 0; i < rnghot.length; ++i) {
            hotKeyBytes[i] = rnghot[i];
        }


        var rngcold = getRandomValues(16);

        var coldKeyBytes = [];
        for (var i = 0; i < rngcold.length; ++i) {
            coldKeyBytes[i] = rngcold[i];
        }

        callback(false, coldKeyBytes, hotKeyBytes);

    }


    //
    //method to derive hot and cold keys
    //with the ability to deterministically
    //recover the cold key using:

    //hotkey
    //secret public key
    //random data on device

    //this means that the user does not have to write down the cold key immediately

    //an attacker needs:
    //access to the device
    //access to hot key
    //access to Ninki server
    //access to Ninki decryption keys

    //one time derivation secured by:
    //PIN number
    //access to device

    function getKeysForMobile(userToken, callback) {

        //get 128 bits of entropy for the hot key
        var rnghot = getRandomValues(16);

        var hotKeyBytes = [];
        for (var i = 0; i < rnghot.length; ++i) {
            hotKeyBytes[i] = rnghot[i];
        }

        zeroByteArray(rnghot);

        //get 128 bits of entropy for the secret key
        //used to derive the cold key
        var secretEntropy = getRandomValues(16);

        var secretEntropyBytes = [];
        for (var i = 0; i < secretEntropy.length; ++i) {
            secretEntropyBytes[i] = secretEntropy[i];
        }

        zeroByteArray(secretEntropy);

        var deviceEntropy = getRandomValues(16);
        //get 128 bits of entropy for the device key
        var deviceEntropyBytes = [];
        for (var i = 0; i < 16; ++i) {
            deviceEntropyBytes[i] = deviceEntropy[i];
        }

        zeroByteArray(deviceEntropy);

        //get ECKey for secretEntropy
        var secretKey = new Bitcoin.ECKey(secretEntropyBytes, false);

        //derive the public EC key
        var secretPubKey = secretKey.getPub();

        secretPubKey.priv = 0;

        zeroByteArray(secretEntropyBytes);

        //verify the public key has been stored on the server
        //before continuing

        API.createAccountSecPub(m_this.m_oguid, userToken, secretPubKey.toString(), function (err, result) {

            if (!err) {

                //m_this.m_oguid

                //get the device key
                var deviceKey = new Bitcoin.ECKey(deviceEntropyBytes, false);

                //EC multiply to get the cold key entropy
                var coldKey = secretPubKey.multiply(deviceKey);

                deviceKey.priv = 0;

                var bcoldkey = coldKey.toBytes();

                //create the final cold key
                var rngcold = SHA256(bcoldkey);

                //get the first 128 bits
                var coldKeyBytes = [];
                for (var i = 0; i < 16; ++i) {
                    coldKeyBytes[i] = rngcold[i];
                }

                zeroByteArray(rngcold);
                zeroByteArray(bcoldkey);

                //set password to sha256 of the hotkey seed
                m_this.m_password = SHA256(hotKeyBytes);

                //save the device entropy encrypted with the password
                //we don't have the device enc key yet at this stage
                m_this.Device.setSecureStorageObject("dpk", deviceEntropyBytes, m_this.m_password, m_this.encryptNp);

                //clear buffer
                zeroByteArray(deviceEntropyBytes);

                return callback(err, coldKeyBytes, hotKeyBytes, secretPubKey.toString());

            } else {

                return callback(err);
            }

        });

    }

    //recover cold key for mobile
    this.recoverColdKeyForMobile = recoverColdKeyForMobile;
    function recoverColdKeyForMobile(callback) {

        API.getAccountSecPub(m_this.m_guid, m_this.m_sharedid, function (err, secretpub) {

            m_this.m_password = SHA256(m_this.m_onlineKey);

            m_this.Device.getSecureStorageObject("dpk", m_this.m_password, m_this.decryptNp, false, function (deviceent) {

                zeroByteArray(m_this.m_password);

                var secretKey = new Bitcoin.ECPubKey(secretpub, false);

                var deviceKey = new Bitcoin.ECKey(Bitcoin.convert.hexToBytes(deviceent), false);

                deviceent = [];

                var coldKey = secretKey.multiply(deviceKey);

                deviceKey.priv = 0

                var bcoldkey = coldKey.toBytes();

                coldKey = 0;

                var rngcold = SHA256(bcoldkey);

                zeroByteArray(bcoldkey);

                var coldKeyBytes = [];
                for (var i = 0; i < 16; ++i) {
                    coldKeyBytes[i] = rngcold[i];
                }

                zeroByteArray(rngcold);

                return callback(coldKeyBytes);

            });

        });

    }


    this.destroySecretPub = destroySecretPub;
    function destroySecretPub(callback) {

        API.removeAccountSecPub(m_this.m_guid, m_this.m_sharedid, function (err, res) {

            if (!err) {

                m_this.Device.deleteStorageItem("dpk");

                m_this.m_offlineKeyBackup = true;

                return callback(err, res);

            } else {


                //make the user click again and retry
                //we might as well delete the secret anyway
                //as long as either are destroyed the key is
                //unrecoverable
                m_this.Device.deleteStorageItem("dpk");

                return callback(err, res);
            }

        });


    }


    function makeNewWalletPacket(nickname, emailAddress, ninkiPubKey, userToken, secret, getkeys, callback, progress) {


        progress('getting entropy...');

        setTimeout(function () {

            //getKeysForMobile();

            getkeys(userToken, function (err, coldKeyBytes, hotKeyBytes) {


                if (!err) {

                    progress('creating cold keys...');

                    setTimeout(function () {

                        //var coldHash = Bitcoin.convert.bytesToHex(coldKeyBytes);

                        var coldWallet = new Bitcoin.HDWallet(coldKeyBytes, m_this.m_network);

                        var coldPub = coldWallet.toString();

                        coldWallet.priv.priv = 0;
                        coldWallet.priv = 0;
                        zeroByteArray(coldWallet.chaincode);

                        progress('creating hot keys...');

                        setTimeout(function () {

                            var hotWallet = new Bitcoin.HDWallet(hotKeyBytes, m_this.m_network);
                            //get the keys as strings

                            var hotPub = hotWallet.toString();

                            hotWallet.priv.priv = 0;
                            hotWallet.priv = 0;
                            zeroByteArray(hotWallet.chaincode);

                            //create a key based on a hash of the hot + cold key
                            //this is used to encrypt the pbkdf password and so enables

                            //password reset if the user has access to the hot and cold key phrases
                            var hcbkey = [];
                            hcbkey = hcbkey.concat(hotKeyBytes);
                            hcbkey = hcbkey.concat(coldKeyBytes);

                            var hchkey = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(hcbkey)).toString();

                            zeroByteArray(hcbkey);

                            progress('creating pgp keys...');


                            setTimeout(function () {

                                //generate a pgp keypair
                                //this key pair will be used to allow the user's to communicate with their contacts
                                //the private key will be aes256 encrypted so use the userToken as the passphrase as the library
                                //doesn't support blank passphrases yet (and there is no way to change them)

                                var options = { numBits: 1024, userId: nickname, passphrase: userToken };
                                var keypair = openpgp.generateKeyPair(options);

                                var privKeys = openpgp.key.readArmored(keypair.privateKeyArmored);
                                var publicKeys = openpgp.key.readArmored(keypair.publicKeyArmored);

                                setTimeout(function () {

                                    //save the wallet public keys and user token in an encrypted packet
                                    //AES256 using PBKDF2 on the password and a unique salt

                                    var wal = {
                                        coldPub: coldPub,
                                        hotPub: hotPub,
                                        ninkiPubKey: ninkiPubKey,
                                        hotPriv: '',
                                        hotHash: '',
                                        userToken: userToken,
                                        hckey: hchkey
                                    };

                                    m_this.m_walletinfo = wal;

                                    var encryptedPayload = encrypt(wal, m_this.m_password);

                                    //save the PGP keys in an encrypted packet
                                    //AES256 using PBKDF2 on the password and a unique salt

                                    var encryptedUserPayload = encrypt({
                                        RSAPriv: keypair.privateKeyArmored,
                                        RSAPub: keypair.publicKeyArmored
                                    }, m_this.m_password, m_this.m_oguid);

                                    //encrypt a shared secret
                                    //this allows Ninki to validate that the user
                                    //knows their password without having to hold any
                                    //info about the password

                                    var encryptedSecret = encryptNp(Bitcoin.convert.hexToBytes(secret), m_this.m_password);

                                    m_this.m_secret = secret;

                                    //create a packet to post to the server
                                    //note:
                                    //  PGP private key is encrypted in the payload
                                    //  all 3 wallet public keys are encrypted in the payload
                                    //  hot and cold wallet public keys are passed to the server
                                    //  public PGP key is passed to the server

                                    var wallet = {
                                        guid: m_this.m_oguid,
                                        payload: encryptedPayload.toString(),
                                        userPublicKey: keypair.publicKeyArmored,
                                        userPayload: encryptedUserPayload.toString(),
                                        hotPublicKey: hotPub,
                                        coldPublicKey: coldPub,
                                        nickName: nickname,
                                        emailAddress: emailAddress,
                                        secret: encryptedSecret.toString(),
                                        ninkiPhrase: ninkiPubKey,
                                        IVA: encryptedPayload.iv.toString(),
                                        IVU: encryptedUserPayload.iv.toString(),
                                        IVR: encryptedSecret.iv.toString()
                                    };

                                    //the cold private key is discarded and is only displayed to the user
                                    //as a mnemomic representation so that the user can write it down
                                    //if this phrase is lost by the user it is unrecoverable


                                    //the hot private key is encrypted and saved locally
                                    //encrypted with the user's password

                                    var bip39 = new BIP39();
                                    var walletInformation = {
                                        wallet: wallet,
                                        coldWalletPhrase: bip39.entropyToMnemonic(Bitcoin.convert.bytesToHex(coldKeyBytes)),
                                        hotWalletPhrase: bip39.entropyToMnemonic(Bitcoin.convert.bytesToHex(hotKeyBytes)),
                                        sharedid: userToken,
                                        hckey: hchkey
                                    };

                                    //set the online key
                                    m_this.m_onlineKey = hotKeyBytes;

                                    zeroByteArray(coldKeyBytes);

                                    //*if mobile, don't save this locally until PIN is chosen
                                    if (m_this.Device.isCordova()) {

                                        return callback(err, walletInformation);

                                    } else {

                                        saveHotHash(hotKeyBytes, function (err, res) {

                                            return callback(err, walletInformation);

                                        });

                                    }

                                }, 50);

                            }, 50);

                        }, 50);

                    }, 50);

                }
            });

        }, 50);
    }


    this.openWalletAfterCreate = openWalletAfterCreate;
    function openWalletAfterCreate(twoFactorCodeChk, callback) {

        //check two factor code
        if (twoFactorCodeChk != '') {

            SetupTwoFactor(twoFactorCodeChk, function (err, wallet) {

                if (err) {

                    return callback(err, wallet);

                } else {

                    m_this.m_twoFactorOnLogin = true;

                    getSettings(function (err, result) {

                        callback(err, result);

                    });

                }

            });

        } else {

            getSettings(function (err, result) {

                callback(err, result);

            });

        }

    }


    this.migrateHotKeyFromPacket = migrateHotKeyFromPacket;
    function migrateHotKeyFromPacket(twoFactCode, callback) {


        API.getWalletFromServer(m_this.m_guid, m_this.m_secret, twoFactCode, false, function (err, wallet) {

            if (err) {
                return callback(err, wallet);
            }

            try {
                var walletInformation = decrypt(wallet.Payload, m_this.m_password, wallet.IV);
            } catch (err) {
                return callback(true, "Incorrect password");
            }

            //if any account still has a hotkey stored in their encrypted packet
            //then remove it and resave the packet


            // show a notice to the user that their hotkey has been migrated locally
            // they should write this down as they will need t to setup their wallet
            // on a new PC or if they uninstall the chrome app

            if (walletInformation.hotHash != '') {

                var hotHash = walletInformation.hotHash;

                walletInformation.hotPriv = '';
                walletInformation.hotHash = '';
                m_this.m_walletinfo = walletInformation;
                saveHotHash(hotHash, function (err, result) {

                    if (!err) {

                        //double check it has been saved correctly
                        getHotHash("", function (err, result) {

                            m_this.zeroOnlineKey();

                            if (!err) {

                                var packet = encrypt(walletInformation, m_this.m_password);
                                //now save the packet back to the server

                                var postData = {
                                    twoFactorCode: twoFactCode,
                                    guid: m_this.m_guid,
                                    sharedid: walletInformation.userToken,
                                    accountPacket: packet.toString(),
                                    IVA: packet.iv.toString()
                                };
                                API.post("/api/1/u/migratepacket", postData, function (err, dataStr) {

                                    return callback(false, "ok");

                                });

                            }

                        });

                    }


                });

            }

        });

    }

    this.openWallet2fa = openWallet2fa;
    function openWallet2fa(twoFactCode, rememberTwoFactor, callback) {

        API.getWalletFromServer(m_this.m_guid, m_this.m_secret, twoFactCode, rememberTwoFactor, function (err, wallet) {

            if (err) {
                return callback(err, wallet);
            }

            try {
                var walletInformation = decrypt(wallet.Payload, m_this.m_password, wallet.IV);
            } catch (err) {
                return callback(true, "Incorrect password");
            }

            if (m_this.m_migrateBeta12fa) {

                //1. for migrations from beta1 we need to save a secret

                var encryptedSecret = encryptNp(m_this.m_secret, m_this.m_password);

                //we need to base this on account migration status


                //add twoFactCode here

                API.updateSecretPacket(m_this.m_guid, walletInformation.userToken, encryptedSecret.toString(), encryptedSecret.iv.toString(), function (err, res) {


                    if (err) {
                        return callback(err, res);
                    } else {


                        walletInformation.hotPriv = '';
                        walletInformation.hotHash = '';
                        walletInformation.hchkey = '';

                        m_this.m_twoFactorOnLogin = wallet.TwoFactorOnLogin;
                        m_this.m_walletinfo = walletInformation;
                        m_this.m_sharedid = walletInformation.userToken;


                        //if there is a cookie token then encrypt it

                        if (wallet.CookieToken) {
                            var enc = encryptNp(Bitcoin.convert.hexToBytes(wallet.CookieToken), m_this.m_password);
                            var ctok = {};
                            ctok.ct = enc.toString();
                            ctok.iv = enc.iv.toString();
                            wallet.CookieToken = JSON.stringify(ctok);
                        }

                        //save secret


                        getSettings(function (err, result) {
                            if (!err) {
                                callback(err, wallet);
                            } else {
                                callback(err, result);
                            }

                        });

                    }

                });

            } else {


                //2. this is the standard login code execution
                //eventually only this block will be required

                //walletInformation.hotPriv = '';
                //walletInformation.hotHash = '';
                //walletInformation.hchkey = '';

                m_this.m_twoFactorOnLogin = wallet.TwoFactorOnLogin;
                m_this.m_walletinfo = walletInformation;
                m_this.m_sharedid = walletInformation.userToken;

                //if there is a cookie token then encrypt it

                if (wallet.CookieToken) {
                    var enc = encryptNp(Bitcoin.convert.hexToBytes(wallet.CookieToken), m_this.m_password);
                    var ctok = {};
                    ctok.ct = enc.toString();
                    ctok.iv = enc.iv.toString();
                    wallet.CookieToken = JSON.stringify(ctok);
                }

                //save secret

                getSettings(function (err, result) {
                    if (!err) {
                        callback(err, wallet);
                    } else {
                        callback(err, result);
                    }

                });


            }

        });


    }


    this.openWallet = openWallet;
    function openWallet(guid, twoFactCode, callback) {

        m_this.m_oguid = guid;

        var bytes = [];
        for (var i = 0; i < guid.length; ++i) {
            bytes.push(guid.charCodeAt(i));
        }

        m_this.m_guid = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();
        //m_this.m_password = pbkdf2(password, guid);


        //first get the encrypted secret
        //decrypt with password and pass secret to get the wallet back

        //if the user is from beta test 1
        //generate a secret on the server and return
        //encrypt the secret on the client
        //save directly back


        API.post("/api/1/getrecoverypacket", {
            guid: m_this.m_guid
        }, function (err, response) {

            if (err) {

                callback(err, response);

            } else {

                //decrypt packet

                var jpacket = JSON.parse(response);

                if (!jpacket.Beta1) {


                    //1. Account has been migrated to beta2
                    //we have a secret to validate against

                    //2. validate againts secret and check to see if 2fa is enabled
                    //if it isn't we can get the packet then force the user to enable it

                    var secret = decryptNp(jpacket.packet, m_this.m_password, jpacket.IV);

                    m_this.m_secret = secret;


                    API.validateSecret(m_this.m_guid, m_this.m_secret, function (err, secvalid) {

                        if (err) {
                            return callback(err, secvalid);
                        }

                        if (secvalid.Locked == 0) {

                            //either is an old acocunt with no 2fa or has a client token
                            //so we can get back the packet without 2fa
                            if (!secvalid.TwoFactorOnLogin || twoFactCode.length > 6) {

                                API.getWalletFromServer(m_this.m_guid, m_this.m_secret, twoFactCode, false, function (err, wallet) {

                                    if (err) {
                                        if (wallet == "TokenExpired") {
                                            return callback(false, secvalid);
                                        } else {
                                            return callback(err, wallet);
                                        }
                                    }

                                    //if token has expired - return expiry message
                                    //

                                    try {
                                        var walletInformation = decrypt(wallet.Payload, m_this.m_password, wallet.IV);
                                    } catch (err) {
                                        return callback(true, "Incorrect password");
                                    }


                                    //if the packet still stores the hot key
                                    //it is an old beta account
                                    //save the key to local storage
                                    //blank the keys from the packet and resave

                                    //alert and remind the user to write down their hotkeys

                                    //walletInformation.hotPriv = '';
                                    //walletInformation.hotHash = '';
                                    //walletInformation.hchkey = '';

                                    m_this.m_APIToken = wallet.SessionToken;
                                    m_this.m_twoFactorOnLogin = wallet.TwoFactorOnLogin;
                                    m_this.m_walletinfo = walletInformation;
                                    m_this.m_sharedid = walletInformation.userToken;


                                    getSettings(function (err, result) {

                                        callback(err, result);

                                    });


                                });

                            } else {

                                m_this.m_settings = {};
                                m_this.m_settings.BackupIndex = secvalid.BackupIndex;
                                m_this.m_settings.HasBackupCodes = secvalid.HasBackupCodes;

                                //is a migrated account with 2fa enabled
                                //return to get the user to enter the 2fa code
                                return callback(err, secvalid);

                            }
                        } else {

                            return callback(err, "Account is locked");

                        }

                    });

                } else {

                    //migrate the Beta1 wallet

                    //save the encypted packet


                    //3. this is a beta1 wallet with no secret
                    //4. if the user does not have 2fa setup
                    //get the packet using the old style, then set them up with a secret
                    if (!jpacket.Beta12fa) {

                        //they don;t have 2fa enabled either so once their account is migrated
                        //we force them to setup 2fa

                        //log in as normal
                        API.getWalletFromServer(m_this.m_guid, m_this.m_secret, twoFactCode, false, function (err, wallet) {

                            if (err) {
                                return callback(err, wallet);
                            }

                            try {
                                var walletInformation = decrypt(wallet.Payload, m_this.m_password, wallet.IV);
                            } catch (err) {
                                return callback(true, "Incorrect password");
                            }


                            //now we now we have the correct password
                            //encrypt the secret and save back the packet

                            var encryptedSecret = encryptNp(jpacket.Secret, m_this.m_password);

                            //save secret

                            m_this.m_secret = jpacket.Secret;

                            //here we don't have 2fa yet...

                            API.updateSecretPacket(m_this.m_guid, walletInformation.userToken, encryptedSecret.toString(), encryptedSecret.iv.toString(), function (err, res) {

                                walletInformation.hotPriv = '';
                                walletInformation.hotHash = '';
                                walletInformation.hchkey = '';

                                m_this.m_twoFactorOnLogin = wallet.TwoFactorOnLogin;
                                m_this.m_walletinfo = walletInformation;
                                m_this.m_sharedid = walletInformation.userToken;


                                getSettings(function (err, result) {

                                    callback(err, result);

                                });


                            });

                        });


                    } else {


                        //the account is beta1 but has 2fa setup
                        //so we don't migrate the account yet
                        //instead we return so the user can enter their 2fa

                        m_this.m_secret = jpacket.Secret;
                        m_this.m_migrateBeta12fa = true;
                        m_this.m_twoFactorOnLogin = true;
                        jpacket.TwoFactorOnLogin = true;

                        callback(err, jpacket);
                    }


                }
            }

        });

    }


    function getPGPKeys(callback) {

        //get the pgp key pair
        API.getUserPacket(m_this.m_guid, m_this.m_sharedid, function (err, encpacket) {

            //get the RSA private key from the encrypted payload
            var rsaKeyPair = decrypt(encpacket.Payload, m_this.m_password, encpacket.IV);

            var publicKeys = openpgp.key.readArmored(rsaKeyPair.RSAPub);
            var privKeys = openpgp.key.readArmored(rsaKeyPair.RSAPriv);

            m_this.m_privKey = privKeys.keys[0];
            m_this.m_pubKey = publicKeys.keys[0];

            if (m_this.m_privKey.decrypt(m_this.m_sharedid)) {
                callback(err, 'ok');
            } else {
                callback(true, 'failed');
            }

        });

    }


    function getSettings(callback) {

        //nickname in packet?
        getUserData(function (err, data) {

            if (!err) {

                data = JSON.parse(data);

                m_this.m_nickname = data.Nickname;

                m_this.m_profileImage = data.ProfileImage;
                m_this.m_statusText = data.Status;
                m_this.m_invoiceTax = data.Tax;


                //display the secret on a div

                var rsaKeyPair = decrypt(data.Payload, m_this.m_password, data.IV);

                var publicKeys = openpgp.key.readArmored(rsaKeyPair.RSAPub);
                var privKeys = openpgp.key.readArmored(rsaKeyPair.RSAPriv);


                m_this.m_pubKeyRaw = rsaKeyPair.RSAPub;
                m_this.m_privKeyRaw = rsaKeyPair.RSAPriv;

                m_this.m_privKey = privKeys.keys[0];
                m_this.m_pubKey = publicKeys.keys[0];

                if (m_this.m_privKey.decrypt(m_this.m_sharedid)) {
                    var bip39 = new BIP39();  // 'en' is the default language
                    var fingermnem = bip39.entropyToMnemonic(m_this.m_pubKey.primaryKey.fingerprint);

                    m_this.m_fingerprint = fingermnem;
                    m_this.m_settings = data.Settings;
                    m_this.m_validate = !data.Settings.EmailVerified;

                    return callback(err, "ok");
                } else {
                    callback(true, 'failed');
                }
            } else {

                return callback(err, data);
            }

        });

    }


    function deriveChild(path, hdwallet) {

        var e = path.split('/');
        var ret = hdwallet;
        // Special cases:
        if (path == 'm' || path == 'M' || path == 'm\'' || path == 'M\'') return this;

        for (var i in e) {
            var c = e[i];

            if (i == 0) {
                if (c != 'm') throw new Error("invalid path");
                continue;
            }

            var use_private = (c.length > 1) && (c[c.length - 1] == '\'');
            var child_index = parseInt(use_private ? c.slice(0, c.length - 1) : c) & 0x7fffffff;

            if (use_private)
                child_index += 0x80000000;

            ret = ret.derive(child_index);
        }

        return ret;
    }


    //function aMultiSigHashForSigning
    //TODO: rename
    function aMultiSigHashForSigning3(publickey1, publickey2, publickey3, index, outputsToSpend, outputsToSend, addressToSend) {


        //this function will create the temporary transaction
        //with a single input used to generate the signature
        //for the single input

        //instantiate a new transaction
        var tx = new Bitcoin.Transaction();

        var ins = [];
        var outs = [];

        //generate the script to sign off on
        //using the users hotkey,coldkey and the ninki public key
        //2 of...
        var script = [0x52];
        //hotkey
        script.push(33);
        script = script.concat(publickey1);
        //cold key
        script.push(33);
        script = script.concat(publickey2);
        //ninki key
        script.push(33);
        script = script.concat(publickey3);
        //..3
        script.push(0x53);
        //..multisig

        script.push(0xae);

        //generate the same number of inputs as on the transaction to broadcast
        //but replace the other inputs with a zero byte! (thanks satoshi-san)
        for (var i = 0; i < outputsToSpend.length; i++) {
            var p = outputsToSpend[i].transactionId + ':' + outputsToSpend[i].outputIndex.toString();
            tx.addInput(p);
            if (i == index) {
                tx.ins[i].script = new Bitcoin.Script(script);
            } else {
                tx.ins[i].script = new Bitcoin.Script([0]);
            }
        }

        //mirror the outpurs in the transaction to broadcast
        var test = '';
        for (var i = 0; i < outputsToSend.length; i++) {
            var addr = new Bitcoin.Address(addressToSend[i]);
            tx.addOutput(addressToSend[i], outputsToSend[i]);
        }

        //hash the transaction-- this has will be used as an input to the signature function
        var txHash = tx.hashTransactionForSignature(tx.ins[index].script, index, 1);

        return txHash;

    }

    //function aGetTransaction
    //TODO: rename
    //generateas a transaction from a set of keys, outputs, signatures and addresses to send to
    function aGetTransaction(publickeys, outputsToSpend, outputsToSend, addressToSend, sigs) {


        //create a new transaction
        var tx = new Bitcoin.Transaction();

        var ins = [];
        var outs = [];

        //generate the scripts to spend the outputs
        for (var i = 0; i < outputsToSpend.length; i++) {

            var len = sigs[i].length;
            var script = [];

            //append the signature
            script = script.concat(sigs[i]);

            //prepend the length of the signature
            script.unshift(len);
            script.unshift(0x00);

            //push the script used to validate the spend
            script.push(0x4c);
            script.push(105);
            script.push(0x52);
            script.push(33);
            script = script.concat(publickeys[i][0]);
            script.push(33);
            script = script.concat(publickeys[i][1]);
            script.push(33);
            script = script.concat(publickeys[i][2]);
            script.push(0x53);
            script.push(0xae);

            //add the input to the transaction referencing the output to spend
            var p = outputsToSpend[i].transactionId + ':' + outputsToSpend[i].outputIndex.toString();
            tx.addInput(p);

            //set the script on the input
            tx.ins[i].script = new Bitcoin.Script(script);

        }

        //add the outputs to the transaction
        for (var i = 0; i < outputsToSend.length; i++) {
            tx.addOutput(addressToSend[i], outputsToSend[i]);
        }

        var txHash = Array.apply([], tx.serialize());

        return txHash;
    }


    function aGetTransactionData(params, callback) {


        var derivedPublicKeys = [];
        var derivedPrivateKeys = [];

        var signatures = [];
        var hashesForSigning = [];
        for (var i = 0; i < params.outputsToSpend.length; i++) {
            var path = params.paths[i];

            //derive the hashes for signing off on each input
            var hashForSigning = aMultiSigHashForSigning3(params.publicKeys[i][0], params.publicKeys[i][1], params.publicKeys[i][2], i, params.outputsToSpend, params.amountsToSend, params.addressToSend);
            //add to collection so they can be provided to the server later
            //this saves the same process having to be done on the server side
            hashesForSigning.push(Bitcoin.convert.bytesToHex(hashForSigning));

            //get the user's hot private key
            var key = params.userHotPrivKeys[i];

            //sign the input
            var sig = key.sign(hashForSigning).concat([1]);

            //add the signature
            signatures.push(sig);
        }

        //get the transaction and return along with the hashes used to sign
        var txn = aGetTransaction(params.publicKeys, params.outputsToSpend, params.amountsToSend, params.addressToSend, signatures);

        //generate the signatures
        //TO DO: check call back?
        return callback("", hashesForSigning, Bitcoin.convert.bytesToHex(txn));
    }

    this.isAddressValid = isAddressValid;
    function isAddressValid(address) {
        var addrValid = true;

        if (m_this.m_network == "mainnet") {
            if (address[0] != "1" && address[0] != "3") {
                return false;
            }
        }
        try {
            var addressCheck = new Bitcoin.Address(address);
            addressCheck.toString();
        } catch (err) {
            addrValid = false;
        }
        return addrValid;
    }

    var corNodesDone = 0;
    var corNodesToProcess = 0;

    function deriveKeys(mpk, nodes, cdcallback) {

        if (m_this.Device.isiOS()) {

            var mkpder = [];

            corNodesToProcess = nodes.length;
            cordovaDeriveKey(mpk, nodes, mkpder, function (result) {

                return cdcallback(mkpder);

            });
        } else {

            var ret = [];
            for (var i = 0; i < nodes.length; i++) {
                ret.push(deriveChild(nodes[i], mpk).priv);
            }
            return cdcallback(ret);

        }

    }

    function cordovaDeriveKey(mpk, nodes, mkpder, derfinished) {


        if (corNodesDone == corNodesToProcess) {


            return derfinished(mkpder)

        } else {

            var nls = nodes[corNodesDone].split("/");
            var tnode = nls[2] * 1;
            var leaf = nls[3] * 1;

            cordova.exec(
                function callback(data) {

                    corNodesDone++;

                    mkpder.push(data);

                    cordovaDeriveKey(mpk, nodes, mkpder, derfinished);


                },
                function errorHandler(err) {


                },
                'ECPlugin',
                'cordovaECDerKey',
                [mpk.toString(" "), tnode, leaf]
            );
        }


    }


    this.replaceTransaction = replaceTransaction;
    function replaceTransaction(transactionid, twoFactorCode, feebump, fss, callback, statuscallback) {

        API.getTransactionTemplate(m_this.m_guid, m_this.m_sharedid, transactionid, function (err, res) {

            if (!err) {

                var outputs = res.SpentOutputs;
                var targetOutputs = res.TargetOutputs;

                var pdata = { guid: m_this.m_guid, sharedid: m_this.m_sharedid };

                API.post("/api/1/u/getunspentoutputs", pdata, function (err, unspentoutputs) {


                    if (!err) {



                        var unspentoutputs = JSON.parse(unspentoutputs);

                        //rebuild the transaction

                        //res.SpentOutputs

                        //res.TargetOutputs


                        //verify there is enough value on the inputs to increase the fee
                        //if there isn't we need to add another input and potentially an output
                        //if the fee bump beings the value of the change output to < dust, then remove it (inform user...)

                        //get the current change amount
                        //can we decrease the change amount, leaving the current send amount the same and still match the inputs
                        //if decreasing the change amount


                        var currentInAmount = 0;
                        for (var i = 0; i < outputs.length; i++) {
                            currentInAmount += outputs[i].Amount;
                        }

                        var currentOutAmount = 0;
                        for (var i = 0; i < targetOutputs.length; i++) {
                            currentOutAmount += targetOutputs[i].Amount;
                        }

                        var addouputs = false;

                        if (!fss) {

                            var currentChangeAmount = targetOutputs[1].Amount;
                            var newChangeAmount = currentChangeAmount - feebump;

                            //allow for dust
                            if (newChangeAmount > 0) {
                                //adjust change output - full rbf
                                targetOutputs[1].Amount = targetOutputs[1].Amount - feebump;
                            }


                            //allow for dust
                            if (newChangeAmount == 0) {
                                targetOutputs.splice(1, 1);
                                //remove target output
                            }

                            if (newChangeAmount < 0) {

                                addouputs = true;

                            }
                        }


                        var dummyChange = 0;
                        if (addouputs || fss) {

                            dummyChange = 1;
                        }

                        //generate a change address incase needed
                        createAddress('m/0/1', dummyChange, function (err, changeaddress) {


                            if (!err) {

                                if (fss || addouputs) {


                                    //we need an additional unspent output to be able to do rbf-fss
                                    //find the smallest one that isn't being spent in the transaction being replaced

                                    //remove any utxos from unspentoutputs that exist in outputs

                                    //removeutxo(unspentoutputs, outputs);

                                    for (var k = 0; k < unspentoutputs.length; k++) {
                                        for (var j = 0; j < outputs.length; j++) {
                                            if (unspentoutputs.length > 0) {
                                                if ((unspentoutputs[k].TransactionId == outputs[j].TransactionId &&
                                             unspentoutputs[k].OutputIndex == outputs[j].OutputIndex) || unspentoutputs[k].IsPending == true) {

                                                    unspentoutputs.splice(k, 1);

                                                    k--;

                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    if (unspentoutputs.length > 0) {

                                        var pitem = unspentoutputs[0];
                                        //allow for dust
                                        if (pitem.Amount > feebump) {

                                            outputs.push(pitem);

                                            //add an additonal change ouput
                                            var addChangeAmount = pitem.Amount - feebump;


                                            if (targetOutputs.length > 1) {
                                                //temp hack
                                                //need to generate new change address here
                                                var acOut = {
                                                    Amount: addChangeAmount,
                                                    Address: changeaddress
                                                };

                                                targetOutputs.push(acOut);
                                            }

                                        }

                                    } else {

                                        return callback(true, "Not enough outputs");

                                    }

                                }



                                var debug = true;
                                var debugtime = 5;
                                var minersFee = 1000;

                                //in the case of mobile the twoFactorCode is actually the device key
                                //and will return a twofactor override code

                                getHotHash(twoFactorCode, function (err, hothash, twoFactorOverride) {

                                    if (twoFactorOverride) {
                                        twoFactorCode = twoFactorOverride;
                                    }


                                    //initialise the hot private key space
                                    var bipHot = new Bitcoin.HDWallet(m_this.m_onlineKey, m_this.m_network);

                                    //zero out buffers
                                    m_this.zeroOnlineKey();

                                    //


                                    var bipHotPub = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.hotPub);
                                    var bipCold = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.coldPub);
                                    var bipNinki = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.ninkiPubKey);


                                    var pdata = { guid: m_this.m_guid, sharedid: m_this.m_sharedid };

                                    statuscallback('Preparing transaction...', '10%');



                                    var outputsToSpend = [];
                                    var amountsToSend = [];
                                    var addressToSend = [];
                                    var userHotPrivKeys = [];

                                    var nodeLevels = [];
                                    var publicKeys = [];
                                    var packet = {
                                        addressToSend: addressToSend,
                                        amountsToSend: amountsToSend,
                                        outputsToSpend: outputsToSpend,
                                        userHotPrivKeys: userHotPrivKeys,
                                        guid: m_this.m_guid,
                                        paths: nodeLevels,
                                        publicKeys: publicKeys
                                    };

                                    //get outputs to spend, calculate change amount minus miners fee

                                    //iterate the unspent outputs and select the first n that equal the amount to spend
                                    //TO DO: do this before doing any key derivation
                                    var amountSoFar = 0;
                                    for (var i = 0; i < outputs.length; i++) {

                                        var pitem = outputs[i];
                                        var pout = {
                                            transactionId: pitem.TransactionId,
                                            outputIndex: pitem.OutputIndex,
                                            amount: pitem.Amount,
                                            address: pitem.Address
                                        };

                                        nodeLevels.push(pitem.NodeLevel);

                                        outputsToSpend.push(pout);

                                        //derive the private key to use for signing

                                        //derive the public keys to use for script generation
                                        //this could be cached on the server as no privacy or hand-off issue that I can see

                                        var dbipHotPub = "";
                                        var dbipColdPub = "";
                                        var dbipNinkiPub = "";


                                        if (pitem.PK1.length > 0) {

                                            if (debug) {
                                                console.log('using cached public key ' + i);
                                            }

                                            dbipHotPub = Bitcoin.convert.hexToBytes(pitem.PK1);
                                            dbipColdPub = Bitcoin.convert.hexToBytes(pitem.PK2);
                                            dbipNinkiPub = Bitcoin.convert.hexToBytes(pitem.PK3);

                                        } else {

                                            if (debug) {
                                                console.log('no cache - deriving ' + i);
                                            }

                                            dbipHotPub = deriveChild(pitem.NodeLevel, bipHotPub).pub.toBytes();
                                            dbipColdPub = deriveChild(pitem.NodeLevel, bipCold).pub.toBytes();
                                            dbipNinkiPub = deriveChild(pitem.NodeLevel, bipNinki).pub.toBytes();

                                        }

                                        publicKeys.push([dbipHotPub, dbipColdPub, dbipNinkiPub]);

                                        //add the amount
                                        amountSoFar += pitem.Amount;

                                    }



                                    for (var i = 0; i < targetOutputs.length; i++) {
                                        addressToSend.push(targetOutputs[i].Address);
                                        amountsToSend.push(targetOutputs[i].Amount);
                                    }


                                    //temp manually adust change
                                    //********************************************
                                    //amountsToSend[1] = amountsToSend[1] - feebump;
                                    //********************************************

                                    //create a new address for my change to be sent back to me
                                    statuscallback('Preparing transaction...', '20%');
                                    //if we are sending money to a contact or paying an invoice
                                    //we need to derive addresses on their behalf

                                    deriveKeys(bipHot, nodeLevels, function (ret) {

                                        if (m_this.Device.isiOS()) {

                                            for (var i = 0; i < ret.length; i++) {

                                                var nkey = new Bitcoin.ECKey(ret[i]);

                                                userHotPrivKeys.push(nkey);

                                            }

                                        } else {

                                            packet.userHotPrivKeys = ret;
                                        }

                                        //zero out bipHot buffers
                                        bipHot.priv = 0;

                                        //now get the  transaction

                                        statuscallback('Creating transaction...', '60%');
                                        setTimeout(function () {

                                            aGetTransactionData(packet, function (err, hashesForSigning, rawTransaction) {

                                                if (!err) {

                                                    statuscallback('Counter-signing transaction...', '80%');

                                                    var jsonSend = {
                                                        guid: m_this.m_guid,
                                                        hashesForSigning: hashesForSigning,
                                                        rawTransaction: rawTransaction,
                                                        pathsToSignWith: nodeLevels
                                                    };
                                                    var jsonp1 = {
                                                        guid: m_this.m_guid,
                                                        jsonPacket: JSON.stringify(jsonSend),
                                                        sharedid: m_this.m_sharedid,
                                                        twoFactorCode: twoFactorCode,
                                                        userName: ''
                                                    };


                                                    API.post("/api/1/u/sendtransaction", jsonp1, function (err, result) {

                                                        bipHot.priv = 0;

                                                        //statuscallback(null, '80%');

                                                        if (!err) {

                                                            statuscallback('Transaction broadcast', '100%');

                                                            return callback(err, result);


                                                        } else {

                                                            if (result == 'ErrSingleTransactionLimit') {

                                                                statuscallback('Transaction Failed: Single limit exceeded', '0%');

                                                                return callback(err, result);

                                                            }

                                                            if (result == 'ErrDailyTransactionLimit') {

                                                                statuscallback('Transaction Failed: Daily limit exceeded', '0%');

                                                                return callback(err, result);
                                                            }

                                                            if (result == 'ErrTransactionsPerDayLimit') {

                                                                statuscallback('Transaction Failed: Daily number limit exceeded', '0%');

                                                                return callback(err, result);
                                                            }

                                                            if (result == 'ErrTransactionsPerHourLimit') {

                                                                statuscallback('Transaction Failed: Hourly number limit exceeded', '0%');

                                                                return callback(err, result);
                                                            }

                                                            if (result == 'ErrInvalidRequest') {

                                                                statuscallback('Transaction Failed: Invalid request', '0%');

                                                                return callback(err, result);
                                                            }


                                                            if (result == 'ErrBroadcastFailed') {

                                                                statuscallback('Transaction Failed: Not accepted', '0%');

                                                                return callback(err, result);
                                                            }

                                                            if (result == "Invalid two factor code") {

                                                                statuscallback("Invalid two factor code", '0%');

                                                                return callback(err, result);
                                                            }

                                                            if (result == "ErrInsufficientFunds") {

                                                                statuscallback("Transaction Failed: Insufficient funds", '0%');

                                                                return callback(err, result);
                                                            }

                                                            statuscallback('Transaction Failed:' + result, '0%');

                                                            return callback(err, result);

                                                        }
                                                    });

                                                } else {

                                                    statuscallback('error creating transaction', '0%');

                                                    return callback(err, 'error creating transaction');

                                                }

                                            });
                                        }, 50);


                                    });

                                });

                            }

                        });
                    }
                });

            }

        });



    }




    this.sendTransaction = sendTransaction;
    function sendTransaction(sendType, friendUserName, addressTo, amount, twoFactorCode, callback, statuscallback, minersFee) {

        var debug = true;
        var debugtime = 5;
        corNodesDone = 0;
        corNodesToProcess = 0;

        if (minersFee.length == 0) {

            minersFee = 10000;

            if (m_this.m_settings.MinersFee) {
                minersFee = m_this.m_settings.MinersFee;
            }

        }

        if (minersFee < 1000) {

            minersFee = 1000;

        }


        amount = Math.round(amount);



        //in the case of mobile the twoFactorCode is actually the device key
        //and will return a twofactor override code

        getHotHash(twoFactorCode, function (err, hothash, twoFactorOverride) {

            if (twoFactorOverride) {
                twoFactorCode = twoFactorOverride;
            }


            //initialise the hot private key space
            var bipHot = new Bitcoin.HDWallet(m_this.m_onlineKey, m_this.m_network);

            //zero out buffers
            m_this.zeroOnlineKey();

            //


            var bipHotPub = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.hotPub);
            var bipCold = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.coldPub);
            var bipNinki = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.ninkiPubKey);


            var pdata = { guid: m_this.m_guid, sharedid: m_this.m_sharedid };

            statuscallback('Preparing transaction...', '10%');

            API.post("/api/1/u/getunspentoutputs", pdata, function (err, outputs) {


                if (!err) {


                    if (debug) {
                        console.log('getunspentoutputs...success');
                    }


                    var outputs = JSON.parse(outputs);
                    var outputsToSpend = [];
                    var amountsToSend = [];
                    var addressToSend = [];
                    var userHotPrivKeys = [];

                    var nodeLevels = [];
                    var publicKeys = [];
                    var packet = {
                        addressToSend: addressToSend,
                        amountsToSend: amountsToSend,
                        outputsToSpend: outputsToSpend,
                        userHotPrivKeys: userHotPrivKeys,
                        guid: m_this.m_guid,
                        paths: nodeLevels,
                        publicKeys: publicKeys
                    };

                    //get outputs to spend, calculate change amount minus miners fee


                    //iterate the unspent outputs and select the first n that equal the amount to spend
                    //TO DO: do this before doing any key derivation
                    var amountSoFar = 0;
                    for (var i = 0; i < outputs.length; i++) {

                        var pitem = outputs[i];
                        var pout = {
                            transactionId: pitem.TransactionId,
                            outputIndex: pitem.OutputIndex,
                            amount: pitem.Amount,
                            address: pitem.Address
                        };

                        nodeLevels.push(pitem.NodeLevel);

                        outputsToSpend.push(pout);

                        //derive the private key to use for signing

                        if (debug) {
                            console.log('derive the private key to use for signing ' + i);
                        }


                        //derive the public keys to use for script generation
                        //this could be cached on the server as no privacy or hand-off issue that I can see

                        var dbipHotPub = "";
                        var dbipColdPub = "";
                        var dbipNinkiPub = "";


                        if (pitem.PK1.length > 0) {

                            if (debug) {
                                console.log('using cached public key ' + i);
                            }

                            dbipHotPub = Bitcoin.convert.hexToBytes(pitem.PK1);
                            dbipColdPub = Bitcoin.convert.hexToBytes(pitem.PK2);
                            dbipNinkiPub = Bitcoin.convert.hexToBytes(pitem.PK3);

                        } else {

                            if (debug) {
                                console.log('no cache - deriving ' + i);
                            }

                            dbipHotPub = deriveChild(pitem.NodeLevel, bipHotPub).pub.toBytes();
                            dbipColdPub = deriveChild(pitem.NodeLevel, bipCold).pub.toBytes();
                            dbipNinkiPub = deriveChild(pitem.NodeLevel, bipNinki).pub.toBytes();

                        }

                        publicKeys.push([dbipHotPub, dbipColdPub, dbipNinkiPub]);

                        //add the amount
                        amountSoFar += pitem.Amount;

                        if ((amountSoFar - amount) >= minersFee) {
                            break;
                        }

                    }



                    //call to cordova plugin for private key derivation


                    amountsToSend.push(amount);

                    //now create the change
                    //again move this before the key derivation
                    var changeAmount = amountSoFar - (amount + minersFee);

                    if (changeAmount < 0) {
                        //this message needs to be handled carefully
                        //as the wallet will most likely have pending confirmations
                        //rather than insufficent funds
                        return callback(true, "ErrInsufficientFunds");
                    }

                    if (changeAmount > 0) {
                        amountsToSend.push(changeAmount);
                    }


                    if (debug) {
                        console.log('change amount...' + changeAmount);
                    }

                    //create a new address for my change to be sent back to me
                    statuscallback('Preparing transaction...', '20%');
                    //if we are sending money to a contact or paying an invoice
                    //we need to derive addresses on their behalf


                    deriveKeys(bipHot, nodeLevels, function (ret) {

                        if (m_this.Device.isiOS()) {

                            for (var i = 0; i < ret.length; i++) {

                                var nkey = new Bitcoin.ECKey(ret[i]);

                                userHotPrivKeys.push(nkey);

                            }

                        } else {

                            packet.userHotPrivKeys = ret;
                        }


                        //zero out bipHot buffers
                        bipHot.priv = 0;


                        if (sendType == 'friend' || sendType == 'invoice') {
                            var params = {
                                guid: m_this.m_guid,
                                sharedid: m_this.m_sharedid,
                                username: friendUserName,
                                amount: amount
                            };

                            //generate the address for the contact
                            //this must be done on the client


                            statuscallback('creating address...', '30%');
                            createAddressForFriend(friendUserName, function (err, address) {

                                if (!err) {


                                    //statuscallback(null, '40%');

                                    addressToSend.push(address);

                                    //create the change address, this must be done on the client
                                    statuscallback('Creating change address...', '60%');


                                    createAddress('m/0/1', changeAmount, function (err, changeaddress) {

                                        if (!err) {

                                            if (changeAmount > 0) {
                                                addressToSend.push(changeaddress);
                                            }

                                            //now get the  transaction data
                                            statuscallback('Building transaction...', '80%');
                                            setTimeout(function () {
                                                aGetTransactionData(packet, function (err, hashesForSigning, rawTransaction) {

                                                    if (!err) {

                                                        statuscallback(null, '80%');

                                                        var jsonSend = {
                                                            guid: m_this.m_guid,
                                                            hashesForSigning: hashesForSigning,
                                                            rawTransaction: rawTransaction,
                                                            pathsToSignWith: nodeLevels
                                                        };
                                                        var jsonp1 = {
                                                            guid: m_this.m_guid,
                                                            jsonPacket: JSON.stringify(jsonSend),
                                                            sharedid: m_this.m_sharedid,
                                                            twoFactorCode: twoFactorCode,
                                                            userName: friendUserName
                                                        };


                                                        statuscallback('Counter-signing transaction...', '80%');

                                                        //send the transaction to the service for countersigning and broadcast to the network


                                                        //requires 2 factor authentication

                                                        API.post("/api/1/u/sendtransaction", jsonp1, function (err, result) {

                                                            bipHot.priv = 0;

                                                            if (!err) {

                                                                statuscallback('Transaction broadcast...', '100%');

                                                                return callback(err, result);


                                                            } else {

                                                                //handle error messages returned from the server
                                                                if (result == 'ErrSingleTransactionLimit') {

                                                                    statuscallback('Transaction Failed: Single limit exceeded', '0%');

                                                                    return callback(err, result);

                                                                }

                                                                if (result == 'ErrDailyTransactionLimit') {

                                                                    statuscallback('Transaction Failed: Daily limit exceeded', '0%');

                                                                    return callback(err, result);
                                                                }

                                                                if (result == 'ErrTransactionsPerDayLimit') {

                                                                    statuscallback('Transaction Failed: Daily number limit exceeded', '0%');

                                                                    return callback(err, result);
                                                                }

                                                                if (result == 'ErrTransactionsPerHourLimit') {

                                                                    statuscallback('Transaction Failed: Hourly number limit exceeded', '0%');

                                                                    return callback(err, result);
                                                                }

                                                                if (result == 'ErrInvalidRequest') {

                                                                    statuscallback('Transaction Failed: Invalid request', '0%');

                                                                    return callback(err, result);
                                                                }


                                                                if (result == 'ErrBroadcastFailed') {

                                                                    statuscallback('Transaction Failed: Not accepted', '0%');

                                                                    return callback(err, result);
                                                                }

                                                                if (result == "Invalid two factor code") {

                                                                    statuscallback("Invalid two factor code", '0%');

                                                                    return callback(err, result);
                                                                }

                                                                if (result == "ErrInsufficientFunds") {
                                                                    statuscallback("Transaction Failed: Insufficient funds", '0%');

                                                                    return callback(err, result);
                                                                }

                                                                if (result == "ErrLocked") {

                                                                    statuscallback("Contact account is unavailable", '0%');

                                                                    return callback(err, result);
                                                                }

                                                                statuscallback('Transaction Failed:' + result, '0%');

                                                                return callback(err, result);

                                                            }
                                                        });

                                                    }


                                                });
                                            }, debugtime);
                                        } else {
                                            //create address error

                                            statuscallback(changeaddress, '0%');
                                            return callback(err, changeaddress);

                                        }
                                    });
                                } else {


                                    statuscallback(address, '0%');
                                    return callback(err, address);


                                }
                            });
                        } else {

                            statuscallback('Creating change address...', '40%');

                            addressToSend.push(addressTo);

                            if (debug) {
                                console.log("start creating change address");
                            }
                            //create the change address, this must be done on the client
                            createAddress('m/0/1', changeAmount, function (err, changeaddress) {

                                if (!err) {

                                    if (debug) {
                                        console.log("finished creating change address");
                                    }


                                    if (changeAmount > 0) {
                                        addressToSend.push(changeaddress);
                                    }

                                    //now get the  transaction

                                    statuscallback('Creating transaction...', '60%');
                                    setTimeout(function () {

                                        aGetTransactionData(packet, function (err, hashesForSigning, rawTransaction) {

                                            if (!err) {

                                                statuscallback('Counter-signing transaction...', '80%');

                                                var jsonSend = {
                                                    guid: m_this.m_guid,
                                                    hashesForSigning: hashesForSigning,
                                                    rawTransaction: rawTransaction,
                                                    pathsToSignWith: nodeLevels
                                                };
                                                var jsonp1 = {
                                                    guid: m_this.m_guid,
                                                    jsonPacket: JSON.stringify(jsonSend),
                                                    sharedid: m_this.m_sharedid,
                                                    twoFactorCode: twoFactorCode,
                                                    userName: ''
                                                };


                                                API.post("/api/1/u/sendtransaction", jsonp1, function (err, result) {

                                                    bipHot.priv = 0;

                                                    //statuscallback(null, '80%');

                                                    if (!err) {

                                                        statuscallback('Transaction broadcast', '100%');

                                                        return callback(err, result);


                                                    } else {

                                                        if (result == 'ErrSingleTransactionLimit') {

                                                            statuscallback('Transaction Failed: Single limit exceeded', '0%');

                                                            return callback(err, result);

                                                        }

                                                        if (result == 'ErrDailyTransactionLimit') {

                                                            statuscallback('Transaction Failed: Daily limit exceeded', '0%');

                                                            return callback(err, result);
                                                        }

                                                        if (result == 'ErrTransactionsPerDayLimit') {

                                                            statuscallback('Transaction Failed: Daily number limit exceeded', '0%');

                                                            return callback(err, result);
                                                        }

                                                        if (result == 'ErrTransactionsPerHourLimit') {

                                                            statuscallback('Transaction Failed: Hourly number limit exceeded', '0%');

                                                            return callback(err, result);
                                                        }

                                                        if (result == 'ErrInvalidRequest') {

                                                            statuscallback('Transaction Failed: Invalid request', '0%');

                                                            return callback(err, result);
                                                        }


                                                        if (result == 'ErrBroadcastFailed') {

                                                            statuscallback('Transaction Failed: Not accepted', '0%');

                                                            return callback(err, result);
                                                        }

                                                        if (result == "Invalid two factor code") {

                                                            statuscallback("Invalid two factor code", '0%');

                                                            return callback(err, result);
                                                        }

                                                        if (result == "ErrInsufficientFunds") {

                                                            statuscallback("Transaction Failed: Insufficient funds", '0%');

                                                            return callback(err, result);
                                                        }

                                                        statuscallback('Transaction Failed:' + result, '0%');

                                                        return callback(err, result);

                                                    }
                                                });

                                            } else {

                                                statuscallback('error creating transaction', '0%');

                                                return callback(err, 'error creating transaction');

                                            }

                                        });
                                    }, 50);
                                } else {

                                    //create address error

                                    statuscallback(changeaddress, '0%');

                                    return callback(err, changeaddress);

                                }
                            });
                        }
                    });

                } else {

                    statuscallback(outputs, '0%');

                    return callback(err, outputs);

                }

            });

        });

    }

    //function createAddress
    //this function creates an address for the user
    this.createAddress = createAddress;

    function createAddress(nodePath, changeamount, cacallback) {


        if (changeamount > 0) {

            var snode = nodePath.split('/');

            var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, pathToUse: nodePath };

            //get the next leaf from the user's node space
            API.post("/api/1/u/getnextleaf", postData, function (err, leaf) {

                if (!err) {

                    var path = nodePath + '/' + leaf;

                    if (m_this.Device.isiOS()) {

                        var tnode = snode[2] * 1;

                        var hotKey = [];
                        var coldKey = [];
                        var ninkiKey = [];

                        var hhotKey = '';
                        var hcoldKey = '';
                        var hninkiKey = '';

                        cordova.exec(

                            function callback(data) {

                                hhotKey = data;

                                hotKey = Bitcoin.convert.hexToBytes(data);

                                cordova.exec(

                                    function callback(data) {

                                        hcoldKey = data;

                                        coldKey = Bitcoin.convert.hexToBytes(data);

                                        cordova.exec(

                                            function callback(data) {

                                                hninkiKey = data;

                                                ninkiKey = Bitcoin.convert.hexToBytes(data);

                                                var script = [0x52];

                                                script.push(33);
                                                script = script.concat(hotKey);
                                                script.push(33);
                                                script = script.concat(coldKey);
                                                script.push(33);
                                                script = script.concat(ninkiKey);
                                                script.push(0x53);
                                                script.push(0xae);

                                                var address = multiSig(script);

                                                //post the address back to the server
                                                //this allows the server to monitor for balances etc.
                                                var postData = {
                                                    guid: m_this.m_guid,
                                                    sharedid: m_this.m_sharedid,
                                                    path: path,
                                                    address: address,
                                                    pk1: hhotKey,
                                                    pk2: hcoldKey,
                                                    pk3: hninkiKey
                                                };
                                                API.post("/api/1/u/createaddress", postData, function (err, result) {

                                                    if (!err) {
                                                        return cacallback(err, address);
                                                    } else {
                                                        return cacallback(err, result);
                                                    }

                                                });

                                            },
                                            function errorHandler(err) {
                                                //alert('Error');
                                            },
                                            'ECPlugin',
                                            'cordovaECMult',
                                            [m_this.m_walletinfo.ninkiPubKey, tnode, leaf]
                                        );

                                    },
                                    function errorHandler(err) {
                                        //alert('Error');
                                    },
                                    'ECPlugin',
                                    'cordovaECMult',
                                    [m_this.m_walletinfo.coldPub, tnode, leaf]
                                );

                            },
                            function errorHandler(err) {
                                //alert('Error');
                            },
                            'ECPlugin',
                            'cordovaECMult',
                            [m_this.m_walletinfo.hotPub, tnode, leaf]
                        );

                    } else {


                        //derive the 3 public keys for the new address
                        //TODO: possible to use an encrypted cache for performance improvements


                        //so, do we still do this on first addreess generate or on account create?
                        //would add 6-7 seconds to account creation process

                        var cachepath = nodePath.replace('/', '');
                        cachepath = cachepath.replace('/', '');

                        m_this.Device.getSecureStorageObject("pubcache" + cachepath, m_this.m_deviceSecKey, m_this.decrypt, false, function (pubcache) {

                            //if this is

                            //logic ot reset if any issue with cache/decryption


                            //only cache on android
                            if (pubcache == '' || !m_this.Device.isCordova()) {

                                //derive the root node path and cache

                                var obipHot = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.hotPub);
                                var obipCold = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.coldPub);
                                var obipNinki = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.ninkiPubKey);


                                var hotKey = deriveChild(nodePath, obipHot);
                                var coldKey = deriveChild(nodePath, obipCold);
                                var ninkiKey = deriveChild(nodePath, obipNinki);

                                var opubcache = {};
                                opubcache.hotKey = hotKey.toBase58();
                                opubcache.coldKey = coldKey.toBase58();
                                opubcache.ninkiKey = ninkiKey.toBase58();

                                pubcache = opubcache;

                                //only set this on mobile
                                if (m_this.Device.isCordova()) {
                                    m_this.Device.setSecureStorageObject("pubcache" + cachepath, opubcache, m_this.m_deviceSecKey, m_this.encrypt);
                                }

                            }


                            var bipHot = Bitcoin.HDWallet.fromBase58(pubcache.hotKey);
                            var bipCold = Bitcoin.HDWallet.fromBase58(pubcache.coldKey);
                            var bipNinki = Bitcoin.HDWallet.fromBase58(pubcache.ninkiKey);


                            var hotKey = bipHot.derive(leaf);

                            var coldKey = bipCold.derive(leaf);

                            var ninkiKey = bipNinki.derive(leaf);

                            //now create the multisig address
                            var script = [0x52];

                            script.push(33);
                            script = script.concat(hotKey.pub.toBytes());
                            script.push(33);
                            script = script.concat(coldKey.pub.toBytes());
                            script.push(33);
                            script = script.concat(ninkiKey.pub.toBytes());
                            script.push(0x53);
                            script.push(0xae);

                            var address = multiSig(script);

                            //post the address back to the server
                            //this allows the server to monitor for balances etc.
                            var postData = {
                                guid: m_this.m_guid,
                                sharedid: m_this.m_sharedid,
                                path: path,
                                address: address,
                                pk1: hotKey.pub.toString(),
                                pk2: coldKey.pub.toString(),
                                pk3: ninkiKey.pub.toString()
                            };


                            API.post("/api/1/u/createaddress", postData, function (err, result) {

                                if (!err) {
                                    return cacallback(err, address);
                                } else {
                                    return cacallback(err, result);
                                }

                            });
                        });
                    }

                } else {

                    return cacallback(err, leaf);

                }

                //now update the address to the server

            });

        } else {
            return cacallback(false, "skipped");
        }

    }

    //function createAddress
    //this function creates an address on behalf of a user's contact
    this.createAddressForFriend = createAddressForFriend;
    function createAddressForFriend(username, cacallback) {

        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };


        API.post("/api/1/u/getfriendpacket", postData, function (err, packet) {

            if (!err) {

                //get the packet from friend containing the public key set to
                //be used for address generation and decrypt

                var msg = openpgp.message.readArmored(packet);
                var decrypted = openpgp.decryptAndVerifyMessage(m_this.m_privKey, [m_this.m_pubKey], msg);

                var pubkeys = JSON.parse(sanitizer.sanitize(decrypted.text));
                //var pubkeys = decrypt(packet, password, params.oguid);
                //only allow address to be created if the packet has been validated
                if (pubkeys.validated) {
                    //get the next leaf on the contacts address space node assigned to this user

                    API.post("/api/1/u/getnextleafforfriend", postData, function (err, leaf) {

                        if (!err) {

                            //derive the public keys
                            var path = 'm/' + leaf;


                            if (m_this.Device.isiOS()) {


                                var nleaf = leaf * 1;

                                var hotKey = [];
                                var coldKey = [];
                                var ninkiKey = [];

                                var hhotKey = '';
                                var hcoldKey = '';
                                var hninkiKey = '';

                                cordova.exec(
                                    function callback(data) {

                                        hhotKey = data;

                                        hotKey = Bitcoin.convert.hexToBytes(data);


                                        cordova.exec(
                                            function callback(data) {

                                                hcoldKey = data;

                                                coldKey = Bitcoin.convert.hexToBytes(data);

                                                cordova.exec(
                                                    function callback(data) {

                                                        hninkiKey = data;

                                                        ninkiKey = Bitcoin.convert.hexToBytes(data);


                                                        var script = [0x52];

                                                        script.push(33);
                                                        script = script.concat(hotKey);
                                                        script.push(33);
                                                        script = script.concat(coldKey);
                                                        script.push(33);
                                                        script = script.concat(ninkiKey);
                                                        script.push(0x53);
                                                        script.push(0xae);

                                                        var address = multiSig(script);

                                                        //post the address back to the server
                                                        //this allows the server to monitor for balances etc.
                                                        //register the address with the server
                                                        var postData = {
                                                            guid: m_this.m_guid,
                                                            sharedid: m_this.m_sharedid,
                                                            username: username,
                                                            address: address,
                                                            leaf: leaf,
                                                            pk1: hhotKey,
                                                            pk2: hcoldKey,
                                                            pk3: hninkiKey
                                                        };
                                                        API.post("/api/1/u/createaddressforfriend", postData, function (err, result) {

                                                            if (!err) {
                                                                return cacallback(err, address);
                                                            } else {
                                                                return cacallback(err, result);
                                                            }

                                                        });

                                                    },
                                                    function errorHandler(err) {
                                                        //alert('Error');
                                                    },
                                                    'ECPlugin',
                                                    'cordovaECMultCached',
                                                    [pubkeys.ninkiPub, nleaf]
                                                );

                                            },
                                            function errorHandler(err) {
                                                //alert('Error');
                                            },
                                            'ECPlugin',
                                            'cordovaECMultCached',
                                            [pubkeys.coldPub, nleaf]
                                        );

                                    },
                                    function errorHandler(err) {
                                        //alert('Error');
                                    },
                                    'ECPlugin',
                                    'cordovaECMultCached',
                                    [pubkeys.hotPub, nleaf]
                                );


                            } else {


                                var bipHot = Bitcoin.HDWallet.fromBase58(pubkeys.hotPub);
                                var bipCold = Bitcoin.HDWallet.fromBase58(pubkeys.coldPub);
                                var bipNinki = Bitcoin.HDWallet.fromBase58(pubkeys.ninkiPub);

                                var hotKey = deriveChild(path, bipHot);
                                var coldKey = deriveChild(path, bipCold);
                                var ninkiKey = deriveChild(path, bipNinki);

                                //now create the multisig address
                                var script = [0x52];
                                script.push(33);
                                script = script.concat(hotKey.pub.toBytes());
                                script.push(33);
                                script = script.concat(coldKey.pub.toBytes());
                                script.push(33);
                                script = script.concat(ninkiKey.pub.toBytes());
                                script.push(0x53);
                                script.push(0xae);
                                var address = multiSig(script);

                                //register the address with the server
                                var postData = {
                                    guid: m_this.m_guid,
                                    sharedid: m_this.m_sharedid,
                                    username: username,
                                    address: address,
                                    leaf: leaf,
                                    pk1: hotKey.pub.toString(),
                                    pk2: coldKey.pub.toString(),
                                    pk3: ninkiKey.pub.toString()
                                };
                                API.post("/api/1/u/createaddressforfriend", postData, function (err, result) {

                                    if (!err) {
                                        return cacallback(err, address);
                                    } else {
                                        return cacallback(err, result);
                                    }

                                });
                            }

                        } else {

                            return cacallback(err, leaf);

                        }

                        //now update the address to the server

                    });


                } else {

                    //something very bad has happened
                    //attempting to derive an address for a non validated contact
                    return cacallback(true, "ErrInvalid");
                }

            } else {

                return cacallback(true, "ErrInvalid");

            }

        });

    }

    //multi sig address hash
    function multiSig(rs) {
        var x = Bitcoin.Crypto.RIPEMD160(Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(rs)));
        x = Bitcoin.convert.wordArrayToBytes(x);
        if (m_this.m_network == "testnet") {
            x.unshift(196);
        } else {
            x.unshift(0x5);
        }
        var r = x;
        r = Bitcoin.Crypto.SHA256(Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(r)));
        var checksum = Bitcoin.convert.wordArrayToBytes(r).slice(0, 4);
        var address = Bitcoin.base58.encode(x.concat(checksum));
        return address;
    }


    this.signMessage = signMessage;
    function signMessage(key, message, callback) {

        if (key.length > 0) {

            var bip39 = new BIP39();

            var mkey = bip39.mnemonicToHex(key);

            var skey = Bitcoin.HDWallet.fromSeedHex(mkey, m_this.m_network);

            var sig = Bitcoin.convert.bytesToHex(skey.priv.sign(Bitcoin.convert.hexToBytes(message)));

            callback(false, sig);

        } else {

            callback(false, '');

        }

    }


    this.decodeKey = decodeKey;
    function decodeKey(key) {
        var bip39 = new BIP39();
        var mkey = bip39.mnemonicToHex(key);
        return Bitcoin.convert.hexToBytes(mkey);
    }

    this.encodeKey = encodeKey;
    function encodeKey(key) {
        var bip39 = new BIP39();
        var mkey = bip39.entropyToMnemonic(key);
        return mkey;
    }


    this.getPassKey = getPassKey;
    function getPassKey(hotkey, coldkey, epass, iv, callback) {

        var bip39 = new BIP39();

        var hkey = bip39.mnemonicToHex(hotkey);
        var ckey = bip39.mnemonicToHex(coldkey);

        var hckey = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(Bitcoin.convert.hexToBytes(hkey + ckey))).toString();

        var passkey = decryptNp(epass, hckey, iv);

        callback(false, passkey);

    }


    //reengineer this
    //pull back validated proprty from database
    //only do this part on friend selection
    this.getUserNetwork = getUserNetwork;
    function getUserNetwork(timestamp, lkey, pageFrom, pageTo, callback) {
        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, timestamp: timestamp, lkey: lkey, pageFrom: pageFrom, pageTo: pageTo };
        API.post("/api/2/u/getusernetwork", postData, function (err, data) {
            if (!err) {
                var friends = JSON.parse(data);
                return callback(err, friends);
            } else {
                return callback(err, data);
            }
        });
    }


    this.getFriend = getFriend;
    function getFriend(username, callback) {

        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };

        return API.post("/api/1/u/getfriend", postData, function (err, data) {
            if (!err) {
                var friend = JSON.parse(data);
                return callback(err, friend);
            } else {
                return callback(err, data);
            }
        });

    }

    //add error handling here
    //very impoirtant for mobile
    //


    this.createFriend = createFriend;
    function createFriend(username, uimessage, cbcallback) {

        //get the next friend node
        var node = "";
        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };

        API.post("/api/1/u/getnextnodeforfriend", postData, function (err, node) {

            if (m_this.Device.isiOS()) {

                var nls = node.split("/");
                var tnode = nls[2] * 1;



                var hotKey = '';
                var coldKey = '';
                var ninkiKey = '';

                cordova.exec(function callback(data) {

                    hotKey = Bitcoin.HDWallet.fromHex(data).toString();

                    cordova.exec(function callback(data) {

                        coldKey = Bitcoin.HDWallet.fromHex(data).toString();

                        cordova.exec(function callback(data) {

                            ninkiKey = Bitcoin.HDWallet.fromHex(data).toString();


                            API.post("/api/1/u/getrsakey", postData, function (err, rsaKey) {

                                var publicKeys = openpgp.key.readArmored(rsaKey);

                                var pubKey = publicKeys.keys[0];

                                var message = hotKey + coldKey + ninkiKey;

                                var encrypted = openpgp.signAndEncryptMessage([pubKey], m_this.m_privKey, message)

                                var result = "";

                                var postFriendData = {
                                    guid: m_this.m_guid,
                                    sharedid: m_this.m_sharedid,
                                    username: username,
                                    node: node,
                                    packetForFriend: encrypted,
                                    validationHash: ''
                                };

                                API.post("/api/1/u/createfriend", postFriendData, function (err, result) {

                                    return cbcallback(err, result);

                                });

                            });

                        },
                        function errorHandler(err) {
                            alert(err);
                        },
                         'ECPlugin',
                        'cordovaDerMPK',
                        [m_this.m_walletinfo.ninkiPubKey, tnode]
                    );

                    }, function errorHandler(err) {
                        alert(err);
                    },
                    'ECPlugin',
                    'cordovaDerMPK',
                    [m_this.m_walletinfo.coldPub, tnode]
                );

                }, function errorHandler(err) {
                    alert(err);
                },
                'ECPlugin',
                'cordovaDerMPK',
                [m_this.m_walletinfo.hotPub, tnode]
            );


            } else {


                var bipHot = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.hotPub);

                var bipCold = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.coldPub);

                var bipNinki = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.ninkiPubKey);

                var hotKey = deriveChild(node, bipHot).toString();

                var coldKey = deriveChild(node, bipCold).toString();

                var ninkiKey = deriveChild(node, bipNinki).toString();

                //get the friends public RSA key
                var rsaKey = '';

                API.post("/api/1/u/getrsakey", postData, function (err, rsaKey) {

                    var publicKeys = openpgp.key.readArmored(rsaKey);

                    var pubKey = publicKeys.keys[0];

                    var message = hotKey + coldKey + ninkiKey;

                    var encrypted = openpgp.signAndEncryptMessage([pubKey], m_this.m_privKey, message);

                    var result = "";

                    var postFriendData = {
                        guid: m_this.m_guid,
                        sharedid: m_this.m_sharedid,
                        username: username,
                        node: node,
                        packetForFriend: encrypted,
                        validationHash: ''
                    };
                    API.post("/api/1/u/createfriend", postFriendData, function (err, result) {

                        return cbcallback(err, result);

                    });

                });

            }

        });
    }


    this.acceptFriend = acceptFriend;
    function acceptFriend(username, callback) {


        //need to add error handling and messages here

        m_this.acceptFriendRequest(username, function (err, secret) {

            if (err) {

                return callback(err, secret);

            } else {

                m_this.isNetworkExist(username, function (err, result) {

                    //if (!err) {

                    if (!result) {

                        m_this.createFriend(username, '', function (err, result) {

                            if (err) {

                                return callback(err, result);
                            } else {

                                return callback(err, result);
                            }
                        });

                    } else {

                        return callback(err, result);
                    }
                    //} else {
                    //    return callback(err, result);
                    //}

                });
            }

        });


    }



    this.acceptFriendRequest = acceptFriendRequest;
    function acceptFriendRequest(username, callback, progress) {

        if (progress) {
            progress("Getting request..");
        }

        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };
        API.post("/api/1/u/getfriendrequestpacket", postData, function (err, packet) {

            //get the packet from friend containing the public key set to
            //be used for address generation


            if (progress) {
                progress("Encrypting data...");
            }

            var message = packet;

            var rsaKey = '';
            var postRSAData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };
            API.post("/api/1/u/getrsakey", postRSAData, function (err, rsaKey) {

                //friends public key
                var publicKeys = openpgp.key.readArmored(rsaKey);

                //we need to get friends public key here to verify the signature on the packet
                //then out of band if they verify the signature belongs to them- they are good

                var pubKey = publicKeys.keys[0];

                var msg = openpgp.message.readArmored(message);
                var decrypted = openpgp.decryptAndVerifyMessage(m_this.m_privKey, [pubKey], msg);

                var isValid = decrypted.signatures[0].valid;
                if (isValid) {

                    var keys = sanitizer.sanitize(decrypted.text);

                    var key1 = keys.substring(0, 111);
                    var key2 = keys.substring(111, 222);
                    var key3 = keys.substring(222, 333);


                    var packet = {
                        hotPub: key1,
                        coldPub: key2,
                        ninkiPub: key3,
                        rsaKey: rsaKey,
                        validated: false
                    };

                    if (progress) {
                        progress("Signing data...");
                    }


                    var encrypted = openpgp.signAndEncryptMessage([m_this.m_pubKey], m_this.m_privKey, JSON.stringify(packet));

                    postData = {
                        guid: m_this.m_guid,
                        sharedid: m_this.m_sharedid,
                        username: username,
                        packet: encrypted,
                        validationHash: ''
                    };

                    API.post("/api/1/u/updatefriend", postData, function (err, result) {
                        return callback(err, result);
                    });
                }

            });
        });

    }


    this.getFingerPrint = getFingerPrint;
    function getFingerPrint(callback) {

        //now all we need to do is provide the fingerprint of the user's public key

        return callback(false, m_this.m_pubKey.primaryKey.fingerprint);

    }

    this.verifyFriendData = verifyFriendData;
    function verifyFriendData(username, code, callback, progress) {

        //update packet with status as verified and log
        //the verification code

        if (progress) {
            progress("Getting packet...");
        }

        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };
        API.post("/api/1/u/getfriendpacket", postData, function (err, packet) {

            if (!err) {

                var msg = openpgp.message.readArmored(packet);
                var decrypted = openpgp.decryptAndVerifyMessage(m_this.m_privKey, [m_this.m_pubKey], msg);

                var isValid = decrypted.signatures[0].valid;
                if (isValid) {

                    var payload = JSON.parse(sanitizer.sanitize(decrypted.text));

                    var publicKeysUsed = openpgp.key.readArmored(payload.rsaKey);
                    var pubKeyUsed = publicKeysUsed.keys[0];

                    if (code == pubKeyUsed.primaryKey.fingerprint) {


                        if (progress) {
                            progress("Verifying...");
                        }

                        var reencrypt = {
                            hotPub: payload.hotPub,
                            coldPub: payload.coldPub,
                            ninkiPub: payload.ninkiPub,
                            rsaKey: payload.rsaKey,
                            validated: true
                        };

                        var encryptedPayload = openpgp.signAndEncryptMessage([m_this.m_pubKey], m_this.m_privKey, JSON.stringify(reencrypt));

                        postData = {
                            guid: m_this.m_guid,
                            sharedid: m_this.m_sharedid,
                            username: username,
                            packet: encryptedPayload,
                            validationHash: code
                        };


                        if (progress) {
                            progress("Updating...");
                        }

                        API.post("/api/1/u/updatefriend", postData, function (err, result) {

                            return callback(err, result);

                        });


                    } else {

                        return callback(err, false);

                    }

                }
            } else {

                return callback(err, packet);

            }


        });
    }


    //status
    //0 pending
    //1 paid
    //2 rejected
    //3 notsent

    this.createInvoice = createInvoice;
    function createInvoice(username, invoice, callback) {

        var packetForMe = "";
        var packetForThem = "";

        var jsonInvoice = JSON.stringify(invoice);

        //get the contacts RSA key

        //encrypt the packet for me with my public rsa key and sign with my private key

        var rsaKey = '';
        var postRSAData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };
        API.post("/api/1/u/getrsakey", postRSAData, function (err, rsaKey) {

            var publicKeys = openpgp.key.readArmored(rsaKey);


            var pubKey = publicKeys.keys[0];

            //here we need to persist the public key used to
            //encrypt the data

            //get the RSA private key from the encrypted payload

            //generate a hash from the RSA key and public keys for verification
            var message = jsonInvoice;

            var encrypted = openpgp.signAndEncryptMessage([pubKey], m_this.m_privKey, message);

            //encrypt with my public key and sin with my priv key
            var packetForMe = openpgp.signAndEncryptMessage([m_this.m_pubKey], m_this.m_privKey, message);


            var result = "";

            var pdata = {
                guid: m_this.m_guid,
                sharedid: m_this.m_sharedid,
                userName: username,
                packetForMe: packetForMe,
                packetForThem: encrypted
            };
            API.post("/api/1/u/createinvoice", pdata, function (err, invoiceid) {

                return callback(err, invoiceid);

            });

        });

    }


    this.createMessage = createMessage;
    function createMessage(username, message, transactionid, messageId, callback) {

        var packetForMe = "";
        var packetForThem = "";

        var jsonMessage = JSON.stringify(message);

        //get the contacts RSA key

        //encrypt the packet for me with my public rsa key and sign with my private key

        var rsaKey = '';
        var postRSAData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };
        API.post("/api/1/u/getrsakey", postRSAData, function (err, rsaKey) {

            var publicKeys = openpgp.key.readArmored(rsaKey);


            var pubKey = publicKeys.keys[0];

            //here we need to persist the public key used to
            //encrypt the data

            //get the RSA private key from the encrypted payload

            //generate a hash from the RSA key and public keys for verification
            var message = jsonMessage;

            var encrypted = openpgp.signAndEncryptMessage([pubKey], m_this.m_privKey, message);

            //encrypt with my public key and sin with my priv key
            var packetForMe = openpgp.signAndEncryptMessage([m_this.m_pubKey], m_this.m_privKey, message);


            var result = "";

            var pdata = {
                guid: m_this.m_guid,
                sharedid: m_this.m_sharedid,
                userName: username,
                packetForMe: packetForMe,
                packetForThem: encrypted,
                transactionId: transactionid,
                messageId: messageId
            };
            API.post("/api/1/u/createmessage", pdata, function (err, invoiceid) {

                return callback(err, invoiceid);

            });

        });

    }


    this.UnpackInvoiceByMe = UnpackInvoiceByMe;
    function UnpackInvoiceByMe(invoice, username, callback) {


        //here decrypt the invoice with my private key

        var msg = openpgp.message.readArmored(invoice.Packet);
        var decrypted = openpgp.decryptAndVerifyMessage(m_this.m_privKey, [m_this.m_pubKey], msg);

        var unpackedInvoice = JSON.parse(sanitizer.sanitize(decrypted.text));

        callback(false, unpackedInvoice);


    }

    this.UnpackInvoiceForMe = UnpackInvoiceForMe;
    function UnpackInvoiceForMe(invoice, username, invtype, callback) {

        //here decrypt the invoice with my private key

        var rsaKey = '';
        var postRSAData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };
        API.post("/api/1/u/getrsakey", postRSAData, function (err, rsaKey) {

            //friends public key

            //we need to get friends public key here to verify the signature on the packet
            //then out of band if they verify the signature belongs to them- they are good

            if (invtype == 'forme') {
                var publicKeys = openpgp.key.readArmored(rsaKey);
                pubKey = publicKeys.keys[0];
            } else {
                pubKey = m_this.m_pubKey;
            }

            var msg = openpgp.message.readArmored(invoice.Packet);
            var decrypted = openpgp.decryptAndVerifyMessage(m_this.m_privKey, [pubKey], msg);

            var isValid = decrypted.signatures[0].valid;
            if (isValid) {

                var json = JSON.parse(sanitizer.sanitize(decrypted.text));

                //remove any xss data
                callback(false, json);

            } else {

                callback(false, "error");

            }

        });


    }



    this.UnpackMessages = UnpackMessages;
    function UnpackMessages(messages, username, callback) {

        //here decrypt the invoice with my private key

        var rsaKey = '';
        var postRSAData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };
        API.post("/api/1/u/getrsakey", postRSAData, function (err, rsaKey) {

            //friends public key

            //we need to get friends public key here to verify the signature on the packet
            //then out of band if they verify the signature belongs to them- they are good
            var friendspubkey = null;

            var publicKeys = openpgp.key.readArmored(rsaKey);
            friendspubkey = publicKeys.keys[0];


            for (var i = 0; i < messages.length; i++) {

                var pubKey = null;
                var packet = null;
                if (messages[i].UserName == m_this.m_nickname) {

                    pubKey = friendspubkey;

                    packet = messages[i].PacketForThem;

                } else {

                    pubKey = m_this.m_pubKey;

                    packet = messages[i].PacketForMe;
                }

                var msg = openpgp.message.readArmored(packet);
                var decrypted = openpgp.decryptAndVerifyMessage(m_this.m_privKey, [pubKey], msg);

                var isValid = decrypted.signatures[0].valid;
                if (isValid) {

                    try {
                        var json = JSON.parse(sanitizer.sanitize(decrypted.text));

                        messages[i].message = json;

                    } catch (e) {

                        messages[i].message = '';

                    }
                }

            }

            callback(false, messages);


        });


    }



    //security
    this.SaveTwoFactor = SaveTwoFactor;
    function SaveTwoFactor(twoFactorCode, verifyToken, callback) {

        var postData = {
            guid: m_this.m_guid,
            sharedid: m_this.m_sharedid,
            twoFactorCode: twoFactorCode,
            verifyToken: verifyToken
        };

        API.post("/api/1/u/updatetwofactor", postData, function (err, result) {

            if (!err) {

                API.registerToken(result);
                m_this.m_APIToken = result;

                callback(false, result);

            } else {

                callback(true, result);

            }
        });

    }


    this.SetupTwoFactor = SetupTwoFactor;
    function SetupTwoFactor(twoFactorCode, callback) {

        var postData = {
            guid: m_this.m_guid,
            sharedid: m_this.m_sharedid,
            twoFactorCode: twoFactorCode,
            verifyToken: ''
        };

        API.post("/api/1/u/updatetwofactor", postData, function (err, result) {

            if (!err) {

                API.registerToken(result);

            }

            callback(err, result);

        });

    }


    this.ResetTwoFactor = ResetTwoFactor;
    function ResetTwoFactor(fguid, fusername, fpwd, callback) {

        //stretch password

        //download the recovery packet
        //decrypt
        //return shared secret
        //no feedback apart from, please check your email
        fpwd = pbkdf2(fpwd, fguid);

        API.post("/api/1/getrecoverypacket", {
            guid: fguid,
            username: fusername
        }, function (err, response) {

            if (err) {

                callback(err, response);

            } else {

                //decrypt packet

                var jpacket = JSON.parse(response);

                try {
                    var dpacket = decrypt(jpacket.packet, fpwd, jpacket.IV);

                    API.post("/api/1/verifyrecoverpacket", { guid: fguid, token: dpacket }, function (err, response) {

                        callback(err, response);

                    });
                } catch (error) {

                    callback(true, "error");

                }

            }

            fpwd = '';

        });

    }


    this.ChangePassword = ChangePassword;
    function ChangePassword(twoFactorCode, oldpassword, newpassword, callback, statusUpdate) {


        API.getWalletFromServer(m_this.m_guid, m_this.m_secret, twoFactorCode, false, function (err, wallet) {

            if (!err) {

                //check password strength

                //stretch old password
                //verify that it matches the current one

                getHotHash("", function (err, hothash) {


                    statusUpdate('Securing password...', '20%');


                    setTimeout(function () {

                        //if password reset do not pbkdf the password

                        if (oldpassword != m_this.m_password) {
                            oldpassword = pbkdf2(oldpassword, m_this.m_oguid);
                        }

                        //get the two packets

                        statusUpdate('Getting packets...', '40%');

                        //decrypt with the old password
                        var decryptedWithOld = true;
                        var decryptedPayload = '';
                        try {
                            decryptedPayload = decrypt(wallet.Payload, oldpassword, wallet.IV);
                        } catch (err) {
                            decryptedWithOld = false;
                        }

                        if (decryptedWithOld) {


                            statusUpdate('Securing new password...', '80%');

                            API.getUserPacket(m_this.m_guid, m_this.m_sharedid, function (err, encpacket) {

                                var decryptedUsrWithOld = true;
                                var rsaKeyPair = '';
                                try {
                                    rsaKeyPair = decrypt(encpacket.Payload, m_this.m_password, encpacket.IV);
                                } catch (err) {
                                    decryptedUsrWithOld = false;
                                }


                                if (decryptedUsrWithOld) {

                                    //get the verification packet


                                    API.post("/api/1/getrecoverypacket", {
                                        guid: m_this.m_guid
                                    }, function (err, response) {


                                        if (!err) {

                                            //decrypt packet
                                            var decryptedVerWithOld = true;
                                            var jpacket = JSON.parse(response);
                                            var veripacket = '';
                                            try {
                                                veripacket = decryptNp(jpacket.packet, m_this.m_password, jpacket.IV, true);
                                            }
                                            catch (verror) {
                                                decryptedVerWithOld = false;
                                            }


                                            if (decryptedVerWithOld) {

                                                setTimeout(function () {


                                                    newpassword = pbkdf2(newpassword, m_this.m_oguid);


                                                    statusUpdate('Encrypting account packet...', '80%');


                                                    var newpayloadsuccess = true;
                                                    var newpayload = '';
                                                    var newusrpayload = '';
                                                    var newveripacket = '';
                                                    var newpasspacket = '';
                                                    var newAIV = '';
                                                    var newUIV = '';
                                                    var newRIV = '';
                                                    var newPIV = '';
                                                    try {

                                                        newpayload = encrypt(decryptedPayload, newpassword);
                                                        newusrpayload = encrypt(rsaKeyPair, newpassword);
                                                        newveripacket = encryptNp(veripacket, newpassword);

                                                        if (decryptedPayload.hckey) {
                                                            newpasspacket = encryptNp(newpassword, Bitcoin.convert.hexToBytes(decryptedPayload.hckey));
                                                        }

                                                        newAIV = newpayload.iv.toString();
                                                        newUIV = newusrpayload.iv.toString();
                                                        newRIV = newveripacket.iv.toString();

                                                        if (decryptedPayload.hckey) {
                                                            newPIV = newpasspacket.iv.toString();
                                                        }

                                                    } catch (err) {
                                                        newpayloadsuccess = false;
                                                    }

                                                    if (newpayloadsuccess) {

                                                        //$("#chngpwdprogbar").width('90%');
                                                        //$("#chngpwdprogmess").text('Encrypting user packet...');

                                                        //test decryption - then update
                                                        var testpayload = '';
                                                        var testnewusrpayload = '';
                                                        var testveripacket = '';
                                                        var testpasspacket = '';
                                                        var testsuccess = true;
                                                        try {

                                                            testpayload = decrypt(newpayload.toString(), newpassword, newAIV);
                                                            testnewusrpayload = decrypt(newusrpayload.toString(), newpassword, newUIV);
                                                            testveripacket = decryptNp(newveripacket.toString(), newpassword, newRIV, true);

                                                            if (decryptedPayload.hckey) {
                                                                testpasspacket = decryptNp(newpasspacket.toString(), decryptedPayload.hckey, newPIV)
                                                            }

                                                        } catch (err) {
                                                            testsuccess = false;
                                                        }

                                                        if (testsuccess) {

                                                            //save to the server

                                                            statusUpdate('Saving...', '95%');

                                                            //TO DO:
                                                            //add in the re-encryption of the verification
                                                            //packet


                                                            //if reset password then provide signed message and call reset function


                                                            //need to add two factor here
                                                            //so 1. add two factor
                                                            //2. add way to save only the main packet

                                                            var postData = {
                                                                twoFactorCode: twoFactorCode,
                                                                guid: m_this.m_guid,
                                                                sharedid: m_this.m_sharedid,
                                                                accountPacket: newpayload.toString(),
                                                                userPacket: newusrpayload.toString(),
                                                                verifyPacket: newveripacket.toString(),
                                                                passPacket: newpasspacket.toString(),
                                                                IVA: newAIV,
                                                                IVU: newUIV,
                                                                IVR: newRIV,
                                                                PIV: newPIV
                                                            };
                                                            API.post("/api/1/u/updatepackets", postData, function (err, dataStr) {
                                                                if (err) {
                                                                    callback(true, "Error: Password not changed");
                                                                } else {

                                                                    if (dataStr == "ok") {



                                                                        m_this.Device.getStorageItem("tfso" + m_this.m_guid, function (tfso) {

                                                                            if (tfso != "") {
                                                                                var enc = JSON.parse(tfso);
                                                                                var token = decryptNp(enc.ct, m_this.m_password, enc.iv, true);
                                                                                tfso = encryptNp(token, newpassword);

                                                                                var ctok = {};
                                                                                ctok.ct = tfso.toString();
                                                                                ctok.iv = tfso.iv.toString();
                                                                                m_this.Device.setStorageItem("tfso" + m_this.m_guid, JSON.stringify(ctok));

                                                                            }

                                                                            m_this.m_password = newpassword;

                                                                            //if something goes wrong here
                                                                            //the worst case scenario is the
                                                                            //user has to reenter their hot key

                                                                            saveHotHash(m_this.m_onlineKey, function (err, result) {

                                                                                m_this.zeroOnlineKey();

                                                                                callback(false, '');

                                                                            });

                                                                        });


                                                                    } else {

                                                                        callback(true, "Error: Password not changed");
                                                                    }

                                                                }
                                                            });


                                                        } else {

                                                            callback(true, "Error: Password not changed");

                                                        }
                                                    } else {

                                                        callback(true, "Error: Password not changed");

                                                    }
                                                }, 500);

                                            } else {

                                                callback(true, "Error: Password not changed");
                                            }

                                        } else {

                                            callback(true, "Error: Password not changed");

                                        }


                                    });

                                }

                            });


                        } else {
                            callback(true, "Current password incorrect");
                        }


                    }, 500);

                });

            } else {

                callback(true, wallet);

            }
        });

    }


    ////////////////////////////////////////////////////////////////////////////////////////////


    this.ResetPassword = ResetPassword;
    function ResetPassword(guid, twofactor, resetKey, newpassword, progbar, progmess, hckey, message1, message2, callback) {

        var sharedid = '';
        var oguid = guid;
        //get secret and decrypt with resetKey
        //pass is message1 and message2
        //return secret and sharedid
        //continue as normal
        var bytes = [];
        for (var i = 0; i < guid.length; ++i) {
            bytes.push(guid.charCodeAt(i));
        }

        guid = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();


        API.post("/api/1/getrecoverypacket", {
            guid: guid
        }, function (err, response) {

            if (err) {

                callback(err, response);

            } else {

                //decrypt packet

                var jpacket = JSON.parse(response);

                if (!jpacket.Beta1) {

                    var secret = decryptNp(jpacket.packet, resetKey, jpacket.IV);

                    API.getWalletFromServer(guid, secret, twofactor, false, function (err, wallet) {

                        if (!err) {

                            try {
                                var walletInformation = decrypt(wallet.Payload, resetKey, wallet.IV);
                            } catch (err) {
                                return callback(true, "Incorrect password");
                            }

                            sharedid = walletInformation.userToken;


                            //check password strength

                            //stretch old password
                            //verify that it matches the current one

                            $(progbar).width('40%');
                            $(progmess).text('Securing password...');
                            setTimeout(function () {

                                //if password reset do not pbkdf the password


                                oldpassword = resetKey;

                                //if (oldpassword == m_this.m_password) {


                                //get the two packets
                                $(progbar).width('40%');
                                $(progmess).text('Getting packets...');


                                // $("#chngpwdprogbar").width('50%');
                                //$("#chngpwdprogmess").text('Decrypting account packet...');
                                //decrypt with the old password
                                var decryptedWithOld = true;
                                var decryptedPayload = '';
                                try {
                                    decryptedPayload = decrypt(wallet.Payload, resetKey, wallet.IV);
                                } catch (err) {
                                    decryptedWithOld = false;
                                }

                                if (decryptedWithOld) {

                                    $(progbar).width('80%');
                                    $(progmess).text('Securing new password...');
                                    API.getUserPacket(guid, sharedid, function (err, encpacket) {

                                        var decryptedUsrWithOld = true;
                                        var rsaKeyPair = '';
                                        try {
                                            rsaKeyPair = decrypt(encpacket.Payload, resetKey, encpacket.IV);
                                        } catch (err) {
                                            decryptedUsrWithOld = false;
                                        }


                                        if (decryptedUsrWithOld) {

                                            //get the verification packet


                                            API.post("/api/1/getrecoverypacket", {
                                                guid: guid
                                            }, function (err, response) {


                                                if (!err) {

                                                    //decrypt packet
                                                    var decryptedVerWithOld = true;
                                                    var jpacket = JSON.parse(response);
                                                    var veripacket = '';
                                                    try {
                                                        veripacket = decryptNp(jpacket.packet, resetKey, jpacket.IV);
                                                    }
                                                    catch (verror) {
                                                        decryptedVerWithOld = false;
                                                    }


                                                    if (decryptedVerWithOld) {

                                                        setTimeout(function () {


                                                            newpassword = pbkdf2(newpassword, oguid);


                                                            $(progbar).width('80%');
                                                            $(progmess).text('Encrypting account packet...');

                                                            var newpayloadsuccess = true;
                                                            var newpayload = '';
                                                            var newusrpayload = '';
                                                            var newveripacket = '';
                                                            var newpasspacket = '';
                                                            var newAIV = '';
                                                            var newUIV = '';
                                                            var newRIV = '';
                                                            var newPIV = '';
                                                            try {

                                                                newpayload = encrypt(decryptedPayload, newpassword);
                                                                newusrpayload = encrypt(rsaKeyPair, newpassword);
                                                                newveripacket = encryptNp(veripacket, newpassword);
                                                                newpasspacket = encryptNp(newpassword, decryptedPayload.hckey);

                                                                //and encrypt the new password with the hotkey seed

                                                                newAIV = newpayload.iv.toString();
                                                                newUIV = newusrpayload.iv.toString();
                                                                newRIV = newveripacket.iv.toString();
                                                                newPIV = newpasspacket.iv.toString();

                                                            } catch (err) {
                                                                newpayloadsuccess = false;
                                                            }

                                                            if (newpayloadsuccess) {

                                                                //$("#chngpwdprogbar").width('90%');
                                                                //$("#chngpwdprogmess").text('Encrypting user packet...');

                                                                //test decryption - then update
                                                                var testpayload = '';
                                                                var testnewusrpayload = '';
                                                                var testveripacket = '';
                                                                var testpasspacket = '';
                                                                var testsuccess = true;
                                                                try {
                                                                    testpayload = decrypt(newpayload.toString(), newpassword, newAIV);
                                                                    testnewusrpayload = decrypt(newusrpayload.toString(), newpassword, newUIV);
                                                                    testveripacket = decryptNp(newveripacket.toString(), newpassword, newRIV);
                                                                    testpasspacket = decryptNp(newpasspacket.toString(), decryptedPayload.hckey, newPIV);

                                                                } catch (err) {
                                                                    testsuccess = false;
                                                                }

                                                                if (testsuccess) {

                                                                    //save to the server
                                                                    $(progbar).width('95%');
                                                                    $(progmess).text('Saving...');


                                                                    //TO DO:
                                                                    //add in the re-encryption of the verification
                                                                    //packet


                                                                    //if reset password then provide signed message and call reset function

                                                                    var postData = {
                                                                        guid: guid,
                                                                        sharedid: sharedid,
                                                                        accountPacket: newpayload.toString(),
                                                                        userPacket: newusrpayload.toString(),
                                                                        verifyPacket: newveripacket.toString(),
                                                                        passPacket: newpasspacket.toString(),
                                                                        IVA: newAIV,
                                                                        IVU: newUIV,
                                                                        IVR: newRIV,
                                                                        PIV: newPIV
                                                                    };
                                                                    API.post("/api/1/u/updatepackets", postData, function (err, dataStr) {
                                                                        if (err) {
                                                                            callback(true, "Error: Password not changed");
                                                                        } else {

                                                                            if (dataStr == "ok") {


                                                                                callback(false, newpassword);


                                                                            } else {

                                                                                callback(true, "Error: Password not changed");
                                                                            }

                                                                        }
                                                                    });


                                                                } else {

                                                                    callback(true, "Error: Password not changed");

                                                                }
                                                            } else {

                                                                callback(true, "Error: Password not changed");

                                                            }
                                                        }, 500);

                                                    } else {

                                                        callback(true, "Error: Password not changed");
                                                    }

                                                } else {

                                                    callback(true, "Error: Password not changed");

                                                }


                                            });

                                        }

                                    });


                                } else {

                                }

                                //} else {
                                //    callback(true, "You entered your current password incorrectly");
                                //}

                            }, 500);

                        } else {
                            callback(true, wallet);
                        }
                    });

                }

            }

        });

    }


    ////////////////////////////////////////////////////////////////////////////////////////////

    this.EmailValidationForTwoFactor = EmailValidationForTwoFactor;
    function EmailValidationForTwoFactor(vtoken, status, callback) {

        API.post("/api/1/getemailvalidationtwofactor", {
            guid: m_this.m_guid,
            token: vtoken
        }, function (err, response) {

            if (!err) {
                m_this.m_twoFactorOnLogin = true;
            }

            callback(err, response);
        });

    }

    this.getAccountSettings = getAccountSettings;
    function getAccountSettings(callback) {
        API.post("/api/1/u/getaccountsettings", {
            guid: m_this.m_guid,
            sharedid: m_this.m_sharedid
        }, function (err, response) {
            callback(err, response);
        });
    }

    this.updateAccountSettings = updateAccountSettings;
    function updateAccountSettings(jsonPacket, twoFactorCode, twoFactorSend, callback) {



        //only request a new token


        var postdata = {
            guid: m_this.m_guid,
            sharedid: m_this.m_sharedid,
            jsonPacket: JSON.stringify(jsonPacket),
            twoFactorCode: twoFactorCode,
            twoFactorSend: twoFactorSend
        };

        API.post("/api/2/u/updateaccountsettings", postdata
            , function (err, response) {

                if (!err) {

                    if (response != "ok") {

                        var ret = JSON.parse(response);

                        if (ret.Token) {

                            var enc = encryptNp(Bitcoin.convert.hexToBytes(ret.Token), m_this.m_password);
                            var ctok = {};
                            ctok.ct = enc.toString();
                            ctok.iv = enc.iv.toString();
                            m_this.Device.setStorageItem("tfso" + m_this.m_guid, JSON.stringify(ctok));

                        }
                    }

                    getAccountSettings(function (err, res) {

                        if (!err) {

                            var settingsObject = JSON.parse(res);
                            m_this.m_settings = settingsObject;
                            callback(err, response);
                        } else {

                            callback(err, res);
                        }

                    });

                } else {
                    callback(err, response);
                }


            });

    }

    this.getTwoFactorImg = getTwoFactorImg;
    function getTwoFactorImg(callback) {

        var postData = {
            guid: m_this.m_guid,
            sharedid: m_this.m_sharedid
        };

        API.post("/api/1/gettwofactorimg", postData, function (err, twoFactorQrImgUrl) {

            if (!err) {
                callback(false, twoFactorQrImgUrl)
            }
        });

    }

    this.getNewTwoFactorImg = getNewTwoFactorImg;
    function getNewTwoFactorImg(twoFactorCode, callback) {

        var postData = {
            guid: m_this.m_guid,
            sharedid: m_this.m_sharedid,
            twoFactorCode: twoFactorCode
        };

        API.post("/api/1/getnewtwofactorimg", postData, function (err, twoFactorQrImgUrl) {

            callback(err, twoFactorQrImgUrl)

        });

    }


    this.getBackup = getBackup;
    function getBackup(twoFactorCode, callback) {

        API.getWalletFromServer(m_this.m_guid, m_this.m_secret, twoFactorCode, false, function (err, wallet) {

            if (err) {

                return callback(err, wallet);

            }

            var walletInformation = {};
            try {

                walletInformation = decrypt(wallet.Payload, m_this.m_password, wallet.IV);

                var result = {};
                result.ninkiPubKey = walletInformation.ninkiPubKey;

                getHotHash("", function (err, hotHash) {

                    //m_this.zeroOnlineKey();

                    if (!err) {

                        result.hotHash = hotHash;
                    }
                    else {

                        result.hotHash = "Unavailable";
                    }

                    walletInformation = {};

                    callback(false, result);

                });


            } catch (err) {
                return callback(true, "Incorrect password");
            }

        });

    }

    this.createS3Policy = createS3Policy;
    function createS3Policy(callback) {
        Ninki.API.post("/api/1/u/createS3Policy", { guid: m_this.m_guid }, function (err, result) {

            callback(err, result);

        });
    }

    this.emailGUID = emailGUID;
    function emailGUID(userName, callback) {
        API.emailGUID(userName, callback);
    }

    this.getGUIDByMPKH = getGUIDByMPKH;
    function getGUIDByMPKH(phrase, callback) {



        //get seed from mnemonic
        //derive master public key
        //hash master public key

        var bip39 = new BIP39();

        //convert to master key
        var mkey = bip39.mnemonicToHex(phrase);

        if (mkey) {

            var hd = Bitcoin.HDWallet.fromSeedHex(mkey, m_this.m_network);
            //get master public key
            var mpk = hd.toString();

            //hash the master public key
            var bytes = [];
            for (var i = 0; i < mpk.length; ++i) {
                bytes.push(mpk.charCodeAt(i));
            }

            var mpkh = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();

            //lookup account guid
            return API.getGUIDByMPKH(mpkh, callback);


        } else {

            return callback(true, "InvalidPhrase");

        }


    }


    this.setPasswordApp = setPasswordApp;
    function setPasswordApp(phrase, callback) {

        var bip39 = new BIP39();

        //convert to master key
        var mkey = bip39.mnemonicToHex(phrase);

        var bytes = Bitcoin.convert.hexToBytes(mkey);

        var mpkh = SHA256(bytes);

        m_this.m_password = mpkh;

    }

    this.getMasterPublicKeyFromUpstreamServer = getMasterPublicKeyFromUpstreamServer;
    function getMasterPublicKeyFromUpstreamServer(guid, callback) {
        API.getMasterPublicKeyFromUpstreamServer(guid, callback);
    }

    this.doesUsernameExist = doesUsernameExist;
    function doesUsernameExist(username, callback) {
        API.doesAccountExist(username, '', function (err, accExists) {

            if (err) {
                callback(err, accExists);
            } else {
                callback(err, accExists.UserExists);
            }

        });
    }

    this.doesEmailExist = doesEmailExist;
    function doesEmailExist(email, callback) {
        API.doesAccountExist('', email, function (err, accExists) {

            if (err) {
                callback(err, accExists);
            } else {
                callback(err, accExists.EmailExists);
            }

        });
    }

    this.sendWelcomeDetails = sendWelcomeDetails;
    function sendWelcomeDetails(callback) {
        API.sendWelcomeDetails(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getEmailValidation = getEmailValidation;
    function getEmailValidation(token, callback) {
        API.getEmailValidation(m_this.m_guid, m_this.m_sharedid, token, callback);
    }

    this.getWalletFromServer = getWalletFromServer;
    function getWalletFromServer(secret, twoFactorCode, rememberTwoFactor, callback) {
        API.getWalletFromServer(m_this.m_guid, secret, twoFactorCode, rememberTwoFactor, callback);
    }

    this.getRecoveryPacket = getRecoveryPacket;
    function getRecoveryPacket(callback) {
        API.getRecoveryPacket(m_this.m_guid, callback);
    }

    this.validateSecret = validateSecret;
    function validateSecret(secret, callback) {
        API.validateSecret(m_this.m_guid, secret, callback);
    }

    this.getBalance = getBalance;
    function getBalance(callback) {
        API.getBalance(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getusernetworkcategory = getusernetworkcategory;
    function getusernetworkcategory(callback) {
        API.getusernetworkcategory(callback);
    }

    this.updateusernetworkcategory = updateusernetworkcategory;
    function updateusernetworkcategory(username, category, callback) {
        API.updateusernetworkcategory(m_this.m_guid, m_this.m_sharedid, username, category, callback);
    }

    this.getUnconfirmedBalance = getUnconfirmedBalance;
    function getUnconfirmedBalance(callback) {
        API.getUnconfirmedBalance(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getCoinProfile = getCoinProfile;
    function getCoinProfile(callback) {
        API.getCoinProfile(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getAccountData = getAccountData;
    function getAccountData(callback) {
        API.getAccountData(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getUserData = getUserData;
    function getUserData(callback) {
        API.getUserData(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getNickname = getNickname;
    function getNickname(callback) {
        API.getNickname(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getUserProfile = getUserProfile;
    function getUserProfile(callback) {
        API.getUserProfile(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.updateUserProfile = updateUserProfile;
    function updateUserProfile(profileImage, status, tax, callback) {
        API.updateUserProfile(m_this.m_guid, m_this.m_sharedid, profileImage, status, tax, function (err, result) {

            if (!err) {
                m_this.m_statusText = status;
                m_this.m_profileImage = profileImage;
                m_this.m_invoiceTax = tax;
            }

            callback(err, result);

        });
    }

    this.getUnspentOutputs = getUnspentOutputs;
    function getUnspentOutputs(callback) {
        API.getUnspentOutputs(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getTransactionTemplate = getTransactionTemplate;
    function getTransactionTemplate(transactionid, callback) {
        API.getTransactionTemplate(m_this.m_guid, m_this.m_sharedid, transactionid, callback);
    }


    this.getPendingUserRequests = getPendingUserRequests;
    function getPendingUserRequests(callback) {
        API.getPendingUserRequests(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getFriendRequests = getFriendRequests;
    function getFriendRequests(callback) {
        API.getFriendRequests(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getUserPacket = getUserPacket;
    function getUserPacket(callback) {
        API.getUserPacket(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.isNetworkExist = isNetworkExist;
    function isNetworkExist(username, callback) {
        API.isNetworkExist(m_this.m_guid, m_this.m_sharedid, username, callback);
    }

    this.rejectFriendRequest = rejectFriendRequest;
    function rejectFriendRequest(username, callback) {
        API.rejectFriendRequest(m_this.m_guid, m_this.m_sharedid, username, callback);
    }

    this.getTransactionRecords = getTransactionRecords;
    function getTransactionRecords(callback) {
        API.getTransactionRecords(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getTransactionFeed = getTransactionFeed;
    function getTransactionFeed(timestamp, lkey, tranPageFrom, tranPageTo, callback) {
        API.getTransactionFeed(m_this.m_guid, m_this.m_sharedid, timestamp, lkey, tranPageFrom, tranPageTo, callback);
    }

    this.getTransactionsForNetwork = getTransactionsForNetwork;
    function getTransactionsForNetwork(username, timestamp, lkey, tranPageFrom, tranPageTo, callback) {
        API.getTransactionsForNetwork(m_this.m_guid, m_this.m_sharedid, username, timestamp, lkey, tranPageFrom, tranPageTo, callback);
    }

    this.getTimeline = getTimeline;
    function getTimeline(timestamp, lkey, tranPageFrom, tranPageTo, callback) {
        API.getTimeline(m_this.m_guid, m_this.m_sharedid, timestamp, lkey, tranPageFrom, tranPageTo, callback);
    }

    this.getInvoiceList = getInvoiceList;
    function getInvoiceList(timestamp, lkey, pageFrom, pageTo, callback) {
        API.getInvoiceList(m_this.m_guid, m_this.m_sharedid, timestamp, lkey, pageFrom, pageTo, callback);
    }

    this.getInvoiceByUserList = getInvoiceByUserList;
    function getInvoiceByUserList(timestamp, lkey, pageFrom, pageTo, callback) {
        API.getInvoiceByUserList(m_this.m_guid, m_this.m_sharedid, timestamp, lkey, pageFrom, pageTo, callback);
    }


    this.getInvoicesToPayNetwork = getInvoicesToPayNetwork;
    function getInvoicesToPayNetwork(username, timestamp, lkey, pageFrom, pageTo, callback) {
        API.getInvoicesToPayNetwork(m_this.m_guid, m_this.m_sharedid, username, timestamp, lkey, pageFrom, pageTo, callback);
    }

    this.getInvoicesByUserNetwork = getInvoicesByUserNetwork;
    function getInvoicesByUserNetwork(username, timestamp, lkey, pageFrom, pageTo, callback) {
        API.getInvoicesByUserNetwork(m_this.m_guid, m_this.m_sharedid, username, timestamp, lkey, pageFrom, pageTo, callback);
    }

    this.getMessagesByUserNetwork = getMessagesByUserNetwork;
    function getMessagesByUserNetwork(username, timestamp, lkey, pageFrom, pageTo, callback) {
        API.getMessagesByUserNetwork(m_this.m_guid, m_this.m_sharedid, username, timestamp, lkey, pageFrom, pageTo, callback);
    }


    this.updateInvoice = updateInvoice;
    function updateInvoice(username, invoiceId, transactionId, status, callback) {
        API.updateInvoice(m_this.m_guid, m_this.m_sharedid, username, invoiceId, transactionId, status, callback);
    }

    this.getVersion = getVersion;
    function getVersion(callback) {
        API.getVersion(callback);
    }

    this.registerDevice = registerDevice;
    function registerDevice(guid, deviceName, deviceId, deviceModel, devicePIN, regToken, secret, callback) {

        API.registerDevice(guid, deviceName, deviceId, deviceModel, devicePIN, regToken, secret, function (err, res) {

            var jekey = JSON.parse(res);

            m_this.m_deviceKey = Bitcoin.convert.hexToBytes(jekey.DeviceKey);

            if (jekey.DeviceKey.length > 0) {
                jekey.DeviceKey = 'valid';
            }

            callback(err, res);


        });
    }

    this.getDeviceKey = getDeviceKey;
    function getDeviceKey(devicePIN, callback) {

        m_this.Device.getDeviceId(function (res) {

            deviceid = res;

            //hash the pin and device id
            var pinhash = deviceid + devicePIN;
            var bytes = [];
            for (var i = 0; i < pinhash.length; ++i) {
                bytes.push(pinhash.charCodeAt(i));
            }

            pinhash = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();

            m_this.Device.getStorageItem("ninki_reg", function (regToken) {

                API.getDeviceKey(m_this.m_guid, pinhash, regToken, function (err, ekey) {

                    if (!err) {

                        var jekey = JSON.parse(ekey);

                        if (jekey.DeviceKey.length > 0) {

                            m_this.m_deviceKey = Bitcoin.convert.hexToBytes(jekey.DeviceKey);

                            if (jekey.SessionToken) {
                                API.registerToken(jekey.SessionToken);
                                m_this.m_APIToken = jekey.SessionToken;
                                callback(err, "");
                            }

                            jekey.DeviceKey = [];

                        } else {

                            callback(err, "");
                        }
                    } else {
                        callback(true, ekey);
                    }

                });

            });

        });

    }


    this.destroyDevice = destroyDevice;
    function destroyDevice(callback) {

        m_this.Device.getStorageItem("ninki_reg", function (regToken) {

            API.destroyDevice(m_this.m_guid, regToken, function (err, ekey) {

                callback(err, ekey);

            });

        });

    }


    this.destroyDevice2fa = destroyDevice2fa;
    function destroyDevice2fa(deviceName, twoFactor, callback) {

        API.destroyDevice2fa(m_this.m_guid, m_this.m_sharedid, deviceName, twoFactor, function (err, ekey) {

            callback(err, ekey);

        });

    }

    this.createDevice = createDevice;
    function createDevice(deviceName, callback) {
        API.createDevice(m_this.m_guid, m_this.m_sharedid, deviceName, callback);
    }

    this.getDevices = getDevices;
    function getDevices(callback) {
        API.getDevices(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getDeviceToken = getDeviceToken;
    function getDeviceToken(deviceName, twoFactorCode, callback) {
        API.getDeviceToken(m_this.m_guid, m_this.m_sharedid, deviceName, twoFactorCode, callback);
    }

    this.getDeviceTokenRestore = getDeviceTokenRestore;
    function getDeviceTokenRestore(deviceName, secret, signaturecold, callback) {
        API.getDeviceTokenRestore(m_this.m_guid, deviceName, secret, signaturecold, callback);
    }

    this.getDeviceTokenForApp = getDeviceTokenForApp;
    function getDeviceTokenForApp(deviceName, callback) {
        API.getDeviceTokenForApp(m_this.m_guid, m_this.m_sharedid, deviceName, callback);
    }

    this.getLimitStatus = getLimitStatus;
    function getLimitStatus(callback) {
        API.getLimitStatus(m_this.m_guid, m_this.m_sharedid, function (err, res) {

            if (!err) {
                var jlimits = JSON.parse(res);
                return callback(err, jlimits);

            } else {
                return callback(err, res);
            }

        });
    }

    this.prepareTransaction = prepareTransaction;
    function prepareTransaction(amount, callback) {
        API.prepareTransaction(m_this.m_guid, m_this.m_sharedid, amount, function (err, res) {

            if (!err) {
                var jlimits = JSON.parse(res);
                return callback(err, jlimits);

            } else {
                return callback(err, res);
            }

        });
    }



    this.createBackupCodes = createBackupCodes;
    function createBackupCodes(twoFactorCode, callback) {
        API.createBackupCodes(m_this.m_guid, m_this.m_sharedid, twoFactorCode, function (err, res) {

            if (!err) {
                var jcodes = JSON.parse(res);
                return callback(err, jcodes);

            } else {
                return callback(err, res);
            }

        });
    }

    this.updateEmailAddress = updateEmailAddress;
    function updateEmailAddress(emailAddress, callback) {
        API.updateEmailAddress(m_this.m_oguid, m_this.m_sharedid, emailAddress, function (err, res) {

            return callback(err, res);


        });
    }

    this.resetTwoFactorAccount = resetTwoFactorAccount;
    function resetTwoFactorAccount(signaturecold, callback) {
        API.resetTwoFactorAccount(m_this.m_guid, signaturecold, m_this.m_secret, function (err, res) {
            return callback(err, res);
        });
    }

    this.getSigChallenge = getSigChallenge;
    function getSigChallenge(callback) {
        API.getSigChallenge(m_this.m_guid, m_this.m_secret, function (err, res) {
            return callback(err, res);
        });
    }




    this.get2faOverride = get2faOverride;
    function get2faOverride(amount, callback) {

        m_this.Device.getStorageItem("tfso" + m_this.m_guid, function (res) {

            if (res == "") {

                return callback(false, "");

            }

            getLimitStatus(function (err, limits) {

                if (!err) {

                    var twofareq = false;
                    if ((limits.No24hr + 1) > limits.NoOfTransactionsPerDay) {
                        twofareq = true;
                    }
                    if ((limits.No1hr + 1) > limits.NoOfTransactionsPerHour) {
                        twofareq = true;
                    }

                    if ((amount) > limits.SingleTransactionLimit) {
                        twofareq = true;
                    }
                    if ((limits.TotalAmount24hr + amount) > limits.DailyTransactionLimit) {
                        twofareq = true;
                    }

                    if (twofareq) {

                        callback(err, "");

                    } else {

                        if (res.length > 0) {
                            var enc = JSON.parse(res);
                            twoFactorCode = decryptNp(enc.ct, m_this.m_password, enc.iv);
                            callback(err, twoFactorCode);

                        } else {

                            callback(err, "");
                        }

                    }
                } else {

                    callback(err, limits);

                }


            });

        });


    }


    //
    this.requestAuthMigration = requestAuthMigration;
    function requestAuthMigration(token, callback) {

        API.requestAuthMigration(m_this.m_guid, m_this.m_secret, token, function (err, res) {

            return callback(err, res);

        });

    }

    this.getAuthMigrationRequest = getAuthMigrationRequest;
    function getAuthMigrationRequest(callback) {

        API.getAuthMigrationRequest(m_this.m_guid, m_this.m_sharedid, function (err, res) {

            return callback(err, res);

        });
    }


    this.authMigration = authMigration;
    function authMigration(enckey, token, callback) {

        getTwoFactorToken(enckey, function (err, twoFactorToken) {

            API.authMigration(m_this.m_guid, m_this.m_sharedid, twoFactorToken, token, function (err, res) {

                return callback(err, res);

            });

        });
    }


    this.getAuthMigrationToken = getAuthMigrationToken;
    function getAuthMigrationToken(token, callback) {

        API.getAuthMigrationToken(m_this.m_guid, m_this.m_secret, token, function (err, res) {

            return callback(err, res);

        });
    }

    this.estimateTranBytes = estimateTranBytes;
    function estimateTranBytes(noOfIns, noOfOuts, amount) {

        var estInpSize = 300;
        var estOutSize = 34;
        var estGenSize = 30;

        return ((estInpSize * noOfIns) + (estOutSize * noOfOuts) + estGenSize);

    }

    this.calcMinerFee = calcMinerFee;
    function calcMinerFee(noOfBytes,satsperbyte) {

        var f = satsperbyte * noOfBytes;

        f = Math.round(f / 10000) * 10000;

        if (f < 10000) {
            return 10000;
        } else {
            return f;

        }

    }



}

module.exports = Engine;
