var Bitcoin = require('bitcoinjs-lib');
var BIP39 = require('./bip39');

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
    var SELECTEDFRIEND = '';
    var noAlert = false;
    var trasactionFilterOn = false;
    var allTransactions = [];
    var filteredTransactions = [];
    var pagedTransactions = [];
    var currentTransactionFilter = '';
    var transactionSortOn = true;
    var currentTransactionSort = 'DateDesc';
    var transactionsPerPage = 10;
    var currentPageIndex = 0;


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
        color: '#000', // #rgb or #rrggbb or array of colors
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: '50%', // Top position relative to parent
        left: '50%' // Left position relative to parent
    };


    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toGMTString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }


    jQuery(document).ready(function () {


        var options = {};
        options.ui = {
            container: "#pwd-container",
            showVerdictsInsideProgressBar: true,
            showPopover: true,
            showErrors: true,
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


        var optionschng = {};
        optionschng.ui = {
            container: "#newpwd-container",
            showVerdictsInsideProgressBar: true,
            showPopover: true,
            showErrors: true,
            viewports: {
                progress: ".newpwstrength_viewport_progress"
            }
        };
        optionschng.common = {
            debug: true,
            onLoad: function () {
                $('#messages').text('Start typing password');
            },
            onKeyUp: function () {
                $("#createwalletalert").fadeOut(100);
            }
        };

        $('#newpassword1').pwstrength(optionschng);

    });


    $(document).on("keydown", function (e) {
        if (e.which === 8 && !$(e.target).is("input, textarea")) {
            e.preventDefault();
        }
    });


    $(document).ready(function () {


        $('body').on('click', function (e) {
            //did not click a popover toggle or popover
            if ($(e.target).data('toggle') !== 'popover'
                        && $(e.target).parents('.popover.in').length === 0) {
                $('[data-toggle="popover"]').popover('hide');
            }
        });


        $("#btncreatewallet").click(function () {
            showCreateWalletStart();
        });

        $("#btnLogin").click(function () {

            if (!ensureOpenWalletGuidAndPasswordValid()) return;

            $("#imgopenwaiting").show();
            $("#btnLogin").prop('disabled', true);
            $("#btnLogin").addClass('disabled');
            var target = document.getElementById('imgopenwaiting');
            var spinner = new Spinner(spinneropts).spin(target);


            setTimeout(function () {
                var guid = $('#openWalletStart input#guid').val();
                var password = $('#openWalletStart input#password').val();
                var twoFactorCode = $('#openWalletStart input#twoFactorCode').val();
                openWallet(guid, password, twoFactorCode, function (err, result) {
                    $("#imgopenwaiting").hide();
                    $("#btnLogin").prop('disabled', false);
                    $("#btnLogin").removeClass('disabled');
                    if (!err) {
                        $("#imgopenwaiting").hide();
                        $('#openWalletStart input#password').val('');
                    } else {
                        $("#openwalletalert").show();
                        $("#openwalletalertmessage").html(result);
                    }
                });
            }, 100);
        });

        $("#btnEmailGuid").click(function () {

            var userName = $("#txtlostguidusername").val();

            Engine.emailGUID(userName, function (err, response) {

                showOpenWalletStart();
            });

        });

        $("#btnaddfriend").click(function () {

            addFriend();

        });

        $("#btngenaddr").click(function () {

            generateAddressClient();

        });


        $("#showopenwallet").click(function () {

            showOpenWalletStart();

        });

        $("#btnopenwalletrec").click(function () {

            showOpenWalletStart();

        });


        $("#showopenwalletcr").click(function () {

            showOpenWalletStart();

        });



        $("#btnsendmoneystd").click(function () {

            sendMoneyStd();

        });


        $("#btnCreate").click(function () {

            if ($("#frmcreate").parsley('validate')) {

                //check password strength
                if (($(".password-verdict").html() == 'Strong' || $(".password-verdict").html() == 'Very Strong')) {

                    //can we remove this check?
                    if (ensureCreateWalletGuidNicknameAndPasswordValid()) {

                        $("#imgcreatewaiting").show();
                        $("#btnCreate").prop('disabled', true);
                        $("#btnCreate").addClass('disabled');
                        $("#lnkOpenWallet").hide();

                        var target = document.getElementById('imgcreatewaiting');
                        var spinner = new Spinner(spinneropts).spin(target);

                        //error handling here?

                        var guid = $('#createWalletStart input#guid').val();
                        var username = $("#createWalletStart input#nickname").val();
                        var password = $('#createWalletStart input#cpassword').val();
                        var emailAddress = $('#createWalletStart input#emailaddress').val();


                        Engine.createWallet(guid, password, username, emailAddress, function (err, result) {

                            //move error handling and ui elements to here
                            $("#createWalletStart input#nickname").css("border-color", "#ccc");
                            if (err) {
                                if (result == "ErrUserExists") {

                                    $("#createWalletStart input#nickname").css("border-color", "#ffaaaa");
                                    $("#imgcreatewaiting").hide();

                                    $("#createwalletalert").show();
                                    $("#createwalletalertmessage").html("The username already exists");

                                    $("#btnCreate").prop('disabled', false);
                                    $("#btnCreate").removeClass('disabled');
                                    $("#lnkOpenWallet").show();
                                }
                                if (result == "ErrCreateAccount") {

                                    $("#imgcreatewaiting").hide();
                                    $("#btnCreate").prop('disabled', false);
                                    $("#btnCreate").removeClass('disabled');
                                    $("#lnkOpenWallet").show();

                                }

                            } else {

                                //set variables for the session
                                $("#createWalletStart").hide();
                                $('#createWalletStart input#cpassword').val('');
                                $('#createWalletStart input#password1').val('');

                                $("#hotWalletPhrase").text(result.hotWalletPhrase);
                                $("#coldWalletPhrase").text(result.coldWalletPhrase);
                                //$("#ninkiWalletPhrase").text(result.ninkiWalletPhrase);

                                $("#walletGuid").text($('input#guid').val());
                                $("#showPhrases").show();
                                $("#securitywizard").show();

                                if ($('#createWalletStart input#showQrCheckbox')[0].checked) {
                                    //create two factor setting in databse and display qr code
                                    $("#no2famessage").hide();
                                    showTwoFactorQr();
                                } else {
                                    $("#no2famessage").show();
                                }
                            }
                        });
                    }

                } else {

                    //password not strong
                    $("#createwalletalert").show();
                    $("#createwalletalertmessage").html("Password must be Strong- ideally Very Strong");
                }

            }

        });

        $("#btnPassphraseLogin").click(function () {


            var isvalid = true;

            if ($('#createWalletStart input#showQrCheckbox')[0].checked) {
                isvalid = $("#phrase2fa").parsley('validate');
            }

            if (isvalid) {

                var twoFactorCodeChk = $('#twoFactorCodeCheck').val();

                var target = document.getElementById('imgphrasewaiting');
                var spinner = new Spinner(spinneropts).spin(target);

                $("#imgphrasewaiting").show();

                setCookie('guid', Engine.m_oguid, 30);

                Engine.openWalletAfterCreate(twoFactorCodeChk, function (err, result) {

                    if (err) {

                        $("#imgphrasewaiting").hide();
                        $("#phraseloginerror").show();
                        $("#phraseloginerrormessage").html(result);

                    } else {

                        initialiseUI();
                        $("#imgphrasewaiting").hide();
                        $("#phraseloginerror").hide();
                        $("#validateemail").show();
                        $("#step4").show();
                        $("#step3").hide();
                        $("#listep3").removeClass("active");
                        $("#listep4").addClass("active");
                        $("#prgsecwiz").width('100%');
                        $(".next").hide();
                        $(".previous").hide();
                    }


                });
            }

        });


        $("#btnEmailValidate").click(function () {

            var token = $("#txtEmailToken").val();

            Engine.getEmailValidation(token, function (err, response) {

                if (err) {

                } else {

                    if (response != "Valid") {
                        $("#valemailerror").show();

                        if (response == "Expired") {
                            $("#valemailerrormessage").html('Your token has expired');
                        }
                        if (response == "Invalid") {
                            $("#valemailerrormessage").html('Your token is not valid');
                        }

                    } else {

                        if ($('#createWalletStart input#showQrCheckbox')[0].checked) {
                            //TWOFACTORONLOGIN = true;
                        }

                        //initialiseUI();
                        Engine.m_validate = false;

                        //readAccountSettingsFromServerAndPopulateForm();
                        $("#securitywizard").hide();
                        $("#validateemail").hide();
                        $("#mainWallet").show();
                        $("#valemailerror").hide();
                    }
                }

            });


            //call to verify token


        });

        //wallet security wizard

        var step = 1;
        $("#step1").show();
        $("#prgsecwiz").width('25%');
        $(".previous").hide();
        $(".next").click(function () {

            if (step == 2) {
                $("#step3").show();
                $("#step2").hide();
                $("#listep2").removeClass("active");
                $("#listep3").addClass("active");
                $("#prgsecwiz").width('75%');
                $(".next").hide();
                $(".previous").show();
                step++;
            }

            if (step == 1) {
                $("#step2").show();
                $("#step1").hide();
                $("#listep1").removeClass("active");
                $("#listep2").addClass("active");
                $("#prgsecwiz").width('50%');
                $(".previous").show();

                step++;
            }

        });

        $(".previous").click(function () {

            if (step == 2) {
                $("#step1").show();
                $("#step2").hide();
                $("#listep2").removeClass("active");
                $("#listep1").addClass("active");
                $("#prgsecwiz").width('25%');
                $(".previous").hide();
                $(".next").show();
                step--;
            }

            if (step == 3) {
                $("#step2").show();
                $("#step3").hide();
                $("#listep3").removeClass("active");
                $("#listep2").addClass("active");
                $("#prgsecwiz").width('50%');
                $(".previous").show();
                $(".next").show();
                step--;
            }

            if (step == 4) {
                $("#step3").show();
                $("#step4").hide();
                $("#listep4").removeClass("active");
                $("#listep3").addClass("active");
                $("#prgsecwiz").width('75%');
                $(".previous").show();
                $(".next").hide();
                step--;
            }

        });








        $("#btnReset2fa").click(function () {

            //stretch password
            //download the recovery packet
            //decrypt
            //return shared secret
            //no feedback apart from, please check your email
            var fguid = $("#txtreset2faguid").val();
            var fusername = $("#txtreset2fausername").val();
            var fpwd = $("#txtreset2fapassword").val();

            $("#reset2faerror").hide();
            $("#reset2fasuccess").hide();

            Engine.ResetTwoFactor(fguid, fusername, fpwd, function (err, results) {

                if (err) {
                    $("#reset2faerror").show();
                    $("#reset2faerrormessage").html('There was an error');
                } else {
                    $("#validate2fareset").show();
                    $("#reset2fa").hide();
                }
            });

        });


        $("#btnhidekeys").click(function () {
            $("#secdisphrase").hide();
            $("#secdisninki").hide();
            $("#btnhidekeys").hide();
            $("#btndisplaykeys").show();
        });

        $("#btndisplaykeys").click(function () {

            //get the wallet packet
            //secdisphrase

            var ninkiPub = Engine.m_walletinfo.ninkiPubKey;
            var phrase = Engine.m_walletinfo.hotHash;

            var bip39 = new BIP39();  // 'en' is the default language
            var hotmnem = bip39.entropyToMnemonic(phrase);

            $("#secdisphrase").html(hotmnem);
            $("#secdisninki").html(ninkiPub);
            $("#secdisphrase").show();
            $("#secdisninki").show();
            $("#btnhidekeys").show();
            $("#btndisplaykeys").hide();

        });


        //depreciated
        $("#btn2faResetValidate").click(function () {

            var vtoken = $("#txt2faResetToken").val();

            Engine.EmailValidationForTwoFactor(vtoken, 0, function (err, response) {
                if (err) {

                } else {

                    if (response != "Valid") {
                        $("#val2fatokenerror").show();

                        if (response == "Expired") {
                            $("#val2fatokenerrormessage").html('Your token has expired');
                        }
                        if (response == "Invalid") {
                            $("#val2fatokenerrormessage").html('Your token is not valid');
                        }

                    } else {
                        $("#val2fatoken").hide();
                        $("#val2fatokenerror").hide();
                        location.reload();
                    }
                }

            });

        });




        $("#optDay").click(function () {
            trasactionFilterOn = true;
            currentTransactionFilter = 'Day';
            lastNoOfTrans = -1;
            updateTransactions();
        });

        $("#optWeek").click(function () {
            trasactionFilterOn = true;
            currentTransactionFilter = 'Week';
            lastNoOfTrans = -1;
            updateTransactions();
        });

        $("#optMonth").click(function () {
            trasactionFilterOn = true;
            currentTransactionFilter = 'Month';
            lastNoOfTrans = -1;
            updateTransactions();
        });

        $('#btntransearch').click(function () {
            trasactionFilterOn = true;
            currentTransactionFilter = 'Search';
            lastNoOfTrans = -1;
            updateTransactions();
        });

        $('#btntranclear').click(function () {
            trasactionFilterOn = false;
            currentTransactionFilter = '';
            lastNoOfTrans = -1;
            updateTransactions();
            $("#optDay").removeClass('active');
            $("#optWeek").removeClass('active');
            $("#optMonth").removeClass('active');
            $("#txttransearch").val('');

        });


        $('#thtrandate').click(function () {

            //reset contact widget
            if (currentTransactionSort == 'ContactDesc') {
                $('#thtrancontact').toggleClass('active');
            }

            if (currentTransactionSort == 'DateDesc') {
                currentTransactionSort = 'DateAsc';
            } else {
                currentTransactionSort = 'DateDesc';
            }

            trasactionSortOn = true;
            lastNoOfTrans = -1;
            updateTransactions();
        });

        $('#thtrancontact').click(function () {

            //reset date widget
            if (currentTransactionSort == 'DateDesc') {
                $('#thtrandate').toggleClass('active');
            }

            if (currentTransactionSort == 'ContactAsc') {
                currentTransactionSort = 'ContactDesc';
            } else {
                currentTransactionSort = 'ContactAsc';
            }

            trasactionSortOn = true;
            lastNoOfTrans = -1;
            updateTransactions();
        });

        $('#tpagfirst').click(function () {
            currentPageIndex = 0;
            lastNoOfTrans = -1;
            updateTransactions();
        });

        $('#tpaglast').click(function () {
            currentPageIndex = Math.floor((filteredTransactions.length / transactionsPerPage));
            lastNoOfTrans = -1;
            updateTransactions();

        });

        $('#tpagnext').click(function () {
            if (currentPageIndex < Math.floor((filteredTransactions.length / transactionsPerPage))) {
                currentPageIndex = currentPageIndex + 1;
                lastNoOfTrans = -1;
                updateTransactions();
            }
        });

        $('#tpagprev').click(function () {
            if (currentPageIndex > 0) {
                currentPageIndex = currentPageIndex - 1;
                lastNoOfTrans = -1;
                updateTransactions();
            }
        });

        $("#openWalletStart #guid").val(getCookie('guid'));

        if (getCookie('guid').length > 0) {
            showOpenWalletStart();
            $("#password").focus();
        } else {
            showCreateWalletStart();
        }

        $("#password").keypress(function (e) {
            if (e.which == 13) {
                $("#btnLogin").click();
            }
        });

        $("#twoFactorCode").keypress(function (e) {
            if (e.which == 13) {
                $("#btnLogin").click();
            }
        });

        $("#password1").keypress(function (e) {
            if (e.which == 13) {
                $("#btnCreate").click();
            }
        });


        $("#cpassword").blur(function () {
            $(".popover.fade.bottom.in").hide();
        });

        $("#cpassword").focus(function () {
            $(".popover.fade.bottom.in").show();
        });

        $("#newpassword1").blur(function () {
            $(".popover.fade.bottom.in").hide();
        });

        $("#newpassword1").focus(function () {
            $(".popover.fade.bottom.in").show();
        });

        $("#balance").html("... BTC");
        $("#mainWallet").hide();
        $('#message').hide();
        $("#openwalletalert").hide();
        $("#createwalletalert").hide();
        $("#imgopenwaiting").hide();
        $("#imgcreatewaiting").hide();
        $("#showPhrases").hide();
        $("#twoFactorQr").hide();
        $("#2factor1").hide();
        $("#securitywizard").hide();
        $("#secdisphrase").hide();
        $("#secdisninki").hide();
        $("#btnhidekeys").hide();

        $("#btnSendToFriend").click(function () {
            sendMoney(SELECTEDFRIEND, 0);
        });
        $("#sendfriendprog").hide();

        $("#hforgotguid").click(function () {

            $("#createWalletStart").hide();
            $("#openWalletStart").hide();
            $("#lostguid").show();
            $("#reset2fa").hide();
        });


        $("#hlost2fa").click(function () {

            $("#createWalletStart").hide();
            $("#openWalletStart").hide();
            $("#lostguid").hide();
            $("#reset2fa").show();

        });


        $("#emailresend").click(function () {

            Engine.sendWelcomeDetails(function (err, result) {

                if (!err) {

                    $("#emailresendmessage").show();
                    $("#emailresend").hide();
                    //email has been resent, please check your email
                }

            });

        });


        $("#cpassword").on('change keyup', function () {

            $("#password1").parsley("validate");

        });


        $("#twoFactorCodeCheck").on('change keyup', function () {

            $("#phraseloginerror").fadeOut(100);

        });


        $("#btnChangePassword").click(function () {

            $("#chngpwssuc").hide();
            $("#chngpwerr").hide();
            $("#chngpwdprog").hide();
            $("#chngpwdprogbar").width('0%');

            var newpassword = $("#newpassword1").val();
            var oldpassword = $("#oldpwd").val();
            var twoFactorCode = $("#txtTwoFactorCodeForChangePwd").val();

            if ($("#frmpwdchange").parsley('validate')) {

                $("#chngpwdprog").show();
                $("#chngpwdprogmess").show();
                $("#chngpwdprogbar").width('10%');
                $("#chngpwdprogmess").html('Getting packet...');


                if (oldpassword != newpassword) {

                    //check password strength
                    if (($(".newpwstrength_viewport_progress .password-verdict").html() == 'Strong' || $(".newpwstrength_viewport_progress .password-verdict").html() == 'Very Strong')) {

                        //stretch old password
                        //verify that it matches the current one
                        $("#chngpwdprogbar").width('20%');
                        $("#chngpwdprogmess").html('Getting details...');

                        setTimeout(function () {

                            Engine.ChangePassword(twoFactorCode, oldpassword, newpassword, "#chngpwdprogbar", "#chngpwdprogmess", function (err, results) {

                                if (err) {
                                    $("#chngpwerr").show();
                                    $("#chngpwerrmess").html(results);
                                    $("#chngpwdprogmess").hide();
                                    $("#chngpwdprog").hide();

                                } else {

                                    password = results;
                                    $("#chngpwerr").hide();
                                    $("#chngpwdprogbar").width('100%');
                                    $("#chngpwdprog").hide();
                                    $("#chngpwdprogmess").hide();
                                    $("#chngpwdprogbar").hide();
                                    $("#chngpwssuc").show();

                                    $("#newpassword1").val('');
                                    $("#newpassword2").val('');
                                    $("#oldpwd").val('');
                                    $("#txtTwoFactorCodeForChangePwd").val('');

                                }

                            });


                        }, 500);
                    }

                } else {
                    $("#chngpwerr").show();
                    $("#chngpwerrmess").html("Passwords are the same. Password not updated");
                    $("#chngpwdprogmess").hide();
                    $("#chngpwdprog").hide();
                }

            }
        });


        $("#btnVerify").click(function () {

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
                    $("#validateform").hide();
                    $("#validatesuccess").show();
                    $("#txtCode").val('');
                    selectedFriend.validated = true;
                    updateSelectedFriend();

                } else {
                    $("#validatefail").show();
                }

            });
        });


        $("#btnSetupTwoFactor").click(function () {

            $("#twofactorsettings").show();
            $("#btnSetupTwoFactor").hide();
            $("#savetwofactorerror").hide();
            $("#setup2faemail").hide();
            $("#setup2faqr").show();
            showSettingsTwoFactorQr();

        });


        $("#btnSaveTwoFactor").click(function () {

            //validate authenticator code
            //switch on two factor on login
            //setting changes always require two factor

            if ($("#frmSaveTwoFactor").parsley('validate')) {

                var twoFactorCode = $("#txtsettings2fa").val();
                var verifyToken = $("#txt2faVerifyToken").val();

                Engine.SaveTwoFactor(twoFactorCode, verifyToken, function (err, result) {

                    if (!err) {
                        //ok
                        $("#setup2faemail").show();
                        $("#setup2faqr").hide();
                        readAccountSettingsFromServerAndPopulateForm();
                    } else {
                        //error
                        $("#savetwofactorerror").show();
                        $("#savetwofactorerrormessage").show();
                        $("#savetwofactorerrormessage").html(result);
                    }
                });

            }
        });

        $("#btn2faVerifyEmail").click(function () {


            var vtoken = $("#txt2faVerifyToken").val();

            Engine.EmailValidationForTwoFactor(vtoken, 1, function (err, response) {

                if (!err) {


                    //TWOFACTORONLOGIN = true;
                    //refresh settings panel

                    readAccountSettingsFromServerAndPopulateForm();

                    $("#twofactorsettings").hide();
                    $("#btnSetupTwoFactor").hide();
                    $("#savetwofactorerror").hide();
                    $("#savetwofactorerrormessage").hide();
                    $("#setup2faemail").hide();
                    $("#setup2faqr").hide();


                } else {

                    //TO DO:
                    //report error here

                }


            });


        });


        $("#hsettings").click(function () {
            readAccountSettingsFromServerAndPopulateForm();
        });

        $("#savesettingsbutton").click(function () {
            if ($("#frmsettings").parsley('validate')) {
                saveAccountSettingsToServer();

            }
        });

        Engine.fillElementWithGuid($("#createWalletStart input#guid"));


        //INVOICE STUFF START------------------------------------------

        $("#friendselector").hide();
        $("#invoice").hide();
        $("#invoicedisplay").hide();

        $("#btnpayinvoice").click(function () {
            payInvoice(selectedInvoiceUserName, selectedInvoiceAmount, selectedInvoiceId);


        });

        $("#btnrejectinvoice").click(function () {

            Engine.updateInvoice(selectedInvoiceUserName, selectedInvoiceId, '', 2, function (err, result) {

                lastInvoiceToPayCount = 0;
                showInvoiceList();
                showInvoiceListNetwork();

                $("#invoicedisplay").hide();
                $("#invoicestopay").show();
                $("#createinv").show();

                if (uiInvoiceReturnToNetwork) {
                    updateSelectedFriend();
                }
            });

        });

        $("#payinvoicecancel").click(function () {

            $("#invoicedisplay").hide();
            $("#invoicestopay").show();
            $("#createinv").show();

            if (uiInvoiceReturnToNetwork) {
                $("#hnetwork").click();
                uiInvoiceReturnToNetwork = false;
            }


        });


        $("#btnokinvoice").click(function () {

            $("#invoicedisplay").hide();
            $("#invoicestopay").show();
            $("#createinv").show();

            if (uiInvoiceReturnToNetwork) {
                lastInvoiceToPayNetCount = 0;

                $("#hnetwork").click();
                uiInvoiceReturnToNetwork = false;
                showInvoiceListNetwork();
            }

            lastInvoiceToPayCount = 0;
            showInvoiceList();


        });

        $("#invoicecancel").click(function () {
            $("#invoicestopay").show();
            $("#createinv").show();
        });

        $("#sendinvoicecancel").click(function () {

            $("#invoicedisplay").hide();
            $("#invoice").hide();
            $("#invoicestopay").show();
            $("#hnetwork").click();
        });


        $("#sendinvoice").click(function () {

            calcInvoiceTotals();

            var subtotal = $("#tblinvoice tfoot th #subtotal").html();
            var tax = $("#tblinvoice tfoot th #tax").html();
            var total = $("#tblinvoice tfoot th #total").html();

            if (subtotal > 0) {

                if (validateInvoice()) {
                    //parse the table and generate objects
                    var invoicelines = [];
                    $("#tblinvoice tbody tr").each(function () {
                        var tmpVals = [];
                        $(this).find('input').each(function () {
                            tmpVals.push($(this).val());
                        });
                        if (tmpVals[0] != null) {
                            invoicelines.push({
                                description: tmpVals[0],
                                quantity: tmpVals[1],
                                amount: convertToSatoshis(tmpVals[2], COINUNIT)
                            });
                        }
                    });


                    var summary = {
                        subtotal: convertToSatoshis(subtotal, COINUNIT),
                        tax: convertToSatoshis(tax, COINUNIT),
                        total: convertToSatoshis(total, COINUNIT)
                    };
                    var invoice = {
                        summary: summary,
                        invoicelines: invoicelines
                    };

                    createNewInvoice(invoiceSelectedUser, invoice, function (err, invoices) {

                        $("#invoicestopay").show();
                        $("#createinv").show();
                        $("#invoice").hide();


                        $("#hnetwork").click();
                        updateSelectedFriend();

                    });
                }
            }

        });


        $("#btnCreateInvFriend").click(function () {

            $("#invoicestopay").hide();
            $("#invoicedisplay").hide();
            uiInvoiceReturnToNetwork = true;
            invoiceSelectedUser = SELECTEDFRIEND;
            lineCount = 0
            $("#createinvoiceforlabel").html('Create an Invoice for ' + SELECTEDFRIEND);
            $("#tblinvoice tbody").empty();

            $("#friendselector").hide();
            $("#invoice").show();
            //write a new one
            $("#addline").click();
            $("#hinvoices").click();

        });



        $("#lineAmount").keypress(function (e) {
            if (e.which == 13) {

                $("#addline").click();

            }
        });

        $("#addline").click(function () {

            if (validateInvoice()) {

                //recalc everything
                lineCount++;

                $('#tblinvoice tbody').append(getRowTempate());
                $('#line' + lineCount + 'desc').focus();

                $('#addline' + lineCount).click({
                    line: lineCount
                }, function (event) {
                    $('#tblinvoice #row' + event.data.line).remove();
                    validateInvoice();
                });

                $('#line' + lineCount + 'Amount').blur({
                    line: lineCount
                }, function (event) {
                    if (validateInvoice()) {
                        $('#lineTotal' + (event.data.line)).html(($('#line' + (event.data.line) + 'Amount').val() * $('#line' + (event.data.line) + 'Quantity').val()).toFixed(4));
                        calcInvoiceTotals();
                    } else {
                        //$('#line' + (event.data.line) + 'Amount').
                    }
                });

                $('#line' + lineCount + 'Quantity').blur(function (event) {
                    validateInvoice();
                });


                $('#line' + lineCount + 'desc').blur(function (event) {
                    validateInvoice();
                });

                $('#line' + lineCount + 'Amount').keypress({
                    line: lineCount
                }, function (e) {
                    if (e.which == 13) {
                        $("#addline").click();
                    }
                });

                $('#line' + lineCount + 'desc').keydown({
                    line: lineCount
                }, function (e) {
                    if (e.which == 8) {
                        if ($('#line' + lineCount + 'desc').val() == '' && $('#line' + lineCount + 'Amount').val() == '' && $('#line' + lineCount + 'Quantity').val() == '') {
                            $('#tblinvoice #row' + e.data.line).remove();
                        }
                    }
                });

            }
            //write a new one

        });


        //openWallet();

    });


    function calcInvoiceTotals() {
        var subTotal = 0;
        $('#tblinvoice .lineTotal').each(function () {

            subTotal += ($(this).html() * 1);

        });

        $("#subtotal").html(subTotal.toFixed(4));
        $("#tax").html((subTotal * 0.10).toFixed(4));
        $("#total").html((subTotal + (subTotal * 0.10)).toFixed(4));

    };

    function validateInvoice() {
        var subTotal = 0;

        var isValid = true;

        $('#tblinvoice .amount').each(function () {

            var vval = $(this).val();
            var visValid = true;
            if ($.isNumeric(vval)) {

                if ((vval * 1) <= 0) {
                    //not valid
                    //highlight
                    isValid = false;
                    visValid = false;
                }

            } else {

                isValid = false;
                visValid = false;
            }

            if (!visValid) {
                $(this).css("border-color", "#ff0000");
            } else {
                $(this).css("border-color", "#cbd5dd");
            }

        });

        $('#tblinvoice .quantity').each(function () {

            var vval = $(this).val();
            var visValid = true;
            if ($.isNumeric(vval)) {

                if ((vval * 1) <= 0) {
                    //not valid
                    //highlight
                    isValid = false;
                    visValid = false;
                }

            } else {

                isValid = false;
                visValid = false;
            }

            if (!visValid) {
                $(this).css("border-color", "#ff0000");
            } else {
                $(this).css("border-color", "#cbd5dd");
            }


        });

        $('#tblinvoice .desc').each(function () {


            var vval = $(this).val();
            var visValid = true;

            if (vval.length == 0) {
                visValid = false;
                isValid = false;
            }

            if (!visValid) {
                $(this).css("border-color", "#ff0000");
            } else {
                $(this).css("border-color", "#cbd5dd");
            }

        });

        if (isValid) {



            //if (subTotal > 0) {
            $("#subtotal").html(subTotal.toFixed(4));
            $("#tax").html((subTotal * 0.10).toFixed(4));
            $("#total").html((subTotal + (subTotal * 0.10)).toFixed(4));
            //} else {
            //    isValid = false;
            //}
        }

        return isValid;

    };



    var lineCount = 0;
    function getRowTempate() {
        var template = '<tr id=\"row' + lineCount + '\">' +
                        '<td>' +
                        '<input id=\"line' + lineCount + 'desc\" class="form-control desc" />' +
                        '</td>' +
                        '<td>' +
                        '<input id=\"line' + lineCount + 'Quantity\" data-type="digits" class="form-control quantity" />' +
                        '</td>' +
                        '<td>' +
                        '<input id=\"line' + lineCount + 'Amount\" data-type="number" class="form-control amount" placeholder="' + COINUNIT + '" />' +
                        '</td><td><span class=\"lineTotal\" id="lineTotal' + lineCount + '"></span></td>' +
                        '<td  id=\"addline' + lineCount + '\">' +
		                '<a href="#" class="btn btn-sm btn-icon btn-info">' +
		                '<i class="fa fa-minus"></i>' +
		                '</a>' +
                        '</td>' +
                        '</tr>';




        return template;
    }


    var cachedInvoices = [];
    var lastInvoiceToPayCount = 0;
    function showInvoiceList() {
        //get back the list of invoices to pay

        Engine.getInvoiceList(function (err, invoices) {


            for (var i = 0; i < invoices.length; i++) {
                var d1 = new Date(invoices[i].InvoiceDate);
                invoices[i].JsDate = d1;
            }

            invoices = _.sortBy(invoices, function (inv) { return -inv.JsDate; });

            if (lastInvoiceToPayCount < invoices.length) {

                cachedInvoices = [];

                lastInvoiceToPayCount = invoices.length;

                var s = '';
                $('#tblinvoicepay tbody').empty();
                for (var i = 0; i < invoices.length; i++) {

                    cachedInvoices.push(invoices[i]);

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


                    var length = invoices[i].InvoiceFrom.length;
                    if (length > 20) {
                        length = 20;
                    }

                    s += "<tr><td><label class=\"checkbox m-n i-checks\"><input type=\"checkbox\" name=\"post[]\"><i></i></label></td><td>" + invoices[i].InvoiceDate + "</td><td><span class=\"thumb-sm\"><img src=\"images/avatar/64px/Avatar-" + pad(length) + ".png\" alt=\"\" class=\"img-circle\"></span><span class=\"m-s\"> " +
                                 invoices[i].InvoiceFrom + "</span></td><td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td>" + invoices[i].InvoicePaidDate + "</td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoice" + i + "\">View</button></td></tr>";
                }

                $('#tblinvoicepay tbody').append(s);

                for (var i = 0; i < invoices.length; i++) {

                    $("#tblinvoicepay #viewinvoice" + i).click({
                        index: invoices[i].InvoiceId, username: invoices[i].InvoiceFrom
                    }, function (event) {
                        displayInvoice(event.data.index, event.data.username, 'forme', function (err, res) {
                            uiInvoiceReturnToNetwork = false;
                            //$('#hinvoices').click();
                        });
                    });
                }

            }
        });
    }



    var lastInvoiceToPayNetCount = 0;
    var uiInvoiceReturnToNetwork = false;
    function showInvoiceListNetwork() {

        var invoices = _.filter(cachedInvoices, function (inv) { return inv.InvoiceFrom == SELECTEDFRIEND; });


        if (invoices.length == 0) {
            $('#tblnetinvforme tbody').empty();
            $('#tblnetinvforme').hide();
        }


        if (lastInvoiceToPayNetCount < invoices.length) {

            lastInvoiceToPayNetCount = invoices.length;

            var s = '';
            $('#tblnetinvforme tbody').empty();

            for (var i = 0; i < invoices.length; i++) {

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

                s += "<tr><td>" + invoices[i].InvoiceDate + "</td>" +
                                 "<td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td>" + invoices[i].InvoicePaidDate + "</td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoicenetfrom" + invoices[i].InvoiceFrom + invoices[i].InvoiceId + "\">View</button></td></tr>";
            }

            $('#tblnetinvforme tbody').append(s);

            for (var i = 0; i < invoices.length; i++) {

                $("#tblnetinvforme #viewinvoicenetfrom" + invoices[i].InvoiceFrom + invoices[i].InvoiceId).click({
                    index: invoices[i].InvoiceId, username: invoices[i].InvoiceFrom
                }, function (event) {
                    displayInvoice(event.data.index, event.data.username, 'forme', function (err, res) {
                        uiInvoiceReturnToNetwork = true;
                        $('#hinvoices').click();
                    });
                });
            }

            $('#tblnetinvforme').show();


        }

        $('#pnlfriendinv').show();


    }

    var lastInvoiceByMeNetCount = 0;
    function showInvoiceByMeListNetwork() {

        var invoices = _.filter(cachedInvoicesByUser, function (inv) { return inv.InvoiceFrom == SELECTEDFRIEND; });



        if (invoices.length == 0) {
            $('#tblnetinvbyme tbody').empty();
            $('#tblnetinvbyme').hide();
        }


        if (lastInvoiceByMeNetCount < invoices.length) {

            lastInvoiceByMeNetCount = invoices.length;

            var s = '';
            $('#tblnetinvbyme tbody').empty();

            for (var i = 0; i < invoices.length; i++) {

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

                s += "<tr><td>" + invoices[i].InvoiceDate + "</td>" +
                                 "<td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td>" + invoices[i].InvoicePaidDate + "</td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoicenetby" + invoices[i].InvoiceFrom + invoices[i].InvoiceId + "\">View</button></td></tr>";
            }

            $('#tblnetinvbyme tbody').append(s);

            for (var i = 0; i < invoices.length; i++) {

                $("#tblnetinvbyme #viewinvoicenetby" + invoices[i].InvoiceFrom + invoices[i].InvoiceId).click({
                    index: invoices[i].InvoiceId, username: invoices[i].InvoiceFrom
                }, function (event) {
                    displayInvoice(event.data.index, event.data.username, 'byme', function (err, res) {
                        uiInvoiceReturnToNetwork = true;
                        $('#hinvoices').click();
                    });
                });
            }

            $('#tblnetinvbyme').show();


        }

        $('#pnlfriendinv').show();


    }

    var cachedInvoicesByUser = [];
    var lastInvoiceByUserCount = 0;
    function showInvoiceByUserList() {
        //get back the list of invoices to pay


        Engine.getInvoiceByUserList(function (err, invoices) {

            for (var i = 0; i < invoices.length; i++) {
                var d1 = new Date(invoices[i].InvoiceDate);
                invoices[i].JsDate = d1;
            }

            invoices = _.sortBy(invoices, function (inv) { return -inv.JsDate; });

            if (lastInvoiceByUserCount < invoices.length) {

                cachedInvoicesByUser = [];

                lastInvoiceByUserCount = invoices.length;

                var s = '';
                $('#tblinvoicebyme tbody').empty();
                for (var i = 0; i < invoices.length; i++) {

                    cachedInvoicesByUser.push(invoices[i]);

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


                    var length = invoices[i].InvoiceFrom.length;
                    if (length > 20) {
                        length = 20;
                    }

                    s += "<tr><td><label class=\"checkbox m-n i-checks\"><input type=\"checkbox\" name=\"post[]\"><i></i></label></td><td>" + invoices[i].InvoiceDate + "</td><td><span class=\"thumb-sm\"><img src=\"images/avatar/64px/Avatar-" + pad(length) + ".png\" alt=\"\" class=\"img-circle\"></span><span class=\"m-s\"> " +
                                 invoices[i].InvoiceFrom + "</span></td><td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td><span class=\"paid\">" + invoices[i].InvoicePaidDate + "</span></td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoicebyuser" + i + "\">View</button></td></tr>";
                }

                $('#tblinvoicebyme tbody').append(s);

                for (var i = 0; i < invoices.length; i++) {

                    $("#tblinvoicebyme #viewinvoicebyuser" + i).click({
                        index: invoices[i].InvoiceId, username: invoices[i].InvoiceFrom
                    }, function (event) {
                        displayInvoiceByUser(event.data.index, event.data.username, 'byme', function (err, res) {


                        });
                    });
                }

            } else {

                //no new invoices, but lets check for invoices with changed status
                cachedInvoicesByUser = invoices;

                $('#tblinvoicebyme tbody tr .active').each(function (index, elem) {
                    var statusbox = '';
                    if (cachedInvoicesByUser[index].InvoiceStatus == 0) {
                        statusbox = '<i class=\"fa fa-clock-o text-warning text-active\"></i> <span class="label bg-warning">Pending</span>';
                    }
                    else if (cachedInvoicesByUser[index].InvoiceStatus == 1) {
                        statusbox = '<i class=\"fa fa-check text-success text-active\"></i> <span class="label bg-success">Paid</span>';
                    }
                    else if (cachedInvoicesByUser[index].InvoiceStatus == 2) {
                        statusbox = '<i class=\"fa fa-times text-danger text-active\"></i> <span class="label bg-danger">Rejected</span>';
                    }
                    //$(elem).html('');
                    $(elem).html(statusbox);
                });

                $('#tblinvoicebyme tbody tr .paid').each(function (index, elem) {

                    if (cachedInvoicesByUser[index].InvoiceStatus == 1 || cachedInvoicesByUser[index].InvoiceStatus == 1) {
                        $(elem).html(cachedInvoicesByUser[index].InvoicePaidDate);
                    }

                });


            }
        });
    }



    var selectedInvoiceAmount = 0;
    var selectedInvoiceId = 0;
    var selectedInvoiceUserName = '';


    function displayInvoiceDetails(invoice, json, invtype, callback) {


        $("#createinv").hide();
        $("#invoicestopay").hide();

        $('#tblinvdisplay tbody').empty();
        var s = '';
        for (var i = 0; i < json.invoicelines.length; i++) {
            s += "<tr><td>" + json.invoicelines[i].description + "</td><td>" + json.invoicelines[i].quantity + "</td><td>" + convertFromSatoshis(json.invoicelines[i].amount, COINUNIT) + "</td><td>" + (convertFromSatoshis(json.invoicelines[i].amount, COINUNIT) * json.invoicelines[i].quantity).toFixed(4) + "</td></tr>";
        }

        $('#tblinvdisplay tbody').append(s);

        if (invtype == 'forme') {
            $("#dinvusername").html('Invoice from ' + invoice.InvoiceFrom);
        } else {
            $("#dinvusername").html('Invoice to ' + invoice.InvoiceFrom);
        }

        $("#dinvdate").html(invoice.InvoiceDate);

        $("#tblinvdisplay tfoot th #dsubtotal").html(convertFromSatoshis(json.summary.subtotal, COINUNIT));
        $("#tblinvdisplay tfoot th #dtax").html(convertFromSatoshis(json.summary.tax, COINUNIT));
        $("#tblinvdisplay tfoot th #dtotal").html(convertFromSatoshis(json.summary.total, COINUNIT));

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
                    $("#invvalt").html(invoice.InvoiceFrom);
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

    function createNewInvoice(userName, invoice, callback) {

        Engine.createInvoice(userName, invoice, function (err, invoiceNo) {

            return callback(err, invoiceNo);

        });

    }


    function payInvoice(friend, amount, invoiceNumber) {

        $('#textMessageSendInv').removeClass('alert alert-danger');
        $('#textMessageSendInv').html('Creating transaction...');
        $('#textMessageSendInv').show();
        $('#sendinvprogstatus').width('3%')
        $('#sendinvprog').show();
        $('#sendinvprogstatus').width('10%');


        Engine.sendTransaction('invoice', friend, '', amount, function (err, transactionid) {

            if (!err) {

                Engine.updateInvoice(friend, invoiceNumber, transactionid, 1, function (err, result) {

                    if (!err) {

                        $('#textMessageSendInv').html('You paid invoice: ' + friend.toUpperCase() + invoiceNumber);
                        $('#textMessageSendInv').fadeOut(5000);
                        $('#sendinvprog').fadeOut(5000);

                        //$("#invoicedisplay").hide();
                        //$("#invoicestopay").show();
                        //$("#createinv").show();

                        updateBalance();
                        lastInvoiceToPayCount = 0;
                        showInvoiceList();

                        //change status
                        var statusbox = '<i class=\"fa fa-check text-success text-active\"></i> <span class="label bg-success">Paid</span>';
                        $("#invdisstatus").html(statusbox);


                        //hide buttons
                        $("#payinvoicecancel").hide();
                        $("#btnpayinvoice").hide();
                        $("#btnrejectinvoice").hide();

                        //show ok
                        $("#btnokinvoice").show();

                        if (uiInvoiceReturnToNetwork) {
                            updateSelectedFriend();
                        }
                    }

                });


            } else {
                $('#textMessageSendInv').addClass('alert alert-danger');
                $('#sendinvprogstatus').width('0%')

                if (transactionid == "ErrInsufficientFunds") {
                    $('#textMessageSendInv').html('Transaction Failed: Insufficient funds');
                }

            }

        });

    }


    //INVOICE FUNCTIONS END------------------------------------------


    //OPEN/CREATE WALLET FUNCTIONS---------------------------------------------

    //event handlers



    //wrapper functions

    function openWallet(guid, password, twoFactorCode, callback) {

        setCookie('guid', guid, 30);

        Engine.openWallet(guid, password, twoFactorCode, function (err, result) {

            if (err) {

                return callback(err, result);

            } else {

                initialiseUI();

            }
        });

    }

    function initialiseUI() {

        var length = Engine.m_nickname.length;
        if (length > 20) {
            length = 20;
        }

        $("#mynickname").html(Engine.m_nickname);
        $("#usernameProfile").html(Engine.m_nickname);

        $("#imgProfile").attr("src", "images/avatar/256px/Avatar-" + pad(length) + ".png");
        $("#imgtoprightprofile").attr("src", "images/avatar/64px/Avatar-" + pad(length) + ".png");
        $("#codeForFriend").html(Engine.m_fingerprint);

        Engine.getusernetworkcategory(function (err, categories) {

            var catOptions = '<select id="nselnetcat" class="form-control">';

            for (var i = 0; i < categories.length; i++) {

                catOptions += '<option>' + categories[i].Category + '</option>';

            }

            catOptions += '</select>';

            $("#netcatoptions").html(catOptions);
            $("#nselnetcat").change(function () {

                $("#nselnetcat option:selected").each(function () {
                    //update selected friend category
                    Engine.updateusernetworkcategory(SELECTEDFRIEND, $(this).text(), function (err, result) {

                        //refresh friend list
                        if (!err) {
                            lastNoOfFriends = 0;
                            updateFriends();
                        }

                    });

                });
            });


            if (!err) {


                document.onAway = function () { logout(); }
                setInterval("Ninki.UI.updateUITimer()", 10000);

                updateUI();
                updateRequestsMadeByMe();

                $('#showPhrases').hide();
                $("#openWalletStart").hide();
                $("#createWalletStart").hide();

                if (Engine.m_validate) {

                    $("#securitywizard").show();
                    $("#step4").show();
                    $("#step1").hide();
                    $("#step2").hide();
                    $("#step3").hide();
                    $("#listep1").removeClass("active");
                    $("#listep2").removeClass("active");
                    $("#listep3").removeClass("active");
                    $("#listep4").addClass("active");
                    $("#prgsecwiz").width('100%');
                    $(".next").hide();
                    $(".previous").hide();
                    $("#validateemail").show();
                    $("#mainWallet").hide();

                } else {

                    $("#securitywizard").hide();
                    $("#mainWallet").show();
                    $("#validateemail").hide();
                }

                setAwayTimeout(600000);

            }


        });

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

    function updateUI() {
        updateBalance();
        updateFriends();
        updateFriendRequests();
        updateRequestsMadeByMe();
        updateTransactions();
        showInvoiceList();
        showInvoiceByUserList();
        //var enc = COINUNIT.replace('u', '&mu;');
        $("#stdsendcunit").html(COINUNIT);
        $("#amount").attr("placeholder", "Enter amount in units of " + COINUNIT);
        $("#friendAmount").attr("placeholder", "Enter amount in units of " + COINUNIT);
        $("#fndsendcunit").html(COINUNIT);
    }

    function showCreateWalletStart() {
        $("#createWalletStart").show();
        $("#openWalletStart").hide();
        $("#lostguid").hide();
        $("#reset2fa").hide();
        $("#validateemail").hide();
    }

    function showOpenWalletStart() {
        $("#openWalletStart").show();
        $("#createWalletStart").hide();
        $("#lostguid").hide();
        $("#reset2fa").hide();
        $("#validateemail").hide();
    }

    function showTwoFactorQr() {

        $("#twoFactorQr").show();
        $("#2factor1").show();

        Engine.getTwoFactorImg(function (err, twoFactorQrImgUrl) {
            $("#twoFactorQrImg").attr("src", twoFactorQrImgUrl);
        });

    }

    function showSettingsTwoFactorQr() {

        $("#setup2faqr").show();
        $("#setting2fa").show();
        $("#settings2fa").show();
        $("#btnSetupTwoFactor").hide();

        Engine.getTwoFactorImg(function (err, twoFactorQrImgUrl) {
            $("#imgsettings2fa").attr("src", twoFactorQrImgUrl);
        });
    }

    //Download settings from server and populate input boxes
    function readAccountSettingsFromServerAndPopulateForm() {

        $("#savesettingserror").hide();
        $("#savesettingssuccess").hide();

        if (Engine.m_twoFactorOnLogin) {
            $("#settings2faok").show();
            $("#TwoFactorCodeForSettings").show();
            $("#TwoFactorCodeForChangePwd").show();
            $("#DailyTransactionLimit").prop('disabled', false);
            $("#SingleTransactionLimit").prop('disabled', false);
            $("#NoOfTransactionsPerDay").prop('disabled', false);
            $("#NoOfTransactionsPerHour").prop('disabled', false);
            $("#btnSetupTwoFactor").hide();

        } else {
            $("#settings2faok").hide();
            $("#TwoFactorCodeForSettings").hide();
            $("#TwoFactorCodeForChangePwd").hide();
            $("#DailyTransactionLimit").prop('disabled', true);
            $("#SingleTransactionLimit").prop('disabled', true);
            $("#NoOfTransactionsPerDay").prop('disabled', true);
            $("#NoOfTransactionsPerHour").prop('disabled', true);
        }

        Engine.getAccountSettings(function (err, response) {
            if (err) {

            } else {

                var settingsObject = JSON.parse(response);

                $('#DailyTransactionLimit').val(convertFromSatoshis(settingsObject['DailyTransactionLimit'], COINUNIT));
                $('#SingleTransactionLimit').val(convertFromSatoshis(settingsObject['SingleTransactionLimit'], COINUNIT));
                $('#NoOfTransactionsPerDay').val(settingsObject['NoOfTransactionsPerDay']);
                $('#NoOfTransactionsPerHour').val(settingsObject['NoOfTransactionsPerHour']);
                $('#Inactivity').val(settingsObject['Inactivity']);
                $('#MinersFee').val(convertFromSatoshis(settingsObject['MinersFee'], COINUNIT));
                $('#CoinUnit').val(settingsObject['CoinUnit']);
                $('#Email').val(settingsObject['Email']);
                $('#EmailNotification').prop('checked', settingsObject['EmailNotification']);

                $('#TwoFactor').val(settingsObject['TwoFactor']);
                $('#AutoEmailBackup').val(settingsObject['AutoEmailBackup']);
                $('#EmailVerified').val(settingsObject['EmailVerified']);
                $('#Phone').val(settingsObject['Phone']);
                $('#PhoneVerified').val(settingsObject['PhoneVerified']);
                $('#Language').val(settingsObject['Language']);
                $('#LocalCurrency').val(settingsObject['LocalCurrency']);
                $('#PhoneNotification').val(settingsObject['PhoneNotification']);
                $('#PasswordHint').val(settingsObject['PasswordHint']);
                $('#TwoFactorType').val(settingsObject['TwoFactorType']);


                if (settingsObject['CoinUnit'] == 'BTC') {
                    $('#cuSelected').html('BTC');
                    $('#cuBTC').prop('checked', true);
                }
                if (settingsObject['CoinUnit'] == 'mBTC') {
                    $('#cuSelected').html('mBTC');
                    $('#cumBTC').prop('checked', true);
                }
                if (settingsObject['CoinUnit'] == 'uBTC') {
                    $('#cuSelected').html('&mu;BTC');
                    $('#cuuBTC').prop('checked', true);
                }

            }
        });
    }


    function saveAccountSettingsToServer() {
        var jsonPacket = {
            guid: Engine.m_guid
        };

        jsonPacket['DailyTransactionLimit'] = convertToSatoshis($('#DailyTransactionLimit').val(), COINUNIT);
        jsonPacket['SingleTransactionLimit'] = convertToSatoshis($('#SingleTransactionLimit').val(), COINUNIT);
        jsonPacket['NoOfTransactionsPerDay'] = $('#NoOfTransactionsPerDay').val();
        jsonPacket['NoOfTransactionsPerHour'] = $('#NoOfTransactionsPerHour').val();
        jsonPacket['Inactivity'] = $('#Inactivity').val();
        jsonPacket['MinersFee'] = convertToSatoshis($('#MinersFee').val(), COINUNIT);

        if ($('#cuSelected').html() == 'BTC') {
            jsonPacket['CoinUnit'] = 'BTC';
        } else if ($('#cuSelected').html() == 'mBTC') {
            jsonPacket['CoinUnit'] = 'mBTC';
        } else {
            jsonPacket['CoinUnit'] = 'uBTC';
        }

        jsonPacket['Email'] = $('#Email').val();
        jsonPacket['EmailNotification'] = $('#EmailNotification').checked;
        jsonPacket['TwoFactor'] = $('#TwoFactor').val();
        jsonPacket['AutoEmailBackup'] = $('#AutoEmailBackup').val();
        jsonPacket['EmailVerified'] = $('#EmailVerified').val();
        jsonPacket['Phone'] = $('#Phone').val();
        jsonPacket['PhoneVerified'] = $('#PhoneVerified').val();
        jsonPacket['Language'] = $('#Language').val();
        jsonPacket['LocalCurrency'] = $('#LocalCurrency').val();
        jsonPacket['PhoneNotification'] = $('#PhoneNotification').val();
        jsonPacket['PasswordHint'] = $('#PasswordHint').val();
        jsonPacket['TwoFactorType'] = $('#TwoFactorType').val();


        Engine.updateAccountSettings(jsonPacket, $("#txtTwoFactorCodeForSettings").val(), function (err, response) {
            if (err) {
                $("#savesettingserror").show();
                $("#savesettingssuccess").hide();
                $("#savesettingserrormessage").html(response);
            } else {


                if (jsonPacket['CoinUnit'] != COINUNIT) {
                    COINUNIT = jsonPacket['CoinUnit'];
                    updateUI();
                    readAccountSettingsFromServerAndPopulateForm();
                }

                $("#savesettingssuccess").show();
                $("#savesettingserror").hide();
                $("#savesettingssuccessmessage").html("Settings saved successfully");

                //alert(response.body);
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
        amount = Math.round(amount)
        return amount;
    }

    function updateBalance() {

        Engine.getBalance(function (err, result) {

            //get in BTC units
            var balance = convertFromSatoshis(result.TotalBalance, COINUNIT);
            $("#balance").html(balance);
            $("#balanceTop").html(balance + " " + COINUNIT);
            $("#dashcoinunit").html(COINUNIT);
            var template = '';
            if (result.UnconfirmedBalance > 0) {
                template += '<div class="btn btn-warning btn-icon btn-rounded"><i class="fa fa-clock-o"></i></div>';
            } else {
                template += '<div class="btn btn-success btn-icon btn-rounded"><i class="fa fa-check"></i></div>';
            }

            $("#balancetimer").html(template);



        });

        //$("#balance").html(Math.floor((Math.random() * 100) + 1) + " BTC");
        //$("#message").fadeToggle(3000);

    }

    function updateNetwork() {

        // getNewFriends();
        //updateFriendRequests();
        getNewFriends();
    }



    var previousReqByMe = 0;
    function updateRequestsMadeByMe() {


        Engine.getPendingUserRequests(function (err, friends) {


            if (friends.length != previousReqByMe) {
                previousReqByMe = friends.length;
                $("#requestssent").html('');
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
        });




    }


    var lastNoOfFriends = 0;
    var invoiceSelectedUser = '';
    var invoiceSelectedAmount = 0;
    var selectedFriend = null;

    function updateFriends() {

        if (!noAlert == true) {

            //to do, move to handlebars templates
            Engine.getUserNetwork(function (err, friends) {

                FRIENDSLIST = {};
                $("#nfriends").html(friends.length);
                for (var i = 0; i < friends.length; i++) {
                    FRIENDSLIST[friends[i].userName] = friends[i];
                }

                //if selected friend is not isend and isreceive
                //then find in list and update

                if (selectedFriend != null) {

                    if (!selectedFriend.ICanSend || !selectedFriend.ICanReceive) {
                        selectedFriend = FRIENDSLIST[selectedFriend.userName];
                        updateSelectedFriend();
                    }

                }

                if (friends.length > lastNoOfFriends) {

                    lastNoOfFriends = friends.length;

                    $("#nfriends").html(friends.length);
                    $("#myfriends").html('');


                    var grouptemplate = '';

                    var friendsgroup = _.groupBy(friends, function (item) { return item.category; })

                    grouptemplate += '<div class="panel-group m-b" id="accordion2">';

                    var k = 0;
                    var g = 1;
                    for (var key in friendsgroup) {

                        friends = friendsgroup[key];

                        grouptemplate += '<div class="panel panel-default">';
                        grouptemplate += '<div class="panel-heading">';
                        grouptemplate += '<a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion2" href="#collapse' + g + '">';
                        grouptemplate += key;
                        grouptemplate += '</a>';
                        grouptemplate += '</div>';
                        grouptemplate += '<div id="collapse' + g + '" class="panel-collapse in">';
                        grouptemplate += '<div class="panel-body text-sm">';

                        for (var i = 0; i < friendsgroup[key].length; i++) {

                            var frnd = FRIENDSLIST[friends[i].userName];

                            var length = frnd.userName.length;
                            if (length > 20) {
                                length = 20;
                            }


                            var template = '<a href="#" class="media list-group-item" id="friend' + k + '"><div class="media">' +
                                '<span class="pull-left thumb-sm"><img src="images/avatar/64px/Avatar-' + pad(length) + '.png" alt="" class="img-circle"></span>' +
                                '<div class="pull-right text-success m-t-sm">' +
                                '<i class="fa fa-circle"></i>' +
                                '</div>' +
                                '<div class="media-body">' +
                                '<div>' + friends[i].userName + '</div>' +
                                '<small class="text-muted">I love Ninki!</small>' +
                                '</div>' +
                                '</div></a>';


                            grouptemplate += template;



                            k++;
                        }

                        grouptemplate += '</div>';
                        grouptemplate += '</div>';
                        grouptemplate += '</div>';
                        g++;
                    }

                    grouptemplate += '</div>';

                    $("#myfriends").html(grouptemplate);


                    var k = 0;
                    var g = 1;
                    for (var key in friendsgroup) {

                        friends = friendsgroup[key];
                        for (var i = 0; i < friendsgroup[key].length; i++) {

                            friends = friendsgroup[key];

                            $("#myfriends #friend" + k).click({ userName: friends[i].userName }, function (event) {

                                selectedFriend = FRIENDSLIST[event.data.userName];

                                //depreciate
                                SELECTEDFRIEND = event.data.userName;

                                updateSelectedFriend();

                            });
                            console.log("added click " + k + " for " + friends[i].userName);

                            k++;
                        }
                        g++;
                    }

                }

            });
        }

    }

    function showSecret() {


    }


    function updateSelectedFriend() {

        var length = selectedFriend.userName.length;
        if (length > 20) {
            length = 20;
        }

        $("#nselnetcat").val(selectedFriend.category);

        $('#friendempty').hide();

        $('#textMessageSend').removeClass('alert alert-danger');
        $('input#friendAmount').val('')
        $('#textMessageSend').hide();
        $('#sendfriendprog').hide();

        $("#networkvalidate").show();
        $("#friendSelectedName").html(selectedFriend.userName);
        $("#friendSelectedNameTo").html(selectedFriend.userName);
        $("#validateusername").html(selectedFriend.userName);
        $("#validateusername2").html(selectedFriend.userName);
        $("#validateusername3").html(selectedFriend.userName);
        $("#validateusername4").html(selectedFriend.userName);
        $("#validateusername5").html(selectedFriend.userName);
        $("#validatesuccess").hide();
        $("#validatefail").hide();

        if (selectedFriend.ICanSend) {
            $("#issend").show();
            $("#networksend").show();
        } else {
            $("#issend").hide();
            $("#networksend").hide();
        }
        if (selectedFriend.ICanReceive) {
            $("#isreceive").show();
        } else {
            $("#isreceive").hide();
        }

        $("#imgSelectedFriend").attr("src", "images/avatar/256px/Avatar-" + pad(length) + ".png");

        if (selectedFriend.validated) {
            $("#validateform").hide();
            $("#isvalidated").show();
            $("#networkvalidate").hide();
            $("#btnSendToFriend").prop('disabled', false);
            $("#btnSendToFriend").removeClass('disabled');
            $("#friendvalreq").hide();

        } else {
            $("#validateform").show();
            $("#isvalidated").hide();
            $("#networkvalidate").show();
            $("#btnSendToFriend").prop('disabled', true);
            $("#btnSendToFriend").addClass('disabled');
            $("#friendvalreq").show();
        }

        $("#pnlfriend").show();

        $('#tblnetinvbyme tbody').empty();
        $('#tblnetinvforme tbody').empty();

        lastInvoiceToPayNetCount = 0;
        lastInvoiceByMeNetCount = 0;
        showInvoiceListNetwork();
        showInvoiceByMeListNetwork();
    }


    var lastNoOfFriendsReq = 0;

    function updateFriendRequests() {

        //if there are any new friends
        //fade in the button

        //to do, move to handlebars templates
        Engine.getFriendRequests(function (err, friends) {

            if (friends.length > 0) {
                $("#contactrequestpanel").show();
            } else {
                $("#contactrequestpanel").hide();
            }

            $("#notifications").html(friends.length);
            $("#notificationsright").html(friends.length);
            $("#nfriendreq").html(friends.length);

            if (lastNoOfFriendsReq != friends.length || friends.length == 0) {

                lastNoOfFriendsReq = friends.length;

                if (friends.length > 0) {
                    $("#notifications").attr("class", "badge bg-danger pull-right");
                } else {
                    $("#notifications").attr("class", "badge pull-right");
                }
                $("#nfriendreq").html(friends.length);
                $("#friendreq").html('');
                for (var i = 0; i < friends.length; i++) {

                    var length = friends[i].userName.length;
                    if (length > 20) {
                        length = 20;
                    }

                    var template = '<li class="list-group-item"><a href="#" class="thumb pull-right m-l m-t-xs avatar">' +
                                '<img src="images/avatar/64px/Avatar-' + pad(length) + '.png" alt="John said" class="img-circle">' +
                                '</a>' +
                                '<div class="clear">' +
                                '<a href="#" class="text-info">' + friends[i].userName + '<i class="icon-twitter"></i></a>' +
                                '<small class="block text-muted">has requested you as a contact</small>' +
                                '<div id="imgrequestwaiting"></div><a href="#" id=\"btnaccept' + i + '\" class="btn btn-xs btn-success m-t-xs">Accept</a> <a href="#" class="btn btn-xs btn-success m-t-xs" onclick=\"rejectFriend(\'' + friends[i].userName + '\')\">Reject</a>' +
                                '</div></li>';

                    $("#friendreq").append(template);
                    $("#btnaccept" + i).button();

                }

                for (var i = 0; i < friends.length; i++) {


                    $("#friendreq #btnaccept" + i).click({
                        userName: friends[i].userName
                    }, function (event) {
                        acceptFriend(event.data.userName, function (err, res) {

                            //handle here instead

                        });
                    });


                }



            }


        });

    }

    var lastNoOfTrans = 0;

    function updateTransactions() {

        //if there are any new friends
        //fade in the button


        Engine.getTransactionRecords(function (err, transactions) {

            allTransactions = transactions;

            for (var i = 0; i < allTransactions.length; i++) {
                var d1 = new Date(allTransactions[i].TransDateTime);
                allTransactions[i].JsDate = d1;
            }
            //first convert to javascript dates

            filteredTransactions = allTransactions;
            //apply current filter currentTransactionFilter

            if (currentTransactionFilter == "Day") {
                var lastDay = new Date();
                lastDay = lastDay.setDate(lastDay.getDate() - 1);
                filteredTransactions = _.filter(allTransactions, function (trans) { return trans.JsDate > lastDay; });
            }

            if (currentTransactionFilter == "Week") {
                var lastWeek = new Date();
                lastWeek = lastWeek.setDate(lastWeek.getDate() - 7);
                filteredTransactions = _.filter(allTransactions, function (trans) { return trans.JsDate > lastWeek; });
            }

            if (currentTransactionFilter == "Month") {
                var lastMonth = new Date();
                lastMonth = lastMonth.setDate(lastMonth.getDate() - 31);
                filteredTransactions = _.filter(allTransactions, function (trans) { return trans.JsDate > lastMonth; });
            }

            if (currentTransactionFilter == "Search") {

                var search = $('#txttransearch').val();
                filteredTransactions = _.filter(allTransactions, function (trans) { return trans.UserName.search(search) > -1; });
            }

            if (currentTransactionSort == 'DateDesc') {
                filteredTransactions = _.sortBy(filteredTransactions, function (trans) { return -trans.JsDate; });
            }

            if (currentTransactionSort == 'DateAsc') {
                filteredTransactions = _.sortBy(filteredTransactions, function (trans) { return trans.JsDate; });
            }

            if (currentTransactionSort == 'ContactAsc') {
                filteredTransactions = _.sortBy(filteredTransactions, function (trans) { return trans.UserName; });
            }

            if (currentTransactionSort == 'ContactDesc') {
                filteredTransactions = _.sortBy(filteredTransactions, function (trans) { return trans.UserName; });
                filteredTransactions.reverse();
            }

            var noofpages = Math.floor((filteredTransactions.length / transactionsPerPage));

            var indexFrom = currentPageIndex * transactionsPerPage;
            var indexTo = indexFrom + transactionsPerPage;

            if (indexTo > filteredTransactions.length) {
                indexTo = filteredTransactions.length;
            }

            $('#tranpaglabel').html('Showing ' + (indexFrom + 1) + ' to ' + (indexTo) + ' of ' + filteredTransactions.length);

            transactions = filteredTransactions;

            if (transactions.length > lastNoOfTrans) {

                pagedTransactions = filteredTransactions.slice(indexFrom, indexTo);

                transactions = pagedTransactions;

                lastNoOfTrans = filteredTransactions.length;

                var template = '';
                $('#tbltran tbody').empty();
                for (var i = 0; i < transactions.length; i++) {

                    var dirTemplate = "";
                    if (transactions[i].TransType == 'S') {
                        dirTemplate = '<td><span class="m-s">' + convertFromSatoshis(transactions[i].Amount, COINUNIT) + ' ' + COINUNIT + '</span></td><td></td>';
                    }
                    if (transactions[i].TransType == 'R') {
                        dirTemplate = '<td></td><td><span class="m-s">' + convertFromSatoshis(transactions[i].Amount, COINUNIT) + ' ' + COINUNIT + '</span></td>';
                    }

                    var length = transactions[i].UserName.length;
                    if (length > 20) {
                        length = 20;
                    }

                    template += '<tr>' +
                                '<td><label class="checkbox m-n i-checks"><input type="checkbox" name="post[]"><i></i></label></td>' +
                                '<td><span class="m-s">' + transactions[i].TransDateTime + '</span></td>' +
                                '<td colspan="2">' +
                                '<span class="thumb-sm"><img src="images/avatar/64px/Avatar-' + pad(length) + '.png" alt="John said" class="img-circle"></span><span class="m-s"> ' +
                                 transactions[i].UserName + '</span></td>' +
                                dirTemplate +
                                '<td>';

                    if (transactions[i].Confirmations < 6) {
                        template += '<div class="bcconf"><div class="btn btn-warning btn-icon btn-rounded"><i class="fa fa-clock-o">' + transactions[i].Confirmations + '</i></div></div>';
                    } else {
                        template += '<div class="bcconf"><div class="btn btn-success btn-icon btn-rounded"><i class="fa fa-check"></i></div></div>';
                    }
                    template += '</td><td>';
                    template += '<div id ="btnpop' + i + '"><div class="btn btn-info btn-icon btn-rounded"><i class="fa fa-info-circle"></i></div></div>';

                    template += '</td></tr>';

                }

                $('#tbltran tbody').append(template);

                for (var i = 0; i < transactions.length; i++) {


                    var popcontent = '';

                    popcontent += '<p><strong>Date:</strong> ';
                    popcontent += transactions[i].TransDateTime;
                    popcontent += '</p>';

                    popcontent += '<p><strong>TransactionId</strong></p>';
                    popcontent += '<p><a target="_new" href="http://btc.blockr.io/tx/info/' + transactions[i].TransactionId + '">';
                    popcontent += transactions[i].TransactionId;
                    popcontent += '</a></p>';

                    popcontent += '<p><strong>Address:</strong> ';
                    popcontent += transactions[i].Address;
                    popcontent += '</p>';

                    popcontent += '<p><strong>Amount:</strong> ';
                    popcontent += convertFromSatoshis(transactions[i].Amount, COINUNIT) + ' ';
                    popcontent += COINUNIT + '</p>';

                    popcontent += '<p><strong>Send/Receive:</strong> ';
                    popcontent += transactions[i].TransType;
                    popcontent += '</p>';

                    $("#btnpop" + i).popover({
                        placement: 'right', // top, bottom, left or right
                        title: 'Transaction Details',
                        html: 'true',
                        content: '<div>' + popcontent + '</div>'
                    });
                }

            } else {


                pagedTransactions = filteredTransactions.slice(indexFrom, indexTo);

                transactions = pagedTransactions;

                //we ony need to update the confirmations

                $('#tbltran tbody tr .bcconf').each(function (index, elem) {
                    if (transactions[index].Confirmations < 6) {
                        $(elem).html('<div class="btn btn-warning btn-icon btn-rounded"><i class="fa fa-clock-o">' + transactions[index].Confirmations + '</i></div>');
                    } else {
                        $(elem).html('<div class="btn btn-success btn-icon btn-rounded"><i class="fa fa-check"></i></div>');
                    }

                });

                for (var i = 0; i < transactions.length; i++) {
                    $("#btnpop" + i).popover({
                        placement: 'top', // top, bottom, left or right
                        title: 'This is my Title',
                        html: 'true',
                        content: '<div id="popOverBox' + i + '">Your Text Here</div>'
                    });
                }

            }
        });

    }




    function generateAddressClient() {


        Engine.createAddress('m/0/0', 1, function (err, newAddress, path) {

            var options = { text: newAddress, width: 172, height: 172 };

            $('#requestaddressqr').html('');
            $('#requestaddressqr').qrcode(options);

            $('#requestaddresstxt').html(newAddress);

            //$('#requestaddress').html(tempate);
            $('#requestaddress').show();


        });

    }


    function sendMoney(friend, index) {

        $('#textMessageSend').removeClass('alert alert-danger');
        if (friend == null) {
            return;
        }

        var amount = $('input#friendAmount').val();
        amount = convertToSatoshis(amount, COINUNIT);


        if (amount > 0) {
            $('input#friendAmount').css("border-color", "#ccc");
            $('#textMessageSend').html('Creating transaction...');
            $('#textMessageSend').show();
            $('#sendfriendprogstatus').width('3%')
            $('#sendfriendprog').show();
            $('#sendfriendprogstatus').width('10%');
            Engine.sendTransaction('friend', friend, '', amount, function (err, transactionid) {

                if (!err) {
                    updateBalance();
                    $('#textMessageSend').html('You sent ' + convertFromSatoshis(amount, COINUNIT) + ' ' + COINUNIT + ' to ' + friend);
                    $('input#friendAmount').val('');
                    $('#textMessageSend').fadeOut(5000);
                    $('#sendfriendprog').fadeOut(5000);
                } else {
                    $('#textMessageSend').addClass('alert alert-danger');
                    $('#sendfriendprogstatus').width('0%')

                    if (transactionid == "ErrInsufficientFunds") {
                        $('#textMessageSend').html('Transaction Failed: Insufficient funds');
                    }

                }
                // alert(transactionid);
            });

        } else {
            $('input#friendAmount').css("border-color", "#ffaaaa");
        }


    }


    function sendMoneyStd() {


        var amount = $('input#amount').val();
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
            $('input#amount').css("border-color", "#ccc");
        } else {
            $('input#amount').css("border-color", "#ffaaaa");
            allok = false;
        }

        if (allok) {

            $('#textMessageSendStd').html('Creating transaction...');
            $('#textMessageSendStd').show();
            $('#sendstdprogstatus').width('3%')
            $('#sendstdprog').show();
            $('#sendstdprogstatus').width('10%');


            Engine.sendTransaction('standard', '', address, amount, function (err, transactionid) {

                if (!err) {

                    $('#textMessageSendStd').html('You sent ' + convertFromSatoshis(amount, COINUNIT) + ' ' + COINUNIT + ' to <span style="word-wrap:break-word;">' + address + '</span>');
                    $('input#amount').val('');
                    $('#textMessageSendStd').fadeOut(5000);
                    $('#sendstdprog').fadeOut(5000);

                } else {

                    if (transactionid == "ErrInsufficientFunds") {
                        $('#textMessageSendStd').html('Transaction Failed: Insufficient funds');
                    }

                    $('#sendstdprogstatus').width('0%')
                    $('#textMessageSendStd').addClass('alert alert-danger');
                }
            });
        }

    }



    function addFriend() {

        var username = $('input#friend').val();

        if (username.length == 0 || Engine.m_nickname == username) {
            $("#friend").css("border-color", "#ffaaaa");
            return;
        }

        $("#imgaddcontactwaiting").show();
        var target = document.getElementById('imgaddcontactwaiting');
        var spinner = new Spinner(spinneropts).spin(target);


        //verify input and if username exists
        $("#addcontactalert").hide();


        //merge these functions

        Engine.doesUsernameExist(username, function (err, usernameExistsOnServer) {

            //also check if friend already

            if (usernameExistsOnServer) {

                Engine.isNetworkExist(username, function (err, result) {

                    if (!result) {

                        $("#friend").css("border-color", "#ccc");

                        Engine.createFriend(username, function (err, result) {
                            if (err) {
                                alert("Wallet could not be opened.\n\n" + err);
                            } else {

                                $("#friend").val('');
                                $("#imgaddcontactwaiting").hide();
                                $("#addcontactsuccess").show();
                                $("#addcontactsuccessmessage").html("You requested " + username + " as a contact");
                                $("#addcontactsuccess").fadeOut(5000);

                                updateRequestsMadeByMe();
                            }
                        });

                    } else {

                        $("#friend").css("border-color", "#ffaaaa");
                        $("#addcontactalert").show();
                        $("#addcontactalertmessage").html("You have already requested " + username + " as a contact");
                        $("#imgaddcontactwaiting").hide();

                    }
                });

            } else {

                $("#friend").css("border-color", "#ffaaaa");
                $("#addcontactalert").show();
                $("#addcontactalertmessage").html("The username could not be found");
                $("#imgaddcontactwaiting").hide();

            }
        });


    }


    function rejectFriend(username) {

        Engine.rejectFriendRequest(username, function (err, result) {

            updateFriendRequests();

        });
    }

    function acceptFriend(username) {


        $("#imgrequestwaiting").show();
        var target = document.getElementById('imgrequestwaiting');
        var spinner = new Spinner(spinneropts).spin(target);

        //$('#friendreq').fadeOut(1000);
        Engine.acceptFriendRequest(username, function (err, secret) {
            if (err) {
                alert("Wallet could not be opened.\n\n" + err);
            } else {

                Engine.isNetworkExist(username, function (err, result) {

                    if (!result) {

                        Engine.createFriend(username, function (err, result) {

                            if (err) {

                            } else {

                            }
                        });

                    }

                    lastNoOfFriendsReq = 0;

                    updateFriendRequests();

                });
            }
            $("#imgrequestwaiting").hide();
        });


    }


    function ensureOpenWalletGuidAndPasswordValid() {

        if (Engine.isRealGuid($("#openWalletStart input#guid").val())) {
            $("#openWalletStart input#guid").css("border-color", "#ccc");
        } else {
            $("#openWalletStart input#guid").css("border-color", "#ffaaaa");
        }

        if ($("#openWalletStart input#password").val().length == 0) {
            $("#openWalletStart input#password").css("border-color", "#ffaaaa");
        } else {
            $("#openWalletStart input#password").css("border-color", "#ccc");
        }

        if (!Engine.isRealGuid($("#openWalletStart input#guid").val()) ||
                    $("#openWalletStart input#password").val().length == 0) {

            return false;
        }

        return true;
    }

    function ensureCreateWalletGuidNicknameAndPasswordValid() {

        if (Engine.isRealGuid($("#createWalletStart input#guid").val())) {
            $("#createWalletStart input#guid").css("border-color", "#ccc");
        } else {
            $("#createWalletStart input#guid").css("border-color", "#ffaaaa");
        }

        //TODO Check nickname does not already exist
        if ($("#createWalletStart input#nickname").val().length == 0 || $("#createWalletStart input#nickname").val().length > 20) {
            $("#createWalletStart input#nickname").css("border-color", "#ffaaaa");
        } else {
            $("#createWalletStart input#nickname").css("border-color", "#ccc");
        }

        if (!Engine.isRealGuid($("#createWalletStart input#guid").val()) ||
                    $("#createWalletStart input#cpassword").val().length == 0 ||
                    $("#createWalletStart input#nickname").val().length == 0 ||
                    $("#createWalletStart input#nickname").val().length > 20) {

            return false;
        } else {
            return true;
        }

    }

    function validate() {

        if (Engine.isRealGuid($("input#guid").val())) {
            $("input#guid").css("background-color", "#ffffff");
        } else {
            $("input#guid").css("background-color", "#ffaaaa");
        }

        if (!Engine.isRealGuid($("input#guid").val()) ||
                    $("input#password").val().length == 0) {

            return false;
        }

        return true;
    }

}

module.exports = UI;
