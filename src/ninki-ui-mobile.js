//Ninki Wallet
//Mobile UI


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
    var isCreate = false;


    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE");

    var pintaps = 0;
    var prevpin = '';

    var ONE_HOUR = 60 * 60 * 1000;


    var tmpAuthIdentifier = '';

    window.isSessionLive = function (callback) {

        Ninki.API.getPrice(Engine.m_guid, Engine.m_settings.LocalCurrency, function (err, result) {

            if (!err) {
                return callback(true);
            } else {
                return callback(false);
            }

        });

    }


    window.setKeyboardScroll = function () {

        if (window.cordova) {
            cordova.plugins.Keyboard.disableScroll(true);
        }

    }



    window.hideSecScreens = function () {

        if ($(".blind").is(":visible")) {

            $(".blind").hide();
            $("#seccheck").removeClass("invis");
            $("#seccheck").show();

        }

        window.resetPin();

        $('#sendstdpin').val('');
        $("#paddelconf").hide();
        $('.numdone').attr("style", "background-color:white");

    }


    window.showLoginPIN = function () {



        if ($("#isactive").val() == 1) {

            if ($(".footer").is(":visible")) {

                $("#footermode").val(1);

            } else {

                $("#footermode").val(0);

            }

        }

        if (window.cordova) {
            cordova.plugins.Keyboard.close();
        }

        $("#isactive").val(0);


        if ($(".blind").is(":visible")) {

            window.clearAuthInterval();
            $(".blind").hide();
            $("#seccheck").removeClass("invis");
            $("#seccheck").show();

        }


        window.resetPin();

        $('#sendstdpin').val('');
        $("#paddelconf").hide();


        $("#paddel").hide();



        $('.numdone').attr("style", "background-color:white");

        $("#loginpinno").val('');

        $("#pinloginmessage").text("Enter your PIN number");



        $("#pinimage").show();

        $("#pinpair").hide();

        $("#pinrepeat").hide();



        $("#loginpin").show();

        $("#nonlogin").hide();



        $(".footer").hide();

        $(".bootbox").hide();


    }



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

    $(function () {
        FastClick.attach(document.body);
    });


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


        setTimeout(function () {

            if (window.cordova) {
                if (cordova.plugins) {
                    if (cordova.plugins.Keyboard) {
                        cordova.plugins.Keyboard.disableScroll(true);
                    }
                }
            }

        }, 1000);


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

                Engine.fillElementWithGuid($("#createWalletStart input#guid"));

                isCreate = true;
                $("#createWalletStart").show();
                $("#pinpair").show();
            }

        });



        //create wallet area


        $('#createaccount').bind("click", function () {

            //Engine.Device.deleteStorageItem("balance");
            $("#pairDevice").hide();
            $("#createWalletStart").show();

        });


        $('#closetos').bind("touchstart", function () {
            //$("#tos").removeClass("slideUp");
            //$("#tos").addClass("invis");
            $("#tos").hide();
            $('#createWalletStart').show();
        });


        $('#termslink').bind("click", function () {
            //$("#tos").removeClass("invis");
            //$("#tos").addClass("slideUp");

            $('#createWalletStart').hide();
            $('#tos').show();
        });


        var options = {};
        options.ui = {
            container: "#pwd-container",
            showVerdictsInsideProgressBar: true,
            showPopover: false,
            showErrors: false,
            viewports: {
                progress: ".pwstrength_viewport_progress"
            }
        };
        options.common = {
            debug: true,
            onLoad: function () {
                $('#messages').text('Start typing password');
            },
            onKeyUp: function () {
                $("#createwalletalert").fadeOut(100);
            }
        };

        $('#createWalletStart #cpassword').pwstrength(options);

        $("#cpassword").blur(function () {
            $(".popover.fade.bottom.in").hide();
            //$("#pwdmeter").fadeOut(500);
        });

        $("#cpassword").focus(function (e) {

            $(".popover.fade.bottom.in").show();
            //$("#pwdmeter").fadeIn(500);

        });

        $("#password1").blur(function () {

        });

        $("#password1").focus(function (e) {

        });




        //wallet security wizard

        var step = 0;

        $(".next").bind("touchstart", function () {

            if (step == 2) {

                Engine.Device.deleteStorageItem("ok_disp");

                $("#secheckkeys").show();
                $("#secchevkeys").hide();

                $("#sechevemail i").removeClass("text-muted");
                $("#sechevemail i").addClass("text-primary");

                $("#hotWalletPhrase").text('');

                $("#btnPairDevice").removeClass("disabled");

                $("#hotkeystep").hide();

                $("#imgphrasewaiting").hide();

                $("#seccheck").removeClass("invis");
                $("#seccheck").show();

                displaySecurityScore();

                //$("#tfastep").show();
                //$('#btnUnpair').hide();
                //$('#loginpin').show();


                setTimeout(function () {
                    $("#hotkeystep").removeClass("fadeInRightBig");
                    $("#hotkeystep").addClass("fadeInLeftBig");

                }, 1000);


                $(".next").hide();
                $(".previous").show();
                step++;
            }

            if (step == 1) {


                Engine.destroySecretPub(function (err, res) {

                    if (!err) {

                        $("#coldWalletPhrase").text('');

                        $("#hotkeystep").show();
                        $("#coldkeystep").hide();

                        setTimeout(function () {
                            $("#coldkeystep").removeClass("fadeInRightBig");
                            $("#coldkeystep").addClass("fadeInLeftBig");
                        }, 1000);


                        Engine.Device.setStorageItem("ok_disp", "1");

                        $(".previous").show();

                        $(".next").hide();

                        step++;

                    }

                });
            }

        });

        $(".previous").bind("touchstart", function () {

            if (step == 2) {

                $("#coldkeystep").show();
                $("#hotkeystep").hide();

                $("#hotkeystep").removeClass("fadeInLeftBig");
                $("#hotkeystep").addClass("fadeInRightBig");

                $("#hotcheckicon").removeClass("fa-check-square");
                $("#hotcheckicon").removeClass("text-success");
                $("#hotcheckicon").addClass("fa-square-o");


                $(".previous").hide();
                $(".next").show();
                step--;
            }

            if (step == 3) {

                $("#hotkeystep").show();
                $("#emailstep").hide();

                $(".previous").show();
                $(".next").show();
                step--;
            }

            if (step == 4) {

                $("#step3").show();
                $("#step4").hide();

                $(".previous").show();
                step--;
            }

        });

        $("#coldcheck").bind("touchstart", function () {

            $("#coldcheckicon").removeClass("fa-square-o");
            $("#coldcheckicon").addClass("fa-check-square");
            $("#coldcheckicon").addClass("text-success");
            $("#coldfinalwarning").show();


            $(".next").show();

        });


        $("#hotcheck").bind("touchstart", function () {

            $("#hotcheckicon").removeClass("fa-square-o");
            $("#hotcheckicon").addClass("fa-check-square");
            $("#hotcheckicon").addClass("text-success");

            $(".next").show();

        });

        $("#coldconf").change(function () {
            if (this.checked) {
                $(".next").show();
            } else {
                $(".next").hide();
            }
        });

        $("#hotconf").change(function () {
            if (this.checked) {
                $(".next").show();
            } else {
                $(".next").hide();
            }
        });


        $("#chkhotmig").change(function () {
            if (this.checked) {
                $("#hotmigcont").show();
            } else {
                $("#hotmigcont").hide();
            }
        });


        //on blur email
        //on blur username


        var isCreateEmailValid = false
        $("#emailaddress").blur(function () {

            var emailaddr = $("#emailaddress").val();
            //check email address valid

            if (emailaddr.length > 2) {

                if ($("#emailaddress").parsley().isValid()) {

                    Engine.doesEmailExist(emailaddr, function (err, res) {

                        if (res) {


                            var specificField = $('#emailaddress').parsley();
                            window.ParsleyUI.addError(specificField, "emailaddressError", "This email address is already taken");

                            $("#emailaddress").css("border-color", "#ffaaaa");
                            isCreateEmailValid = false;

                        } else {

                            $("#emailaddress").css("border-color", "#ccc");
                            isCreateEmailValid = true;

                        }

                        //validateCreateForm();

                    });
                } else {

                    $("#emailaddress").parsley().validate();

                }

            } else {

                $("#emailaddress").parsley('reset');
                isCreateNicknameValid = false;
                // validateCreateForm();
            }

        });

        var isCreateNicknameValid = false

        $("#nickname").focus(function () {

            $("#pairsection").hide();

            var specificField = $('#nickname').parsley();
            window.ParsleyUI.removeError(specificField, "nicknameError");

        });


        $("#nickname").blur(function () {

            $("#pairsection").show();

        });

        $("#emailaddress").focus(function () {

            var specificField = $('#emailaddress').parsley();
            window.ParsleyUI.removeError(specificField, "emailaddressError");

        });



        $("#password1, #cpassword, #emailaddress").change(function () {

            //validateCreateForm();

        });


        var showlogo = true;


        $("#createback").bind("touchstart", function () {

            isCreate = false;
            $("#pairDevice").show();
            $("#createWalletStart").hide();

        });


        var slideShowDone = false;
        function runSlideShow() {

            setTimeout(function () {

                $("#crprog1").hide();
                $("#crprog2").show();

                setTimeout(function () {

                    $("#crprog2").hide();
                    $("#crprog3").show();

                    setTimeout(function () {

                        slideShowDone = true;

                    }, 5000);

                }, 5000);


            }, 5000);

        }

        function showCreateAccPIN() {

            if (slideShowDone) {

                //set variables for the session
                $("#createWalletStart").hide();
                $("#createWalletProgress").hide();

                $('#createWalletStart input#cpassword').val('');
                $('#createWalletStart input#password1').val('');

                //save the encrypted hot key in local storage

                $("#walletGuid").text($('input#guid').val());



                //$("#showPhrases").show();
                //$("#securitywizard").show();

                //$(".next").hide();

                //$("#no2famessage").hide();

                step = 1;
                //$("#coldkeystep").show();
                //$(".previous").hide();


                $('#loginpin').show();

            } else {

                setTimeout(function () {

                    showCreateAccPIN();

                }, 2000);

            }

        }



        $("#btnCreate").bind("touchstart", function () {


            $("#btnCreate").button('loading');

            deleteDeviceStorage();

            showlogo = false;

            window.setKeyboardScroll();

            if ($("#frmcreate").parsley().isValid()) {

                //check password strength
                //if (($(".password-verdict").html() == 'Strong' || $(".password-verdict").html() == 'Very Strong')) {

                var nicknme = $("#nickname").val();
                //check email address valid
                Engine.doesUsernameExist(nicknme, function (err, res) {

                    if (!res) {

                        var emailaddr = $("#emailaddress").val();
                        //check email address valid
                        //Engine.doesEmailExist(emailaddr, function (err, res) {

                        //if (!res) {


                        $("#imgcreatewaiting").show();
                        //$("#btnCreate").prop('disabled', true);
                        //$("#btnCreate").addClass('disabled');
                        $("#lnkOpenWallet").hide();

                        //error handling here?

                        var guid = $('#createWalletStart input#guid').val();
                        var username = $("#createWalletStart input#nickname").val();
                        //                        var password = $('#createWalletStart input#cpassword').val();
                        //                        var emailAddress = $('#createWalletStart input#emailaddress').val();


                        Engine.m_nickname = username;


                        $("#createWalletStart").hide();
                        $("#createWalletProgress").show();

                        runSlideShow();
                        setTimeout(function () {

                            Engine.createWalletApp(guid, username, function (err, result) {

                                //move error handling and ui elements to here
                                $("#createWalletStart input#nickname").css("border-color", "#ccc");
                                if (err) {


                                    $("#btnCreate").button('reset');

                                    if (result == "ErrUserExists") {

                                        $("#createWalletStart input#nickname").css("border-color", "#ffaaaa");
                                        $("#imgcreatewaiting").hide();

                                        $("#createwalletalert").show();
                                        $("#createwalletalertmessage").text("The username already exists");

                                        $("#btnCreate").prop('disabled', false);
                                        $("#btnCreate").removeClass('disabled');
                                        $("#lnkOpenWallet").show();
                                    }
                                    if (result == "ErrEmailExists") {

                                        $("#createWalletStart input#emailaddress").css("border-color", "#ffaaaa");
                                        $("#imgcreatewaiting").hide();

                                        $("#createwalletalert").show();
                                        $("#createwalletalertmessage").text("The email address is already in use");

                                        $("#btnCreate").prop('disabled', false);
                                        $("#btnCreate").removeClass('disabled');
                                        $("#lnkOpenWallet").show();
                                    }

                                    if (result == "ErrCreateAccount") {

                                        $("#imgcreatewaiting").hide();
                                        $("#btnCreate").prop('disabled', false);
                                        $("#btnCreate").removeClass('disabled');
                                        $("#lnkOpenWallet").show();

                                        $("#createwalletalert").show();
                                        $("#createwalletalertmessage").text("Error");

                                    }

                                    if (result == "ErrSavePacket") {

                                        $("#imgcreatewaiting").hide();
                                        $("#btnCreate").prop('disabled', false);
                                        $("#btnCreate").removeClass('disabled');
                                        $("#lnkOpenWallet").show();

                                        $("#createwalletalert").show();
                                        $("#createwalletalertmessage").text("Error");

                                    }



                                } else {


                                    $("#hotWalletPhrase").text(result.hotWalletPhrase);
                                    $("#coldWalletPhrase").text(result.coldWalletPhrase);
                                    $("#coldWalletPhrasePrintText").text(result.coldWalletPhrase);

                                    if (Engine.Device.isiOS()) {
                                        deviceName = "My iPhone";
                                    } else {
                                        deviceName = "My Android";
                                    }

                                    //now we perform a pairing of the device with the account
                                    Engine.getDeviceTokenForApp(deviceName, function (err, response) {

                                        if (!err) {

                                            response = JSON.parse(response);

                                            //registration token for this pairing attempt

                                            Engine.m_deviceKey = Bitcoin.convert.hexToBytes(response.DeviceKey);
                                            Engine.m_deviceToken = Bitcoin.convert.hexToBytes(response.DeviceToken)
                                            Engine.m_regToken = response.RegToken;

                                            response = [];


                                            //Engine.getHotHash('', function (err, hothash) {

                                            //if (!err) {

                                            //encrypt the user's password with the encryption key

                                            Engine.Device.setStorageItem("ninki_reg", Engine.m_regToken);

                                            Engine.Device.setSecureStorageObject("ninki_rem", Engine.m_deviceToken, Engine.m_deviceKey, Engine.encryptNp);
                                            //Engine.Device.setSecureStorageObject("ninki_p", Engine.m_password, Engine.m_deviceKey, Engine.encryptNp);
                                            Engine.Device.setSecureStorageObject("ninki_h", Engine.m_onlineKey, Engine.m_deviceKey, Engine.encryptNp);

                                            Engine.zeroOnlineKey();


                                            result = '';

                                            //save all the tokens
                                            //we should now be in the same state as if we have just
                                            //scanned a qr code to pair the phone
                                            //and entered a password

                                            //initialiseUI();
                                            //Engine.m_validate = false;

                                            showCreateAccPIN();


                                            //}

                                            //});

                                        }

                                    });


                                    //showTwoFactorQr();

                                }
                            }, function (txtprogress) {

                                $("#progresstext").text(txtprogress);

                            });

                        }, 100);
                        //      } else {

                        //          isCreateEmailValid = false;
                        //validateCreateForm();
                        //      }
                        // });

                    } else {

                        $("#btnCreate").button('reset');

                        isCreateNicknameValid = false;

                        $("#nickname").css("border-color", "#ffaaaa");

                        //validateCreateForm();
                    }
                });



            } else {

                $("#btnCreate").button('reset');

                $("#frmcreate").parsley().validate();
            }


        });


        $("#tfacopy").bind("touchstart", function () {


            if (window.cordova) {
                cordova.plugins.clipboard.copy($("#tfarawcode").text(), function () {

                    $('#tfarawcode').addClass("backgroundAnimated");
                    setTimeout(function () {
                        $('#tfarawcode').removeClass("backgroundAnimated");
                    }, 1000);


                }, function () {

                    console.log("copy error");

                });
            } else {

                $('#tfarawcode').addClass("backgroundAnimated");
                setTimeout(function () {
                    $('#tfarawcode').removeClass("backgroundAnimated");
                }, 1000);
            }


        });

        $("#tfaoptsetup").bind("touchstart", function () {


            showTwoFactorQr();

            $("#tfaoption").hide();
            $("#tfaoptionsetuppnl").show();


        });


        $("#tapemailvalclose").bind("touchstart", function () {

            if (!(typeof window.app === 'undefined')) {
                app.isScanning = false;
            }

            $("#emailvalstep").hide();

            $("#imgphrasewaiting").hide();

            $("#seccheck").removeClass("invis");
            $("#seccheck").show();

        });

        $("#tapofflineclose").bind("touchstart", function () {

            $("#coldkeystep").hide();

            $("#seccheck").removeClass("invis");
            $("#seccheck").show();

        });

        $("#taponlineclose").bind("touchstart", function () {

            $("#hotkeystep").hide();

            $("#seccheck").removeClass("invis");
            $("#seccheck").show();

        });


        $("#tapemailstepclose").bind("touchstart", function () {

            if (!(typeof window.app === 'undefined')) {
                app.isScanning = false;
            }

            $("#emailstep").hide();

            $("#imgphrasewaiting").hide();

            $("#seccheck").removeClass("invis");
            $("#seccheck").show();

        });


        $("#tfaoptsetuplater, #tfaoptclose").bind("touchstart", function () {


            if (!(typeof window.app === 'undefined')) {
                app.isScanning = false;
            }

            $("#tfastep").hide();



            $("#seccheck").removeClass("invis");
            $("#seccheck").show();

            $("#imgphrasewaiting").hide();

            //            $("#welcome").removeClass("invis");
            //            $("#welcome").addClass("slideUp");
            //            $("#welcome").show();


        });

        $("#btnletsrock").bind("touchstart", function () {


            $("#welcome").addClass("invis");
            $("#welcome").removeClass("slideUp");
            $("#welcome").hide();

            $('#welcome').hide();
            $('#dashboard').show();
            $('#dashheader').show();

            $("#footermode").val(1);
            $("#mainWallet").show();
            $(".footer").show();

        });



        $("#qrtab").bind('touchstart', function (e) {
            $("#tabqr").show();
            $("#tabman").hide();
            $("#liman").removeClass('active');
            $("#liqr").addClass('active');
            $("#btnPassphraseLogin").text("Setup Authenticator");
        });

        $("#mantab").bind('touchstart', function (e) {
            $("#tabman").show();
            $("#tabqr").hide();
            $("#liqr").removeClass('active');
            $("#liman").addClass('active');
            $("#btnPassphraseLogin").text("Paste from Clipboard");

        });



        var useClipboardTFA = true;

        $("#twoFactorCodeCheck").focus(function () {

            useClipboardTFA = false;
            $("#btnPassphraseLogin").text("Setup Authenticator");

            if ($("#liman").hasClass("active")) {
                $("#tabman").slideUp();
            }

            if ($("#liqr").hasClass("active")) {
                $("#tabqr").slideUp();
            }
        });

        $("#twoFactorCodeCheck").blur(function () {


            if ($("#liman").hasClass("active")) {
                useClipboardTFA = true;
                $("#btnPassphraseLogin").text("Paste from Clipboard");
            }

            if ($("#liman").hasClass("active")) {
                $("#tabman").slideDown();
            }

            if ($("#liqr").hasClass("active")) {
                $("#tabqr").slideDown();
            }
        });

        $("#btnPassphraseLogin").bind("touchstart", function () {

            var twoFactorCodeChk = $('#twoFactorCodeCheck').val();
            if (useClipboardTFA) {

                if (window.cordova) {

                    cordova.plugins.clipboard.paste(function (text) {

                        $("#twoFactorCodeCheck").val(text);
                        setup2fa();


                    }, function () {

                        //console.log("paste error");

                    });
                }


            } else {

                setup2fa();

            }


        });


        function setup2fa() {

            var twoFactorCodeChk = $('#twoFactorCodeCheck').val();

            //add basic validation

            if (twoFactorCodeChk.length < 6) {

                //add red border
                $('#twoFactorCodeCheck').css("border-color", "#ffaaaa");
                return;

            }

            $("#btnPassphraseLogin").prop('disabled', true);

            Engine.SetupTwoFactor(twoFactorCodeChk, function (err, result) {

                if (err) {

                    $("#tfaerror").text("Invalid code");

                    $("#btnPassphraseLogin").prop('disabled', false);

                } else {

                    $("#twoFactorCodeCheck").blur();
                    $("#tfaerror").text('');

                    if (!(typeof window.app === 'undefined')) {
                        app.isScanning = false;
                    }


                    Engine.m_settings.TwoFactor = true;
                    $("#secheck2fa").show();
                    $("#sechev2fa").hide();

                    $("#tfastep").hide();

                    $("#seccheck").removeClass("invis");
                    $("#seccheck").show();

                }


            });

        }



        $("#btnEmailValidate").hammer(null).bind("tap", function () {

            //app.isScanning = false;

            if (window.cordova) {

                cordova.plugins.clipboard.paste(function (text) {


                    var ttext = text.trim().replace(" ", "");

                    $('#txtEmailToken').val(ttext);
                    $("#txtEmailToken").trigger('change');

                }, function () {

                    //console.log("paste error");

                });
            }

        });

        $("#txtEmailToken").change(function () {

            var token = $("#txtEmailToken").val();

            $("#btnEmailValidate").prop('disabled', true);

            Engine.getEmailValidation(token, function (err, response) {

                if (err) {
                    $("#btnEmailValidate").prop('disabled', false);
                } else {

                    if (response != "Valid") {

                        if (response == "Expired") {
                            $("#valemailerror").text('Your token has expired');
                        }
                        if (response == "Invalid") {
                            $("#valemailerror").text('Your token is not valid');
                        }

                        $("#btnEmailValidate").prop('disabled', false);


                        $("#valemailerror").show();
                        $("#valemailerror").fadeOut(2000);

                    } else {

                        Engine.m_settings.EmailVerified = true;


                        displaySecurityScore();


                        Engine.m_validate = false;

                        $('#createWalletStart').hide();
                        $('#emailstep').hide();


                        $("#pairspinner").hide();

                        $("#secheckemail").show();
                        $("#sechevemail").hide();

                        $("#sechev2fa i").removeClass("text-muted");
                        $("#sechev2fa i").addClass("text-primary");


                        $("#seccheck").removeClass("invis");
                        $("#seccheck").show();

                        $("#validateemail").hide();
                        $("#valemailerror").hide();
                        $("#btnEmailValidate").prop('disabled', false);

                    }
                }

            });


            //call to verify token

        });


        //after the user has chosen their PIN
        //register the pin with the server


        $("#emailresend").click(function () {

            Engine.sendWelcomeDetails(function (err, result) {

                if (!err) {

                    $("#emailresendmessage").show();
                    $("#emailresend").hide();
                    //email has been resent, please check your email
                }

            });

        });

        function showTwoFactorQr() {

            $("#twoFactorQr").show();
            $("#2factor1").show();

            Engine.getTwoFactorImg(function (err, twoFASecret) {

                var nickname = m_this.m_nickname;
                var data = "otpauth://totp/Ninki:" + nickname + "?secret=" + twoFASecret + "&issuer=Ninki";
                var options = { text: data, width: 128, height: 128 };

                $('#tfarawcode').text(twoFASecret);

                $('#twoFactorQrImg').text('');
                $('#twoFactorQrImg').qrcode(options);

            });

        }


        //end create wallet area



        $("#mainWallet").hide();

        //$("#dashreceive").hide();
        //$("#dashcontact").hide();


        $("#addcontactmodal").hide();


        $('#stdselcu').click(function () {

            sendAmount = '';

            $('#stdselunit').text(COINUNIT);


            stdAmountConvCoin = true;


            if (stdAmountConvCoin) {

                if (COINUNIT == "Bits") {

                    $("#numcdot").hide();

                } else {

                    $("#numcdot").show();

                }

            } else {

                $("#numcdot").show();

            }


            updateStdAmount();

        });


        $('#stdsellc').click(function () {


            sendAmount = '';

            $('#stdselunit').text(Engine.m_settings.LocalCurrency);
            stdAmountConvCoin = false;


            if (stdAmountConvCoin) {

                if (COINUNIT == "Bits") {

                    $("#numcdot").hide();

                } else {

                    $("#numcdot").show();

                }

            } else {

                $("#numcdot").show();

            }

            updateStdAmount();


        });



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

            updatePrice();

        });







        $('#taptfa').bind('touchstart', function () {


            if (!Engine.m_settings.TwoFactor) {

                $("#seccheck").addClass("invis");
                $("#seccheck").removeClass("slideUp");
                $("#seccheck").hide();

                showTwoFactorQr();

                $("#tfastep").show();
                $("#tfaoption").hide();
                $("#tfaoptionsetuppnl").show();

            }


        });


        $('#tapemailsec').bind('touchstart', function () {


            Engine.Device.getStorageItem("ok_disp", function (res) {


                if (!Engine.m_settings.EmailVerified && Engine.m_offlineKeyBackup && res != "1") {

                    $("#seccheck").addClass("invis");
                    $("#seccheck").removeClass("slideUp");
                    $("#seccheck").hide();
                    $("#mainWallet").hide()

                    $("#emailvalstep").show();

                }

            });


        });

        $('#btnRegEmail').bind('touchstart', function () {


            $("#frmEmail").parsley().validate();

            if ($("#frmEmail").parsley().isValid()) {

                var emailAddress = $("#txtEmailAddress").val();

                Engine.updateEmailAddress(emailAddress, function (err, result) {

                    Engine.sendWelcomeDetails(function (err, result) {

                        $("#emailvalstep").hide();
                        $("#emailstep").show();

                    });

                });

            }

        });



        window.clearAuthInterval = function () {

            clearAuthInterval();

        };


        $('#btnCloseAuthDevice').bind('touchstart', function () {

            $('#sendstdpin').val('');

            clearAuthInterval();

            $("#mainWallet").show();
            $("#seccheck").show();
            $("#authrequestitem").hide();
            $("#deviceauth").hide();

        });


        var checkAuthInterval = null;
        function clearCheckAuth() {

            clearInterval(checkAuthInterval);

        }

        $('#btnAuthDevice').bind('touchstart', function () {

            var pin = $('#sendstdpin').val();

            if (pin.length == 4) {

                Engine.getDeviceKey(pin, function (err, ekey) {

                    $("#sendstdpin").val('');

                    if (!err) {

                        Engine.authMigration(Engine.m_deviceKey, tmpAuthIdentifier, function (err, result) {

                            if (!err) {


                                $("#mainWallet").show();
                                $("#seccheck").show();
                                $("#deviceauth").hide();
                                $("#desktopintro").hide();
                                $("#desktopphrase").hide();

                                //now listen to update sec checklist

                                checkAuthInterval = setInterval(function () {

                                    Engine.getAccountSettings(function (err, res) {

                                        if (!err) {

                                            //only set the settings we need to refresh for the mobile apps
                                            var settingsObject = JSON.parse(res);
                                            Engine.m_settings.TwoFactor = settingsObject.TwoFactor;
                                            Engine.m_settings.EmailVerified = settingsObject.EmailVerified;

                                            if (Engine.m_settings.TwoFactor) {
                                                displaySecurityScore();
                                                clearCheckAuth();
                                                $("#secheck2fa").show();
                                                $("#sechev2fa").hide();
                                            }

                                        }

                                    });



                                }, 5000);

                            } else {


                                clearAuthInterval();
                                bootbox.alert("Your auth token has expired. Please exit and try again.", function () {

                                    $("#authrequestitem").hide();

                                });


                            }

                        });

                    } else {

                        clearAuthInterval();
                        bootbox.alert("PIN failed. Please exit and try again.", function () {

                            $("#authrequestitem").hide();

                        });

                    }

                });
            } else {

                clearAuthInterval();
                bootbox.alert("Invalid PIN. Please exit and try again.", function () {

                    $("#authrequestitem").hide();

                });

            }



        });


        function authDevice() {

            //get the twofactor token
            var pin = $('#sendstdpin').val();

            Engine.getDeviceKey(pin, function (err, ekey) {

                if (!err) {

                    Engine.getHotHash('', function (err, hotHash) {

                        Engine.zeroDeviceKey();

                        if (!err) {

                            var bip39 = new BIP39();  // 'en' is the default language
                            var hotmnem = bip39.entropyToMnemonic(Bitcoin.convert.bytesToHex(Engine.m_onlineKey));

                            Engine.zeroOnlineKey();

                            $("#hotWalletDesktopPhrase").text(hotmnem);

                            hotmnem = [];

                            $('#pinconfirm').hide();
                            $('#desktopphrase').show();
                            $("#pinconfdets").show();
                            $("#paddelconf").hide();

                            $('#pinconfirm').hide();
                            $('.numdone').attr("style", "background-color:white");

                            //we will resuse in the next step
                            //$("#sendstdpin").val('');

                            sendmode = "";
                            pintaps = 0;
                            prevpin = '';

                            window.resetPin();

                            getAuthReq();

                        }

                    });

                } else {

                    $('.numdone').attr("style", "background-color:white");

                    $("#sendstdpin").val('');
                    pintaps = 0;
                    prevpin = '';
                    $("#paddelconf").hide();

                    window.resetPin();

                    if (ekey.substring(0, 6) == "ErrPIN") {

                        var attempts = ekey.substring(7, 8);

                        $("#pinconfcount").effect("shake");

                    } else if (ekey.substring(0, 10) == "ErrBlocked") {

                        //if the login attempt has been blocked
                        //display a countdown to the user
                        //indicating when they can next attempt to
                        //login

                        var seconds = ekey.substring(11, ekey.length) * 1.0;

                        setCountdown(seconds);

                        // later on this timer may be stopped

                        $("#pincounter").effect("shake");

                    } else {

                        bootbox.alert(ekey);

                    }
                }

            });

        }


        $('#tapclosedeskintro').bind('touchstart', function () {

            $('#desktopintro').hide();
            $("#mainWallet").show();
            $("#seccheck").show();

        });

        $('#tapclosedeskphrase').bind('touchstart', function () {

            //resetpin
            $('#sendstdpin').val('');

            $('#desktopphrase').hide();
            $("#mainWallet").show();
            $("#seccheck").show();

        });




        $('#tapchrome').bind('touchstart', function () {

            Engine.Device.getStorageItem("ok_disp", function (res) {

                if (!Engine.m_settings.TwoFactor && Engine.m_settings.EmailVerified && Engine.m_offlineKeyBackup && res != "1") {

                    $('#desktopintro').show();
                    $("#mainWallet").hide();
                    $("#seccheck").hide();

                }

            });

        });


        $('#tapdesktopnext').bind('touchstart', function () {

            sendmode = "deviceauth"
            $("#mainWallet").hide();
            $("#desktopintro").hide();

            $("#pinconfdets").hide();
            $("#pinconfirm").addClass("blind");
            $("#pinconfirm").show();


        });

        var authInterval = null;
        var runAuthCheck = false;
        function clearAuthInterval() {

            runAuthCheck = false;
            clearInterval(authInterval);

        }


        function checker() {

            if (runAuthCheck) {

                Engine.getAuthMigrationRequest(function (err, result) {

                    if (!err) {

                        if (result.length == 1) {

                            if (result[0]) {

                                console.log(result[0].authreqtoken);

                                tmpAuthIdentifier = result[0].authreqtoken;

                                $("#authrequestitem").show();

                                clearAuthInterval();

                                $("#mainWallet").hide();
                                $("#seccheck").hide();

                                $("#deviceauth").show();

                                $("#desktopphrase").hide();

                            }

                        } else {

                            $("#authrequestitem").hide();
                        }


                    }

                });

            }

        }



        function getAuthReq() {

            $("#authrequestitem").hide();

            if (!Engine.m_settings.TwoFactor) {

                runAuthCheck = true;
                checker();
                authInterval = setInterval(checker, 5000);

            }

        }


        $('#tapdesktopnext2').bind('touchstart', function () {


            $("#authrequestitem").hide();
            $("#mainWallet").hide();
            $("#seccheck").hide();

            $("#deviceauth").show();

        });







        $('#tapkeybackup').bind('touchstart', function () {

            Engine.Device.getStorageItem("ok_disp", function (res) {

                if (!Engine.m_offlineKeyBackup || res == "1") {

                    sendmode = "viewkey"
                    $("#mainWallet").hide();
                    $("#seccheck").hide();

                    $("#pinconfirm").addClass("blind");
                    $("#pinconfdets").hide();
                    $("#pinconfirm").show();

                }

            });

        });

        $('#tapsecwarning').bind('touchstart', function () {


            $("#seccheck").addClass("invis");
            $("#seccheck").removeClass("slideUp");
            $("#seccheck").hide();

            $("#secwarning").removeClass("invis");
            $("#secwarning").show();

            $("#secphrasepnl").hide();
            $("#tapsecok").show();
            $("#tapseccancel").text("Cancel");

            $("#secwarn").show();
            $("#sechold").hide();

        });

        $('#tapunlock').bind('touchstart', function () {


            Engine.Device.getStorageItem("pair", function (res) {

                if (res == "") {

                    if (Engine.m_offlineKeyBackup) {
                        $("#tapsecwarning").show();
                    } else {
                        $("#tapsecwarning").hide();
                    }

                } else {

                    Engine.m_offlineKeyBackup = true;
                    Engine.m_settings.EmailVerified = true;
                    Engine.m_settings.TwoFactor = true;

                    $("#secheckemail").show();
                    $("#sechevemail").hide();
                    $("#secheck2fa").show();
                    $("#sechev2fa").hide();
                    $("#secheckkeys").show();
                    $("#secchevkeys").hide();
                    $("#tapsecwarning").show();

                }

                displaySecurityScore();

                $("#seccheck").removeClass("invis");
                //$("#seccheck").addClass("slideUp");
                $("#seccheck").show();

                $(".footer").hide();
                $("#settingsheader").hide();
                $("#mainWallet").hide();


            });





        });




        $('#tapacclimits').bind('touchstart', function () {



            $("#settingsacclimits").removeClass("invis");
            //$("#seccheck").addClass("slideUp");
            $("#settingsacclimits").show();

            $(".footer").hide();
            $("#settingsheader").hide();
            $("#mainWallet").hide();

            //get account limits from settings

            Engine.getLimitStatus(function (err, limits) {

                $("#limitdaily").text(formatCoinAmount(convertFromSatoshis(limits.DailyTransactionLimit, COINUNIT)) + ' ' + COINUNIT);
                $("#limitsingle").text(formatCoinAmount(convertFromSatoshis(limits.SingleTransactionLimit, COINUNIT)) + ' ' + COINUNIT);
                $("#limittranday").text(limits.NoOfTransactionsPerDay);
                $("#limittranhour").text(limits.NoOfTransactionsPerHour);

                //+ " (" + convertFromSatoshis(limits.DailyTransactionLimit - limits.TotalAmount24hr, COINUNIT) + ")"
                //+ " (" + (limits.NoOfTransactionsPerDay - limits.No24hr) + ")"
                //+ " (" + (limits.NoOfTransactionsPerHour - limits.No1hr) + ")"

            });


        });

        $('#tapcloseacclimits').bind('touchstart', function () {

            $("#settingsacclimits").hide();

            $(".footer").show();
            $("#settingsheader").show();
            $("#mainWallet").show();

        });

        $('#tapcoinunit').bind('touchstart', function () {

            $("#settingscoinunit").removeClass("invis");
            //$("#seccheck").addClass("slideUp");
            $("#settingscoinunit").show();

            $(".footer").hide();
            $("#settingsheader").hide();
            $("#mainWallet").hide();


        });

        $('#tapclosecoinunit').bind('touchstart', function () {

            $("#settingscoinunit").hide();

            $(".footer").show();
            $("#settingsheader").show();
            $("#mainWallet").show();

        });

        $('#tapcurrency').bind('touchstart', function () {

            $("#settingscurrency").removeClass("invis");
            //$("#seccheck").addClass("slideUp");
            $("#settingscurrency").show();

            $(".footer").hide();
            $("#settingsheader").hide();
            $("#mainWallet").hide();

        });

        $('#tapclosecurrency').bind('touchstart', function () {

            $("#settingscurrency").hide();

            $(".footer").show();
            $("#settingsheader").show();
            $("#mainWallet").show();

        });




        function displaySecurityScore() {



            Engine.Device.getStorageItem("ok_disp", function (res) {

                var score = 0;

                if (Engine.m_offlineKeyBackup && res != "1") {
                    score++;
                }

                if (Engine.m_settings.EmailVerified) {
                    score++;
                }

                //replace with chrome app proof + 2fa backup codes
                if (Engine.m_settings.TwoFactor) {
                    score++;
                }

                var score = Math.round((score / 3) * 100);

                $("#securityscore").easyPieChart();

                $('#securityscore').data('easyPieChart').update(score);

            });

        }

        $('#tapseccancel').bind('touchstart', function () {


            $("#secwarning").addClass("invis");
            $("#secwarning").removeClass("slideUp");
            $("#secwarning").hide();

            $("#seccheck").removeClass("invis");
            $("#seccheck").show();



            //            $("#mainWallet").show();
            //            $("#settingsheader").show();
            //            $(".footer").show();



            $("#secphrasepnl").hide();
            $("#secphrase").text('');

        });

        $('#btnCloseSecList').bind('touchstart', function () {


            //$("#seccheck").addClass("invis");
            $("#seccheck").removeClass("slideUp");
            $("#seccheck").hide();
            $("#mainWallet").show();
            $("#settingsheader").show();
            $(".footer").show();



            $("#secphrasepnl").hide();
            $("#secphrase").text('');

        });






        $('#tapsecok').bind('touchstart', function () {


            sendmode = "viewkey"
            $("#mainWallet").hide();
            $("#secwarning").hide();

            $("#pinconfdets").hide();
            $("#pinconfirm").addClass("blind");
            $("#pinconfirm").show();

        });

        $("#secphrasepnl").hammer(null).bind("press", function () {
            $("#secphrase").fadeIn();
            setTimeout(function () {
                $("#secphrase").fadeOut(2000);
            }, 60000);
        });



        function displayKey() {

            var pin = $('#sendstdpin').val();

            Engine.getDeviceKey(pin, function (err, ekey) {

                if (!err) {

                    Engine.getHotHash('', function (err, hotHash) {

                        if (!err) {

                            var bip39 = new BIP39();  // 'en' is the default language
                            var hotmnem = bip39.entropyToMnemonic(Bitcoin.convert.bytesToHex(Engine.m_onlineKey));

                            Engine.zeroDeviceKey();

                            Engine.Device.getStorageItem("ok_disp", function (res) {

                                if (!Engine.m_offlineKeyBackup || res == "1") {

                                    $("#hotWalletPhrase").text(hotmnem);

                                    hotmnem = [];

                                    $("#seccheck").addClass("invis");
                                    $("#seccheck").removeClass("slideUp");
                                    $("#seccheck").hide();

                                    $("#showPhrases").show();
                                    $(".next").hide();

                                    $("#no2famessage").hide();

                                    if (!Engine.m_offlineKeyBackup) {

                                        step = 1;
                                        $("#coldkeystep").show();
                                        $(".previous").hide();
                                        $("#coldfinalwarning").hide();

                                        $("#coldcheckicon").addClass("fa-square-o");
                                        $("#coldcheckicon").removeClass("fa-check-square");
                                        $("#coldcheckicon").removeClass("text-success");

                                        Engine.recoverColdKeyForMobile(function (coldkey) {

                                            var bip39 = new BIP39();  // 'en' is the default language
                                            var coldmnem = bip39.entropyToMnemonic(Bitcoin.convert.bytesToHex(coldkey));

                                            Engine.zeroByteArray(coldkey);
                                            Engine.zeroOnlineKey();

                                            $("#coldWalletPhrase").text(coldmnem);

                                            coldmnem = [];

                                        });



                                    } else {

                                        step = 2;
                                        $("#hotkeystep").show();
                                        $("#hotcheckicon").addClass("fa-square-o");
                                        $("#hotcheckicon").removeClass("fa-check-square");
                                        $("#hotcheckicon").removeClass("text-success");

                                    }

                                    //temporary storage for testing

                                } else {

                                    $("#tapsecok").hide();
                                    $("#tapseccancel").text("Close");
                                    $("#secphrase").text(hotmnem);
                                    $("#secwarn").hide();
                                    $("#sechold").show();
                                    $("#secwarning").removeClass("slideUp");
                                    $("#secwarning").show();
                                    $("#secphrasepnl").show();
                                    $("#secphrase").hide();

                                }

                            });


                            $("#pinconfirm").hide();
                            $("#pinconfdets").show();

                            window.resetPin();

                            $("#paddelconf").hide();

                            $('.numdone').attr("style", "background-color:white");

                            $("#sendstdpin").val('');
                        }

                    });



                } else {


                    window.resetPin();

                    $("#paddelconf").hide();

                    $('.numdone').attr("style", "background-color:white");

                    $("#sendstdpin").val('');


                    if (ekey.substring(0, 6) == "ErrPIN") {

                        var attempts = ekey.substring(7, 8);

                        $("#pinconfcount").effect("shake");

                    } else if (ekey.substring(0, 10) == "ErrBlocked") {

                        //if the login attempt has been blocked
                        //display a countdown to the user
                        //indicating when they can next attempt to
                        //login

                        var seconds = ekey.substring(11, ekey.length) * 1.0;

                        setCountdown(seconds);

                        // later on this timer may be stopped

                        $("#pincounter").effect("shake");

                    } else {

                        bootbox.alert(ekey);

                    }


                }

            });

        }


        //add copy hook for cordova
        $('#copyvalphrase').bind('touchstart', function () {

            if (window.cordova) {

                cordova.plugins.clipboard.copy($('#hdcodeForFriend').val(), function () {

                    $('#valcodepanel').addClass("backgroundAnimated");
                    setTimeout(function () {

                        $('#valcodepanel').removeClass("backgroundAnimated");
                    }, 1000);


                }, function () {

                    console.log("copy error");

                });
            } else {
                $('#valcodepanel').addClass("backgroundAnimated");
                setTimeout(function () {

                    $('#valcodepanel').removeClass("backgroundAnimated");
                }, 1000);
            }

        });






        $('#copyaddress').bind('touchstart', function () {

            if (window.cordova) {

                cordova.plugins.clipboard.copy($('#requestaddresstxt').text(), function () {

                    $('#addresspanel').addClass("backgroundAnimated");
                    setTimeout(function () {
                        $('#addresspanel').removeClass("backgroundAnimated");
                    }, 1000);


                }, function () {

                    console.log("copy error");

                });
            }

        });


        $('#copyinfotran').bind('touchstart', function () {

            if (window.cordova) {

                cordova.plugins.clipboard.copy($('#infofulltran').val(), function () {

                    $('#infotranid').addClass("backgroundAnimated");
                    setTimeout(function () {
                        $('#infotranid').removeClass("backgroundAnimated");
                    }, 1000);


                }, function () {

                    console.log("copy error");

                });
            }

        });

        $('#copyinfoaddress').bind('touchstart', function () {

            if (window.cordova) {

                cordova.plugins.clipboard.copy($('#infotranaddress').text(), function () {

                    $('#infotranaddress').addClass("backgroundAnimated");
                    setTimeout(function () {
                        $('#infotranaddress').removeClass("backgroundAnimated");
                    }, 1000);


                }, function () {

                    console.log("copy error");

                });
            }

        });

        $('#clip').bind('touchstart', function () {

            if (window.cordova) {

                cordova.plugins.clipboard.paste(function (text) {

                    $('#toAddress').val(text.trim());
                    $("#toAddress").trigger('change');

                }, function () {

                    console.log("paste error");

                });
            }

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

                            if ((sendAmount.length - ind) == 9) {

                                return;

                            }

                        }

                    } else {

                        if (COINUNIT == "Bits") {

                            if ((sendAmount == "" && text == "0") || text == ".") {

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


                            //if create account regPINCreate
                            if (isCreate) {
                                regPINCreate();
                            } else if (isPairing) {
                                regPIN();
                            } else {
                                loginPIN();
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

                    } else if (sendmode == 'viewkey') {

                        displayKey();

                    } else if (sendmode == 'deviceauth') {

                        authDevice();

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


        $("#btnmenuprofile").bind('touchstart', function (e) {

            e.preventDefault();

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
        $("#btnmenunetwork").bind('touchstart', function (e) {

            e.preventDefault();

            if (!hastouched) {

                hastouched = true;

                var target = document.getElementById('myfrndspin');
                var spinner = new Spinner(spinneropts).spin(target);
                $("#myfrndspin").show();
                updateFriends(function (err, res) {

                    $("#myfrndspin").hide();

                });

                //loadInvoices();

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


        $("#invformelink").bind('touchstart', function (e) {

            sendmode = "inv";
            $("#invformetab").show();
            $("#invbymetab").hide();
            $("#liby").removeClass('active');
            $("#lifor").addClass('active');
        });

        $("#invbymelink").bind('touchstart', function (e) {
            $("#invbymetab").show();
            $("#invformetab").hide();
            $("#lifor").removeClass('active');
            $("#liby").addClass('active');
        });


        $("#tapnetpayments").bind('touchstart', function (e) {
            $("#pnlfriendinv").hide();
            $("#networkpayments").show();
            $("#networksend").hide();
            networkpagestate = "friend";
            friendpagestate = "payments";

        });


        $("#tapinvoicefriend").bind('touchstart', function (e) {

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
                SELECTEDFRIEND = '';
            }

        }

        function profilehome() {

            $("#dashprofile").show();

            //$("#dashsend").addClass("invis");
            //$("#dashsend").removeClass("slideUp");
            $("#dashsend").hide();

            // $("#dashreceive").addClass("invis");
            $("#dashreceive").removeClass("slideUp");
            $("#dashreceive").hide();

            $("#dashcontact").addClass("invis");
            $("#dashcontact").removeClass("slideUp");
            $("#dashcontact").hide();

            $('#invoices').hide();
            $("#dashboard").show();
            $('#dashheader').show();
            $("#network").hide();
            profilepagestate = "";

        }


        $("#btnmenusettings").bind('touchstart', function (e) {

            e.preventDefault();

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

        $("#tapeditamt").bind('touchstart', function () {


            $('#paddelconf').hide();
            $("#pinconfirm").hide();

            //$("#dashsend").addClass("invis");
            //$("#dashsend").removeClass("slideUp");
            $("#dashsend").hide();

            $("#dashsendamt").show();
            $("#dashsendamt").removeClass("invis");
            $("#dashsendamt").addClass("slideUp");


        });

        $('#toAddress').change(function () {

            //if a valid bitcoin address then
            //next stage
            var addr = $('#toAddress').val();

            if (addr.indexOf('bitcoin:') == -1) {
                addr = 'bitcoin:' + addr;
            }

            $("#sendstdlabel").text('');
            $("#sendstds2add").text('');
            $("#sendstdlbli").hide();

            var paddr = parseBitcoinURL(addr);
            if (paddr) {
                if (addr.length > 25 && paddr.address) {

                    if (Engine.isAddressValid(paddr.address)) {

                        //next stage

                        //if amount is included in the URL set the amount and go straight to the
                        //pay screen

                        $('#toAddress').val(paddr.address);


                        if (paddr.amount) {

                            var amountInBTC = paddr.amount * 1.0;
                            var amountInSatoshis = convertToSatoshis(amountInBTC, "BTC");
                            var amountInCoinUnits = convertFromSatoshis(amountInSatoshis, COINUNIT);

                            var fee = convertFromSatoshis(Engine.m_settings.MinersFee, COINUNIT);

                            if ((currentBalance >= (amountInCoinUnits + fee) && amountInCoinUnits > 0) && convertToSatoshis(amountInCoinUnits, COINUNIT) >= 10000) {

                                $("#hdamount").val(amountInCoinUnits);

                                $('#paddelconf').hide();

                                $("#dashsendamt").hide();

                                if (window.updateUIInterval) {
                                    clearInterval(window.updateUIInterval);
                                }

                                $("#pinconfdets").show();
                                $("#pinconfirm").removeClass("blind");
                                $("#pinconfirm").show();

                                if (paddr.label) {

                                    $("#sendstdlabel").text(paddr.label);
                                    $("#sendstdlbli").show();
                                    $("#sendstds2add").text($('#toAddress').val());
                                    // $("#sendstds2to").hide();

                                } else {

                                    $("#sendstdlbli").hide();
                                    $("#sendstds2add").text($('#toAddress').val());
                                    // $("#sendstds2to").show();

                                }



                                $("#sendstds2amt").text(formatCoinAmount($("#hdamount").val()) + ' ' + COINUNIT);


                                //$("#dashsend").addClass("invis");
                                //$("#dashsend").removeClass("slideUp");
                                $("#dashsend").hide();


                                $("#dashsendamt").addClass("invis");
                                $("#dashsendamt").removeClass("slideUp");
                                $("#dashsendamt").hide();

                            } else {

                                $("#sendstdlbli").hide();
                                //update amount paid on textbox
                                //switch to coin units

                                stdAmountConvCoin = true;
                                $('#stdselunit').text(COINUNIT);

                                sendAmount = amountInCoinUnits + '';

                                updateStdAmount();

                                //$("#dashsend").addClass("invis");
                                //$("#dashsend").removeClass("slideUp");
                                $("#dashsend").hide();

                                $("#dashsendamt").show();
                                $("#dashsendamt").removeClass("invis");
                                $("#dashsendamt").addClass("slideUp");


                            }

                        } else {

                            //$("#dashsend").addClass("invis");
                            //$("#dashsend").removeClass("slideUp");
                            $("#dashsend").hide();

                            $("#dashsendamt").show();
                            $("#dashsendamt").removeClass("invis");
                            $("#dashsendamt").addClass("slideUp");

                        }


                        if (stdAmountConvCoin) {

                            if (COINUNIT == "Bits") {

                                $("#numcdot").hide();

                            } else {

                                $("#numcdot").show();

                            }

                        } else {

                            $("#numcdot").show();

                        }

                    } else {

                        $("#addressinvalid").show();
                        $("#addressinvalid").fadeOut(2000);
                    }

                } else {

                    $("#addressinvalid").show();
                    $("#addressinvalid").fadeOut(2000);
                }
            } else {

                $("#addressinvalid").show();
                $("#addressinvalid").fadeOut(2000);
            }
        });



        $("#btnCloseTran").bind('touchstart', function () {

            $("#transview").hide();
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


            $("#dashcontact").removeClass("slideUp");
            $("#dashcontact").addClass("invis");
            $("#dashcontact").hide();

            $("#networklistheader").show();
            $("#networklist").show();
            $("#network").show();
            $("#mainWallet").show();

            $(".footer").show();


        });

        $("#btnAddContactDone").bind('touchstart', function () {

            $("#addcontactmodal").hide();
            $("#dashcontact").show();


        });

        $("#btnCloseStdSndAmt").bind('touchstart', function () {

            $("#sendstdlabel").text('');
            $("#sendstds2add").text('');
            $("#sendstdlbli").hide();

            closeSendNet();

        });

        $("#btnCloseStdSndPIN").bind('touchstart', function () {


            window.updateUIInterval = setInterval(function () {

                updateUI();

            }, 10000);

            $("#sendstdlabel").text('');
            $("#sendstds2add").text('');
            $("#sendstdlbli").hide();
            $("#pinconfdets").show();



            window.resetPin();

            $("#paddelconf").hide();

            $('.numdone').attr("style", "background-color:white");

            $("#sendstdpin").val('');



            if (sendmode == "std") {
                closeSendStd();
            } else if (sendmode == "net") {
                closeSendNet();
            } else if (sendmode == "viewkey") {


                $("#seccheck").removeClass("invis");
                $("#seccheck").show();
                $("#pinconfirm").hide();
                //$("#mainWallet").show();

            } else if (sendmode == "deviceauth") {

                $("#pinconfirm").hide();
                $("#desktopintro").show();

            }
            else {
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

            window.updateUIInterval = setInterval(function () {

                updateUI();

            }, 10000);

        });


        $("#btnsendmoneystd").bind('touchstart', function () {


            $('#paddelconf').hide();

            $("#dashsendamt").hide();


            if (window.updateUIInterval) {
                clearInterval(window.updateUIInterval);
            }

            $("#pinconfdets").show();
            $("#pinconfirm").removeClass("blind");
            $("#pinconfirm").show();

            if (sendmode == 'std') {

                $("#sendstds2add").text($('#toAddress').val());



            } else if (sendmode == 'net') {
                $("#sendstds2add").text(SELECTEDFRIEND);
            }


            $("#sendstds2amt").text(formatCoinAmount($("#hdamount").val()) + ' ' + COINUNIT);

            //$("#dashsend").addClass("invis");
            //$("#dashsend").removeClass("slideUp");
            $("#dashsend").hide();


            $("#dashsendamt").addClass("invis");
            $("#dashsendamt").removeClass("slideUp");
            $("#dashsendamt").hide();


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


            $("#btnsendmoneystd").addClass("disabled");

            $("#addressinvalid").hide();
            $("#sendstdlbli").hide();

            $("#sendsubheading").text("send to " + SELECTEDFRIEND);

            $("#btnStdSndDone").hide();
            //$("#dashsend").addClass("invis");
            //$("#dashsend").removeClass("slideUp");
            $("#dashsend").hide();

            $("#friendheader").hide();

            $("#dashsendamt").show();
            $("#dashsendamt").removeClass("invis");
            $("#dashsendamt").addClass("slideUp");


            $("#mainWallet").hide();
            $(".footer").hide();


            networkpagestate = "friend";
            friendpagestate = "send";


            if (stdAmountConvCoin) {

                if (COINUNIT == "Bits") {

                    $("#numcdot").hide();

                } else {

                    $("#numcdot").show();

                }

            } else {

                $("#numcdot").show();

            }

            updateStdAmount();

        });

        $("#tapsend").bind('touchstart', function () {



            $("#btnsendmoneystd").addClass("disabled");
            $("#addressinvalid").hide();
            $("#sendstdlbli").hide();

            sendmode = "std";
            $("#sendsubheading").text('');
            $("#dashheader").hide();
            $("#dashprofile").hide();
            $("#dashboard").hide();

            $("#dashsend").show();
            $("#dashsend").removeClass("invis");
            $("#dashsend").addClass("slideUp");


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



            Engine.Device.getStorageItem("ok_disp", function (res) {

                if (!Engine.m_offlineKeyBackup || res == "1") {

                    bootbox.dialog({ title: '<div class="clear"><div class="h3 m-t-xs m-b-xs"><i class="fa fa-warning text-warning"></i>&nbsp;Security Warning</div><small class="text-muted"></small></div>', message: 'Backup your keys in Settings > Security Checklist.<br /><br />Currently, if you lose access to this application, you will lose access to any bitcoins you have stored in your wallet.', closeButton: false, buttons: {
                        main: {
                            label: "I Understand",
                            className: "btn-warning",
                            callback: function () {

                            }
                        }
                    }
                    });
                }

            });


            //dashreceive
            $("#dashheader").hide();
            $("#dashprofile").hide();

            $("#mainWallet").hide();

            $("#dashreceive").show();
            $("#dashreceive").removeClass("invis");
            //$("#dashreceive").addClass("slideUp");

            $(".footer").hide();

            profilepagestate = "receive";
            menustate = "profile"


            $('#requestaddressqr').hide();
            $('#requestaddresstxt').text('');
            $('#addresspanel').hide();


            setTimeout(function () {

                generateAddressClient()

            },

            50);


        });

        $("#taprequest").bind('touchstart', function () {

            window.setKeyboardScroll();

            $("#friend").css("border-color", "#ccc");
            $("#addcontactalert").hide();
            $("#addcontactalertmessage").text("");

            $("#networklistheader").hide();
            //$("#networklist").hide();
            $("#network").hide();

            $("#mainWallet").hide();
            $("#dashcontact").show();
            $("#dashcontact").removeClass("invis");
            $("#dashcontact").addClass("slideUp");

            $(".footer").hide();


        });


        $("#pairdeviceblob").change(function () {

            isPairing = true;

            deleteDeviceStorage();

            if ($("#pairdeviceblob").val().length > 10) {

                var check = $("#pairdeviceblob").val().split('|');

                $("#pairdevicealert").hide();

                if (check.length == 5) {

                    $("#loginpin").hide();
                    $("#pairstep1").hide();

                    $("#createWalletStart").hide();
                    $("#pairDevice").show();
                    $("#pairstep2").show();
                    $("#pairpwd").focus();


                } else {

                    bootbox.alert("There was a pairing error, please try again.");

                }
            } else {


                bootbox.alert("There was a pairing error, please try again.");

            }


        });


        $("#btnPairDevice").bind('touchstart', function () {

            $("#pairpwd").blur();

            isCreate = false;
            isPairing = true;

            pairDevice();


        });



        $("#friend").focus(function () {
            $("#addcontactqrslide").slideUp();
        });

        $("#friend").blur(function () {
            $("#addcontactqrslide").slideDown();
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



        $("#pastevalidate").bind('touchstart', function () {

            if (window.cordova) {

                cordova.plugins.clipboard.paste(function (text) {

                    text = text.replace(/\r?\n|\r/g, '');
                    $("#txtCode").val(text.trim());
                    $("#txtCode").trigger('change');

                }, function () {

                    //console.log("paste error");

                });
            }

        });

        $("#txtCode").bind('change', function () {

            var code = $("#txtCode").val();

            $("#txtCode").css("border-color", "#ccc");
            $("#validatefail").hide();
            $("#validatesuccess").hide();


            if (code.length > 40) {
                var bip39 = new BIP39();
                code = bip39.mnemonicToHex(code);
            }

            if (code.length != 40) {

                bootbox.alert("Invalid verification code");
                return;
            }


            $("#btnVerify").addClass("disabled");


            var isAccepted = false;

            if (FRIENDSLIST[selectedFriend.userName].IsSend) {
                isAccepted = true;
            }

            if (isAccepted) {


                Engine.verifyFriendData(SELECTEDFRIEND, code, function (err, result) {

                    if (result) {

                        $("#txtCode").val('');
                        $("#btnVerify").removeClass("disabled");
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

                        //$("#btnVerify").removeClass("disabled");
                        //$("#validatefail").show();
                        bootbox.alert("Invalid verification code");
                        $("#validateformmess").text('');
                    }

                }, function (message) {

                    $("#validateformmess").text(message);

                });

            } else {

                Engine.acceptFriendRequest(SELECTEDFRIEND, function (err, res) {

                    if (!err) {

                        Engine.verifyFriendData(SELECTEDFRIEND, code, function (err, result) {

                            if (!err) {

                                if (result) {

                                    $("#txtCode").val('');
                                    $("#btnVerify").removeClass("disabled");
                                    selectedFriend.validated = true;
                                    FRIENDSLIST[selectedFriend.userName].validated = true;

                                    updateSelectedFriend();
                                    updateFriendRequests();

                                    $("#validateformmess").text('');
                                    $("#networkvalidate").hide();
                                    $("#friendheader").show();
                                    $("#mainWallet").show();
                                    $(".footer").show();

                                    //update list also

                                    //find friend in list and update the validated icon
                                    $("#myfriends #seltarget" + selectedFriend.userName).html('<div class="pull-right text-success m-t-sm"><i class="fa fa-check-square" style="font-size:1.5em"></i></div>');


                                } else {


                                    bootbox.alert("Invalid verification code");
                                    $("#validateformmess").text('');

                                }

                            }

                        }, function (message) {

                            $("#validateformmess").text(message);

                        });

                    }


                }, function (message) {

                    $("#validateformmess").text(message);

                });

            }


        });


        //INVOICE STUFF START------------------------------------------

        $("#friendselector").hide();
        $("#invoice").hide();
        $("#invoicedisplay").hide();

        $("#btnpayinvoice").bind('touchstart', function () {

            $("#tapeditamt").hide();

            $(".footer").hide();

            $("#sendstds2add").text(SELECTEDFRIEND);

            $("#sendstds2amt").text(formatCoinAmount(convertFromSatoshis(selectedInvoiceAmount, COINUNIT)) + ' ' + COINUNIT);

            sendmode = 'inv';

            $('.numdone').attr("style", "background-color:white");
            $("#sendstdpin").val('');
            pintaps = 0;
            prevpin = '';

            networkpagestate = "friend";

            $("#invoices").hide();
            $("#mainWallet").hide();

            if (window.updateUIInterval) {
                clearInterval(window.updateUIInterval);
            }

            $("#pinconfdets").show();
            $("#pinconfirm").removeClass("blind");
            $("#pinconfirm").show();



        });

        $("#btnrejectinvoice").bind('touchstart', function () {

            Engine.updateInvoice(selectedInvoiceUserName, selectedInvoiceId, '', 2, function (err, result) {


                //loadInvoices(function (err, res) {

                lastInvoiceToPayCount = 0;

                showInvoiceListNetwork();

                updateSelectedFriend();

                networkpagestate = "friend";

                $("#invoices").hide();
                $("#mainWallet").show();
                $("#network").show();
                $("#pnlfriend").show();
                $("#friendheader").show();
                $(".footer").show();

            });
            // });

        });

        $("#payinvoicecancel").bind('touchstart', function () {


            $("#invoices").hide();
            $("#mainWallet").show();
            $("#network").show();
            $("#pnlfriend").show();
            $("#friendheader").show();
            $(".footer").show();
            $("#tapeditamt").show();

            //if (uiInvoiceReturnToNetwork) {
            //$("#hnetwork").click();
            //uiInvoiceReturnToNetwork = false;
            //}
            networkpagestate = "friend";

        });

    });


    var lastInvoiceToPayNetCount = 0;
    var uiInvoiceReturnToNetwork = false;

    var cachedInvoices = [];
    var cachedInvoicesByUser = [];

    function showInvoiceListNetwork() {

        //var invoices = _.filter(cachedInvoices, function (inv) { return inv.InvoiceFrom == SELECTEDFRIEND; });

        Engine.getInvoicesToPayNetwork(SELECTEDFRIEND, function (err, invoices) {


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

                s += "<div style=\"border-top-left-radius: 0px;border-top-right-radius: 0px\" id=\"viewinvoicenetfrom" + _.escape(invoices[i].InvoiceFrom) + _.escape(invoices[i].InvoiceId) + "\" class=\"media list-group-item\"><div class=\"pull-left\">" + _.escape(timeLabel) + "</div>" +
                                 "<div class=\"pull-right m-t-xs\">" + statusbox + "</div></div>";
            }

            cachedInvoices = invoices;

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


        });


    }

    var lastInvoiceByMeNetCount = 0;
    function showInvoiceByMeListNetwork() {

        //var invoices = _.filter(cachedInvoicesByUser, function (inv) { return inv.InvoiceFrom == SELECTEDFRIEND; });

        Engine.getInvoicesByUserNetwork(SELECTEDFRIEND, function (err, invoices) {

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

                    s += "<div style=\"border-top-left-radius: 0px;border-top-right-radius: 0px\" id=\"viewinvoicenetby" + invoices[i].InvoiceFrom + invoices[i].InvoiceId + "\" class=\"media list-group-item\"><div class=\"pull-left\">" + _.escape(timeLabel) + "</div>" +
                                 "<div class=\"pull-right m-t-xs\">" + statusbox + "</div></div>";
                }

                cachedInvoicesByUser = invoices;

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

        });

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

                    Engine.sendTransaction('invoice', friend, '', amount, "", function (err, transactionid) {

                        Engine.zeroDeviceKey();

                        if (!err) {

                            Engine.updateInvoice(friend, invoiceNumber, transactionid, 1, function (err, result) {

                                if (!err) {

                                    $('#textMessageSendStd').text('You paid invoice: ' + friend.toUpperCase() + invoiceNumber);

                                    updateStdAmount();


                                    prevNetworkTransCount = -1;
                                    prevtransfeed = -1;

                                    showTransactionNetwork();
                                    showTransactionFeed();

                                    updateUI();


                                    setTimeout(function () {
                                        $("#btnStdSndDone").show();
                                    }, 100);

                                    $("#sendstdpin").val('');
                                    $('.numdone').attr("style", "background-color:white");
                                    pintaps = 0;
                                    prevpin = '';

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
                                $('#textMessageSendStd').text('Transaction Failed: Insufficient funds');
                            }


                            $('.numdone').attr("style", "background-color:white");

                            $("#sendstdpin").val('');
                            pintaps = 0;
                            prevpin = '';

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


                $('.numdone').attr("style", "background-color:white");

                $("#sendstdpin").val('');
                pintaps = 0;
                prevpin = '';

                window.resetPin();


                if (ekey.substring(0, 6) == "ErrPIN") {

                    var attempts = ekey.substring(7, 8);

                    $("#pinconfcount").effect("shake");

                } else if (ekey.substring(0, 10) == "ErrBlocked") {

                    //if the login attempt has been blocked
                    //display a countdown to the user
                    //indicating when they can next attempt to
                    //login

                    var seconds = ekey.substring(11, ekey.length) * 1.0;

                    setCountdown(seconds);

                    // later on this timer may be stopped

                    $("#pincounter").effect("shake");

                } else {

                    bootbox.alert(ekey);

                }


            }

        });

    }


    //INVOICE FUNCTIONS END------------------------------------------


    function initialiseLocalSettings(callback) {

        //setup local settings
        Engine.Device.getStorageItem("currency", function (res) {

            if (res) {

                Engine.m_settings.LocalCurrency = res;

            } else {

                Engine.Device.setStorageItem("currency", Engine.m_settings.LocalCurrency);
            }

            //console.log(Engine.m_settings.LocalCurrency);
            //console.log(Engine.m_settings.CoinUnit);

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


                if (callback) {

                    callback();

                }

            });


        });

    }



    function updateProfile() {

        var length = Engine.m_nickname.length;

        $("#usernameProfile").text(Engine.m_nickname);
        $("#mystatus").text(Engine.m_statusText);


        var imageSrc = "images/avatar/128px/Avatar-" + pad(length) + ".png";
        var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";

        if (Engine.m_profileImage != '') {
            imageSrc = "https://ninkip2p.imgix.net/" + Engine.m_profileImage + "?crop=faces&fit=crop&h=128&w=128&mask=ellipse&border=1,d0d0d0";
            imageSrcSmall = "https://ninkip2p.imgix.net/" + Engine.m_profileImage + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
        }

        $("#imgProfile").attr("src", imageSrc);

    }


    function initialiseDashboardFromCache(callback) {

        //$("#dashsend").addClass("invis");
        //$("#dashsend").removeClass("slideUp");
        $("#dashsend").hide();

        // $("#dashreceive").addClass("invis");
        $("#dashreceive").removeClass("slideUp");
        $("#dashreceive").hide();

        $("#dashcontact").addClass("invis");
        $("#dashcontact").removeClass("slideUp");
        $("#dashcontact").hide();

        $('#invoices').hide();
        $('#network').hide();
        //$('#networklist').hide();
        $("#networklistheader").hide();
        $('#settings').hide();
        $("#settingsheader").hide();

        var length = Engine.m_nickname.length;
        if (length > 20) {
            length = 20;
        }


        initialiseLocalSettings(function () {

            COINUNIT = Engine.m_settings.CoinUnit;

            $("#mynickname").text(Engine.m_nickname);

            var fprint = Engine.m_pubKey.primaryKey.fingerprint;
            $("#hdcodeForFriend").val(fprint);
            $("#codeForFriend").text(fprint);

            //            var ffprint = '';
            //            for (var i = 0; i < fprint.length; i++) {
            //                if (i % 4 == 0) {
            //                    ffprint = ffprint + ' ' + fprint[i];
            //                } else {
            //                    ffprint = ffprint + fprint[i];
            //                }

            //                if (i == 19) {

            //                    $("#codeForFriend").text(ffprint);
            //                    ffprint = "";
            //                }
            //                if (i == 39) {
            //                    $("#codeForFriend2").text(ffprint);
            //                }
            //            }






            //prep the network tab
            $("#networklist").show();

            var data = Engine.m_fingerprint + ',' + Engine.m_nickname;
            var options = { text: data, width: 172, height: 172 };

            $('#fingerprintqr').text('');
            $('#fingerprintqr').qrcode(options);
            $('#qrcontscan').text('');
            $('#qrcontscan').qrcode(options);

            window.updateUIInterval = setInterval(function () {

                updateUI();

            }, 10000);


            window.updatePriceInterval = setInterval(function () {

                updatePrice();

            }, 10000);


            return callback("ok");


        });

    }


    function initialiseDashboard(callback) {

        //$("#dashsend").addClass("invis");
        //$("#dashsend").removeClass("slideUp");
        $("#dashsend").hide();

        // $("#dashreceive").addClass("invis");
        $("#dashreceive").removeClass("slideUp");
        $("#dashreceive").hide();

        $("#dashcontact").addClass("invis");
        $("#dashcontact").removeClass("slideUp");
        $("#dashcontact").hide();

        $('#invoices').hide();
        $('#network').hide();
        //$('#networklist').hide();
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

        var fprint = Engine.m_pubKey.primaryKey.fingerprint;

        $("#codeForFriend").text(fprint);
        $("#hdcodeForFriend").val(fprint);


        //        var ffprint = '';
        //        for (var i = 0; i < fprint.length; i++) {
        //            if (i % 4 == 0) {
        //                ffprint = ffprint + ' ' + fprint[i];
        //            } else {
        //                ffprint = ffprint + fprint[i];
        //            }

        //            if (i == 19) {

        //                $("#codeForFriend").text(ffprint);
        //                ffprint = "";
        //            }
        //            if (i == 39) {
        //                $("#codeForFriend2").text(ffprint);
        //            }
        //        }


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


            //updateUI();

            var data = Engine.m_fingerprint + ',' + Engine.m_nickname;
            var options = { text: data, width: 172, height: 172 };

            $('#fingerprintqr').text('');
            $('#fingerprintqr').qrcode(options);
            $('#qrcontscan').text('');
            $('#qrcontscan').qrcode(options);


            window.updateUIInterval = setInterval(function () {

                updateUI();

            }, 10000);

            window.updatePriceInterval = setInterval(function () {

                updatePrice();

            }, 10000);



        });

        initialiseLocalSettings();

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
        //location.reload();
    }





    var prevBlock = 0;

    function updateUI(callback) {

        if (stdAmountConvCoin) {
            $('#stdselunit').text(COINUNIT);
        } else {
            $('#stdselunit').text(Engine.m_settings.LocalCurrency);
        }

        $('#stdsendcunit').text(COINUNIT);

        $('#stdsendlcurr').text(Engine.m_settings.LocalCurrency);

        //Always
        updateBalance();

        showTransactionFeed();

        updateSelectedFriend();

        updateFriendRequests();

        updateFriends();

    }


    function displayPrice(result) {

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


    }

    function updatePrice(callback) {

        //Always
        Ninki.API.getPrice(Engine.m_guid, Engine.m_settings.LocalCurrency, function (err, result) {

            if (!err) {

                displayPrice(result);

                Engine.Device.setStorageItem("price", price);

            }

            if (callback) {
                callback();
            }

        });


    }

    function formatCoinAmount(amount) {

        var fmamt = '';

        if (COINUNIT == "BTC") {
            fmamt = accounting.formatNumber(amount, 8, ",", ".");
        } else {
            fmamt = accounting.formatNumber(amount, 2, ",", ".");
        }

        //if there is a dp then trim any 0 off the end
        //if the last char is a dot then trim also

        fmamt = fmamt.replace(/0+$/, '');
        fmamt = fmamt.replace(/\.+$/, '');
        return fmamt;
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



    var balanceDisplayType = "coin"; //currency
    var previousBalance = 0;

    $("#homebalancearea, #calcbalancearea").bind("touchstart", function () {

        if (balanceDisplayType == "coin") {
            balanceDisplayType = "currency";
        } else {
            balanceDisplayType = "coin";
        }

        var sbal = "";
        if (balanceDisplayType == "coin") {
            var fbal = '';
            if (COINUNIT == "BTC") {
                fbal = accounting.formatMoney(currentBalance, "", 8);

                var enddec = fbal.slice(-4);
                var chop = fbal.substring(0, fbal.length - 4);
                fbal = chop;

                if ((enddec * 1) > 0) {
                    sbal = enddec;
                }

            } else if (COINUNIT == "Bits") {

                fbal = accounting.formatMoney(currentBalance, "", 2);

                var enddec = fbal.slice(-2);
                var chop = fbal.substring(0, fbal.length - 3);
                fbal = chop;

                if ((enddec * 1) > 0) {
                    sbal = '.' + enddec;
                }

            } else {
                fbal = accounting.formatMoney(currentBalance, "", 2);
            }

            $("#homebalance").text(fbal);
            //$("#shomebalance").text(sbal);

            $("#homecoinunit").text(COINUNIT);

            $("#calcbalance").text(fbal);
            $("#scalcbalance").text(sbal);
            $("#calccoinunit").text(COINUNIT);

        } else {


            var fbal = convertToLocalCurrency(currentBalance);

            //$("#shomebalance").text('');
            $("#homebalance").html(fbal);
            $("#homecoinunit").text(Engine.m_settings.LocalCurrency);

            $("#scalcbalance").text('');
            $("#calcbalance").html(fbal);
            $("#calccoinunit").text(Engine.m_settings.LocalCurrency);

        }


        //updateBalance();

    });


    function displayBalance(data) {

        //get in units
        var balance = convertFromSatoshis(data.TotalBalance, COINUNIT);

        var sbal = "";
        if (balanceDisplayType == "coin") {
            var fbal = '';
            if (COINUNIT == "BTC") {
                fbal = accounting.formatMoney(balance, "", 8);

                var enddec = fbal.slice(-4);
                var chop = fbal.substring(0, fbal.length - 4);
                fbal = chop;

                if ((enddec * 1) > 0) {
                    sbal = enddec;
                }

            } else if (COINUNIT == "Bits") {

                fbal = accounting.formatMoney(balance, "", 2);

                var enddec = fbal.slice(-2);
                var chop = fbal.substring(0, fbal.length - 3);
                fbal = chop;

                if ((enddec * 1) > 0) {
                    sbal = '.' + enddec;
                }


            } else {
                fbal = accounting.formatMoney(balance, "", 2);
            }

            $("#homebalance").text(fbal);
            //$("#shomebalance").text(sbal);

            $("#homecoinunit").text(COINUNIT);

            $("#calcbalance").text(fbal);
            $("#scalcbalance").text(sbal);
            $("#calccoinunit").text(COINUNIT);

        } else {


            var fbal = convertToLocalCurrency(balance);

            //$("#shomebalance").text('');
            $("#homebalance").html(fbal);
            $("#homecoinunit").text(Engine.m_settings.LocalCurrency);

            $("#scalcbalance").text('');
            $("#calcbalance").html(fbal);
            $("#calccoinunit").text(Engine.m_settings.LocalCurrency);

        }


        var template = '';
        if (data.UnconfirmedBalance > 0) {
            template += '<i class="i i-hexagon2 i-xs-base text-warning-lt hover-rotate"></i><i class="i i-clock i-sm text-white"></i>';
        } else {
            template += '<i class="i i-hexagon2 i-xs-base text-success-lt hover-rotate"></i><i class="i i-checkmark i-sm text-white"></i>';
        }

        var templatecalc = '';
        if (data.UnconfirmedBalance > 0) {
            templatecalc += '<i class="i i-hexagon2 i-xs-base text-warning-lt hover-rotate" style="font-size:1.5em"></i><i class="i i-clock i-sm text-white"></i>';
        } else {
            templatecalc += '<i class="i i-hexagon2 i-xs-base text-success-lt hover-rotate" style="font-size:1.5em"></i><i class="i i-checkmark i-sm text-white"></i>';
        }

        $("#hometimer").html(template);
        $("#calctimer").html(templatecalc);

    }


    function updateBalance(callback) {

        Engine.getBalance(function (err, result) {

            if (!err) {

                //get in units
                var balance = convertFromSatoshis(result.TotalBalance, COINUNIT);

                currentBalance = balance;

                displayBalance(result);

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

                //cache the last balance result

                //var balcache = JSON.stringify(result);
                //Engine.Device.setSecureStorageObject("balance", balcache, Engine.m_password, Engine.encrypt, ONE_HOUR);


            } else {

                if (callback) {
                    callback(true, "Error");
                }

            }

        });



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



                    if (friends.length == 0 && lastNoOfFriends == 0) {
                        //$('#welcomenet').show();
                    } else {
                        $('#welcomenet').hide();


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

                                grouptemplate += '<div class="panel panel-default" style="border-radius: 0px; border-bottom: 0px;">';
                                grouptemplate += '<div class="panel-heading" style="border-radius: 0px; border-bottom: 0px; background-color:#ffffff;" data-toggle="collapse" data-parent="#accordion2" href="#collapse' + g + '">';
                                grouptemplate += '<a class="accordion-toggle h4 font-thin">';
                                grouptemplate += _.escape(key);
                                grouptemplate += '</a>';
                                grouptemplate += '</div>';
                                grouptemplate += '<div id="collapse' + g + '" class="panel-collapse in" style="border-radius: 0px; border-bottom: 0px;">';


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


                                    var template = '<a href="#" style="border-radius: 0px; border-bottom: 0px;" class="media list-group-item" id="friend' + k + '"><div class="media">' +
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

                                    ////console.log("added click " + k + " for " + friends[i].userName);

                                    k++;
                                }
                                g++;
                            }

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

        //can optimise futhermnu
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


            showTransactionNetwork();

            lastInvoiceToPayNetCount = 0;
            lastInvoiceByMeNetCount = 0;

            showInvoiceListNetwork();
            showInvoiceByMeListNetwork();



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


            if (!err) {
                //if origin of friend request is qrcode
                //and no phrase cache
                //delay for 60 seconds
                //add accept with scan button
                //then return to standard after 5 minutes

                var friends = [];
                for (var i = 0; i < ofriends.length; i++) {


                    //|| ofriends[i].ICanReceive
                    if (contactPhraseCache[ofriends[i].userName]) {
                        //acceptAndValidateFriend(ofriends[i].userName);
                    } else {
                        friends.push(ofriends[i]);
                    }

                }


                if (friends.length > 0) {
                    $("#dashrequests").show();
                    $('#welcomenet').hide();
                } else {
                    $("#dashrequests").hide();
                }



                if (lastNoOfFriendsReq != friends.length || friends.length == 0) {

                    lastNoOfFriendsReq = friends.length;


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

            }
        });



    }

    $('#btnContactRequestClose').bind('touchstart', function () {

        $("#contactrequest").hide();
        $("#mainWallet").show();
        $("#network").show();
        $("#networklistheader").show();
        $(".footer").show();
        $("#friendrequestp1").show();
        $("#friendrequestp2").hide();

    });


    $('#btnAcceptContactDone').bind('touchstart', function () {

        $("#contactrequest").hide();
        $("#mainWallet").show();
        $("#network").show();
        $("#networklistheader").show();
        $(".footer").show();
        $("#friendrequestp1").show();
        $("#friendrequestp2").hide();

    });


    $('#btnContactReject').bind('touchstart', function () {

        rejectFriend(selectedFriendRequest, function (err, res) {

            if (!err) {

                selectedFriendRequest = '';
                updateFriendRequests();

                $("#friendrequestusername").text('');
                $("#contactrequest").hide();
                $("#mainWallet").show();
                $("#network").show();
                $("#networklistheader").show();
                $(".footer").show();
            }

        });

    });



    var prevtimeline = -1;
    var timelineCache = [];
    var allTimeline = [];

    function showTransactionFeedNew(callback) {

        Engine.getTimeline(function (err, timeline) {


            if (!err) {

                if (timeline.length == 0) {
                    $('#welcometran').show();
                    $('#nowelcome').hide();

                } else {
                    $('#welcometran').hide();
                    $('#nowelcome').show();
                }


                allTimeline = timeline;
                timelineCache = timeline;

                if (timeline.length != prevtimeline) {

                    for (var i = 0; i < allTimeline.length; i++) {
                        var d1 = new Date(allTimeline[i].TransDateTime);
                        allTimeline[i].JsDate = new Date(timeline[i].TimelineDate.match(/\d+/)[0] * 1);
                    }

                    prevtimeline = timeline.length;

                    $('#transfeed').empty();

                    var template = '';

                    for (var i = 0; i < timeline.length && i < 51; i++) {

                        var length = timeline[i].UserName.length;
                        if (length > 20) {
                            length = 20;
                        }

                        var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";

                        if (timeline[i].UserName != 'External') {
                            if (timeline[i].UserNameImage) {
                                if (timeline[i].UserNameImage != '') {
                                    imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(timeline[i].UserNameImage) + "?crop=faces&fit=crop&h=128&w=128&mask=ellipse&border=1,d0d0d0";
                                }
                            }
                        }

                        var amountLabel = "";
                        var friendLabel = "";

                        if (timeline[i].TimelineType == 'TS') {
                            amountLabel = "sent " + formatCoinAmount(convertFromSatoshis(timeline[i].Amount, COINUNIT)) + " " + _.escape(COINUNIT);
                            //amountLabel = " sent 1 BTC";
                            friendLabel = "to " + _.escape(timeline[i].UserName);
                        }

                        if (timeline[i].TimelineType == 'TR') {
                            amountLabel = "received " + formatCoinAmount(convertFromSatoshis(timeline[i].Amount, COINUNIT)) + " " + _.escape(COINUNIT);
                            //amountLabel = " received 1 BTC";
                            friendLabel = "from " + _.escape(timeline[i].UserName);
                        }


                        if (timeline[i].TimelineType == "IS") {
                            amountLabel = "invoice";
                            friendLabel = "sent to " + _.escape(timeline[i].UserName);
                        }

                        if (timeline[i].TimelineType == "IR") {
                            amountLabel = "invoice";
                            friendLabel = "from " + _.escape(timeline[i].UserName);
                        }

                        if (timeline[i].TimelineType == "FRS") {
                            amountLabel = "contact request";
                            friendLabel = "sent to " + _.escape(timeline[i].UserName);
                        }

                        if (timeline[i].TimelineType == "FRR") {
                            amountLabel = "contact request";
                            friendLabel = "from " + _.escape(timeline[i].UserName);
                        }

                        var trdate = new Date(timeline[i].TimelineDate.match(/\d+/)[0] * 1);
                        var timeLabel = prettydate.format(trdate);

                        template += '<a href="#" class="list-group-item clearfix" id="dtran' + i + '">';
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
                        template += '<div class="trntime">';
                        template += timeLabel;
                        template += '</div>';
                        template += '</span>';

                        template += '<span class="clear">';
                        template += '<span>';

                        if (timeline[i].TimelineType == 'TS' || timeline[i].TimelineType == 'TR') {
                            template += '<div class="conf">';
                            if (timeline[i].Confirmations < 6) {
                                template += '<span class="badge bg-warning pull-right">';
                                template += _.escape(timeline[i].Confirmations);
                                template += '</span>';
                            }
                            template += '</div>';
                        }

                        template += '<small class="text-muted clear text-ellipsis">';
                        template += friendLabel;
                        template += '</small>';
                        template += '</span>';
                        template += '</a>';

                    }

                    $('#transfeed').html(template);

                }


                //cache main screen items
                //transaction list / price / balance

                if (callback) {
                    return callback(err, "ok");
                }

            } else {

                if (callback) {
                    return callback(err, transactions);
                }
            }

        });

    }



    var prevtransfeed = -1;
    var transactionCache = [];

    function showTransactionFeed(callback) {

        Engine.getTransactionFeed(function (err, transactions) {


            if (!err) {

                if (transactions.length == 0) {
                    $('#welcometran').show();
                    $('#nowelcome').hide();

                } else {
                    $('#welcometran').hide();
                    $('#nowelcome').show();
                }


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

                        var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";

                        if (transactions[i].UserName != 'External') {
                            if (transactions[i].UserNameImage) {
                                if (transactions[i].UserNameImage != '') {
                                    imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(transactions[i].UserNameImage) + "?crop=faces&fit=crop&h=128&w=128&mask=ellipse&border=1,d0d0d0";
                                }
                            }
                        }

                        var amountLabel = "";
                        var friendLabel = "";

                        if (transactions[i].TransType == 'S') {
                            amountLabel = "sent " + formatCoinAmount(convertFromSatoshis(transactions[i].Amount, COINUNIT)) + " " + _.escape(COINUNIT);
                            friendLabel = "to " + _.escape(transactions[i].UserName);
                        }

                        if (transactions[i].TransType == 'R') {
                            amountLabel = "received " + formatCoinAmount(convertFromSatoshis(transactions[i].Amount, COINUNIT)) + " " + _.escape(COINUNIT);
                            friendLabel = "from " + _.escape(transactions[i].UserName);
                        }


                        var trdate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1);
                        var timeLabel = prettydate.format(trdate);

                        template += '<a href="#" style="border-radius: 0px;" class="list-group-item clearfix" id="dtran' + i + '">';
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
                        template += '<div class="trntime">';
                        template += timeLabel;
                        template += '</div>';
                        template += '</span>';

                        template += '<span class="clear">';
                        template += '<span><div class="conf">';
                        if (transactions[i].Confirmations < 6) {
                            template += '<span class="badge bg-warning pull-right">';
                            template += _.escape(transactions[i].Confirmations);
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


                //cache main screen items
                //transaction list / price / balance

                if (callback) {
                    return callback(err, "ok");
                }

            } else {

                if (callback) {
                    return callback(err, transactions);
                }
            }

        });

    }

    var prevNetworkTransCount = 0;

    function showTransactionNetwork(callback) {

        Engine.getTransactionsForNetwork(SELECTEDFRIEND, function (err, transactions) {

            if (prevNetworkTransCount < transactions.length) {

                prevNetworkTransCount = transactions.length;

                var template = '';

                for (var i = 0; i < transactions.length; i++) {

                    var amountLabel = "";
                    var friendLabel = "";

                    if (transactions[i].TransType == 'S') {
                        amountLabel = "sent " + formatCoinAmount(convertFromSatoshis(transactions[i].Amount, COINUNIT)) + " " + _.escape(COINUNIT);
                        friendLabel = "to " + _.escape(transactions[i].UserName);
                    }

                    if (transactions[i].TransType == 'R') {
                        amountLabel = "received " + formatCoinAmount(convertFromSatoshis(transactions[i].Amount, COINUNIT)) + " " + _.escape(COINUNIT);
                        friendLabel = "from " + _.escape(transactions[i].UserName);
                    }


                    var trdate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1);
                    var timeLabel = prettydate.format(trdate);

                    template += '<a style=\"border-top-left-radius: 0px;border-top-right-radius: 0px\" href="#" class="list-group-item clearfix" id="ntran' + i + '">';
                    template += '<span class="clear">';

                    template += '<span>';
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
                        template += _.escape(transactions[i].Confirmations);
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

                    //console.log('updating 1');

                });

                $('#netpayfeed .trntime').each(function (index, elem) {

                    var tran = allTransactions[transactionIndex[transactions[index].TransactionId]];

                    var trdate = new Date(tran.TransDateTime.match(/\d+/)[0] * 1);

                    var timeLabel = prettydate.format(trdate);

                    $(elem).html(timeLabel);

                    //console.log('updating 2');

                });

            }

        });

    }


    var transactionDetailMode = 'dashboard';

    function displayTransactionDetails(tran, mode) {

        transactionDetailMode = mode;

        var trdate = new Date(tran.TransDateTime.match(/\d+/)[0] * 1).toString("yyyy-MM-dd HH:mm tt");

        $(".footer").hide();


        $("#infotrandate").text(_.escape(trdate));
        $("#infotranid").text(_.escape(tran.TransactionId.substring(0, 30) + '...'));
        $("#infotranaddress").text(_.escape(tran.Address));
        $("#infotranamount").text(_.escape(formatCoinAmount(convertFromSatoshis(tran.Amount, COINUNIT)) + ' ' + COINUNIT));
        $("#infotransent").text(_.escape(tran.TransType));


        $("#infofulltran").val(_.escape(tran.TransactionId));

        if (transactionDetailMode == 'dashboard') {
            profilepagestate = "trans";
            $("#dashheader").hide();
        } else {
            //networkpagestate = "trans";
            $("#friendheader").hide();
        }

        $("#mainWallet").hide();


        $("#transview").show();
        $("#transview").removeClass("invis");
        $("#transview").addClass("slideUp");


    }


    function generateAddressClient() {


        $("#newaddrspinner").show();
        var target = document.getElementById('newaddrspinner');
        var spinner = new Spinner(spinneropts).spin(target);

        Engine.createAddress('m/0/0', 1, function (err, newAddress, path) {

            if (!err) {

                var options = { text: 'bitcoin:' + newAddress, width: 172, height: 172 };

                $('#requestaddressqr').show();
                $('#requestaddressqr').text('');
                $('#requestaddressqr').qrcode(options);

                $('#requestaddresstxt').text(newAddress);

                //$('#requestaddress').text(tempate);
                $("#newaddrspinner").hide();
                $('#requestaddress').show();
                $('#addresspanel').show();

            } else {
                $('#requestaddressqr').hide();
                $('#requestaddress').show();
                $("#newaddrspinner").hide();
                $('#addresspanel').hide();


                bootbox.alert(newAddress);

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

                        Engine.sendTransaction('friend', friend, "", amount, "", function (err, transactionid) {

                            Engine.zeroDeviceKey();

                            if (!err) {

                                $('#textMessageSendStd').text('You sent ' + convertFromSatoshis(amount, COINUNIT) + ' ' + COINUNIT + ' to ' + friend);


                                prevNetworkTransCount = -1;
                                prevtransfeed = -1;

                                showTransactionNetwork();
                                showTransactionFeed();
                                updateBalance();

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
                                    $('#textMessageSendStd').text('Transaction Failed: Insufficient funds');
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

                    window.resetPin();

                    if (ekey.substring(0, 6) == "ErrPIN") {

                        var attempts = ekey.substring(7, 8);

                        //$("#pinconfmessage").text("Incorrect PIN " + attempts + "/3 attempts");

                        $("#pinconfcount").effect("shake");

                    } else if (ekey.substring(0, 10) == "ErrBlocked") {

                        //if the login attempt has been blocked
                        //display a countdown to the user
                        //indicating when they can next attempt to
                        //login

                        var seconds = ekey.substring(11, ekey.length) * 1.0;

                        setCountdown(seconds);

                        // later on this timer may be stopped

                        $("#pincounter").effect("shake");

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

                        Engine.sendTransaction('standard', '', address, amount, '', function (err, transactionid) {

                            Engine.zeroDeviceKey();

                            if (!err) {

                                $('#textMessageSendStd').html('You sent ' + _.escape(convertFromSatoshis(amount, COINUNIT)) + ' ' + _.escape(COINUNIT) + ' to <span style="word-wrap:break-word;">' + _.escape(address) + '</span>');

                                prevtransfeed = -1;

                                showTransactionFeed();
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
                                    $('#textMessageSendStd').text('Transaction Failed: Insufficient funds');
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

                    } else if (ekey.substring(0, 10) == "ErrBlocked") {

                        //if the login attempt has been blocked
                        //display a countdown to the user
                        //indicating when they can next attempt to
                        //login

                        var seconds = ekey.substring(11, ekey.length) * 1.0;

                        setCountdown(seconds);

                        // later on this timer may be stopped

                        $("#pincounter").effect("shake");

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

    var checkAndValidateTimerExpired = null;


    function clearCheckAndValidateTimer() {
        //console.log('clearing timer');
        clearInterval(checkAndValidateTimer);
    }


    function checkAndValidateFriendRequests() {


        //console.log('checking...');

        $("#textAddContact").text('Verifying request...');

        $("#addcontactprognum").text("10%");
        $("#addcontactprogstatus").width("10%");

        Engine.getFriendRequests(function (err, ofriends) {

            //console.log('found ' + ofriends.length);

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

                            clearTimeout(checkAndValidateTimerExpired);

                            $("#addcontactprognum").text("100%");
                            $("#addcontactprogstatus").width("100%");

                            setTimeout(function () {

                                $("#addcontactmodal").hide();

                                $("#dashcontact").addClass("invis");
                                $("#dashcontact").removeClass("slideUp");
                                $("#dashcontact").hide();

                                $("#contactrequest").hide();

                                $("#mainWallet").show();
                                $("#network").show();
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


                $("#acceptcontactprognum").text('90%');
                $("#acceptcontactprog").width('90%');

                setTimeout(function () {
                    $("#friendrequestusername").text('');
                    $("#btnAcceptContactDone").show();
                    $("#acceptcontactprogmess").text("You accepted the contact request from " + selectedFriendRequest);
                    $("#acceptcontactprognum").text('100%');
                    $("#acceptcontactprog").width('100%');
                    selectedFriendRequest = '';
                }, 500);


                updateFriendRequests(function (err, result) {

                    updateFriends(function (err, result) {


                    });

                });

            } else {

                $("#friendrequestp1").show();
                $("#friendrequestp2").hide();

            }

        });

    });




    $("#tapcancelscan").bind("touchstart", function () {

        clearCheckAndValidateTimer();

        //timed out so return the user to screen

        clearTimeout(checkAndValidateTimerExpired);

        $("#addcontactmodal").hide();

        $("#dashcontact").addClass("invis");
        $("#dashcontact").removeClass("slideUp");
        $("#dashcontact").hide();

        $("#contactrequest").hide();

        $("#mainWallet").show();
        $("#network").show();
        $("#networklistheader").show();

        if ($("#isactive").val() == 1) {
            $(".footer").show();

        } else {
            $("#footermode").val(1);
        }


        $("#friendrequestp1").show();
        $("#friendrequestp2").hide();

    });

    var currentContactExchange = '';

    //function when connecting from main add contact screen
    $("#hdqrcontact").change(function () {


        $("#btnAddContactDone").hide();

        //console.log('event triggered');
        //console.log($("#hdqrcontact").val());

        var res = $("#hdqrcontact").val();


        if (res.indexOf(",") > -1) {

            var sres = res.split(',');
            var phrase = sres[0];
            var username = sres[1];

            //console.log(phrase);
            //console.log(username);

            currentContactExchange = username;

            registerCode(username, phrase);

            $("#addcontactmodal").show();

            $("#dashcontact").addClass("invis");
            $("#dashcontact").removeClass("slideUp");
            $("#dashcontact").hide();


            $("#textAddContact").text('Verifying user...');


            $("#addcontactprog").show();

            $("#addcontactprognum").text("10%");
            $("#addcontactprogstatus").width("10%");


            Engine.doesUsernameExist(username, function (err, usernameExistsOnServer) {

                //also check if friend already

                if (usernameExistsOnServer) {


                    //console.log('username exists');

                    $("#addcontactprognum").text("30%");
                    $("#addcontactprogstatus").width("30%");

                    $("#textAddContact").text('Verifying network...');

                    //if no friendrequest- create one and wait
                    //if it exists, then accept and validate
                    //if alread accepted then just validate

                    Engine.getFriendRequests(function (err, ofriends) {


                        if (!err) {

                            //console.log("logging friend request filter...");
                            //console.log(ofriends);

                            var friends = _.filter(ofriends, function (frn) { return frn.userName == username; });

                            //console.log(friends);

                            if (friends.length == 0) {

                                //console.log('friend request does not exist');

                                //if network doesnt exist create friend

                                Engine.isNetworkExist(username, function (err, result) {

                                    if (!err) {

                                        if (!result) {


                                            //console.log('network does not exist');

                                            $("#textAddContact").text('Deriving addresses...');

                                            $("#addcontactprognum").text("60%");
                                            $("#addcontactprogstatus").width("60%");

                                            //console.log('creating friend...');

                                            Engine.createFriend(username, "#qrcontactmess", function (err, result) {


                                                //console.log('create friend ' + result);

                                                if (err) {

                                                    //$("#addcontactmodal").hide();
                                                    //$("#imgaddcontactwaiting").hide();
                                                    //$("#qrcontactalert").show();
                                                    $("#textAddContact").text("Error adding contact");
                                                    $("#btnAddContactDone").show();

                                                } else {


                                                    //if there is a pending friend request
                                                    //skip this bit

                                                    //console.log('added timer for check and validate');
                                                    //here we go to - now you friend should scan this code
                                                    checkAndValidateTimer = setInterval(function () {
                                                        checkAndValidateFriendRequests();
                                                    }
                                             , 2000);

                                                    //listen for 2 minutes
                                                    checkAndValidateTimerExpired = setTimeout(function () {


                                                        clearCheckAndValidateTimer();

                                                        //timed out so return the user to screen


                                                        $("#addcontactmodal").hide();

                                                        $("#dashcontact").addClass("invis");
                                                        $("#dashcontact").removeClass("slideUp");
                                                        $("#dashcontact").hide();

                                                        $("#contactrequest").hide();

                                                        $("#mainWallet").show();
                                                        $("#network").show();
                                                        $("#networklistheader").show();

                                                        if ($("#isactive").val() == 1) {
                                                            $(".footer").show();
                                                        } else {
                                                            $("#footermode").val(1);
                                                        }


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
                                                        $("#dashcontact").hide();

                                                        $("#contactrequest").hide();

                                                        $("#mainWallet").show();
                                                        $("#network").show();
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

                                    } else {

                                        $("#textAddContact").text(result);
                                        $("#btnAddContactDone").show();
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
                                            $("#dashcontact").hide();

                                            $("#contactrequest").hide();

                                            $("#mainWallet").show();
                                            $("#network").show();
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
                        } else {

                            //error so handle gracefully

                            $("#textAddContact").text("Error adding contact");
                            $("#btnAddContactDone").show();

                        }
                    });

                } else {



                }
            });

        } else {

            bootbox.alert("There was an error scanning the QR code, please try again.");

        }


    });



    $("#hdvalcontact").change(function () {


        $("#btnAddContactDone").hide();

        //console.log('caught event...');

        var res = $("#hdvalcontact").val();

        if (res.indexOf(",") > -1) {

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

        } else {

            bootbox.alert("There was an error scanning the QR code, please try again.");

        }
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
                                    $("#dashcontact").hide();

                                    $("#contactrequest").hide();

                                    $("#mainWallet").show();
                                    $("#network").show();
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

    function rejectFriend(username, callback) {

        Engine.rejectFriendRequest(username, function (err, result) {

            if (!err) {
                updateFriendRequests();
            }

            return callback(err, result);

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


    //loginPIN
    //this function takes the user's input PIN number 
    //and authenticates the user
    //if the user has not previosuly authenticated it downloads and decrypts
    //all the relevant wallet data
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
                    //if no error the PIN is valid
                    if (!err) {

                        if (!(typeof window.app === 'undefined')) {
                            app.isScanning = true;
                        }

                        //is the app previosuly intialised


                        if (Engine.m_appInitialised) {

                            //if so simply change the UI state
                            //a session with the server has been established

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


                            if (!(typeof window.app === 'undefined')) {
                                app.isScanning = false;
                            }

                            $("#isactive").val(1);

                            updateUI();

                            //refresh account settings in case they were updated
                            //in the chrome app
                            Engine.getAccountSettings(function (err, res) {

                                if (!err) {

                                    //only set the settings we need to refresh for the mobile apps
                                    var settingsObject = JSON.parse(res);

                                    Engine.m_settings.MinersFee = settingsObject.MinersFee;
                                    Engine.m_settings.TwoFactor = settingsObject.TwoFactor;
                                    Engine.m_settings.EmailVerified = settingsObject.EmailVerified;


                                    if (Engine.m_settings.TwoFactor) {
                                        $("#secheck2fa").show();
                                        $("#sechev2fa").hide();
                                    } else {
                                        $("#secheck2fa").hide();
                                        $("#sechev2fa").show();
                                    }


                                    if (Engine.m_settings.EmailVerified) {
                                        $("#secheckemail").show();
                                        $("#sechevemail").hide();
                                    } else {
                                        $("#secheckemail").hide();
                                        $("#sechevemail").show();
                                    }


                                }

                            });

                            //refresh user profile data incase they updated
                            //it via the chrome app
                            Engine.getUserProfile(function (err, data) {

                                data = JSON.parse(data);

                                Engine.m_profileImage = data.ProfileImage;
                                Engine.m_statusText = data.Status;
                                m_this.m_offlineKeyBackup = data.OfflineKeyBackup;

                                var currentBalanceInSatoshis = convertToSatoshis(currentBalance, COINUNIT);


                                Engine.Device.getStorageItem("ok_disp", function (res) {

                                    if (!Engine.m_offlineKeyBackup || res == "1") {

                                        if (currentBalanceInSatoshis >= 2500000) {

                                            bootbox.dialog({ title: '<div class="clear"><div class="h3 m-t-xs m-b-xs"><i class="fa fa-warning text-warning"></i>&nbsp;Security Warning</div><small class="text-muted"></small></div>', message: 'Backup your keys in Settings > Security Checklist.<br /><br />Currently, if you lose access to this application, you will lose access to any bitcoins you have stored in your wallet.', closeButton: false, buttons: {
                                                main: {
                                                    label: "I Understand",
                                                    className: "btn-warning",
                                                    callback: function () {

                                                    }
                                                }
                                            }
                                            });

                                        }

                                    }

                                });

                                Engine.Device.getStorageItem("ok_disp", function (res) {

                                    if (Engine.m_offlineKeyBackup && res == "") {
                                        $("#secheckkeys").show();
                                        $("#secchevkeys").hide();

                                    } else {
                                        $("#secheckkeys").hide();
                                        $("#secchevkeys").show();
                                    }

                                });

                                updateProfile();

                            });


                            //refresh the UI state every 10 seconds
                            window.updateUIInterval = setInterval(function () {

                                updateUI();

                            }, 10000);

                            window.updatePriceInterval = setInterval(function () {

                                updatePrice();

                            }, 10000);



                        } else {


                            //disable keyboard scrolling in phone app
                            if (window.cordova) {
                                cordova.plugins.Keyboard.disableScroll(true);
                            }

                            //initialise from cache
                            Engine.Device.getSecureStorageObject("dataCache", Engine.m_deviceKey, Engine.decrypt, false, function (res) {

                                if (res != "") {

                                    Engine.initialize(JSON.parse(res));
                                    Engine.setSecDeviceKey();
                                    Engine.zeroDeviceKey();

                                    var target = document.getElementById('pairspinner');
                                    var spinner = new Spinner(spinneropts).spin(target);
                                    pinlock = false;

                                    $("#pairspinner").show();
                                    $("#pinspinner").hide();
                                    $('.numdone').attr("style", "background-color:white");
                                    $("#loginpin").hide();
                                    $("#loginpinno").val('');
                                    $("#paddel").hide();
                                    $("#pinloginmessage").text("Enter your PIN number");

                                    //initilaise the UI elements
                                    initialiseDashboardFromCache(function () {

                                        Engine.Device.getStorageItem("price", function (res) {

                                            displayPrice(JSON.parse(res));

                                        });


                                        updateUI();

                                        Engine.m_appInitialised = true;

                                        $("#isactive").val(1);

                                        $("#pairspinner").hide();

                                        $('#dashboard').show();
                                        $('#dashheader').show();

                                        $("#mainWallet").show();
                                        $("#footermode").val(1);
                                        $(".footer").show();

                                        $("#nonlogin").show();


                                        if (!(typeof window.app === 'undefined')) {
                                            app.isScanning = false;
                                        }


                                        //refresh account settings in case they were updated
                                        //in the chrome app
                                        Engine.getAccountSettings(function (err, res) {

                                            if (!err) {

                                                //only set the settings we need to refresh for the mobile apps
                                                var settingsObject = JSON.parse(res);

                                                Engine.m_settings.MinersFee = settingsObject.MinersFee;
                                                Engine.m_settings.TwoFactor = settingsObject.TwoFactor;
                                                Engine.m_settings.EmailVerified = settingsObject.EmailVerified;

                                                if (Engine.m_settings.TwoFactor) {
                                                    $("#secheck2fa").show();
                                                    $("#sechev2fa").hide();
                                                } else {
                                                    $("#secheck2fa").hide();
                                                    $("#sechev2fa").show();
                                                }


                                                if (Engine.m_settings.EmailVerified) {
                                                    $("#secheckemail").show();
                                                    $("#sechevemail").hide();
                                                } else {
                                                    $("#secheckemail").hide();
                                                    $("#sechevemail").show();
                                                }



                                                //refresh user profile data incase they updated
                                                //it via the chrome app
                                                Engine.getUserProfile(function (err, data) {

                                                    data = JSON.parse(data);

                                                    m_this.m_profileImage = data.ProfileImage;
                                                    m_this.m_statusText = data.Status;
                                                    m_this.m_offlineKeyBackup = data.OfflineKeyBackup;


                                                    var currentBalanceInSatoshis = convertToSatoshis(currentBalance, COINUNIT);

                                                    Engine.Device.getStorageItem("ok_disp", function (res) {

                                                        if (!Engine.m_offlineKeyBackup || res == "1") {

                                                            if (currentBalanceInSatoshis >= 2500000) {

                                                                bootbox.dialog({ title: '<div class="clear"><div class="h3 m-t-xs m-b-xs"><i class="fa fa-warning text-warning"></i>&nbsp;Security Warning</div><small class="text-muted"></small></div>', message: 'Backup your keys in Settings > Security Checklist.<br /><br />Currently, if you lose access to this application, you will lose access to any bitcoins you have stored in your wallet.', closeButton: false, buttons: {
                                                                    main: {
                                                                        label: "I Understand",
                                                                        className: "btn-warning",
                                                                        callback: function () {

                                                                        }
                                                                    }
                                                                }

                                                                });

                                                            }

                                                        }

                                                    });

                                                    Engine.Device.getStorageItem("ok_disp", function (res) {

                                                        if (Engine.m_offlineKeyBackup && res == "") {
                                                            $("#secheckkeys").show();
                                                            $("#secchevkeys").hide();
                                                        } else {
                                                            $("#secheckkeys").hide();
                                                            $("#secchevkeys").show();
                                                        }


                                                        if (Engine.m_offlineKeyBackup && res == "" && !Engine.m_settings.EmailVerified) {

                                                            $("#sechevemail i").removeClass("text-muted");
                                                            $("#sechevemail i").addClass("text-primary");

                                                        }

                                                        if (Engine.m_offlineKeyBackup && res == "" && Engine.m_settings.EmailVerified) {

                                                            $("#sechev2fa i").removeClass("text-muted");
                                                            $("#sechev2fa i").addClass("text-primary");

                                                        }

                                                    });

                                                    updateProfile();

                                                });


                                            }

                                        });

                                    });


                                } else {

                                    //if the app has not been initialised then we need to download the wallet data

                                    //test this execution


                                    $("#pairspinner").show();

                                    var target = document.getElementById('pairspinner');
                                    var spinner = new Spinner(spinneropts).spin(target);
                                    pinlock = false;

                                    $("#pinspinner").hide();
                                    $('.numdone').attr("style", "background-color:white");
                                    $("#loginpin").hide();
                                    $("#loginpinno").val('');

                                    $("#paddel").hide();
                                    $("#pinloginmessage").text("Enter your PIN number");


                                    //get the encrypted user's password from local storage
                                    Engine.Device.getSecureStorageObject("ninki_p", Engine.m_deviceKey, Engine.decryptNp, true, function (result) {

                                        Engine.setStretchPass(result);

                                        //get the encrypted 2fa override token from local storage
                                        Engine.Device.getSecureStorageObject("ninki_rem", Engine.m_deviceKey, Engine.decryptNp, true, function (fatoken) {

                                            if (fatoken.length > 0) {

                                                //use the token to open the wallet
                                                Engine.openWallet(guid, Bitcoin.convert.bytesToHex(fatoken), function (err, result) {

                                                    if (!err) {

                                                        //if this is true it means the 2fa token has expired
                                                        if (result.TwoFactorOnLogin) {

                                                            $("#pairspinner").hide();
                                                            $("#loginpinno").val('');
                                                            pinlock = false;

                                                        } else {

                                                            //create an encrypted cache to enable quick reloading of app state

                                                            var dataToCache = Engine.serialize();

                                                            Engine.Device.setSecureStorageObject("dataCache", dataToCache, Engine.m_deviceKey, Engine.encrypt);

                                                            //initilaise the UI elements
                                                            initialiseDashboard(function () {


                                                                Engine.m_appInitialised = true;

                                                                $("#isactive").val(1);

                                                                $("#pairspinner").hide();

                                                                $('#dashboard').show();
                                                                $('#dashheader').show();

                                                                $("#mainWallet").show();
                                                                $("#footermode").val(1);
                                                                $(".footer").show();

                                                                $("#nonlogin").show();


                                                                if (!(typeof window.app === 'undefined')) {
                                                                    app.isScanning = false;
                                                                }


                                                            });


                                                        }

                                                    } else {



                                                        bootbox.alert("Please re-pair your device from the Chrome App.");

                                                        pinlock = false;

                                                        if (!(typeof window.app === 'undefined')) {
                                                            app.isScanning = false;
                                                        }


                                                        $("#pairspinner").hide();
                                                        $('.numdone').attr("style", "background-color:white");
                                                        $("#loginpin").show();
                                                        $("#loginpinno").val('');
                                                        $("#paddel").hide();
                                                        $("#pinloginmessage").text("Enter your PIN number");

                                                    }

                                                });

                                            }

                                        });

                                    });
                                }

                            });

                        }

                    } else {

                        $("#pinspinner").hide();

                        if (ekeyv == "ErrDeviceDestroyed") {

                            //remove this functionality

                        } else {


                            pinlock = false;

                            $("#loginpinno").val('');
                            $("#sendstdpin").val('');
                            $('.numdone').attr("style", "background-color:white");
                            $("#paddel").hide();

                            window.resetPin();

                            $("#paddelconf").hide();


                            if (ekeyv.substring(0, 6) == "ErrPIN") {

                                var attempts = ekeyv.substring(7, 8);

                                $("#pinloginmessage").text("Incorrect PIN " + attempts + "/3 attempts");
                                $("#pincounter").effect("shake");

                            } else if (ekeyv.substring(0, 10) == "ErrBlocked") {

                                //if the login attempt has been blocked
                                //display a countdown to the user
                                //indicating when they can next attempt to
                                //login

                                var seconds = ekeyv.substring(11, ekeyv.length) * 1.0;


                                setCountdown(seconds);

                                // later on this timer may be stopped

                                $("#pincounter").effect("shake");

                            } else {

                                bootbox.alert(ekeyv);

                            }

                            if (!(typeof window.app === 'undefined')) {
                                app.isScanning = false;
                            }
                        }

                    }

                });

            });

        } else {

            $("#pinspinner").hide();

        }

    }

    var countdownId = null;

    function setCountdown(seconds) {

        window.hideSecScreens();

        showLoginPIN();

        window.clearInterval(countdownId);

        var d1 = new Date(), d2 = new Date(d1);

        d2.setSeconds(d1.getSeconds() + seconds);

        countdownId = countdown(d2,
                function (ts) {
                    var testdate = new Date();
                    if (ts.value > 0) {

                        window.clearInterval(countdownId);
                        $("#pinloginmessage").text("Enter your PIN number");
                    } else {
                        $("#pinloginmessage").text(ts);
                    }
                }, countdown.SECONDS | countdown.MINUTES | countdown.HOURS);

    }


    function deleteDeviceStorage() {

        Engine.Device.deleteStorageItem("dataCache");
        Engine.Device.deleteStorageItem("ninki_rem");
        Engine.Device.deleteStorageItem("ninki_p");
        Engine.Device.deleteStorageItem("ninki_reg");
        Engine.Device.deleteStorageItem("ninki_h");
        Engine.Device.deleteStorageItem("guid");
        Engine.Device.deleteStorageItem("coinunit");
        Engine.Device.deleteStorageItem("currency");
        Engine.Device.deleteStorageItem("pubcachem00");
        Engine.Device.deleteStorageItem("pubcachem01");
        Engine.Device.deleteStorageItem("pair");
        Engine.Device.deleteStorageItem("price");
        Engine.Device.deleteStorageItem("dpk");

    }


    //device paring temp variables
    var deviceName = '';
    var secret = '';
    var enck = '';
    var iv = '';

    //the user scans a QR code containing data encrypted with the server generated encryption key

    function pairDevice() {

        //disable keyboard scrolling on phone apps
        if (window.cordova) {
            cordova.plugins.Keyboard.disableScroll(true);
        }

        $("#btnPairDevice").addClass("disabled");

        var blob = $('#pairdeviceblob').val();
        var pwd = $('#pairpwd').val();

        var splitBlob = blob.split('|');



        //check for bad qr scan
        if (splitBlob.length == 5) {


            //flag that a scan is in progress so PIN
            //screen does not show

            if (!(typeof window.app === 'undefined')) {
                app.isScanning = true;
            }

            var guid = splitBlob[2];

            //encrypted hot key and 2fa override token
            enck = splitBlob[0];
            iv = splitBlob[1];

            //device name eg. My iPhone
            deviceName = splitBlob[3];

            //registration token for this pairing attempt
            Engine.m_regToken = splitBlob[4];

            //password enetered by the user
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

                    if (!(typeof window.app === 'undefined')) {
                        app.isScanning = false;
                    }


                    $("#btnPairDevice").removeClass("disabled");

                    bootbox.alert("There was an error, please try again.");


                } else {

                    //decrypt packet and set the secret
                    //the user will be asked next to choose a PIN
                    var jpacket = JSON.parse(response);

                    secret = Engine.decryptNp(jpacket.packet, Engine.m_password, jpacket.IV);

                    Engine.validateSecret(secret, function (err, secvalid) {

                        if (!err) {

                            if (secvalid) {

                                //show pin screen

                                $('#createWalletStart').hide();
                                $("#btnPairDevice").removeClass("disabled");

                                $('#pairDevice').hide();
                                $('#loginpin').show();

                                if (!(typeof window.app === 'undefined')) {
                                    app.isScanning = false;
                                }
                            }

                        } else {

                            if (!(typeof window.app === 'undefined')) {
                                app.isScanning = false;
                            }

                            $("#btnPairDevice").removeClass("disabled");

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

            $("#btnPairDevice").removeClass("disabled");

            bootbox.alert("There was a pairing error, please try again.");

            // $('#pairdevicealertmessage').text("There was a pairing error");
            //$('#pairdevicealert').show();
        }

    }


    function regPIN() {

        //the user has chosen a PIN and can now register the deive with the server

        $("#pairspinner").show();

        var target = document.getElementById('pairspinner');
        var spinner = new Spinner(spinneropts).spin(target);

        $('#loginpin').hide();


        if (!(typeof window.app === 'undefined')) {
            app.isScanning = true;
        }

        //hash the pin and device id
        var deviceid = "DEVICE123456789";

        if (window.cordova) {
            deviceid = window.device.uuid;
        }


        //hash the PIN with the device id
        //this is used to validate the PIN and lookup the encryption key on our server

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

        //the device is registered with the server
        //authentication via:
        //generation of the pairing data required 2 factor authenticaton
        //  guid as an identifier
        //  registration token for this pairing session
        //secret, which proves the user knows their password
        //their chosen PIN number is registered with the server vi a hash of the PIN + Device uuid
        //a 256 bit encryption key is generated on the server using a CSPRNG, this is used to encrypt data stored on the device

        Engine.registerDevice(Engine.m_guid, deviceName, devplatform, devmodel, pinhash, Engine.m_regToken, secret, function (err, result) {

            if (!err) {

                var dk = JSON.parse(result);

                if (dk.DeviceKey.length > 0) {

                    //the server returns the encryption key
                    //whcih is used to decrypt the hotkey and 2fa override token

                    Engine.m_deviceKey = Bitcoin.convert.hexToBytes(dk.DeviceKey);

                    var decblob = Engine.decryptNp(enck, Engine.m_deviceKey, iv);

                    //slice it up
                    var hk = '';
                    var fatoken = '';

                    //supports 128bit and 256bit keys
                    if (decblob.length == 96) {
                        hk = decblob.substring(0, 32);
                        fatoken = decblob.substring(32, 96);
                    } else {
                        hk = decblob.substring(0, 64);
                        fatoken = decblob.substring(64, 128);
                    }

                    console.log('Hot key...');
                    console.log(hk);
                    console.log('2fa token...');
                    console.log(fatoken);
                    console.log('Dev key...');
                    console.log(dk.DeviceKey);


                    //test opening the wallet

                    Engine.openWallet(Engine.m_oguid, fatoken, function (err, result) {

                        if (!err) {

                            if (!result.TwoFactorOnLogin) {

                                //if succesfull store the encrypted data in local storage
                                Engine.Device.setStorageItem("guid", Engine.m_oguid);
                                Engine.Device.setStorageItem("ninki_reg", Engine.m_regToken);
                                Engine.Device.setStorageItem("pair", "1");


                                Engine.Device.setSecureStorageObject("ninki_rem", Bitcoin.convert.hexToBytes(fatoken), Engine.m_deviceKey, Engine.encryptNp);
                                //Engine.Device.setSecureStorageObject("ninki_p", Engine.m_password, Engine.m_deviceKey, Engine.encryptNp);
                                Engine.Device.setSecureStorageObject("ninki_h", Bitcoin.convert.hexToBytes(hk), Engine.m_deviceKey, Engine.encryptNp);

                                var dataToCache = Engine.serialize();

                                Engine.Device.setSecureStorageObject("dataCache", dataToCache, Engine.m_deviceKey, Engine.encrypt);

                                Engine.setSecDeviceKey();

                                Engine.zeroDeviceKey();

                                Engine.zeroByteArray(Engine.m_password);

                                pinlock = false;
                                isPairing = false;
                                isCreate = false;

                                $("#loginpinno").val('');
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


                                initialiseDashboard(function () {

                                    Engine.m_appInitialised = true;

                                    $("#pairspinner").hide();
                                    $('#dashboard').show();
                                    $('#dashheader').show();

                                    $("#footermode").val(1);
                                    $("#mainWallet").show();
                                    $(".footer").show();

                                    if (!(typeof window.app === 'undefined')) {
                                        app.isScanning = false;
                                    }

                                });

                            } else {

                                if (!(typeof window.app === 'undefined')) {
                                    app.isScanning = false;
                                }

                                $("#pairspinner").hide();
                                bootbox.alert("Could not pair", function () {

                                    location.reload();

                                });

                            }

                        } else {

                            if (!(typeof window.app === 'undefined')) {
                                app.isScanning = false;
                            }

                            $("#pairspinner").hide();

                            bootbox.alert(result, function () {

                                location.reload();

                            });

                        }

                    });
                } else {

                    if (!(typeof window.app === 'undefined')) {
                        app.isScanning = false;
                    }

                    $("#pairspinner").hide();

                    bootbox.alert("The pairing token has expired", function () {

                        location.reload();

                    });

                }


            } else {


                if (!(typeof window.app === 'undefined')) {
                    app.isScanning = false;
                }

                $("#pairspinner").hide();

                bootbox.alert(result, function () {

                    location.reload();

                });

            }

        });

        secret = '';

    }



    function regPINCreate() {

        //the user has chosen a PIN and can now register the deive with the server

        $("#pairspinner").show();
        var target = document.getElementById('pairspinner');
        var spinner = new Spinner(spinneropts).spin(target);

        $('#loginpin').hide();


        if (!(typeof window.app === 'undefined')) {
            app.isScanning = true;
        }

        //hash the pin and device id
        var deviceid = "DEVICE123456789";

        if (window.cordova) {
            deviceid = window.device.uuid;
        }


        //hash the PIN with the device id
        //this is used to validate the PIN and lookup the encryption key on our server

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

        //the device is registered with the server
        //authentication via:
        //generation of the pairing data required 2 factor authenticaton
        //  guid as an identifier
        //  registration token for this pairing session
        //secret, which proves the user knows their password
        //their chosen PIN number is registered with the server vi a hash of the PIN + Device uuid
        //a 256 bit encryption key is generated on the server using a CSPRNG, this is used to encrypt data stored on the device

        Engine.getRecoveryPacket(function (err, response) {

            if (err) {

                if (!(typeof window.app === 'undefined')) {
                    app.isScanning = false;
                }

                $("#btnPairDevice").removeClass("disabled");

                bootbox.alert("There was an error, please try again.");

            } else {

                //decrypt packet and set the secret
                //the user will be asked next to choose a PIN
                var jpacket = JSON.parse(response);

                secret = Engine.decryptNp(jpacket.packet, Engine.m_password, jpacket.IV);

                Engine.registerDevice(Engine.m_guid, deviceName, devplatform, devmodel, pinhash, Engine.m_regToken, secret, function (err, result) {

                    if (!err) {

                        if (!(typeof window.app === 'undefined')) {
                            app.isScanning = true;
                        }

                        Engine.Device.setStorageItem("guid", Engine.m_oguid);

                        //test opening the wallet

                        var fatoken = Bitcoin.convert.bytesToHex(Engine.m_deviceToken);
                        Engine.zeroByteArray(Engine.m_deviceToken);

                        Engine.openWallet(Engine.m_oguid, fatoken, function (err, result) {

                            if (!err) {

                                if (!result.TwoFactorOnLogin) {

                                    //if succesfull store the encrypted data in local storage

                                    var dataToCache = Engine.serialize();

                                    Engine.Device.setSecureStorageObject("dataCache", dataToCache, Engine.m_deviceKey, Engine.encrypt);

                                    Engine.setSecDeviceKey();

                                    Engine.zeroDeviceKey();

                                    pinlock = false;

                                    $("#loginpinno").val('');
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


                                        //don't show main wallet yet
                                        //show optional 2fa screen


                                        //$("#emailstep").show();

                                        $("#pairspinner").hide();

                                        $("#hotkeystep").hide();

                                        isCreate = false;

                                        $("#isactive").val(1);
                                        $("#loginpin").hide();


                                        $('#welcome').hide();
                                        $('#dashboard').show();
                                        $('#dashheader').show();

                                        $("#footermode").val(1);
                                        $("#mainWallet").show();
                                        $(".footer").show();


                                        if (!(typeof window.app === 'undefined')) {
                                            app.isScanning = true;
                                        }



                                    });

                                } else {


                                    $("#pairspinner").hide();
                                    bootbox.alert("Could not pair", function () {

                                        location.reload();

                                    });

                                }

                            } else {

                                //if (!(typeof window.app === 'undefined')) {
                                //    app.isScanning = false;
                                //}

                                $("#pairspinner").hide();

                                bootbox.alert(result, function () {

                                    location.reload();

                                });

                            }

                        });



                    } else {


                        //if (!(typeof window.app === 'undefined')) {
                        //    app.isScanning = false;
                        //}

                        $("#pairspinner").hide();
                        bootbox.alert(result, function () {

                            location.reload();

                        });

                    }

                });

            }

        });

    }




    function closeSendNet() {

        //$("#dashsend").addClass("invis");
        //$("#dashsend").removeClass("slideUp");
        $("#dashsend").hide();

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

        // $("#dashreceive").addClass("invis");
        $("#dashreceive").removeClass("slideUp");
        $("#dashreceive").hide();

        $("#dashcontact").addClass("invis");
        $("#dashcontact").removeClass("slideUp");
        $("#dashcontact").hide();

        $("#pinconfirm").hide();

        $("#btnStdSndDone").hide();


        $('#toAddress').val('');

        sendAmount = '';

        updateStdAmount();

    }


    function closeSendStd() {


        //$("#dashsend").removeClass("slideUp");
        //$("#dashsend").addClass("invis");
        $("#dashsend").hide();

        $("#dashsendamt").removeClass("slideUp");
        $("#dashsendamt").addClass("invis");
        $("#dashsendamt").hide();

        $('#dashboard').show();
        $('#dashheader').show();

        $("#mainWallet").show();
        $(".footer").show();

        $("#dashreceive").removeClass("slideUp");
        // $("#dashreceive").addClass("invis");
        $("#dashreceive").hide();

        $("#dashcontact").removeClass("slideUp");
        $("#dashcontact").addClass("invis");
        $("#dashcontact").hide();

        $("#pinconfirm").hide();

        $("#btnStdSndDone").hide();

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
            $('#amount').text('amount');
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

                            //allow bitcoin entry up to 8 decimal places
                            var ramt = Math.min(sendAmount.length - indot, 9);
                            ramt = ramt - 1;
                            cprc = accounting.formatMoney(sendAmount, "", ramt);
                        }

                    }


                }

                var fee = convertFromSatoshis(Engine.m_settings.MinersFee, COINUNIT);
                var amountPlusFee = (vAmount + fee).toFixed(10);

                if ((currentBalance >= (amountPlusFee) && vAmount > 0) && convertToSatoshis(vAmount, COINUNIT) >= 10000) {

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
                var amountPlusFee = (amt + fee).toFixed(10);

                if (currentBalance >= (amountPlusFee) && amt > 0 && convertToSatoshis(amt, COINUNIT) >= 10000) {

                    $('#btnsendmoneystd').removeClass("disabled");

                } else {

                    $('#btnsendmoneystd').removeClass("disabled");
                    $('#btnsendmoneystd').addClass("disabled");
                }


                $('#amount').html(cprc);
            }
        }

    }


}
module.exports = UI;
