var Bitcoin = require('bitcoinjs-lib');
var BIP39 = require('./bip39');
var prettydate = require("pretty-date");


function UI() {

    var Engine = new Ninki.Engine();


    var currentBalance = 0;
    var FRIENDSLIST = {};
    var COINUNIT = 'BTC';
    var price = 0;
    var SELECTEDFRIEND = '';
    var noAlert = false;
    var norefresh = false;

    var sendmode = "std";

    var trasactionFilterOn = false;
    var allTransactions = [];
    var filteredTransactions = [];
    var pagedTransactions = [];
    var currentTransactionFilter = '';
    var transactionSortOn = true;
    var currentTransactionSort = 'DateDesc';
    var transactionsPerPage = 10;
    var currentPageIndex = 0;
    var transactionIndex = {};

    var filteredByMeInvoices = [];
    var pagedByMeInvoices = [];
    var invoicesByMePerPage = 10;
    var currentByMeInvoicePageIndex = 0;

    var filteredForMeInvoices = [];
    var pagedForMeInvoices = [];
    var invoicesForMePerPage = 10;
    var currentForMeInvoicePageIndex = 0;

    var currentInvoiceFilter = '';
    var currentByMeInvoiceFilter = '';
    var invoiceFilterOn = false;
    var invoiceByMeFilterOn = false;

    var contactPhraseCache = {};

    var isPairing = false;


    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE");

    var pintaps = 0;
    var prevpin = '';



    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
        document.write("Internet Explorer is not supported. Please use the latest Chrome, Safari or Firefox.");

    }

    if (typeof window.crypto.getRandomValues == 'undefined') {
        document.write("This browser does not support window.crypto. Please use the latest chrome, safari or firefox.");
    }

    var spinneropts = {
        lines: 13, // The number of lines to draw
        length: 0, // The length of each line
        width: 7, // The line thickness
        radius: 30, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#c6d0e3', // #rgb or #rrggbb or array of colors
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: '50%', // Top position relative to parent
        left: '50%' // Left position relative to parent
    };

    /* Parse bitcoin URL query keys. */
    function parseBitcoinURL(url) {
        var r = /^bitcoin:([a-zA-Z0-9]{27,34})(?:\?(.*))?$/;
        var match = r.exec(url);
        if (!match) return null;

        var parsed = { url: url };

        if (match[2]) {
            var queries = match[2].split('&');
            for (var i = 0; i < queries.length; i++) {
                var query = queries[i].split('=');
                if (query.length == 2) {
                    parsed[query[0]] = decodeURIComponent(query[1].replace(/\+/g, '%20'));
                }
            }
        }

        parsed.address = match[1];
        return parsed;
    }



    function getLocalTime(datetime) {

        var timestamp = datetime,
        t = new Date(datetime),
        hours = t.getHours(),
        min = t.getMinutes() + '',
        pm = false,
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        if (hours > 11) {
            hours = hours - 12;
            pm = true;
        }

        if (hours == 0) hours = 12;
        if (min.length == 1) min = '0' + min;

        return (hours + ':' + min + ' ' + (pm ? 'pm' : 'am'));

    }


    var pinlock = false;
    function loginPIN() {


        var pin = $("#loginpinno").val();

        $("#enterpinalert").hide();

        if (pin.length == 4 && !pinlock) {

            pinlock = true;

            Engine.Device.getStorageItem("guid", function (guid) {


                if (!Engine.m_appInitialised) {

                    Engine.m_oguid = guid;

                    var bytes = [];
                    for (var i = 0; i < guid.length; ++i) {
                        bytes.push(guid.charCodeAt(i));
                    }

                    Engine.m_guid = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();
                }

                Engine.getDeviceKey(pin, function (err, ekeyv) {

                    //decrypt the passcode

                    if (!err) {

                        if (Engine.m_appInitialised) {

                            $('.numdone').attr("style", "background-color:white");

                            //check state and display correct headers


                            $("#paddel").hide();
                            $('.numdone').attr("style", "background-color:white");
                            $("#loginpin").hide();
                            $("#pinloginmessage").text("Enter your PIN number");

                            $("#nonlogin").show();

                            $("#loginpinno").val('');
                            pinlock = false;

                            //do we show the footer or not?

                            if ($("#footermode").val() == 1) {
                                $(".footer").show();
                            } else {
                                $(".footer").hide();
                            }

                            //double check footer
                            //bug workaround

                            if (menustate == "profile" && profilepagestate == "") {

                                $(".footer").show();

                            }



                            $("#isactive").val(1);

                            setTimeout(updateUI(), 200);

                        } else {


                            $("#pairspinner").show();
                            var target = document.getElementById('pairspinner');
                            var spinner = new Spinner(spinneropts).spin(target);

                            $("#pinspinner").hide();
                            $('.numdone').attr("style", "background-color:white");
                            $("#loginpin").hide();
                            $("#loginpinno").val('');
                            pinlock = false;
                            $("#paddel").hide();
                            $("#pinloginmessage").text("Enter your PIN number");



                            Engine.Device.getStorageItem("ninki_p", function (result) {

                                var enc = JSON.parse(result);
                                result = '';
                                Engine.setStretchPass(Engine.decryptNp(enc.ct, ekeyv.DeviceKey, enc.iv));

                                Engine.Device.getStorageItem("ninki_rem", function (res) {

                                    if (res.length > 0) {
                                        var enc = JSON.parse(res);
                                        var fatoken = Engine.decryptNp(enc.ct, ekeyv.DeviceKey, enc.iv);

                                        //get the two factor token

                                        //do we need to open wallet ?

                                        Engine.openWallet(guid, fatoken, function (err, result) {

                                            if (!err) {

                                                if (result.TwoFactorOnLogin) {

                                                    $("#pairspinner").hide();
                                                    $("#loginpinno").val('');
                                                    pinlock = false;
                                                    //$("#enterpinalert").show();
                                                    //$("#enterpinalertmessage").text('Token has expired');

                                                    bootbox.alert("Your token has expired. Please repair your device", function () {

                                                        Engine.Device.deleteStorageItem("ninki_reg");
                                                        Engine.Device.deleteStorageItem("ninki_p");
                                                        Engine.Device.deleteStorageItem("ninki_rem");
                                                        Engine.Device.deleteStorageItem("guid");

                                                        location.reload();

                                                    });

                                                } else {



                                                    $("#footermode").val(1);
                                                    $(".footer").show();

                                                    Engine.Device.getStorageItem("currency", function (res) {

                                                        if (res) {

                                                            Engine.m_settings.LocalCurrency = res;

                                                        } else {

                                                            Engine.Device.setStorageItem("currency", Engine.m_settings.LocalCurrency);
                                                        }

                                                        console.log(Engine.m_settings.LocalCurrency);
                                                        console.log(Engine.m_settings.CoinUnit);

                                                        var t = Engine.m_settings.LocalCurrency;

                                                        $('.sccy').filter(function () {
                                                            return $(this).text().trim() == t;
                                                        }).find("label").html('<i class="fa fa-check text-active"></i>');


                                                        Engine.Device.getStorageItem("coinunit", function (res) {

                                                            if (res) {

                                                                Engine.m_settings.CoinUnit = res;

                                                            } else {

                                                                Engine.Device.setStorageItem("coinunit", Engine.m_settings.CoinUnit);
                                                            }


                                                            var tc = Engine.m_settings.CoinUnit;
                                                            $('.scoinunit').filter(function () {
                                                                return $(this).text().trim() == tc;
                                                            }).find("label").html('<i class="fa fa-check text-active"></i>');

                                                        });


                                                    });


                                                    initialiseDashboard(function () {


                                                        Engine.m_appInitialised = true;
                                                        $("#isactive").val(1);

                                                        $("#pairspinner").hide();

                                                        $('#dashboard').show();
                                                        $('#dashheader').show();

                                                        $("#mainWallet").show();
                                                        $(".footer").show();

                                                        $("#nonlogin").show();


                                                    });


                                                }

                                            } else {


                                                if (result == "ErrLocked") {

                                                    bootbox.alert("Your account is locked. Please unlock your account using the Chrome App");

                                                } else {

                                                    bootbox.alert(result);

                                                }


                                                $("#pairspinner").hide();
                                                $('.numdone').attr("style", "background-color:white");
                                                $("#loginpin").show();
                                                $("#loginpinno").val('');
                                                pinlock = false;
                                                $("#paddel").hide();
                                                $("#pinloginmessage").text("Enter your PIN number");

                                            }

                                        });

                                    }

                                });

                            });

                        }

                    } else {

                        $("#pinspinner").hide();

                        if (ekeyv == "ErrDeviceDestroyed") {

                            Engine.Device.deleteStorageItem("ninki_reg");
                            Engine.Device.deleteStorageItem("ninki_p");
                            Engine.Device.deleteStorageItem("ninki_rem");
                            Engine.Device.deleteStorageItem("guid");

                            bootbox.alert("Too many failed attempts. The device has been unpaired.", function () {

                                $("#loginpin").hide();
                                $("#mainWallet").hide();
                                $("#pairDevice").show();

                                location.reload();

                            });

                        } else {

                            $("#loginpinno").val('');
                            pinlock = false;
                            $('.numdone').attr("style", "background-color:white");
                            $("#paddel").hide();

                            if (ekeyv.substring(0, 6) == "ErrPIN") {

                                var attempts = ekeyv.substring(7, 8);

                                $("#pinloginmessage").text("Incorrect PIN " + attempts + "/3 attempts");

                                $("#pincounter").effect("shake");

                            } else {

                                bootbox.alert(ekeyv);

                            }


                        }

                    }

                });

            });

        } else {

            $("#pinspinner").hide();

        }

    }



    //device paring
    var deviceName = '';
    var regToken = '';
    var secret = '';
    var enck = '';
    var iv = '';


    function pairDevice() {


        var blob = $('#pairdeviceblob').val();
        var pwd = $('#pairpwd').val();

        var splitBlob = blob.split('|');

        console.log(splitBlob.length);

        if (splitBlob.length == 5) {

            var guid = splitBlob[2];

            enck = splitBlob[0];
            iv = splitBlob[1];
            deviceName = splitBlob[3];
            regToken = splitBlob[4];

            Engine.setPass(pwd, guid);

            var bytes = [];
            for (var i = 0; i < guid.length; ++i) {
                bytes.push(guid.charCodeAt(i));
            }

            var hashguid = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();


            Engine.m_guid = hashguid;
            Engine.m_oguid = guid;

            //first validate the password with the secret

            Engine.getRecoveryPacket(function (err, response) {

                if (err) {

                    bootbox.alert("There was an error, please try again.");


                } else {

                    //decrypt packet

                    var jpacket = JSON.parse(response);

                    secret = Engine.decryptNp(jpacket.packet, Engine.m_password, jpacket.IV);

                    Engine.validateSecret(secret, function (err, secvalid) {

                        if (!err) {

                            if (secvalid) {

                                //show pin screen
                                $('#pairDevice').hide();
                                $('#loginpin').show();

                            }

                        } else {

                            if (secvalid == "ErrAccount") {
                                bootbox.alert("Password not correct");
                            } else if (secvalid == "ErrLocked") {
                                bootbox.alert("The account is locked");
                            } else {
                                bootbox.alert("There was an error, please try again");
                            }

                        }

                    });

                }

            });

        } else {

            bootbox.alert("There was a pairing error, please try again.");

            // $('#pairdevicealertmessage').text("There was a pairing error");
            //$('#pairdevicealert').show();
        }

    }


    function regPIN() {



        $("#pairspinner").show();
        var target = document.getElementById('pairspinner');
        var spinner = new Spinner(spinneropts).spin(target);

        $('#loginpin').hide();




        //hash the pin and device id
        var deviceid = "DEVICE123456789";

        if (window.cordova) {
            deviceid = window.device.uuid;
        }



        var pin = $("#loginpinno").val();

        var pinhash = deviceid + pin;
        bytes = [];
        for (var i = 0; i < pinhash.length; ++i) {
            bytes.push(pinhash.charCodeAt(i));
        }

        pinhash = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();


        //new register device


        //enter password
        //stretch
        //get validate
        //if valid
        //choose a PIN
        //register


        var devplatform = "platform";
        var devmodel = "model";

        if (window.cordova) {
            devplatform = window.device.platform;
            devmodel = window.device.model;
        }


        Engine.registerDevice(Engine.m_guid, deviceName, devplatform, devmodel, pinhash, regToken, secret, function (err, result) {

            if (!err) {

                var dk = JSON.parse(result);

                if (dk.DeviceKey.length > 0) {

                    var decblob = Engine.decryptNp(enck, dk.DeviceKey, iv);

                    //slice it up
                    //64 64 64
                    var hk = decblob.substring(0, 64);
                    var fatoken = decblob.substring(64, 128);

                    var encp = Engine.encryptNp(Engine.m_password, dk.DeviceKey);
                    result = '';

                    var ptok = {};
                    ptok.ct = encp.toString();
                    ptok.iv = encp.iv.toString();
                    var ptoken = JSON.stringify(ptok);


                    var enc = Engine.encryptNp(fatoken, dk.DeviceKey);
                    var ctok = {};
                    ctok.ct = enc.toString();
                    ctok.iv = enc.iv.toString();

                    var ctoken = JSON.stringify(ctok);


                    var ench = Engine.encryptNp(hk, dk.DeviceKey);
                    var htok = {};
                    htok.ct = ench.toString();
                    htok.iv = ench.iv.toString();

                    var hkey = JSON.stringify(htok);

                    dk.DeviceKey = '';

                    //login using the credentials
                    //get a session
                    //then call register PIN
                    //this will return the encryption key
                    //encrypt the password and store in local storage

                    Engine.Device.setStorageItem("guid", Engine.m_oguid);

                    Engine.openWallet(Engine.m_oguid, fatoken, function (err, result) {

                        if (!err) {

                            if (!result.TwoFactorOnLogin) {

                                Engine.Device.setStorageItem("ninki_rem", ctoken);
                                Engine.Device.setStorageItem("ninki_p", ptoken);
                                Engine.Device.setStorageItem("ninki_reg", regToken);
                                Engine.Device.setStorageItem("ninki_h", hkey);

                                $("#loginpinno").val('');
                                pinlock = false;
                                $("#paddel").hide();
                                $('.numdone').attr("style", "background-color:white");

                                var t = Engine.m_settings.LocalCurrency;

                                $('.sccy').filter(function () {
                                    return $(this).text().trim() == t;
                                }).find("label").html('<i class="fa fa-check text-active"></i>');


                                var tc = Engine.m_settings.CoinUnit;
                                $('.scoinunit').filter(function () {
                                    return $(this).text().trim() == tc;
                                }).find("label").html('<i class="fa fa-check text-active"></i>');


                                isPairing = false;

                                //callback here before displaying



                                initialiseDashboard(function () {

                                    Engine.m_appInitialised = true;

                                    $("#pairspinner").hide();
                                    $('#dashboard').show();
                                    $('#dashheader').show();

                                    $("#footermode").val(1);
                                    $("#mainWallet").show();
                                    $(".footer").show();

                                });

                            } else {
                                $("#pairspinner").hide();
                                bootbox.alert("Could not pair", function () {

                                    location.reload();

                                });

                            }

                        } else {
                            $("#pairspinner").hide();
                            bootbox.alert(result, function () {

                                location.reload();

                            });

                        }

                    });
                } else {
                    $("#pairspinner").hide();
                    bootbox.alert("The pairing token has expired", function () {

                        location.reload();

                    });

                }


            } else {

                $("#pairspinner").hide();
                bootbox.alert(result, function () {

                    location.reload();

                });

            }

        });

        secret = '';

    }




    function closeSendNet() {



        $("#dashsend").addClass("invis");
        $("#dashsend").removeClass("slideUp");


        $("#dashsendamt").addClass("invis");
        $("#dashsendamt").removeClass("slideUp");
        $("#dashsendamt").hide();

        $("#mainWallet").show();

        if (sendmode == "net" || sendmode == "inv") {
            $("#friendheader").show();
        } else {
            $('#dashboard').show();
            $('#dashheader').show();

        }

        $(".footer").show();


        $("#dashreceive").addClass("invis");
        $("#dashreceive").removeClass("slideUp");

        $("#dashcontact").addClass("invis");
        $("#dashcontact").removeClass("slideUp");

        //$("#dashreceive").hide();
        //$("#dashcontact").hide();

        $("#pinconfirm").hide();

        $("#btnStdSndDone").hide();


        $('#toAddress').val('');

        sendAmount = '';

        updateStdAmount();

    }


    function closeSendStd() {


        $("#dashsend").removeClass("slideUp");
        $("#dashsend").addClass("invis");


        $("#dashsendamt").removeClass("slideUp");
        $("#dashsendamt").addClass("invis");
        $("#dashsendamt").hide();

        $('#dashboard').show();
        $('#dashheader').show();

        $("#mainWallet").show();
        $(".footer").show();



        $("#dashreceive").removeClass("slideUp");
        $("#dashreceive").addClass("invis");

        $("#dashcontact").removeClass("slideUp");
        $("#dashcontact").addClass("invis");

        //$("#dashreceive").hide();

        //$("#dashcontact").hide();

        $("#pinconfirm").hide();

        $("#addrfade").hide();

        $("#btnStdSndDone").hide();


        //profilepagestate = "send";
        //menustate = "profile"

        $('#toAddress').val('');

        sendAmount = '';

        updateStdAmount();

    }

    var stdAmountConvCoin = true;
    var netAmountConvCoin = true;

    function convertToLocalCurrency(amount) {

        var conv = amount;
        conv = conv * 1.0;

        var sats = convertToSatoshis(conv, COINUNIT);
        var btc = convertFromSatoshis(sats, "BTC");

        var cbtc = btc * price;

        var loc = "en-US";
        var ires = cbtc;

        if (Engine.m_settings.LocalCurrency == "JPY") {
            ires = (cbtc * 1.0).toFixed(0) * 1.0;
        } else {
            ires = (cbtc * 1.0).toFixed(2) * 1.0;
        }

        var loc = "en-US";
        var cprc = "";
        if (Engine.m_settings.LocalCurrency == "JPY" || Engine.m_settings.LocalCurrency == "CNY") {
            cprc = accounting.formatMoney(ires, "&yen;", 0);
        } else if (Engine.m_settings.LocalCurrency == "GBP") {
            cprc = accounting.formatMoney(ires, "&pound;", 2);
        } else if (Engine.m_settings.LocalCurrency == "EUR") {
            cprc = accounting.formatMoney(ires, "&euro;", 2);
        } else if (Engine.m_settings.LocalCurrency == "USD") {
            cprc = accounting.formatMoney(ires, "&dollar;", 2);
        } else if (Engine.m_settings.LocalCurrency == "CNY") {
            cprc = accounting.formatMoney(ires, "&yen;", 2);
        }

        return cprc;

    }


    function convertFromLocalCurrency(amount, format) {

        var conv = amount;
        conv = conv * 1.0;




        //convert to bitcoin
        if (price > 0) {
            var cbtc = conv / price;

            var sats = convertToSatoshis(cbtc, "BTC");

            var dp = 4;
            if (sats > 0 && sats < 10000) {
                dp = 8;
            }


            var btc = convertFromSatoshis(sats, COINUNIT);


            if (format) {
                if (COINUNIT == "BTC") {

                    btc = accounting.formatMoney(btc, "", dp);

                }

                if (COINUNIT == "Bits") {

                    btc = accounting.formatMoney(btc, "", 0);

                }
            } else {

                if (COINUNIT == "BTC") {
                    var dpr = 4;
                    if (sats > 0 && sats < 10000) {
                        dpr = 8;
                    }

                    btc = accounting.toFixed(btc, dpr);
                }

                if (COINUNIT == "Bits") {
                    var dpr = 0;
                    if (sats > 0 && sats < 10000) {
                        dpr = 2;
                    }

                    btc = accounting.toFixed(btc, dpr);
                }
            }

            return btc;

        } else {

            return 0;

        }


    }


    var sendAmount = '';

    function updateStdAmount() {

        //vamout will track the value
        //hdamount.val is the value actually used as an
        // input to the transaction


        //if the input value is decimal . or empty
        //set to 0

        var vAmount = 0;
        if (sendAmount == '' || sendAmount == '.') {
            vAmount = 0;
        } else {
            vAmount = sendAmount;
        }

        vAmount = vAmount * 1;

        if (sendAmount == '') {

            //default entry box and actual value in the case of no input
            $('#amount').text('Enter amount');
            if (stdAmountConvCoin) {
                $('#ccystdamt').html(convertToLocalCurrency(0));
            } else {
                $('#ccystdamt').html(convertFromLocalCurrency(0) + ' ' + COINUNIT);
            }
            $('#hdamount').val('0');

        } else {

            if (stdAmountConvCoin) {

                //amounts are being input in a Bitcoin denomination
                //so we convert to local currenct

                $('#ccystdamt').html(convertToLocalCurrency(vAmount));
                //convert bitcoin amount to number
                $('#hdamount').val(vAmount * 1.0);

                var cprc = 0;
                if (COINUNIT == "Bits") {

                    //default bits to 0 decimal places
                    cprc = accounting.formatMoney(sendAmount, "", 0);

                } else {


                    var indot = sendAmount.indexOf('.');

                    //if the input is the beginning of input entry
                    //apply no formatting
                    if (sendAmount == '.' || sendAmount == '0.' || sendAmount == '0') {

                        cprc = sendAmount;

                    }
                    else if (indot == sendAmount.length - 1) {
                        //if the user has just enetered a decimal point
                        //format the number and add on the decimal for display
                        cprc = accounting.formatMoney(sendAmount, "", 0) + '.';
                    }
                    else {
                        //if there is no decimal point apply formatting
                        //with 0 dp
                        if (indot == -1) {

                            cprc = accounting.formatMoney(sendAmount, "", 0);

                        } else {

                            //allow bitcoin entry up to 6 decimal places
                            var ramt = Math.min(sendAmount.length - indot, 6);
                            ramt = ramt - 1;
                            cprc = accounting.formatMoney(sendAmount, "", ramt);
                        }

                    }


                }

                var fee = convertFromSatoshis(Engine.m_settings.MinersFee, COINUNIT);
                if (currentBalance >= (vAmount + fee) && vAmount > 0) {

                    $('#btnsendmoneystd').removeClass("disabled");

                } else {

                    $('#btnsendmoneystd').removeClass("disabled");
                    $('#btnsendmoneystd').addClass("disabled");
                }

                $('#amount').text(cprc);

            }
            else {

                //entry is in local currency
                //so we need to convert to coin units and also format
                //the currency input

                var amt = convertFromLocalCurrency(vAmount);
                var amtfmt = convertFromLocalCurrency(vAmount, true);
                amt = amt * 1.0;

                $('#hdamount').val(amt);

                $('#ccystdamt').text(amtfmt + ' ' + COINUNIT);

                var symb = '';
                if (Engine.m_settings.LocalCurrency == "JPY" || Engine.m_settings.LocalCurrency == "CNY") {
                    symb = "&yen;";
                } else if (Engine.m_settings.LocalCurrency == "GBP") {
                    symb = "&pound;";
                } else if (Engine.m_settings.LocalCurrency == "EUR") {
                    symb = "&euro;";
                } else if (Engine.m_settings.LocalCurrency == "USD") {
                    symb = "&dollar;";
                } else if (Engine.m_settings.LocalCurrency == "CNY") {
                    symb = "&yen;";
                }


                var cprc = '';

                var indot = sendAmount.indexOf('.');

                if (sendAmount == '.' || sendAmount == '0.' || sendAmount == '0') {

                    cprc = symb + sendAmount;

                }
                else if (indot == sendAmount.length - 1) {

                    cprc = accounting.formatMoney(sendAmount, symb, 0) + '.';
                }
                else {

                    if (indot == -1) {

                        cprc = accounting.formatMoney(sendAmount, symb, 0);

                    } else {

                        var ramt = Math.min(sendAmount.length - indot, 2);

                        cprc = symb + sendAmount

                    }

                }


                var fee = convertFromSatoshis(Engine.m_settings.MinersFee, COINUNIT);
                if (currentBalance >= (amt + fee) && amt > 0) {

                    $('#btnsendmoneystd').removeClass("disabled");

                } else {

                    $('#btnsendmoneystd').removeClass("disabled");
                    $('#btnsendmoneystd').addClass("disabled");
                }


                $('#amount').html(cprc);
            }
        }

    }


    var profilepagestate = '';
    var networkpagestate = '';
    var friendpagestate = '';
    var menustate = '';

    var cl = '';

    var scrolling = false;
    var scrollingnettran = false;
    var scrollingnetlist = false;

    jQuery(document).ready(function () {

        var $body = jQuery('body');


        $("#dashboard").on("scroll", function () {
            scrolling = true;
        });

        $("#dashboard").on("touchstart", function () {

            scrolling = false;

        });

        $("#pnlfriend").on("scroll", function () {
            scrollingnettran = true;
        });

        $("#pnlfriend").on("touchstart", function () {

            scrollingnettran = false;

        });

        $("#networklist").on("scroll", function () {
            scrollingnetlist = true;
        });

        $("#networklist").on("touchstart", function () {

            scrollingnetlist = false;

        });


        bootbox.setDefaults({ 'backdrop': false, 'animate': true });

        //guid
        //ninki_reg

        //if device is paired then


        Engine.Device.getStorageItem("ninki_reg", function (reg) {

            if (reg) {
                isPairing = false;
                $("#loginpin").show();
                $("#pinimage").show();

            } else {
                isPairing = true;
                $("#pairDevice").show();
                $("#pinpair").show();
            }

        });


        $("#mainWallet").hide();

        //$("#dashreceive").hide();
        //$("#dashcontact").hide();


        $("#addcontactmodal").hide();


        $('#stdselcu').click(function () {

            sendAmount = '';

            $('#stdselunit').text(COINUNIT);


            stdAmountConvCoin = true;

            updateStdAmount();

        });


        $('#stdsellc').click(function () {


            sendAmount = '';

            $('#stdselunit').text(Engine.m_settings.LocalCurrency);
            stdAmountConvCoin = false;

            updateStdAmount();


        });


        //        $('.numc').bind('touchstart', function () {
        //            $(this).removeClass('numtapoff');

        //            cl = 'b' + (Math.floor(Math.random() * 6) + 1) + '';
        //            //alert(cl);
        //            $(this).addClass(cl);

        //        });



        $('.scoinunit').bind('click', function () {

            $('.scoinunit').find("label").html('');

            $(this).find("label").html('<i class="fa fa-check text-active"></i>');

            var sel = $.trim($(this).text());

            Engine.Device.setStorageItem("coinunit", sel);

            Engine.m_settings.CoinUnit = sel;

            COINUNIT = sel;

            prevtransfeed = -1;
            prevNetworkTransCount = -1;

            updateUI();

        });





        $('.sccy').bind('click', function () {

            $('.sccy').find("label").html('');

            $(this).find("label").html('<i class="fa fa-check text-active"></i>');

            var sel = $.trim($(this).text());

            Engine.Device.setStorageItem("currency", sel);

            Engine.m_settings.LocalCurrency = sel;

            updateUI();

        });




        $('.numc').bind('touchend', function () {

            var num = $(this);
            var text = $.trim(num.find('.txt').clone().children().remove().end().text());


            //check the number of decimal places and if more than 8 for btc
            if (text.length > 0) {

                if (stdAmountConvCoin) {

                    if (sendAmount.indexOf(".") > -1) {

                        var ind = sendAmount.indexOf(".");

                        if (COINUNIT == "BTC") {
                            if ((sendAmount.length - ind) == 7) {

                                return;

                            }
                        }

                    }

                } else {

                    if (sendAmount.indexOf(".") > -1) {

                        var ind = sendAmount.indexOf(".");


                        if ((sendAmount.length - ind) == 3) {

                            return;

                        }


                    }

                }


            }


            if (!(sendAmount.indexOf(".") > -1 && text == '.')) {

                var prev = sendAmount.substring(0, sendAmount.length - 1);

                if (text.length > 0) {
                    sendAmount = (sendAmount + '' + text);
                } else {
                    sendAmount = prev;
                }

                updateStdAmount();

            }


        });




        window.resetPin = function () {

            pintaps = 0;
            prevpin = '';

        };

        window.hasSession = function () {

            if (Engine.m_APIToken.length > 0) {

                return true;

            }

            return false;

        };






        //touchend
        $('#loginpin .num').bind('touchstart', function () {


            if (!pinlock) {

                if (pintaps < 4) {

                    var num = $(this);
                    var text = $.trim(num.find('.txt').clone().children().remove().end().text());

                    if (text.length > 0) {

                        pintaps++;

                        if (pintaps == 1) {

                            $('#loginpin #pin1').attr("style", "background-color:Gray");

                        }

                        if (pintaps == 2) {

                            $('#loginpin #pin2').attr("style", "background-color:Gray");

                        }

                        if (pintaps == 3) {

                            $('#loginpin #pin3').attr("style", "background-color:Gray");

                        }

                        if (pintaps == 4) {

                            $('#loginpin #pin4').attr("style", "background-color:Gray");

                        }

                    }




                    var loginpinno = $('#loginpinno');
                    var lpin = loginpinno.val();
                    prevpin = lpin.substring(0, lpin.length - 1);

                    //if not delete
                    if (text.length > 0) {

                        $('#paddel').show();

                        $(loginpinno).val(loginpinno.val() + text);

                        if (pintaps == 4) {

                            pintaps = 0;

                            if (!isPairing) {
                                loginPIN();
                            } else {
                                regPIN();
                            }

                            //only if fail

                        }


                    } else {



                        if (pintaps == 1) {

                            $('#loginpin #pin1').attr("style", "background-color:White");
                            $('#loginpin #paddel').hide();

                        }

                        if (pintaps == 2) {

                            $('#loginpin #pin2').attr("style", "background-color:White");

                        }

                        if (pintaps == 3) {

                            $('#loginpin #pin3').attr("style", "background-color:White");

                        }

                        if (pintaps == 4) {

                            $('#loginpin #pin4').attr("style", "background-color:White");

                        }

                        $(loginpinno).val(prevpin);

                        if (pintaps > 0) {
                            pintaps--;
                        }

                    }
                }

            }
        });




        $('#pinconfirm .num').bind('touchend', function () {


            //;


            var num = $(this);

            var text = $.trim(num.find('.txt').clone().children().remove().end().text());
            var loginpinno = $('#sendstdpin');
            var lpin = loginpinno.val();
            prevpin = lpin.substring(0, lpin.length - 1);

            if (text.length > 0) {

                $('#paddelconf').show();

                pintaps++;

                if (pintaps == 1) {

                    $('#pinconfirm #cpin1').attr("style", "background-color:Gray");

                }

                if (pintaps == 2) {

                    $('#pinconfirm #cpin2').attr("style", "background-color:Gray");

                }

                if (pintaps == 3) {

                    $('#pinconfirm #cpin3').attr("style", "background-color:Gray");

                }

                if (pintaps == 4) {

                    $('#pinconfirm #cpin4').attr("style", "background-color:Gray");

                }


                $(loginpinno).val(loginpinno.val() + text);

                if (pintaps == 4) {


                    pintaps = 0;

                    if (sendmode == 'std') {

                        sendMoneyStd();

                    } else if (sendmode == 'net') {

                        sendMoney(SELECTEDFRIEND, 0);

                    } else if (sendmode == 'inv') {

                        payInvoice(selectedInvoiceUserName, selectedInvoiceAmount, selectedInvoiceId);

                    }



                    //only if fail

                }


            } else {



                if (pintaps == 1) {

                    $('#pinconfirm #cpin1').attr("style", "background-color:White");
                    $('#pinconfirm #paddelconf').hide();

                }

                if (pintaps == 2) {

                    $('#pinconfirm #cpin2').attr("style", "background-color:White");

                }

                if (pintaps == 3) {

                    $('#pinconfirm #cpin3').attr("style", "background-color:White");

                }

                if (pintaps == 4) {

                    $('#pinconfirm #cpin4').attr("style", "background-color:White");

                }

                $(loginpinno).val(prevpin);

                if (pintaps > 0) {
                    pintaps--;
                }


            }

        });


        $("#btnmenuprofile").bind('touchstart', function () {

            displayProfile();

        });



        function displayProfile() {


            if (menustate != 'profile') {
                menustate = 'profile';
                $("#settings").hide();
                $("#settingsheader").hide();


                $("#network").hide();
                $("#networklistheader").hide();
                $("#friendheader").hide();
                $("#dashboard").show();

                $('#dashheader').show();
                //$("#invoices").hide();

            } else {
                profilehome();
            }

            $("#btnmenusettings").attr('style', 'background-color:#ffffff');
            $("#btnmenunetwork").attr('style', 'background-color:#ffffff');
            $("#btnmenuprofile").attr('style', 'background-color:#eaeef1');

        }


        var hastouched = false;
        $("#btnmenunetwork").bind('touchstart', function () {

            if (!hastouched) {

                hastouched = true;

                var target = document.getElementById('myfrndspin');
                var spinner = new Spinner(spinneropts).spin(target);
                $("#myfrndspin").show();
                updateFriends(function (err, res) {

                    $("#myfrndspin").hide();

                });

                loadInvoices();

            }

            displayNetwork();


        });


        function displayNetwork() {

            if (menustate != "network") {

                menustate = "network";
                $("#settings").hide();
                $("#settingsheader").hide();
                $("#dashboard").hide();
                $('#dashheader').hide();
                //$("#pnlfriend").hide();
                $("#network").show();


                if ($("#networklist").is(':visible')) {
                    $("#networklistheader").show();
                }

                if ($("#pnlfriend").is(':visible')) {
                    $("#friendheader").show();
                }

                //$("#networklist").show();

                if (networkpagestate == "invoice") {


                    //$("#invoices").show();
                }

            } else {

                networkhome();
            }

            $("#btnmenusettings").attr('style', 'background-color:#ffffff');
            $("#btnmenuprofile").attr('style', 'background-color:#ffffff');
            $("#btnmenunetwork").attr('style', 'background-color:#eaeef1');
        }


        $("#invformelink").hammer(null).bind("tap", function () {

            sendmode = "inv";
            $("#invformetab").show();
            $("#invbymetab").hide();
            $("#liby").removeClass('active');
            $("#lifor").addClass('active');
        });

        $("#invbymelink").hammer(null).bind("tap", function () {
            $("#invbymetab").show();
            $("#invformetab").hide();
            $("#lifor").removeClass('active');
            $("#liby").addClass('active');
        });


        $("#tapnetpayments").hammer(null).bind("tap", function () {
            $("#pnlfriendinv").hide();
            $("#networkpayments").show();
            $("#networksend").hide();
            networkpagestate = "friend";
            friendpagestate = "payments";

        });


        $("#tapinvoicefriend").hammer(null).bind("tap", function () {

            $("#pnlfriendinv").show();
            $("#networkpayments").hide();
            $("#networksend").hide();
            networkpagestate = "friend";
            friendpagestate = "invoice";

        });

        function networkhome() {
            if (networkpagestate == "invoice") {

                $('#network').show();
                $("#pnlfriend").show();
                $("#friendheader").show();
                $('#invoices').hide();
                networkpagestate = "friend";
                friendpagestate = "invoice";


            } else {

                $("#pnlfriend").hide();
                $("#friendheader").hide();
                $("#network").show();
                $("#networklist").show();
                $("#networklistheader").show();

                networkpagestate = "";
            }

        }

        function profilehome() {

            $("#dashprofile").show();

            $("#dashsend").addClass("invis");
            $("#dashsend").removeClass("slideUp");


            $("#dashreceive").addClass("invis");
            $("#dashreceive").removeClass("slideUp");

            $("#dashcontact").addClass("invis");
            $("#dashcontact").removeClass("slideUp");

            //$("#dashreceive").hide();
            //$("#dashcontact").hide();

            $('#invoices').hide();
            $("#dashboard").show();
            $('#dashheader').show();
            $("#network").hide();
            profilepagestate = "";

        }


        $("#btnmenusettings").bind('touchstart', function () {

            menustate = "settings";

            $("#settings").show();
            $("#settingsheader").show();
            $("#network").hide();
            $("#dashboard").hide();
            $('#dashheader').hide();
            $('#friendheader').hide();
            $('#networklistheader').hide();

            $("#btnmenusettings").attr('style', 'background-color:#eaeef1');
            $("#btnmenuprofile").attr('style', 'background-color:#ffffff');
            $("#btnmenunetwork").attr('style', 'background-color:#ffffff');
        });


        $('#toAddress').change(function () {

            //if a valid bitcoin address then
            //next stage
            var addr = $('#toAddress').val();

            if (addr.indexOf('bitcoin:') == -1) {
                addr = 'bitcoin:' + addr;
            }

            var paddr = parseBitcoinURL(addr);

            if (addr.length > 25) {
                if (Engine.isAddressValid(paddr.address)) {

                    //next stage

                    //if amount is included in the URL set the amount and go straight to the
                    //pay screen

                    $('#toAddress').val(paddr.address);

                    $("#dashsend").addClass("invis");
                    $("#dashsend").removeClass("slideUp");

                    $("#addrfade").hide();

                    $("#dashsendamt").show();
                    $("#dashsendamt").removeClass("invis");
                    $("#dashsendamt").addClass("slideUp");



                }
            }
        });



        $("#btnCloseTran").bind('touchstart', function () {

            $("#transview").removeClass("slideUp");
            $("#transview").addClass("invis");

            $("#mainWallet").show();
            $(".footer").show();

            if (transactionDetailMode == 'dashboard') {
                $('#dashboard').show();
                $('#dashheader').show();
            } else {
                $("#friendheader").show();
            }

        });


        $("#btnCloseContact").bind('touchstart', function () {

            //closeSendStd();

            //$("#dashcontact").hide();
            $("#dashcontact").removeClass("slideUp");
            $("#dashcontact").addClass("invis");

            $("#mainWallet").show();
            $("#networklistheader").show();
            $(".footer").show();

        });

        $("#btnAddContactDone").bind('touchstart', function () {

            $("#addcontactmodal").hide();
            $("#dashcontact").show();


        });

        $("#btnCloseStdSndAmt").bind('touchstart', function () {

            closeSendNet();

        });

        $("#btnCloseStdSndPIN").bind('touchstart', function () {

            if (sendmode == "std") {
                closeSendStd();
            } else if (sendmode == "net") {
                closeSendNet();
            } else {
                $("#pinconfirm").hide();
                $("#invoices").show();
            }

        });

        $("#btnCloseStdSnd").bind('touchstart', function () {

            closeSendStd();

        });

        $("#btnCloseRec").bind('touchstart', function () {

            closeSendStd();

        });

        $("#btnStdSndDone").bind('touchstart', function () {

            $('#sendprogress').hide();

            $('#textMessageSendStd').text('');
            $('#textMessageSendStd').hide();
            $('#sendstdprogstatus').width('0');
            $('#sendstdprognum').text('0%');
            $('#sendstdprog').hide();

            if (sendmode == "std") {
                closeSendStd();
            } else if (sendmode == "net") {
                closeSendNet();
            } else {
                $("#mainWallet").show();
                $("#invoices").hide();
                $("#network").show();
                $("#pnlfriend").show();
                $("#friendheader").show();
                $(".footer").show();
            }

        });


        $("#btnsendmoneystd").bind('touchstart', function () {


            $('#paddelconf').hide();

            $("#dashsendamt").hide();
            $("#pinconfirm").show();

            if (sendmode == 'std') {
                $("#sendstds2add").text($('#toAddress').val());
            } else if (sendmode == 'net') {
                $("#sendstds2add").text(SELECTEDFRIEND);
            }

            if (COINUNIT == "BTC") {
                $("#sendstds2amt").text(accounting.formatNumber($("#hdamount").val(), 8, ",", ".") + ' ' + COINUNIT);
            } else {
                $("#sendstds2amt").text(accounting.formatNumber($("#hdamount").val(), 2, ",", ".") + ' ' + COINUNIT);
            }



            $("#dashsend").addClass("invis");
            $("#dashsend").removeClass("slideUp");


            $("#dashsendamt").addClass("invis");
            $("#dashsendamt").removeClass("slideUp");



            //sendMoneyStd();

        });

        $("#btnCloseValidate").bind('touchstart', function () {

            $("#friendheader").show();
            $("#mainWallet").show();
            $(".footer").show();
            $("#networkvalidate").hide();

        });

        $("#tapvalidatefriend").bind('touchstart', function () {

            $("#friendheader").hide();
            $("#mainWallet").hide();
            $(".footer").hide();
            $("#networkvalidate").show();

        });

        $("#tapsendfriend").bind('touchstart', function () {

            sendmode = "net";

            $("#sendsubheading").text("send to " + SELECTEDFRIEND);

            $("#btnStdSndDone").hide();
            $("#dashsend").addClass("invis");
            $("#dashsend").removeClass("slideUp");

            $("#addrfade").hide();

            $("#friendheader").hide();

            $("#dashsendamt").show();
            $("#dashsendamt").removeClass("invis");
            $("#dashsendamt").addClass("slideUp");



            $("#mainWallet").hide();
            $(".footer").hide();


            networkpagestate = "friend";
            friendpagestate = "send";

            updateStdAmount();

        });

        $("#tapsend").bind('touchstart', function () {

            sendmode = "std";
            $("#sendsubheading").text('');
            $("#dashheader").hide();
            $("#dashprofile").hide();
            $("#dashboard").hide();

            $("#dashsend").addClass("slideUp");

            //$("#dashsend").removeClass("invis");


            setTimeout(function () {
                $("#addrfade").fadeIn(500);

            }, 500);


            $("#dashsendamt").addClass("invis");
            $("#dashsendamt").removeClass("slideUp");
            $("#dashsendamt").hide();

            $("#mainWallet").hide();
            $(".footer").hide();

            //$("#dashreceive").hide();
            //$("#dashcontact").hide();

            $("#toAddress").blur();
            $("#qr").focus();
            $("#btnStdSndDone").hide();

            profilepagestate = "send";
            menustate = "profile"


        });

        $("#tapreceive").bind('touchstart', function () {



            //dashreceive
            $("#dashheader").hide();
            $("#dashprofile").hide();


            $("#mainWallet").hide();

            $("#dashreceive").addClass("slideUp");

            $(".footer").hide();

            profilepagestate = "receive";
            menustate = "profile"

            setTimeout(generateAddressClient(), 1000);


        });

        $("#taprequest").bind('touchstart', function () {

            $("#mainWallet").hide();
            $("#networklistheader").hide();

            $("#dashcontact").addClass("slideUp");

            //$("#dashcontact").show();


            $(".footer").hide();

            //checkAndValidateTimer = setInterval(function () { checkAndValidateFriendRequests() }, 2000);

            //profilepagestate = "contact";
            //menustate = "profile"

        });

    });


    $(document).ready(function () {

        $("#pairdeviceblob").change(function () {


            if ($("#pairdeviceblob").val().length > 10) {

                var check = $("#pairdeviceblob").val().split('|');

                $("#pairdevicealert").hide();

                if (check.length == 5) {

                    $("#loginpin").hide();
                    $("#pairstep1").hide();


                    $("#pairstep2").show();
                    $("#pairpwd").focus();

                } else {

                    bootbox.alert("There was a pairing error, please try again.");

                }
            } else {


                bootbox.alert("There was a pairing error, please try again.");

            }


        });


        $("#btnUnpair").click(function () {

            bootbox.confirm("Are you sure?", function (result) {

                if (result) {

                    Engine.Device.getStorageItem("guid", function (guid) {

                        Engine.m_oguid = guid;

                        var bytes = [];
                        for (var i = 0; i < guid.length; ++i) {
                            bytes.push(guid.charCodeAt(i));
                        }

                        Engine.m_guid = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();


                        Engine.destroyDevice(function (err, res) {

                            //call to server
                            location.reload();

                        });

                        //always destroy locally
                        Engine.Device.deleteStorageItem("ninki_rem");
                        Engine.Device.deleteStorageItem("ninki_p");
                        Engine.Device.deleteStorageItem("ninki_reg");
                        Engine.Device.deleteStorageItem("ninki_h");
                        Engine.Device.deleteStorageItem("guid");
                        Engine.Device.deleteStorageItem("coinunit");
                        Engine.Device.deleteStorageItem("currency");

                    });

                }

            });

        });

        $("#btnPairDevice").bind('touchstart', function () {

            $("#pairpwd").blur();

            pairDevice();


        });

        $("#btnaddfriend").bind('touchstart', function () {

            addFriend($('input#friend').val());

        });

        $("#btngenaddr").bind('touchstart', function () {

            generateAddressClient();

        });

        $("#btnSendToFriend").bind('touchstart', function () {


            sendMoney(SELECTEDFRIEND, 0);


        });

        $("#sendfriendprog").hide();


        $("#btnVerify").bind('touchstart', function () {

            var code = $("#txtCode").val();

            $("#txtCode").css("border-color", "#ccc");
            $("#validatefail").hide();
            $("#validatesuccess").hide();

            var bip39 = new BIP39();
            code = bip39.mnemonicToHex(code);

            if (code.length != 40) {
                $("#txtCode").css("border-color", "#ffaaaa");
                return;
            }

            //get the hash to validate against
            //this will confirm that my friend has the same keys
            //i orginally packaged for him

            Engine.verifyFriendData(SELECTEDFRIEND, code, function (err, result) {

                if (result) {

                    $("#txtCode").val('');
                    selectedFriend.validated = true;
                    FRIENDSLIST[selectedFriend.userName].validated = true;
                    updateSelectedFriend();
                    $("#networkvalidate").hide();
                    $("#friendheader").show();
                    $("#mainWallet").show();
                    $(".footer").show();
                    //update list also

                    //find friend in list and update the validated icon
                    $("#myfriends #seltarget" + selectedFriend.userName).html('<div class="pull-right text-success m-t-sm"><i class="fa fa-check-square" style="font-size:1.5em"></i></div>');


                } else {
                    $("#validatefail").show();
                }

            });
        });


        //INVOICE STUFF START------------------------------------------

        $("#friendselector").hide();
        $("#invoice").hide();
        $("#invoicedisplay").hide();

        $("#btnpayinvoice").bind('touchstart', function () {


            $(".footer").hide();

            $("#sendstds2add").text(SELECTEDFRIEND);

            $("#sendstds2amt").text(convertFromSatoshis(selectedInvoiceAmount, COINUNIT) + ' ' + COINUNIT);

            sendmode = 'inv';

            $('.numdone').attr("style", "background-color:white");
            $("#sendstdpin").val('');
            pintaps = 0;
            prevpin = '';

            $("#invoices").hide();
            $("#mainWallet").hide();
            $("#pinconfirm").show();


        });

        $("#btnrejectinvoice").bind('touchstart', function () {

            Engine.updateInvoice(selectedInvoiceUserName, selectedInvoiceId, '', 2, function (err, result) {

                loadInvoices(function (err, res) {

                    lastInvoiceToPayCount = 0;

                    showInvoiceListNetwork();

                    $("#invoices").hide();
                    $("#mainWallet").show();
                    $("#network").show();
                    $("#pnlfriend").show();
                    $("#friendheader").show();
                    $(".footer").show();

                    updateSelectedFriend();

                });
            });

        });

        $("#payinvoicecancel").bind('touchstart', function () {


            $("#invoices").hide();
            $("#mainWallet").show();
            $("#network").show();
            $("#pnlfriend").show();
            $("#friendheader").show();
            $(".footer").show();


            //if (uiInvoiceReturnToNetwork) {
            //$("#hnetwork").click();
            //uiInvoiceReturnToNetwork = false;
            //}


        });

    });


    var lastInvoiceToPayNetCount = 0;
    var uiInvoiceReturnToNetwork = false;

    var cachedInvoices = [];
    var cachedInvoicesByUser = [];

    function showInvoiceListNetwork() {

        var invoices = _.filter(cachedInvoices, function (inv) { return inv.InvoiceFrom == SELECTEDFRIEND; });


        if (invoices.length == 0) {
            $('#invfornet').empty();
            $('#invfornet').hide();
        }


        //if (lastInvoiceToPayNetCount < invoices.length) {

        lastInvoiceToPayNetCount = invoices.length;

        var s = '';
        $('#invfornet').empty();

        for (var i = 0; i < invoices.length; i++) {

            var invdate = new Date(invoices[i].InvoiceDate.match(/\d+/)[0] * 1);

            var timeLabel = prettydate.format(invdate);

            var statusbox = '';
            if (invoices[i].InvoiceStatus == 0) {
                statusbox = '<i class=\"fa fa-clock-o text-warning text-active\"></i> <span class="label bg-warning">Pending</span>';
            }
            else if (invoices[i].InvoiceStatus == 1) {
                statusbox = '<i class=\"fa fa-check text-success text-active\"></i> <span class="label bg-success">Paid</span>';
            }
            else if (invoices[i].InvoiceStatus == 2) {
                statusbox = '<i class=\"fa fa-times text-danger text-active\"></i> <span class="label bg-danger">Rejected</span>';
            }

            s += "<a id=\"viewinvoicenetfrom" + _.escape(invoices[i].InvoiceFrom) + _.escape(invoices[i].InvoiceId) + "\" class=\"media list-group-item\"><div class=\"pull-left\">" + _.escape(timeLabel) + "</div>" +
                                 "<div class=\"pull-right m-t-xs\">" + statusbox + "</div></a>";
        }

        $('#invfornet').append(s);

        for (var i = 0; i < invoices.length; i++) {

            $("#invfornet #viewinvoicenetfrom" + invoices[i].InvoiceFrom + invoices[i].InvoiceId).hammer(null).bind("tap", {
                index: invoices[i].InvoiceId, username: invoices[i].InvoiceFrom
            }, function (event) {

                $("#invtapspinner").show();
                var target = document.getElementById('invtapspinner');
                var spinner = new Spinner(spinneropts).spin(target);

                displayInvoice(event.data.index, event.data.username, 'forme', function (err, res) {
                    uiInvoiceReturnToNetwork = true;

                    networkpagestate = "invoice";
                    friendpagestate = "invoice";

                    $("#invtapspinner").hide();
                    $('#pnlfriend').hide();
                    $("#friendheader").hide();
                    $(".footer").hide();
                    $('#invoices').show();


                });
            });
        }

        $('#invfornet').show();


        //}

        // $('#pnlfriendinv').show();


    }

    var lastInvoiceByMeNetCount = 0;
    function showInvoiceByMeListNetwork() {

        var invoices = _.filter(cachedInvoicesByUser, function (inv) { return inv.InvoiceFrom == SELECTEDFRIEND; });

        if (invoices.length == 0) {
            $('#invbynet').empty();
            $('#invbynet').hide();
        }


        if (lastInvoiceByMeNetCount < invoices.length) {

            lastInvoiceByMeNetCount = invoices.length;

            var s = '';
            $('#invbynet').empty();

            for (var i = 0; i < invoices.length; i++) {

                var invdate = new Date(invoices[i].InvoiceDate.match(/\d+/)[0] * 1);

                var timeLabel = prettydate.format(invdate);


                var statusbox = '';
                if (invoices[i].InvoiceStatus == 0) {
                    statusbox = '<i class=\"fa fa-clock-o text-warning text-active\"></i> <span class="label bg-warning">Pending</span>';
                }
                else if (invoices[i].InvoiceStatus == 1) {
                    statusbox = '<i class=\"fa fa-check text-success text-active\"></i> <span class="label bg-success">Paid</span>';
                }
                else if (invoices[i].InvoiceStatus == 2) {
                    statusbox = '<i class=\"fa fa-times text-danger text-active\"></i> <span class="label bg-danger">Rejected</span>';
                }

                s += "<a id=\"viewinvoicenetby" + invoices[i].InvoiceFrom + invoices[i].InvoiceId + "\" class=\"media list-group-item\"><div class=\"pull-left\">" + _.escape(timeLabel) + "</div>" +
                                 "<div class=\"pull-right m-t-xs\">" + statusbox + "</div></a>";
            }

            $('#invbynet').append(s);

            for (var i = 0; i < invoices.length; i++) {

                $("#invbynet #viewinvoicenetby" + invoices[i].InvoiceFrom + invoices[i].InvoiceId).hammer(null).bind("tap", {
                    index: invoices[i].InvoiceId, username: invoices[i].InvoiceFrom
                }, function (event) {


                    $("#invtapspinner").show();
                    var target = document.getElementById('invtapspinner');
                    var spinner = new Spinner(spinneropts).spin(target);

                    displayInvoice(event.data.index, event.data.username, 'byme', function (err, res) {

                        networkpagestate = "invoice";
                        friendpagestate = "invoice";

                        $("#invtapspinner").hide();
                        $('#pnlfriend').hide();
                        $("#friendheader").hide();
                        $('.footer').hide();
                        $('#invoices').show();

                    });
                });
            }

            $('#invbynet').show();


        }

        // $('#pnlfriendinv').show();


    }



    var selectedInvoiceAmount = 0;
    var selectedInvoiceId = 0;
    var selectedInvoiceUserName = '';


    function displayInvoiceDetails(invoice, json, invtype, callback) {


        var invdate = new Date(invoice.InvoiceDate.match(/\d+/)[0] * 1).toString("yyyy-MM-dd HH:mm tt");




        $("#createinv").hide();
        $("#invoicestopay").hide();

        $('#tblinvdisplay tbody').empty();

        var dp = 4;

        if (COINUNIT == "Bits") {

            if (json.summary.total < 10000) {
                dp = 2;
            } else {
                dp = 0;
            }
        }

        if (COINUNIT == "BTC") {

            if (json.summary.total < 10000) {
                dp = 8;
            } else {
                dp = 4;
            }
        }

        var s = '';
        for (var i = 0; i < json.invoicelines.length; i++) {
            if (COINUNIT == "Bits") {
                s += "<tr><td>" + _.escape(json.invoicelines[i].description) + "</td><td>" + _.escape(json.invoicelines[i].quantity) + "</td><td>" + _.escape(accounting.formatNumber(convertFromSatoshis(json.invoicelines[i].amount, COINUNIT), dp, ",", ".")) + "</td><td>" + _.escape(accounting.formatNumber(convertFromSatoshis(json.invoicelines[i].amount, COINUNIT) * json.invoicelines[i].quantity, dp, ",", ".")) + "</td></tr>";
            } else {
                s += "<tr><td>" + _.escape(json.invoicelines[i].description) + "</td><td>" + _.escape(json.invoicelines[i].quantity) + "</td><td>" + _.escape(accounting.formatNumber(convertFromSatoshis(json.invoicelines[i].amount, COINUNIT), dp, ",", ".")) + "</td><td>" + _.escape(accounting.formatNumber(convertFromSatoshis(json.invoicelines[i].amount, COINUNIT) * json.invoicelines[i].quantity, dp, ",", ".")) + "</td></tr>";
            }
        }

        $('#tblinvdisplay tbody').append(s);

        if (invtype == 'forme') {
            $("#dinvusername").text('Invoice from ' + invoice.InvoiceFrom);
        } else {
            $("#dinvusername").text('Invoice to ' + invoice.InvoiceFrom);
        }

        $("#dinvdate").text(invdate);


        $("#tblinvdisplay tfoot th #dsubtotal").text(accounting.formatNumber(convertFromSatoshis(json.summary.subtotal, COINUNIT), dp, ",", "."));
        $("#tblinvdisplay tfoot th #dtax").text(accounting.formatNumber(convertFromSatoshis(json.summary.tax, COINUNIT), dp, ",", "."));
        $("#tblinvdisplay tfoot th #dtotal").text(accounting.formatNumber(convertFromSatoshis(json.summary.total, COINUNIT), dp, ",", "."));





        selectedInvoiceAmount = convertFromSatoshis(json.summary.total);
        selectedInvoiceId = invoice.InvoiceId;
        selectedInvoiceUserName = invoice.InvoiceFrom;

        $("#sendinvprog").hide();
        $("#textMessageSendInv").hide();
        $("#btnokinvoice").hide();
        $("#invvalmess").hide();

        if (invtype == 'forme') {
            if (invoice.InvoiceStatus == 0) {

                $("#payinvoicecancel").show();
                $("#btnpayinvoice").show();
                $("#btnrejectinvoice").show();

                if (!FRIENDSLIST[invoice.InvoiceFrom].validated) {
                    $("#btnpayinvoice").addClass("disabled");
                    $("#invvalt").text(invoice.InvoiceFrom);
                    $("#invvalmess").show();
                } else {
                    $("#btnpayinvoice").removeClass("disabled");
                    $("#invvalmess").hide();
                }

            }

            if (invoice.InvoiceStatus == 1 || invoice.InvoiceStatus == 2) {
                $("#btnokinvoice").show();
                //$("#payinvoicecancel").hide();
                $("#btnpayinvoice").hide();
                $("#btnrejectinvoice").hide();
            }
        } else {
            $("#btnokinvoice").show();
            //$("#payinvoicecancel").hide();
            $("#btnpayinvoice").hide();
            $("#btnrejectinvoice").hide();
        }

        var statusbox = '';
        if (invoice.InvoiceStatus == 0) {
            statusbox = '<i class=\"fa fa-clock-o text-warning text-active\"></i> <span class="label bg-warning">Pending</span>';
        }
        else if (invoice.InvoiceStatus == 1) {
            statusbox = '<i class=\"fa fa-check text-success text-active\"></i> <span class="label bg-success">Paid</span>';
        }
        else if (invoice.InvoiceStatus == 2) {
            statusbox = '<i class=\"fa fa-times text-danger text-active\"></i> <span class="label bg-danger">Rejected</span>';
        }

        $("#invdisstatus").html(statusbox);
        $("#invdisid").text(invoice.InvoiceFrom.toUpperCase() + invoice.InvoiceId);


        $("#invoicedisplay").show();

        return callback(false, "ok");
    }

    function displayInvoiceByUser(invoiceid, username, invtype, callback) {

        var invoice = _.find(cachedInvoicesByUser, function (inv) { return inv.InvoiceId == invoiceid; });

        //here decrypt the invoice with my private key

        Engine.UnpackInvoiceByMe(invoice, username, function (err, unpacked) {

            displayInvoiceDetails(invoice, unpacked, invtype, function (err, res) {

                callback(false, "ok");

            });

        });

    }

    function displayInvoice(invoiceid, username, invtype, callback) {

        var invoice;

        //find by invoicefrom and invoice id

        if (invtype == 'forme') {
            invoice = _.find(cachedInvoices, function (inv) { return inv.InvoiceFrom == username && inv.InvoiceId == invoiceid; });
        } else {
            invoice = _.find(cachedInvoicesByUser, function (inv) { return inv.InvoiceFrom == username && inv.InvoiceId == invoiceid; });
        }

        if (invoice) {

            Engine.UnpackInvoiceForMe(invoice, username, invtype, function (err, unpacked) {

                displayInvoiceDetails(invoice, unpacked, invtype, function (err, res) {

                    callback(false, "ok");

                });

            });
        } else {

            $("#invtapspinner").hide();

        }

    }

    function payInvoice(friend, amount, invoiceNumber) {


        var pin = $('#sendstdpin').val();

        Engine.getDeviceKey(pin, function (err, ekey) {

            if (!err) {

                $("#btnStdSndDone").hide();

                $('#sendprogress').show();
                $('#pinconfirm').hide();
                $('#invoices').hide();

                $('#textMessageSendStd').text('Creating transaction...');
                $('#textMessageSendStd').show();
                $('#sendstdprogstatus').width('3%');
                $('#sendstdprog').show();
                $('#sendstdprogstatus').width('10%');

                $('#sendstdprognum').text('10%');

                setTimeout(function () {

                    Engine.sendTransaction('invoice', friend, '', amount, ekey.DeviceKey, function (err, transactionid) {

                        if (!err) {

                            Engine.updateInvoice(friend, invoiceNumber, transactionid, 1, function (err, result) {

                                if (!err) {

                                    $('#textMessageSendStd').text('You paid invoice: ' + friend.toUpperCase() + invoiceNumber);

                                    updateStdAmount();

                                    setTimeout(function () {
                                        $("#btnStdSndDone").show();
                                    }, 100);

                                    $("#sendstdpin").val('');
                                    $('.numdone').attr("style", "background-color:white");
                                    pintaps = 0;
                                    prevpin = '';

                                    updateBalance();


                                    //change status
                                    var statusbox = '<i class=\"fa fa-check text-success text-active\"></i> <span class="label bg-success">Paid</span>';
                                    $("#invdisstatus").html(statusbox);


                                    //hide buttons
                                    //$("#payinvoicecancel").hide();
                                    $("#btnpayinvoice").hide();
                                    $("#btnrejectinvoice").hide();


                                }

                            });


                        } else {

                            $('#sendstdprogstatus').width('0%');
                            $('#sendstdprognum').text('0%');

                            if (transactionid == "ErrInsufficientFunds") {
                                $('#textMessageSendStd').text('Transaction Failed: Waiting for funds to clear');
                            }

                            //return to send screen
                            setTimeout(function () {
                                $("#btnStdSndDone").show();
                            }, 100);

                        }

                    }, function (message, progress) {

                        if (message) {
                            $('#textMessageSendStd').text(message);
                        }

                        if (progress) {
                            $('#sendstdprogstatus').width(progress);
                            $('#sendstdprognum').text(progress);
                        }

                    });
                }, 50);

            } else {

                //display pin error
                $('.numdone').attr("style", "background-color:white");
                $("#sendstdpin").val('');
                pintaps = 0;
                prevpin = '';

                $('#confpinalert').show();
                $('#confpinalertmess').text(ekey);

            }

        });

    }


    //INVOICE FUNCTIONS END------------------------------------------

    function initialiseDashboard(callback) {

        $("#dashsend").addClass("invis");
        $("#dashsend").removeClass("slideUp");


        $("#dashreceive").addClass("invis");
        $("#dashreceive").removeClass("slideUp");

        $("#dashcontact").addClass("invis");
        $("#dashcontact").removeClass("slideUp");

        //$("#dashreceive").hide();
        //$("#dashcontact").hide();


        $('#invoices').hide();
        $('#network').hide();
        $('#networklist').hide();
        $("#networklistheader").hide();
        $('#settings').hide();
        $("#settingsheader").hide();

        var length = Engine.m_nickname.length;
        if (length > 20) {
            length = 20;
        }

        COINUNIT = Engine.m_settings.CoinUnit;

        $("#mynickname").text(Engine.m_nickname);
        $("#usernameProfile").text(Engine.m_nickname);
        $("#mystatus").text(Engine.m_statusText);


        var imageSrc = "images/avatar/128px/Avatar-" + pad(length) + ".png";
        var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";

        if (Engine.m_profileImage != '') {
            imageSrc = "https://ninkip2p.imgix.net/" + Engine.m_profileImage + "?crop=faces&fit=crop&h=128&w=128&mask=ellipse&border=1,d0d0d0";
            imageSrcSmall = "https://ninkip2p.imgix.net/" + Engine.m_profileImage + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
        }


        $("#imgProfile").attr("src", imageSrc);
        $("#imgtoprightprofile").attr("src", imageSrcSmall);

        $("#codeForFriend").text(Engine.m_fingerprint);


        Engine.getUserNetwork(function (err, friends) {

            FRIENDSLIST = {};

            for (var i = 0; i < friends.length; i++) {
                FRIENDSLIST[friends[i].userName] = friends[i];
            }

            //prep the network tab
            $("#networklist").show();
            //$("#networklistheader").show();

            showTransactionFeed(function (err, res) {


                updateBalance(function (err, hasChanged) {

                    updatePrice(function () {

                        if (callback) {

                            callback();

                        }

                    });

                });


                updateUI();

                var data = Engine.m_fingerprint + ',' + Engine.m_nickname;
                var options = { text: data, width: 172, height: 172 };

                $('#fingerprintqr').text('');
                $('#fingerprintqr').qrcode(options);
                $('#qrcontscan').text('');
                $('#qrcontscan').qrcode(options);



                setInterval(function () {

                    updateUI();

                }, 10000);


            });

        });


    }

    function loadInvoices(callback) {

        //load the invoices into the cache
        //cachedInvoices = [];

        var tmpCachedInvoices = [];

        Engine.getInvoiceList(function (err, invoices) {

            for (var i = 0; i < invoices.length; i++) {
                var d1 = new Date(invoices[i].InvoiceDate);
                invoices[i].JsDate = d1;
            }

            invoices = _.sortBy(invoices, function (inv) { return -inv.JsDate; });
            for (var i = 0; i < invoices.length; i++) {

                tmpCachedInvoices.push(invoices[i]);

            }

            cachedInvoices = tmpCachedInvoices;

            var tmpCachedInvoicesByUser = [];


            Engine.getInvoiceByUserList(function (err, invoices) {

                for (var i = 0; i < invoices.length; i++) {
                    var d1 = new Date(invoices[i].InvoiceDate);
                    invoices[i].JsDate = d1;
                }

                invoices = _.sortBy(invoices, function (inv) { return -inv.JsDate; });

                for (var i = 0; i < invoices.length; i++) {
                    tmpCachedInvoicesByUser.push(invoices[i]);
                }

                cachedInvoicesByUser = tmpCachedInvoicesByUser;

                if (callback) {
                    return callback(false, "ok");
                }

            });

        });

    }

    function initialiseUI() {


        //updateFriends(function (err, res) {



        //});

    }


    //OPEN/CREATE WALLET FUNCTIONS END---------------------------------------------

    function pad(n) {
        return (n < 10) ? ("0" + n) : n;
    }

    function logout() {
        location.reload();
    }

    UI.updateUITimer = function () {
        updateUI();
    };


    var prevBlock = 0;

    function updateUI(callback) {

        //All background UI activity controlled from here
        //The focus is on minimizing any activity


        //get version
        //checks all infra
        //if error we have a problem

        var newBlock = false;

        Engine.getVersion(function (err, res) {

            if (!err) {

                var stats = JSON.parse(res);

                if (prevBlock != stats.BlockNumber) {
                    newBlock = true;
                }

                prevBlock = stats.BlockNumber;



                if (stdAmountConvCoin) {
                    $('#stdselunit').text(COINUNIT);
                } else {
                    $('#stdselunit').text(Engine.m_settings.LocalCurrency);
                }



                $('#stdsendcunit').text(COINUNIT);

                $('#stdsendlcurr').text(Engine.m_settings.LocalCurrency);


                //Always

                updateBalance(function (err, hasChanged) {


                    //do we need to update transactions
                    //1. is our balance different from the last request?
                    //if it is immediately update transactions

                    //2. do we have a new block?
                    //if so then call updatetransactions

                    //if (hasChanged || newBlock) {

                    //update transactions?

                    showTransactionFeed(function (err, result) {

                        loadInvoices(function (err, result) {

                            updateSelectedFriend();

                        });



                    });


                    updateFriendRequests(function (err, res) {



                    });


                    updateFriends(function (err, res) {



                    });



                    //update selected friend transactions also
                    //}

                });


                updatePrice();



            }

        });




    }

    function updatePrice(callback) {

        //Always
        Ninki.API.getPrice(Engine.m_guid, Engine.m_settings.LocalCurrency, function (err, result) {


            result = _.escape(result);
            price = result * 1.0;

            var loc = "en-US";
            var cprc = "";
            if (Engine.m_settings.LocalCurrency == "JPY" || Engine.m_settings.LocalCurrency == "CNY") {
                cprc = accounting.formatMoney(result, "&yen;", 0);
            } else if (Engine.m_settings.LocalCurrency == "GBP") {
                cprc = accounting.formatMoney(result, "&pound;", 2);
            } else if (Engine.m_settings.LocalCurrency == "EUR") {
                cprc = accounting.formatMoney(result, "&euro;", 2);
            } else if (Engine.m_settings.LocalCurrency == "USD") {
                cprc = accounting.formatMoney(result, "&dollar;", 2);
            } else if (Engine.m_settings.LocalCurrency == "CNY") {
                cprc = accounting.formatMoney(result, "&yen;", 2);
            }

            $('#homeprice').html(cprc);

            if (callback) {
                callback();
            }

            // + ' / BTC'

        });


    }

    function convertFromSatoshis(amount, toUnit) {

        if (toUnit == 'BTC') {
            amount = amount / 100000000;
        }

        if (toUnit == 'mBTC') {
            amount = amount / 100000;
        }

        if (toUnit == 'uBTC') {
            amount = amount / 100;
        }

        if (toUnit == 'Bits') {
            amount = amount / 100;
        }


        return amount;
    }

    function convertToSatoshis(amount, fromUnit) {

        if (fromUnit == 'BTC') {
            amount = amount * 100000000;
        }

        if (fromUnit == 'mBTC') {
            amount = amount * 100000;
        }

        if (fromUnit == 'uBTC') {
            amount = amount * 100;
        }

        if (fromUnit == 'Bits') {
            amount = amount * 100;
        }

        amount = Math.round(amount);
        return amount;
    }


    var previousBalance = 0;

    function updateBalance(callback) {

        Engine.getBalance(function (err, result) {

            if (!err) {

                //get in BTC units
                var balance = convertFromSatoshis(result.TotalBalance, COINUNIT);

                currentBalance = balance;

                var fbal = '';
                if (COINUNIT == "BTC") {
                    fbal = accounting.formatMoney(balance, "", 4);
                } else if (COINUNIT == "Bits") {
                    fbal = accounting.formatMoney(balance, "", 0);
                } else {
                    fbal = accounting.formatMoney(balance, "", 2);
                }

                $("#homebalance").text(fbal);
                $("#homecoinunit").text(COINUNIT);

                $("#calcbalance").text(fbal);
                $("#calccoinunit").text(COINUNIT);

                var template = '';
                if (result.UnconfirmedBalance > 0) {
                    template += '<i class="i i-hexagon2 i-xs-base text-warning-lt hover-rotate"></i><i class="i i-clock i-sm text-white"></i>';
                } else {
                    template += '<i class="i i-hexagon2 i-xs-base text-success-lt hover-rotate"></i><i class="i i-checkmark i-sm text-white"></i>';
                }

                var templatecalc = '';
                if (result.UnconfirmedBalance > 0) {
                    templatecalc += '<i class="i i-hexagon2 i-xs-base text-warning-lt hover-rotate" style="font-size:1.5em"></i><i class="i i-clock i-sm text-white"></i>';
                } else {
                    templatecalc += '<i class="i i-hexagon2 i-xs-base text-success-lt hover-rotate" style="font-size:1.5em"></i><i class="i i-checkmark i-sm text-white"></i>';
                }

                $("#hometimer").html(template);
                $("#calctimer").html(templatecalc);


                if (previousBalance != result.TotalBalance || result.UnconfirmedBalance > 0) {

                    previousBalance = result.TotalBalance;

                    if (callback) {
                        callback(err, true);
                    }

                } else {

                    if (result.UnconfirmedBalance == 0) {
                        if (callback) {
                            callback(err, false);
                        }
                    } else {
                        if (callback) {
                            callback(err, true);
                        }
                    }

                }

            } else {

                callback(true, "Error");

            }

        });



    }

    function updateNetwork() {

        // getNewFriends();
        //updateFriendRequests();
        getNewFriends();
    }


    var previousReqByMe = 0;
    function updateRequestsMadeByMe(callback) {


        Engine.getPendingUserRequests(function (err, friends) {


            if (friends.length != previousReqByMe) {
                previousReqByMe = friends.length;
                $("#requestssent").text('');
                for (var i = 0; i < friends.length; i++) {

                    var length = friends[i].userName.length;
                    if (length > 20) {
                        length = 20;
                    }

                    var template = '<li class="list-group-item">' +
                                '<a href="#" class="media list-group-item" id="friend' + i + '"><div class="media">' +
                                '<span class="pull-left thumb-sm"><img src="images/avatar/64px/Avatar-' + pad(length) + '.png" alt="" class="img-circle"></span>' +
                                '<div class="pull-right text-success m-t-sm">' +
                                '<i class="fa fa-circle"></i>' +
                                '</div>' +
                                '<div class="media-body">' +
                                '<div>' + friends[i].userName + '</div>' +
                                '<small class="text-muted">I love Ninki!</small>' +
                                '</div>' +
                                '</div></a>' +
                                '</li>';

                    $("#requestssent").append(template);
                }
            }

            if (friends.length > 0) {
                $("#requestsentpanel").show();
            } else {
                $("#requestsentpanel").hide();
            }

            if (callback) {

                callback();

            }

        });




    }


    var lastNoOfFriends = 0;
    var invoiceSelectedUser = '';
    var invoiceSelectedAmount = 0;
    var selectedFriend = null;

    function updateFriends(callback) {

        if (!noAlert == true) {


            Engine.getUserNetwork(function (err, friends) {


                if (!err) {

                    //$("#nfriends").text(friends.length);

                    if (friends.length > lastNoOfFriends) {

                        lastNoOfFriends = friends.length;

                        FRIENDSLIST = {};

                        for (var i = 0; i < friends.length; i++) {
                            FRIENDSLIST[friends[i].userName] = friends[i];
                        }

                        //if selected friend is not isend and isreceive
                        //then find in list and update

                        //                    if (selectedFriend != null) {

                        //                        if (!selectedFriend.ICanSend || !selectedFriend.ICanReceive) {
                        //                            selectedFriend = FRIENDSLIST[selectedFriend.userName];
                        //                            updateSelectedFriend();
                        //                        }

                        //                    }


                        $("#nfriends").text(friends.length);
                        $("#myfriends").text('');


                        var grouptemplate = '';

                        var friendsgroup = _.groupBy(friends, function (item) { return item.category; });

                        grouptemplate += '<div class="panel-group" id="accordion2">';

                        var k = 0;
                        var g = 1;
                        for (var key in friendsgroup) {

                            friends = friendsgroup[key];

                            grouptemplate += '<div class="panel panel-default">';
                            grouptemplate += '<div class="panel-heading" data-toggle="collapse" data-parent="#accordion2" href="#collapse' + g + '">';
                            grouptemplate += '<a class="accordion-toggle font-bold">';
                            grouptemplate += _.escape(key);
                            grouptemplate += '</a>';
                            grouptemplate += '</div>';
                            grouptemplate += '<div id="collapse' + g + '" class="panel-collapse in">';


                            for (var i = 0; i < friendsgroup[key].length; i++) {

                                var frnd = FRIENDSLIST[friends[i].userName];

                                var length = frnd.userName.length;
                                if (length > 20) {
                                    length = 20;
                                }


                                var imageSrc = "images/avatar/64px/Avatar-" + pad(length) + ".png";

                                if (frnd.profileImage != '') {
                                    imageSrc = "https://ninkip2p.imgix.net/" + _.escape(frnd.profileImage) + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
                                    imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(frnd.profileImage) + "?crop=faces&fit=crop&h=128&w=128&mask=ellipse&border=1,d0d0d0";
                                }


                                var template = '<a href="#" class="media list-group-item" id="friend' + k + '"><div class="media">' +
                                '<span class="pull-left thumb-sm"><img src="' + _.escape(imageSrc) + '" alt="" class="img-circle"></span><div id="seltarget' + _.escape(friends[i].userName) + '">';

                                if (frnd.validated) {
                                    template += '<div class="pull-right text-success m-t-sm">' +
                                '<i class="fa fa-check-square" style="font-size:1.5em"></i>' +
                                '</div>';
                                }

                                template += '</div><div class="media-body">' +
                                '<div>' + _.escape(friends[i].userName) + '</div>' +
                                '<small class="text-muted">' + _.escape(frnd.status) + '</small>' +
                                '</div>' +
                                '</div></a>';


                                grouptemplate += template;



                                k++;
                            }


                            grouptemplate += '</div>';
                            grouptemplate += '</div>';
                            g++;
                        }

                        grouptemplate += '</div>';

                        $("#myfriends").html(grouptemplate);



                        $('#myfriends #accordion2').on('touchstart.collapse.data-api', '[data-toggle=collapse]', function (e) {
                            var $this = $(this);

                            $this.click();

                            //href, target = $this.attr('data-target') || e.preventDefault() || (href = $this.attr('href')) //strip for ie7
                            //,
                            //option = $(target).data('collapse') ? 'show' : $this.data()
                            //$(target).collapse(option)
                        });



                        var k = 0;
                        var g = 1;
                        for (var key in friendsgroup) {

                            friends = friendsgroup[key];
                            for (var i = 0; i < friendsgroup[key].length; i++) {

                                friends = friendsgroup[key];


                                //var btnfriend = $("#myfriends #friend" + k).get();
                                //var hammertime = new Hammer(btnfriend[0]);

                                $("#myfriends #friend" + k).hammer(null).bind("tap", { userName: friends[i].userName }, function (ev) {


                                    if (!scrollingnetlist) {

                                        SELECTEDFRIEND = ev.data.userName;
                                        selectedFriend = FRIENDSLIST[ev.data.userName];
                                        prevNetworkTransCount = 0;

                                        networkpagestate = "friend";
                                        friendpagestate = "send";
                                        $("#networklistheader").hide();
                                        $("#friendheader").show();
                                        $("#pnlfriend").show();

                                        $('#netpayfeed').html('');
                                        $("#networkpayments").show();
                                        $("#networklist").hide();

                                        $("#pnlfriendinv").hide();

                                        //window.scrollTo(0, 0);

                                        updateSelectedFriend();

                                    }

                                });

                                //console.log("added click " + k + " for " + friends[i].userName);

                                k++;
                            }
                            g++;
                        }

                    }

                    if (callback) {
                        return callback(false, "done");
                    }

                } else {

                    if (callback) {
                        return callback(true, "done");
                    }

                }
            });
        }

    }

    function showSecret() {


    }

    function refreshSelectedFriend(callback) {

        if (SELECTEDFRIEND.length > 0) {

            Engine.getFriend(SELECTEDFRIEND, function (err, friend) {
                if (!norefresh) {
                    if (SELECTEDFRIEND == friend.userName) {
                        selectedFriend = friend;
                        FRIENDSLIST[SELECTEDFRIEND] = friend;

                        if (selectedFriend.ICanSend) {
                            $("#issend").show();
                            //$("#networksend").show();
                        } else {
                            $("#issend").hide();
                            //$("#networksend").hide();
                        }
                        if (selectedFriend.ICanReceive) {
                            $("#isreceive").show();
                        } else {
                            $("#isreceive").hide();
                        }

                        var imageSrc = "images/avatar/256px/Avatar-" + pad(SELECTEDFRIEND.length) + ".png";

                        if (selectedFriend.profileImage != '') {
                            imageSrc = "https://ninkip2p.imgix.net/" + selectedFriend.profileImage + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
                        }
                        if (selectedFriend.status != '') {
                            $("#friendSelectedStatus").text(selectedFriend.status);
                        }

                        $("#imgSelectedFriend").attr("src", imageSrc);




                        callback(err, friend);

                        //updateSelectedFriend(function (err, res) {
                        //    selFriendBkgUpdate = false;
                        //    callback(err, res);
                        //});
                    }
                }
            });

        }

    }

    function updateSelectedFriend(callback) {

        //can optimise futher
        norefresh = true;
        if (SELECTEDFRIEND.length > 0) {


            $('input#friendAmount').val('');


            var length = selectedFriend.userName.length;
            if (length > 20) {
                length = 20;
            }

            //$("#nselnetcat").val(selectedFriend.category);

            $('#friendempty').hide();

            //$('#textMessageSend').removeClass('alert alert-danger');



            $('#textMessageSend').hide();
            $('#sendfriendprog').hide();


            $("#friendSelectedName").text(selectedFriend.userName);
            $("#friendSelectedNameTo").text(selectedFriend.userName);
            $("#validateusername2").text(selectedFriend.userName);
            $("#validateusername3").text(selectedFriend.userName);
            $("#validateusername4").text(selectedFriend.userName);
            $("#validateusername5").text(selectedFriend.userName);
            $("#validatesuccess").hide();
            $("#validatefail").hide();


            var imageSrc = "images/avatar/256px/Avatar-" + pad(length) + ".png";

            if (selectedFriend.profileImage != '') {
                imageSrc = "https://ninkip2p.imgix.net/" + selectedFriend.profileImage + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
            }
            $("#friendSelectedStatus").text('');
            if (selectedFriend.status != '') {
                $("#friendSelectedStatus").text(selectedFriend.status);
            }

            $("#imgSelectedFriend").attr("src", imageSrc);


            if (selectedFriend.validated) {

                $("#tapvalidatefriend").hide();
                $("#tapsendfriend").show();

            } else {

                $("#tapvalidatefriend").show();
                $("#tapsendfriend").hide();
            }

            $('#tblnetinvbyme tbody').empty();
            $('#tblnetinvforme tbody').empty();




            lastInvoiceToPayNetCount = 0;
            lastInvoiceByMeNetCount = 0;

            showInvoiceListNetwork();
            showInvoiceByMeListNetwork();

            showTransactionNetwork();

            //$("#pnlfriend").show();
            //$("#friendheader").show();


        }

        norefresh = false;




        if (callback) {
            callback(false, "ok");
        }

    }

    var lastNoOfFriendsReq = 0;
    var selectedFriendRequest = '';

    function updateFriendRequests(callback) {

        //if there are any new friends
        //fade in the button

        //to do, move to handlebars templates
        Engine.getFriendRequests(function (err, ofriends) {


            //if origin of friend request is qrcode
            //and no phrase cache
            //delay for 60 seconds
            //add accept with scan button
            //then return to standard after 5 minutes

            var friends = [];
            for (var i = 0; i < ofriends.length; i++) {

                if (contactPhraseCache[ofriends[i].userName]) {
                    //acceptAndValidateFriend(ofriends[i].userName);
                } else {
                    friends.push(ofriends[i]);
                }

            }


            if (friends.length > 0) {
                $("#dashrequests").show();

            } else {
                $("#dashrequests").hide();
            }

            //$("#notifications").text(friends.length);
            //$("#notificationsright").text(friends.length);
            //$("#nfriendreq").text(friends.length);


            if (lastNoOfFriendsReq != friends.length || friends.length == 0) {

                lastNoOfFriendsReq = friends.length;

                if (friends.length > 0) {
                    $("#notifications").attr("class", "badge bg-danger pull-right");
                } else {
                    $("#notifications").attr("class", "badge pull-right");
                }
                $("#nfriendreq").text(friends.length);
                $("#friendreq").text('');
                for (var i = 0; i < friends.length; i++) {

                    var length = friends[i].userName.length;
                    if (length > 20) {
                        length = 20;
                    }

                    var template = '<li id="tapfriendreq' + i + '" class="media list-group-item"><a href="#" class="thumb-sm pull-right m-t-xs avatar">' +
                                '<img src="images/avatar/64px/Avatar-' + pad(length) + '.png" alt="John said">' +
                                '</a>' +
                                '<div class="clear">' +
                                '<a href="#" class="text-info">' + _.escape(friends[i].userName) + '<i class="icon-twitter"></i></a>' +
                                '</div></li>';

                    $("#friendreq").append(template);

                }

                for (var i = 0; i < friends.length; i++) {

                    $("#friendreq #tapfriendreq" + i).hammer(null).bind("tap", { userName: friends[i].userName }, function (ev) {

                        selectedFriendRequest = ev.data.userName;

                        $("#friendrequestusername").text(selectedFriendRequest);


                        $("#mainWallet").hide();
                        $("#networklistheader").hide();
                        $(".footer").hide();
                        $("#contactrequest").show();


                    });

                }

            }
            if (callback) {
                callback(false, "done");
            }
        });

    }

    $('#btnContactRequestClose').bind('touchstart', function () {

        $("#contactrequest").hide();
        $("#mainWallet").show();
        $("#networklistheader").show();
        $(".footer").show();
        $("#friendrequestp1").show();
        $("#friendrequestp2").hide();

    });


    $('#btnAcceptContactDone').bind('touchstart', function () {

        $("#contactrequest").hide();
        $("#mainWallet").show();
        $("#networklistheader").show();
        $(".footer").show();
        $("#friendrequestp1").show();
        $("#friendrequestp2").hide();

    });


    $('#btnContactReject').bind('touchstart', function () {

        rejectFriend(event.data.userName, function (err, res) {

            if (!err) {

                selectedFriendRequest = '';
                updateFriendRequests();

                $("#friendrequestusername").text('');
                $("#contactrequest").hide();
                $("#mainWallet").show();
                $("#networklistheader").show();
                $(".footer").show();
            }

        });

    });



    var prevtransfeed = -1;
    var transactionCache = [];

    function showTransactionFeed(callback) {

        Engine.getTransactionRecords(function (err, transactions) {


            allTransactions = transactions;
            transactionCache = transactions;

            if (transactions.length != prevtransfeed) {


                for (var i = 0; i < allTransactions.length; i++) {
                    var d1 = new Date(allTransactions[i].TransDateTime);
                    allTransactions[i].JsDate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1);
                    transactionIndex[allTransactions[i].TransactionId] = i;
                }



                prevtransfeed = transactions.length;

                $('#transfeed').empty();

                var template = '';

                for (var i = 0; i < transactions.length && i < 51; i++) {

                    var length = transactions[i].UserName.length;
                    if (length > 20) {
                        length = 20;
                    }

                    var imageSrcSmall = "images/avatar/32px/Avatar-" + pad(length) + ".png";

                    if (transactions[i].UserName != 'External') {
                        if (FRIENDSLIST[transactions[i].UserName]) {
                            if (FRIENDSLIST[transactions[i].UserName].profileImage != '') {
                                imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(FRIENDSLIST[transactions[i].UserName].profileImage) + "?crop=faces&fit=crop&h=128&w=128&mask=ellipse&border=1,d0d0d0";
                            }
                        }
                    }

                    var amountLabel = "";
                    var friendLabel = "";

                    if (transactions[i].TransType == 'S') {
                        amountLabel = "sent " + convertFromSatoshis(transactions[i].Amount, COINUNIT) + " " + _.escape(COINUNIT);
                        friendLabel = "to " + _.escape(transactions[i].UserName);
                    }

                    if (transactions[i].TransType == 'R') {
                        amountLabel = "received " + convertFromSatoshis(transactions[i].Amount, COINUNIT) + " " + _.escape(COINUNIT);
                        friendLabel = "from " + _.escape(transactions[i].UserName);
                    }


                    var trdate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1);
                    var timeLabel = prettydate.format(trdate);

                    template += '<a href="#" class="list-group-item clearfix">';
                    template += '<span class="pull-left thumb-sm avatar m-r">';
                    template += '<img src="';
                    template += imageSrcSmall;
                    template += '" alt="...">';

                    template += '</span>';
                    template += '<span class="clear">';
                    template += '<span id="dtran' + i + '">'
                    template += amountLabel;
                    template += '</span>';

                    template += '<span class="pull-right">';
                    template += '<div class="trntime">';
                    template += timeLabel;
                    template += '</div>';
                    template += '</span>';

                    template += '<span class="clear">';
                    template += '<span><div class="conf">';
                    if (transactions[i].Confirmations < 6) {
                        template += '<span class="badge bg-warning pull-right">';
                        template += transactions[i].Confirmations;
                        template += '</span>';
                    }
                    template += '</div>';
                    template += '<small class="text-muted clear text-ellipsis">';
                    template += friendLabel;
                    template += '</small>';
                    template += '</span>';
                    template += '</a>';

                }

                $('#transfeed').html(template);

                for (var i = 0; i < transactions.length && i < 51; i++) {


                    $('#dtran' + i).hammer(null).bind("tap", {
                        index: i
                    }, function (event) {

                        if (!scrolling) {

                            displayTransactionDetails(transactions[event.data.index], "dashboard");


                        }

                    });
                }


            } else {

                //optimise

                $('#transfeed .conf').each(function (index, elem) {

                    var tran = allTransactions[transactionIndex[transactions[index].TransactionId]];

                    var template = '';
                    if (tran.Confirmations < 6) {
                        template += '<span class="badge bg-warning pull-right">';
                        template += _.escape(tran.Confirmations);
                        template += '</span>';
                    }

                    $(elem).html(template);

                });

                $('#transfeed .trntime').each(function (index, elem) {

                    var tran = allTransactions[transactionIndex[transactions[index].TransactionId]];

                    var trdate = new Date(tran.TransDateTime.match(/\d+/)[0] * 1);

                    var timeLabel = prettydate.format(trdate);

                    $(elem).html(timeLabel);

                });

            }

            return callback(err, "ok");

        });

    }


    var prevNetworkTransCount = 0;

    function showTransactionNetwork(callback) {

        var transactions = _.filter(transactionCache, function (tran) { return tran.UserName == SELECTEDFRIEND; });

        if (prevNetworkTransCount < transactions.length) {

            prevNetworkTransCount = transactions.length;

            var template = '';

            for (var i = 0; i < transactions.length; i++) {

                var amountLabel = "";
                var friendLabel = "";

                if (transactions[i].TransType == 'S') {
                    amountLabel = "sent " + convertFromSatoshis(transactions[i].Amount, COINUNIT) + " " + _.escape(COINUNIT);
                    friendLabel = "to " + _.escape(transactions[i].UserName);
                }

                if (transactions[i].TransType == 'R') {
                    amountLabel = "received " + convertFromSatoshis(transactions[i].Amount, COINUNIT) + " " + _.escape(COINUNIT);
                    friendLabel = "from " + _.escape(transactions[i].UserName);
                }


                var trdate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1);
                var timeLabel = prettydate.format(trdate);

                template += '<a href="#" class="list-group-item clearfix">';
                template += '<span class="clear">';

                template += '<span id="ntran' + i + '">';
                template += amountLabel;
                template += '</span>';

                template += '<span class="pull-right">';
                template += '<div class="trntime">';
                template += timeLabel;
                template += '</div>';
                template += '</span>';

                template += '<span class="clear">';
                template += '<span><div class="conf">';
                if (transactions[i].Confirmations < 6) {
                    template += '<span class="badge bg-warning pull-right">';
                    template += transactions[i].Confirmations;
                    template += '</span>';
                }
                template += '</div>';
                template += '<small class="text-muted clear text-ellipsis">';
                template += friendLabel;
                template += '</small>';
                template += '</span>';
                template += '</a>';

            }

            $('#netpayfeed').html(template);


            for (var i = 0; i < transactions.length && i < 51; i++) {


                $('#ntran' + i).hammer(null).bind("tap", {
                    index: i
                }, function (event) {

                    if (!scrollingnettran) {

                        displayTransactionDetails(transactions[event.data.index], "network");

                    }

                });
            }

        } else {


            $('#netpayfeed .conf').each(function (index, elem) {

                var tran = allTransactions[transactionIndex[transactions[index].TransactionId]];

                var template = '';
                if (tran.Confirmations < 6) {
                    template += '<span class="badge bg-warning pull-right">';
                    template += _.escape(tran.Confirmations);
                    template += '</span>';
                }

                $(elem).html(template);

                console.log('updating 1');

            });

            $('#netpayfeed .trntime').each(function (index, elem) {

                var tran = allTransactions[transactionIndex[transactions[index].TransactionId]];

                var trdate = new Date(tran.TransDateTime.match(/\d+/)[0] * 1);

                var timeLabel = prettydate.format(trdate);

                $(elem).html(timeLabel);

                console.log('updating 2');

            });

        }

    }


    var transactionDetailMode = 'dashboard';

    function displayTransactionDetails(tran, mode) {

        transactionDetailMode = mode;

        var trdate = new Date(tran.TransDateTime.match(/\d+/)[0] * 1).toString("yyyy-MM-dd HH:mm tt");


        var tranhtml = '';



        tranhtml += '<div class=""><span class="font-bold">Date:</span>';
        tranhtml += '</div>';
        tranhtml += '<div class="allowcopy">';
        tranhtml += _.escape(trdate);
        tranhtml += '</div>';

        tranhtml += '<div class="m-t-sm">';
        tranhtml += '<div class="font-bold">Transaction Id:</div>';
        tranhtml += '</div>';

        tranhtml += '<div style="word-break: break-all;" class="allowcopy">';
        tranhtml += _.escape(tran.TransactionId);
        tranhtml += '</div>';


        tranhtml += '<div class="m-t-sm">';
        tranhtml += '<div class="font-bold">Address:</div>';
        tranhtml += '</div>';

        tranhtml += '<div class="allowcopy">';
        tranhtml += _.escape(tran.Address);
        tranhtml += '</div>';

        tranhtml += '<div class="m-t-sm"><span class="font-bold">Amount:</span>'
        tranhtml += '</div>';

        tranhtml += '<div class="allowcopy">';
        tranhtml += convertFromSatoshis(tran.Amount, COINUNIT) + ' ' + COINUNIT;
        tranhtml += '</div>';

        tranhtml += '<div class="m-t-sm">';
        tranhtml += '<span class="font-bold">Send/Receive:</span>'
        tranhtml += '</div>';

        tranhtml += '<div class="allowcopy">';
        tranhtml += _.escape(tran.TransType);
        tranhtml += '</div>';



        if (transactionDetailMode == 'dashboard') {
            $("#dashheader").hide();
        } else {
            $("#friendheader").hide();
        }

        $("#mainWallet").hide();
        $(".footer").hide();
        $("#transview").addClass("slideUp");
        $('#transdets').html(tranhtml);

    }


    function generateAddressClient() {


        $("#newaddrspinner").show();
        var target = document.getElementById('newaddrspinner');
        var spinner = new Spinner(spinneropts).spin(target);

        Engine.createAddress('m/0/0', 1, function (err, newAddress, path) {

            if (!err) {

                var options = { text: newAddress, width: 172, height: 172 };

                $('#requestaddressqr').show();
                $('#requestaddressqr').text('');
                $('#requestaddressqr').qrcode(options);

                $('#requestaddresstxt').text(newAddress);

                //$('#requestaddress').text(tempate);
                $("#newaddrspinner").hide();
                $('#requestaddress').show();

            } else {
                $('#requestaddressqr').hide();
                $('#requestaddress').show();
                $("#newaddrspinner").hide();
                $('#requestaddresstxt').text(newAddress);
            }
        });

    }


    function sendMoney(friend, index) {

        $('#textMessageSend').removeClass('alert alert-danger');

        if (friend == null) {
            return;
        }

        var pin = $('#sendstdpin').val();


        var amount = $('#hdamount').val();

        amount = convertToSatoshis(amount, COINUNIT);

        if (amount > 0) {


            Engine.getDeviceKey(pin, function (err, ekey) {

                if (!err) {


                    $('#sendprogress').show();
                    $('#pinconfirm').hide();

                    $('.numdone').attr("style", "background-color:white");
                    $("#sendstdpin").val('');
                    pintaps = 0;
                    prevpin = '';


                    $('#textMessageSendStd').text('Creating transaction...');
                    $('#textMessageSendStd').show();
                    $('#sendstdprogstatus').width('10%');
                    $('#sendstdprognum').text('10%');
                    $('#sendstdprog').show();




                    setTimeout(function () {

                        Engine.sendTransaction('friend', friend, "", amount, ekey.DeviceKey, function (err, transactionid) {

                            if (!err) {

                                $('#textMessageSendStd').text('You sent ' + convertFromSatoshis(amount, COINUNIT) + ' ' + COINUNIT + ' to ' + friend);


                                updateUI();

                                sendAmount = '';

                                updateStdAmount();

                                setTimeout(function () {
                                    $("#btnStdSndDone").show();
                                }, 100);

                                $("#sendstdpin").val('');
                                $('.numdone').attr("style", "background-color:white");
                                pintaps = 0;
                                prevpin = '';

                            } else {


                                $('#sendstdprogstatus').width('0%');
                                $('#sendstdprognum').text('0%');

                                if (transactionid == "ErrInsufficientFunds") {
                                    $('#textMessageSendStd').text('Transaction Failed: Waiting for funds to clear');
                                }

                                //return to send screen
                                setTimeout(function () {
                                    $("#btnStdSndDone").show();
                                }, 100);

                            }
                            // alert(transactionid);
                        }, function (message, progress) {

                            if (message) {
                                $('#textMessageSendStd').text(message);
                            }

                            if (progress) {
                                $('#sendstdprogstatus').width(progress);
                                $('#sendstdprognum').text(progress);
                            }

                        });
                    }, 50);

                } else {


                    $('.numdone').attr("style", "background-color:white");

                    $("#sendstdpin").val('');
                    pintaps = 0;
                    prevpin = '';


                    if (ekey.substring(0, 6) == "ErrPIN") {

                        var attempts = ekey.substring(7, 8);

                        //$("#pinconfmessage").text("Incorrect PIN " + attempts + "/3 attempts");

                        $("#pinconfcount").effect("shake");

                    } else {

                        bootbox.alert(ekey);

                    }

                }

            });

        } else {
            $('input#friendAmount').css("border-color", "#ffaaaa");
        }


    }





    function sendMoneyStd() {


        //get pin from user
        //get device key
        //pass the device key as the 2fa code

        var amount = $('#hdamount').val();
        amount = convertToSatoshis(amount, COINUNIT);

        var address = $('input#toAddress').val();

        //$('#textMessageSendStd').removeClass('alert alert-danger');
        //check for valid bitcoin address

        var allok = true;

        var pin = $('#sendstdpin').val();

        if (allok) {

            Engine.getDeviceKey(pin, function (err, ekey) {

                if (!err) {

                    $('#sendprogress').show();
                    $('#pinconfirm').hide();


                    $('#textMessageSendStd').text('Creating transaction...');
                    $('#textMessageSendStd').show();
                    $('#sendstdprogstatus').width('3%');
                    $('#sendstdprog').show();
                    $('#sendstdprogstatus').width('10%');

                    $('#sendstdprognum').text('10%');

                    setTimeout(function () {

                        Engine.sendTransaction('standard', '', address, amount, ekey.DeviceKey, function (err, transactionid) {

                            if (!err) {

                                $('#textMessageSendStd').html('You sent ' + _.escape(convertFromSatoshis(amount, COINUNIT)) + ' ' + _.escape(COINUNIT) + ' to <span style="word-wrap:break-word;">' + address + '</span>');

                                updateUI();

                                sendAmount = '';
                                updateStdAmount();

                                setTimeout(function () {
                                    $("#btnStdSndDone").show();
                                }, 100);

                                $("#sendstdpin").val('');
                                $('.numdone').attr("style", "background-color:white");

                                pintaps = 0;
                                prevpin = '';

                            } else {


                                $('#sendstdprogstatus').width('0%');
                                $('#sendstdprognum').text('0%');

                                if (transactionid == "ErrInsufficientFunds") {
                                    $('#textMessageSendStd').text('Transaction Failed: Waiting for funds to clear');
                                }

                                setTimeout(function () {
                                    $("#btnStdSndDone").show();
                                }, 100);

                                $("#sendstdpin").val('');
                                $('.numdone').attr("style", "background-color:white");

                                pintaps = 0;
                                prevpin = '';

                            }

                        }, function (message, progress) {

                            if (message) {
                                $('#textMessageSendStd').text(message);
                            }

                            if (progress) {
                                $('#sendstdprogstatus').width(progress);
                                $('#sendstdprognum').text(progress);
                            }

                        });

                    }, 50);


                } else {


                    $('.numdone').attr("style", "background-color:white");

                    $("#sendstdpin").val('');

                    pintaps = 0;
                    prevpin = '';


                    if (ekey.substring(0, 6) == "ErrPIN") {

                        var attempts = ekey.substring(7, 8);

                        //$("#pinconfmessage").text("Incorrect PIN " + attempts + "/3 attempts");

                        $("#pinconfcount").effect("shake");

                    } else {

                        bootbox.alert(ekey);

                    }
                }



            });
        }

    }


    function acceptAndValidateFriend(username, message, callback) {

        var needToAccept = false;
        if (FRIENDSLIST[username]) {

            if (!FRIENDSLIST[username].ICanSend) {
                needToAccept = true;
            }

        } else {
            needToAccept = true;
        }


        if (needToAccept) {

            acceptFriend(username, message, function (err, res) {

                if (!err) {

                    lastNoOfFriendsReq = 0;
                    updateFriendRequests();

                    if (contactPhraseCache[username]) {

                        message("ValidateContact");

                        var code = contactPhraseCache[username];

                        validateContact(username, code, function (err, result) {

                            lastNoOfFriends = 0;
                            updateFriends(function (err, result) {

                                return callback(err, result);

                            });

                        });

                    } else {

                        if (callback) {

                            return callback(false, "ok");

                        }

                    }

                }

            });

        } else {

            if (contactPhraseCache[username]) {

                message("ValidateContact");

                var code = contactPhraseCache[username];

                validateContact(username, code, function (err, result) {

                    return callback(err, result);

                });

            } else {

                if (callback) {

                    return callback(false, "ok");

                }

            }

        }
    }

    function registerCode(username, phrase) {

        var bip39 = new BIP39();
        var code = bip39.mnemonicToHex(phrase);
        contactPhraseCache[username] = code;

    }


    function validateContact(username, code, callback) {

        if (code.length == 40) {

            Engine.verifyFriendData(username, code, function (err, result) {

                callback(err, result);

            });

        } else {

            callback(true, "invalid code");

        }

    }



    var checkAndValidateTimer = null;


    function clearCheckAndValidateTimer() {
        console.log('clearing timer');
        clearInterval(checkAndValidateTimer);
    }


    function checkAndValidateFriendRequests() {

        console.log('checking...');

        $("#textAddContact").text('Verifying request...');

        $("#addcontactprognum").text("10%");
        $("#addcontactprogstatus").width("10%");

        Engine.getFriendRequests(function (err, ofriends) {

            console.log('found ' + ofriends.length);

            if (ofriends.length > 0) {
                $("#contaddprog").show();
                $("#contaddscan").hide();
            }

            var targetFriend = null;


            var friends = [];
            for (var i = 0; i < ofriends.length; i++) {

                if (ofriends[i].userName == currentContactExchange) {
                    targetFriend = ofriends[i];
                }
            }

            if (targetFriend) {

                if (contactPhraseCache[targetFriend.userName]) {

                    clearCheckAndValidateTimer();

                    $("#addcontactprognum").text("20%");
                    $("#addcontactprogstatus").width("20%");

                    acceptAndValidateFriend(targetFriend.userName,

                    function (message) {

                        var prog = "";
                        var mess = "";

                        if (message == "AcceptFriendRequest") {
                            mess = "Accepting request...";
                            prog = "50%";
                        }

                        if (message == "CreateFriend") {
                            mess = "Creating contact...";
                            prog = "60%";
                        }

                        if (message == "ValidateContact") {
                            mess = "Validating contact...";
                            prog = "80%";
                        }

                        $("#addcontactprognum").text(prog);
                        $("#addcontactprogstatus").width(prog);
                        $("#textAddContact").text(mess)


                    }

                    , function (err, result) {

                        if (!err) {

                            $("#addcontactprognum").text("100%");
                            $("#addcontactprogstatus").width("100%");

                            setTimeout(function () {

                                $("#addcontactmodal").hide();

                                $("#dashcontact").addClass("invis");
                                $("#dashcontact").removeClass("slideUp");

                                $("#contactrequest").hide();

                                $("#mainWallet").show();
                                $("#networklistheader").show();
                                $(".footer").show();
                                $("#friendrequestp1").show();
                                $("#friendrequestp2").hide();

                            }, 1000);



                        } else {

                            $("#textAddContact").text(result);
                        }

                    });

                }

            }


        });
    }


    $('#btnContactAccept').bind('touchstart', function () {

        $("#btnAcceptContactDone").hide();
        $("#friendrequestp1").hide();
        $("#friendrequestp2").show();
        $("#acceptcontactprognum").text('5%');
        $("#acceptcontactprog").width('5%');

        acceptAndValidateFriend(selectedFriendRequest, function (message) {

            var prog = "";
            var mess = "";

            if (message == "AcceptFriendRequest") {
                mess = "Accepting request...";
                prog = "20%";
            }

            if (message == "CreateFriend") {
                mess = "Creating contact...";
                prog = "70%";
            }

            if (message == "ValidateContact") {
                mess = "Validating contact...";
                prog = "90%";
            }

            $("#acceptcontactprognum").text(prog);
            $("#acceptcontactprog").width(prog);
            $("#acceptcontactprogmess").text(mess)


        }, function (err, result) {

            if (!err) {


                updateFriendRequests(function (err, result) {

                    $("#acceptcontactprognum").text('90%');
                    $("#acceptcontactprog").width('90%');

                    updateFriends(function (err, result) {

                        $("#friendrequestusername").text('');
                        $("#btnAcceptContactDone").show();
                        $("#acceptcontactprogmess").text("You accepted the contact request from " + selectedFriendRequest);
                        $("#acceptcontactprognum").text('100%');
                        $("#acceptcontactprog").width('100%');

                        selectedFriendRequest = '';

                    });


                });

            } else {

                $("#friendrequestp1").show();
                $("#friendrequestp2").hide();

            }

        });

    });


    var currentContactExchange = '';

    //function when connecting from main add contact screen
    $("#hdqrcontact").change(function () {

        console.log('event triggered');
        console.log($("#hdqrcontact").val());

        var res = $("#hdqrcontact").val();
        var sres = res.split(',');
        var phrase = sres[0];
        var username = sres[1];

        console.log(phrase);
        console.log(username);

        currentContactExchange = username;

        registerCode(username, phrase);

        $("#addcontactmodal").show();

        $("#dashcontact").addClass("invis");
        $("#dashcontact").removeClass("slideUp");


        //$("#imgaddcontactwaiting").show();

        //var target = document.getElementById('imgaddcontactwaiting');
        //var spinner = new Spinner(spinneropts).spin(target);



        //$("#qrcontactupd").show();

        $("#textAddContact").text('Verifying user...');


        $("#addcontactprog").show();

        $("#addcontactprognum").text("10%");
        $("#addcontactprogstatus").width("10%");


        Engine.doesUsernameExist(username, function (err, usernameExistsOnServer) {

            //also check if friend already

            if (usernameExistsOnServer) {


                console.log('username exists');

                $("#addcontactprognum").text("30%");
                $("#addcontactprogstatus").width("30%");

                $("#textAddContact").text('Verifying network...');

                //if no friendrequest- create one and wait
                //if it exists, then accept and validate
                //if alread accepted then just validate

                Engine.getFriendRequests(function (err, ofriends) {

                    console.log("logging friend request filter...");
                    console.log(ofriends);

                    var friends = _.filter(ofriends, function (frn) { return frn.userName == username; });

                    console.log(friends);

                    if (friends.length == 0) {

                        console.log('friend request does not exist');

                        //if network doesnt exist create friend

                        Engine.isNetworkExist(username, function (err, result) {

                            if (!err) {

                                if (!result) {


                                    console.log('network does not exist');

                                    $("#textAddContact").text('Deriving addresses...');

                                    $("#addcontactprognum").text("60%");
                                    $("#addcontactprogstatus").width("60%");

                                    console.log('creating friend...');

                                    Engine.createFriend(username, "#qrcontactmess", function (err, result) {


                                        console.log('create friend ' + result);

                                        if (err) {

                                            //$("#addcontactmodal").hide();
                                            //$("#imgaddcontactwaiting").hide();
                                            //$("#qrcontactalert").show();
                                            $("#textAddContact").text("Error adding contact");


                                        } else {


                                            //if there is a pending friend request
                                            //skip this bit

                                            console.log('added timer for check and validate');
                                            //here we go to - now you friend should scan this code
                                            checkAndValidateTimer = setInterval(function () {
                                                checkAndValidateFriendRequests();
                                            }
                                             , 2000);

                                            //listen for 2 minutes
                                            setTimeout(function () {
                                                clearCheckAndValidateTimer();

                                                //timed out so return the user to screen


                                                $("#addcontactmodal").hide();

                                                $("#dashcontact").addClass("invis");
                                                $("#dashcontact").removeClass("slideUp");

                                                $("#contactrequest").hide();

                                                $("#mainWallet").show();
                                                $("#networklistheader").show();
                                                $(".footer").show();
                                                $("#friendrequestp1").show();
                                                $("#friendrequestp2").hide();


                                            }, 60000);

                                            $("#addcontactprognum").text("100%");
                                            $("#addcontactprogstatus").width("100%");

                                            //$("#imgaddcontactwaiting").hide();
                                            //$("#addcontactmodal").hide();

                                            setTimeout(function () {

                                                $("#contaddprog").hide();
                                                $("#contaddscan").show();

                                                $("#scancontqrmess").text("Now ask " + username + " to scan the QR code below:");

                                            }, 1000);

                                            //$("#textAddContact").text("Now scan the QR code from " + username);
                                        }
                                    });
                                } else {

                                    acceptAndValidateFriend(username, function (message) {

                                        var prog = "";
                                        var mess = "";

                                        if (message == "AcceptFriendRequest") {
                                            mess = "Accepting request...";
                                            prog = "50%";
                                        }

                                        if (message == "CreateFriend") {
                                            mess = "Creating contact...";
                                            prog = "60%";
                                        }

                                        if (message == "ValidateContact") {
                                            mess = "Validating contact...";
                                            prog = "80%";
                                        }

                                        $("#addcontactprognum").text(prog);
                                        $("#addcontactprogstatus").width(prog);
                                        $("#textAddContact").text(mess)


                                    }, function (err, result) {


                                        if (!err) {

                                            setTimeout(function () {
                                                $("#addcontactmodal").hide();

                                                $("#dashcontact").addClass("invis");
                                                $("#dashcontact").removeClass("slideUp");

                                                $("#contactrequest").hide();

                                                $("#mainWallet").show();
                                                $("#networklistheader").show();
                                                $(".footer").show();
                                                $("#friendrequestp1").show();
                                                $("#friendrequestp2").hide();

                                            }, 1000);



                                        } else {

                                            $("#textAddContact").text(result);
                                            $("#btnAddContactDone").show();

                                        }


                                    });

                                }

                            }

                        });

                    } else if (friends.length == 1) {


                        //validate using the fingerprint
                        acceptAndValidateFriend(username, function (message) {

                            var prog = "";
                            var mess = "";

                            if (message == "AcceptFriendRequest") {
                                mess = "Accepting request...";
                                prog = "50%";
                            }

                            if (message == "CreateFriend") {
                                mess = "Creating contact...";
                                prog = "60%";
                            }

                            if (message == "ValidateContact") {
                                mess = "Validating contact...";
                                prog = "80%";
                            }

                            $("#addcontactprognum").text(prog);
                            $("#addcontactprogstatus").width(prog);
                            $("#textAddContact").text(mess)


                        }, function (err, result) {

                            if (!err) {

                                $("#addcontactprognum").text("100%");
                                $("#addcontactprogstatus").width("100%");

                                setTimeout(function () {

                                    $("#addcontactmodal").hide();

                                    $("#dashcontact").addClass("invis");
                                    $("#dashcontact").removeClass("slideUp");

                                    $("#contactrequest").hide();

                                    $("#mainWallet").show();
                                    $("#networklistheader").show();
                                    $(".footer").show();
                                    $("#friendrequestp1").show();
                                    $("#friendrequestp2").hide();

                                }, 1000);



                            } else {

                                $("#textAddContact").text(result);
                                $("#btnAddContactDone").show();

                            }


                        });


                    }
                });

            } else {



            }
        });

    });



    $("#hdvalcontact").change(function () {

        console.log('caught event...');

        var res = $("#hdvalcontact").val();
        var sres = res.split(',');
        var phrase = sres[0];
        var username = sres[1];

        $("#netvalidp2").show();
        $("#netvalidp1").hide();


        registerCode(username, phrase);

        acceptAndValidateFriend(username, function (message) {

            var prog = "";
            var mess = "";

            if (message == "AcceptFriendRequest") {
                mess = "Accepting request...";
                prog = "30%";
            }

            if (message == "CreateFriend") {
                mess = "Creating contact...";
                prog = "60%";
            }

            if (message == "ValidateContact") {
                mess = "Validating contact...";
                prog = "80%";
            }

            $("#netvalidprognum").text(prog);
            $("#netvalidprog").width(prog);
            $("#netvalidprogmess").text(mess)


        }, function (err, result) {

            if (!err) {

                selectedFriend.validated = true;
                FRIENDSLIST[selectedFriend.userName].validated = true;
                updateSelectedFriend();

                $("#netvalidprognum").text('100%');
                $("#netvalidprogmess").text('Contact validated');
                $("#netvalidprog").width('100%');

                setTimeout(function () {

                    //$("#validateform").hide();
                    //$("#validatesuccess").show();
                    $("#txtCode").val('');

                    $("#networkvalidate").hide();
                    $("#friendheader").show();
                    $("#mainWallet").show();
                    $(".footer").show();

                    $("#netvalidp2").hide();
                    $("#netvalidp1").show();
                    //update list also

                    //find friend in list and update the validated icon
                    $("#myfriends #seltarget" + selectedFriend.userName).html('<div class="pull-right text-success m-t-sm"><i class="fa fa-check-square" style="font-size:1.5em"></i></div>');

                }, 1000);

            } else {

                $("#netvalidprogmess").text(result);
                $("#btnNetValidDone").show();

            }

        });
    });


    //class="modal-open"
    //addcontactmodal

    function addFriend(username) {


        if (username.length == 0 || Engine.m_nickname == username) {
            $("#friend").css("border-color", "#ffaaaa");
            return;
        }



        //merge these functions

        Engine.doesUsernameExist(username, function (err, usernameExistsOnServer) {

            //also check if friend already

            if (usernameExistsOnServer) {


                $("#addcontactprognum").text("20%");
                $("#addcontactprogstatus").width("20%");
                $("#textAddContact").text('Verifying network...');



                Engine.isNetworkExist(username, function (err, result) {

                    if (!result) {

                        $("#addcontactmodal").show();

                        $("#dashcontact").addClass("invis");
                        $("#dashcontact").removeClass("slideUp");

                        //$("#imgaddcontactwaiting").show();
                        //var target = document.getElementById('imgaddcontactwaiting');
                        //var spinner = new Spinner(spinneropts).spin(target);


                        //verify input and if username exists
                        $("#addcontactalert").hide();


                        //$("#qrcontactupd").show();
                        $("#textAddContact").text('Verifying user...');

                        $("#addcontactprognum").text("20%");
                        $("#addcontactprogstatus").width("20%");

                        $("#friend").css("border-color", "#ccc");

                        $("#textAddContact").text('Deriving addresses...');

                        Engine.createFriend(username, "", function (err, result) {

                            if (err) {

                                $("#friend").css("border-color", "#ffaaaa");

                                $("#addcontactalert").show();
                                $("#addcontactalertmessage").text("Error adding contact");
                                $("#imgaddcontactwaiting").hide();

                            } else {


                                $("#addcontactprognum").text("100%");
                                $("#addcontactprogstatus").width("100%");
                                $("#friend").val('');
                                $("#textAddContact").text("You requested " + username + " as a contact");

                                setTimeout(function () {
                                    $("#addcontactmodal").hide();

                                    $("#dashcontact").addClass("invis");
                                    $("#dashcontact").removeClass("slideUp");

                                    $("#contactrequest").hide();

                                    $("#mainWallet").show();
                                    $("#networklistheader").show();
                                    $(".footer").show();
                                    $("#friendrequestp1").show();
                                    $("#friendrequestp2").hide();

                                }, 2000);

                                //updateRequestsMadeByMe();
                            }


                        });

                    } else {

                        $("#friend").css("border-color", "#ffaaaa");
                        $("#addcontactalert").show();
                        $("#addcontactalertmessage").text("You have already requested " + username + " as a contact");
                        //$("#imgaddcontactwaiting").hide();

                    }
                });

            } else {

                $("#friend").css("border-color", "#ffaaaa");
                $("#addcontactalert").show();
                $("#addcontactalertmessage").text("The username could not be found");
                //$("#imgaddcontactwaiting").hide();

            }
        });


    }

    function rejectFriend(username) {

        Engine.rejectFriendRequest(username, function (err, result) {

            updateFriendRequests();

        });
    }

    function acceptFriend(username, message, callback) {


        message("AcceptFriendRequest");

        Engine.acceptFriendRequest(username, function (err, result) {

            if (err) {

                return callback(err, result);

            } else {


                Engine.isNetworkExist(username, function (err, result) {

                    if (!err) {

                        if (!result) {

                            message("CreateFriend");

                            Engine.createFriend(username, message, function (err, result) {

                                if (err) {

                                } else {

                                    return callback(err, result);
                                }
                            });

                        } else {

                            return callback(err, result);

                        }

                    } else {

                        return callback(err, result);
                    }

                });
            }

        });


    }


}
module.exports = UI;