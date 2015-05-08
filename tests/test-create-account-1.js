var request = require('superagent');
var expect = require('expect.js');
var Engine = require('../src/ninki-engine');
var API = require('../src/ninki-api');
var speakeasy = require('speakeasy');
var bs = require('browser-storage');
var engine = new Engine();


var guid = engine.getguid();
var password = "12345678";
var username = guid.substring(0,7);
var emailAddress = guid + '@ninkip2p.com';
var FASecret = '';

bs.setItem('testguid', guid);

describe('Account Utilities', function () {

    describe('doesUsernameExist', function () {

        it("username=testnet", function (done) {
            engine.doesUsernameExist("testnet", function (err, res) {
                expect(res).to.equal(true);
                done();
            });
        });

        it("username=xyxyxyxy", function (done) {
            engine.doesUsernameExist("xyxyxyxy", function (err, res) {
                expect(res).to.equal(false);
                done();
            });
        });

    });

    describe('doesAccountExist', function () {
        it("username=testnet,emailAddress=testnet@ninkip2p.com", function (done) {
            API.doesAccountExist("testnet", "testnet@ninkip2p.com", function (err, accExists) {

                expect(accExists.UserExists).to.equal(true);
                expect(accExists.EmailExists).to.equal(true);
                done();

            });
        });
        it("username=gobxysgydu,emailAddress=ojihygjgrj@ninkip2p.com", function (done) {
            API.doesAccountExist("gobxysgydu", "ojihygjgrj@ninkip2p.com", function (err, accExists) {

                expect(accExists.UserExists).to.equal(false);
                expect(accExists.EmailExists).to.equal(false);
                done();

            });
        });

        it("username=gobxysgydu,emailAddress=testnet@ninkip2p.com", function (done) {
            API.doesAccountExist("gobxysgydu", "testnet@ninkip2p.com", function (err, accExists) {

                expect(accExists.UserExists).to.equal(false);
                expect(accExists.EmailExists).to.equal(true);
                done();

            });
        });

        it("username=testnet,emailAddress=ojihygjgrj@ninkip2p.com", function (done) {
            API.doesAccountExist("testnet", "ojihygjgrj@ninkip2p.com", function (err, accExists) {

                expect(accExists.UserExists).to.equal(true);
                expect(accExists.EmailExists).to.equal(false);
                done();

            });
        });

    });


    describe('Create Account Function', function () {


        describe('createWallet', function () {

            this.timeout(10000);

            it("Creates a new account", function (done) {


                engine.createWallet(guid, password, username, emailAddress, function (err, result) {


                    expect(err).to.equal(false);
                    expect(result.wallet).to.exist;


                    engine.getTwoFactorImg(function (err, twoFASecret) {


                        FASecret = twoFASecret;

                        bs.setItem('tfasec', twoFASecret);

                        console.log(twoFASecret);

                        expect(err).to.equal(false);
                        expect(twoFASecret).to.exist;

                        //generate an opt code from the secret
                        var twoFactorCode = speakeasy.totp({ key: twoFASecret, encoding: 'base32' });


                        bs["tfasec"] = twoFASecret;

                        console.log(twoFactorCode);

                        engine.SetupTwoFactor(twoFactorCode, function (err, result) {

                            console.log(result);

                            expect(err).to.equal(false);
                            expect(result).to.exist;

                            var token = "test";

                            console.log("calling getEmailValidation");

                            engine.getEmailValidation(token, function (err, response) {

                                console.log(response);

                                expect(err).to.equal(true);
                                expect(response).to.exist;

                                done();

                            });



                        });


                    });


                }, function (progress) {


                });

            });

        });

    });

});


guid = bs.getItem("testguid");
var password = "12345678";
FASecret = bs.getItem("tfasec");

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

        describe('createAddress', function () {

            this.timeout(5000);

            it("Creates a receive address", function (done) {

                engine.createAddress('m/0/0', 1, function (err, newAddress, path) {


                    console.log("Send 2* 0.01 Testnet coins to :" + newAddress);

                    expect(err).to.equal(false);
                    expect(newAddress).to.exist;
                    expect(path).to.exist;

                    done();



                });

            });

        });


    });


});
