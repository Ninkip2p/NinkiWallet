var Bitcoin = require('bitcoinjs-lib');
var BIP39 = require('./bip39');



function UI() {


    var Engine = new Ninki.Engine();


    var FRIENDSLIST = {};
    var COINUNIT = 'BTC';
    var SELECTEDFRIEND = '';
    var noAlert = false;
    var norefresh = false;

    var price = 0;

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


    function backupHotKey(errtarget) {

        Engine.getEncHotHash(function (err, data) {

            if (!err) {

                var d = new Date();
                var fdate = "" + (d.getDate()) + (d.getMonth() + 1) + (d.getFullYear());
                var sugName = "ninki_backup_" + _.escape(Engine.m_nickname) + "_" + fdate + ".json";

                chrome.fileSystem.chooseEntry({ type: 'saveFile', suggestedName: sugName }, function (writableFileEntry) {
                    writableFileEntry.createWriter(function (writer) {
                        writer.onerror = function (e) {
                            //console.log('write complete');
                            $(errtarget).text('Error');
                        };
                        writer.onwriteend = function (e) {
                            //console.log('write complete');
                            //$(errtarget).text('Success');
                        };
                        writer.write(new Blob([data], { type: 'text/plain' }));
                    });
                });

            }

        });

    }



    jQuery(document).ready(function () {




        $("#btnBackupCodes").click(function () {

            $("#txt2faForBackupError").hide();

            var twoFactorCode = $("#txt2faForBackup").val();

            var codes = Engine.createBackupCodes(twoFactorCode, function (err, codes) {

                if (!err) {

                    for (var i = 0; i < codes.length; i++) {

                        $("#bc" + (i + 1)).text(codes[i].Code.substring(0, 5) + ' ' + codes[i].Code.substring(5, 8));
                    }

                    Engine.m_settings.BackupIndex = 1;

                    $("#pnlBackupCodes").show();
                    $("#btnPrintCodes").show();
                    $("#btnBackupCodes").addClass('disabled');

                } else {

                    $("#txt2faForBackupError").show();

                }
            });

        });

        $("#btnPairUseBackups").click(function () {

            $("#pairerror").hide();
            $("#pairqr2fa").hide();
            $("#pairusebackup").show();

        });



        $("#btnBackupBeta").click(function () {

            backupHotKey('#errbackupbeta');

        });


        $('#openWalletStart input#password').focus();

        var fatokk = Engine.Device.getStorageItem("ninki_rem", function (res) {

            if (res.length > 0) {
                $('#twofacenable').show();
            }

        });

        var tmpContent = {};
        $("#btnBrowseRestore").click(function () {
            //, accepts: [{ extensions: ['json']}]
            chrome.fileSystem.chooseEntry({ type: 'openFile' }, function (readOnlyEntry) {

                readOnlyEntry.file(function (file) {
                    var reader = new FileReader();

                    //reader.onerror = errorHandler;
                    reader.onloadend = function (e) {

                        try {

                            if (e.target.result) {
                                var json = JSON.parse(e.target.result);
                                tmpContent = json;
                                restoreFromFile(Engine.m_password, json);
                            } else {
                                $("#restoreerror").text('The file was empty');
                            }

                        } catch (error) {
                            $("#restoreerror").text('Invalid file');
                        }

                    };

                    reader.readAsText(file);
                });
            });

        });


        $("#btnRestore").click(function () {

            $("#restorepwd").hide();

            var respwd = $("#restorePassword").val();
            respwd = Engine.pbkdf2(respwd, Engine.m_oguid);

            restoreFromFile(respwd, tmpContent);

        });


        function restoreFromFile(pwd, data) {

            var json = data;

            var hothash = '';
            var iserror = false;
            try {
                hothash = Engine.decryptNp(json.enc, pwd, json.iv);
            } catch (error) {
                iserror = true;
            }

            if (!iserror) {

                Engine.restoreHotHash(hothash, function (err, result) {

                    //login
                    if (!err) {

                        tmpContent = {};
                        $("#hotkeymodal").modal('hide');
                        $("#hotkeyenter").hide();

                    } else {

                        if (result == "ErrSeedInvalid") {
                            $('#restorepwd').show();
                        } else {

                            $('#hotkeyentererror').show();
                            $('#hotkeyentererrormessage').text(result);
                        }

                    }

                });

            } else {

                $('#hotkeyentererror').show();
                $('#hotkeyentererrormessage').text("Invalid file");

            }

        }



        $("#btnSaveHotKey").click(function () {

            $('#hotkeyentererror').hide();

            var hotkey = $('#txtHot').val();
            var hotkeydecode = Engine.decodeKey(hotkey);
            if (hotkeydecode) {
                Engine.saveHotHash(hotkeydecode, function (err, result) {

                    //show modal enter phrase
                    if (!err) {
                        $("#hotkeymodal").modal('hide');
                        $("#hotkeyenter").hide();
                    } else {
                        $('#hotkeyentererror').show();
                        $('#hotkeyentererrormessage').text(result);
                    }

                });
            } else {
                $('#hotkeyentererror').show();
                $('#hotkeyentererrormessage').text("The phrase was invalid, please double check the phrase and try again");
            }

        });

        $("#btnWatchOnly").click(function () {

            Engine.m_watchOnly = true;
            $("#hotkeymodal").modal('hide');
            $("#hotkeyenter").hide();
            $("#btnSaveBackup").prop('disabled', true);
            $("#btnSaveBackupP").prop('disabled', true);

        });


        $("#hunlock").click(function () {


            if (Engine.Device.isChromeApp()) {
                chrome.app.window.create('recover_v1.html', {
                    'state': 'maximized'
                });
            } else {
                location.href = "recover_v1.html";
            }


        });


        $("#logout").click(function () {

            logout();

        });



        $("#twofacenable").click(function () {

            Engine.Device.deleteStorageItem("ninki_rem");
            $('#twofacenable').hide();
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

            if (Engine.Device.isChromeApp()) {
                var xhrsm = new XMLHttpRequest();
                xhrsm.open('GET', imageSrc, true);
                xhrsm.responseType = 'blob';
                xhrsm.onload = function (e) {
                    $("#imgProfile").attr("src", window.URL.createObjectURL(this.response));
                };
                xhrsm.send();
            } else {
                $("#imgProfile").attr("src", imageSrc);
            }


            $('#imgProfileContainer').show();
            $('#dropzone').hide();
            $('progressNumber').text('');
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
                        imageSrc = "https://ninkip2p.imgix.net/" + _.escape(key) + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
                        imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(key) + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
                    }


                    if (Engine.Device.isChromeApp()) {
                        var xhrsm = new XMLHttpRequest();
                        xhrsm.open('GET', imageSrc, true);
                        xhrsm.responseType = 'blob';
                        xhrsm.onload = function (e) {
                            $("#imgProfile").attr("src", window.URL.createObjectURL(this.response));
                        };
                        xhrsm.send();

                        var xhrsm2 = new XMLHttpRequest();
                        xhrsm2.open('GET', imageSrcSmall, true);
                        xhrsm2.responseType = 'blob';
                        xhrsm2.onload = function (e) {
                            $("#imgtoprightprofile").attr("src", window.URL.createObjectURL(this.response));
                        };
                        xhrsm2.send();

                    } else {
                        $("#imgProfile").attr("src", imageSrc);
                        $("#imgtoprightprofile").attr("src", imageSrcSmall);
                    }

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

        $("#btnCancelProfile").click(function () {

            $('#imgProfileContainer').show();
            $("#dropzone").hide();
            $("#btnSaveProfile").hide();
            $("#btnCancelProfile").hide();
            $("#btnEditProfile").show();

            //reset profile image

            var imageSrc = "images/avatar/256px/Avatar-" + pad(Engine.m_nickname.length) + ".png";

            if (Engine.m_profileImage != '') {
                imageSrc = "https://ninkip2p.imgix.net/" + _.escape(Engine.m_profileImage) + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
            }

            if (Engine.Device.isChromeApp()) {
                var xhrsm = new XMLHttpRequest();
                xhrsm.open('GET', imageSrc, true);
                xhrsm.responseType = 'blob';
                xhrsm.onload = function (e) {
                    $("#imgProfile").attr("src", window.URL.createObjectURL(this.response));
                };
                xhrsm.send();
            } else {
                $("#imgProfile").attr("src", imageSrc);
            }

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

                key = "images\/" + Engine.m_nickname + '_' + (new Date).getTime();

                Engine.createS3Policy(function (err, result) {


                    if (!err) {

                        var policy = JSON.parse(result);

                        fd.append('key', key);
                        fd.append('acl', 'public-read');
                        fd.append('Content-Type', file.type);
                        fd.append('bucket', 'ninkip2pimgstore');
                        fd.append('AWSAccessKeyId', 'AKIAINOU56ATQFS3CLFQ');
                        fd.append('policy', policy.s3Policy);
                        fd.append('signature', policy.s3Signature);
                        fd.append("file", file);

                        var xhr = new XMLHttpRequest();

                        xhr.upload.addEventListener("progress", uploadProgress, false);
                        xhr.addEventListener("load", uploadComplete, false);
                        xhr.addEventListener("error", uploadFailed, false);
                        xhr.addEventListener("abort", uploadCanceled, false);

                        xhr.open('POST', 'https://ninkip2pimgstore.s3-us-west-1.amazonaws.com/', true); //MUST BE LAST LINE BEFORE YOU SEND 

                        xhr.send(fd);
                    }

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

            var imageSrc = 'https://ninkip2p.imgix.net/' + _.escape(key) + "?fit=crop&crop=faces&h=128&w=128&mask=ellipse&border=1,d0d0d0";

            if (Engine.Device.isChromeApp()) {
                var xhrsm = new XMLHttpRequest();
                xhrsm.open('GET', imageSrc, true);
                xhrsm.responseType = 'blob';
                xhrsm.onload = function (e) {
                    $("#imgProfile").attr("src", window.URL.createObjectURL(this.response));
                    $('#imgProfileContainer').show();
                    $('#dropzone').hide();
                    $('progressNumber').text('');
                    $("#imgreset").hide();
                };
                xhrsm.send();
            } else {
                $("#imgProfile").attr("src", imageSrc);
                $('#imgProfileContainer').show();
                $('#dropzone').hide();
                $('progressNumber').text('');
                $("#imgreset").hide();
            }



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

        if (stdAmountConvCoin) {
            $('#ccystdamt').text(convertToLocalCurrency($('#amount').val()));
            $('#hdamount').val($('#amount').val());
        }
        else {
            var amt = convertFromLocalCurrency($('#amount').val());
            $('#hdamount').val(amt);
            $('#ccystdamt').text(amt + ' ' + COINUNIT);
        }

    }

    function updateNetAmount() {

        if (netAmountConvCoin) {
            $('#ccynetamt').text(convertToLocalCurrency($('#friendAmount').val()));
            $('#hdfriendAmount').val($('#friendAmount').val());
        }
        else {
            var amt = convertFromLocalCurrency($('#friendAmount').val());
            $('#hdfriendAmount').val(amt);
            $('#ccynetamt').text(amt + ' ' + COINUNIT);
        }

    }


    $('#stdselcu').click(function () {

        $('#stdselunit').text(COINUNIT);
        stdAmountConvCoin = true;
        $('#amount').val('');
        updateStdAmount();

    });

    $('#stdsellc').click(function () {

        $('#stdselunit').text(Engine.m_settings.LocalCurrency);
        stdAmountConvCoin = false;
        $('#amount').val('');
        updateStdAmount();

    });

    $('#netselcu').click(function () {

        $('#netselunit').text(COINUNIT);
        netAmountConvCoin = true;
        $('#friendAmount').val('');
        updateNetAmount();

    });

    $('#netsellc').click(function () {

        $('#netselunit').text(Engine.m_settings.LocalCurrency);
        netAmountConvCoin = false;
        $('#friendAmount').val('');
        updateNetAmount();

    });


    $('#amount').keyup(function () {

        updateStdAmount();

    });

    $('#friendAmount').keyup(function () {

        updateNetAmount();

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


    $('.nopost').keydown(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
    });

    $(document).on("keydown", function (e) {
        if ((e.which === 8) && !$(e.target).is("input, textarea")) {
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

        $("#btnAddDevice").click(function () {



            //add the device name
            //a two factor bypass token will be generated plus temporary encryption key
            //for loggin on

            //generate a qr code containing encrypted
            //2fa token
            //password
            //hotkey

            var deviceName = $("#txtAddDevice").val();

            Engine.createDevice(deviceName, function (err, result) {


                updateDeviceList();

            });


        });


        $("#btnPairDone").click(function () {

            lastNoOfDevices = 0;
            updateDeviceList();

            $('#qrdevice').text('');

            $('#pairqr2fa').show();
            $('#pairqrscan').hide();

            $("#pairdevicemodal").modal('hide');
            $("#pairdeviceqr").hide();

        });



        $("#btnCancelPairQr").click(function () {

            $('#qrdevice').text('');

            $('#pairqr2fa').show();
            $('#pairqrscan').hide();

            $("#pairdevicemodal").modal('hide');
            $("#pairdeviceqr").hide();

        });


        $("#btnShowPairQr").click(function () {


            var twoFactorCode = $("#pairTwoFactorCode").val();

            $('#pairerror').hide();
            $('#pairerrormess').text('');


            if (twoFactorCode.length == 6) {

                if (!currentDevice.IsPaired) {

                    Engine.getDeviceToken(currentDevice.DeviceName, twoFactorCode, function (err, result) {

                        if (!err) {

                            var jresult = JSON.parse(result);
                            //get temporary encryption key
                            //enc password and iv
                            //hot key and iv
                            //2fatoken and iv
                            //guid
                            $("#pairTwoFactorCode").val('');

                            Engine.getHotHash("", function (err, hothash) {

                                if (!err) {

                                    var data = hothash + jresult.DeviceToken;

                                    var encdata = Engine.encryptNp(data, jresult.DeviceKey);

                                    var data = encdata.toString() + '|' + encdata.iv.toString() + '|' + Engine.m_oguid + '|' + currentDevice.DeviceName + '|' + jresult.RegToken;

                                    var options = { text: data, width: 256, height: 256, ecLevel: 'H' };

                                    $('#qrdevice').text(data);
                                    $('#qrdevice').qrcode(options);

                                    $('#pairqr2fa').hide();
                                    $('#pairqrscan').show();



                                }

                            });

                        } else {
                            $('#pairerror').show();
                            $('#pairerrormess').text(result);

                        }


                    });

                } else {

                    //destroy the device


                    Engine.destroyDevice2fa(currentDevice.DeviceName, twoFactorCode, function (err, result) {

                        if (!err) {

                            lastNoOfDevices = 0;
                            updateDeviceList();

                            $("#pairdevicemodal").modal('hide');
                            $("#pairdeviceqr").hide();


                        } else {
                            $('#pairerror').show();
                            $('#pairerrormess').text(result);

                        }

                    });


                }

            } else {

                $('#pairerror').show();
                $('#pairerrormess').text("Invalid two factor code");

            }


        });





        $("#btnPairCancel").click(function () {

            $("#pairdevicemodal").modal('hide');
            $("#pairdeviceqr").hide();


        });

        $("#btnUnpairBackupCancel").click(function () {
            $("#pairdevicemodal").modal('hide');
            $("#pairdeviceqr").hide();
            $("#unpairbackupcode").val();
            $("#pairerror").hide();
            $("#pairqr2fa").show();
            $("#pairusebackup").hide();
        });


        $("#btnUnpairBackupDone").click(function () {


            $("#pairerror").hide();

            var backupCode = $("#unpairbackupcode").val();


            if (backupCode.length == 8) {

                Engine.destroyDevice2fa(currentDevice.DeviceName, backupCode, function (err, result) {

                    if (!err) {

                        $('#upb' + Engine.m_settings.BackupIndex).removeAttr("style");

                        Engine.m_settings.BackupIndex = Engine.m_settings.BackupIndex + 1;

                        lastNoOfDevices = 0;
                        updateDeviceList();

                        $("#pairdevicemodal").modal('hide');
                        $("#pairdeviceqr").hide();

                        $("#pairerror").hide();
                        $("#pairqr2fa").show();
                        $("#pairusebackup").hide();


                    } else {

                        $('#pairerror').show();
                        $('#pairerrormess').text(result);

                        $('#upb' + Engine.m_settings.BackupIndex).removeAttr("style");

                        Engine.m_settings.BackupIndex = Engine.m_settings.BackupIndex + 1;

                        $('#upb' + Engine.m_settings.BackupIndex).attr("style", "border-color:red");

                    }

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

                Engine.setPass(password, guid);

                Engine.Device.getStorageItem("ninki_rem", function (res) {

                    if (res.length > 0) {
                        var enc = JSON.parse(res);
                        twoFactorCode = Engine.decryptNp(enc.ct, Engine.m_password, enc.iv);
                    }

                    Engine.Device.setStorageItem('guid', guid);



                    Engine.openWallet(guid, twoFactorCode, function (err, result) {

                        //$("#imgopenwaiting").hide();


                        if (!err) {

                            //$("#imgopenwaiting").hide();

                            $("#openwalletalert").hide();


                            if (!Engine.m_settings.HasBackupCodes) {
                                $("#btnPairUseBackups").hide();
                                $("#btnBackupCode2fa").hide();
                                $("#lost2fa").hide();
                            } else {
                                $("#lost2fa").show();
                                $("#btnPairUseBackups").show();
                                $("#btnBackupCode2fa").show();
                            }


                            if (result.TwoFactorOnLogin) {

                                //delete any old 2 factor tokens

                                Engine.Device.deleteStorageItem("ninki_rem");

                                if (!result.Beta12fa) {

                                    $('#openWalletStart input#password').val('');

                                    $("#siguid").hide();
                                    $("#silguid").hide();
                                    $("#sipwd").hide();
                                    $("#si2fa").show();
                                    $("#sib1").hide();
                                    $("#sib2").show();
                                    $("#signdiff").hide();
                                    $("#crwallet").hide();

                                    $('#openWalletStart input#twoFactorCode').focus();

                                    $("#btnLogin").prop('disabled', false);
                                    $("#btnLogin").removeClass('disabled');
                                    $("#imgopenwaiting").hide();


                                } else {

                                    //for beta1 migrations
                                    $("#siguid").hide();
                                    $("#silguid").hide();
                                    $("#sipwd").hide();
                                    $("#si2fa").show();
                                    $("#sib1").hide();
                                    $("#sib2").show();
                                    $('#openWalletStart input#twoFactorCode').focus();
                                    $("#btnLogin").prop('disabled', false);
                                    $("#btnLogin").removeClass('disabled');
                                    $("#imgopenwaiting").hide();
                                }

                            } else {



                                //initiate 2fa setup modal
                                if (!Engine.m_twoFactorOnLogin) {

                                    $("#twofactorsettings").show();
                                    $("#2famodal").modal('show');

                                    $("#twofactorsettings").show();
                                    //$("#btnSetupTwoFactor").hide();
                                    $("#savetwofactorerror").hide();
                                    $("#setup2faemail").hide();
                                    $("#setup2faqr").show();
                                    $("#btnLogin").prop('disabled', false);
                                    $("#btnLogin").removeClass('disabled');
                                    $("#imgopenwaiting").hide();



                                    showMissingTwoFactorQr();

                                } else {


                                    if (Engine.m_walletinfo.hotHash == '') {

                                        initialiseUI(function (err, result) {

                                            Engine.Device.setStorageItem("user", Engine.m_nickname);
                                            Engine.Device.setStorageItem("userimg", Engine.m_profileImage);

                                            $("#btnLogin").prop('disabled', false);
                                            $("#btnLogin").removeClass('disabled');
                                            $("#imgopenwaiting").hide();


                                        });


                                    } else {

                                        //display a screen advising the user to write down their hot key
                                        //checkbox->ok
                                        //then migrate the packet
                                        //initialise ui

                                        $("#btnLogin").prop('disabled', false);
                                        $("#btnLogin").removeClass('disabled');
                                        $("#imgopenwaiting").hide();



                                        if (Engine.m_walletinfo.hotHash != '') {
                                            Engine.saveHotHash(Engine.m_walletinfo.hotHash, function (err, result) {

                                                $("#mighotdisp").text(Engine.encodeKey(Engine.m_walletinfo.hotHash));

                                                $("#openWalletStart").hide();
                                                $("#hotmigmodal").modal('show');
                                                $("#hotmigenter").show();

                                            });
                                        }


                                    }

                                }

                            }

                            $("#unlockaccount").hide();

                        } else {

                            $("#btnLogin").prop('disabled', false);
                            $("#btnLogin").removeClass('disabled');
                            $("#imgopenwaiting").hide();

                            $("#openwalletalert").show();

                            if (result == "ErrAccount") {
                                $("#openwalletalertmessage").text("Incorrect password");
                            }

                            if (result == "ErrLocked") {
                                $("#openwalletalertmessage").text("Your account has been locked.");
                                $("#unlockaccount").show();
                            } else {
                                $("#unlockaccount").hide();
                            }
                        }

                    });

                });
            }, 100);
        });




        $("#btnMigHotKey").click(function () {

            $("#mighoterr").hide();

            var twoFactorCode = $('#hotmig2fa').val();

            if (twoFactorCode.length == 6) {

                Engine.migrateHotKeyFromPacket(twoFactorCode, function (err, result) {

                    if (err) {

                        $("#mighoterrmess").text(result);
                        $("#mighoterr").show();

                    } else {

                        $("#hotmigmodal").modal('hide');
                        $("#hotmigenter").hide();
                        initialiseUI();

                    }

                });

            } else {

                $("#mighoterrmess").text("Invalid two factor code");
                $("#mighoterr").show();

            }

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


                if (twoFactorCode.length == 6) {

                    Engine.openWallet2fa(twoFactorCode, rememberTwoFactor, function (err, result) {

                        if (err) {

                            $("#img2faopenwaiting").hide();
                            $("#openwalletalert").show();
                            $("#openwalletalertmessage").text(result);
                            $("#btn2faLogin").prop('disabled', false);
                            $("#btn2faLogin").removeClass('disabled');

                        } else {

                            if (result.CookieToken) {

                                Engine.Device.setStorageItem("ninki_rem", result.CookieToken);
                            }

                            if (Engine.m_walletinfo.hotHash == '') {

                                initialiseUI(function (err, result) {

                                    Engine.Device.setStorageItem("user", Engine.m_nickname);
                                    Engine.Device.setStorageItem("userimg", Engine.m_profileImage);

                                });


                            } else {

                                //display a screen advising the user to write down their hot key
                                //checkbox->ok
                                //then migrate the packet
                                //initialise ui
                                $("#mighotdisp").text(Engine.encodeKey(Engine.m_walletinfo.hotHash));

                                $("#openWalletStart").hide();
                                $("#hotmigmodal").modal('show');
                                $("#hotmigenter").show();


                            }
                        }
                    });
                } else {

                    $("#img2faopenwaiting").hide();
                    $("#openwalletalert").show();
                    $("#openwalletalertmessage").text("Invalid two factor code");
                    $("#btn2faLogin").prop('disabled', false);
                    $("#btn2faLogin").removeClass('disabled');
                }

            }, 100);

        });


        $("#btnLoginBackupDone").click(function () {



            var twoFactorCode = $('#txtLoginBackupCode').val();

            if (twoFactorCode.length == 8) {

                Engine.openWallet2fa(twoFactorCode, false, function (err, result) {

                    if (err) {

                        $('#log' + Engine.m_settings.BackupIndex).removeAttr("style");

                        Engine.m_settings.BackupIndex = Engine.m_settings.BackupIndex + 1;

                        $('#log' + Engine.m_settings.BackupIndex).attr("style", "border-color:red");

                    } else {

                        initialiseUI(function (err, result) {

                            $("#loginbackup").hide();

                            Engine.Device.setStorageItem("user", Engine.m_nickname);
                            Engine.Device.setStorageItem("userimg", Engine.m_profileImage);

                            $('#log' + Engine.m_settings.BackupIndex).removeAttr("style");

                            //increment not required as login will update settings

                        });

                    }

                });

            } else {

            }



        });



        $("#btnEmailGuid").click(function () {

            var userName = $("#txtlostguidusername").val();

            Engine.emailGUID(userName, function (err, response) {

                showOpenWalletStart();
            });

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





        $("#btncancelmoneystd").click(function () {

            $("#sendstdmodal").modal('hide');
            $("#sendstds2").hide();
            $("#txtSendTwoFactor").val('');
            $("#sendstdprog").hide();
            $("#textMessageSendStd").hide();

        });

        $('#btnsendstddone').click(function () {

            $("#sendstds3").hide();
            $("#sendstdmodal").modal('hide');
            $("#txtSendTwoFactor").val('');
            $("#sendstdprog").hide();
            $("#textMessageSendStd").hide();

            $('input#amount').keyup();

        });


        $("#btnconfmoneystd").click(function () {

            var amount = $('#hdamount').val();
            amount = convertToSatoshis(amount, COINUNIT);

            var address = $('input#toAddress').val();

            $("#txtSendTwoFactor").val('');
            $("#txtSendTwoFactor").css("border-color", "#ccc");

            $('#textMessageSendStd').removeClass('alert alert-danger');

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


                Engine.Device.getStorageItem("tfso" + Engine.m_guid, function (res) {

                    if (res == "") {
                        //get the current limit status from the server
                        //and determine if we need 2fa or not

                        $('#sendstds2amt').text($('#hdamount').val() + ' ' + COINUNIT);
                        $('#sendstds2add').text($('#toAddress').val());

                        //$("#sendstds1").hide();
                        $("#sendstds3").hide();
                        $("#sendstds2").show();
                        $("#sendstdmodal").modal('show');

                    } else {

                        Engine.getLimitStatus(function (err, limits) {

                            var twofareq = false;
                            if ((limits.No24hr + 1) > limits.NoOfTransactionsPerDay) {
                                twofareq = true;
                            }
                            if ((limits.No1hr + 1) > limits.NoOfTransactionsPerHour) {
                                twofareq = true;
                            }

                            var amount = convertToSatoshis($('#hdamount').val(), COINUNIT);

                            if ((amount) > limits.SingleTransactionLimit) {
                                twofareq = true;
                            }
                            if ((limits.TotalAmount24hr + amount) > limits.DailyTransactionLimit) {
                                twofareq = true;
                            }

                            if (twofareq) {


                                $('#twofactreq').show();
                                $('#sendstds2amt').text($('#hdamount').val() + ' ' + COINUNIT);
                                $('#sendstds2add').text($('#toAddress').val());

                                //$("#sendstds1").hide();
                                $("#sendstds3").hide();
                                $("#sendstds2").show();
                                $("#sendstdmodal").modal('show');

                            } else {


                                $('#twofactreq').hide();
                                $('#sendstds2amt').text($('#hdamount').val() + ' ' + COINUNIT);
                                $('#sendstds2add').text($('#toAddress').val());

                                //$("#sendstds1").hide();
                                $("#sendstds3").hide();
                                $("#sendstds2").show();
                                $("#sendstdmodal").modal('show');

                            }


                        });

                    }

                });

            }
        });


        $("#btncancelmoneynet").click(function () {

            $("#networksend").show();
            $("#sendnetmodal").modal('hide');
            $("#txtFriendSend2FA").val('');
            $("#sendfriendprog").hide();
            $("#textMessageSend").hide();

        });

        $('#btnsendnetdone').click(function () {

            $("#networksend").show();
            $("#sendnetmodal").modal('hide');
            $("#txtSendTwoFactor").val('');
            $("#sendfriendprog").hide();
            $("#textMessageSend").hide();

            $('input#friendAmount').keyup();
            norefresh = false;

        });


        $("#btnconfmoneynet").click(function () {

            norefresh = true;

            var amount = $('#hdfriendAmount').val();
            amount = convertToSatoshis(amount, COINUNIT);

            $("#txtFriendSend2FA").val('');
            $('#txtFriendSend2FA').css("border-color", "#ccc");
            $('#textMessageSend').removeClass('alert alert-danger');

            var allok = true;
            if (amount > 0) {
                $('input#friendAmount').css("border-color", "#ccc");
            } else {
                $('input#friendAmount').css("border-color", "#ffaaaa");
                allok = false;
            }
            if (allok) {

                Engine.Device.getStorageItem("tfso" + Engine.m_guid, function (res) {

                    if (res == "") {


                        $('#sendnets2amt').text($('#hdfriendAmount').val() + ' ' + COINUNIT);
                        $('#sendnets2add').text(SELECTEDFRIEND);

                        //$("#networksend").hide();
                        $("#sendnets3").hide();
                        $("#sendnetmodal").modal('show');
                        $("#sendnets2").show();

                        $("#twofactreqnet").show();

                    } else {

                        Engine.getLimitStatus(function (err, limits) {

                            var twofareq = false;
                            if ((limits.No24hr + 1) > limits.NoOfTransactionsPerDay) {
                                twofareq = true;
                            }
                            if ((limits.No1hr + 1) > limits.NoOfTransactionsPerHour) {
                                twofareq = true;
                            }

                            var amount = convertToSatoshis($('#hdfriendAmount').val(), COINUNIT);

                            if ((amount) > limits.SingleTransactionLimit) {
                                twofareq = true;
                            }
                            if ((limits.TotalAmount24hr + amount) > limits.DailyTransactionLimit) {
                                twofareq = true;
                            }

                            if (twofareq) {


                                $('#sendnets2amt').text($('#hdfriendAmount').val() + ' ' + COINUNIT);
                                $('#sendnets2add').text(SELECTEDFRIEND);

                                //$("#networksend").hide();
                                $("#sendnets3").hide();
                                $("#sendnetmodal").modal('show');
                                $("#sendnets2").show();

                                $("#twofactreqnet").show();

                            } else {


                                $('#sendnets2amt').text($('#hdfriendAmount').val() + ' ' + COINUNIT);
                                $('#sendnets2add').text(SELECTEDFRIEND);

                                //$("#networksend").hide();
                                $("#sendnets3").hide();
                                $("#sendnetmodal").modal('show');
                                $("#sendnets2").show();

                                $("#twofactreqnet").hide();


                            }

                        });

                    }

                });


            }
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


                        Engine.m_nickname = username;

                        Engine.createWallet(guid, password, username, emailAddress, function (err, result) {

                            //move error handling and ui elements to here
                            $("#createWalletStart input#nickname").css("border-color", "#ccc");
                            if (err) {
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

                            } else {

                                //set variables for the session
                                $("#createWalletStart").hide();
                                $('#createWalletStart input#cpassword').val('');
                                $('#createWalletStart input#password1').val('');

                                //save the encrypted hot key in local storage

                                $("#hotWalletPhrase").text(result.hotWalletPhrase);
                                $("#coldWalletPhrase").text(result.coldWalletPhrase);
                                $("#coldWalletPhrasePrintText").text(result.coldWalletPhrase);


                                $("#walletGuid").text($('input#guid').val());
                                $("#showPhrases").show();
                                $("#securitywizard").show();

                                $(".next").hide();

                                $("#no2famessage").hide();
                                showTwoFactorQr();

                            }
                        });
                    }

                } else {

                    //password not strong
                    $("#createwalletalert").show();
                    $("#createwalletalertmessage").text("Password must be Strong- ideally Very Strong");
                }

            }

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


        $("#btnPassphraseLogin").click(function () {


            var isvalid = $('#phrase2fa').parsley('validate');

            if (isvalid) {

                $("#btnPassphraseLogin").prop('disabled', true);

                var twoFactorCodeChk = $('#twoFactorCodeCheck').val();

                var target = document.getElementById('imgphrasewaiting');
                var spinner = new Spinner(spinneropts).spin(target);

                $("#imgphrasewaiting").show();

                Engine.Device.setStorageItem('guid', Engine.m_oguid);

                Engine.openWalletAfterCreate(twoFactorCodeChk, function (err, result) {

                    if (err) {

                        $("#imgphrasewaiting").hide();
                        $("#phraseloginerror").show();
                        $("#phraseloginerrormessage").text(result);
                        $("#btnPassphraseLogin").prop('disabled', false);

                    } else {

                        initialiseUI();
                        $("#btnPassphraseLogin").prop('disabled', false);
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

                        Engine.Device.setStorageItem("user", Engine.m_nickname);
                        Engine.Device.setStorageItem("userimg", Engine.m_profileImage);

                    }


                });
            }

        });


        $("#btnEmailValidate").click(function () {

            var token = $("#txtEmailToken").val();

            $("#btnEmailValidate").prop('disabled', true);

            Engine.getEmailValidation(token, function (err, response) {

                if (err) {
                    $("#btnEmailValidate").prop('disabled', false);
                } else {

                    if (response != "Valid") {
                        $("#valemailerror").show();

                        if (response == "Expired") {
                            $("#valemailerrormessage").text('Your token has expired');
                        }
                        if (response == "Invalid") {
                            $("#valemailerrormessage").text('Your token is not valid');
                        }

                        $("#btnEmailValidate").prop('disabled', false);

                    } else {


                        //initialiseUI();
                        Engine.m_validate = false;


                        $("#securitywizard").hide();
                        $("#validateemail").hide();
                        $("#mainWallet").show();
                        $("#valemailerror").hide();
                        $("#btnEmailValidate").prop('disabled', false);
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

                if ($("#hotconf")[0].checked) {
                    $(".next").show();
                } else {
                    $(".next").hide();
                }

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
                    $("#reset2faerrormessage").text('There was an error');
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
            $('#displaykeys2fa').css("border-color", "#ccc");

            var twoFactorCode = $("#displaykeys2fa").val();

            if (twoFactorCode.length == 6) {

                Engine.getBackup(twoFactorCode, function (err, result) {

                    if (!err) {

                        $("#displaykeyserr").hide();

                        var ninkiPub = result.ninkiPubKey;
                        var phrase = result.hotHash;

                        if (phrase != "Unavailable") {
                            var bip39 = new BIP39();  // 'en' is the default language
                            var hotmnem = bip39.entropyToMnemonic(phrase);
                            $("#secdisphrase").text(hotmnem);
                            $("#secdisphrase").show();
                        }

                        $("#secdisninki").text(ninkiPub);

                        $("#secdisninki").show();
                        $("#btnhidekeys").show();
                        $("#btndisplaykeys").hide();

                    } else {

                        $("#displaykeyserrmess").text(result);
                        $("#displaykeyserr").show();


                    }

                });

            } else {

                $('#displaykeys2fa').css("border-color", "#ffaaaa");
            }

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
                            $("#val2fatokenerrormessage").text('Your token has expired');
                        }
                        if (response == "Invalid") {
                            $("#val2fatokenerrormessage").text('Your token is not valid');
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


        Engine.Device.getStorageItem('guid', function (res) {

            $("#openWalletStart #guid").val(res);

            if (res.length > 0) {

                $("#guidsec").hide();


                if (Engine.Device.isChromeApp()) {

                    Engine.Device.getStorageItem('user', function (uname) {

                        //console.write(res);
                        $("#loginuser").text(uname);

                        Engine.Device.getStorageItem('userimg', function (res) {

                            var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(uname.length) + ".png";

                            if (res != '') {
                                imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(res) + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
                            }

                            var xhrsm = new XMLHttpRequest();
                            xhrsm.open('GET', imageSrcSmall, true);
                            xhrsm.responseType = 'blob';

                            xhrsm.onload = function (e) {
                                $("#loginimg").attr("src", window.URL.createObjectURL(this.response));
                            };

                            xhrsm.send();

                            $("#password").focus();

                        });



                    });

                }

                showOpenWalletStart();


            } else {

                $("#introduction").show();

            }
        });

        $("#btnsigndiff").click(function () {

            $("#guidsec").show();
            $("#userlogin").hide();

        });




        $("#printCold").click(function () {
            // $("#coldWalletPhrase").printElement();

            chrome.app.window.create('printwindow.html', { 'bounds': {
                'width': Math.round(window.screen.availWidth * 0.25),
                'height': Math.round(window.screen.availHeight * 0.25)
            }
            },
            function (createdWindow) {
                var win = createdWindow.contentWindow;
                win.onload = function () {
                    win.document.querySelector('#content').innerHTML = $("#coldWalletPhrasePrintText").text();
                    win.print();
                }
            }
        );

        });


        $("#btnPrintCodes").click(function () {
            // $("#coldWalletPhrase").printElement();

            chrome.app.window.create('printwindow.html', { 'bounds': {
                'width': Math.round(window.screen.availWidth * 0.2),
                'height': Math.round(window.screen.availHeight * 0.5)
            }
            },
            function (createdWindow) {
                var win = createdWindow.contentWindow;
                win.onload = function () {
                    win.document.querySelector('#content').innerHTML = $("#codeprintarea").html();
                    win.print();
                }
            }
        );

        });


        $("#btnCreateInit").click(function () {
            $("#introduction").hide();
            showCreateWalletStart();
        });

        $("#btnLoginInit").click(function () {
            $("#introduction").hide();
            showOpenWalletStart();
        });


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

        $("#balance").text("... BTC");
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

            $("#logusebackup").show();
            $("#openWalletStart").hide();
            $("#loginbackup").show();

            $('#log' + Engine.m_settings.BackupIndex).attr("style", "border-color:red");

        });

        $("#btnLoginBackupCancel").click(function () {

            $("#logusebackup").hide();
            $("#openWalletStart").show();
            $("#loginbackup").hide();

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
                $("#chngpwdprogmess").text('Getting packet...');


                if (oldpassword != newpassword) {

                    //check password strength
                    if (($(".newpwstrength_viewport_progress .password-verdict").text() == 'Strong' || $(".newpwstrength_viewport_progress .password-verdict").text() == 'Very Strong')) {

                        //stretch old password
                        //verify that it matches the current one
                        $("#chngpwdprogbar").width('20%');
                        $("#chngpwdprogmess").text('Getting details...');

                        setTimeout(function () {

                            Engine.ChangePassword(twoFactorCode, oldpassword, newpassword, function (err, results) {

                                if (err) {
                                    $("#chngpwerr").show();
                                    $("#chngpwerrmess").text(results);
                                    $("#chngpwdprogmess").hide();
                                    $("#chngpwdprog").hide();

                                } else {

                                    password = results;

                                    $("#pwdchangemain").hide();

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

                            }, function (message, progress) {

                                $("#chngpwdprogmess").text(message);
                                $("#chngpwdprogbar").width(progress);

                            });


                        }, 500);
                    }

                } else {

                    $("#chngpwerr").show();
                    $("#chngpwerrmess").text("Passwords are the same. Password not updated");
                    $("#chngpwdprogmess").hide();
                    $("#chngpwdprog").hide();
                }

            }
        });


        $("#btnVerify").click(function () {


            $(this).prop('disabled', true);

            var target = document.getElementById('verifyspinner');
            var spinner = new Spinner(spinneropts).spin(target);

            $("#verifyspinner").show();

            var code = $("#txtCode").val();

            $("#txtCode").css("border-color", "#ccc");
            $("#validatefail").hide();
            $("#validatesuccess").hide();

            var bip39 = new BIP39();
            code = bip39.mnemonicToHex(code);

            if (code.length != 40) {
                $("#txtCode").css("border-color", "#ffaaaa");
                $("#verifyspinner").hide();
                $(this).prop('disabled', false);
                return;
            }

            var isAccepted = false;

            if (FRIENDSLIST[selectedFriend.userName].IsSend) {
                isAccepted = true;
            }


            if (isAccepted) {

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

                    $("#verifyspinner").hide();
                    $("#btnVerify").prop('disabled', false);
                });

            } else {

                Engine.acceptFriendRequest(SELECTEDFRIEND, function (err, res) {


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

                        $("#verifyspinner").hide();
                        $("#btnVerify").prop('disabled', false);
                    });

                });

            }
        });



        $("#btnBackupCode2fa").click(function () {

            $('#fab' + Engine.m_settings.BackupIndex).attr("style", "border-color:red");

            $("#tfausebackup").show();
            $("#tfamove").hide();

        });

        $("#btn2faBackupCancel").click(function () {

            $("#tfausebackup").hide();
            $("#tfamove").show();

        });



        $("#btnSetupTwoFactor").click(function () {


            showSettingsTwoFactorQr();

        });


        $("#btn2faBackupDone").click(function () {


            showSettingsBackupTwoFactorQr();

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
                        //logout();

                        $("#twofactorsettings").hide();
                        $("#2famodal").modal('hide');

                        $("#twoFactorCodeFor2fa").val('');
                        $("#txtsettings2fa").val('');


                    } else {
                        //error
                        $("#savetwofactorerror").show();
                        $("#savetwofactorerrormessage").show();
                        $("#savetwofactorerrormessage").text(result);
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

                    readAccountSettings();

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

        });



        $("#btnSaveBackup").click(function () {

            //errbackup
            backupHotKey('#errbackup');

        });

        $("#btnSaveBackupP").click(function () {

            //errbackupp
            backupHotKey('#errbackupp');

        });

        $("#backupHot").click(function () {

            //errbackuphot
            backupHotKey('#errbackuphot');

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


        $("#btncancelmoneyinv").click(function () {

            $("#invmodal").modal('hide');

        });

        $("#btnsendinvdone").click(function () {

            $("#invmodal").modal('hide');

        });



        $("#btnpayinvoice").click(function () {


            Engine.Device.getStorageItem("tfso" + Engine.m_guid, function (res) {

                if (res == "") {

                    $('input#txtInvoice2FA').css("border-color", "#ccc");
                    $('input#txtInvoice2FA').val('');

                    $("#sendinvprog").hide();
                    $("#textMessageSendInv").hide();

                    $("#sendinvs2").hide();
                    $("#sendinvs2").show();
                    $("#invmodal").modal('show');

                    $("#twofactreqinv").show();

                } else {


                    Engine.getLimitStatus(function (err, limits) {

                        var twofareq = false;
                        if ((limits.No24hr + 1) > limits.NoOfTransactionsPerDay) {
                            twofareq = true;
                        }
                        if ((limits.No1hr + 1) > limits.NoOfTransactionsPerHour) {
                            twofareq = true;
                        }

                        var amount = selectedInvoiceAmount;

                        if ((amount) > limits.SingleTransactionLimit) {
                            twofareq = true;
                        }
                        if ((limits.TotalAmount24hr + amount) > limits.DailyTransactionLimit) {
                            twofareq = true;
                        }

                        if (twofareq) {

                            $('input#txtInvoice2FA').css("border-color", "#ccc");
                            $('input#txtInvoice2FA').val('');

                            $("#sendinvprog").hide();
                            $("#textMessageSendInv").hide();

                            $("#sendinvs2").hide();
                            $("#sendinvs2").show();
                            $("#invmodal").modal('show');

                            $("#twofactreqinv").show();


                        } else {

                            $('input#txtInvoice2FA').css("border-color", "#ccc");
                            $('input#txtInvoice2FA').val('');

                            $("#sendinvprog").hide();
                            $("#textMessageSendInv").hide();

                            $("#sendinvs2").hide();
                            $("#sendinvs2").show();
                            $("#invmodal").modal('show');

                            $("#twofactreqinv").hide();

                        }

                    });


                }

            });


        });

        $("#btnSendInvoice").click(function () {

            var allok = true;
            var twoFactorCode = $('#txtInvoice2FA').val();

            Engine.get2faOverride(amount, function (err, result) {

                if (result == "") {

                    if (twoFactorCode.length == 6) {
                        $('input#txtSendTwoFactor').css("border-color", "#ccc");
                    } else {
                        $('input#txtSendTwoFactor').css("border-color", "#ffaaaa");
                        allok = false;
                    }
                } else {

                    twoFactorCode = result;

                }

                if (allok) {

                    $('#textMessageSendInv').removeClass('alert alert-danger');
                    $('#textMessageSendInv').text('Creating transaction...');
                    $('#textMessageSendInv').show();
                    $('#sendinvprogstatus').width('3%');
                    $('#sendinvprog').show();
                    $('#sendinvprogstatus').width('10%');

                    payInvoice(selectedInvoiceUserName, selectedInvoiceAmount, selectedInvoiceId, twoFactorCode, function (err, result) {

                        if (!err) {

                            $("#sendinvs2").hide();
                            $("#sendinvs3").show();
                        }


                    });

                }



            });


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

            var subtotal = $("#tblinvoice tfoot th #subtotal").text();
            var tax = $("#tblinvoice tfoot th #tax").text();
            var total = $("#tblinvoice tfoot th #total").text();

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
            lineCount = 0;
            $("#createinvoiceforlabel").text('Create an Invoice for ' + SELECTEDFRIEND);
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
                        $('#lineTotal' + (event.data.line)).text(($('#line' + (event.data.line) + 'Amount').val() * $('#line' + (event.data.line) + 'Quantity').val()).toFixed(4));
                        calcInvoiceTotals();
                    } else {
                        //$('#line' + (event.data.line) + 'Amount').
                    }
                });


                $('#line' + lineCount + 'Quantity').blur({
                    line: lineCount
                }, function (event) {
                    if (validateInvoice()) {
                        $('#lineTotal' + (event.data.line)).text(($('#line' + (event.data.line) + 'Amount').val() * $('#line' + (event.data.line) + 'Quantity').val()).toFixed(4));
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

    });

    $('#txtTax').blur(function () {

        var tax = $('#txtTax').val();
        tax = tax.replace('%', '');

        if (!jQuery.isNumeric(tax)) {
            tax = 10;
            $('#txtTax').val(tax)
        } else {
            var savetax = tax / 100;

            Engine.updateUserProfile(Engine.m_profileImage, Engine.m_statusText, savetax, function (err, res) {


            });
        }

        calcInvoiceTotals();
        $('#txtTax').val(tax + '%');

    });


    function calcInvoiceTotals() {

        var tax = $('#txtTax').val();
        tax = tax.replace('%', '') * 1;
        tax = tax / 100;


        var subTotal = 0;
        $('#tblinvoice .lineTotal').each(function () {

            subTotal += ($(this).text() * 1);

        });

        $("#subtotal").text(subTotal.toFixed(4));
        $("#tax").text((subTotal * tax).toFixed(4));
        $("#total").text((subTotal + (subTotal * tax)).toFixed(4));

    }
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
            //$("#subtotal").text(subTotal.toFixed(4));
            //$("#tax").text((subTotal * 0.10).toFixed(4));
            //$("#total").text((subTotal + (subTotal * 0.10)).toFixed(4));
            //} else {
            //    isValid = false;
            //}
        }

        return isValid;

    }
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
                        '<input id=\"line' + lineCount + 'Amount\" data-type="number" class="form-control amount" placeholder="' + _.escape(COINUNIT) + '" />' +
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

            $('#invbmpaglabel').text('Showing ' + (indexFrom + 1) + ' to ' + (indexTo) + ' of ' + filteredForMeInvoices.length);


            invoices = filteredForMeInvoices;

            if (lastInvoiceToPayCount < invoices.length) {





                pagedForMeInvoices = filteredForMeInvoices.slice(indexFrom, indexTo);

                invoices = pagedForMeInvoices;

                cachedInvoices = [];

                lastInvoiceToPayCount = invoices.length;

                var s = '';
                $('#tblinvoicepay tbody').empty();
                for (var i = 0; i < invoices.length; i++) {

                    cachedInvoices.push(invoices[i]);

                    var invdate = new Date(invoices[i].InvoiceDate.match(/\d+/)[0] * 1).toLocaleString();
                    var invpaydate = '';
                    if (invoices[i].InvoicePaidDate) {
                        invpaydate = new Date(invoices[i].InvoicePaidDate.match(/\d+/)[0] * 1).toLocaleString();
                    }

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

                    s += "<tr><td><label class=\"checkbox m-n i-checks\"><input type=\"checkbox\" name=\"post[]\"><i></i></label></td><td>" + _.escape(invdate) + "</td>";

                    s += "<td><span class=\"thumb-sm\"><img id=\"imginvoice" + i + "\" alt=\"\" class=\"img-circle\"></span><span class=\"m-s\"> ";

                    s += _.escape(invoices[i].InvoiceFrom) + "</span></td>";

                    s += "<td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td>" + _.escape(invpaydate) + "</td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoice" + i + "\">View</button></td></tr>";
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


                    var length = invoices[i].InvoiceFrom.length;
                    if (length > 20) {
                        length = 20;
                    }

                    var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";


                    if (FRIENDSLIST[invoices[i].InvoiceFrom].profileImage != '') {
                        imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(FRIENDSLIST[invoices[i].InvoiceFrom].profileImage) + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
                    }


                    if (Engine.Device.isChromeApp()) {
                        var xhrsm = new XMLHttpRequest();
                        xhrsm.open('GET', imageSrcSmall, true);
                        xhrsm.responseType = 'blob';
                        xhrsm.index = i;
                        xhrsm.onload = function (e) {
                            $("#tblinvoicepay #imginvoice" + this.index).attr("src", window.URL.createObjectURL(this.response));
                        };
                        xhrsm.send();
                    } else {

                        //can we use chrome method here?
                        $("#tblinvoicepay #imginvoice" + i).attr("src", imageSrcSmall);
                    }


                }

            }

            if (callback) {
                callback();
            }

        });
    }



    var lastInvoiceToPayNetCount = 0;
    var uiInvoiceReturnToNetwork = false;
    function showInvoiceListNetwork(callback) {

        if (SELECTEDFRIEND != '') {


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

                    var invdate = new Date(invoices[i].InvoiceDate.match(/\d+/)[0] * 1).toLocaleString();
                    var invpaydate = '';
                    if (invoices[i].InvoicePaidDate) {
                        invpaydate = new Date(invoices[i].InvoicePaidDate.match(/\d+/)[0] * 1).toLocaleString();
                    }

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

                    s += "<tr><td>" + _.escape(invdate) + "</td>" +
                                 "<td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td>" + _.escape(invpaydate) + "</td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoicenetfrom" + _.escape(invoices[i].InvoiceFrom + invoices[i].InvoiceId) + "\">View</button></td></tr>";
                }

                $('#tblnetinvforme tbody').append(s);

                for (var i = 0; i < invoices.length; i++) {

                    $("#tblnetinvforme #viewinvoicenetfrom" + _.escape(invoices[i].InvoiceFrom) + _.escape(invoices[i].InvoiceId)).click({
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

        if (callback) {

            callback(false, '');

        }
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

                var invdate = new Date(invoices[i].InvoiceDate.match(/\d+/)[0] * 1).toLocaleString();
                var invpaydate = '';
                if (invoices[i].InvoicePaidDate) {
                    invpaydate = new Date(invoices[i].InvoicePaidDate.match(/\d+/)[0] * 1).toLocaleString();
                }


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

                s += "<tr><td>" + _.escape(invdate) + "</td>" +
                                 "<td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td>" + _.escape(invpaydate) + "</td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoicenetby" + _.escape(invoices[i].InvoiceFrom) + _.escape(invoices[i].InvoiceId) + "\">View</button></td></tr>";
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

            $('#invbmpaglabel').text('Showing ' + (indexFrom + 1) + ' to ' + (indexTo) + ' of ' + filteredByMeInvoices.length);

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


                    s += "<tr><td><label class=\"checkbox m-n i-checks\"><input type=\"checkbox\" name=\"post[]\"><i></i></label></td><td>" + _.escape(invdate) + "</td><td><span class=\"thumb-sm\"><img alt=\"\"  id=\"imginvoicebyuser" + i + "\" class=\"img-circle\"></span><span class=\"m-s\"> " +
                                 _.escape(invoices[i].InvoiceFrom) + "</span></td><td><a href=\"#\" class=\"active\">" + statusbox + "</a></td><td><span class=\"paid\">" + _.escape(invpaydate) + "</span></td><td><button type=\"button\" class=\"btn btn-sm btn-default\" id=\"viewinvoicebyuser" + i + "\">View</button></td></tr>";
                }

                $('#tblinvoicebyme tbody').append(s);

                for (var i = 0; i < invoices.length; i++) {

                    $("#tblinvoicebyme #viewinvoicebyuser" + i).click({
                        index: invoices[i].InvoiceId, username: invoices[i].InvoiceFrom
                    }, function (event) {
                        displayInvoiceByUser(event.data.index, event.data.username, 'byme', function (err, res) {


                        });
                    });



                    var length = invoices[i].InvoiceFrom.length;
                    if (length > 20) {
                        length = 20;
                    }

                    var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";


                    if (FRIENDSLIST[invoices[i].InvoiceFrom].profileImage != '') {
                        imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(FRIENDSLIST[invoices[i].InvoiceFrom].profileImage) + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
                    }



                    if (Engine.Device.isChromeApp()) {
                        var xhrsm = new XMLHttpRequest();
                        xhrsm.open('GET', imageSrcSmall, true);
                        xhrsm.responseType = 'blob';
                        xhrsm.index = i;
                        xhrsm.onload = function (e) {
                            $("#tblinvoicebyme #imginvoicebyuser" + this.index).attr("src", window.URL.createObjectURL(this.response));
                        };
                        xhrsm.send();
                    } else {
                        $("#tblinvoicebyme #imginvoicebyuser" + i).attr("src", imageSrcSmall);
                    }


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
                    //$(elem).text('');
                    $(elem).html(statusbox);
                });

                $('#tblinvoicebyme tbody tr .paid').each(function (index, elem) {

                    if (cachedInvoicesByUser[index].InvoiceStatus == 1 || cachedInvoicesByUser[index].InvoiceStatus == 1) {

                        var invpaydate = '';
                        if (cachedInvoicesByUser[index].InvoicePaidDate) {
                            invpaydate = new Date(cachedInvoicesByUser[index].InvoicePaidDate.match(/\d+/)[0] * 1).toLocaleString();
                        }
                        $(elem).text(invpaydate);
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




        $("#createinv").hide();
        $("#invoicestopay").hide();

        $('#tblinvdisplay tbody').empty();
        var s = '';
        for (var i = 0; i < json.invoicelines.length; i++) {
            s += "<tr><td>" + _.escape(json.invoicelines[i].description) + "</td><td>" + _.escape(json.invoicelines[i].quantity) + "</td><td>" + _.escape(convertFromSatoshis(json.invoicelines[i].amount, COINUNIT)) + "</td><td>" + _.escape((convertFromSatoshis(json.invoicelines[i].amount, COINUNIT) * json.invoicelines[i].quantity).toFixed(4)) + "</td></tr>";
        }

        $('#tblinvdisplay tbody').append(s);

        if (invtype == 'forme') {
            $("#dinvusername").text('Invoice from ' + invoice.InvoiceFrom);
            $("#sendinvcontact").text(invoice.InvoiceFrom);

        } else {
            $("#dinvusername").text('Invoice to ' + invoice.InvoiceFrom);
        }


        var invdate = new Date(invoice.InvoiceDate.match(/\d+/)[0] * 1).toLocaleString();
        var invpaydate = '';
        if (invoice.InvoicePaidDate) {
            invpaydate = new Date(invoice.InvoicePaidDate.match(/\d+/)[0] * 1).toLocaleString();
        }


        $("#dinvdate").text(invdate);

        $("#tblinvdisplay tfoot th #dsubtotal").text(convertFromSatoshis(json.summary.subtotal, COINUNIT));
        $("#tblinvdisplay tfoot th #dtax").text(convertFromSatoshis(json.summary.tax, COINUNIT));
        $("#tblinvdisplay tfoot th #dtotal").text(convertFromSatoshis(json.summary.total, COINUNIT));

        selectedInvoiceAmount = json.summary.total;
        selectedInvoiceId = invoice.InvoiceId;
        selectedInvoiceUserName = invoice.InvoiceFrom;


        $("#sendinvamount").text(convertFromSatoshis(json.summary.total, COINUNIT) + ' ' + COINUNIT);

        $("#sendinvprog").hide();
        $("#textMessageSendInv").hide();
        $("#btnokinvoice").hide();
        $("#invvalmess").hide();
        $("#invoice2fa").hide();


        if (invtype == 'forme') {
            if (invoice.InvoiceStatus == 0) {
                $("#payinvoicecancel").show();
                $("#btnpayinvoice").show();
                $("#btnrejectinvoice").show();
                $("#invoice2fa").show();
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

    function createNewInvoice(userName, invoice, callback) {

        Engine.createInvoice(userName, invoice, function (err, invoiceNo) {

            return callback(err, invoiceNo);

        });

    }


    function payInvoice(friend, amount, invoiceNumber, twoFactorCode, callback) {


        Engine.sendTransaction('invoice', friend, '', amount, twoFactorCode, function (err, transactionid) {

            if (!err) {

                Engine.updateInvoice(friend, invoiceNumber, transactionid, 1, function (err, result) {

                    if (!err) {

                        $('#textCompleteSendInv').text('You paid invoice: ' + friend.toUpperCase() + invoiceNumber);
                        //$('#textMessageSendInv').fadeOut(5000);
                        //$('#sendinvprog').fadeOut(5000);

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

                        callback(err, "");
                    }

                });


            } else {


                $('#textMessageSendInv').addClass('alert alert-danger');
                $('#sendinvprogstatus').width('0%');

                if (transactionid == "ErrInsufficientFunds") {
                    $('#textMessageSendInv').text('Transaction Failed: Not enough funds are currently available to send this transaction');
                } else {
                    $('#textMessageSendInv').text(transactionid);
                }

                callback(err, "");

            }



        }, function (message, progress) {

            if (message) {
                $('#textMessageSendInv').text(message);
            }

            if (progress) {
                $('#sendinvprogstatus').width(progress);
            }

        });



    }


    //INVOICE FUNCTIONS END------------------------------------------


    //OPEN/CREATE WALLET FUNCTIONS---------------------------------------------

    //event handlers



    //wrapper functions



    function initialiseUI(callback) {

        //check if hot key is available
        //if not prompt the user to enter their hot key

        Engine.appHasLoaded();


        Engine.getHotHash("", function (err, result) {


            if (err) {
                //show modal enter phrase
                $("#hotkeymodal").modal('show');
                $("#hotkeyenter").show();
            }


            var length = Engine.m_nickname.length;
            if (length > 20) {
                length = 20;
            }

            COINUNIT = Engine.m_settings.CoinUnit;

            $("#stdselunit").text(COINUNIT);
            $("#netselunit").text(COINUNIT);

            $("#mynickname").text(Engine.m_nickname);
            $("#usernameProfile").text(Engine.m_nickname);
            $("#mystatus").text(Engine.m_statusText);
            $("#txtTax").val((Engine.m_invoiceTax * 100) + '%');


            var imageSrc = "images/avatar/256px/Avatar-" + pad(length) + ".png";
            var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";

            if (Engine.m_profileImage != '') {

                imageSrc = "https://ninkip2p.imgix.net/" + _.escape(Engine.m_profileImage) + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
                imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(Engine.m_profileImage) + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
            }

            if (Engine.Device.isChromeApp()) {

                var xhr = new XMLHttpRequest();
                xhr.open('GET', imageSrc, true);
                xhr.responseType = 'blob';


                xhr.onload = function (e) {
                    $("#imgProfile").attr("src", window.URL.createObjectURL(this.response));
                };
                xhr.send();

                var xhrsm = new XMLHttpRequest();
                xhrsm.open('GET', imageSrcSmall, true);
                xhrsm.responseType = 'blob';

                xhrsm.onload = function (e) {
                    $("#imgtoprightprofile").attr("src", window.URL.createObjectURL(this.response));
                };
                xhrsm.send();

            } else {

                $("#imgProfile").attr("src", imageSrc);

                $("#imgtoprightprofile").attr("src", imageSrcSmall);
            }

            $("#codeForFriend").text(Engine.m_fingerprint);

            Engine.getusernetworkcategory(function (err, categories) {

                var catOptions = '<select id="nselnetcat" class="form-control">';

                for (var i = 0; i < categories.length; i++) {

                    catOptions += '<option>' + _.escape(categories[i].Category) + '</option>';

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


                    document.onAway = function () { logout(); };

                    setInterval(function () {
                        updateUI();
                    }, 10000);

                    setInterval(function () {
                        refreshSelectedFriend();
                    }, 30000);




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

                    updateUI();

                    updateRequestsMadeByMe();

                    readAccountSettings();


                    setAwayTimeout(600000);

                    $('#stdselcu').click();
                    $('#netselcu').click();

                    if (callback) {

                        return callback(false, "ok");

                    }


                }


            });

        });

    }

    //OPEN/CREATE WALLET FUNCTIONS END---------------------------------------------

    function pad(n) {
        return (n < 10) ? ("0" + n) : n;
    }

    function logout() {

        if (chrome) {
            if (chrome.runtime) {
                if (chrome.runtime.reload) {
                    chrome.runtime.reload()
                } else {
                    location.reload();
                }
            } else {
                location.reload();
            }
            //return callback(true, data.statusText);
        } else {
            location.reload();
        }
    }

    UI.updateUITimer = function () {
        updateUI();
    };





    function updateUI() {


        Ninki.API.getPrice(Engine.m_guid, Engine.m_settings.LocalCurrency, function (err, result) {

            price = result * 1.0;

            var loc = "en-US";
            var ires = price;

            if (Engine.m_settings.LocalCurrency == "JPY") {
                ires = (result * 1.0).toFixed(0) * 1.0;
            }


            var cprc = ires.toLocaleString(loc, { style: "currency", currency: Engine.m_settings.LocalCurrency });

            $('#price').text(cprc + ' / BTC');

        });


        $(".coinunit").text(COINUNIT);
        $("#stdsendcunit").text(COINUNIT);
        $("#stdsendlcurr").text(Engine.m_settings.LocalCurrency);
        $("#netsendcunit").text(COINUNIT);
        $("#netsendlcurr").text(Engine.m_settings.LocalCurrency);

        $("#amount").attr("placeholder", "Enter amount in units of " + COINUNIT);
        $("#friendAmount").attr("placeholder", "Enter amount in units of " + COINUNIT);
        $("#fndsendcunit").text(COINUNIT);


        updateCoinProfile(function (err, res) {

        });

        updateDeviceList(function (err, res) {

        });


        updateBalance(function (err, res) {

            updateFriends(function (err, res) {

                updateFriendRequests(function (err, res) {

                    updateRequestsMadeByMe(function (err, res) {

                        updateTransactions(function (err, res) {

                            showInvoiceList(function (err, res) {

                                showInvoiceByUserList(function (err, res) {

                                    showInvoiceListNetwork(function (err, res) {


                                    });


                                });

                            });
                        });
                    });
                });
            });
        });
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
        $("#password").focus();
        $("#signdiff").show();
        $("#crwallet").show();

    }

    function showTwoFactorQr() {

        $("#twoFactorQr").show();
        $("#2factor1").show();

        Engine.getTwoFactorImg(function (err, twoFASecret) {

            var nickname = $("#createWalletStart input#nickname").val();
            var data = "otpauth://totp/Ninki:" + nickname + "?secret=" + twoFASecret + "&issuer=Ninki";
            var options = { text: data, width: 172, height: 172 };

            $('#twoFactorQrImg').text('');
            $('#twoFactorQrImg').qrcode(options);

        });

    }

    function showSettingsTwoFactorQr() {

        $("#twoFactorCodeFor2faError").hide();

        var twoFactorCode = $("#twoFactorCodeFor2fa").val();

        if (twoFactorCode.length == 6) {

            Engine.getNewTwoFactorImg(twoFactorCode, function (err, twoFASecret) {

                if (!err) {

                    var data = "otpauth://totp/Ninki:" + Engine.m_nickname + "?secret=" + twoFASecret + "&issuer=Ninki";
                    var options = { text: data, width: 172, height: 172 };

                    $('#imgsettings2fa').text('');
                    $('#imgsettings2fa').qrcode(options);

                    $("#setup2faqr").show();
                    $("#twofactorsettings").show();
                    $("#2famodal").modal('show');

                    $("#savetwofactorerror").hide();
                    $("#setup2faemail").hide();

                } else {

                    $("#twoFactorCodeFor2faError").show();

                }
            });

        } else {

            $("#twoFactorCodeFor2faError").show();

        }


    }

    function showSettingsBackupTwoFactorQr() {

        //$("#twoFactorCodeFor2faError").hide();

        var twoFactorCode = $("#txtTFABackupCode").val();

        if (twoFactorCode.length == 8) {

            Engine.getNewTwoFactorImg(twoFactorCode, function (err, twoFASecret) {

                if (!err) {

                    var data = "otpauth://totp/Ninki:" + Engine.m_nickname + "?secret=" + twoFASecret + "&issuer=Ninki";
                    var options = { text: data, width: 172, height: 172 };

                    $('#imgsettings2fa').text('');
                    $('#imgsettings2fa').qrcode(options);

                    $("#setup2faqr").show();
                    $("#twofactorsettings").show();
                    $("#2famodal").modal('show');

                    //$("#savetwofactorerror").hide();
                    $("#setup2faemail").hide();

                    $("#tfausebackup").hide();
                    $("#tfamove").show();

                    $('#fab' + Engine.m_settings.BackupIndex).removeAttr("style");

                    Engine.m_settings.BackupIndex = Engine.m_settings.BackupIndex + 1;

                } else {

                    $('#fab' + Engine.m_settings.BackupIndex).removeAttr("style");

                    Engine.m_settings.BackupIndex = Engine.m_settings.BackupIndex + 1;

                    $('#fab' + Engine.m_settings.BackupIndex).attr("style", "border-color:red");

                    //$("#twoFactorCodeFor2faError").show();

                }
            });

        } else {

            // $("#twoFactorCodeFor2faError").show();

        }


    }
    function showMissingTwoFactorQr() {

        Engine.getTwoFactorImg(function (err, twoFASecret) {

            if (!err) {

                var data = "otpauth://totp/Ninki:" + Engine.m_nickname + "?secret=" + twoFASecret + "&issuer=Ninki";
                var options = { text: data, width: 172, height: 172 };

                $('#imgsettings2fa').text('');
                $('#imgsettings2fa').qrcode(options);

                $("#setup2faqr").show();
                $("#twofactorsettings").show();
                $("#2famodal").modal('show');

                $("#savetwofactorerror").hide();
                $("#setup2faemail").hide();

            } else {

                $("#twoFactorCodeFor2faError").show();

            }


        });

    }

    //Download settings from server and populate input boxes
    function readAccountSettings() {

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
            //$("#btnSetupTwoFactor").hide();

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
                    $('#cuSelected').text('BTC');
                    $('#cuBTC').prop('checked', true);
                }
                if (settingsObject['CoinUnit'] == 'mBTC') {
                    $('#cuSelected').text('mBTC');
                    $('#cumBTC').prop('checked', true);
                }
                if (settingsObject['CoinUnit'] == 'uBTC') {
                    $('#cuSelected').text('&mu;BTC');
                    $('#cuuBTC').prop('checked', true);
                }
                if (settingsObject['CoinUnit'] == 'Bits') {
                    $('#cuSelected').text('Bits');
                    $('#cuuBits').prop('checked', true);
                }


                if (settingsObject['LocalCurrency'] == 'USD') {
                    $('#lcSelected').text('USD');
                    $('#lcUSD').prop('checked', true);
                }

                if (settingsObject['LocalCurrency'] == 'EUR') {
                    $('#lcSelected').text('EUR');
                    $('#lcEUR').prop('checked', true);
                }

                if (settingsObject['LocalCurrency'] == 'JPY') {
                    $('#lcSelected').text('JPY');
                    $('#lcJPY').prop('checked', true);
                }

                if (settingsObject['LocalCurrency'] == 'CNY') {
                    $('#lcSelected').text('CNY');
                    $('#lcCNY').prop('checked', true);
                }

                Engine.Device.getStorageItem("tfso" + Engine.m_guid, function (res) {

                    if (res == "") {

                        $('#chkTwoFactorLimits').prop('checked', false);

                    } else {

                        $('#chkTwoFactorLimits').prop('checked', true);
                    }

                });


                $('#pnlBackupCodes').hide();
                if (!settingsObject.HasBackupCodes) {
                    $('#pnlBackupBtn').show();
                    $('#pnlBackupIsSetup').hide();
                    $('#libackupcodes').show();
                } else {

                    if (settingsObject.BackupIndex > 7) {
                        $('#pnlBackupBtn').show();
                        $('#pnlBackupIsSetup').hide();
                        $('#libackupcodes').show();
                    } else {

                        $('#pnlBackupBtn').show();
                        $('#pnlBackupIsSetup').show();
                        $('#libackupcodes').hide();
                    }
                }



            }
        });
    }


    function saveAccountSettingsToServer() {


        $("#savesettingssuccess").hide();
        $("#savesettingserror").hide();

        var jsonPacket = {
            guid: Engine.m_guid
        };

        var minersFee = convertToSatoshis($('#MinersFee').val(), COINUNIT);

        if (minersFee > 9999) {

            jsonPacket['DailyTransactionLimit'] = convertToSatoshis($('#DailyTransactionLimit').val(), COINUNIT);
            jsonPacket['SingleTransactionLimit'] = convertToSatoshis($('#SingleTransactionLimit').val(), COINUNIT);
            jsonPacket['NoOfTransactionsPerDay'] = $('#NoOfTransactionsPerDay').val();
            jsonPacket['NoOfTransactionsPerHour'] = $('#NoOfTransactionsPerHour').val();
            jsonPacket['Inactivity'] = $('#Inactivity').val();
            jsonPacket['MinersFee'] = minersFee;

            if ($('#cuSelected').text() == 'BTC') {
                jsonPacket['CoinUnit'] = 'BTC';
            } else if ($('#cuSelected').text() == 'mBTC') {
                jsonPacket['CoinUnit'] = 'mBTC';
            } else if ($('#cuSelected').text() == 'Bits') {
                jsonPacket['CoinUnit'] = 'Bits';
            } else {
                jsonPacket['CoinUnit'] = 'uBTC';
            }

            jsonPacket['LocalCurrency'] = $('#lcSelected').text();

            jsonPacket['Email'] = $('#Email').val();
            jsonPacket['EmailNotification'] = $('#EmailNotification')[0].checked;

            if (jsonPacket['LocalCurrency'] != Engine.m_settings.LocalCurrency) {
                $("#amount").val('');
            }

            var twoFactorSend = false;


            Engine.Device.getStorageItem("tfso" + Engine.m_guid, function (res) {

                if (res == "" && $('#chkTwoFactorLimits')[0].checked) {

                    twoFactorSend = true;

                }

                if (res.length > 0 && !$('#chkTwoFactorLimits')[0].checked) {

                    Engine.Device.deleteStorageItem("tfso" + Engine.m_guid);

                }

                Engine.updateAccountSettings(jsonPacket, $("#txtTwoFactorCodeForSettings").val(), twoFactorSend, function (err, response) {


                    if (err) {
                        $("#savesettingserror").show();
                        $("#savesettingssuccess").hide();
                        $("#savesettingserrormessage").text(response);
                    } else {


                        var stdcoinunitsel = false;
                        if ($("#stdselunit").text() == COINUNIT) {
                            stdcoinunitsel = true;
                        }

                        var netcoinunitsel = false;
                        if ($("#netselunit").text() == COINUNIT) {
                            netcoinunitsel = true;
                        }

                        if (jsonPacket['CoinUnit'] != COINUNIT) {
                            COINUNIT = jsonPacket['CoinUnit'];
                            lastNoOfTrans = -1;
                            readAccountSettings();
                            $("#stdsendcunit").text(COINUNIT);
                            $("#amount").val('');
                            $("#friendAmount").val('');
                        }

                        $("#stdsendlcurr").text(Engine.m_settings.LocalCurrency);

                        if (stdcoinunitsel) {

                            $("#stdselunit").text(COINUNIT);

                        } else {

                            $("#stdselunit").text(Engine.m_settings.LocalCurrency);

                        }

                        if (netcoinunitsel) {

                            $("#netselunit").text(COINUNIT);

                        } else {

                            $("#netselunit").text(Engine.m_settings.LocalCurrency);

                        }

                        $("#amount").keyup();
                        $("#friendAmount").keyup();


                        updateUI();

                        $("#savesettingssuccess").show();
                        $("#savesettingserror").hide();
                        $("#savesettingssuccessmessage").text("Settings saved successfully");

                        //alert(response.body);
                    }
                });

            });

        } else {

            $("#savesettingserror").show();
            $("#savesettingssuccess").hide();
            $("#savesettingserrormessage").text('Mining fee must be at least ' + convertFromSatoshis(10000, COINUNIT) + ' ' + COINUNIT);


        }
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

    function updateCoinProfile(callback) {

        Engine.getCoinProfile(function (err, result) {

            var outputs = result;

            var cchtml = '';
            for (var i = 0; i < outputs.length; i++) {

                var pitem = outputs[i];

                cchtml += '<div class="media"><div>' + _.escape(pitem.Amount) + '</div><div>' + _.escape(pitem.IsPending) + '</div><div><a target="_new" href="https://btc.blockr.io/tx/info/' + pitem.TransactionId + '">' + _.escape(pitem.TransactionId) + '</a></div><div>' + _.escape(pitem.OutputIndex) + '</div><div>' + _.escape(pitem.Address) + '</div><div>' + _.escape(pitem.NodeLevel) + '</div>';

            }

            $("#coincontrol").text(cchtml);

        });


    }


    function updateBalance(callback) {

        Engine.getBalance(function (err, result) {

            if (!err) {
                //get in BTC units
                var balance = convertFromSatoshis(result.TotalBalance, COINUNIT);


                if (COINUNIT == 'BTC') {
                    $("#balance").text(balance);
                    $("#balanceTop").text(balance + " " + COINUNIT);
                } else {
                    $("#balance").text(balance.toLocaleString());
                    $("#balanceTop").text(balance.toLocaleString() + " " + COINUNIT);
                }


                //$("#balanceTop").text(balance + " " + COINUNIT + " ($" + (xccy) + ")");
                $("#dashcoinunit").text(COINUNIT);
                var template = '';
                if (result.UnconfirmedBalance > 0) {
                    template += '<div class="btn btn-warning btn-icon btn-rounded"><i class="fa fa-clock-o"></i></div>';
                } else {
                    template += '<div class="btn btn-success btn-icon btn-rounded"><i class="fa fa-check"></i></div>';
                }

                $("#balancetimer").html(template);

                if (callback) {
                    callback();
                }
            } else {

                $("#balance").text("connecting...");
                $("#balanceTop").text("connecting...");

            }

        });

        //$("#balance").text(Math.floor((Math.random() * 100) + 1) + " BTC");
        //$("#message").fadeToggle(3000);

    }

    function updateNetwork() {

        // getNewFriends();
        //updateFriendRequests();
        getNewFriends();
    }


    var lastNoOfDevices = -1;
    var lastDevices = [];

    var currentDevice = {};

    function updateDeviceList(callback) {


        Engine.getDevices(function (err, devices) {

            if (devices.length == lastNoOfDevices) {

                for (var i = 0; i < devices.length; i++) {

                    if (!lastDevices[i].IsPaired && devices[i].IsPaired) {


                        $('#qrdevice').text('');

                        $('#pairqr2fa').show();
                        $('#pairqrscan').hide();

                        $("#pairdevicemodal").modal('hide');
                        $("#pairdeviceqr").hide();

                    }

                    if (devices[i].IsPaired != lastDevices[i].IsPaired) {
                        lastNoOfDevices = 0;
                        break;
                    }
                }

            }


            if (devices.length > lastNoOfDevices) {

                lastNoOfDevices = devices.length;

                lastDevices = devices;


                var template = '';

                $('#devices').text('');

                if (!err) {

                    for (var i = 0; i < devices.length; i++) {

                        template += '<a class="media list-group-item">';
                        template += '<div class="media">';
                        template += '<span class="pull-left thumb-sm"><i class="fa fa-2x fa-mobile-phone"></i></span>';

                        template += '<div class="media-body">';

                        if (devices[i].IsPaired) {
                            template += '<div class="pull-right"><button id="pair' + i + '" type="button" class="btn btn-sm btn-default">Unpair</button></div>';
                        } else {
                            template += '<div class="pull-right"><button id="pair' + i + '" type="button" class="btn btn-sm btn-default">Pair</button></div>';
                        }

                        template += '<div>';

                        template += _.escape(devices[i].DeviceName);
                        template += '</div>';
                        template += '<div>';
                        template += _.escape(devices[i].DeviceModel);
                        template += '</div>';
                        template += '<div>';
                        template += _.escape(devices[i].DeviceId);
                        template += '</div>';




                        template += '<small class="text-muted"></small></div>';
                        template += '</div>';
                        template += '</a>';

                    }

                    $('#devices').html(template);

                    for (var i = 0; i < devices.length; i++) {

                        $("#devices #pair" + i).click({ device: devices[i] }, function (event) {

                            currentDevice = event.data.device;
                            //here initiate the modal phone pairing screen

                            //get the device 2fa code
                            //generate a qr containing
                            //password, hotkey, 2fa code, guid

                            //event.data.deviceName


                            $('#qrdevice').text('');
                            $('#pairerror').hide();
                            if (!event.data.device.IsPaired) {


                                $('#pairqrscan').hide();
                                $("#pairdevicemodal").modal('show');
                                $("#pairdeviceqr").show();
                                $('#pairqr2fa').show();
                                $("#pairheading").text("Pair " + event.data.device.DeviceName);
                                $("#btnShowPairQr").text("Pair");
                                $('#btnPairUseBackups').hide();

                            } else {

                                $('#pairqrscan').hide();
                                $("#pairdevicemodal").modal('show');
                                $("#pairdeviceqr").show();
                                $("#pairheading").text("Unpair " + event.data.device.DeviceName);
                                $("#btnShowPairQr").text("Unpair");
                                $('#qrdevice').text('');
                                $('#btnPairUseBackups').show();


                                $('#upb' + Engine.m_settings.BackupIndex).attr("style", "border-color:red");


                                //$('#qrdevice').qrcode('');

                            }

                        });
                    }

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
                                '<div>' + _.escape(friends[i].userName) + '</div>' +
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


                    $("#nfriends").text(friends.length);

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


                        $("#nfriends").text(friends.length);
                        $("#myfriends").text('');


                        var grouptemplate = '';

                        var friendsgroup = _.groupBy(friends, function (item) { return item.category; });

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

                                var template = '<a href="#" class="media list-group-item" id="friend' + k + '"><div class="media">' +
                                '<span class="pull-left thumb-sm"><img id="imgfriend' + k + '" alt="" class="img-circle"></span><div id="seltarget' + _.escape(friends[i].userName) + '">';

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


                                var length = friends[i].userName.length;
                                if (length > 20) {
                                    length = 20;
                                }

                                var imageSrc = "images/avatar/64px/Avatar-" + pad(length) + ".png";

                                if (friends[i].profileImage != '') {
                                    imageSrc = "https://ninkip2p.imgix.net/" + _.escape(friends[i].profileImage) + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
                                    imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(friends[i].profileImage) + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
                                }

                                //$("#myfriends #imgfriend" + k)

                                if (Engine.Device.isChromeApp()) {
                                    var xhrsm = new XMLHttpRequest();
                                    xhrsm.open('GET', imageSrc, true);
                                    xhrsm.responseType = 'blob';
                                    xhrsm.index = k;
                                    xhrsm.onload = function (e) {
                                        $("#myfriends #imgfriend" + this.index).attr("src", window.URL.createObjectURL(this.response));
                                    };
                                    xhrsm.send();
                                } else {
                                    $("#myfriends #imgfriend" + k).attr("src", imageSrc);
                                }



                                $("#myfriends #friend" + k).click({ userName: friends[i].userName }, function (event) {

                                    SELECTEDFRIEND = event.data.userName;
                                    selectedFriend = FRIENDSLIST[event.data.userName];

                                    //depreciate


                                    updateSelectedFriend();
                                    $("#friendAmount").keyup();


                                });
                                console.log("added click " + k + " for " + friends[i].userName);

                                k++;
                            }
                            g++;
                        }

                    }

                    return callback(false, "done");

                } else {

                    return callback(true, "done");
                }
            });
        }

    }

    function showSecret() {


    }

    function refreshSelectedFriend(callback) {
        if (!norefresh) {
            if (SELECTEDFRIEND.length > 0) {

                Engine.getFriend(SELECTEDFRIEND, function (err, friend) {

                    if (SELECTEDFRIEND == friend.userName) {
                        selectedFriend = friend;
                        FRIENDSLIST[SELECTEDFRIEND] = friend;

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

                        var imageSrc = "images/avatar/256px/Avatar-" + pad(SELECTEDFRIEND.length) + ".png";

                        if (selectedFriend.profileImage != '') {
                            imageSrc = "https://ninkip2p.imgix.net/" + _.escape(selectedFriend.profileImage) + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
                        }

                        if (Engine.Device.isChromeApp()) {
                            var xhrsm = new XMLHttpRequest();
                            xhrsm.open('GET', imageSrc, true);
                            xhrsm.responseType = 'blob';

                            xhrsm.onload = function (e) {
                                $("#imgSelectedFriend").attr("src", window.URL.createObjectURL(this.response));
                            };
                            xhrsm.send();
                        } else {

                            $("#imgSelectedFriend").attr("src", imageSrc);

                        }


                        if (selectedFriend.status != '') {
                            $("#friendSelectedStatus").text(selectedFriend.status);
                        }




                        if (selectedFriend.validated) {
                            $("#validateform").hide();
                            $("#isvalidated").show();
                            $("#networkvalidate").hide();
                            $("#btnconfmoneynet").prop('disabled', false);
                            $("#btnconfmoneynet").removeClass('disabled');
                            $("#friendvalreq").hide();

                        } else {
                            $("#validateform").show();
                            $("#isvalidated").hide();
                            $("#networkvalidate").show();
                            $("#btnconfmoneynet").prop('disabled', true);
                            $("#btnconfmoneynet").addClass('disabled');
                            $("#friendvalreq").show();
                        }

                        if (callback) {
                            callback(err, friend);
                        }

                        //updateSelectedFriend(function (err, res) {
                        //    selFriendBkgUpdate = false;
                        //    callback(err, res);
                        //});
                    }

                });

            }

        }

    }




    function updateSelectedFriend(callback) {

        //can optimise futher
        norefresh = true;
        if (SELECTEDFRIEND.length > 0) {

            $('#sendnets1').show();
            $('#sendnets2').hide();
            $('#sendnets3').hide();

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
            $("#friendSelectedName").text(selectedFriend.userName);
            $("#friendSelectedNameTo").text(selectedFriend.userName);
            $("#validateusername").text(selectedFriend.userName);
            $("#validateusername2").text(selectedFriend.userName);
            $("#validateusername3").text(selectedFriend.userName);
            $("#validateusername4").text(selectedFriend.userName);
            $("#validateusername5").text(selectedFriend.userName);
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
                imageSrc = "https://ninkip2p.imgix.net/" + _.escape(selectedFriend.profileImage) + "?crop=faces&fit=crop&h=256&w=256&mask=ellipse&border=1,d0d0d0";
            }

            //if (selectedFriend.status != '') {
            $("#friendSelectedStatus").text(selectedFriend.status);
            //}

            if (Engine.Device.isChromeApp()) {
                var xhrsm = new XMLHttpRequest();
                xhrsm.open('GET', imageSrc, true);
                xhrsm.responseType = 'blob';

                xhrsm.onload = function (e) {
                    $("#imgSelectedFriend").attr("src", window.URL.createObjectURL(this.response));
                };
                xhrsm.send();
            } else {

                $("#imgSelectedFriend").attr("src", imageSrc);

            }


            //$("#imgSelectedFriend").attr("src", imageSrc);


            if (selectedFriend.validated) {
                $("#validateform").hide();
                $("#isvalidated").show();
                $("#networkvalidate").hide();
                $("#btnconfmoneynet").prop('disabled', false);
                $("#btnconfmoneynet").removeClass('disabled');
                $("#friendvalreq").hide();

            } else {
                $("#validateform").show();
                $("#isvalidated").hide();
                $("#networkvalidate").show();
                $("#btnconfmoneynet").prop('disabled', true);
                $("#btnconfmoneynet").addClass('disabled');
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
        Engine.getFriendRequests(function (err, friends) {

            if (friends.length > 0) {
                $("#contactrequestpanel").show();
            } else {
                $("#contactrequestpanel").hide();
            }

            $("#notifications").text(friends.length);
            $("#notificationsright").text(friends.length);
            $("#nfriendreq").text(friends.length);

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

                    var template = '<li class="list-group-item"><a href="#" class="thumb pull-right m-l m-t-xs avatar">' +
                                '<img src="images/avatar/64px/Avatar-' + pad(length) + '.png" alt="John said" class="img-circle">' +
                                '</a>' +
                                '<div class="clear">' +
                                '<a href="#" class="text-info">' + _.escape(friends[i].userName) + '<i class="icon-twitter"></i></a>' +
                                '<small class="block text-muted">has requested you as a contact</small>' +
                                '<div id="imgrequestwaiting"></div><button id=\"btnaccept' + i + '\" class="btn btn-xs btn-success m-t-xs">Accept</button> <button class="btn btn-xs btn-success m-t-xs" id=\"btnreject' + i + '\">Reject</button>' +
                                '</div></li>';

                    $("#friendreq").append(template);
                    $("#btnaccept" + i).button();

                }

                for (var i = 0; i < friends.length; i++) {


                    $("#friendreq #btnaccept" + i).click({
                        userName: friends[i].userName, index: i
                    }, function (event) {

                        $(this).prop('disabled', true);
                        $("#friendreq #btnreject" + event.data.index).prop('disabled', true);

                        $("#imgrequestwaiting").show();
                        var target = document.getElementById('imgrequestwaiting');
                        var spinner = new Spinner(spinneropts).spin(target);

                        var that = $(this);
                        var thatrej = $("#friendreq #btnreject" + event.data.index);

                        acceptFriend(event.data.userName, function (err, res) {

                            if (!err) {
                                lastNoOfFriendsReq = 0;
                                updateFriendRequests();
                            }

                            $("#imgrequestwaiting").hide();
                            $(that).prop('disabled', false);
                            $(thatrej).prop('disabled', false);

                        });
                    });


                    $("#friendreq #btnreject" + i).click({
                        userName: friends[i].userName, index: i
                    }, function (event) {

                        $(this).prop('disabled', true);
                        $("#friendreq #btnaccept" + event.data.index).prop('disabled', true);

                        var that = $(this);
                        var thatacc = $("#friendreq #btnaccept" + event.data.index);
                        rejectFriend(event.data.userName, function (err, res) {

                            if (!err) {
                                updateFriendRequests();
                            }

                            $(that).prop('disabled', false);
                            $(thatacc).prop('disabled', false);
                            //handle here instead

                        });
                    });


                }



            }
            if (callback) {
                callback(false, "done");
            }
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
                        $(elem).html('<div class="btn btn-warning btn-icon btn-rounded"><i class="fa fa-clock-o">' + _.escape(tran.Confirmations) + '</i></div>');
                    } else {
                        $(elem).html('<div class="btn btn-success btn-icon btn-rounded"><i class="fa fa-check"></i></div>');
                    }

                });

                if (callback) {

                    return callback(false, "ok");

                }
            }


            for (var i = 0; i < allTransactions.length; i++) {
                var d1 = new Date(allTransactions[i].TransDateTime);
                allTransactions[i].JsDate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1);
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
                filteredTransactions = _.filter(allTransactions, function (trans) { return trans.UserName.toLowerCase().search(search.toLowerCase()) > -1; });
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

            $('#tranpaglabel').text('Showing ' + (indexFrom + 1) + ' to ' + (indexTo) + ' of ' + filteredTransactions.length);

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
                        dirTemplate = '<td><span class="m-s">' + _.escape(convertFromSatoshis(transactions[i].Amount, COINUNIT)) + ' ' + _.escape(COINUNIT) + '</span></td><td></td>';
                    }
                    if (transactions[i].TransType == 'R') {
                        dirTemplate = '<td></td><td><span class="m-s">' + _.escape(convertFromSatoshis(transactions[i].Amount, COINUNIT)) + ' ' + _.escape(COINUNIT) + '</span></td>';
                    }

                    var tref = transactions[i].UserName;

                    if (transactions[i].UserName == 'External') {
                        tref = _.escape(transactions[i].Address.substring(0, 7)) + '...';
                    }

                    if (transactions[i].InvoiceId > 0) {
                        tref += ' <i class="fa fa-list-alt text-success i-1x i-s"></i>';
                    }



                    var trdate = new Date(transactions[i].TransDateTime.match(/\d+/)[0] * 1).toLocaleString();


                    template += '<tr>' +
                                '<td><label class="checkbox m-n i-checks"><input type="checkbox" name="post[]"><i></i></label></td>' +
                                '<td><span class="m-s">' + _.escape(trdate) + '</span>';

                    template += '</td><td colspan="2">' +
                                '<span class="thumb-sm"><img id="imgtran' + i + '" alt="John said" class="img-circle"></span><span class="m-s"> ' +
                                 tref + '</span></td>' +
                                dirTemplate +
                                '<td>';

                    if (transactions[i].Confirmations < 6) {
                        template += '<div class="bcconf"><div class="btn btn-warning btn-icon btn-rounded"><i class="fa fa-clock-o">' + _.escape(transactions[i].Confirmations) + '</i></div></div>';
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
                    popcontent += _.escape(trdate);
                    popcontent += '</p>';

                    popcontent += '<p><strong>TransactionId</strong></p>';
                    popcontent += '<p><a target="_new" href="https://btc.blockr.io/tx/info/' + transactions[i].TransactionId + '">';
                    popcontent += _.escape(transactions[i].TransactionId);
                    popcontent += '</a></p>';

                    popcontent += '<p><strong>Address:</strong> ';
                    popcontent += _.escape(transactions[i].Address);
                    popcontent += '</p>';

                    popcontent += '<p><strong>Amount:</strong> ';
                    popcontent += _.escape(convertFromSatoshis(transactions[i].Amount, COINUNIT)) + ' ';
                    popcontent += _.escape(COINUNIT) + '</p>';

                    popcontent += '<p><strong>Send/Receive:</strong> ';
                    popcontent += _.escape(transactions[i].TransType);
                    popcontent += '</p>';

                    $("#btnpop" + i).popover({
                        placement: 'left', // top, bottom, left or right
                        title: 'Transaction Details<button type="button" class="close pull-right" data-dismiss="popover"><i class="i i-cross2"></i></button>',
                        html: 'true',
                        content: '<div>' + popcontent + '</div>'
                    });

                    var length = transactions[i].UserName.length;
                    if (length > 20) {
                        length = 20;
                    }

                    var imageSrcSmall = "images/avatar/64px/Avatar-" + pad(length) + ".png";

                    if (transactions[i].UserName != 'External') {
                        if (FRIENDSLIST[transactions[i].UserName].profileImage != '') {
                            imageSrcSmall = "https://ninkip2p.imgix.net/" + _.escape(FRIENDSLIST[transactions[i].UserName].profileImage) + "?crop=faces&fit=crop&h=64&w=64&mask=ellipse&border=1,d0d0d0";
                        }
                    }
                    if (Engine.Device.isChromeApp()) {
                        var xhrsm = new XMLHttpRequest();
                        xhrsm.open('GET', imageSrcSmall, true);
                        xhrsm.responseType = 'blob';
                        xhrsm.index = i;
                        xhrsm.onload = function (e) {
                            $("#tbltran #imgtran" + this.index).attr("src", window.URL.createObjectURL(this.response));
                        };
                        xhrsm.send();
                    } else {
                        $("#tbltran #imgtran" + i).attr("src", imageSrcSmall);
                    }


                }

            }

            if (callback) {
                callback();
            }

        });

    }




    function generateAddressClient() {



        Engine.createAddress('m/0/0', 1, function (err, newAddress, path) {

            var options = { text: newAddress, width: 172, height: 172 };

            $('#requestaddressqr').text('');
            $('#requestaddressqr').qrcode(options);

            $('#requestaddresstxt').text(newAddress);

            //$('#requestaddress').text(tempate);
            $('#requestaddress').show();


        });

    }


    function sendMoney(friend, index) {

        $('#textMessageSend').removeClass('alert alert-danger');

        if (friend == null) {
            return;
        }

        var amount = $('#hdfriendAmount').val();
        amount = convertToSatoshis(amount, COINUNIT);

        var twoFactorCode = $('#txtFriendSend2FA').val();

        var allok = true;
        if (amount > 0) {
            $('input#friendAmount').css("border-color", "#ccc");
        } else {
            $('input#friendAmount').css("border-color", "#ffaaaa");
            allok = false;
        }


        Engine.get2faOverride(amount, function (err, result) {

            if (result == "") {

                if (twoFactorCode.length == 6) {
                    $('input#txtSendTwoFactor').css("border-color", "#ccc");
                } else {
                    $('input#txtSendTwoFactor').css("border-color", "#ffaaaa");
                    allok = false;
                }
            } else {

                twoFactorCode = result;

            }

            if (allok) {

                $('input#friendAmount').css("border-color", "#ccc");
                $('#textMessageSend').text('Creating transaction...');
                $('#textMessageSend').show();
                $('#sendfriendprogstatus').width('3%');
                $('#sendfriendprog').show();
                $('#sendfriendprogstatus').width('10%');
                Engine.sendTransaction('friend', friend, '', amount, twoFactorCode, function (err, transactionid) {

                    if (!err) {
                        updateBalance();
                        $('#textCompleteSendNet').text('You sent ' + convertFromSatoshis(amount, COINUNIT) + ' ' + COINUNIT + ' to ' + friend);
                        $('input#friendAmount').val('');



                        $("#sendnets2").hide();
                        $("#sendnets3").show();


                        //$('#textMessageSend').fadeOut(5000);
                        //$('#sendfriendprog').fadeOut(5000);

                    } else {
                        $('#textMessageSend').addClass('alert alert-danger');
                        $('#sendfriendprogstatus').width('0%');

                        if (transactionid == "ErrInsufficientFunds") {
                            $('#textMessageSend').text('Transaction Failed: Not enough funds are currently available to send this transaction');
                        } else if (result == 'ErrLocked') {
                            $('#textMessageSend').text('Transaction Failed: Account is unavailable');
                        } else {
                            $('#textMessageSend').text(transactionid);
                        }


                    }
                    // alert(transactionid);
                }, function (message, progress) {

                    if (message) {
                        $('#textMessageSend').text(message);
                    }

                    if (progress) {
                        $('#sendfriendprogstatus').width(progress);
                    }

                });

            }

        });


    }


    function sendMoneyStd() {

        var amount = $('#hdamount').val();
        amount = convertToSatoshis(amount, COINUNIT);

        var address = $('input#toAddress').val();

        var twoFactorCode = $('#txtSendTwoFactor').val();

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

        Engine.get2faOverride(amount, function (err, result) {

            if (result == "") {

                if (twoFactorCode.length == 6) {
                    $('input#txtSendTwoFactor').css("border-color", "#ccc");
                } else {
                    $('input#txtSendTwoFactor').css("border-color", "#ffaaaa");
                    allok = false;
                }
            } else {

                twoFactorCode = result;

            }

            if (allok) {

                $('#textMessageSendStd').text('Creating transaction...');
                $('#textMessageSendStd').show();
                $('#sendstdprogstatus').width('3%');
                $('#sendstdprog').show();
                $('#sendstdprogstatus').width('10%');


                Engine.sendTransaction('standard', '', address, amount, twoFactorCode, function (err, transactionid) {

                    if (!err) {

                        var confmess = 'You sent ' + _.escape(convertFromSatoshis(amount, COINUNIT)) + ' ' + _.escape(COINUNIT) + ' to <span style="word-wrap:break-word;">' + _.escape(address) + '</span>';

                        $('#textCompleteSendStd').html(confmess);
                        $('input#amount').val('');
                        $('input#toAddress').val('');
                        //$('#textMessageSendStd').fadeOut(5000);
                        //$('#sendstdprog').fadeOut(5000);

                        $('#sendstds2').hide();
                        $('#sendstds3').show();

                    } else {

                        if (transactionid == "ErrInsufficientFunds") {
                            $('#textMessageSendStd').text('Transaction Failed: Not enough funds are currently available to send this transaction');
                        } else {
                            $('#textMessageSendStd').text(transactionid)
                        }

                        $('#sendstdprogstatus').width('0%');
                        $('#textMessageSendStd').addClass('alert alert-danger');
                    }
                }, function (message, progress) {

                    if (message) {
                        $('#textMessageSendStd').text(message);
                    }

                    if (progress) {
                        $('#sendstdprogstatus').width(progress);
                    }

                });
            }

        });


    }



    $("#btnaddfriend").click(function () {

        var username = $('input#friend').val();

        if (username.length == 0 || Engine.m_nickname == username) {
            $("#friend").css("border-color", "#ffaaaa");

            return;
        }
        $("#btnaddfriend").prop('disabled', true);
        $("#imgaddcontactwaiting").show();

        var target = document.getElementById('imgaddcontactwaiting');
        var spinner = new Spinner(spinneropts).spin(target);


        //verify input and if username exists
        $("#addcontactalert").hide();


        //merge these functions

        Engine.doesUsernameExist(username, function (err, usernameExistsOnServer) {

            //also check if friend already

            if (!err) {

                if (usernameExistsOnServer) {

                    Engine.isNetworkExist(username, function (err, result) {


                        if (!err) {

                            if (!result) {

                                $("#friend").css("border-color", "#ccc");

                                Engine.createFriend(username, '', function (err, result) {
                                    if (err) {
                                        $("#friend").css("border-color", "#ffaaaa");
                                        $("#addcontactalert").show();
                                        $("#addcontactalertmessage").text(result);
                                        $("#imgaddcontactwaiting").hide();

                                    } else {

                                        $("#friend").val('');
                                        $("#imgaddcontactwaiting").hide();
                                        $("#addcontactsuccess").show();
                                        $("#addcontactsuccessmessage").text("You requested " + username + " as a contact");
                                        $("#addcontactsuccess").fadeOut(5000);

                                        updateRequestsMadeByMe();
                                    }

                                    $("#btnaddfriend").prop('disabled', false);

                                });

                            } else {

                                $("#friend").css("border-color", "#ffaaaa");
                                $("#addcontactalert").show();
                                $("#addcontactalertmessage").text("You have already requested " + username + " as a contact");
                                $("#imgaddcontactwaiting").hide();

                                $("#btnaddfriend").prop('disabled', false);
                            }

                        } else {

                            $("#friend").css("border-color", "#ffaaaa");
                            $("#addcontactalert").show();
                            $("#addcontactalertmessage").text(result);
                            $("#imgaddcontactwaiting").hide();
                            $("#btnaddfriend").prop('disabled', false);

                        }
                    });

                } else {

                    $("#friend").css("border-color", "#ffaaaa");
                    $("#addcontactalert").show();
                    $("#addcontactalertmessage").text("The username could not be found");
                    $("#imgaddcontactwaiting").hide();
                    $("#btnaddfriend").prop('disabled', false);

                }

            } else {

                $("#friend").css("border-color", "#ffaaaa");
                $("#addcontactalert").show();
                $("#addcontactalertmessage").text("The username could not be found");
                $("#imgaddcontactwaiting").hide();
                $("#btnaddfriend").prop('disabled', false);

            }
        });


    });


    function rejectFriend(username, callback) {

        Engine.rejectFriendRequest(username, function (err, result) {

            return callback(err, result);

        });
    }

    function acceptFriend(username, callback) {


        //need to add error handling and messages here

        Engine.acceptFriendRequest(username, function (err, secret) {

            if (err) {

                return callback(err, secret);

            } else {

                Engine.isNetworkExist(username, function (err, result) {

                    if (!result) {

                        Engine.createFriend(username, '', function (err, result) {

                            if (err) {

                                return callback(err, result);
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
