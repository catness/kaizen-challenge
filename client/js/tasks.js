Template.sheet.helpers({
    result:function() {
        // wrapping tasksheet in a special "result" object to distinguish between the case when the user is not logged in
        // and when the database is still loading
        var userid = Session.get("userid");
        if (!userid) {
            console.log("Userid not defined");
            return null;
        }
        var challenge = Session.get("challenge");
        if (!Session.get("ready")) {
            console.log("DB not ready");
            return {tasksheet:null,ready:false};
        }
        var tasksheet = Tasks.findOne( { $and:[{userid:userid}, {challenges: {$elemMatch: {challenge:challenge }}} ]} );
        if (!tasksheet) {
            return {tasksheet:null,ready:true};
        }
        else {
            // select the challenge with the name 'challenge'
            // it should be done with mongo, but the command only works in mongo shell but not here
            // e.g. db.tasks.findOne( {$and: [ {userid:"nBwcQQM6uJBPdHkfj"},{challenges: {$elemMatch: {challenge:"10x30"}}} ]}, {"challenges.$":1 } );
            // so we just loop through all the challenges and pick the one we need
            var sheet;
            tasksheet.challenges.forEach(function(item){
                if (item.challenge == challenge) {
                    sheet = item;
                    return;
                }
            });
            sheet.userid = userid;
            return {tasksheet:sheet,ready:true};
        }
    },
    getCheckboxClass:function(val) {
        if (val==-1) return 'checkbox-danger';
        else return 'checkbox-success';
    },
    isChecked:function(val) {
        return (val==0)?false:true;
    },
    getColumnClass:function(day) {
        var date = new Date(); 
        //date.addDays(2); for debug
        if (date.toDateString() == day) return "info column";
        return "column";
    },
    getEnd:function(start) {
        var date = new Date(start);
        var enddate = date.addDays(maxDay-1).toDateString();
        return enddate;
    },
/*
    isDeletable:function() {
        var challenge = Session.get("challenge");
        var userid = Session.get("userid");
        // the user can delete his own challenge; admin can delete all challenges
        // return (userid==Meteor.userId() || Roles.userIsInRole(Meteor.userId(),['admin']));

        // the delete button should not appear for regular users, it's bad for the morale to see it all the time!
        // if there will be a need, we'll think about it later.
    } */
});


Template.sheet.events({
    'click .js-checkbox': function(e) {
        // 3 way checkbox : toggles between success checked, error checked, and unchecked (with class=success)
        if (!Meteor.user()) return false;   
        //var userid = $("#userid").val();
        var userid = Session.get("userid");
        if (userid != Meteor.userId()) return false; // this timesheet doesn't belong to the logged user
        var challenge = Session.get("challenge");
        var checked = $(e.target).is(":checked")?1:0;
        var id = $(e.target).attr('id');
        var splitted = id.split('_');
        var taskid = splitted[1];
        var dayid = splitted[2];
        var parent = $(e.target).parent().closest('div');
        var classes = parent.attr('class');

        if (classes.indexOf("checkbox-success") != -1) { // current class is success
           if (checked) {  // change from empty to checked
               // nothing to do
           }
            else { // switch off success
               // turn on error!
                checked = -1; // the value of failed task
                $(parent).removeClass('checkbox-success').addClass('checkbox-danger');
                $('#'+id).prop('checked', true); // turn the checkmark back on 
            }
        }
        else { // current class is danger
            if (checked) {
                // should not happen?
            }
            else { // uncheck danger, return to the normal unchecked box
                $(parent).removeClass('checkbox-danger').addClass('checkbox-success');    
            }
        }

        Meteor.call('checkbox', challenge, taskid, dayid, checked);
    },
    'click .js-taskname': function(e) {
        // open modal to edit the task name & description
        if (Session.get("userid") != Meteor.userId()) return false;
        var splitted = $(e.target).attr('id').split('_');
        var taskid = splitted[1];
        var description = $(e.target).attr('title'); //tooltip
        var title = $(e.target).text();
        $("#title").val(title);
        $("#description").val(description);
        $("#pos").val(taskid); //current position
        $("#edittask").modal('show');
    },
    'click .js-pos': function(e) {
        // move the task up or down
        if (Session.get("userid") != Meteor.userId()) return false;
        var splitted = $(e.currentTarget).attr('id').split('_');
        var dir = splitted[0]; // up or down
        var taskid = splitted[1];
        if (!Meteor.user()) return false;
        var userid = Session.get("userid");
        if (userid != Meteor.userId()) return false; // this timesheet doesn't belong to the logged user
        var challenge = Session.get("challenge");
        Meteor.call('moveTask', challenge, taskid, dir);
    },
    'click #js-title': function(e) {
        // open modal to edit the sheet name
        if (Session.get("userid") != Meteor.userId()) return false;
        var title = $("#js-title").text();
        $("#maintitle").val(title);
        $("#edittitle").modal('show');
    },
    'click #js-start': function(e) {
        // open modal to change the starting date
        if (Session.get("userid") != Meteor.userId()) return false;
        var value = $("#js-start").text();
        var splitted = value.split(' - '); // get the start from "start - end"
        splitted = splitted[0].split(' '); // get the components of date e.g. Sun Jan 24 2016
        var mon = "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(splitted[1]) / 3 + 1 ;
        if (mon <=9 ) mon = '0' + mon;
        var day = splitted[2];
        var year = splitted[3];
        var start = year+'-'+mon+'-'+day;
        $("#start").val(start);
        $('.input-group.date').datepicker( {
            format: "yyyy-mm-dd",
            startDate: "2016-01-01",
            todayBtn: "linked",
            defaultViewDate: {year:year, month:mon,day:day}
        });
        $("#editstart").modal('show');
    },
    'click #delete-challenge': function(e) {
        
        var userid = $(e.target).attr("data-user"); 
        var challenge = $(e.target).attr("data-challenge");
        Meteor.call("deleteChallenge",userid,challenge,function(err,result) {
            if(!err) {
                Router.go('/');
            }
        });
    }
});


Template.editTask.events({
'submit #edittask': function(e) {
    // update the task name & description
    e.preventDefault();
    if (Meteor.user()) {
        var userid = Session.get("userid");
        //var userid = $("#userid").val();
        if (userid == Meteor.userId()) { // this timesheet belongs to the logged user
            var title = $(e.target).find('[name=title]').val().trim();
            var description = $(e.target).find('[name=description]').val().trim();
            var taskid = $(e.target).find('[name=pos]').val().trim();
            var challenge = Session.get("challenge");
            Meteor.call('updateTask', challenge, taskid, title, description);
        }
    }
    $("#edittask").modal('hide');
}
});

Template.editTitle.events({
'submit #edittitle': function(e) {
    // update the sheet title
    e.preventDefault();
    if (Meteor.user()) {
        //var userid = $("#userid").val();
        var userid = Session.get("userid");
        if (userid == Meteor.userId()) { // this timesheet belongs to the logged user
            var title = $(e.target).find('[name=title]').val().trim();
            var challenge = Session.get("challenge");
            Meteor.call('updateTitle', challenge, title);
        }
    }
    $("#edittitle").modal('hide');
}
});

Template.editStart.events({
'submit #editstart': function(e) {
    // update the sheet start
    e.preventDefault();
    if (Meteor.user()) {
        //var userid = $("#userid").val();
        var userid = Session.get("userid");
        if (userid == Meteor.userId()) { // this timesheet belongs to the logged user
            var start = $(e.target).find('[name=start]').val().trim();
            var date = new Date (Date.parse(start));
            var challenge = Session.get("challenge");
            Meteor.call('updateStart', challenge, date);
        }
    }
    $("#editstart").modal('hide');
}
});
