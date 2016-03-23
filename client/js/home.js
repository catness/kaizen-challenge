
var displayMessageTimer; // for display messages that clear after a specified timeout

setDisplayMessage = function(message) {
    // set a temporary display message as a feedback from some actions. 
    // (It's displayed after redirection to another route, that's why it has to be set in a separate variable
    Session.set("displayMessage",message);
    displayMessageTimer = setTimeout(function() {  // clear the message after 30 sec
        Session.set('displayMessage',null);    
  }, 10000); // 10 seconds
}

Template.home.events({
    'click #js-display-message' : function(e, t) {
    // remove display message (on the main page) if the user clicked close
        Session.set('displayMessage',null);
        clearTimeout(displayMessageTimer);
    },
    'click .join-challenge': function(e,t) {
        if (!Meteor.userId()) {
            Router.go('/login');
            return;
        }
        var challenge=$(e.target).attr("data-challenge"); // name of the service
        $("#please-wait").removeClass('hidden');
        Meteor.call("createTasks", challenge, function(err,result) {
            if (err) {
                console.log("error creating challenge");
                $("#please-wait").addClass('hidden');
                return;
            }
            $("#please-wait").addClass('hidden');
            Router.go("/challenge/"+challenge+'/'+Meteor.user().username);
        });
    }
});

Template.home.helpers({
    ready:function() {
        return Session.get('ready');
    },
    challengeExists:function(name){
        // returns true if this challenge is created for the logged in user
        var userid = Meteor.userId();
        if (!userid) return false;
        var tasks = Tasks.findOne( { $and:[{userid:userid}, {challenges: {$elemMatch: {challenge:name }}} ]} );
        if (tasks) {
            return true;
        }
        return false;
    },
    username:function() {
        var user = Meteor.user();
        return user.username;
    }
});