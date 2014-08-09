var jQuery = require('jquery-browserify');
var $ = require('jquery-browserify');
var common = require('./common');
var config = require('./config');


function API() {


}

//Implementing the GET and POST JQuery functions in a Node style.

var CSRF_HEADER = 'X-CSRF-Token';

var setCSRFToken = function (securityToken) {
    jQuery.ajaxPrefilter(function (options, _, xhr) {
        if (!xhr.crossDomain)
            xhr.setRequestHeader(CSRF_HEADER, securityToken);
    });
};

setCSRFToken($('meta[name="token"]').attr('content'));

API.get = function (url, querydata, callback) {
    return this.get(url, querydata, callback);
}

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
}

function lpost(url, postData, callback) {

    $.ajax({
        url: url,
        type: "POST",
        data: JSON.stringify(postData),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jdata = JSON.parse(data);
            if (jdata.error) {
                return callback(true, jdata.message);
            }
            if (!(typeof jdata.message === "undefined")) {
                return callback(false, jdata.message);
            }
            return callback(false, data);
        },
        fail: function (data, textStatus) {
            return callback(true, {
                textStatus: textStatus,
                data: data
            });
        },
        error: function (data) {

            console.log(data);
            if (data.status == 403) {
                //session has been lost
                location.reload();
            }
            return callback(true, data.responseText);
        }
    });
}


API.emailGUID = function (userName, callback) {

    API.post("/api/1/emailguid", {
        userName: userName
    }, function (err, response) {

        callback(err, response);

    });

}



//function getMasterPublicKeyFromUpstreamServer
//calls the server to generate the Ninki wallet keypair
//the user token and Ninki public key are returned
API.getMasterPublicKeyFromUpstreamServer = function (guid, callback) {


    var postData = { guid: guid };
    return lpost("/api/1/u/createaccount", postData, function (err, response) {

        if (err) {
            return callback(err, response);
        } else {

            var responseBody = JSON.parse(response);
            var userToken = responseBody.UserToken;
            var ninkiKey = responseBody.NinkiMasterPublicKey;

            if (!responseBody.UserToken) {
                return callback(true, "ErrMasterKeyJSON");
            } else {
                return callback(null, ninkiKey, userToken);
            }
        }
    });
}

//function doesUsernameExist
//verifies that the requested username does not already exist on our database
API.doesUsernameExist = function (username, callback) {

    var postData = { username: username };

    lpost("/api/1/u/doesusernameexist", postData, function (err, response) {
        if (err) {
            return callback(err, response);
        } else {
            return callback(null, JSON.parse(response));
        }
    });
}


API.sendWelcomeDetails = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };

    lpost("/api/1/sendwelcomedetails", postData, function (err, response) {
        return callback(err, response);
    });
}


API.getEmailValidation = function (guid, sharedid, token, callback) {


    API.post("/api/1/getemailvalidation", {
        guid: guid,
        sharedid: sharedid,
        token: token
    }, function (err, response) {

        callback(err, response);

    });

}




API.getWalletFromServer = function (guid, twoFactorCode, callback) {

    var postData = { guid: guid, twoFactorCode: twoFactorCode };
    return lpost("/api/1/u/getaccountdetails", postData, function (err, dataStr) {

        if (err) {
            return callback(err, dataStr);
        } else {
            var data = JSON.parse(dataStr);
            return callback(err, data);
        }
    });
}


//function getBalance gets the summary balance for all the account's  outputs
API.getBalance = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getbalance", postData, function (err, dataStr) {
        if (err) {
            return callback(err, dataStr);
        } else {
            var data = JSON.parse(dataStr);
            return callback(err, data);
        }
    });
}


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
}

API.updateusernetworkcategory = function (guid, sharedid, username, category, callback) {
    var postData = { guid: guid, sharedid: sharedid, username: username, category: category };
    return lpost("/api/1/updateusernetworkcategory", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
}



//function getBalance gets the unconfirmed summary balance for all the account's  outputs
API.getUnconfirmedBalance = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getunconfirmedbalance", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
}


//gets the username associated with the wallet
API.getNickname = function (guid, sharedid, callback) {
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getnickname", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
}

//function returns all outputs unspent by the wallet
API.getUnspentOutputs = function (guid, callback) {

    var postData = { guid: guid };
    return lpost("/api/1/u/getunspentoutputs", postData, function (err, response) {
        var data1 = response;
        var data2 = JSON.parse(data1);
        return callback(err, data2.Message);
    });
}


API.getPendingUserRequests = function (guid, sharedid, callback) {

    //these are requests made by me to other people
    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getpendinguserrequests", postData, function (err, data) {
        var friends = JSON.parse(data);

        return callback(err, friends);
    });
}

API.getFriendRequests = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getfriendrequests", postData, function (err, dataStr) {
        var jdata = JSON.parse(dataStr);
        return callback(err, jdata);
    });
}

API.getUserPacket = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };
    return lpost("/api/1/u/getuserpacket", postData, function (err, dataStr) {
        var jdata = JSON.parse(dataStr);
        return callback(err, jdata);
    });
}

API.isNetworkExist = function (guid, sharedid, username, callback) {
    var postData = { guid: guid, sharedid: sharedid, username: username };
    lpost("/api/1/u/doesnetworkexist", postData, function (err, result) {
        var exists = JSON.parse(result);
        return callback(err, exists);

    });

}

API.rejectFriendRequest = function (guid, sharedid, username, callback) {
    var postData = { guid: guid, sharedid: sharedid, username: username };
    lpost("/api/1/u/rejectfriend", params, function (err, result) {
        return callback(err, result);
    });
}

API.getTransactionRecords = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };

    lpost("/api/1/u/gettransactionrecords", postData, function (err, transactions) {

        var jtran = JSON.parse(transactions);

        return callback(err, jtran);

    });

}

API.getInvoiceList = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };

    lpost("/api/1/u/getinvoicestopay", postData, function (err, invoices) {

        var jtran = JSON.parse(invoices);

        return callback(err, jtran);

    });

}

API.getInvoiceByUserList = function (guid, sharedid, callback) {

    var postData = { guid: guid, sharedid: sharedid };

    lpost("/api/1/u/getinvoicesbyuser", postData, function (err, invoices) {

        var jtran = JSON.parse(invoices);

        return callback(err, jtran);

    });

}

API.updateInvoice = function (guid, sharedid, username, invoiceId, transactionId, status, callback) {
    var postData = { guid: guid, sharedid: sharedid, userName: username, invoiceId: invoiceId, transactionId: transactionId, status: status };
    return lpost("/api/1/u/updateinvoice", postData, function (err, dataStr) {
        return callback(err, dataStr);
    });
}

module.exports = API

