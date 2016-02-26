// example how to update password in meteor mongo shell: 
// (get the known crypted password from somebody else's account)
// e.g. password=starwars
// db.users.update({username:"myusername"},{$set:{services:{password:{bcrypt:'$2a$10$528vwlE4dPQM.oxI/yBDv./geSmkbiMsPCHNaeZlzUNQ5G6QBfKZC'}}}});
// to access meteor production db:       meteor mongo blah.meteor.com

// settings for email
Accounts.emailTemplates.siteName = "Kaizen Challenge";
Accounts.emailTemplates.from = "Kaizen Challenge Admin <postmaster@sandbox.meteor.com>";
Accounts.emailTemplates.resetPassword.subject = function (user) {
    return "How to reset your password on " + Accounts.emailTemplates.siteName;
};
Accounts.emailTemplates.resetPassword.text = function (user, url) {
	return "Hello " + user.profile.name + ",\n\nTo reset your password on " 
	+ Accounts.emailTemplates.siteName 
	+ ", simply click the link below:\n\n" + url + "\n\nThanks.\n";
};



Accounts.onCreateUser(function(options, user) {
// the callback which is called on user creation
    if (options.profile) {
      user.profile = options.profile;
    }
    var username;
    // create a unique username
    if (user.services.password) username = user.username;
    else if (user.services.twitter) {
    	username = user.services.twitter.screenName;
    	user.profile.external = 'Twitter';  // add the name of external service because client can't access 'services' field, only profile
    }
    else if (user.services.facebook) {
    	username = user.services.facebook.name;
    	user.profile.external = 'Facebook';
    }
    else if (user.services.google) {
		username = user.services.google.name;
		user.profile.external = 'Google';
    }
    else if (user.services.github) {
    	username = user.services.github.username;
    	user.profile.external = 'Github';
    }

   	//console.log("Create username from " + username);
   	username = username.replace(/[^A-Za-z0-9_\-\.]/g,''); 

   	var newUsername = username;
    var exists = Accounts.findUserByUsername(username);
   	var count = 1;
   	while(exists) {
   		var newUsername = username + count;
   		count++;
    	exists = Accounts.findUserByUsername(newUsername);
   	}
   	user.username = newUsername;

   	user.profile.homepage = user.profile.bio = '';
   	user.lastLogin = new Date();  // add a custom field
   	user.profile["theme"] = defaultTheme;
    user.hidden = false;
   	//Meteor.call('createTasks', user["_id"],username);
    return user;
});


