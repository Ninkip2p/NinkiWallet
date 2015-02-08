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

        describe('getBalance', function () {

            this.timeout(5000);

            it("Get's users balance", function (done) {

                engine.getBalance(function (err, result) {

                    console.log(result.ConfirmedBalance);
                    console.log(result.UnconfirmedBalance);
                    console.log(result.TotalBalance);

                    expect(err).to.equal(false);

                    expect(result).to.exist;
                    expect(result.ConfirmedBalance).to.exist;
                    expect(result.UnconfirmedBalance).to.exist;
                    expect(result.TotalBalance).to.exist;

                    done();

                });

            });


            it("Get's users transactions", function (done) {

                engine.getTransactionRecords(function (err, transactions) {

                    console.log(transactions);

                    expect(err).to.equal(false);

                    expect(transactions).to.exist;


                    done();

                });

            });

        });


    });


});
