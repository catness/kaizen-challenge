// db migration from the last version: enough to do only once

migration = function() {
	console.log("Migration ... ");

	var users = Meteor.users.find({});
	users.forEach(function(user){
		var userid = user._id;
		var username = user.username;
		var tasks = Tasks.find({userid:userid});
		console.log("\n" + userid + " " + username);
		tasks.forEach(function(task){
			if (!("challenges" in task)) return; // new task entry
			// copy all the old challenges to the new format
			task.challenges.forEach(function(ch){
				if (!Tasks.findOne({userid:userid,challenge:ch.challenge})) {
					console.log("Adding " + ch.challenge + " " + ch.title + " " + ch.start);
					var timestamp = moment(new Date(ch.start)).unix();
					var myset = {userid:userid, challenge:ch.challenge, title:ch.title, 
						start:ch.start, timestamp:timestamp, tasks:ch.tasks};
					if (ch.notes) myset["notes"] = ch.notes;
					Tasks.insert(myset);
				}
			});
			// remove the old entry
			console.log("Removing " + task._id);
			Tasks.remove({_id:task._id});
		});
	});

}