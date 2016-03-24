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

var verifyUsername = function(username) {
    // check if username exists (on the fly) for users who sign up, to ensure that username is unique
    if (!username.match(/^[A-Za-z0-9_\-\.]{3,64}$/)) return false;
    var ret = Meteor.call('findUserName',username); // already exists
    if (ret) return false;
    return true;
}

Meteor.methods({
createTasks: function(tasknum, date) {
    var userid = Meteor.userId();
    var username = Meteor.users.findOne({_id:userid},{fields:{'username':1}}).username;
    var startTxt = moment(date).format('YYYY-MM-DD');
    var challenge = "custom_" + startTxt;
    console.log("create tasks for " + username + " tasks=" + tasknum + " start=" + startTxt + " date=" + date + " challenge=" + challenge);
    if (Tasks.findOne( {userid:userid, challenge:challenge})) { 
        throw new Meteor.Error("createError", "Challenge starting on " + date.toDateString() + " already exists.");
    }
    var titleMain = username + "'s " + tasknum + " habits challenge";
    var tasks = [];
    for (var pos=0;pos<tasknum;pos++) {
        var task = {title:"Task #"+(pos+1), description:"...", pos:pos};
        task.days = makedays(startTxt,0,maxDay);
        tasks.push(task);
    }
    // timestamp (unix timestamp) needed to sort by date on the client: minimongo doesn't support sorting by date
    Tasks.insert({userid:userid, challenge:challenge, start:date.toDateString(), timestamp:moment(date).unix(),
        title:titleMain, tasks:tasks });
},
checkbox: function(challenge, taskid, dayid, checked) {
    var userid = Meteor.userId();
    //if (!Tasks.findOne({userid:userid,challenge:challenge})) return;
    var field = "tasks."+taskid+".days."+dayid+".value";
    var myset = {};  // workaround to use variables as keys
    myset[field] = checked;
    Tasks.update({userid:userid,challenge:challenge},{$set:myset});
},
updateTitle: function(challenge, title) {
    var userid = Meteor.userId();
    //if (!Tasks.findOne({userid:userid,challenge:challenge})) return;
    Tasks.update({userid:userid,challenge:challenge},{$set:{title:title}});
},
addTask: function(challenge, title, description) {
    var userid = Meteor.userId();
    var ch = Tasks.findOne({userid:userid,challenge:challenge});
    if (!ch) return;
    var startTxt = moment.unix(ch.timestamp).format('YYYY-MM-DD');
    var task = {title:title, description:description, pos:ch.tasks.length};
    task.days = makedays(startTxt,0,maxDay);
    //console.log(JSON.stringify(task));
    Tasks.update({userid:userid,challenge:challenge},{$push:{tasks:task}});
},
updateTask: function(challenge, taskid, title, description) {
    var userid = Meteor.userId();
    //if (!Tasks.findOne({userid:userid,challenge:challenge})) return;
    var myset = {};
    myset["tasks." + taskid +".title"] = title;
    myset["tasks." + taskid +".description"] = description;
    Tasks.update({userid:userid,challenge:challenge},{$set:myset});
},
deleteTask: function(challenge, taskid) {
    var userid = Meteor.userId();
    console.log("Delete task " + taskid + " " + challenge);
    // in Mongo there's no way to remove an array element by position! So first we unset it but it leaves a gap (null)
    // then remove the null (all the nulls)
    var myset = {};
    myset["tasks." + taskid] = 1;
    Tasks.update({userid:userid,challenge:challenge},{$unset:myset});
    Tasks.update({userid:userid,challenge:challenge},{$pull:{tasks:null}});
},
moveTask: function(challenge, taskid, dir) {
    var userid = Meteor.userId();
    var mychallenge = Tasks.findOne({userid:userid,challenge:challenge});
    if (!mychallenge) return;
    
    taskid = parseInt(taskid);
    var maxTask = mychallenge.tasks.length;
    if (dir != 'up' && dir != 'down') return; 
    if (taskid == 0 && dir == 'up') return;
    if (taskid == maxTask-1 && dir == 'down') return;
    // swap the current task with the task in a desired position (up or down)
    // would be better to drag & drop, eventually
 
    var row = mychallenge.tasks[taskid];
    var newpos = (dir == 'up')?taskid-1 : taskid+1;
    var row1 = mychallenge.tasks[newpos];

    var myset = {};
    myset["tasks."+taskid+".title"] = row1.title;
    myset["tasks."+taskid+".description"] = row1.description;
    myset["tasks."+taskid+".days"] = row1.days;
    // not every challenge has immutable ids, so we have to check if this key exists
    if ("id" in row1) myset["tasks."+taskid+".id"] = row1.id;

    Tasks.update({userid:userid,challenge:challenge},{$set:myset});

    myset["tasks."+newpos+".title"] = row.title;
    myset["tasks."+newpos+".description"] = row.description;
    myset["tasks."+newpos+".days"] = row.days;
    if ("id" in row1) myset["tasks."+newpos+".id"] = row.id;
    Tasks.update({userid:userid,challenge:challenge},{$set:myset});
},
updateStart: function(challenge, start) {
    var userid = Meteor.userId();
    var t = Tasks.findOne({userid:userid,challenge:challenge});
    if (!t) return;
    var tasks = t.tasks;
    var current = t.start;
    var diff = dateDiffInDays(new Date(start), new Date(current));
    if (diff==0) return;
    var maxTask = tasks.length;
    for (var i=0;i<maxTask;i++) {
        var days = tasks[i].days;
        if (diff>0 && diff<maxDay) { //new date is in the past 
            // keep the starting portion of the existing array, and add new days in the beginning
            var olddays = days.slice(0, maxDay-diff);
            var newdays = makedays(start,0, diff);
            tasks[i].days = newdays.concat(olddays);
        }
        else if (diff<0 && diff>-maxDay) { // new date is in the future
        // keep the ending portion of the existing array, and add new days to the end
            var olddays = days.slice(-diff, maxDay);
            var newdays = makedays(start,maxDay+diff,maxDay);
            tasks[i].days = olddays.concat(newdays);
        }
        else { // create a new one from scratch
            tasks[i].days = makedays(start,0,maxDay);
        }
    }
    var myset = {};
    var date = new Date(start);
    myset["start"] = date.toDateString();
    myset["timestamp"] = moment(date).unix();
    myset["tasks"] = tasks;
    if ("notes" in t) {
        myset["notes"] = t.notes;
    }
    Tasks.update({userid:userid,challenge:challenge}, {$set:myset});
},
updateNotes: function(day, content, challenge) {
    var userid = Meteor.userId();
    content = content.trim();
    console.log("Update notes for " + challenge + " : " + day + " length=" + content.length);
    //if (!Tasks.findOne({userid:userid,challenge:challenge})) return;
    var myset = {};
    if (content.length > 0) {
        myset["notes." + day] = content;
        Tasks.update({userid:userid,challenge:challenge}, {$set:myset});
    }
    else {
        console.log("deleting note");
        myset["notes." + day] = 1;
        Tasks.update({userid:userid,challenge:challenge}, {$unset:myset});
    }
    console.log("Notes updated!");
},

deleteChallenge: function(userid,challenge) {
    //if (!(userid==Meteor.userId() || Roles.userIsInRole(Meteor.userId(),['admin']))) {
    if (!Roles.userIsInRole(Meteor.userId(),['admin'])) {
        throw new Meteor.Error("deleteError", "Not authorized to delete this challenge");
    }
    else {
        Tasks.remove({userid:userid,challenge:challenge});
    }
},

updateTheme: function(theme) {
    var userid = Meteor.userId();
    var user = Meteor.users.findOne({_id:userid},{fields:{profile:1}});
    if (!user) return;
    var profile = user.profile;
    profile['theme'] = theme;
    Meteor.users.update({_id:userid},{$set:{profile:profile}});
},
getTheme: function() {
    var userid = Meteor.userId();
    var user = Meteor.users.findOne({_id:userid},{fields:{profile:1}});
    if (!user) return;
    var profile = user.profile;
    var theme = profile['theme'];
    return theme;
},
findUserName: function(username) {
    var ret = Accounts.findUserByUsername(username); // case-insensitive search
    return ret;
},
findUserEmail: function(email) {
    var ret = Accounts.findUserByEmail(email); // case-insensitive search
    return ret;
},  
updateUser: function(userid, username, password, email, profile) {
    var user = Meteor.users.findOne({_id:userid});
    if (!user) return false; // shoudn't happen...
    var userid = user._id;

    // user can edit own profile, admin can edit all profiles
    if (!(userid == Meteor.userId() || Roles.userIsInRole(Meteor.userId(),['admin']))) return;

    // set up fields to update, all in one query

    // copy the old profile and update with the fields from the new profile
    // otherwise existing fields that are not in the web form ('external') will be erased!
    var uProfile = user.profile;
    for (var field in profile) {
        uProfile[field] = profile[field];
    }
    var updated = {profile:uProfile};
    if (username != user.username && username!='' && verifyUsername(username)) {
        updated['username'] = username;
    }
    if (email != '' && user.emails && email != user.emails[0].address) {
        updated['emails.0.address'] = email;
        updated['emails.0.verified'] = false;
    }
    var ret = Meteor.users.update({_id:userid} , {$set:updated});
    if (password != '') {
        Accounts.setPassword(userid, password);  // it will also log out all user's sessions
    }
},
hideUser: function(userid, hide) {
    // hide==true or false
    if (!Roles.userIsInRole(Meteor.userId(),['admin'])) return;
    if (hide) {
        Meteor.users.update({_id:userid},{$set:{hidden:true}});
    }
    else {
        Meteor.users.update({_id:userid},{$set:{hidden:false}});   
    }
},
deleteUser: function(userid) {
    if (!Roles.userIsInRole(Meteor.userId(),['admin'])) return;
    Meteor.users.remove({_id:userid});
    Tasks.remove({userid:userid});
},
findToken: function(token) {
    // check if the password reset token the user supplied in the reset url actually exists in our db
    if (Meteor.users.findOne({"services.password.reset.token":token})) {
        return true;
    }
    else {
        return false;
    }
},
findTokenEmail: function(token) {
    // check if the email verification token the user supplied in the verification url actually exists in our db
    // there can be several emails and several tokens (verificationTokens is a list), elemMatch checks if there's at least one
    if (Meteor.users.findOne({"services.email.verificationTokens":{$elemMatch:{token:token}}})) {
        return true;
    }
    else {
        return false;
    }
},
sendEmail: function (to, from, subject, text) {

    // Let other method calls from the same client start running,
    // without waiting for the email sending to complete.
    this.unblock();

    //actual email sending method
    Email.send({
      to: to,
      from: from,
      subject: subject,
      text: text
    });
},
sendVerificationEmail: function(userid) {
    Accounts.sendVerificationEmail(userid);
},
setLastLogin: function() {
    Meteor.users.update({_id:this.userId},{$set:{lastLogin:new Date()}});
},
isDevelopment: function() {
    console.log("isDevelopment? " + process.env.ROOT_URL);
    return (process.env.ROOT_URL != "http://kaizenchallenge.dynalias.net");
}
});
