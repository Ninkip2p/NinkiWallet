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

        describe('updateAccountSettings', function () {

            this.timeout(5000);

            it("updates account settings", function (done) {

                var jsonPacket = {
                    guid: Engine.m_guid
                };

                jsonPacket['DailyTransactionLimit'] = 10000000;
                jsonPacket['SingleTransactionLimit'] = 1000000;
                jsonPacket['NoOfTransactionsPerDay'] = 4;
                jsonPacket['NoOfTransactionsPerHour'] = 2;
                jsonPacket['Inactivity'] = 10;
                jsonPacket['MinersFee'] = 10000;
                jsonPacket['CoinUnit'] = "BTC";
                jsonPacket['Email'] = "isthislive@ninkip2p.com";
                jsonPacket['EmailNotification'] = true;
                jsonPacket['LocalCurrency'] = "USD"

                var twoFactorCode = speakeasy.totp({ key: FASecret, encoding: 'base32' });

                engine.updateAccountSettings(jsonPacket, twoFactorCode, function (err, res) {

                    console.log(res);

                    expect(err).to.equal(false);
                    expect(res).to.equal('ok');

                    done();


                });

            });

        });


    });


});
