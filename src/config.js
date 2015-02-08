"use strict";
var config = {
	walletSecurity:{
		minimumPasswordLength:5, //Bi-directional encryption
		minimumPassphraseLength:10, //Public key encryption
		rsaKeyBitLength:512
	},
	thisServer:{
		protocol:"https",
		hostname:"localhost",
		port:"1111",
		basePath:""
	}
};

config.thisServer.baseUrl=config.thisServer.protocol+'://'+
	config.thisServer.hostname+':'+config.thisServer.port+
	config.thisServer.basePath;

