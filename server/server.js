// example how to update password in meteor mongo shell: 
// (get the known crypted password from somebody else's account)
// db.users.update({username:"ccc"},{$set:{services:{password:{bcrypt:'$2a$10$7iDJ6Hw99XjzsmrSPiVVjOFJBNvFO5ZVfM8YOituLaRZ.ffWR3yNq'}}}});
// to access meteor production db:       meteor mongo blah.meteor.com

Meteor.publish("Tasks", function () {
    return Tasks.find();
});

Meteor.publish("Users", function () {
  // restrict user data to be seen from the client
    return Meteor.users.find({}, {fields: {'username':1, 'profile': 1}});
//  return Meteor.users.find({});
});


Accounts.onCreateUser(function(options, user) {
// the callback which is called on user creation
    console.log("onCreateUser : " + JSON.stringify(user));
    if (options.profile) {
      user.profile = options.profile;
    }
    user.profile["theme"] = defaultTheme;
    Meteor.call('createTasks', user["_id"],user["username"]);
    return user;
});


var _MS_PER_DAY = 1000 * 60 * 60 * 24;
// a and b are javascript Date objects
function dateDiffInDays(a, b) {
  // Discard the time and time-zone information.
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

var makedays = function(startdate, startday, endday) {
    // startdate is a text specification of a date. If '', then it takes current date.
    var days = [];
    for (var day=startday;day<endday;day++) {
        var d = (startdate)?new Date(startdate):new Date();
        d.addDays(day);
        var dd = d.toDateString();
        days.push({day:dd, value:0});
    }
    return days;
}


Meteor.methods({
createTasks: function(userid,username) {
    console.log("CreateTasks: userid="+userid+" username="+username);
    if (Tasks.findOne({userid:userid})) return; //already exists
    var date = new Date();

    var title = username + "'s Kaizen challenge";
    var tasks = [];
    for (var pos=0;pos<maxTask;pos++) {
        var task = {title:"Task #"+(pos+1), description:"...", pos:pos};
        task.days = makedays(null,0,maxDay);
        tasks.push(task);
    }
    Tasks.insert( {userid:userid, start:date.toDateString(), title:title,  tasks:tasks } );
},
checkbox: function(userid, taskid, dayid, checked) {
    if(!Tasks.findOne({userid:userid}))return;
    var field = "tasks."+taskid+".days."+dayid+".value";
    var myset = {};  // workaround to use variables as keys
    myset[field] = checked;
    Tasks.update({userid:userid},{$set:myset });
},
updateTitle: function(userid, title) {
    if(!Tasks.findOne({userid:userid}))return;
    Tasks.update({userid:userid},{$set:{title:title}});
},
updateTask: function(userid, taskid, title, description) {
    console.log("updateTask");
    if(!Tasks.findOne({userid:userid}))return;   
    var myset = {};
    myset["tasks." + taskid +".title"] = title;
    myset["tasks." + taskid +".description"] = description;
    Tasks.update({userid:userid},{$set:myset });
},
moveTask: function(userid, taskid, dir) {
    console.log("moveTask userid=" + userid + " taskid=" + taskid + "= " + dir);
    if(!Tasks.findOne({userid:userid}))return;
    if (dir != 'up' && dir != 'down') return; 
    if (taskid == 0 && dir == 'up') return;
    if (taskid == maxTask-1 && dir == 'down') return;
    // swap the current task with the task in a desired position (up or down)
    // would be better to drag & drop, eventually
    var row = Tasks.findOne({userid:userid,"tasks.pos":parseInt(taskid)}, {fields:{'tasks.$':1}});
    taskid = parseInt(taskid);
    var newpos = (dir == 'up')?taskid-1 : taskid+1;
    var row1 = Tasks.findOne({userid:userid,"tasks.pos":newpos}, {fields:{'tasks.$':1}});
    var myset = {};
    myset["tasks."+taskid+".title"] = row1.tasks[0].title;
    myset["tasks."+taskid+".description"] = row1.tasks[0].description;
    myset["tasks."+taskid+".days"] = row1.tasks[0].days;
    Tasks.update({userid:userid},{$set:myset });
    myset["tasks."+newpos+".title"] = row.tasks[0].title;
    myset["tasks."+newpos+".description"] = row.tasks[0].description;
    myset["tasks."+newpos+".days"] = row.tasks[0].days;
    Tasks.update({userid:userid},{$set:myset });
},
updateStart: function(userid, start) {
    console.log("updateStart userid=" + userid + " start="+start);
    var t = Tasks.findOne({userid:userid});
    if (!t) return;
    var tasks = t.tasks;
    var current = t.start;
    console.log("current="+current);
    var diff = dateDiffInDays(new Date(start), new Date(current));
    if (diff==0) return;

    for (var i=0;i<maxTask;i++) {
        var days = tasks[i].days;
        if (diff>0 && diff<maxDay) { //new date is in the past 
            // keep the starting portion of the existing array, and add new days in the beginning
            var olddays = days.slice(0, maxDay-diff);
            //console.log(olddays);
            var newdays = makedays(start,0, diff);
            tasks[i].days = newdays.concat(olddays);
        }
        else if (diff<0 && diff>-maxDay) { // new date is in the future
        // keep the ending portion of the existing array, and add new days to the end
            var olddays = days.slice(-diff, maxDay);
            //console.log(olddays);
            var newdays = makedays(start,maxDay+diff,maxDay);
            tasks[i].days = olddays.concat(newdays);
        }
        else { // create a new one from scratch
            tasks[i].days = makedays(start,0,maxDay);
        }
    }
    Tasks.update({userid:userid},{$set:{start: new Date(start).toDateString(),tasks:tasks}});
},
updateTheme: function(userid, theme) {
    var user = Meteor.users.findOne({_id:userid});
    if (!user) return;
    var profile = user.profile;
    profile['theme'] = theme;
    Meteor.users.update({_id:userid},{$set:{profile:profile}});
},
getTheme: function(userid) {
    var user = Meteor.users.findOne({_id:userid});
    if (!user) return;
    var profile = user.profile;
    var theme = profile['theme'];
    return theme;
}

})
