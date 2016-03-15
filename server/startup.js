Meteor.startup(function() {
	// how to get mail_url using mailgun.com: https://themeteorchef.com/snippets/using-the-email-package/
	process.env.MAIL_URL = keys.mail_url; // from keys.js - not uploaded to github
	Accounts.urls.resetPassword = function(token) {
		// reset password url more convenient for iron router
    	return Meteor.absoluteUrl('reset-password/' + token);
	};
	Accounts.urls.verifyEmail = function(token) {
    	return Meteor.absoluteUrl('verify-email/' + token);
	};

	// how to get the keys for services: http://meteor.hromnik.com/blog/login-with-facebook-twitter-and-google-in-meteor
	// first, remove configuration entry in case service is already configured
	Accounts.loginServiceConfiguration.remove({
	  service: "twitter"
	});
	Accounts.loginServiceConfiguration.insert({
	  service: "twitter",
	  consumerKey: keys.twitter.consumerKey,
	  secret: keys.twitter.secret
	});

	// first, remove configuration entry in case service is already configured
	Accounts.loginServiceConfiguration.remove({
	  service: "facebook"
	});
	Accounts.loginServiceConfiguration.insert({
	  service: "facebook",
	  appId: keys.facebook.appId,
	  secret: keys.facebook.secret
	});


    //https://console.developers.google.com/apis/credentials?project=meteorchallenge
	Accounts.loginServiceConfiguration.remove({
	  service: "google"
	});
	Accounts.loginServiceConfiguration.insert({
	  service: "google",
	  clientId: keys.google.clientId,
	  secret: keys.google.secret
	});


	// https://github.com/settings/applications
	Accounts.loginServiceConfiguration.remove({
	  service: "github"
	});
	Accounts.loginServiceConfiguration.insert({
	  service: "github",
	  clientId: keys.github.clientId,
	  secret: keys.github.secret
	});

	// make myself admin :)
	var admin = Meteor.users.findOne({"emails.0.address":"kaizenchallenge@catness.org"});
 	if (admin) {
		console.log("granting admin to " + admin._id);
		Roles.addUsersToRoles( admin._id, ["admin"]);
		Meteor.users.update({_id:admin._id},{$set:{hidden:true}});
	}

	var admin = Meteor.users.findOne({"emails.0.address":"pathfinderjourney@gmail.com"});
 	if (admin) {
		console.log("granting admin to " + admin._id);
		Roles.addUsersToRoles( admin._id, ["admin"]);
		Meteor.users.update({_id:admin._id},{$set:{hidden:true}});
	}

	Tasks._ensureIndex({userid:1});
	Tasks._ensureIndex({"challenges.challenge":1});
	// convert old db to the new format (needed only once)
	migration();

	console.log("ROOT_URL = " + process.env.ROOT_URL); 


});