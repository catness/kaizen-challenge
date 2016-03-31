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
        var date = new Date();
        var year = date.getFullYear();
        var mon = date.getMonth();
        var day = date.getDay();
        $('#start').val(moment(date).format('YYYY-MM-DD'));
        $('.input-group.date').datepicker( {
            format: "yyyy-mm-dd",
            startDate: "2016-01-01",
            todayBtn: "linked",
            defaultViewDate: {year:year, month:mon,day:day}
        });
        $("#joinchallenge").modal('show');
    }
});

Template.home.helpers({
    ready:function() {
        return Session.get('ready');
    },
    challenges: function() {
        var userid = Meteor.userId();
        if (!userid) return false;
        var challenges = Tasks.find({userid:userid},{sort:{timestamp:-1}});
        return challenges;
    },
    username:function() {
        var user = Meteor.user();
        return user.username;
    }
});

Template.joinChallenge.helpers({
    // ugh is there a better way to make a fixed range loop in Spacebars?
    numtasks:function() {
        var foo = [];
        for (var i = minTask; i <= maxTask; i++) {
            foo.push(i);
        }
        return foo;    
    }
});

Template.joinChallenge.events({
    'submit #joinchallenge': function(e) {
        e.preventDefault();
        var tasknum = $(e.target).find('[name=tasknum]').val();
        var start = $(e.target).find('[name=start]').val().trim();
        var preset = $(e.target).find('[name=preset]').val();
        //var date = new Date (Date.parse(start));
        var dateFixed = moment(start).format('YYYY-MM-DD'); // just in case, because we can't trust what the user enters in the date field
        console.log("joinchallenge submit: tasknum = " + tasknum + " start=" + start + " preset="+preset+" dateFixed="+JSON.stringify(dateFixed));
        $("#joinchallenge").modal('hide');
        $("#please-wait").removeClass('hidden');
        Meteor.call("createTasks", tasknum, dateFixed, preset, function(err,challenge) {
            if (err) {
                console.log("error creating challenge");
                setDisplayMessage(err["reason"]);
            }
            $("#please-wait").addClass('hidden');
        });        
    }
});


