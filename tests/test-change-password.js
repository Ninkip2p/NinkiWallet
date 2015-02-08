var request = require('superagent');
var expect = require('expect.js');
var Engine = require('../src/ninki-engine');
var API = require('../src/ninki-api');
var speakeasy = require('speakeasy');
var bs = require('browser-storage');

var engine = new Engine();

var guid = bs.getItem("testguid");
var password = "12345678";
var FASecret = bs.getItem("tfasec");

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

                        bs.setItem('fp' + guid, engine.m_fingerprint);

                        expect(err).to.equal(false);
                        expect(result).to.exist;

                        done();

                    });


                });

            });

        });

    });

    describe('User Functions', function () {

        describe('Change Password', function () {

            this.timeout(10000);

            it("Changes the user's password", function (done) {

                var twoFactorCode = speakeasy.totp({ key: FASecret, encoding: 'base32' });


                engine.ChangePassword(twoFactorCode, password, "123456789", function (err, result) {


                    expect(err).to.equal(false);
                    expect(result).to.exist;
                    //console.log(result);

                    engine.ChangePassword(twoFactorCode, password, "12345678", function (err, result) {


                        expect(err).to.equal(false);
                        expect(result).to.exist;
                        //console.log(result);

                        done();


                    }, function (message, progress) {


                        console.log(message + '(' + progress + ')');


                    });


                }, function (message, progress) {


                    console.log(message + '(' + progress + ')');


                });

            });

        });


    });


});
