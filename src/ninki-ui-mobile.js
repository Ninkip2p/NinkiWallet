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
    var norefresh = false;

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


    var profilepagestate = '';
    var networkpagestate = '';
    var friendpagestate = '';
    var menustate = '';
    var cl = '';

    jQuery(document).ready(function () {


        var $body = jQuery('body');

        /* bind events */
        $(document).on('focus', 'input', function (e) {
            $(".footer").hide();
        });


        $(document).on('blur', 'input', function (e) {
            $(".footer").show();
        });

        $("#dashsend").hide();
        $("#dashreceive").hide();
        $("#dashcontact").hide();


        $("#addcontactmodal").hide();



        $('.num').bind('touchstart', function () {
            $(this).removeClass('numtapoff');

            cl = 'b' + (Math.floor(Math.random() * 6) + 1) + '';
            //alert(cl);
            $(this).addClass(cl);

        })

        $('.num').bind('touchend', function () {

            var num = $(this);
            var text = $.trim(num.find('.txt').clone().children().remove().end().text());
            var loginpinno = $('#loginpinno');

            $(loginpinno).val(loginpinno.val() + text);

            if ($(loginpinno).val().length == 4) {

                $("#pinscreen").hide();

                $("#btnLoginPIN").click();


            }



            var self = this;
            setTimeout(function () {
                //alert(cl);
                $(self).removeClass('b1 b2 b3 b4 b5 b6');
                $(self).addClass('numtapoff');
            }, 100);

        })





        //        $(".num").hammer({
        //            drag: false,
        //            transform: false,
        //            hold: false,
        //            touch: false,
        //            tap: true,
        //            tapAlways: false,
        //            swipe: false,
        //            release: false,
        //            tapMaxTime: 1000
        //        }).bind("tap", function (ev) {

        //            $(this).addClass('numtap');

        //            //            var num = $(this);
        //            //            var text = $.trim(num.find('.txt').clone().children().remove().end().text());
        //            //            var telNumber = $('#telNumber');
        //            //            $(telNumber).val(telNumber.val() + text);
        //        });

        //        $(".num").click(function () {

        //            $(this).addClass('numtap');

        //            //            var num = $(this);
        //            //            var text = $.trim(num.find('.txt').clone().children().remove().end().text());
        //            //            var telNumber = $('#telNumber');
        //            //            $(telNumber).val(telNumber.val() + text);
        //        });


        $("#btnmenuprofile").hammer({
            drag: false,
            transform: false,
            hold: false,
            touch: false,
            tap: true,
            tapAlways: false,
            swipe: false,
            release: false,
            tapMaxTime: 1000
        }).bind("tap", function (ev) {

            displayProfile();


        });

        $("#btnmenuprofile").hammer({
            drag: false,
            transform: false,
            hold: false,
            touch: true,
            tap: false,
            tapAlways: false,
            swipe: false,
            release: false
        }).bind("touch", function (ev) {

            displayProfile();


        });


        $("#btnmenuprofile").hammer({
            drag: false,
            transform: false,
            hold: false,
            touch: false,
            tap: false,
            tapAlways: false,
            swipe: false,
            release: true
        }).bind("release", function (ev) {

            displayProfile();


        });

        $("#btnmenuprofile").hammer({
            drag: false,
            transform: false,
            hold: true,
            touch: false,
            tap: false,
            tapAlways: false,
            swipe: false,
            release: false
        }).bind("hold", function (ev) {

            displayProfile();


        });

        function displayProfile() {


            if (menustate != 'profile') {
                menustate = 'profile';
                $("#settings").hide();
                $("#network").hide();
                $("#dashboard").show();
                $("#networklist").hide();
                $("#invoices").hide();

            } else {
                profilehome();
            }

            $("#btnmenusettings").attr('style', 'background-color:#ffffff');
            $("#btnmenunetwork").attr('style', 'background-color:#ffffff');
            $("#btnmenuprofile").attr('style', 'background-color:#eaeef1');

        }


        $("#btnmenunetwork").hammer({
            drag: false,
            transform: false,
            hold: false,
            touch: false,
            tap: true,
            tapAlways: false,
            swipe: false,
            release: false,
            tapMaxTime: 1000
        }).bind("tap", function (ev) {

            displayNetwork();

        });

        $("#btnmenunetwork").hammer({
            drag: false,
            transform: false,
            hold: false,
            touch: true,
            tap: false,
            tapAlways: false,
            swipe: false,
            release: false
        }).bind("touch", function (ev) {

            displayNetwork();

        });

        $("#btnmenunetwork").hammer({
            drag: false,
            transform: false,
            hold: true,
            touch: false,
            tap: false,
            tapAlways: false,
            swipe: false,
            release: true
        }).bind("release", function (ev) {

            displayNetwork();

        });


        $("#btnmenunetwork").hammer({
            drag: false,
            transform: false,
            hold: true,
            touch: false,
            tap: false,
            tapAlways: false,
            swipe: false,
            release: false
        }).bind("hold", function (ev) {

            displayNetwork();

        });

        function displayNetwork() {

            if (menustate != "network") {
                menustate = "network";
                $("#settings").hide();
                $("#network").show();
                $("#dashboard").hide();
                $("#networklist").show();


                if (networkpagestate == "invoice") {


                    $("#network").hide();

                    $("#invoices").show();
                }

            } else {

                networkhome();
            }

            $("#btnmenusettings").attr('style', 'background-color:#ffffff');
            $("#btnmenuprofile").attr('style', 'background-color:#ffffff');
            $("#btnmenunetwork").attr('style', 'background-color:#eaeef1');
        }


        $("#invformelink").hammer(null).bind("tap", function () {
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
        $("#tapsendfriend").hammer(null).bind("tap", function () {
            $("#networksend").show();
            $("#pnlfriendinv").hide();
            networkpagestate = "friend";
            friendpagestate = "send";
        });

        $("#tapinvoicefriend").hammer(null).bind("tap", function () {
            $("#pnlfriendinv").show();
            $("#networksend").hide();
            networkpagestate = "friend";
            friendpagestate = "invoice";

        });

        function networkhome() {
            if (networkpagestate == "invoice") {
                $('#network').show();
                $('#invoices').hide();
                networkpagestate = "friend";
                friendpagestate = "invoice";


            } else {
                $("#pnlfriend").hide();
                $("#myfriends").show();
                $("#networklist").show();
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
            profilepagestate = "";

        }


        $("#btnmenusettings").hammer({
            drag: false,
            transform: false,
            hold: false,
            touch: false,
            tap: true,
            tapAlways: false,
            swipe: false,
            release: false,
            tapMaxTime: 1000
        }).bind("tap", function (ev) {

            menustate = "settings";

            $("#settings").show();
            $("#network").hide();
            $("#networklist").hide();
            $("#dashboard").hide();

            $("#btnmenusettings").attr('style', 'background-color:#eaeef1');
            $("#btnmenuprofile").attr('style', 'background-color:#ffffff');
            $("#btnmenunetwork").attr('style', 'background-color:#ffffff');
        });

        $("#tapsend").hammer(null).bind("tap", function () {
            $("#dashprofile").hide();
            $("#dashsend").show();
            $("#dashreceive").hide();
            $("#dashcontact").hide();
            //$("#toAddress").focus();
            profilepagestate = "send";
            menustate = "profile"


        });

        $("#tapreceive").hammer(null).bind("tap", function () {
            $("#dashprofile").hide();
            $("#dashsend").hide();
            $("#dashreceive").show();
            $("#dashcontact").hide();
            profilepagestate = "receive";
            menustate = "profile"

        });

        $("#taprequest").hammer(null).bind("tap", function () {
            $("#dashprofile").hide();
            $("#dashsend").hide();
            $("#dashreceive").hide();
            $("#dashcontact").show();
            profilepagestate = "contact";
            menustate = "profile"

        });


        $('#imgProfileContainer').show();
        $("#dropzone").hide();
        $("#btnSaveProfile").hide();
        $("#btnCancelProfile").hide();
        $("#statusedit").hide();
        $("#imgreset").hide();


        $("#btnEditProfile").click(function () {

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

        $("#imgreset").click(function () {

            Engine.m_profileImage = "";
            imgReset = true;

            var imageSrc = "images/avatar/256px/Avatar-" + pad(Engine.m_nickname.length) + ".png";

            document.getElementById('imgProfile').src = imageSrc;
            $('#imgProfileContainer').show();
            $('#dropzone').hide();
            $('progressNumber').html('');
            $("#imgreset").hide();

        });

        var imgReset = false;
        $("#btnSaveProfile").click(function () {

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
                    $("#mystatus").html(statusText);
                    $("#txtStatusText").val(statusText);
                    $("#profnmests").show();
                    $("#imgreset").hide();
                    imgReset = false;
                    $("#profileimgfile").val('');
                    $("#progressNumber").val('');

                }

            });

        });

        $("#btnCancelProfile").click(function () {

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
            $('progressNumber').html('');
            $("#imgreset").hide();

        }

        function uploadFailed(evt) {
            alert("There was an error attempting to upload the file." + evt);
        }

        function uploadCanceled(evt) {
            alert("The upload has been canceled by the user or the browser dropped the connection.");
        }

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




    $('#btnPassphraseLogin').keydown(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
    });

    $('#frmSaveTwoFactor').keydown(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
    });

    $('#phrase2fa').keydown(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
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



        getCookie('guid', function (res) {
            if (res.length == 0) {

                var betafrom = 'December 12, 2009 12:00 pm GMT';
                var betato = 'December 12, 2009 01:00 pm GMT';

                betafrom = getLocalTime(betafrom);
                betato = getLocalTime(betato);

                $('#betafrom').html(betafrom);
                $('#betato').html(betato);

                $('#basicModal').modal('show');

                $("#btnDeclineBeta").click(function () {
                    window.location.href = '/'
                });

            }
        });



        $("#btnAcceptBeta").click(function () {
            $("#openWalletStart #password").focus();
        });





        $("#btncreatewallet").click(function () {
            showCreateWalletStart();
        });


        $("#pairdeviceblob").change(function () {

            $("#loginpin").hide();
            $("#pairstep1").hide();
            $("#pairstep2").show();


        });


        $("#btnUnpair").click(function () {


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


        $("#btnPairDevice").click(function () {

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

                    $('#pairdevicealertmessage').html(response);

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

                                                    initialiseUI();

                                                } else {


                                                    $('#pairdevicealertmessage').html("could not pair");
                                                    $('#pairdevicealert').show();
                                                }


                                            } else {

                                                $('#pairdevicealertmessage').html(result);
                                                $('#pairdevicealert').show();
                                            }

                                        });
                                    } else {

                                        $('#pairdevicealertmessage').html("The pairing token has expired");
                                        $('#pairdevicealert').show();
                                    }


                                } else {

                                    $('#pairdevicealertmessage').html(result);
                                    $('#pairdevicealert').show();

                                }

                            });

                        } else {

                            $('#pairdevicealertmessage').html(secvalid);
                            $('#pairdevicealert').show();

                        }

                    });

                }

            });


        });

        $("#btnLoginPIN").click(function () {

            var pin = $("#loginpinno").val();

            $("#enterpinalert").hide();

            if (pin.length == 4) {

                getCookie("guid", function (guid) {

                    Engine.m_oguid = guid;

                    var bytes = [];
                    for (var i = 0; i < guid.length; ++i) {
                        bytes.push(guid.charCodeAt(i));
                    }

                    Engine.m_guid = Bitcoin.Crypto.SHA256(Bitcoin.convert.bytesToWordArray(bytes)).toString();


                    Engine.getDeviceKey(pin, function (err, ekeyv) {

                        //decrypt the passcode

                        if (!err) {

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
                                        if (!Engine.m_appInitialised) {
                                            Engine.openWallet(guid, fatoken, function (err, result) {

                                                if (!err) {

                                                    if (result.TwoFactorOnLogin) {

                                                        $("#loginpinno").val('');
                                                        $("#enterpinalert").show();
                                                        $("#enterpinalertmessage").html('Token has expired');

                                                    } else {

                                                        $("#loginpin").hide();
                                                        $("#loginpinno").val('');

                                                        initialiseUI();
                                                        Engine.m_appInitialised = true;
                                                    }

                                                } else {

                                                }

                                            });

                                        } else {

                                            if (ekeyv.SessionToken) {
                                                $("#API-Token").val(ekeyv.SessionToken);
                                            }
                                            //set new session key

                                            $("#loginpin").hide();
                                            $("#loginpinno").val('');

                                            initialiseUI();

                                        }

                                    }

                                });

                            });

                        } else {


                            if (ekeyv == "ErrDeviceDestroyed") {

                                deleteCookie("ninki_reg");
                                deleteCookie("ninki_p");
                                deleteCookie("ninki_rem");
                                deleteCookie("guid");

                                location.reload();
                            }

                            $("#loginpinno").val('');
                            $("#enterpinalert").show();
                            $("#enterpinalertmessage").html(ekeyv);

                        }

                    });

                });

            }

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

                //decrypt the password using the key sent back from the server


                Engine.setPass(password, guid);

                getCookie("ninki_rem", function (res) {

                    if (res.length > 0) {
                        var enc = JSON.parse(res);
                        twoFactorCode = Engine.decryptNp(enc.ct, Engine.m_password, enc.iv);
                    }

                    setCookie('guid', guid);

                    Engine.openWallet(guid, twoFactorCode, function (err, result) {

                        $("#imgopenwaiting").hide();
                        $("#btnLogin").prop('disabled', false);
                        $("#btnLogin").removeClass('disabled');

                        if (!err) {

                            $("#imgopenwaiting").hide();
                            $("#openwalletalert").hide();

                            if (result.TwoFactorOnLogin) {

                                //delete any old 2 factor tokens

                                deleteCookie("ninki_rem");

                                if (!result.Beta12fa) {

                                    $('#openWalletStart input#password').val('');

                                    if (result.TwoFactorOnLogin) {
                                        $("#siguid").hide();
                                        $("#silguid").hide();
                                        $("#sipwd").hide();
                                        $("#si2fa").show();
                                        $("#sib1").hide();
                                        $("#sib2").show();
                                        $('#openWalletStart input#twoFactorCode').focus();

                                    }
                                } else {

                                    //for beta1 migrations
                                    $("#siguid").hide();
                                    $("#silguid").hide();
                                    $("#sipwd").hide();
                                    $("#si2fa").show();
                                    $("#sib1").hide();
                                    $("#sib2").show();
                                    $('#openWalletStart input#twoFactorCode').focus();

                                }

                            } else {



                                //initiate 2fa setup modal
                                if (!m_this.m_twoFactorOnLogin) {
                                    $("#twofactorsettings").show();
                                    $("#2famodal").modal('show');

                                    $("#twofactorsettings").show();
                                    $("#btnSetupTwoFactor").hide();
                                    $("#savetwofactorerror").hide();
                                    $("#setup2faemail").hide();
                                    $("#setup2faqr").show();

                                    showSettingsTwoFactorQr();

                                } else {

                                    initialiseUI();

                                }

                            }

                            $("#unlockaccount").hide();

                        } else {
                            $("#imgopenwaiting").hide();
                            $("#openwalletalert").show();

                            if (result == "ErrAccount") {
                                $("#openwalletalertmessage").html("Incorrect password");
                            }

                            if (result == "ErrLocked") {
                                $("#openwalletalertmessage").html("Your account has been locked.");
                                $("#unlockaccount").show();
                            } else {
                                $("#unlockaccount").hide();
                            }
                        }

                    });

                });
            }, 100);
        });


        $("#btn2faLogin").click(function () {


            $("#img2faopenwaiting").show();
            $("#btn2faLogin").prop('disabled', true);
            $("#btn2faLogin").addClass('disabled');
            var target = document.getElementById('img2faopenwaiting');
            var spinner = new Spinner(spinneropts).spin(target);


            setTimeout(function () {

                var twoFactorCode = $('#openWalletStart input#twoFactorCode').val();
                var rememberTwoFactor = $('#twofactorremember')[0].checked;

                Engine.openWallet2fa(twoFactorCode, rememberTwoFactor, function (err, result) {

                    if (err) {

                        $("#img2faopenwaiting").hide();
                        $("#openwalletalert").show();
                        $("#openwalletalertmessage").html(result);
                        $("#btn2faLogin").prop('disabled', false);
                        $("#btn2faLogin").removeClass('disabled');
                    } else {

                        if (result.CookieToken) {

                            setCookie("ninki_rem", result.CookieToken);
                        }

                        initialiseUI();
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

            addFriend($('input#friend').val());

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



        $("#btnsendmoneystd").hammer(null).bind("tap", function () {

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
                                if (result == "ErrEmailExists") {

                                    $("#createWalletStart input#emailaddress").css("border-color", "#ffaaaa");
                                    $("#imgcreatewaiting").hide();

                                    $("#createwalletalert").show();
                                    $("#createwalletalertmessage").html("The email address is already in use");

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

                setCookie('guid', Engine.m_oguid);

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


        //transaction filters

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


        //invoice filters
        //for me
        $("#optPending").click(function () {
            invoiceFilterOn = true;
            currentInvoiceFilter = 'Pending';
            lastInvoiceToPayCount = -1;
            showInvoiceList();
        });

        $("#optPaid").click(function () {
            invoiceFilterOn = true;
            currentInvoiceFilter = 'Paid';
            lastInvoiceToPayCount = -1;
            showInvoiceList();
        });

        $("#optRejected").click(function () {
            invoiceFilterOn = true;
            currentInvoiceFilter = 'Rejected';
            lastInvoiceToPayCount = -1;
            showInvoiceList();
        });

        $("#optClearInvoice").click(function () {
            invoiceFilterOn = false;
            currentInvoiceFilter = '';
            lastInvoiceToPayCount = -1;
            showInvoiceList();
        });

        $('#btnSearchInvForMe').click(function () {
            currentForMeInvoicePageIndex = 0;
            invoiceFilterOn = true;
            currentInvoiceFilter = 'Search';
            lastInvoiceToPayCount = -1;
            showInvoiceList();
        });





        //by me
        //invoice filters
        $("#optByMePending").click(function () {
            invoiceByMeFilterOn = true;
            currentByMeInvoiceFilter = 'Pending';
            lastInvoiceByUserCount = -1;
            showInvoiceByUserList();
        });

        $("#optByMePaid").click(function () {
            invoiceByMeFilterOn = true;
            currentByMeInvoiceFilter = 'Paid';
            lastInvoiceByUserCount = -1;
            showInvoiceByUserList();
        });

        $("#optByMeRejected").click(function () {
            invoiceByMeFilterOn = true;
            currentByMeInvoiceFilter = 'Rejected';
            lastInvoiceByUserCount = -1;
            showInvoiceByUserList();
        });

        $("#optByMeClear").click(function () {
            invoiceByMeFilterOn = false;
            currentByMeInvoiceFilter = '';
            lastInvoiceByUserCount = -1;
            showInvoiceByUserList();
        });

        $('#btnSearchInvByMe').click(function () {
            currentByMeInvoicePageIndex = 0;
            invoiceByMeFilterOn = true;
            currentByMeInvoiceFilter = 'Search';
            lastInvoiceByUserCount = -1;
            showInvoiceByUserList();
        });

        $('#ibmpagfirst').click(function () {
            currentByMeInvoicePageIndex = 0;
            lastInvoiceByMeNetCount = -1;
            showInvoiceByUserList();
        });

        $('#ibmpaglast').click(function () {
            currentByMeInvoicePageIndex = Math.floor((filteredByMeInvoices.length / invoicesByMePerPage));
            lastInvoiceByMeNetCount = -1;
            showInvoiceByUserList();
        });

        $('#ibmpagnext').click(function () {
            if (currentByMeInvoicePageIndex < Math.floor((filteredByMeInvoices.length / invoicesByMePerPage))) {
                currentByMeInvoicePageIndex = currentByMeInvoicePageIndex + 1;
                lastInvoiceByMeNetCount = -1;
                showInvoiceByUserList();
            }
        });

        $('#ibmpagprev').click(function () {
            if (currentByMeInvoicePageIndex > 0) {
                currentByMeInvoicePageIndex = currentByMeInvoicePageIndex - 1;
                lastInvoiceByMeNetCount = -1;
                showInvoiceByUserList();
            }
        });


        //for me

        $('#ifmpagfirst').click(function () {
            currentForMeInvoicePageIndex = 0;
            lastInvoiceToPayCount = -1;
            showInvoiceList();
        });

        $('#ifmpaglast').click(function () {
            currentForMeInvoicePageIndex = Math.floor((filteredForMeInvoices.length / invoicesForMePerPage));
            lastInvoiceToPayCount = -1;
            showInvoiceList();
        });

        $('#ifmpagnext').click(function () {
            if (currentForMeInvoicePageIndex < Math.floor((filteredForMeInvoices.length / invoicesForMePerPage))) {
                currentForMeInvoicePageIndex = currentForMeInvoicePageIndex + 1;
                lastInvoiceToPayCount = -1;
                showInvoiceList();
            }
        });

        $('#ifmpagprev').click(function () {
            if (currentForMeInvoicePageIndex > 0) {
                currentForMeInvoicePageIndex = currentForMeInvoicePageIndex - 1;
                lastInvoiceToPayCount = -1;
                showInvoiceList();
            }
        });



        getCookie('ninki_reg', function (res) {

            if (res.length > 0) {

                showOpenWalletStart();

            } else {

                showCreateWalletStart();
            }
        })

        $("#password").keypress(function (e) {
            if (e.which == 13) {
                $("#btnLogin").click();
            }
        });


        $("#twoFactorCode").keypress(function (e) {
            if (e.which == 13) {
                $("#btn2faLogin").click();
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

        //$("#balance").html("... BTC");

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

        $("#btnSendToFriend").hammer(null).bind("tap", function () {


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
                    FRIENDSLIST[selectedFriend.userName].validated = true;
                    updateSelectedFriend();

                    //update list also

                    //find friend in list and update the validated icon
                    $("#myfriends #seltarget" + selectedFriend.userName).html('<div class="pull-right text-success m-t-sm"><i class="fa fa-check-square" style="font-size:1.5em"></i></div>');


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

        $("#btnpayinvoice").hammer(null).bind("tap", function () {

            payInvoice(selectedInvoiceUserName, selectedInvoiceAmount, selectedInvoiceId);

        });

        $("#btnrejectinvoice").hammer(null).bind("tap", function () {

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

        $("#payinvoicecancel").hammer(null).bind("tap", function () {


            $("#invoices").hide();
            $("#network").show();

            //if (uiInvoiceReturnToNetwork) {
            //$("#hnetwork").click();
            //uiInvoiceReturnToNetwork = false;
            //}


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
                        lastInvoiceByUserCount = -1;
                        lastInvoiceByMeNetCount = -1;

                        showInvoiceByUserList(function (err, result) {

                            showInvoiceByMeListNetwork(function (err, result) {


                            });

                        });


                        //updateSelectedFriend();

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


                $('#line' + lineCount + 'Quantity').blur({
                    line: lineCount
                }, function (event) {
                    if (validateInvoice()) {
                        $('#lineTotal' + (event.data.line)).html(($('#line' + (event.data.line) + 'Amount').val() * $('#line' + (event.data.line) + 'Quantity').val()).toFixed(4));
                        calcInvoiceTotals();
                    } else {
                        //$('#line' + (event.data.line) + 'Amount').
                    }
                });


                $('#line' + lineCount + 'desc').blur(function (event) {
                    validateInvoice();
                });

                $('#line' + lineCount + 'Amount').keypress({
                    line: lineCount
                }, function (e) {
                    if (e.which == 13) {
                        $('#line' + lineCount + 'Amount').blur();
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
        $("#openWalletStart #password").focus();
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

            calcInvoiceTotals();

            //if (subTotal > 0) {
            //$("#subtotal").html(subTotal.toFixed(4));
            //$("#tax").html((subTotal * 0.10).toFixed(4));
            //$("#total").html((subTotal + (subTotal * 0.10)).toFixed(4));
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
    function showInvoiceList(callback) {
        //get back the list of invoices to pay

        Engine.getInvoiceList(function (err, invoices) {


            if (lastInvoiceToPayCount < invoices.length) {

            } else {

                return callback(false, "done");

            }

            for (var i = 0; i < invoices.length; i++) {
                var d1 = new Date(invoices[i].InvoiceDate);
                invoices[i].JsDate = d1;
            }

            invoices = _.sortBy(invoices, function (inv) { return -inv.JsDate; });

            filteredForMeInvoices = invoices;

            //perform all filters then set back to invoices

            if (currentInvoiceFilter == "Pending") {

                filteredForMeInvoices = _.filter(invoices, function (inv) { return inv.InvoiceStatus == 0; });
            }

            if (currentInvoiceFilter == "Paid") {

                filteredForMeInvoices = _.filter(invoices, function (inv) { return inv.InvoiceStatus == 1; });
            }

            if (currentInvoiceFilter == "Rejected") {

                filteredForMeInvoices = _.filter(invoices, function (inv) { return inv.InvoiceStatus == 2; });
            }


            if (currentInvoiceFilter == "Search") {
                var search = $('#txtSearchInvForMe').val();
                filteredForMeInvoices = _.filter(invoices, function (inv) { return inv.InvoiceFrom.search(search) > -1; });
            }


            var noofpages = Math.floor((filteredForMeInvoices.length / invoicesForMePerPage));

            var indexFrom = currentForMeInvoicePageIndex * invoicesForMePerPage;
            var indexTo = indexFrom + invoicesForMePerPage;

            if (indexTo > filteredForMeInvoices.length) {
                indexTo = filteredForMeInvoices.length;
            }

            $('#invbmpaglabel').html('Showing ' + (indexFrom + 1) + ' to ' + (indexTo) + ' of ' + filteredForMeInvoices.length);


            invoices = filteredForMeInvoices;

            if (lastInvoiceToPayCount < invoices.length) {


                pagedForMeInvoices = filteredForMeInvoices.slice(indexFrom, indexTo);

                invoices = pagedForMeInvoices;

                cachedInvoices = [];

                lastInvoiceToPayCount = invoices.length;

                var s = '';
                $('#tblinvoicepay tbody').empty();
                for (var i = 0; i < invoices.length; i++) {

                    var invdate = new Date(invoices[i].InvoiceDate.match(/\d+/)[0] * 1).toLocaleString();

                    var invpaydate = '';
                    if (invoices[i].InvoicePaidDate) {
                        invpaydate = new Date(invoices[i].InvoicePaidDate.match(/\d+/)[0] * 1).toLocaleString();
                    }

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

                    var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";


                    if (FRIENDSLIST[invoices[i].InvoiceFrom].profileImage != '') {
                        imageSrcSmall = "https://ninkip2p.imgix.net/" + FRIENDSLIST[invoices[i].InvoiceFrom].profileImage + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
                    }

                    s += "<tr><td><label class=\"checkbox m-n i-checks\"><input type=\"checkbox\" name=\"post[]\"><i></i></label></td><td>" + invdate + "</td>";

                    s += "<td><span class=\"thumb-sm\"><img src=\"" + imageSrcSmall + "\" alt=\"\" class=\"img-circle\"></span><span class=\"m-s\"> ";

                    s += invoices[i].InvoiceFrom + "</span></td>";
                    s += "<td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td>" + invpaydate + "</td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoice" + i + "\">View</button></td></tr>";
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

            callback();

        });
    }



    var lastInvoiceToPayNetCount = 0;
    var uiInvoiceReturnToNetwork = false;
    function showInvoiceListNetwork() {

        var invoices = _.filter(cachedInvoices, function (inv) { return inv.InvoiceFrom == SELECTEDFRIEND; });


        if (invoices.length == 0) {
            $('#invfornet').empty();
            $('#invfornet').hide();
        }


        if (lastInvoiceToPayNetCount < invoices.length) {

            lastInvoiceToPayNetCount = invoices.length;

            var s = '';
            $('#invfornet').empty();

            for (var i = 0; i < invoices.length; i++) {

                var invdate = new Date(invoices[i].InvoiceDate.match(/\d+/)[0] * 1).toLocaleString();

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

                s += "<a id=\"viewinvoicenetfrom" + invoices[i].InvoiceFrom + invoices[i].InvoiceId + "\" class=\"media list-group-item\"><div class=\"pull-left\">" + invdate + "</div>" +
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
                        $('#network').hide();
                        $('#invoices').show();

                    });
                });
            }

            $('#invfornet').show();


        }

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

                var invdate = new Date(invoices[i].InvoiceDate.match(/\d+/)[0] * 1).toLocaleString();

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

                s += "<a id=\"viewinvoicenetby" + invoices[i].InvoiceFrom + invoices[i].InvoiceId + "\" class=\"media list-group-item\"><div class=\"pull-left\">" + invdate + "</div>" +
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
                        $('#network').hide();
                        $('#invoices').show();

                    });
                });
            }

            $('#invbynet').show();


        }

        // $('#pnlfriendinv').show();


    }

    var cachedInvoicesByUser = [];
    var lastInvoiceByUserCount = 0;
    function showInvoiceByUserList(callback) {
        //get back the list of invoices to pay


        Engine.getInvoiceByUserList(function (err, invoices) {

            for (var i = 0; i < invoices.length; i++) {
                var d1 = new Date(invoices[i].InvoiceDate);
                invoices[i].JsDate = d1;
            }

            invoices = _.sortBy(invoices, function (inv) { return -inv.JsDate; });

            filteredByMeInvoices = invoices;

            //perform all filters then set back to invoices

            if (currentByMeInvoiceFilter == "Pending") {

                filteredByMeInvoices = _.filter(invoices, function (inv) { return inv.InvoiceStatus == 0; });
            }

            if (currentByMeInvoiceFilter == "Paid") {

                filteredByMeInvoices = _.filter(invoices, function (inv) { return inv.InvoiceStatus == 1; });
            }

            if (currentByMeInvoiceFilter == "Rejected") {

                filteredByMeInvoices = _.filter(invoices, function (inv) { return inv.InvoiceStatus == 2; });
            }

            if (currentByMeInvoiceFilter == "Search") {
                var search = $('#txtSearchInvByMe').val();
                filteredByMeInvoices = _.filter(invoices, function (inv) { return inv.InvoiceFrom.search(search) > -1; });
            }

            var noofpages = Math.floor((filteredByMeInvoices.length / invoicesByMePerPage));

            var indexFrom = currentByMeInvoicePageIndex * invoicesByMePerPage;
            var indexTo = indexFrom + invoicesByMePerPage;

            if (indexTo > filteredByMeInvoices.length) {
                indexTo = filteredByMeInvoices.length;
            }

            $('#invbmpaglabel').html('Showing ' + (indexFrom + 1) + ' to ' + (indexTo) + ' of ' + filteredByMeInvoices.length);

            invoices = filteredByMeInvoices;


            if (lastInvoiceByUserCount < invoices.length) {


                pagedByMeInvoices = filteredByMeInvoices.slice(indexFrom, indexTo);

                invoices = pagedByMeInvoices;

                cachedInvoicesByUser = [];

                lastInvoiceByUserCount = invoices.length;

                var s = '';
                $('#tblinvoicebyme tbody').empty();
                for (var i = 0; i < invoices.length; i++) {


                    var invdate = new Date(invoices[i].InvoiceDate.match(/\d+/)[0] * 1).toLocaleString();
                    var invpaydate = '';
                    if (invoices[i].InvoicePaidDate) {
                        invpaydate = new Date(invoices[i].InvoicePaidDate.match(/\d+/)[0] * 1).toLocaleString();
                    }

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

                    s += "<tr><td><label class=\"checkbox m-n i-checks\"><input type=\"checkbox\" name=\"post[]\"><i></i></label></td><td>" + invdate + "</td><td><span class=\"thumb-sm\"><img src=\"images/avatar/64px/Avatar-" + pad(length) + ".png\" alt=\"\" class=\"img-circle\"></span><span class=\"m-s\"> " +
                                 invoices[i].InvoiceFrom + "</span></td><td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td><span class=\"paid\">" + invpaydate + "</span></td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoicebyuser" + i + "\">View</button></td></tr>";
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

                if (callback) {
                    callback(false, "ok");
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

                        var invpaydate = '';
                        if (cachedInvoicesByUser[index].InvoicePaidDate) {
                            invpaydate = new Date(cachedInvoicesByUser[index].InvoicePaidDate.match(/\d+/)[0] * 1).toLocaleString();
                        }


                        $(elem).html(invpaydate);
                    }

                });

            }

            if (callback) {
                callback(false, "ok");
            }

        });
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
            s += "<tr><td>" + json.invoicelines[i].description + "</td><td>" + json.invoicelines[i].quantity + "</td><td>" + convertFromSatoshis(json.invoicelines[i].amount, COINUNIT) + "</td><td>" + (convertFromSatoshis(json.invoicelines[i].amount, COINUNIT) * json.invoicelines[i].quantity) + "</td></tr>";
        }

        $('#tblinvdisplay tbody').append(s);

        if (invtype == 'forme') {
            $("#dinvusername").html('Invoice from ' + invoice.InvoiceFrom);
        } else {
            $("#dinvusername").html('Invoice to ' + invoice.InvoiceFrom);
        }

        $("#dinvdate").html(invdate);

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
        $("#invdisid").html(invoice.InvoiceFrom.toUpperCase() + invoice.InvoiceId);


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

        var pin = $('#sendinvpin').val();

        Engine.getDeviceKey(pin, function (err, ekey) {

            if (!err) {

                Engine.sendTransaction('invoice', friend, '', amount, ekey, function (err, transactionid) {

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
                            $('#textMessageSendInv').html('Transaction Failed: Waiting for funds to clear');
                        }

                    }

                });

            } else {

                $('#textMessageSendInv').addClass('alert alert-danger');
                $('#sendinvprogstatus').width('0%')
                $('#textMessageSendInv').html(ekey);

            }

        });

    }


    //INVOICE FUNCTIONS END------------------------------------------


    //OPEN/CREATE WALLET FUNCTIONS---------------------------------------------

    //event handlers



    //wrapper functions

    function openWallet(guid, password, twoFactorCode, callback) {

        setCookie('guid', guid);

        Engine.openWallet(guid, twoFactorCode, function (err, result) {

            if (err) {

                return callback(err, result);

            } else {

                if (result.Beta12fa) {


                    //if we are migrating a beta1 account that uses 2fa
                    //request the 2fa code

                    $("#si2fa").show();
                    return callback(err, result);

                } else {

                    if (result.TwoFactorOnLogin) {
                        return callback(err, result);
                    } else {
                        initialiseUI();
                    }
                }

            }
        });

    }

    function initialiseUI() {


        $("#dashprofile").show();
        $("#dashsend").hide();
        $("#dashreceive").hide();
        $("#dashcontact").hide();
        $('#invoices').hide();
        $('#network').hide();
        $('#networklist').hide();
        $('#settings').hide();

        var length = Engine.m_nickname.length;
        if (length > 20) {
            length = 20;
        }

        COINUNIT = Engine.m_settings.CoinUnit;

        $("#mynickname").html(Engine.m_nickname);
        $("#usernameProfile").html(Engine.m_nickname);
        $("#mystatus").html(Engine.m_statusText);


        var imageSrc = "images/avatar/128px/Avatar-" + pad(length) + ".png";
        var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";

        if (Engine.m_profileImage != '') {
            imageSrc = "https://ninkip2p.imgix.net/" + Engine.m_profileImage + "?crop=faces&fit=crop&h=128&w=128&mask=ellipse&border=1,d0d0d0";
            imageSrcSmall = "https://ninkip2p.imgix.net/" + Engine.m_profileImage + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
        }


        $("#imgProfile").attr("src", imageSrc);
        $("#imgtoprightprofile").attr("src", imageSrcSmall);

        //$("#codeForFriend").html(Engine.m_fingerprint);


        var data = Engine.m_fingerprint + ',' + Engine.m_nickname;
        var options = { text: data, width: 172, height: 172 };

        $('#fingerprintqr').html('');
        $('#fingerprintqr').qrcode(options);


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


                setInterval(function () {

                    updateUI();

                }, 10000);


                updateUI();


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

        $(".coinunit").html(COINUNIT);
        $("#stdsendcunit").html(COINUNIT);
        $("#amount").attr("placeholder", "Enter amount in units of " + COINUNIT);
        $("#friendAmount").attr("placeholder", "Enter amount in units of " + COINUNIT);
        $("#fndsendcunit").html(COINUNIT);

        updateBalance(function (err, res) {

            updateFriends(function (err, res) {

                showTransactionFeed(function (err, res) {

                    updateFriendRequests(function (err, res) {



                        updateTransactions(function (err, res) {

                            showInvoiceList(function (err, res) {

                                showInvoiceByUserList(function (err, res) {

                                    if (!norefresh) {
                                        refreshSelectedFriend(function (err, res) {

                                            console.log('completed refresh');

                                        });
                                    }
                                });

                            });

                        });
                    });
                });
            });
        });
    }

    function showCreateWalletStart() {
        $("#createWalletStart").hide();
        $("#openWalletStart").hide();
        $("#lostguid").hide();
        $("#reset2fa").hide();
        $("#validateemail").hide();
        $("#pairDevice").show();

    }

    function showOpenWalletStart() {
        $("#openWalletStart").hide();
        $("#createWalletStart").hide();
        $("#lostguid").hide();
        $("#reset2fa").hide();
        $("#validateemail").hide();
        $("#loginpin").show();

    }

    function showTwoFactorQr() {

        $("#twoFactorQr").show();
        $("#2factor1").show();

        Engine.getTwoFactorImg(function (err, twoFASecret) {

            var nickname = $("#createWalletStart input#nickname").val();
            var data = "otpauth://totp/Ninki:" + nickname + "?secret=" + twoFASecret + "&issuer=Ninki";
            var options = { text: data, width: 172, height: 172 };

            $('#twoFactorQrImg').html('');
            $('#twoFactorQrImg').qrcode(options);

            $("#twoFactorQrImg").attr("src", twoFactorQrImgUrl);
        });

    }

    function showSettingsTwoFactorQr() {

        $("#setup2faqr").show();
        $("#setting2fa").show();
        $("#settings2fa").show();
        $("#btnSetupTwoFactor").hide();



        Engine.getTwoFactorImg(function (err, twoFASecret) {

            var data = "otpauth://totp/Ninki:" + Engine.m_nickname + "?secret=" + twoFASecret + "&issuer=Ninki";
            var options = { text: data, width: 172, height: 172 };

            $('#imgsettings2fa').html('');
            $('#imgsettings2fa').qrcode(options);
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
                if (settingsObject['CoinUnit'] == 'Bits') {
                    $('#cuSelected').html('Bits');
                    $('#cuuBits').prop('checked', true);
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
        } else if ($('#cuSelected').html() == 'Bits') {
            jsonPacket['CoinUnit'] = 'Bits';
        } else {
            jsonPacket['CoinUnit'] = 'uBTC';
        }

        jsonPacket['Email'] = $('#Email').val();
        jsonPacket['EmailNotification'] = $('#EmailNotification')[0].checked;

        Engine.updateAccountSettings(jsonPacket, $("#txtTwoFactorCodeForSettings").val(), function (err, response) {
            if (err) {
                $("#savesettingserror").show();
                $("#savesettingssuccess").hide();
                $("#savesettingserrormessage").html(response);
            } else {


                if (jsonPacket['CoinUnit'] != COINUNIT) {
                    COINUNIT = jsonPacket['CoinUnit'];
                    lastNoOfTrans = -1;
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

    function updateBalance(callback) {

        Engine.getBalance(function (err, result) {

            //get in BTC units
            var balance = convertFromSatoshis(result.TotalBalance, COINUNIT);

            //            var xhr = new XMLHttpRequest();
            //            xhr.open('GET', "https://api.bitcoinaverage.com/ticker/global/USD/last", false);
            //            xhr.send();

            //            var xccy = xhr.responseText / 100000000;
            //            var xccy = (result.TotalBalance * xccy).toFixed(2);


            //$("#balance").html(balance);
            $("#balanceTop").html(balance + " " + COINUNIT);
            //$("#balanceTop").html(balance + " " + COINUNIT + " ($" + (xccy) + ")");
            //$("#dashcoinunit").html(COINUNIT);
            var template = '';
            if (result.UnconfirmedBalance > 0) {
                template += '<i class="fa fa-clock-o text-warning" style="font-size:1.5em"></i>';
            } else {
                template += '<i class="fa fa-check-square text-success" style="font-size:1.5em"></i>';
            }

            $("#balancetimer").html(template);

            if (callback) {
                callback();
            }



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
    function updateRequestsMadeByMe(callback) {


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

                //$("#nfriends").html(friends.length);

                if (friends.length > lastNoOfFriends) {

                    lastNoOfFriends = friends.length;

                    FRIENDSLIST = {};

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


                        for (var i = 0; i < friendsgroup[key].length; i++) {

                            var frnd = FRIENDSLIST[friends[i].userName];

                            var length = frnd.userName.length;
                            if (length > 20) {
                                length = 20;
                            }


                            var imageSrc = "images/avatar/64px/Avatar-" + pad(length) + ".png";

                            if (frnd.profileImage != '') {
                                imageSrc = "https://ninkip2p.imgix.net/" + frnd.profileImage + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
                                imageSrcSmall = "https://ninkip2p.imgix.net/" + frnd.profileImage + "?crop=faces&fit=crop&h=128&w=128&mask=ellipse&border=1,d0d0d0";
                            }


                            var template = '<a href="#" class="media list-group-item" id="friend' + k + '"><div class="media">' +
                                '<span class="pull-left thumb-sm"><img src="' + imageSrc + '" alt="" class="img-circle"></span><div id="seltarget' + friends[i].userName + '">';

                            if (frnd.validated) {
                                template += '<div class="pull-right text-success m-t-sm">' +
                                '<i class="fa fa-check-square" style="font-size:1.5em"></i>' +
                                '</div>';
                            }

                            template += '</div><div class="media-body">' +
                                '<div>' + friends[i].userName + '</div>' +
                                '<small class="text-muted">' + frnd.status + '</small>' +
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


                                networkpagestate = "friend";
                                friendpagestate = "send"

                                $('#myfriends').hide();
                                $("#networklist").hide();
                                $("#pnlfriendinv").hide();

                                window.scrollTo(0, 0);

                                //depreciate


                                updateSelectedFriend();
                            });

                            console.log("added click " + k + " for " + friends[i].userName);

                            k++;
                        }
                        g++;
                    }

                }

                return callback(false, "done");
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
                            $("#friendSelectedStatus").html(selectedFriend.status);
                        }

                        $("#imgSelectedFriend").attr("src", imageSrc);


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

            $("#nselnetcat").val(selectedFriend.category);

            $('#friendempty').hide();

            $('#textMessageSend').removeClass('alert alert-danger');



            $('#textMessageSend').hide();
            $('#sendfriendprog').hide();

            $("#networkvalidate").show();
            $("#friendSelectedName").html(selectedFriend.userName);
            $("#friendSelectedNameTo").html(selectedFriend.userName);
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

            var imageSrc = "images/avatar/256px/Avatar-" + pad(length) + ".png";

            if (selectedFriend.profileImage != '') {
                imageSrc = "https://ninkip2p.imgix.net/" + selectedFriend.profileImage + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
            }
            $("#friendSelectedStatus").html('');
            if (selectedFriend.status != '') {
                $("#friendSelectedStatus").html(selectedFriend.status);
            }

            $("#imgSelectedFriend").attr("src", imageSrc);


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



            $('#tblnetinvbyme tbody').empty();
            $('#tblnetinvforme tbody').empty();

            lastInvoiceToPayNetCount = 0;
            lastInvoiceByMeNetCount = 0;
            showInvoiceListNetwork();
            showInvoiceByMeListNetwork();

            $("#pnlfriend").show();

        }

        norefresh = false;




        if (callback) {
            callback(false, "ok");
        }

    }


    var lastNoOfFriendsReq = 0;

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
                    acceptAndValidateFriend(ofriends[i].userName);
                } else {
                    friends.push(ofriends[i]);
                }

            }


            if (friends.length > 0) {
                $("#dashrequests").show();

            } else {
                $("#dashrequests").hide();
            }

            $("#notifications").html(friends.length);
            $("#notificationsright").html(friends.length);
            //$("#nfriendreq").html(friends.length);




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

                    var template = '<li class="media list-group-item"><a href="#" class="thumb-sm pull-right m-t-xs avatar">' +
                                '<img src="images/avatar/64px/Avatar-' + pad(length) + '.png" alt="John said">' +
                                '</a>' +
                                '<div class="clear">' +
                                '<a href="#" class="text-info">' + friends[i].userName + '<i class="icon-twitter"></i></a>' +
                                '<div id="imgrequestwaiting"></div><a href="#" id=\"btnaccept' + i + '\" class="btn btn-xs btn-success m-t-xs">Accept</a> <a href="#" class="btn btn-xs btn-success m-t-xs" onclick=\"rejectFriend(\'' + friends[i].userName + '\')\">Reject</a>' +
                                '</div></li>';

                    $("#friendreq").append(template);
                    $("#btnaccept" + i).button();



                }

                for (var i = 0; i < friends.length; i++) {


                    $("#friendreq #btnaccept" + i).click({
                        userName: friends[i].userName
                    }, function (event) {
                        acceptAndValidateFriend(event.data.userName, function (err, result) {



                        });
                    });


                }



            }
            if (callback) {
                callback(false, "done");
            }
        });

    }

    function acceptAndValidateFriend(username, callback) {


        acceptFriend(username, function (err, res) {

            //handle here instead

            console.log('accept contact');

            console.log(contactPhraseCache[username]);
            console.log(err);

            if (!err) {


                lastNoOfFriendsReq = 0;
                updateFriendRequests();

                $("#imgrequestwaiting").hide();

                if (contactPhraseCache[username]) {

                    console.log('found phrase');
                    console.log(contactPhraseCache[username])

                    var code = contactPhraseCache[username];
                    var bip39 = new BIP39();
                    code = bip39.mnemonicToHex(code);

                    if (code.length == 40) {

                        Engine.verifyFriendData(username, code, function (err, result) {

                            if (result) {

                                console.log('verified');
                                console.log(result);

                                lastNoOfFriends = 0;
                                updateFriends();

                                //updateSelectedFriend();

                                //update list also

                                //find friend in list and update the validated icon
                                //$("#myfriends #seltarget" + selectedFriend.userName).html('<div class="pull-right text-success m-t-sm"><i class="fa fa-check-square" style="font-size:1.5em"></i></div>');

                            }

                        });

                    }

                    //get the hash to validate against
                    //this will confirm that my friend has the same keys
                    //i orginally packaged for him


                }

            }


        });
    }

    var prevtransfeed = -1;
    function showTransactionFeed(callback) {

        Engine.getTransactionRecords(function (err, transactions) {


            if (transactions.length != prevtransfeed) {


                prevtransfeed = transactions.length;

                var template = '';
                $('#transfeed').empty();

                for (var i = 0; i < transactions.length && i < 5; i++) {


                    var trdate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1).toLocaleString();

                    var dirTemplate = "";
                    if (transactions[i].TransType == 'S') {
                        dirTemplate = convertFromSatoshis(transactions[i].Amount, COINUNIT) + ' ' + COINUNIT + '<br />    Sent<br />';
                    }
                    if (transactions[i].TransType == 'R') {
                        dirTemplate = convertFromSatoshis(transactions[i].Amount, COINUNIT) + ' ' + COINUNIT + '<br />Received<br />';
                    }

                    if (transactions[i].Confirmations < 6) {
                        dirTemplate += '<i class="fa fa-clock-o text-warning" style="font-size:1.5em"></i>';
                    } else {
                        dirTemplate += '<i class="fa fa-check-square text-success" style="font-size:1.5em"></i>';
                    }
                    dirTemplate += "";

                    var length = transactions[i].UserName.length;
                    if (length > 20) {
                        length = 20;
                    }

                    var imageSrcSmall = "images/avatar/32px/Avatar-" + pad(length) + ".png";

                    if (transactions[i].UserName != 'External') {
                        if (FRIENDSLIST[transactions[i].UserName].profileImage != '') {
                            imageSrcSmall = "https://ninkip2p.imgix.net/" + FRIENDSLIST[transactions[i].UserName].profileImage + "?crop=faces&fit=crop&h=32&w=32&mask=ellipse&border=1,d0d0d0";
                        }
                    }

                    var tref = transactions[i].UserName;

                    if (transactions[i].UserName == 'External') {
                        tref = transactions[i].Address.substring(0, 7) + '...';
                    }

                    template += '<a href="#" class="media list-group-item"><div style="width:30%" class="pull-right">' +
                                dirTemplate + '</div><div>' + trdate + '</div><div><img src="' + imageSrcSmall + '" alt="John said" class="img-circle" />&nbsp;' +
                                 tref + '</div></a>';

                }

                $('#transfeed').html(template);

            } else {

                $('#transfeed .pull-right').each(function (index, elem) {

                    var tran = allTransactions[transactionIndex[transactions[index].TransactionId]];

                    var dirTemplate = "";
                    if (tran.TransType == 'S') {
                        dirTemplate = convertFromSatoshis(tran.Amount, COINUNIT) + ' ' + COINUNIT + '<br />    Sent<br />';
                    }
                    if (tran.TransType == 'R') {
                        dirTemplate = convertFromSatoshis(tran.Amount, COINUNIT) + ' ' + COINUNIT + '<br />Received<br />';
                    }

                    if (tran.Confirmations < 6) {
                        dirTemplate += '<i class="fa fa-clock-o text-warning" style="font-size:1.5em"> ' + tran.Confirmations + '</i>';
                    } else {
                        dirTemplate += '<i class="fa fa-check-square text-success" style="font-size:1.5em"></i>';
                    }

                    $(elem).html(dirTemplate);


                });
            }

            return callback(err, "ok");

        });

    }



    var lastNoOfTrans = 0;

    function updateTransactions(callback) {

        //if there are any new friends
        //fade in the button


        Engine.getTransactionRecords(function (err, transactions) {

            allTransactions = transactions;

            if (allTransactions.length != lastNoOfTrans) {

            } else {

                transactions = pagedTransactions;

                //we ony need to update the confirmations

                $('#tbltran tbody tr .bcconf').each(function (index, elem) {

                    var tran = allTransactions[transactionIndex[transactions[index].TransactionId]];

                    if (tran.Confirmations < 6) {
                        $(elem).html('<div class="btn btn-warning btn-icon btn-rounded"><i class="fa fa-clock-o">' + tran.Confirmations + '</i></div>');
                    } else {
                        $(elem).html('<div class="btn btn-success btn-icon btn-rounded"><i class="fa fa-check"></i></div>');
                    }

                });

                return callback(false, "ok");
            }


            for (var i = 0; i < allTransactions.length; i++) {
                var d1 = new Date(allTransactions[i].TransDateTime);
                allTransactions[i].JsDate = d1;
                transactionIndex[allTransactions[i].TransactionId] = i;
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

            if (allTransactions.length != lastNoOfTrans) {

                pagedTransactions = filteredTransactions.slice(indexFrom, indexTo);

                transactions = pagedTransactions;

                lastNoOfTrans = allTransactions.length;

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



                    var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";

                    if (transactions[i].UserName != 'External') {
                        if (FRIENDSLIST[transactions[i].UserName].profileImage != '') {
                            imageSrcSmall = "https://ninkip2p.imgix.net/" + FRIENDSLIST[transactions[i].UserName].profileImage + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
                        }
                    }

                    var tref = transactions[i].UserName;

                    if (transactions[i].UserName == 'External') {
                        tref = transactions[i].Address.substring(0, 7) + '...';
                    }


                    var trdate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1).toLocaleString();


                    template += '<tr>' +
                                '<td><label class="checkbox m-n i-checks"><input type="checkbox" name="post[]"><i></i></label></td>' +
                                '<td><span class="m-s">' + trdate + '</span></td>' +
                                '<td colspan="2">' +
                                '<span class="thumb-sm"><img src="' + imageSrcSmall + '" alt="John said" class="img-circle"></span><span class="m-s"> ' +
                                 tref + '</span></td>' +
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


                    var trdate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1).toLocaleString();

                    var popcontent = '';

                    popcontent += '<p><strong>Date:</strong> ';
                    popcontent += trdate;
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
                        placement: 'left', // top, bottom, left or right
                        title: 'Transaction Details<button type="button" class="close pull-right" data-dismiss="popover"><i class="i i-cross2"></i></button>',
                        html: 'true',
                        content: '<div>' + popcontent + '</div>'
                    });
                }

            }

            callback();

        });

    }




    function generateAddressClient() {

        $("#newaddrspinner").show();
        var target = document.getElementById('newaddrspinner');
        var spinner = new Spinner(spinneropts).spin(target);

        Engine.createAddress('m/0/0', 1, function (err, newAddress, path) {

            var options = { text: newAddress, width: 172, height: 172 };

            $('#requestaddressqr').html('');
            $('#requestaddressqr').qrcode(options);

            $('#requestaddresstxt').html(newAddress);

            //$('#requestaddress').html(tempate);
            $("#newaddrspinner").hide();
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


        var pin = $('#sendfriendpin').val();

        if (amount > 0) {

            $('input#friendAmount').css("border-color", "#ccc");
            $('#textMessageSend').html('Creating transaction...');
            $('#textMessageSend').show();
            $('#sendfriendprogstatus').width('3%')
            $('#sendfriendprog').show();
            $('#sendfriendprogstatus').width('10%');



            Engine.getDeviceKey(pin, function (err, ekey) {

                if (!err) {

                    Engine.sendTransaction('friend', friend, "", amount, ekey, function (err, transactionid) {

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
                                $('#textMessageSend').html('Transaction Failed: Waiting for funds to clear');
                            }

                        }
                        // alert(transactionid);
                    });

                } else {

                    $('#textMessageSend').addClass('alert alert-danger');
                    $('#sendfriendprogstatus').width('0%')
                    $('#textMessageSend').html(ekey);

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

        var pin = $('#sendstdpin').val();

        if (allok) {

            Engine.getDeviceKey(pin, function (err, ekey) {

                if (!err) {

                    $('#textMessageSendStd').html('Creating transaction...');
                    $('#textMessageSendStd').show();
                    $('#sendstdprogstatus').width('3%')
                    $('#sendstdprog').show();
                    $('#sendstdprogstatus').width('10%');


                    Engine.sendTransaction('standard', '', address, amount, ekey, function (err, transactionid) {

                        if (!err) {

                            $('#textMessageSendStd').html('You sent ' + convertFromSatoshis(amount, COINUNIT) + ' ' + COINUNIT + ' to <span style="word-wrap:break-word;">' + address + '</span>');
                            $('input#amount').val('');
                            $('#textMessageSendStd').fadeOut(5000);
                            $('#sendstdprog').fadeOut(5000);

                        } else {

                            if (transactionid == "ErrInsufficientFunds") {
                                $('#textMessageSendStd').html('Transaction Failed: Waiting for funds to clear');
                            }

                            $('#sendstdprogstatus').width('0%')
                            $('#textMessageSendStd').addClass('alert alert-danger');
                        }
                    });



                } else {

                    $('#sendstdprogstatus').width('0%')
                    $('#textMessageSendStd').addClass('alert alert-danger');
                    $('#textMessageSendStd').html(ekey);
                }



            });
        }

    }

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

        $("#imgaddcontactwaiting").show();
        var target = document.getElementById('imgaddcontactwaiting');
        var spinner = new Spinner(spinneropts).spin(target);



        $("#qrcontactupd").show();
        $("#qrcontactmess").html('Verifying user...');


        Engine.doesUsernameExist(username, function (err, usernameExistsOnServer) {

            //also check if friend already

            if (usernameExistsOnServer) {

                $("#qrcontactmess").html('Verifying network...');

                Engine.isNetworkExist(username, function (err, result) {

                    if (!result) {

                        $("#qrcontactmess").html('Deriving addresses...');

                        Engine.createFriend(username, "#qrcontactmess", function (err, result) {
                            if (err) {

                                $("#addcontactmodal").hide();
                                $("#imgaddcontactwaiting").hide();
                                $("#qrcontactalert").show();
                                $("#qrcontactalertmessage").html("Error adding contact");


                            } else {
                                $("#imgaddcontactwaiting").hide();
                                $("#addcontactmodal").hide();
                                $("#qrcontactsuccess").show();
                                $("#qrcontactsuccessmessage").html("Successfully added " + username + " as a contact");
                                $("#qrcontactsuccess").fadeOut(5000);

                            }
                        });

                    } else {


                        //validate using the fingerprint

                        if (contactPhraseCache[username]) {

                            console.log('found phrase');
                            console.log(contactPhraseCache[username])

                            var code = contactPhraseCache[username];
                            var bip39 = new BIP39();
                            code = bip39.mnemonicToHex(code);

                            if (code.length == 40) {
                                $("#qrcontactmess").html('Verifying user...');
                                Engine.verifyFriendData(username, code, function (err, result) {

                                    if (result) {
                                        $("#qrcontactmess").html('Verfied...');
                                        console.log('verified');
                                        console.log(result);
                                        $("#imgaddcontactwaiting").hide();
                                        $("#addcontactmodal").hide();
                                        $("#qrcontactsuccess").show();
                                        $("#qrcontactsuccessmessage").html("You verfied " + username + " as a contact");
                                        $("#qrcontactsuccess").fadeOut(5000);

                                        lastNoOfFriends = 0;
                                        updateFriends();

                                    }

                                });

                            }

                            //get the hash to validate against
                            //this will confirm that my friend has the same keys
                            //i orginally packaged for him


                        }


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

        $("#addcontactmodal").show();

        $("#imgaddcontactwaiting").show();
        var target = document.getElementById('imgaddcontactwaiting');
        var spinner = new Spinner(spinneropts).spin(target);


        //verify input and if username exists
        $("#addcontactalert").hide();


        $("#qrcontactupd").show();
        $("#qrcontactmess").html('Verifying user...');

        //merge these functions

        Engine.doesUsernameExist(username, function (err, usernameExistsOnServer) {

            //also check if friend already

            if (usernameExistsOnServer) {

                $("#qrcontactmess").html('Verifying network...');

                Engine.isNetworkExist(username, function (err, result) {

                    if (!result) {

                        $("#friend").css("border-color", "#ccc");

                        $("#qrcontactmess").html('Deriving addresses...');

                        Engine.createFriend(username, "#qrcontactmess", function (err, result) {
                            if (err) {

                                $("#friend").css("border-color", "#ffaaaa");
                                $("#addcontactalert").show();
                                $("#addcontactalertmessage").html("Error adding contact");
                                $("#imgaddcontactwaiting").hide();

                            } else {

                                $("#addcontactmodal").hide();
                                $("#friend").val('');
                                $("#imgaddcontactwaiting").hide();
                                $("#addcontactsuccess").show();
                                $("#addcontactsuccessmessage").html("You requested " + username + " as a contact");
                                $("#addcontactsuccess").fadeOut(5000);

                                //updateRequestsMadeByMe();
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

    function acceptFriend(username, callback) {


        console.log('calling accept acceptFriend');

        $("#imgrequestwaiting").show();
        var target = document.getElementById('imgrequestwaiting');
        var spinner = new Spinner(spinneropts).spin(target);

        //$('#friendreq').fadeOut(1000);
        Engine.acceptFriendRequest(username, function (err, secret) {
            if (err) {
                //alert("Wallet could not be opened.\n\n" + err);
            } else {
                console.log('accepted');
                Engine.isNetworkExist(username, function (err, result) {

                    if (!result) {

                        Engine.createFriend(username, "", function (err, result) {

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
