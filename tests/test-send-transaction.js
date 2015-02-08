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

                        expect(err).to.equal(false);
                        expect(result).to.exist;

                        done();

                    });


                });

            });

        });

    });


    describe('User Functions', function () {

        describe('sendTransaction', function () {

            this.timeout(5000);

            it("Sends transaction to address amount > sum(outputs)-miners fee", function (done) {

                var twoFactorCode = speakeasy.totp({ key: FASecret, encoding: 'base32' });

                engine.sendTransaction("standard", "", "mkLqdjeJy5iQDyzFHESNYdb25c5ePLJqgM", 200000, twoFactorCode, function (err, transactionid) {

                    console.log(transactionid);

                    expect(err).to.equal(true);
                    expect(transactionid).to.equal("ErrInsufficientFunds");

                    done();

                },

                function (status, progress) {

                    console.log(progress);

                });

            });

        });

        describe('sendTransaction', function () {

            this.timeout(20000);

            it("Sends transaction to address amount <= sum(outputs)-miners fee", function (done) {

                var twoFactorCode = speakeasy.totp({ key: FASecret, encoding: 'base32' });

                engine.sendTransaction("standard", "", "mkLqdjeJy5iQDyzFHESNYdb25c5ePLJqgM", 70000, twoFactorCode, function (err, transactionid) {

                    console.log(transactionid);

                    expect(err).to.equal(false);
                    expect(transactionid).to.exist;

                    done();

                },

                function (status, progress) {

                    console.log(progress);

                });

            });

        });


    });


});
