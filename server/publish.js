Meteor.publish("Tasks", function () {
    //Meteor._sleepForMs(5000); // simulate delay for 5 sec - for debugging
    return Tasks.find();
});

Meteor.publish("userData", function() {
// data for the current logged in user (goes to Meteor.users)
// for some reason Meteor.userId() can't be used in publish; this.userId must be used instead.
  if ( !this.userId ) {
    return;
  }
  return Meteor.users.find({_id: this.userId}, { 
    fields: {
      "username": 1,
      "createdAt": 1,
      "profile": 1,
      "lastLogin": 1,
      "emailHash": 1,
      "services.twitter.profile_image_url_https": 1,
      "services.twitter.profile_image_url": 1,
      "services.facebook.id": 1,
      "services.google.picture": 1,
      "services.github.username": 1,
      "services.instagram.profile_picture": 1,
      "services.linkedin.pictureUrl": 1,
      "services.strava.profile_medium": 1,
      "services.runkeeper.small_picture": 1,
    } 
  });
});

Meteor.publish("allUserData", function () {
	// data that all users can see (goes to Meteor.users)
	if ( !this.userId ) {
		return;
	}	

  if (Roles.userIsInRole(this.userId, ['admin'])) {
    return Meteor.users.find({}, {fields: {
        "username": 1,
        "createdAt": 1,
        "profile": 1,
        "lastLogin": 1,
        "hidden": 1

    }});    
  }
  else {
  	return Meteor.users.find({hidden:false}, {fields: {
        "username": 1,
        "createdAt": 1,
        "profile": 1,
        "lastLogin": 1
  	}});
  }
});

