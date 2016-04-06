// db migration from the last version: enough to do only once
/*
(example)
var newtasks = [
{"_id":".....","userid":"....","challenge":"10x30","title":"....","start":"Tue Mar 01 2016","timestamp":1456790400,"tasks":[{.....]}]},
];
*/
migration = function() {
	/* done in May 2016
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
*/
/*
    done on 29.03.2015 (because mongoimport does not work... complains on duplicate _id even though they do not exist, 
    and with --upsert --upsertFields does not complain but does not insert / update either.)

	newtasks.forEach(function(entry){
		//console.log(entry);
		var _id = entry.id;
		console.log("userid="+entry.userid+" challenge="+entry.challenge+" title="+entry.title);
		if (Tasks.findOne({_id:_id})) {
			console.log("found");
			return;
		}
		Tasks.remove({userid:entry.userid,challenge:entry.challenge});
		Tasks.insert(entry);
	});
*/

}