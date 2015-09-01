var sanitizer = require('sanitizer');
var common = require('./common');
var config = require('./config');
//var localStorage = require('browser-storage');
var crypto = require('crypto');



function API() {


}

var apiToken = "";

API.registerToken = function registerToken(token) {

    apiToken = token;

}


API.get = function (url, querydata, callback) {
    return this.get(url, querydata, callback);
};


function get(url, querydata, callback) {

    $.get(url, querydata, function (data) {
        return callback(null, data);

    }).fail(function (data, textStatus) {

        return callback(true, {
            textStatus: textStatus,
            data: data
        });
    });
}


API.post = function (url, postData, callback) {
    return lpost(url, postData, callback);
};

function lpost(url, postData, callback) {

    if (typeof window === 'undefined') { // Running in NodeJS

        var tunnel = require('tunnel');
        var querystring = require('querystring');

        var tunnelingAgent = tunnel.httpsOverHttp({
            proxy: {
                host: '',
                port: ''
            }
        });


    }

    if (typeof window === 'undefined') {

        //call node
        var data = querystring.stringify(postData);

        var https = require('https');

        var options = {
            host: 'testnet.ninkip2p.com',
            port: 443,
            //agent: tunnelingAgent,
            path: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(data),
                'api-token': apiToken
            }
        };

        var req = https.request(options, function (res) {

            var body = '';


            res.on('data', function (chunk) {

                body += chunk;

            });

            res.on('end', function () {

                body = sanitizer.sanitize(body);

                //console.log(body)
                try {
                    body = JSON.parse(body);
                    body = JSON.parse(body);
                } catch (err) {
                    console.log(err)
                }

                if ((typeof body === "string")) {
                    return callback(true, body);
                }


                if (body.error) {
                    return callback(true, body.message);
                }
                if (!(typeof body.message === "undefined")) {
                    return callback(false, body.message);
                }

                return callback(false, JSON.stringify(body));


            });

            req.on('error', function (e) {

                console.log('problem with request: ' + e.message);

            });

        });

        req.write(data);

        req.end();

    } else {

        $.ajax({
            url: "https://api.ninkip2p.com" + url,
            type: "POST",
            timeout: 10000,
            data: JSON.stringify(postData),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            headers: { 'api-token': apiToken },
            success: function (data) {

                data = sanitizer.sanitize(data);

                var jdata = JSON.parse(data);

                if (jdata.error) {
                    return callback(true, jdata.message);
                }
                if (!(typeof jdata.message === "undefined")) {

                    return callback(false, jdata.message);

                }

                return callback(false, JSON.stringify(jdata));
            },
            fail: function (data, textStatus) {

                data = sanitizer.sanitize(data);
                textStatus = sanitizer.sanitize(textStatus);

                return callback(true, {
                    textStatus: textStatus,
                    data: data
                });
            },
            error: function (data) {

                if (data.statusText == "timeout") {

                    return callback(true, "Could not connect to the Ninki server. Please try again. If the problem persists email support@ninkip2p.com.");

                }


                if (data.status == 0) {

                    return callback(true, "Could not connect to the network. Please check that you are connected to the internet.");

                }

                if (data.status == 403) {
                    //session has been lost

                } else if (data.status == 401) {

                    if (!window.cordova) {
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
                            //location.reload();
                        }
                    } else {
                        return callback(true, sanitizer.sanitize(data.statusText));
                    }


                } else {

                    data.responseText = sanitizer.sanitize(data.responseText);

                    return callback(true, data.responseText);
                }


            }
        });

    }
}


API.emailGUID = function (userName, callback) {

    API.post("/api/1/emailguid", {
        userName: userName
    }, function (err, response) {

        callback(err, response);

    });

};



//function getMasterPublicKeyFromUpstreamServer
//calls the server to generate the Ninki wallet keypair
//the user token and Ninki public key are returned
API.getMasterPublicKeyFromUpstreamServer = function (guid, callback) {


    var postData = { guid: guid };
    return lpost("/api/2/u/createaccount", postData, function (err, response) {

        if (err) {
            return callback(err, response);
        } else {

            var responseBody = JSON.parse(response);
            var userToken = responseBody.UserToken;
            var ninkiKey = responseBody.NinkiMasterPublicKey;
            var secret = responseBody.Secret;

            if (!responseBody.UserToken) {
                return callback(true, "ErrMasterKeyJSON");
            } else {
                return callback(null, ninkiKey, userToken, secret);
            }
        }
    });
};





//function doesUsernameExist
//verifies that the requested username does not already exist on our database
API.doesAccountExist = function (username, email, callback) {

    var postData = { username: username, email: email };

    lpost("/api/1/u/doesaccountexist", postData, function (err, response) {
        if (err) {
            return callback(err, response);
        } else {
            return callback(null, JSON.parse(response));
        }
    });
};


API.sendWelcomeDetails = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };

    lpost("/api/1/sendwelcomedetails", postData, function (err, response) {
        return callback(err, response);
    });
};


API.getEmailValidation = function (guid, sharedid, token, callback) {


    API.post("/api/1/getemailvalidation", {
        guid: guid,
        sharedid: sharedid,
        token: token
    }, function (err, response) {

        callback(err, response);

    });

};

API.getResetToken = function (guid, callback) {

    API.post("/api/1/u/getresettoken", {
        guid: guid
    }, function (err, response) {

        callback(err, response);
    });

};


API.validateSecret = function (guid, secret, callback) {

    var postData = { guid: guid, secret: secret };
    return lpost("/api/1/u/validatesecret", postData, function (err, dataStr) {

        if (err) {
            return callback(err, dataStr);
        } else {
            var data = JSON.parse(dataStr);
            return callback(err, data);
        }
    });
};

API.updateSecretPacket = function (guid, sharedid, vc, iv, callback) {

    var postData = { guid: guid, sharedid: sharedid, vc: vc, iv: iv };
    return lpost("/api/1/u/updatesecretpacket", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.unlockaccount = function (guid, token, callback) {

    var postData = { guid: guid, token: token };
    return lpost("/api/1/u/unlockaccount", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};


API.getWalletFromServer = function (guid, secret, twoFactorCode, rememberTwoFactor, callback) {

    var postData = { guid: guid, secret: secret, twoFactorCode: twoFactorCode, rememberTwoFactor: rememberTwoFactor };
    return lpost("/api/1/u/getaccountdetails", postData, function (err, dataStr) {

        if (err) {
            return callback(err, dataStr);
        } else {
            var data = JSON.parse(dataStr);

            apiToken = data.SessionToken;

            return callback(err, data);
        }
    });
};


//function getBalance gets the summary balance for all the account's  outputs
API.getBalance = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/2/u/getbalance", postData, function (err, dataStr) {
        if (err) {
            return callback(err, dataStr);
        } else {
            var data = JSON.parse(dataStr);
            return callback(err, data);
        }
    });
};


//function getBalance gets the summary balance for all the account's  outputs
API.getusernetworkcategory = function (callback) {

    var postData = {};
    return lpost("/api/1/getusernetworkcategory", postData, function (err, dataStr) {
        if (err) {
            return callback(err, dataStr);
        } else {
            var data = JSON.parse(dataStr);
            return callback(err, data);
        }
    });
};

API.updateusernetworkcategory = function (guid, sharedid, username, category, callback) {
    var postData = { guid: guid, sharedid: sharedid, username: username, category: category };
    return lpost("/api/1/updateusernetworkcategory", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};



//function getBalance gets the unconfirmed summary balance for all the account's  outputs
API.getUnconfirmedBalance = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getunconfirmedbalance", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

//function for increased performance on login
API.getAccountData = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getaccountdata", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getUserData = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getuserdata", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};


//gets the username associated with the wallet
API.getNickname = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getnickname", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getUserProfile = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getuserprofile", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.updateUserProfile = function (guid, sharedid, profileImage, status, tax, callback) {
    var postData = { guid: guid, sharedid: sharedid, profileImage: profileImage, status: status, tax: tax };
    return lpost("/api/1/u/updateuserprofile", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};


//function returns all outputs unspent by the wallet
API.getUnspentOutputs = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getunspentoutputs", postData, function (err, response) {
        if (!err) {
            var data = JSON.parse(response);
            return callback(err, data.Message);
        } else {
            return callback(err, response);
        }
    });
};


///

//function returns all outputs unspent by the wallet
API.getTransactionTemplate = function (guid, sharedid, transactionid, callback) {

    var postData = { guid: guid, sharedid: sharedid, transactionid: transactionid };
    return lpost("/api/1/u/gettransactiontemplate", postData, function (err, response) {
        if (!err) {
            var data = JSON.parse(response);
            return callback(err, data);
        } else {
            return callback(err, response);
        }
    });
};


//function returns all outputs unspent by the wallet
API.getCoinProfile = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getcoinprofile", postData, function (err, response) {
        if (!err) {
            var data = JSON.parse(response);
            return callback(err, data);
        } else {
            return callback(err, response);
        }
    });
};

API.getPrice = function (guid, ccy, callback) {

    var postData = { guid: guid, ccy: ccy };
    return lpost("/api/1/u/getprice", postData, function (err, response) {
        if (!err) {
            var data = JSON.parse(response);
            return callback(err, data);
        } else {
            return callback(err, response);
        }
    });
};

API.getPendingUserRequests = function (guid, sharedid, callback) {

    //these are requests made by me to other people
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getpendinguserrequests", postData, function (err, data) {
        if (!err) {
            var friends = JSON.parse(data);
            return callback(err, friends);
        } else {
            return callback(err, data);
        }
    });
};

API.getFriendRequests = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getfriendrequests", postData, function (err, dataStr) {
        if (!err) {
            var jdata = JSON.parse(dataStr);
            return callback(err, jdata);
        } else {
            return callback(err, dataStr);
        }
    });
};

API.getUserPacket = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getuserpacket", postData, function (err, dataStr) {
        if (!err) {
            var jdata = JSON.parse(dataStr);
            return callback(err, jdata);
        } else {
            return callback(err, dataStr);
        }
    });
};

API.isNetworkExist = function (guid, sharedid, username, callback) {
    var postData = { guid: guid, sharedid: sharedid, username: username };
    lpost("/api/1/u/doesnetworkexist", postData, function (err, result) {
        if (!err) {
            var exists = JSON.parse(result);
            return callback(err, exists);
        } else {
            return callback(err, result);
        }
    });

};

API.rejectFriendRequest = function (guid, sharedid, username, callback) {
    var postData = { guid: guid, sharedid: sharedid, username: username };
    lpost("/api/1/u/rejectfriend", postData, function (err, result) {
        return callback(err, result);
    });
};

API.getTransactionRecords = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };

    lpost("/api/1/u/gettransactionrecords", postData, function (err, transactions) {

        if (!err) {
            var jtran = JSON.parse(transactions);
            return callback(err, jtran);
        } else {
            return callback(err, transactions);
        }

    });

};

API.getTransactionFeed = function (guid, sharedid, timestamp, lkey, tranPageFrom, tranPageTo, callback) {

    var postData = { guid: guid, sharedid: sharedid, timestamp: timestamp, lkey: lkey, tranPageFrom: tranPageFrom, tranPageTo: tranPageTo };

    lpost("/api/2/u/gettransactionfeed", postData, function (err, transactions) {

        if (!err) {
            var jtran = JSON.parse(transactions);
            return callback(err, jtran);
        } else {
            return callback(err, transactions);
        }

    });

};

API.getTransactionsForNetwork = function (guid, sharedid, username, timestamp, lkey, tranPageFrom, tranPageTo, callback) {

    var postData = { guid: guid, sharedid: sharedid, username: username, timestamp: timestamp, lkey: lkey, tranPageFrom: tranPageFrom, tranPageTo: tranPageTo };

    lpost("/api/2/u/gettransactionsfornetwork", postData, function (err, transactions) {

        if (!err) {
            var jtran = JSON.parse(transactions);
            return callback(err, jtran);
        } else {
            return callback(err, transactions);
        }

    });

};


API.getTimeline = function (guid, sharedid, timestamp, lkey, tranPageFrom, tranPageTo, callback) {

    var postData = { guid: guid, sharedid: sharedid, timestamp: timestamp, lkey: lkey, tranPageFrom: tranPageFrom, tranPageTo: tranPageTo };

    lpost("/api/1/u/gettimeline", postData, function (err, timeline) {

        if (!err) {
            var jtran = JSON.parse(timeline);
            return callback(err, jtran);
        } else {
            return callback(err, timeline);
        }

    });

};

API.getInvoiceList = function (guid, sharedid, timestamp, lkey, pageFrom, pageTo, callback) {

    var postData = { guid: guid, sharedid: sharedid, timestamp: timestamp, lkey: lkey, pageFrom: pageFrom, pageTo: pageTo };

    lpost("/api/2/u/getinvoicestopay", postData, function (err, invoices) {

        if (!err) {
            var jtran = JSON.parse(invoices);
            return callback(err, jtran);
        } else {
            return callback(err, invoices);
        }

    });

};

API.getInvoicesToPayNetwork = function (guid, sharedid, username, timestamp, lkey, pageFrom, pageTo, callback) {

    var postData = { guid: guid, sharedid: sharedid, username: username, timestamp: timestamp, lkey: lkey, pageFrom: pageFrom, pageTo: pageTo };

    lpost("/api/2/u/getinvoicestopaynetwork", postData, function (err, invoices) {

        if (!err) {
            var jtran = JSON.parse(invoices);

            return callback(err, jtran);
        } else {
            return callback(err, invoices);
        }

    });

};


API.getInvoiceByUserList = function (guid, sharedid, timestamp, lkey, pageFrom, pageTo, callback) {

    var postData = { guid: guid, sharedid: sharedid, timestamp: timestamp, lkey: lkey, pageFrom: pageFrom, pageTo: pageTo };

    lpost("/api/2/u/getinvoicesbyuser", postData, function (err, invoices) {

        if (!err) {
            var jtran = JSON.parse(invoices);
            return callback(err, jtran);
        } else {
            return callback(err, invoices);
        }

    });

};


API.getInvoicesByUserNetwork = function (guid, sharedid, username, timestamp, lkey, pageFrom, pageTo, callback) {

    var postData = { guid: guid, sharedid: sharedid, username: username, timestamp: timestamp, lkey: lkey, pageFrom: pageFrom, pageTo: pageTo };

    lpost("/api/2/u/getinvoicesbyusernetwork", postData, function (err, invoices) {

        if (!err) {
            var jtran = JSON.parse(invoices);

            return callback(err, jtran);
        } else {
            return callback(err, invoices);
        }

    });

};



API.updateInvoice = function (guid, sharedid, username, invoiceId, transactionId, status, callback) {
    var postData = { guid: guid, sharedid: sharedid, userName: username, invoiceId: invoiceId, transactionId: transactionId, status: status };
    return lpost("/api/1/u/updateinvoice", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};


API.getMessagesByUserNetwork = function (guid, sharedid, username, timestamp, lkey, pageFrom, pageTo, callback) {

    var postData = { guid: guid, sharedid: sharedid, userName: username, timestamp: timestamp, lkey: lkey, pageFrom: pageFrom, pageTo: pageTo };

    lpost("/api/1/u/getmessagesbyusernetwork", postData, function (err, messages) {

        if (!err) {
            var jtran = JSON.parse(messages);
            return callback(err, jtran);
        } else {
            return callback(err, messages);
        }

    });

};


API.getVersion = function (callback) {
    var postData = {};
    return lpost("/api/1/u/getversion", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.registerDevice = function (guid, deviceName, deviceId, deviceModel, devicePIN, regToken, secret, callback) {
    var postData = { guid: guid, deviceName: deviceName, deviceId: deviceId, deviceModel: deviceModel, devicePIN: devicePIN, regToken: regToken, secret: secret };
    return lpost("/api/1/u/registerdevice", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getDeviceKey = function (guid, devicePIN, regToken, callback) {
    var postData = { guid: guid, devicePIN: devicePIN, regToken: regToken };
    return lpost("/api/2/u/getdevicekey", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.destroyDevice = function (guid, regToken, callback) {
    var postData = { guid: guid, regToken: regToken };
    return lpost("/api/1/u/destroydevice", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.destroyDevice2fa = function (guid, sharedid, deviceName, twoFactorCode, callback) {
    var postData = { guid: guid, sharedid: sharedid, deviceName: deviceName, twoFactorCode: twoFactorCode };
    return lpost("/api/1/u/destroydevice2fa", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};



API.createDevice = function (guid, sharedid, deviceName, callback) {
    var postData = { guid: guid, sharedid: sharedid, deviceName: deviceName };
    return lpost("/api/1/u/createdevice", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};


API.getDevices = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getdevices", postData, function (err, dataStr) {
        if (!err) {
            var jdevs = JSON.parse(dataStr);
            return callback(err, jdevs);
        } else {
            return callback(err, dataStr);
        }
    });
};

API.getDeviceToken = function (guid, sharedid, deviceName, twoFactorCode, callback) {
    var postData = { guid: guid, sharedid: sharedid, deviceName: deviceName, twoFactorCode: twoFactorCode };
    return lpost("/api/1/u/getdevicetoken", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getDeviceTokenRestore = function (guid, deviceName, secret, signaturecold, callback) {
    var postData = { guid: guid, deviceName: deviceName, secret: secret, signaturecold: signaturecold };
    return lpost("/api/1/u/getdevicetokenrestore", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};




API.getDeviceTokenForApp = function (guid, sharedid, deviceName, callback) {
    var postData = { guid: guid, sharedid: sharedid, deviceName: deviceName };
    return lpost("/api/1/u/getdevicetokenforapp", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};




API.getRecoveryPacket = function (guid, callback) {
    var postData = { guid: guid };
    return lpost("/api/1/getrecoverypacket", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getLimitStatus = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid};
    return lpost("/api/1/u/getlimitstatus", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.prepareTransaction = function (guid, sharedid, amount, callback) {
    var postData = { guid: guid, sharedid: sharedid, amount: amount };
    return lpost("/api/1/u/preparetransaction", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.createBackupCodes = function (guid, sharedid, twoFactorCode, callback) {
    var postData = { guid: guid, sharedid: sharedid, twoFactorCode: twoFactorCode };
    return lpost("/api/1/u/createbackupcodes", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};


API.updateEmailAddress = function (guid, sharedid, emailAddress, callback) {
    var postData = { guid: guid, sharedid: sharedid, emailAddress: emailAddress };
    return lpost("/api/1/u/updateemailaddress", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.resetTwoFactorAccount = function (guid, signaturecold, secret, callback) {
    var postData = { guid: guid, signaturecold: signaturecold, secret: secret };
    return lpost("/api/1/u/resettwofactoraccount", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getSigChallenge = function (guid, secret, callback) {
    var postData = { guid: guid, secret: secret };
    return lpost("/api/1/u/getsigchallenge", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};


API.createAccountSecPub = function (guid, sharedid, secretPub, callback) {
    var postData = { guid: guid, sharedid: sharedid, secretPub: secretPub };
    return lpost("/api/1/u/createaccountsecpub", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getAccountSecPub = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid};
    return lpost("/api/1/u/getaccountsecpub", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.removeAccountSecPub = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/removeaccountsecpub", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getGUIDByMPKH = function (mpkh, callback) {
    var postData = { mpkh: mpkh };
    return lpost("/api/1/getguidbympkh", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};


API.requestAuthMigration = function (guid, secret, authreqtoken, callback) {
    var postData = { guid: guid, secret: secret, authreqtoken: authreqtoken };
    return lpost("/api/1/u/requestauthmigration", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getAuthMigrationRequest = function (guid, secret, callback) {
    var postData = { guid: guid, secret: secret};
    return lpost("/api/1/u/getauthmigrationrequest", postData, function (err, dataStr) {

        if (!err) {
            var jtran = JSON.parse(dataStr);
            return callback(err, jtran);
        } else {
            return callback(err, dataStr);
        }

    });
};

API.authMigration = function (guid, sharedid, twoFactorToken, authreqtoken, callback) {
    var postData = { guid: guid, sharedid: sharedid, twoFactorToken: twoFactorToken, authreqtoken: authreqtoken };
    return lpost("/api/1/u/authmigration", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

///

API.getAuthMigrationToken = function (guid, secret, authreqtoken, callback) {
    var postData = { guid: guid, secret: secret, authreqtoken: authreqtoken };
    return lpost("/api/1/u/getauthmigrationtoken", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

API.getPriceHistory = function (callback) {
    var postData = {};
    return lpost("/api/1/u/getpricehistory", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
};

//



module.exports = API;
