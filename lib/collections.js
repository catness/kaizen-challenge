Tasks = new Mongo.Collection('tasks');

maxTask = 30;
maxDay = 30;
defaultTheme = 'cerulean';
isDevelopment = false;

if (Meteor.isClient) {
    Challenges = new Mongo.Collection('challenges'); // a client-only collection processed in Meteor.publish("Challenges"
        // to overcome Meteor's limitation with merging fields from multiple subscriptions (it does not work)
    Session.set("ready",0);
    Session.set("theme",defaultTheme);

    Tracker.autorun(function () {
        // both these collections are a part of Meteor.users
        Meteor.subscribe("userData"); // the user's own data
        Meteor.subscribe("allUserData"); // the other users' data
        Meteor.subscribe("Tasks", {
            onReady: function() {
                Session.set("ready",1);
                console.log("Ready");
            }
        });
    });
    Meteor.call("isDevelopment", function(err,res) {
        console.log("isDevelopment=" + res );
        if (!err) isDevelopment = res;
    });
}

Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + parseInt(days));
    return this;
};

recordsPerPage = 10; // user list paging
