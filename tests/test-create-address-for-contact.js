var request = require('superagent');
var expect = require('expect.js');
var Engine = require('../src/ninki-engine');
var API = require('../src/ninki-api');
var speakeasy = require('speakeasy');
var bs = require('browser-storage');

var engine = new Engine();

var guid = bs.getItem("testguid");
var guid2 = bs.getItem("testguid2");
var password = "12345678";
var FASecret = bs.getItem("tfasec");

var username2 = guid2.substring(0, 7);

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

        describe('createAddressForContact', function () {

            this.timeout(5000);

            it("Creates a receive address for contact", function (done) {

                engine.createAddressForFriend(username2, function (err, newAddress) {


                    console.log("Send 2* 0.01 Testnet coins to :" + newAddress);

                    expect(err).to.equal(false);
                    expect(newAddress).to.exist;
                    done();



                });

            });

        });


    });


});
