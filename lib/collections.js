Tasks = new Mongo.Collection('tasks');

maxTask = 30;
maxDay = 30;
defaultTheme = 'cerulean';

if (Meteor.isClient) {
    Session.set("ready",0);
    Session.set("theme",defaultTheme);
	Meteor.subscribe("Users");
    Meteor.subscribe("Tasks", {
        onReady: function() {
            Session.set("ready",1);
            console.log("Ready");
        }
    });
    
}

Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + parseInt(days));
    return this;
};
