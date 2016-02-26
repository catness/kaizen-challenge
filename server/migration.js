// db migration from the last version: enough to do only once

migration = function() {
	console.log("Migration ... ");
	var users = Meteor.users.find({});
	var challenge = "30x30";
	users.forEach(function(user){
		var userid = user._id;
		if (!("lastLogin" in user)) {
			console.log("update " + userid + " add lastLogin=" + user.createdAt);
			Meteor.users.update({_id:userid},{$set:{lastLogin:user.createdAt}});
		}
		if (!("hidden" in user)) {
			console.log("update " + userid + " add hidden");
			Meteor.users.update({_id:userid},{$set:{hidden:false}});
		}
		if (!(user.profile.name)) {
			console.log("update " + userid + " add name=" + user.username);
			Meteor.users.update({_id:userid},{$set:{"profile.name":user.username}});
		}
		var tasks = Tasks.findOne({userid:userid},{fields:{title:1,start:1,tasks:1}});
		if (tasks && ("title" in tasks)) { // old-format challenge exists
			// if new format challenge doesn't exist
			if (Tasks.findOne( { $and:[{userid:userid}, {challenges: {$elemMatch: {challenge:challenge }}} ]} )) return; 
			console.log("convert old 30x30 challenge for " + userid);
			Tasks.update({userid:userid}, 
	        {$addToSet:{challenges: {challenge:challenge,start:tasks.start, title:tasks.title, tasks:tasks.tasks }}} );
	        Tasks.update({userid:userid},{$unset: {title:1,start:1,tasks:1} } ); // delete the old challenge
		}
	});
}