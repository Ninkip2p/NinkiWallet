var request = require('superagent');
var expect = require('expect.js');
var Engine = require('../src/ninki-engine');
var API = require('../src/ninki-api');
var BIP39 = require('../src/bip39.js');
var speakeasy = require('speakeasy');
var bs = require('browser-storage');

var engine = new Engine();

var guid = bs.getItem("testguid2");
var guid2 = bs.getItem("testguid");

var phrase = bs.getItem("fp" + guid2);


var username2 = guid2.substring(0, 7);

var password = "12345678";
var FASecret = bs.getItem("tfasec2");

console.log(guid);
console.log(FASecret);


describe('Account Utilities', function () {


    describe('Login Functions', function () {


        describe('openWallet', function () {


            this.timeout(10000);

            it("Verifies the users login details", function (done) {


                engine.setPass(password, guid);


                console.log(guid);

                engine.openWallet(guid, "", function (err, result) {


                    console.log(result);

                    expect(err).to.equal(false);
                    expect(result).to.exist;

                    var twoFactorCode = speakeasy.totp({ key: FASecret, encoding: 'base32' });

                    console.log(twoFactorCode);

                    console.log("calling openWallet2fa");


                    engine.openWallet2fa(twoFactorCode, true, function (err, result) {

                        console.log(result);

                        expect(err).to.equal(false);
                        expect(result).to.exist;

                        done();

                    });


                });

            });

        });

    });


    describe('User Functions', function () {

        describe('accept contact request', function () {

            this.timeout(5000);

            it("Adds a contact", function (done) {

                console.log(username2);

                engine.acceptFriendRequest(username2, function (err, result) {

                    console.log(result);

                    var bip39 = new BIP39();
                    var code = bip39.mnemonicToHex(phrase);

                    engine.verifyFriendData(username2, code, function (err, result) {

                        engine.isNetworkExist(username2, function (err, result) {

                            console.log(result);

                            if (!result) {

                                engine.createFriend(username2, '', function (err, result) {

                                    expect(err).to.equal(false);
                                    expect(result).to.exist;

                                    done();


                                });

                            }

                        });


                    });

                });

            });

        });


    });


});
