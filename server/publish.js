Meteor.publish("Tasks", function () {
    //Meteor._sleepForMs(5000); // simulate delay for 5 sec - for debugging
    //return Tasks.find();
    return Tasks.find({},{fields:{userid:1, "challenge":1, "title":1, "start":1, "timestamp":1 }}); 
    // limit the data for the users list
});

Meteor.publish("Challenges", function(userid,challenge) {
  //console.log("publish challenge for " + userid + " " + challenge);

  /* define a client-only collection using an undocumented function _publishCursor
  because otherwise there's no way to add more fields (challenges contents) to the same collection
  after publishing a few fields previously (in publish Tasks). (Meteor limitation!!)
  */
  var self = this;
  var query = Tasks.find( {userid:userid, challenge:challenge} );
  //console.log(JSON.stringify(Tasks.findOne({userid:userid, challenge:challenge})));
  Mongo.Collection._publishCursor(query, self, "challenges");
  return self.ready();

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
    // to allow seeing the challenge sheets for non-logged in users
    return Meteor.users.find({}, {fields: {
        "username": 1
    }});    
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

