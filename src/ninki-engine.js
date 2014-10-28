//ninki-engine

var Bitcoin = require('bitcoinjs-lib');
var openpgp = require('openpgp');
var CryptoJS = require('crypto-js');
var API = require('./ninki-api');
var BIP39 = require('./bip39');
var uuid = require('node-uuid');
var sjcl = require('sjcl');
var sanitizer = require('sanitizer');


function Engine() {

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
    this.m_privKey = '';
    this.m_pubKey = '';
    this.m_APIToken = '';
    this.m_appInitialised = false;

    m_this = this;


    this.appHasLoaded = appHasLoaded;
    function appHasLoaded() {

        // m_this.m_password = '';

    }


    function isChromeApp() {

        if (window.cordova) {
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


    function isBrowser() {

        if (window.cordova) {
            return false;
        }

        return !isChromeApp();
    }

    function getCookie(cname, callback) {


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

            if (localStorage[cname]) {
                return callback(localStorage[cname]);
            } else {
                return callback('');
            }

        }

    }

    this.isRealGuid = isRealGuid;
    //Checks if GUID is valid. Only takes lowercase, non-bracketed GUIDs.
    function isRealGuid(potentialGuidAsString) {

        if (!potentialGuidAsString) return false;
        if (typeof potentialGuidAsString != 'string') return false;
        if (potentialGuidAsString.length == 0) return false;

        var guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
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


    this.encrypt = encrypt;
    function encrypt(valueToEncrypt, passphrase) {

        valueToEncrypt = JSON.stringify(valueToEncrypt);

        var key = CryptoJS.enc.Hex.parse(passphrase);

        var iv = new Uint8Array(32);
        var ivbytes = [];
        window.crypto.getRandomValues(iv);
        for (var i = 0; i < iv.length; ++i) {
            ivbytes[i] = iv[i];
        }

        var ivwords = Bitcoin.convert.bytesToWordArray(ivbytes);

        var encrypted = CryptoJS.AES.encrypt(valueToEncrypt, key, { iv: ivwords });

        return encrypted;
    };


    this.encryptNp = encryptNp;
    function encryptNp(valueToEncrypt, passphrase) {

        valueToEncrypt = CryptoJS.enc.Hex.parse(valueToEncrypt);

        var key = CryptoJS.enc.Hex.parse(passphrase);

        var iv = new Uint8Array(32);
        var ivbytes = [];
        window.crypto.getRandomValues(iv);
        for (var i = 0; i < iv.length; ++i) {
            ivbytes[i] = iv[i];
        }

        var ivwords = Bitcoin.convert.bytesToWordArray(ivbytes);

        var encrypted = CryptoJS.AES.encrypt(valueToEncrypt, key, { iv: ivwords, padding: CryptoJS.pad.NoPadding });

        return encrypted;
    };

    this.decrypt = decrypt;
    function decrypt(encryptedObj, passphrase, iv) {

        var key = CryptoJS.enc.Hex.parse(passphrase);
        var iv = CryptoJS.enc.Hex.parse(iv);

        var decryptedObject = CryptoJS.AES.decrypt(encryptedObj, key, { iv: iv });

        var decryptutf = decryptedObject.toString(CryptoJS.enc.Utf8);
        var decryptjson = JSON.parse(decryptutf);
        return decryptjson;
    };

    this.decryptNp = decryptNp;
    function decryptNp(encryptedObj, passphrase, iv) {

        var key = CryptoJS.enc.Hex.parse(passphrase);
        var iv = CryptoJS.enc.Hex.parse(iv);

        var decryptedObject = CryptoJS.AES.decrypt(encryptedObj, key, { iv: iv, padding: CryptoJS.pad.NoPadding });

        var decrypthex = decryptedObject.toString(CryptoJS.enc.Hex);
        return decrypthex;
    };


    var hmac = function (key) {
        var hasher = new sjcl.misc.hmac(key, sjcl.hash.sha1);
        this.encrypt = function () {
            return hasher.encrypt.apply(hasher, arguments);
        };
    };


    function pbkdf2(password, salt) {
        var passwordSalt = sjcl.codec.utf8String.toBits(salt);
        var derivedKey = sjcl.misc.pbkdf2(password, passwordSalt, 1000, 256, hmac);
        var hexKey = sjcl.codec.hex.fromBits(derivedKey);
        return hexKey;
    }

    this.setPass = setPass;
    function setPass(pass, salt) {
        m_this.m_password = pbkdf2(pass, salt);
    }

    this.setStretchPass = setStretchPass;
    function setStretchPass(pass) {
        m_this.m_password = pass;
    }





    this.getHotHash = getHotHash;
    function getHotHash(key, callback) {

        var isWeb = isBrowser();
        //to do: validate key against stored public key
        //needs to be done incase user changed their password on a different machine
        if (isChromeApp()) {

            chrome.storage.local.get("hk" + m_this.m_guid, function (result) {

                if (result["hk" + m_this.m_guid]) {
                    var hk = result["hk" + m_this.m_guid];

                    chrome.storage.local.get("hkiv" + m_this.m_guid, function (resultiv) {

                        if (resultiv["hkiv" + m_this.m_guid]) {
                            var hkiv = resultiv["hkiv" + m_this.m_guid];

                            var hothash = '';
                            var iserror = false;
                            try {
                                hothash = decryptNp(hk, m_this.m_password, hkiv);
                            } catch (error) {
                                iserror = true;
                            }
                            if (!iserror) {

                                //validate against loaded hot public key
                                var validseed = true;
                                try {
                                    var bipHot = Bitcoin.HDWallet.fromSeedHex(hothash);
                                    if (m_this.m_walletinfo.hotPub != bipHot.toString()) {
                                        validseed = false;
                                    }
                                } catch (error) {

                                    validseed = false;
                                }

                                if (validseed) {

                                    return callback(false, hothash);

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

                } else {
                    return callback(true, "missing");
                }

            });

        } else if (isWeb) {

            var hk = localStorage["hk" + m_this.m_guid];
            var hkiv = localStorage["hkiv" + m_this.m_guid];

            var hothash = '';
            var iserror = false;
            try {
                hothash = decryptNp(hk, m_this.m_password, hkiv);
            } catch (error) {
                iserror = true;
            }
            if (!iserror) {

                //validate against loaded hot public key
                var validseed = true;
                try {
                    var bipHot = Bitcoin.HDWallet.fromSeedHex(hothash);
                    if (m_this.m_walletinfo.hotPub != bipHot.toString()) {
                        validseed = false;
                    }
                } catch (error) {

                    validseed = false;
                }

                if (validseed) {

                    return callback(false, hothash);

                } else {

                    return callback(true, "invalid");

                }

            } else {

                return callback(true, "missing");
            }

        } else {


            //not using the chrome app so must be mobile

            //use html5 localstorage

            // localStorage

            var hk = localStorage["ninki_h"];


            if (hk) {

                var hothash = '';
                var iserror = false;
                try {

                    var enc = JSON.parse(hk);
                    hothash = decryptNp(enc.ct, key, enc.iv);

                } catch (error) {
                    iserror = true;
                }
                if (!iserror) {

                    //validate against loaded hot public key
                    var validseed = true;
                    try {
                        var bipHot = Bitcoin.HDWallet.fromSeedHex(hothash);
                        if (m_this.m_walletinfo.hotPub != bipHot.toString()) {
                            validseed = false;
                        }
                    } catch (error) {

                        validseed = false;
                    }

                    if (validseed) {


                        //get the two factor code also

                        var tft = localStorage["ninki_rem"];
                        var jtft = JSON.parse(tft);

                        var fatoken = decryptNp(jtft.ct, key, jtft.iv);

                        return callback(false, hothash, fatoken);

                    } else {

                        return callback(true, "invalid");

                    }

                } else {

                    return callback(true, "missing");
                }

            } else {

                return callback(true, "missing");

            }


        }

    }

    this.saveHotHash = saveHotHash;
    function saveHotHash(hotHash, callback) {


        //before we encrypt validate the hash matches the logged in public key
        var validseed = true;
        try {
            var bipHot = Bitcoin.HDWallet.fromSeedHex(hotHash);
            if (m_this.m_walletinfo.hotPub != bipHot.toString()) {
                validseed = false;
            }
        } catch (error) {

            validseed = false;
        }

        if (validseed) {

            var encHotHash = encryptNp(hotHash, m_this.m_password);
            var objhk = {};

            if (isChromeApp()) {
                objhk['hk' + m_this.m_guid] = encHotHash.toString();
                chrome.storage.local.set(objhk, function () {
                    //console.log("saved");
                    var objhkiv = {};
                    objhkiv['hkiv' + m_this.m_guid] = encHotHash.iv.toString();
                    chrome.storage.local.set(objhkiv, function () {
                        //console.log("saved");
                        callback(false, "ok");
                    });
                });
            } else {


                localStorage.setItem('hk' + m_this.m_guid, encHotHash.toString());
                localStorage.setItem('hkiv' + m_this.m_guid, encHotHash.iv.toString());

                callback(false, "ok");

            }


        } else {

            callback(true, "invalid");

        }


    }


    function validateHotKey(callback) {

        //load the hotkey
        //if not there return error

        //validate the hotkey
        //if not there return error


    }


    //    createprog
    //    textMessageCreate
    //    createprogstatus


    //create wallet
    //create a new wallet and save to the server
    this.createWallet = createWallet;
    function createWallet(guid, password, username, emailAddress, callback) {

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

                $('#textMessageCreate').html('stretching password...');

                setTimeout(function () {


                    //stretch the password with the local guid as a salt
                    m_this.m_password = pbkdf2(password, m_this.m_oguid);

                    password = '';

                    //create a new wallet
                    makeNewWallet(username, emailAddress, function (err, walletInformation, userToken) {

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
                            $('#textMessageCreate').html('saving data...');

                            setTimeout(function () {


                                API.post("/api/1/u/createaccount2", walletInformation.wallet, function (err, response) {

                                    if (err) {

                                        return callback(err, "ErrSavePacket");

                                    } else {
                                        //pass back the wallet and info to the calling function
                                        return callback(false, walletInformation);
                                    }
                                });
                            }, 50);

                        }

                    });

                }, 50);
            }

        });
    }


    //function makeNewWallet
    //this function calls the server which generates the Ninki key pair to be used for the wallet
    //the server returns the public key to the client so that it can be saved in the user's encrypted packet
    function makeNewWallet(nickname, email, callback) {


        //TODO add some more param checking
        //rename this function
        setTimeout(function () {
            $('#textMessageCreate').html('creating account...');

            API.getMasterPublicKeyFromUpstreamServer(m_this.m_oguid, function (err, ninkiPubKey, userToken, secret) {
                if (err) {
                    return callback(err, "ErrCreateAccount");
                } else {
                    makeNewWalletPacket(nickname, email, ninkiPubKey, userToken, secret, function (err, walletInformation) {
                        if (err) {
                            return callback(err, response);
                        } else {
                            return callback(err, walletInformation, userToken);
                        }
                    });
                }
            });
        }, 50);
    }


    function makeNewWalletPacket(nickname, emailAddress, ninkiPubKey, userToken, secret, callback) {


        var network = "mainnet";


        $('#textMessageCreate').html('getting entropy...');

        setTimeout(function () {
            //get some random data for the cold key
            var rngcold = new Uint8Array(32);
            window.crypto.getRandomValues(rngcold);

            var coldKeyBytes = [];
            for (var i = 0; i < rngcold.length; ++i) {
                coldKeyBytes[i] = rngcold[i];
            }

            //get some random data for the hot key
            var rnghot = new Uint8Array(32);
            window.crypto.getRandomValues(rnghot);

            var hotKeyBytes = [];
            for (var i = 0; i < rnghot.length; ++i) {
                hotKeyBytes[i] = rnghot[i];
            }

            var bip39 = new BIP39();  // 'en' is the default language
            var hotmnem = bip39.entropyToMnemonic(rnghot);
            var coldmnem = bip39.entropyToMnemonic(rngcold);

            //var seedtest = bip39.mnemonicToSeed(hotmnem, '');

            $('#textMessageCreate').html('creating cold keys...');

            setTimeout(function () {

                //hash the random data to generate the seed for the cold key space
                //Cold key space
                var coldHash = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(coldKeyBytes)).toString();

                var coldWallet = Bitcoin.HDWallet.fromSeedHex(coldHash);
                //get the keys as strings
                var coldPriv = coldWallet.toString(" ");
                var coldPub = coldWallet.toString();

                $('#textMessageCreate').html('creating hot keys...');


                setTimeout(function () {

                    //hash the random data to generate the seed for the hot key space
                    //Hot key space
                    var hotHash = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(hotKeyBytes)).toString();

                    var hotWallet = Bitcoin.HDWallet.fromSeedHex(hotHash);
                    //get the keys as strings
                    var hotPriv = hotWallet.toString(" ");
                    var hotPub = hotWallet.toString();


                    //create a key based on a hash of the hot + cold key
                    //this is used to encrypt the pbkdf password and so enables
                    //password reset if the user has access to the hot and cold key phrases

                    var hckey = hotHash + coldHash;
                    var hcbkey = Bitcoin.convert.hexToBytes(hckey);
                    var hchkey = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(hcbkey)).toString();

                    $('#textMessageCreate').html('creating pgp keys...');


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

                            $('#textMessageCreate').html('encrypting data...');
                            //save the wallet keys and user token in an encrypted packet
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

                            var encryptedSecret = encryptNp(secret, m_this.m_password);

                            m_this.m_secret = secret;

                            //create a packet to post to the server
                            //note:
                            //  hot private key is encrypted in the payload
                            //  PGP private key is encrypted in the payload
                            //  all 3 wallet public keys are encrypted in the payload
                            //  hot and cold wallet public keys are passed to the server
                            //  public PGP key is passed to the server

                            //TODO: move ninkiPhrase to server side

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

                            saveHotHash(hotHash, function (err, res) {

                                var walletInformation = {
                                    wallet: wallet,
                                    coldWalletPhrase: bip39.entropyToMnemonic(coldHash),
                                    hotWalletPhrase: bip39.entropyToMnemonic(hotHash),
                                    sharedid: userToken,
                                    hckey: hchkey
                                }

                                //console.log(coldHash, hotHash);

                                return callback(err, walletInformation);

                            });

                        }, 50);

                    }, 50);

                }, 50);

            }, 50);

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

                    getPGPKeys(function (err, result) {

                        if (!err) {
                            getSettings(function (err, result) {

                                callback(err, result);

                            });
                        } else {
                            callback(err, result);
                        }
                    });
                }

            });

        } else {

            getPGPKeys(function (err, result) {

                if (!err) {
                    getSettings(function (err, result) {

                        callback(err, result);

                    });
                } else {
                    callback(err, result);
                }
            });

        }

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


            //if any account still has a hotkey stored in their encrypted packet
            //then remove it and resave the packet

            if (walletInformation.hotHash != '') {

                var hotHash = walletInformation.hotHash;

                walletInformation.hotPriv = '';
                walletInformation.hotHash = '';
                m_this.m_walletinfo = walletInformation;
                saveHotHash(hotHash, function (err, result) {

                    if (!err) {

                        //double check it has been saved correctly
                        getHotHash("", function (err, result) {

                            if (!err) {

                                var packet = encrypt(walletInformation, m_this.m_password);
                                //now save the packet back to the server

                                var postData = { twoFactorCode: twoFactCode, guid: m_this.m_guid, sharedid: walletInformation.userToken, accountPacket: packet.toString(), IVA: packet.iv.toString() };
                                API.post("/api/1/u/migratepacket", postData, function (err, dataStr) {


                                });

                            }

                        });

                    }


                });

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
                            var enc = encryptNp(wallet.CookieToken, m_this.m_password);
                            var ctok = {};
                            ctok.ct = enc.toString();
                            ctok.iv = enc.iv.toString();
                            wallet.CookieToken = JSON.stringify(ctok);
                        }

                        //save secret

                        getPGPKeys(function (err, result) {

                            if (!err) {
                                getSettings(function (err, result) {
                                    if (!err) {
                                        callback(err, wallet);
                                    } else {
                                        callback(err, result);
                                    }

                                });
                            } else {
                                callback(err, result);
                            }
                        });

                    }

                });

            } else {


                //2. this is the standard login code execution
                //eventually only this block will be required

                walletInformation.hotPriv = '';
                walletInformation.hotHash = '';
                walletInformation.hchkey = '';

                m_this.m_twoFactorOnLogin = wallet.TwoFactorOnLogin;
                m_this.m_walletinfo = walletInformation;
                m_this.m_sharedid = walletInformation.userToken;

                //if there is a cookie token then encrypt it

                if (wallet.CookieToken) {
                    var enc = encryptNp(wallet.CookieToken, m_this.m_password);
                    var ctok = {};
                    ctok.ct = enc.toString();
                    ctok.iv = enc.iv.toString();
                    wallet.CookieToken = JSON.stringify(ctok);
                }

                //save secret

                getPGPKeys(function (err, result) {

                    if (!err) {
                        getSettings(function (err, result) {
                            if (!err) {
                                callback(err, wallet);
                            } else {
                                callback(err, result);
                            }

                        });
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

                                    walletInformation.hotPriv = '';
                                    walletInformation.hotHash = '';
                                    walletInformation.hchkey = '';


                                    m_this.m_twoFactorOnLogin = wallet.TwoFactorOnLogin;
                                    m_this.m_walletinfo = walletInformation;
                                    m_this.m_sharedid = walletInformation.userToken;

                                    getPGPKeys(function (err, result) {

                                        if (!err) {
                                            getSettings(function (err, result) {

                                                callback(err, result);

                                            });
                                        } else {
                                            callback(err, result);
                                        }
                                    });


                                });

                            } else {

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

                                getPGPKeys(function (err, result) {

                                    if (!err) {
                                        getSettings(function (err, result) {

                                            callback(err, result);

                                        });
                                    } else {
                                        callback(err, result);
                                    }
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
        getNickname(function (err, nickname) {

            m_this.m_nickname = nickname;


            getUserProfile(function (err, result) {

                var userProfile = JSON.parse(result);

                m_this.m_profileImage = userProfile.ProfileImage;
                m_this.m_statusText = userProfile.Status;
                m_this.m_invoiceTax = userProfile.Tax;

                getFingerPrint(function (err, fingerprint) {
                    //display the secret on a div

                    var bip39 = new BIP39();  // 'en' is the default language
                    var fingermnem = bip39.entropyToMnemonic(fingerprint);
                    m_this.m_fingerprint = fingermnem;

                    getAccountSettings(function (err, response) {
                        if (err) {


                        } else {

                            var settingsObject = JSON.parse(response);
                            m_this.m_settings = settingsObject;
                            m_this.m_validate = !settingsObject.EmailVerified;
                        }

                        return callback(err, "ok");

                    });

                });

            });

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
        try {
            var addressCheck = new Bitcoin.Address(address);
            addressCheck.toString();
        } catch (err) {
            addrValid = false;
        }
        return addrValid;
    }

    this.sendTransaction = sendTransaction;
    function sendTransaction(sendType, friendUserName, addressTo, amount, twoFactorCode, callback) {


        //setup handles to report back progress
        var progressel = '';
        var messel = '';

        if (sendType == 'friend') {
            messel = '#textMessageSend';
            progressel = '#sendfriendprogstatus';
        }

        if (sendType == 'standard') {
            messel = '#textMessageSendStd';
            progressel = '#sendstdprogstatus';
        }

        if (sendType == 'invoice') {
            messel = '#textMessageSendInv';
            progressel = '#sendinvprogstatus';
        }


        var minersFee = 10000;
        //??
        amount = Math.round(amount);

        if (m_this.m_settings.MinersFee) {
            minersFee = m_this.m_settings.MinersFee;
        }


        //in the case of mobile the twoFactorCode is actually the device key
        //and will return a twofactor override code

        getHotHash(twoFactorCode, function (err, hothash, twoFactorOverride) {

            if (twoFactorOverride) {
                twoFactorCode = twoFactorOverride;
            }

            //initialise the hot private key space
            var bipHot = Bitcoin.HDWallet.fromSeedHex(hothash);

            //initialise the 3 public keys
            var bipHotPub = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.hotPub);
            var bipCold = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.coldPub);
            var bipNinki = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.ninkiPubKey);


            var pdata = { guid: m_this.m_guid, sharedid: m_this.m_sharedid };


            $(messel).html('Getting unspent outputs...');


            API.post("/api/1/u/getunspentoutputs", pdata, function (err, outputs) {

                var outputs = JSON.parse(outputs);
                var outputsToSpend = [];
                var amountsToSend = [];
                var addressToSend = [];
                var userHotPrivKeys = [];

                var nodeLevels = [];
                var publicKeys = [];
                var packet = { addressToSend: addressToSend, amountsToSend: amountsToSend, outputsToSpend: outputsToSpend, userHotPrivKeys: userHotPrivKeys, guid: m_this.m_guid, paths: nodeLevels, publicKeys: publicKeys };

                //get outputs to spend, calculate change amount minus miners fee

                $(progressel).width('20%');

                //iterate the unspent outputs and select the first n that equal the amount to spend
                //TO DO: do this before doing any key derivation
                var amountSoFar = 0;
                for (var i = 0; i < outputs.length; i++) {

                    var pitem = outputs[i];
                    var pout = { transactionId: pitem.TransactionId, outputIndex: pitem.OutputIndex, amount: pitem.Amount, address: pitem.Address }

                    nodeLevels.push(pitem.NodeLevel);

                    outputsToSpend.push(pout);

                    //derive the private key to use for signing
                    userHotPrivKeys.push(deriveChild(pitem.NodeLevel, bipHot).priv);

                    //derive the public keys to use for script generation
                    //this could be cached on the server as no privacy or hand-off issue that I can see

                    var dbipHotPub = "";
                    var dbipColdPub = "";
                    var dbipNinkiPub = "";

                    if (pitem.PK1.length > 0) {

                        dbipHotPub = Bitcoin.convert.hexToBytes(pitem.PK1);
                        dbipColdPub = Bitcoin.convert.hexToBytes(pitem.PK2);
                        dbipNinkiPub = Bitcoin.convert.hexToBytes(pitem.PK3);

                    } else {

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

                //create a new address for my change to be sent back to me

                //if we are sending money to a contact or paying an invoice
                //we need to derive addresses on their behalf

                if (sendType == 'friend' || sendType == 'invoice') {
                    var params = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: friendUserName, amount: amount };

                    //generate the address for the contact
                    //this must be done on the client
                    $(messel).html('Creating address...');
                    createAddressForFriend(friendUserName, function (err, address) {

                        if (!err) {

                            $(progressel).width('40%');
                            addressToSend.push(address);

                            //create the change address, this must be done on the client
                            $(messel).html('Creating change address...');

                            createAddress('m/0/1', changeAmount, function (err, changeaddress) {

                                if (!err) {
                                    $(progressel).width('60%');
                                    if (changeAmount > 0) {
                                        addressToSend.push(changeaddress);
                                    }
                                    //now get the  transaction data
                                    $(messel).html('Creating transaction...');
                                    aGetTransactionData(packet, function (err, hashesForSigning, rawTransaction) {

                                        $(progressel).width('80%');
                                        var jsonSend = { guid: m_this.m_guid, hashesForSigning: hashesForSigning, rawTransaction: rawTransaction, pathsToSignWith: nodeLevels }
                                        var jsonp1 = { guid: m_this.m_guid, jsonPacket: JSON.stringify(jsonSend), sharedid: m_this.m_sharedid, twoFactorCode: twoFactorCode, userName: friendUserName };
                                        $(messel).html('Counter-signing transaction...');

                                        //send the transaction to the service for countersigning and broadcast to the network


                                        //requires 2 factor authentication

                                        API.post("/api/1/u/sendtransaction", jsonp1, function (err, result) {

                                            if (!err) {
                                                $(progressel).width('100%');
                                                $(messel).html('Transaction broadcast...');
                                                //error handling?

                                                //we have a transaction id so lets make a note of the transaction in the database
                                                var params = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: friendUserName, transactionid: result, address: address, amount: amount };
                                                API.post("/api/1/u/createtransactionrecord", params, function (err, result) {
                                                    return callback(err, params.transactionid);
                                                });
                                            } else {

                                                //handle error messages returned from the server
                                                if (result == 'ErrSingleTransactionLimit') {
                                                    $(progressel).width('100%');
                                                    $(messel).html('Transaction Failed: Single limit exceeded');
                                                    return callback(err, result);
                                                }

                                                if (result == 'ErrDailyTransactionLimit') {
                                                    $(progressel).width('100%');
                                                    $(messel).html('Transaction Failed: Daily limit exceeded');
                                                    return callback(err, result);
                                                }

                                                if (result == 'ErrTransactionsPerDayLimit') {
                                                    $(progressel).width('100%');
                                                    $(messel).html('Transaction Failed: Daily number limit exceeded');
                                                    return callback(err, result);
                                                }

                                                if (result == 'ErrTransactionsPerHourLimit') {
                                                    $(progressel).width('100%');
                                                    $(messel).html('Transaction Failed: Hourly number limit exceeded');
                                                    return callback(err, result);
                                                }

                                                if (result == 'ErrInvalidRequest') {
                                                    $(progressel).width('100%');
                                                    $(messel).html('Transaction Failed: Invalid request');
                                                    return callback(err, result);
                                                }

                                                if (result == 'ErrLocked') {
                                                    $(progressel).width('100%');
                                                    $(messel).html('Transaction Failed: Account is unavailable');
                                                    return callback(err, result);
                                                }


                                                if (result == 'ErrBroadcastFailed') {
                                                    $(progressel).width('100%');
                                                    $(messel).html('Transaction Failed: Not accepted');
                                                    return callback(err, result);
                                                }

                                                if (result == "Invalid two factor code") {
                                                    $(progressel).width('100%');
                                                    $(messel).html("Invalid two factor code");
                                                    return callback(err, result);
                                                }

                                            }
                                        });
                                    });
                                } else {
                                    //create address error
                                    if (changeaddress == 'ErrInvalidRequest') {
                                        $(progressel).width('100%');
                                        $(messel).html('Transaction Failed: Invalid request');
                                        return callback(err, changeaddress);
                                    }
                                }
                            });
                        } else {

                            if (address == 'ErrInvalidRequest') {
                                $(progressel).width('100%');
                                $(messel).html('Transaction Failed: Invalid request');
                                return callback(err, address);
                            }

                        }
                    });
                } else {


                    $(messel).html('Creating address...');

                    addressToSend.push(addressTo);

                    //create the change address, this must be done on the client
                    createAddress('m/0/1', changeAmount, function (err, changeaddress) {

                        if (!err) {

                            $(progressel).width('40%');
                            if (changeAmount > 0) {
                                addressToSend.push(changeaddress);
                            }

                            //now get the  transaction
                            $(messel).html('Creating transaction...');
                            aGetTransactionData(packet, function (err, hashesForSigning, rawTransaction) {
                                $(progressel).width('60%');
                                var jsonSend = { guid: m_this.m_guid, hashesForSigning: hashesForSigning, rawTransaction: rawTransaction, pathsToSignWith: nodeLevels }
                                var jsonp1 = { guid: m_this.m_guid, jsonPacket: JSON.stringify(jsonSend), sharedid: m_this.m_sharedid, twoFactorCode: twoFactorCode, userName: '' };
                                $(messel).html('Counter-signing transaction...');
                                API.post("/api/1/u/sendtransaction", jsonp1, function (err, result) {

                                    $(progressel).width('80%');
                                    if (!err) {
                                        $(progressel).width('100%');
                                        $(messel).html('Transaction broadcast...');


                                        //we have a transaction id so lets make a note of the transaction in the database
                                        var params = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: 'External', transactionid: result, address: addressTo, amount: amount };
                                        API.post("/api/1/u/createtransactionrecord", params, function (err, result) {
                                            return callback(err, result);
                                        });
                                    } else {
                                        if (result == 'ErrSingleTransactionLimit') {
                                            $(progressel).width('100%');
                                            $(messel).html('Transaction Failed: Single limit exceeded');
                                            return callback(err, result);
                                        }

                                        if (result == 'ErrDailyTransactionLimit') {
                                            $(progressel).width('100%');
                                            $(messel).html('Transaction Failed: Daily limit exceeded');
                                            return callback(err, result);
                                        }

                                        if (result == 'ErrTransactionsPerDayLimit') {
                                            $(progressel).width('100%');
                                            $(messel).html('Transaction Failed: Daily number limit exceeded');
                                            return callback(err, result);
                                        }

                                        if (result == 'ErrTransactionsPerHourLimit') {
                                            $(progressel).width('100%');
                                            $(messel).html('Transaction Failed: Hourly number limit exceeded');
                                            return callback(err, result);
                                        }

                                        if (result == 'ErrInvalidRequest') {
                                            $(progressel).width('100%');
                                            $(messel).html('Transaction Failed: Invalid request');
                                            return callback(err, result);
                                        }


                                        if (result == 'ErrBroadcastFailed') {
                                            $(progressel).width('100%');
                                            $(messel).html('Transaction Failed: Not accepted');
                                            return callback(err, result);
                                        }

                                        if (result == "Invalid two factor code") {
                                            $(progressel).width('100%');
                                            $(messel).html("Invalid two factor code");
                                            return callback(err, result);
                                        }


                                    }
                                });
                            });
                        } else {

                            //create address error
                            if (changeaddress == 'ErrInvalidRequest') {
                                $(progressel).width('100%');
                                $(messel).html('Transaction Failed: Invalid request');
                                return callback(err, changeaddress);
                            }

                        }
                    });
                }

            });

        });


    }

    //function createAddress
    //this function creates an address for the user
    this.createAddress = createAddress;

    function createAddress(nodePath, changeamount, callback) {


        if (changeamount > 0) {
            var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, pathToUse: nodePath };

            //get the next leaf from the user's node space
            API.post("/api/1/u/getnextleaf", postData, function (err, leaf) {

                var path = nodePath + '/' + leaf;

                //derive the 3 public keys for the new address
                //TODO: possible to use an encrypted cache for performance improvements

                var bipHot = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.hotPub);
                var bipCold = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.coldPub);
                var bipNinki = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.ninkiPubKey);

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

                //post the address back to the server
                //this allows the server to monitor for balances etc.
                var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, path: path, address: address, pk1: hotKey.pub.toString(), pk2: coldKey.pub.toString(), pk3: ninkiKey.pub.toString() };
                API.post("/api/1/u/createaddress", postData, function (err, result) {
                    if (!err) {
                        return callback(err, address);
                    } else {
                        return callback(err, result);
                    }

                });

                //now update the address to the server

            });

        } else {
            return callback(false, "skipped");
        }

    }

    //function createAddress
    //this function creates an address on behalf of a user's contact
    this.createAddressForFriend = createAddressForFriend;
    function createAddressForFriend(username, callback) {

        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };


        API.post("/api/1/u/getfriendpacket", postData, function (err, packet) {

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

                    //derive the public keys
                    var path = 'm/' + leaf;

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
                    var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username, address: address, leaf: leaf, pk1: hotKey.pub.toString(), pk2: coldKey.pub.toString(), pk3: ninkiKey.pub.toString() };
                    API.post("/api/1/u/createaddressforfriend", postData, function (err, result) {

                        if (!err) {
                            return callback(err, address);
                        } else {
                            return callback(err, result);
                        }

                    });

                    //now update the address to the server

                });
            } else {

                //something very bad has happened
                //attempting to derive an address for a non validated contact
                return callback(true, "ErrInvalid");
            }

        });

    }

    //multi sig address hash
    function multiSig(rs) {
        var x = Bitcoin.Crypto.RIPEMD160(Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(rs)));
        x = Bitcoin.convert.wordArrayToBytes(x);
        x.unshift(0x5);
        var r = x;
        r = Bitcoin.Crypto.SHA256(Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(r)));
        var checksum = Bitcoin.convert.wordArrayToBytes(r).slice(0, 4);
        var address = Bitcoin.base58.encode(x.concat(checksum));
        return address;
    }




    this.signMessage = signMessage;
    function signMessage(key, guid, callback) {

        if (key.length > 0) {
            var bip39 = new BIP39();

            var mkey = bip39.mnemonicToHex(key);
            var bytes = [];
            for (var i = 0; i < guid.length; ++i) {
                bytes.push(guid.charCodeAt(i));
            }

            var message = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();
            var skey = Bitcoin.HDWallet.fromSeedHex(mkey);

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
        return mkey;
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
    function getUserNetwork(callback) {
        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid };
        API.post("/api/1/u/getusernetwork", postData, function (err, data) {
            var friends = JSON.parse(data);
            return callback(err, friends);
        });
    }


    this.getFriend = getFriend;
    function getFriend(username, callback) {

        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };

        return API.post("/api/1/u/getfriend", postData, function (err, data) {

            var friend = JSON.parse(data);

            return callback(err, friend);
        });

    }


    this.createFriend = createFriend;
    function createFriend(username, uimessage, callback) {

        //get the next friend node
        var node = "";
        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };

        if ($(uimessage)) {
            $(uimessage).html('Assigning node...');
        }

        API.post("/api/1/u/getnextnodeforfriend", postData, function (err, node) {

            var bipHot = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.hotPub);

            var bipCold = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.coldPub);

            var bipNinki = Bitcoin.HDWallet.fromBase58(m_this.m_walletinfo.ninkiPubKey);


            setTimeout(function () {

                var hotKey = deriveChild(node, bipHot).toString();

                if ($(uimessage)) {
                    $(uimessage).html('Deriving address.');
                }

                setTimeout(function () {

                    var coldKey = deriveChild(node, bipCold).toString();
                    if ($(uimessage)) {
                        $(uimessage).html('Deriving address..');
                    }

                    setTimeout(function () {

                        var ninkiKey = deriveChild(node, bipNinki).toString();
                        if ($(uimessage)) {
                            $(uimessage).html('Deriving address...');
                        }
                        //get the friends public RSA key
                        var rsaKey = '';

                        $(uimessage).html('Get PGP keys...');
                        API.post("/api/1/u/getrsakey", postData, function (err, rsaKey) {

                            var publicKeys = openpgp.key.readArmored(rsaKey);
                            if ($(uimessage)) {
                                $(uimessage).html('Encrypting data...');
                            }

                            var pubKey = publicKeys.keys[0];

                            var message = hotKey + coldKey + ninkiKey;

                            var encrypted = openpgp.signAndEncryptMessage([pubKey], m_this.m_privKey, message);

                            var result = "";

                            var postFriendData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username, node: node, packetForFriend: encrypted, validationHash: '' };
                            API.post("/api/1/u/createfriend", postFriendData, function (err, result) {

                                return callback(err, result);

                            });

                        });

                    }, 50);
                }, 50);
            }, 50);


        });
    }

    this.acceptFriendRequest = acceptFriendRequest;
    function acceptFriendRequest(username, callback) {


        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };
        API.post("/api/1/u/getfriendrequestpacket", postData, function (err, packet) {

            //get the packet from friend containing the public key set to
            //be used for address generation

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

                    var encrypted = openpgp.signAndEncryptMessage([m_this.m_pubKey], m_this.m_privKey, JSON.stringify(packet));

                    postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username, packet: encrypted, validationHash: '' };

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
    function verifyFriendData(username, code, callback) {

        //update packet with status as verified and log
        //the verification code


        var postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username };
        API.post("/api/1/u/getfriendpacket", postData, function (err, packet) {


            //this is set to a fixed value, i wanted it to be set as blank as we encrypt these keys aes256 anyway
            //there was no easy way to change this password in the library so i opted to go with a fixed password
            //instead of a blank one


            var msg = openpgp.message.readArmored(packet);
            var decrypted = openpgp.decryptAndVerifyMessage(m_this.m_privKey, [m_this.m_pubKey], msg);

            var isValid = decrypted.signatures[0].valid;
            if (isValid) {

                var payload = JSON.parse(sanitizer.sanitize(decrypted.text));

                var publicKeysUsed = openpgp.key.readArmored(payload.rsaKey);
                var pubKeyUsed = publicKeysUsed.keys[0];

                if (code == pubKeyUsed.primaryKey.fingerprint) {

                    var reencrypt = {
                        hotPub: payload.hotPub,
                        coldPub: payload.coldPub,
                        ninkiPub: payload.ninkiPub,
                        rsaKey: payload.rsaKey,
                        validated: true
                    };

                    var encryptedPayload = openpgp.signAndEncryptMessage([m_this.m_pubKey], m_this.m_privKey, JSON.stringify(reencrypt));

                    postData = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, username: username, packet: encryptedPayload, validationHash: code };

                    API.post("/api/1/u/updatefriend", postData, function (err, result) {

                        return callback(err, result);

                    });

                    return callback(err, true);

                } else {

                    return callback(err, false);

                }

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

            var pdata = { guid: m_this.m_guid, sharedid: m_this.m_sharedid, userName: username, packetForMe: packetForMe, packetForThem: encrypted };
            API.post("/api/1/u/createinvoice", pdata, function (err, invoiceid) {

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


    //security
    this.SaveTwoFactor = SaveTwoFactor;
    function SaveTwoFactor(twoFactorCode, verifyToken, callback) {

        var postData = {
            guid: m_this.m_guid,
            sharedid: m_this.m_sharedid,
            twoFactorOnLogin: true,
            twoFactorCode: twoFactorCode,
            verifyToken: verifyToken
        };

        API.post("/api/1/u/updatetwofactor", postData, function (err, result) {

            if (!err) {

                var bytes = [];
                for (var i = 0; i < m_this.m_sharedid.length; ++i) {
                    bytes.push(m_this.m_sharedid.charCodeAt(i));
                }

                var dpacket = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();

                API.post("/api/1/verifyrecoverpacket", { guid: m_this.m_oguid, token: dpacket }, function (err, response) {

                    callback(err, response);

                });

            } else {

                callback(true, result);

            }
        });

    }


    this.SetupTwoFactor = SaveTwoFactor;
    function SetupTwoFactor(twoFactorCode, callback) {

        var postData = {
            guid: m_this.m_guid,
            sharedid: m_this.m_sharedid,
            twoFactorOnLogin: true,
            twoFactorCode: twoFactorCode,
            verifyToken: ''
        };

        API.post("/api/1/u/updatetwofactor", postData, function (err, result) {

            $('#API-Token').val(result);

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
    function ChangePassword(twoFactorCode, oldpassword, newpassword, progbar, progmess, reset, message1, message2, callback) {


        API.getWalletFromServer(m_this.m_guid, m_this.m_secret, twoFactorCode, false, function (err, wallet) {

            if (!err) {

                //check password strength

                //stretch old password
                //verify that it matches the current one

                getHotHash("", function (err, hothash) {

                    $(progbar).width('40%');
                    $(progmess).html('Securing password...');
                    setTimeout(function () {

                        //if password reset do not pbkdf the password

                        oldpassword = pbkdf2(oldpassword, m_this.m_oguid);

                        //get the two packets
                        $(progbar).width('40%');
                        $(progmess).html('Getting packets...');

                        // $("#chngpwdprogbar").width('50%');
                        //$("#chngpwdprogmess").html('Decrypting account packet...');
                        //decrypt with the old password
                        var decryptedWithOld = true;
                        var decryptedPayload = '';
                        try {
                            decryptedPayload = decrypt(wallet.Payload, m_this.m_password, wallet.IV);
                        } catch (err) {
                            decryptedWithOld = false;
                        }

                        if (decryptedWithOld) {

                            $(progbar).width('80%');
                            $(progmess).html('Securing new password...');
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


                                        //decrypt packet
                                        var decryptedVerWithOld = true;
                                        var jpacket = JSON.parse(response);
                                        var veripacket = '';
                                        try {
                                            veripacket = decryptNp(jpacket.packet, m_this.m_password, jpacket.IV);
                                        }
                                        catch (verror) {
                                            decryptedVerWithOld = false;
                                        }


                                        if (decryptedVerWithOld) {

                                            setTimeout(function () {


                                                newpassword = pbkdf2(newpassword, m_this.m_oguid);


                                                $(progbar).width('80%');
                                                $(progmess).html('Encrypting account packet...');

                                                var newpayloadsuccess = true;
                                                var newpayload = '';
                                                var newusrpayload = '';
                                                var newveripacket = '';
                                                var newpasspacket = '';
                                                var newAIV = '';
                                                var newUIV = '';
                                                var newRIV = '';
                                                var newPIV = ''
                                                try {

                                                    newpayload = encrypt(decryptedPayload, newpassword);
                                                    newusrpayload = encrypt(rsaKeyPair, newpassword);
                                                    newveripacket = encryptNp(veripacket, newpassword);

                                                    if (decryptedPayload.hckey) {
                                                        newpasspacket = encryptNp(newpassword, decryptedPayload.hckey);
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
                                                    //$("#chngpwdprogmess").html('Encrypting user packet...');

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

                                                        if (decryptedPayload.hckey) {
                                                            testpasspacket = decryptNp(newpasspacket.toString(), decryptedPayload.hckey, newPIV)
                                                        }

                                                    } catch (err) {
                                                        testsuccess = false;
                                                    }

                                                    if (testsuccess) {

                                                        //save to the server
                                                        $(progbar).width('95%');
                                                        $(progmess).html('Saving...');


                                                        //TO DO:
                                                        //add in the re-encryption of the verification
                                                        //packet


                                                        //if reset password then provide signed message and call reset function



                                                        //need to add two factor here
                                                        //so 1. add two factor
                                                        //2. add way to save only the main packet

                                                        var postData = { twoFactorCode: twoFactorCode, guid: m_this.m_guid, sharedid: m_this.m_sharedid, accountPacket: newpayload.toString(), userPacket: newusrpayload.toString(), verifyPacket: newveripacket.toString(), passPacket: newpasspacket.toString(), IVA: newAIV, IVU: newUIV, IVR: newRIV, PIV: newPIV };
                                                        API.post("/api/1/u/updatepackets", postData, function (err, dataStr) {
                                                            if (err) {
                                                                callback(true, "Error: Password not changed");
                                                            } else {

                                                                if (dataStr == "ok") {

                                                                    m_this.m_password = newpassword;

                                                                    //if something goes wrong here
                                                                    //the worst case scenario is the
                                                                    //user has to reenter their hot key

                                                                    saveHotHash(hothash, function (err, result) {

                                                                        callback(false, '');

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


                                    });

                                }

                            });


                        } else {

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
                            $(progmess).html('Securing password...');
                            setTimeout(function () {

                                //if password reset do not pbkdf the password


                                oldpassword = resetKey;

                                //if (oldpassword == m_this.m_password) {


                                //get the two packets
                                $(progbar).width('40%');
                                $(progmess).html('Getting packets...');




                                // $("#chngpwdprogbar").width('50%');
                                //$("#chngpwdprogmess").html('Decrypting account packet...');
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
                                    $(progmess).html('Securing new password...');
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
                                                        $(progmess).html('Encrypting account packet...');

                                                        var newpayloadsuccess = true;
                                                        var newpayload = '';
                                                        var newusrpayload = '';
                                                        var newveripacket = '';
                                                        var newpasspacket = '';
                                                        var newAIV = '';
                                                        var newUIV = '';
                                                        var newRIV = '';
                                                        var newPIV = ''
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
                                                            //$("#chngpwdprogmess").html('Encrypting user packet...');

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
                                                                $(progmess).html('Saving...');


                                                                //TO DO:
                                                                //add in the re-encryption of the verification
                                                                //packet


                                                                //if reset password then provide signed message and call reset function

                                                                var postData = { guid: guid, sharedid: sharedid, accountPacket: newpayload.toString(), userPacket: newusrpayload.toString(), verifyPacket: newveripacket.toString(), passPacket: newpasspacket.toString(), IVA: newAIV, IVU: newUIV, IVR: newRIV, PIV: newPIV };
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
            token: vtoken,
            status: 1
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
    function updateAccountSettings(jsonPacket, twoFactorCode, callback) {

        var postdata = {
            guid: m_this.m_guid,
            sharedid: m_this.m_sharedid,
            jsonPacket: JSON.stringify(jsonPacket),
            twoFactorCode: twoFactorCode
        };

        API.post("/api/1/u/updateaccountsettings", postdata
        , function (err, response) {

            if (!err) {

                getAccountSettings(function (err, res) {

                    var settingsObject = JSON.parse(res);
                    m_this.m_settings = settingsObject;
                    callback(err, response);
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
            sharedid: m_this.m_sharedid,
            twoFactorOnLogin: true
        };

        API.post("/api/1/gettwofactorimg", postData, function (err, twoFactorQrImgUrl) {

            if (!err) {
                callback(false, twoFactorQrImgUrl)
            }
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


                    result.hotHash = hotHash;

                    walletInformation = {};

                    callback(err, result);

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

    this.getInvoiceList = getInvoiceList;
    function getInvoiceList(callback) {
        API.getInvoiceList(m_this.m_guid, m_this.m_sharedid, callback);
    }

    this.getInvoiceByUserList = getInvoiceByUserList;
    function getInvoiceByUserList(callback) {
        API.getInvoiceByUserList(m_this.m_guid, m_this.m_sharedid, callback);
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
        API.registerDevice(guid, deviceName, deviceId, deviceModel, devicePIN, regToken, secret, callback);
    }

    this.getDeviceKey = getDeviceKey;
    function getDeviceKey(devicePIN, callback) {

        var deviceid = "DEVICE123456789";
        if (window.cordova) {
            deviceid = window.device.uuid;
        }

        //hash the pin and device id
        var pinhash = deviceid + devicePIN;
        var bytes = [];
        for (var i = 0; i < pinhash.length; ++i) {
            bytes.push(pinhash.charCodeAt(i));
        }

        pinhash = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();

        getCookie("ninki_reg", function (regToken) {

            API.getDeviceKey(m_this.m_guid, pinhash, regToken, function (err, ekey) {

                if (!err) {
                    var jekey = JSON.parse(ekey);

                    if (jekey.DeviceKey.length > 0) {

                        callback(err, jekey);

                    } else {

                        callback(err, jekey);
                    }
                } else {
                    callback(true, ekey);
                }

            });

        });

    }


    this.destroyDevice = destroyDevice;
    function destroyDevice(callback) {

        getCookie("ninki_reg", function (regToken) {

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
}

module.exports = Engine