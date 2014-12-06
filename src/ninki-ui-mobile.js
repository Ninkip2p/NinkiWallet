var Bitcoin = require('bitcoinjs-lib');
var BIP39 = require('./bip39');
var prettydate = require("pretty-date");


function UI() {

    var Engine = new Ninki.Engine();


    //    var WALLETINFORMATION = {};
    //    var SHAREDID = '';

    //    var TWOFACTORONLOGIN = false;
    //    var NICKNAME = '';
    //    var guid = '';
    //    var oguid = '';
    //    var password = '';


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


    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE");



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

        var parsed = { url: url }

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

    function setCookie(cname, cvalue) {


        if (isChromeApp()) {

            var obj = {};
            obj[cname] = cvalue;
            chrome.storage.local.set(obj, function () {

                console.log("saved");

            });

        }
        else {

            localStorage[cname] = cvalue;

        }


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

    function deleteCookie(cname) {


        if (isChromeApp()) {

            chrome.storage.local.remove(cname, function () {

                console.log("deleted");

            });

        } else {

            localStorage.removeItem(cname);

        }
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


    function loginPIN() {


        var pin = $("#loginpinno").val();

        $("#enterpinalert").hide();

        if (pin.length == 4) {

            getCookie("guid", function (guid) {


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

                            if (ekeyv.SessionToken) {
                                $("#API-Token").val(ekeyv.SessionToken);
                            }


                            //check state and display correct headers



                            //set new session key
                            $("#paddel").hide();
                            $('.numdone').attr("style", "background-color:white");
                            $("#loginpin").hide();

                            $("#nonlogin").show();
                            $(".footer").show();
                            $("#loginpinno").val('');

                            //initialiseDashboard();
                            setTimeout(updateUI(), 200);

                        } else {


                            $("#pinspinner").show();
                            var target = document.getElementById('pinspinner');
                            var spinner = new Spinner(spinneropts).spin(target);

                            getCookie("ninki_p", function (result) {

                                var enc = JSON.parse(result);
                                result = '';
                                Engine.setStretchPass(Engine.decryptNp(enc.ct, ekeyv.DeviceKey, enc.iv));

                                getCookie("ninki_rem", function (res) {

                                    if (res.length > 0) {
                                        var enc = JSON.parse(res);
                                        var fatoken = Engine.decryptNp(enc.ct, ekeyv.DeviceKey, enc.iv);

                                        //get the two factor token

                                        //do we need to open wallet ?

                                        Engine.openWallet(guid, fatoken, function (err, result) {

                                            if (!err) {

                                                if (result.TwoFactorOnLogin) {

                                                    $("#pinspinner").hide();
                                                    $("#loginpinno").val('');
                                                    $("#enterpinalert").show();
                                                    $("#enterpinalertmessage").text('Token has expired');


                                                } else {

                                                    $("#pinspinner").hide();
                                                    $('.numdone').attr("style", "background-color:white");
                                                    $("#loginpin").hide();
                                                    $("#loginpinno").val('');
                                                    $("#paddel").hide();


                                                    getCookie("currency", function (res) {

                                                        if (res) {

                                                            Engine.m_settings.LocalCurrency = res;

                                                        } else {

                                                            setCookie("currency", Engine.m_settings.LocalCurrency);
                                                        }

                                                        var t = Engine.m_settings.LocalCurrency;
                                                        $('.sccy').filter(function () {
                                                            return $(this).text().trim() == t;
                                                        }).find("label").html('<i class="fa fa-check text-active"></i>');


                                                        getCookie("coinunit", function (res) {

                                                            if (res) {

                                                                Engine.m_settings.CoinUnit = res;

                                                            } else {

                                                                setCookie("coinunit", Engine.m_settings.CoinUnit);
                                                            }


                                                            var tc = Engine.m_settings.CoinUnit;
                                                            $('.scoinunit').filter(function () {
                                                                return $(this).text().trim() == tc;
                                                            }).find("label").html('<i class="fa fa-check text-active"></i>');

                                                        });


                                                    });

                                                    initialiseDashboard();
                                                    Engine.m_appInitialised = true;
                                                }

                                            } else {

                                                $("#pinspinner").hide();
                                                $('.numdone').attr("style", "background-color:white");

                                            }

                                        });

                                    }

                                });

                            });

                        }

                    } else {

                        $("#pinspinner").hide();

                        if (ekeyv == "ErrDeviceDestroyed") {

                            deleteCookie("ninki_reg");
                            deleteCookie("ninki_p");
                            deleteCookie("ninki_rem");
                            deleteCookie("guid");
                            $("#loginpin").hide();
                            $("#mainWallet").hide();
                            $("#pairDevice").show();

                            location.reload();
                        }

                        $("#loginpinno").val('');
                        $("#enterpinalert").show();
                        $("#enterpinalertmessage").text(ekeyv);

                        $('.numdone').attr("style", "background-color:white");

                    }

                });

            });

        } else {

            $("#pinspinner").hide();

        }

    }



    function closeSendNet() {

        //$("#dashprofile").show();
        $("#dashsend").hide();
        $("#dashsendamt").hide();
        $("#mainWallet").show();

        if (sendmode == "net") {
            $("#friendheader").show();
        }

        $(".footer").show();

        $("#dashreceive").hide();
        $("#dashcontact").hide();

        $("#pinconfirm").hide();

        $("#btnStdSndDone").hide();


        $('#toAddress').val('');
        $('#amount').text('');

        updateStdAmount();

    }


    function closeSendStd() {

        //$("#dashprofile").show();
        $("#dashsend").hide();
        $("#dashsendamt").hide();
        $("#dashheader").show();
        $("#mainWallet").show();
        $(".footer").show();

        $("#dashreceive").hide();
        $("#dashcontact").hide();

        $("#pinconfirm").hide();

        $("#addrfade").hide();

        $("#btnStdSndDone").hide();


        //profilepagestate = "send";
        //menustate = "profile"

        $('#toAddress').val('');
        $('#amount').text('');
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


        var cprc = ires.toLocaleString(loc, { style: "currency", currency: Engine.m_settings.LocalCurrency });

        return cprc;

    }


    function convertFromLocalCurrency(amount) {

        var conv = amount;
        conv = conv * 1.0;

        //convert to bitcoin
        if (price > 0) {
            var cbtc = conv / price;

            var sats = convertToSatoshis(cbtc, "BTC");
            var btc = convertFromSatoshis(sats, COINUNIT);

            return btc;
        } else {

            return 0;

        }


    }

    function updateStdAmount() {

        var asamt = $('#amount').text();
        if (asamt == '' || asamt == '.') {
            asamt = 0;
        }

        if (stdAmountConvCoin) {
            $('#ccystdamt').text(convertToLocalCurrency(asamt));
            $('#hdamount').val(asamt);
        }
        else {
            var amt = convertFromLocalCurrency(asamt);
            $('#hdamount').val(amt);
            $('#ccystdamt').text(amt + ' ' + COINUNIT);
        }

    }


    var profilepagestate = '';
    var networkpagestate = '';
    var friendpagestate = '';
    var menustate = '';

    var cl = '';

    jQuery(document).ready(function () {

        var $body = jQuery('body');


        //guid
        //ninki_reg

        //if device is paired then


        getCookie("ninki_reg", function (reg) {

            if (reg) {
                $("#loginpin").show();
            } else {
                $("#pairDevice").show();
            }

        });


        $("#mainWallet").hide();
        $("#dashreceive").hide();
        $("#dashcontact").hide();


        $("#addcontactmodal").hide();


        $('#stdselcu').click(function () {

            var amttarget = '#amount';

            $('#stdselunit').text(COINUNIT);
            stdAmountConvCoin = true;
            $(amttarget).text('');
            updateStdAmount();

        });

        $('#stdsellc').click(function () {


            var amttarget = '#amount';

            $('#stdselunit').text(Engine.m_settings.LocalCurrency);
            stdAmountConvCoin = false;
            $(amttarget).text('');
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

            setCookie("coinunit", sel);

            Engine.m_settings.CoinUnit = sel;

            COINUNIT = sel;

            updateUI();

        });





        $('.sccy').bind('click', function () {

            $('.sccy').find("label").html('');

            $(this).find("label").html('<i class="fa fa-check text-active"></i>');

            var sel = $.trim($(this).text());

            setCookie("currency", sel);

            Engine.m_settings.LocalCurrency = sel;

            updateUI();

        });



        $('.numc').bind('touchend', function () {

            var num = $(this);
            var text = $.trim(num.find('.txt').clone().children().remove().end().text());

            var amttarget = '#amount';

            var amt = $(amttarget).text();

            if (!(amt.indexOf(".") > -1 && text == '.')) {

                var prev = amt.substring(0, amt.length - 1);

                if (text.length > 0) {
                    $(amttarget).text($(amttarget).text() + text);
                } else {
                    $(amttarget).text(prev);
                }

                updateStdAmount();

            }


        });

        var pintaps = 0;
        var prevpin = '';
        //touchend
        $('#loginpin .num').bind('touchstart', function () {

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
            prevpin = lpin.substring(0, lpin.length - 1)

            if (text.length > 0) {

                $('#paddel').show();




                $(loginpinno).val(loginpinno.val() + text);

                if (pintaps == 4) {

                    pintaps = 0;


                    loginPIN();

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


        });


        $('#pinconfirm .num').bind('touchend', function () {

            var num = $(this);
            var text = $.trim(num.find('.txt').clone().children().remove().end().text());
            var loginpinno = $('#sendstdpin');
            var lpin = loginpinno.val();
            prevpin = lpin.substring(0, lpin.length - 1)

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

        //tapsendfriend
        //tapinvoicefriend


        //tapnetpayments

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
            $("#dashsend").hide();
            $("#dashreceive").hide();
            $("#dashcontact").hide();
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

            var paddr = parseBitcoinURL(addr);

            if (addr.length > 25) {
                if (Engine.isAddressValid(paddr.address)) {

                    //next stage

                    //if amount is included in the URL set the amount and go straight to the
                    //pay screen
                    $('#toAddress').val(paddr.address)

                    $("#dashsend").hide();
                    $("#addrfade").hide();
                    $("#dashsendamt").show();


                }
            }
        });


        $("#btnCloseContact").bind('touchstart', function () {

            //closeSendStd();
            $("#dashcontact").hide();
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
            } else {
                closeSendNet();
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


            if (sendmode == "std") {
                closeSendStd();
            } else {
                closeSendNet();
            }

        });

        //$("#btnStdSndDone")

        $("#btnsendmoneystd").bind('touchstart', function () {

            if (sendmode == 'std') {
                $("#sendstds2add").text($('#toAddress').val());
            } else if (sendmode == 'net') {
                $("#sendstds2add").text(SELECTEDFRIEND);
            }
            $("#sendstds2amt").text($("#hdamount").val() + ' ' + COINUNIT);

            $("#dashsend").hide();
            $("#dashsendamt").hide();
            $("#pinconfirm").show();

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
            $("#dashsend").hide();
            $("#addrfade").hide();

            $("#friendheader").hide();
            $("#dashsendamt").show();


            $("#mainWallet").hide();
            $(".footer").hide();


            networkpagestate = "friend";
            friendpagestate = "send";

        });

        $("#tapsend").bind('touchstart', function () {

            sendmode = "std"

            $("#dashheader").hide();
            $("#dashprofile").hide();
            $("#dashsend").show();


            setTimeout(function () {
                $("#addrfade").fadeIn(500);

            }, 500);


            $("#dashsendamt").hide();
            $("#mainWallet").hide();
            $(".footer").hide();

            $("#dashreceive").hide();
            $("#dashcontact").hide();
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
            $("#dashsend").hide();
            $("#mainWallet").hide();
            $("#dashreceive").show();
            $(".footer").hide();
            $("#dashcontact").hide();
            profilepagestate = "receive";
            menustate = "profile"

        });

        $("#taprequest").bind('touchstart', function () {
            //$("#dashprofile").hide();
            //$("#dashsend").hide();
            //$("#dashreceive").hide();
            $("#mainWallet").hide();
            $("#networklistheader").hide();
            $("#dashcontact").show();
            $(".footer").hide();

            //checkAndValidateTimer = setInterval(function () { checkAndValidateFriendRequests() }, 2000);

            //profilepagestate = "contact";
            //menustate = "profile"

        });


        $('#imgProfileContainer').show();
        $("#dropzone").hide();
        $("#btnSaveProfile").hide();
        $("#btnCancelProfile").hide();
        $("#statusedit").hide();
        $("#imgreset").hide();


        $("#btnEditProfile").bind('touchstart', function () {

            key = '';

            $('#imgProfileContainer').hide();
            $("#dropzone").show();
            $("#btnSaveProfile").show();
            $("#btnCancelProfile").show();
            $("#btnEditProfile").hide();
            $("#statusedit").show();
            $("#profnmests").hide();
            $("#imgreset").show();
            $("#txtStatusText").val(Engine.m_statusText);

        });

        $("#imgreset").bind('touchstart', function () {

            Engine.m_profileImage = "";
            imgReset = true;

            var imageSrc = "images/avatar/256px/Avatar-" + pad(Engine.m_nickname.length) + ".png";

            document.getElementById('imgProfile').src = imageSrc;
            $('#imgProfileContainer').show();
            $('#dropzone').hide();
            $('progressNumber').text('');
            $("#imgreset").hide();

        });

        var imgReset = false;
        $("#btnSaveProfile").bind('touchstart', function () {

            //updateUserProfile

            var statusText = $("#txtStatusText").val();

            if (key == '' && !imgReset) {
                key = Engine.m_profileImage;
            }

            Engine.updateUserProfile(key, statusText, Engine.m_invoiceTax, function (err, result) {

                if (!err) {

                    var imageSrc = "images/avatar/256px/Avatar-" + pad(Engine.m_nickname.length) + ".png";
                    var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(Engine.m_nickname.length) + ".png";

                    if (key != '' && !imgReset) {
                        imageSrc = "https://ninkip2p.imgix.net/" + key + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
                        imageSrcSmall = "https://ninkip2p.imgix.net/" + key + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
                    }

                    $("#imgProfile").attr("src", imageSrc);
                    $("#imgtoprightprofile").attr("src", imageSrcSmall);

                    $('#imgProfileContainer').show();
                    $("#dropzone").hide();
                    $("#btnSaveProfile").hide();
                    $("#btnCancelProfile").hide();
                    $("#btnEditProfile").show();
                    $("#statusedit").hide();
                    $("#mystatus").text(statusText);
                    $("#txtStatusText").val(statusText);
                    $("#profnmests").show();
                    $("#imgreset").hide();
                    imgReset = false;
                    $("#profileimgfile").val('');
                    $("#progressNumber").val('');

                }

            });

        });

        $("#btnCancelProfile").bind('touchstart', function () {

            $('#imgProfileContainer').show();
            $("#dropzone").hide();
            $("#btnSaveProfile").hide();
            $("#btnCancelProfile").hide();
            $("#btnEditProfile").show();

            //reset profile image

            var imageSrc = "images/avatar/256px/Avatar-" + pad(Engine.m_nickname.length) + ".png";

            if (Engine.m_profileImage != '') {
                imageSrc = "https://ninkip2p.imgix.net/" + Engine.m_profileImage + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
            }

            $("#imgProfile").attr("src", imageSrc);

            $("#statusedit").hide();
            $("#profnmests").show();
            $("#imgreset").hide();
        });

        var obj = $("#dropzone");

        obj.click(function () {
            $("#profileimgfile").click();
        });

        $("#profileimgfile").change(function (e) {

            var control = document.getElementById("profileimgfile");
            var files = control.files;
            //alert(files[0]);
            //We need to send dropped files to Server
            handleFileUpload(files, obj);

        });

        obj.on('dragenter', function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).css('border', '2px solid #0B85A1');
        });

        obj.on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
        });

        obj.on('drop', function (e) {

            $(this).addClass("b-dashed");
            $(this).addClass("b-light");
            e.preventDefault();
            var files = e.originalEvent.dataTransfer.files;
            //alert(files[0]);
            //We need to send dropped files to Server
            handleFileUpload(files, obj);
        });


        $(document).on('dragenter', function (e) {
            e.stopPropagation();
            e.preventDefault();
        });

        $(document).on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
            obj.css('border', '2px dotted #0B85A1');
        });

        $(document).on('drop', function (e) {
            e.stopPropagation();
            e.preventDefault();
        });

        var key = '';
        function handleFileUpload(files, obj) {

            if (files.length > 0) {
                var file = files[0];
                var fd = new FormData();

                key = "images\/" + Engine.m_nickname + '_' + (new Date).getTime()

                Ninki.API.post("/api/1/u/createS3Policy", { test: 'test' }, function (err, result) {

                    var policy = JSON.parse(result);

                    fd.append('key', key);
                    fd.append('acl', 'public-read');
                    fd.append('Content-Type', file.type);
                    fd.append('bucket', 'ninkip2pimgstore');
                    fd.append('AWSAccessKeyId', 'AKIAINOU56ATQFS3CLFQ');
                    fd.append('policy', policy.s3Policy);
                    fd.append('signature', policy.s3Signature);
                    fd.append("file", file);
                    //fd.append("success_action_redirect", "https://localhost:1111/ok");


                    var xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener("progress", uploadProgress, false);
                    xhr.addEventListener("load", uploadComplete, false);
                    xhr.addEventListener("error", uploadFailed, false);
                    xhr.addEventListener("abort", uploadCanceled, false);

                    xhr.open('POST', 'https://ninkip2pimgstore.s3-us-west-1.amazonaws.com/', true); //MUST BE LAST LINE BEFORE YOU SEND 

                    xhr.send(fd);

                });
            }

        }



        function uploadProgress(evt) {
            if (evt.lengthComputable) {
                var percentComplete = Math.round(evt.loaded * 100 / evt.total);
                document.getElementById('progressNumber').innerHTML = percentComplete.toString() + '%';
            }
            else {
                document.getElementById('progressNumber').innerHTML = 'unable to compute';
            }
        }

        function uploadComplete(evt) {
            /* This event is raised when the server send back a response */
            //alert("Done - " + evt.target.responseText);
            document.getElementById('imgProfile').src = 'https://ninkip2p.imgix.net/' + key + "?fit=crop&crop=faces&h=128&w=128&mask=ellipse&border=1,d0d0d0";
            $('#imgProfileContainer').show();
            $('#dropzone').hide();
            $('progressNumber').text('');
            $("#imgreset").hide();

        }

        function uploadFailed(evt) {
            alert("There was an error attempting to upload the file." + evt);
        }

        function uploadCanceled(evt) {
            alert("The upload has been canceled by the user or the browser dropped the connection.");
        }

    });



    $(document).ready(function () {


        $("#pairdeviceblob").change(function () {

            $("#loginpin").hide();
            $("#pairstep1").hide();
            $("#pairstep2").show();


        });


        $("#btnUnpair").click(function () {

            //return;
            getCookie("guid", function (guid) {

                Engine.m_oguid = guid;

                var bytes = [];
                for (var i = 0; i < guid.length; ++i) {
                    bytes.push(guid.charCodeAt(i));
                }

                Engine.m_guid = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();


                Engine.destroyDevice(function (err, res) {

                    deleteCookie("ninki_rem");
                    deleteCookie("ninki_p");
                    deleteCookie("ninki_reg");
                    deleteCookie("ninki_h");

                    //call to server
                    location.reload();

                });

            });


        });


        $("#btnPairDevice").bind('click', function () {

            var deviceid = "DEVICE123456789";

            if (window.cordova) {
                deviceid = window.device.uuid;
            }

            var blob = $('#pairdeviceblob').val();
            var pin = $('#pairdevicepinnumber').val();
            var pwd = $('#pairpwd').val();



            var splitBlob = blob.split('|');

            var enck = splitBlob[0];
            var iv = splitBlob[1];
            var guid = splitBlob[2];
            var deviceName = splitBlob[3];
            var regToken = splitBlob[4];


            Engine.setPass(pwd, guid);

            pwd = Engine.m_password;

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

                    $('#pairdevicealertmessage').text(response);

                } else {

                    //decrypt packet

                    var jpacket = JSON.parse(response);

                    var secret = Engine.decryptNp(jpacket.packet, pwd, jpacket.IV);

                    Engine.validateSecret(secret, function (err, secvalid) {

                        if (!err) {


                            //hash the pin and device id

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


                            Engine.registerDevice(hashguid, deviceName, devplatform, devmodel, pinhash, regToken, secret, function (err, result) {

                                if (!err) {

                                    var dk = JSON.parse(result);

                                    if (dk.DeviceKey.length > 0) {

                                        var decblob = Engine.decryptNp(enck, dk.DeviceKey, iv);

                                        //slice it up
                                        //64 64 64
                                        var hk = decblob.substring(0, 64);
                                        var fatoken = decblob.substring(64, 128);

                                        var encp = Engine.encryptNp(pwd, dk.DeviceKey);
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

                                        setCookie("guid", guid);

                                        Engine.openWallet(guid, fatoken, function (err, result) {

                                            if (!err) {

                                                if (!result.TwoFactorOnLogin) {

                                                    setCookie("ninki_rem", ctoken);
                                                    setCookie("ninki_p", ptoken);
                                                    setCookie("ninki_reg", regToken);
                                                    setCookie("ninki_h", hkey);

                                                    $('#pairDevice').hide();

                                                    initialiseDashboard();

                                                } else {


                                                    $('#pairdevicealertmessage').text("could not pair");
                                                    $('#pairdevicealert').show();
                                                }


                                            } else {

                                                $('#pairdevicealertmessage').text(result);
                                                $('#pairdevicealert').show();
                                            }

                                        });
                                    } else {

                                        $('#pairdevicealertmessage').text("The pairing token has expired");
                                        $('#pairdevicealert').show();
                                    }


                                } else {

                                    $('#pairdevicealertmessage').text(result);
                                    $('#pairdevicealert').show();

                                }

                            });

                        } else {

                            $('#pairdevicealertmessage').text(secvalid);
                            $('#pairdevicealert').show();

                        }

                    });

                }

            });


        });


        $("#btnaddfriend").bind('touchstart', function () {

            addFriend($('input#friend').val());

        });

        $("#btngenaddr").bind('touchstart', function () {

            generateAddressClient();

        });


        //wallet security wizard

        //$("#balance").text("... BTC");

        $("#btnSendToFriend").bind('touchstart', function () {


            sendMoney(SELECTEDFRIEND, 0);


        });

        $("#sendfriendprog").hide();


        $("#hdvalcontact").change(function () {

            console.log('caught event...');

            var res = $("#hdvalcontact").val();
            var sres = res.split(',');
            var phrase = sres[0];
            var username = sres[1];


            $("#netvalidprognum").text('30%');
            $("#netvalidprogmess").text('Validating contact...');
            $("#netvalidprog").width('30%');

            setTimeout(function () {
                var bip39 = new BIP39();
                code = bip39.mnemonicToHex(phrase);

                console.log(code);


                if (code.length != 40) {

                    return;
                }



                //console.log(SELECTEDFRIEND);
                //console.log(username);

                if (SELECTEDFRIEND == username) {

                    $("#netvalidp2").show();
                    $("#netvalidp1").hide();

                    $("#netvalidprognum").text('50%');
                    $("#netvalidprogmess").text('Validating contact...');
                    $("#netvalidprog").width('50%');

                    setTimeout(function () {

                        Engine.verifyFriendData(SELECTEDFRIEND, code, function (err, result) {


                            console.log(result);

                            if (result) {

                                $("#netvalidprognum").text('100%');
                                $("#netvalidprogmess").text('Contact validated');
                                $("#netvalidprog").width('100%');

                                //$("#validateform").hide();
                                //$("#validatesuccess").show();
                                $("#txtCode").val('');
                                selectedFriend.validated = true;
                                FRIENDSLIST[selectedFriend.userName].validated = true;
                                updateSelectedFriend();
                                $("#networkvalidate").hide();
                                $("#friendheader").show();
                                $("#mainWallet").show();
                                $(".footer").show();

                                $("#netvalidp2").hide();
                                $("#netvalidp1").show();
                                //update list also

                                //find friend in list and update the validated icon
                                $("#myfriends #seltarget" + selectedFriend.userName).html('<div class="pull-right text-success m-t-sm"><i class="fa fa-check-square" style="font-size:1.5em"></i></div>');


                            } else {

                                $("#netvalidp2").hide();
                                $("#netvalidp1").show();
                                $("#validatefail").show();
                            }

                        });

                    }, 100);
                }

            }, 100);

        });

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

            $("#mainWallet").hide();
            $("#pinconfirm").show();


        });

        $("#btnrejectinvoice").bind('touchstart', function () {

            Engine.updateInvoice(selectedInvoiceUserName, selectedInvoiceId, '', 2, function (err, result) {

                loadInvoices(function (err, res) {

                    lastInvoiceToPayCount = 0;

                    showInvoiceListNetwork();

                    $("#invoicedisplay").hide();
                    $("#invoicestopay").show();
                    $("#createinv").show();

                    updateSelectedFriend();

                });
            });

        });

        $("#payinvoicecancel").bind('touchstart', function () {


            $("#invoices").hide();
            $("#network").show();
            $("#pnlfriend").show();
            $("#friendheader").show();
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


        var invdate = new Date(invoice.InvoiceDate.match(/\d+/)[0] * 1).toLocaleString();

        $("#createinv").hide();
        $("#invoicestopay").hide();

        $('#tblinvdisplay tbody').empty();
        var s = '';
        for (var i = 0; i < json.invoicelines.length; i++) {
            s += "<tr><td>" + _.escape(json.invoicelines[i].description) + "</td><td>" + _.escape(json.invoicelines[i].quantity) + "</td><td>" + _.escape(convertFromSatoshis(json.invoicelines[i].amount, COINUNIT)) + "</td><td>" + _.escape(convertFromSatoshis(json.invoicelines[i].amount, COINUNIT) * json.invoicelines[i].quantity) + "</td></tr>";
        }

        $('#tblinvdisplay tbody').append(s);

        if (invtype == 'forme') {
            $("#dinvusername").text('Invoice from ' + invoice.InvoiceFrom);
        } else {
            $("#dinvusername").text('Invoice to ' + invoice.InvoiceFrom);
        }

        $("#dinvdate").text(invdate);

        $("#tblinvdisplay tfoot th #dsubtotal").text(convertFromSatoshis(json.summary.subtotal, COINUNIT));
        $("#tblinvdisplay tfoot th #dtax").text(convertFromSatoshis(json.summary.tax, COINUNIT));
        $("#tblinvdisplay tfoot th #dtotal").text(convertFromSatoshis(json.summary.total, COINUNIT));

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
                $("#payinvoicecancel").hide();
                $("#btnpayinvoice").hide();
                $("#btnrejectinvoice").hide();
            }
        } else {
            $("#btnokinvoice").show();
            $("#payinvoicecancel").hide();
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

        Engine.UnpackInvoiceForMe(invoice, username, invtype, function (err, unpacked) {

            displayInvoiceDetails(invoice, unpacked, invtype, function (err, res) {

                callback(false, "ok");

            });

        });

    }

    function payInvoice(friend, amount, invoiceNumber) {


        var pin = $('#sendstdpin').val();

        Engine.getDeviceKey(pin, function (err, ekey) {

            if (!err) {


                $('#sendprogress').show();
                $('#pinconfirm').hide();


                $('#textMessageSendStd').text('Creating transaction...');
                $('#textMessageSendStd').show();
                $('#sendstdprogstatus').width('3%')
                $('#sendstdprog').show();
                $('#sendstdprogstatus').width('10%');

                $('#sendstdprognum').text('10%');


                Engine.sendTransaction('invoice', friend, '', amount, ekey.DeviceKey, function (err, transactionid) {

                    if (!err) {

                        Engine.updateInvoice(friend, invoiceNumber, transactionid, 1, function (err, result) {

                            if (!err) {

                                $('#textMessageSend').text('You paid invoice: ' + friend.toUpperCase() + invoiceNumber);
                                $('input#amount').text('');

                                updateStdAmount();

                                setTimeout(function () {
                                    $("#btnStdSndDone").show();
                                }, 100);

                                $("#sendstdpin").val('');
                                $('.numdone').attr("style", "background-color:white");


                                updateBalance();


                                //change status
                                var statusbox = '<i class=\"fa fa-check text-success text-active\"></i> <span class="label bg-success">Paid</span>';
                                $("#invdisstatus").html(statusbox);


                                //hide buttons
                                $("#payinvoicecancel").hide();
                                $("#btnpayinvoice").hide();
                                $("#btnrejectinvoice").hide();
                            }

                        });


                    } else {

                        $('#textMessageSend').addClass('alert alert-danger');
                        $('#sendstdprogstatus').width('0%')

                        if (transactionid == "ErrInsufficientFunds") {
                            $('#textMessageSend').text('Transaction Failed: Waiting for funds to clear');
                        }

                    }

                });

            } else {

                //display pin error
                $('.numdone').attr("style", "background-color:white");
                $("#sendstdpin").val('');
                $('#confpinalert').show();
                $('#confpinalertmess').text(ekey);

            }

        });

    }


    //INVOICE FUNCTIONS END------------------------------------------



    function initialiseDashboard() {

        $("#dashsend").hide();
        $("#dashreceive").hide();
        $("#dashcontact").hide();
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

                $('#dashboard').show();
                $('#dashheader').show();

                $("#mainWallet").show();
                $(".footer").show();

                updateUI();

                var data = Engine.m_fingerprint + ',' + Engine.m_nickname;
                var options = { text: data, width: 172, height: 172 };

                $('#fingerprintqr').text('');
                $('#fingerprintqr').qrcode(options);


                setInterval(function () {

                    updateUI();

                }, 10000);


            });

        });


    }


    function loadInvoices(callback) {

        //load the invoices into the cache
        cachedInvoices = [];


        Engine.getInvoiceList(function (err, invoices) {

            for (var i = 0; i < invoices.length; i++) {
                var d1 = new Date(invoices[i].InvoiceDate);
                invoices[i].JsDate = d1;
            }

            invoices = _.sortBy(invoices, function (inv) { return -inv.JsDate; });
            for (var i = 0; i < invoices.length; i++) {

                cachedInvoices.push(invoices[i]);

            }

            cachedInvoicesByUser = [];

            Engine.getInvoiceByUserList(function (err, invoices) {

                for (var i = 0; i < invoices.length; i++) {
                    var d1 = new Date(invoices[i].InvoiceDate);
                    invoices[i].JsDate = d1;
                }

                invoices = _.sortBy(invoices, function (inv) { return -inv.JsDate; });

                for (var i = 0; i < invoices.length; i++) {
                    cachedInvoicesByUser.push(invoices[i]);
                }

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
    }


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

                    // + ' / BTC'

                });

            }

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

        amount = Math.round(amount)
        return amount;
    }


    var previousBalance = 0;

    function updateBalance(callback) {

        Engine.getBalance(function (err, result) {

            if (!err) {

                //get in BTC units
                var balance = convertFromSatoshis(result.TotalBalance, COINUNIT);

                $("#homebalance").text(balance);
                $("#homecoinunit").text(COINUNIT);

                $("#calcbalance").text(balance);
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

                    var friendsgroup = _.groupBy(friends, function (item) { return item.category; })

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

                                SELECTEDFRIEND = ev.data.userName;
                                selectedFriend = FRIENDSLIST[ev.data.userName];
                                prevNetworkTransCount = 0;

                                networkpagestate = "friend";
                                friendpagestate = "send"
                                $("#networklistheader").hide();
                                $("#friendheader").show();
                                $("#pnlfriend").show();

                                $('#netpayfeed').html('');
                                $("#networkpayments").show();
                                $("#networklist").hide();

                                $("#pnlfriendinv").hide();

                                window.scrollTo(0, 0);

                                updateSelectedFriend();

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
        $("friendrequestp1").show();
        $("friendrequestp2").hide();

    });


    $('#btnAcceptContactDone').bind('touchstart', function () {

        $("#contactrequest").hide();
        $("#mainWallet").show();
        $("#networklistheader").show();
        $(".footer").show();
        $("friendrequestp1").show();
        $("friendrequestp2").hide();

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

    function acceptAndValidateFriend(username, message, callback) {

        if ($(message)) {
            $(message).text('Accepting friend request...');
        }

        acceptFriend(username, message, function (err, res) {

            //handle here instead

            console.log('accept contact');

            console.log(contactPhraseCache[username]);
            console.log(err);

            if (!err) {


                console.log('accepted request');

                lastNoOfFriendsReq = 0;
                updateFriendRequests();

                //$("#imgrequestwaiting").hide();

                if (contactPhraseCache[username]) {

                    if ($(message)) {
                        $(message).text('Validating contact...');
                    }

                    console.log('found phrase');

                    console.log('found phrase');
                    console.log(contactPhraseCache[username])

                    var code = contactPhraseCache[username];
                    var bip39 = new BIP39();
                    code = bip39.mnemonicToHex(code);

                    if (code.length == 40) {

                        Engine.verifyFriendData(username, code, function (err, result) {

                            if (result) {

                                if ($(message)) {
                                    $(message).text('Validated...');
                                }

                                console.log('verified');
                                console.log(result);

                                lastNoOfFriends = 0;
                                updateFriends();


                                if (callback) {

                                    callback(false, "ok");

                                }

                                //updateSelectedFriend();

                                //update list also

                                //find friend in list and update the validated icon
                                //$("#myfriends #seltarget" + selectedFriend.userName).text('<div class="pull-right text-success m-t-sm"><i class="fa fa-check-square" style="font-size:1.5em"></i></div>');

                            }

                        });

                    }

                    //get the hash to validate against
                    //this will confirm that my friend has the same keys
                    //i orginally packaged for him


                } else {

                    if (callback) {

                        callback(false, "ok");

                    }

                }

            }


        });
    }

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

                for (var i = 0; i < transactions.length && i < 11; i++) {

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
                    template += '<span>';
                    template += amountLabel;
                    template += '</span>';

                    template += '<span class="pull-right">';
                    template += '<div class="trntime">'
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

            } else {

                //optimise

                $('#transfeed .conf').each(function (index, elem) {

                    var tran = allTransactions[transactionIndex[transactions[index].TransactionId]];

                    var template = ''
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



    //

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

                template += '<span>';
                template += amountLabel;
                template += '</span>';

                template += '<span class="pull-right">';
                template += '<div class="trntime">'
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

        } else {


            $('#netpayfeed .conf').each(function (index, elem) {

                var tran = allTransactions[transactionIndex[transactions[index].TransactionId]];

                var template = ''
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


    function generateAddressClient() {

        $("#newaddrspinner").show();
        var target = document.getElementById('newaddrspinner');
        var spinner = new Spinner(spinneropts).spin(target);

        Engine.createAddress('m/0/0', 1, function (err, newAddress, path) {

            var options = { text: newAddress, width: 172, height: 172 };

            $('#requestaddressqr').text('');
            $('#requestaddressqr').qrcode(options);

            $('#requestaddresstxt').text(newAddress);

            //$('#requestaddress').text(tempate);
            $("#newaddrspinner").hide();
            $('#requestaddress').show();


        });

    }


    function sendMoney(friend, index) {

        $('#textMessageSend').removeClass('alert alert-danger');

        if (friend == null) {
            return;
        }

        var pin = $('#sendstdpin').val();
        var amount = $('#amount').text();
        amount = convertToSatoshis(amount, COINUNIT);

        if (amount > 0) {


            Engine.getDeviceKey(pin, function (err, ekey) {

                if (!err) {


                    $('#sendprogress').show();
                    $('#pinconfirm').hide();


                    $('#textMessageSendStd').text('Creating transaction...');
                    $('#textMessageSendStd').show();
                    $('#sendstdprogstatus').width('3%')
                    $('#sendstdprog').show();
                    $('#sendstdprogstatus').width('10%');

                    $('#sendstdprognum').text('10%');



                    Engine.sendTransaction('friend', friend, "", amount, ekey.DeviceKey, function (err, transactionid) {

                        if (!err) {

                            $('#textMessageSend').text('You sent ' + convertFromSatoshis(amount, COINUNIT) + ' ' + COINUNIT + ' to ' + friend);
                            $('input#amount').text('');

                            updateUI();
                            updateStdAmount();

                            setTimeout(function () {
                                $("#btnStdSndDone").show();
                            }, 100);

                            $("#sendstdpin").val('');
                            $('.numdone').attr("style", "background-color:white");

                        } else {
                            $('#textMessageSend').addClass('alert alert-danger');
                            $('#sendfriendprogstatus').width('0%')

                            if (transactionid == "ErrInsufficientFunds") {
                                $('#textMessageSend').text('Transaction Failed: Waiting for funds to clear');
                            }

                        }
                        // alert(transactionid);
                    });

                } else {

                    $('.numdone').attr("style", "background-color:white");
                    $("#sendstdpin").val('');
                    $('#confpinalert').show();
                    $('#confpinalertmess').text(ekey)

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

        var amount = $('#amount').text();
        amount = convertToSatoshis(amount, COINUNIT);

        var address = $('input#toAddress').val();

        $('#textMessageSendStd').removeClass('alert alert-danger');
        //check for valid bitcoin address

        var allok = true;
        if (Engine.isAddressValid(address)) {
            $('input#toAddress').css("border-color", "#ccc");
        } else {
            $('input#toAddress').css("border-color", "#ffaaaa");
            allok = false;
        }
        if (amount > 0) {
            $('#amount').css("border-color", "#ccc");
        } else {
            $('#amount').css("border-color", "#ffaaaa");
            allok = false;
        }

        var pin = $('#sendstdpin').val();

        if (allok) {

            Engine.getDeviceKey(pin, function (err, ekey) {

                if (!err) {



                    $('#sendprogress').show();
                    $('#pinconfirm').hide();


                    $('#textMessageSendStd').text('Creating transaction...');
                    $('#textMessageSendStd').show();
                    $('#sendstdprogstatus').width('3%')
                    $('#sendstdprog').show();
                    $('#sendstdprogstatus').width('10%');

                    $('#sendstdprognum').text('10%');


                    Engine.sendTransaction('standard', '', address, amount, ekey.DeviceKey, function (err, transactionid) {

                        if (!err) {

                            $('#textMessageSendStd').html('You sent ' + _.escape(convertFromSatoshis(amount, COINUNIT)) + ' ' + _.escape(COINUNIT) + ' to <span style="word-wrap:break-word;">' + address + '</span>');
                            $('input#amount').text('');

                            updateUI();
                            updateStdAmount();

                            setTimeout(function () {
                                $("#btnStdSndDone").show();
                            }, 100);

                            $("#sendstdpin").val('');
                            $('.numdone').attr("style", "background-color:white");

                        } else {

                            if (transactionid == "ErrInsufficientFunds") {
                                $('#textMessageSendStd').text('Transaction Failed: Waiting for funds to clear');
                            }

                            $('#sendstdprogstatus').width('0%')
                            $('#textMessageSendStd').addClass('alert alert-danger');
                            $("#sendstdpin").val('');
                        }
                    });



                } else {


                    //display pin error
                    $('.numdone').attr("style", "background-color:white");
                    $("#sendstdpin").val('');
                    $('#confpinalert').show();
                    $('#confpinalertmess').text(ekey);
                }



            });
        }

    }


    var checkAndValidateTimer = null;


    function clearCheckAndValidateTimer() {
        clearInterval(checkAndValidateTimer);
    }


    function checkAndValidateFriendRequests() {
        Engine.getFriendRequests(function (err, ofriends) {

            var friends = [];
            for (var i = 0; i < ofriends.length; i++) {

                if (contactPhraseCache[ofriends[i].userName]) {

                    clearCheckAndValidateTimer();

                    console.log('found request...accepting and validating');
                    acceptAndValidateFriend(ofriends[i].userName);

                    return;
                }
            }
        });
    }


    $('#btnContactAccept').bind('touchstart', function () {

        $("#btnAcceptContactDone").hide();
        $("#friendrequestp1").hide();
        $("#friendrequestp2").show();
        $("#acceptcontactprognum").text('10%');
        $("#acceptcontactprog").width('10%');


        acceptAndValidateFriend(selectedFriendRequest, "#acceptcontactprogmess", function (err, result) {

            if (!err) {



                $("#acceptcontactprognum").text('70%');
                $("#acceptcontactprog").width('70%');

                updateFriendRequests(function (err, result) {

                    $("#acceptcontactprognum").text('80%');
                    $("#acceptcontactprog").width('80%');

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

        contactPhraseCache[username] = phrase;

        $("#addcontactmodal").show();
        $("#dashcontact").hide();


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

                    var friends = _.filter(ofriends, function (frn) { return frn.UserName == username; });

                    if (friends.length == 0) {

                        console.log('network not exists');



                        //if network doesnt exist create friend

                        Engine.isNetworkExist(username, function (err, result) {

                            if (!err) {

                                if (!result) {


                                    $("#textAddContact").text('Deriving addresses...');

                                    $("#addcontactprognum").text("60%");
                                    $("#addcontactprogstatus").width("60%");


                                    Engine.createFriend(username, "#qrcontactmess", function (err, result) {


                                        console.log('create friend ' + result);

                                        if (err) {

                                            //$("#addcontactmodal").hide();
                                            //$("#imgaddcontactwaiting").hide();
                                            //$("#qrcontactalert").show();
                                            $("#textAddContact").text("Error adding contact");


                                        } else {

                                            console.log('added timer for check and validate');
                                            //here we go to - now you friend should scan this code
                                            checkAndValidateTimer = setInterval(function () { checkAndValidateFriendRequests() }, 2000);

                                            //listen for 2 minutes
                                            setTimeout(clearCheckAndValidateTimer(), 120000);

                                            $("#addcontactprognum").text("100%");
                                            $("#addcontactprogstatus").width("100%");

                                            //$("#imgaddcontactwaiting").hide();
                                            //$("#addcontactmodal").hide();
                                            $("#textAddContact").text("Successfully added " + username + " as a contact");
                                        }
                                    });
                                } else {


                                    $("#textAddContact").text('validating...');

                                    $("#addcontactprognum").text("80%");
                                    $("#addcontactprogstatus").width("80%");


                                    //if already accepted validate only

                                    var needToAccept = false;
                                    if (FRIENDSLIST[username]) {

                                        if (!FRIENDSLIST[username].ICanSend) {
                                            needToAccept = true;
                                        }

                                    } else {
                                        needToAccept = true;
                                    }


                                    if (needToAccept) {

                                        acceptAndValidateFriend(username, "", function (err, result) {


                                            if (!err) {

                                                $("#addcontactprognum").text("100%");
                                                $("#addcontactprogstatus").width("100%");

                                                $("#textAddContact").text("Successfully added " + username + " as a contact");
                                            }


                                        });


                                    } else {

                                        console.log('caught event...');

                                        var bip39 = new BIP39();
                                        code = bip39.mnemonicToHex(phrase);

                                        console.log(code);


                                        if (code.length != 40) {

                                            return;
                                        }

                                        Engine.verifyFriendData(username, code, function (err, result) {


                                            $("#addcontactprognum").text("100%");
                                            $("#addcontactprogstatus").width("100%");

                                            $("#textAddContact").text("Successfully verified " + username + " as a contact");

                                            //update contact list
                                            updateFriends();

                                        });


                                    }

                                }

                            }

                        });

                    } else if (friends.length == 1) {


                        //validate using the fingerprint
                        acceptAndValidateFriend(username, "#textAddContact", function (err, result) {

                            if (!err) {

                                $("#addcontactprognum").text("100%");
                                $("#addcontactprogstatus").width("100%");

                                $("#textAddContact").text("Successfully added " + username + " as a contact");
                            }


                        });


                    }
                });

            } else {



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
                        $("#dashcontact").hide();


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


                        Engine.createFriend(username, "#textAddContact", function (err, result) {
                            if (err) {

                                //$("#friend").css("border-color", "#ffaaaa");

                                //$("#addcontactalert").show();
                                //$("#addcontactalertmessage").text("Error adding contact");
                                //$("#imgaddcontactwaiting").hide();

                            } else {


                                $("#addcontactprognum").text("100%");
                                $("#addcontactprogstatus").width("100%");

                                //$("#addcontactmodal").hide();
                                $("#friend").val('');
                                //$("#imgaddcontactwaiting").hide();
                                //$("#addcontactsuccess").show();
                                $("#textAddContact").text("You requested " + username + " as a contact");
                                //$("#addcontactsuccess").fadeOut(5000);

                                //updateRequestsMadeByMe();
                            }
                        });

                    } else {

                        $("#friend").css("border-color", "#ffaaaa");
                        $("#addcontactalert").show();
                        $("#textAddContact").text("You have already requested " + username + " as a contact");
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


        console.log('calling accept acceptFriend');

        // $("#imgrequestwaiting").show();
        //var target = document.getElementById('imgrequestwaiting');
        // var spinner = new Spinner(spinneropts).spin(target);

        //$('#friendreq').fadeOut(1000);
        Engine.acceptFriendRequest(username, function (err, secret) {
            if (err) {
                //alert("Wallet could not be opened.\n\n" + err);
            } else {
                console.log('accepted');
                Engine.isNetworkExist(username, function (err, result) {

                    if (!result) {

                        Engine.createFriend(username, message, function (err, result) {

                            if (err) {

                            } else {

                                return callback(err, result);
                            }
                        });

                    } else {

                        return callback(err, result);

                    }

                });
            }

        });


    }


}
module.exports = UI;