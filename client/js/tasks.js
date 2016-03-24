var tasksheet = null;
var notes = {};
//var darkThemes = {"darkly":true,"cyborg":true,"slate":true,"superhero":true};
var curTheme = "cerulean";

Template.dayHeader.onRendered(function () {
    // must wait till the day header is rendered before init popover, otherwise it doesnt work!
    //console.log("Init popover");
    $('[data-toggle="popover"]').popover({html:true, placement:"auto left", trigger:"hover"});
});

Template.dayHeader.helpers({
    dayNote:function(day) {
        // display a note for this day in a popover
        if (notes && day in notes) { 
            if (notes[day].length < 500)  return notes[day];
            else {
                return notes[day].substr(0,500) + " ... click to read more ...";
            }
        }
        return "";
    },
    dayNoteClass:function(day) {
        // to distinguish visually between the days with and without notes
        if (notes && day in notes) {
           //return (curTheme in darkThemes)?"day-note-dark":"day-note";
           return "day-note-" + curTheme;
        }
        return "";    
    }   
});

Template.sheet.onCreated(function(){
    var self = this;
    self.autorun(function(){
        //console.log("Subscribe to challenge " + Session.get("userid") + " " + Session.get("challenge"));
        self.subscribe("Challenges",Session.get("userid"),Session.get("challenge"));
    })
});

 
Template.sheet.helpers({
    result:function() {
        // wrapping tasksheet in a special "result" object to distinguish between the case when the user is not logged in
        // and when the database is still loading
        //console.log("sheet start");
        var userid = Session.get("userid");
        if (!userid) {
            console.log("Userid not defined");
            return null;
        }
        var challenge = Session.get("challenge");
        if (!challenge) {
            console.log("Challenge not defined");
            return null;            
        }
        tasksheet = Challenges.findOne({userid:userid,challenge:challenge});
        // Challenges are published by the server for userid and challenge
        //console.log("tasksheet = " + JSON.stringify(tasksheet));
        if (!tasksheet) {
            return {tasksheet:null,ready:true};
        }
        else {
            tasksheet.userid = userid;
            notes = tasksheet.notes;
            curTheme = Session.get("theme");
            Session.set("canAddTask",tasksheet.tasks.length<maxTask); // to make it reactive
            Session.set("canDeleteTask",tasksheet.tasks.length>minTask);
            return {tasksheet:tasksheet,ready:true};
        }
    },
    getCheckboxClass:function(val) {
        if (val==-1) return 'checkbox-danger';
        else return 'checkbox-success';
    },
    isChecked:function(val) {
        return (val!=0);
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
    canAddTask:function() {
        if (!tasksheet) return false;
        return Session.get("canAddTask");
    },
    canDeleteTask:function() {
        if (!tasksheet) return false;
        return Session.get("canDeleteTask");
    }
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
        var taskid = $(e.target).attr("data-id");
        var dayid = $(e.target).attr("data-dayid");
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
               //$('#'+id).prop('checked', true); // turn the checkmark back on 
                $(e.target).prop('checked', true); // turn the checkmark back on 
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
        var taskid = $(e.currentTarget).attr("data-id");
        var description = $(e.currentTarget).attr('title'); //tooltip
        var title = $(e.currentTarget).text();
        $("#title").val(title);
        $("#description").val(description);
        $("#pos").val(taskid); //current position
        $("#modal-title").text("Edit task");
        $("#edittask").modal('show');
    },
    'click .js-add-task': function(e) {
        // open modal for the new task, to add the task name & description
        if (Session.get("userid") != Meteor.userId()) return false;
        $("#title").val('');
        $("#description").val('');
        $("#pos").val(-1); //new task
        $("#modal-title").text("New task");
        $("#edittask").modal('show');
    },
    'click .js-pos': function(e) {
        // move the task up or down
        if (Session.get("userid") != Meteor.userId()) return false;
        var dir = $(e.currentTarget).attr("data-dir");
        var taskid = $(e.currentTarget).attr("data-id");
        var challenge = Session.get("challenge");
        Meteor.call('moveTask', challenge, taskid, dir);
    },
    'click .js-del': function(e) {
        // move the task up or down
        if (Session.get("userid") != Meteor.userId()) return false;
        var taskid = $(e.currentTarget).attr("data-id");
        var title = $(e.currentTarget).attr("data-title");
        sweetAlert({
          title: "Are you sure?",
          text: "Deleting the task " + title + ". This can not be undone!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, delete it!",
          closeOnConfirm: false,
          html: false
        }, function(){
            var challenge = Session.get("challenge");
            Meteor.call('deleteTask', challenge, taskid, function(err,res) {
                sweetAlert("Deleted!",
                "Your task has been deleted.",
                "success");   
            });
        });
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
            if (title != '') {
                if (taskid>=0) Meteor.call('updateTask', challenge, taskid, title, description);
                else Meteor.call('addTask', challenge, title, description);
            }
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

Template.dayHeader.events({
    'click .day-header': function(e,t) {
        e.preventDefault();
 
        var day = $(e.currentTarget).attr("data-title"); // for some reason it doesn't read the 'title' attribute
        var content = '';
        if (notes && day in notes) content = notes[day];
        // have to set them directly in DOM, because it doesn't work with the template helpers, 
        // for some reason they are not getting called when the vars are updated
        $("#dayNotesTitle").text(day);
        $("#dayNotesContent").html(content);
        $("#dayNotes").modal('show');
    }
});


Template.notes.onRendered(function () {
    $('.notes').notebook();
});


Template.notes.events({
"click .close-notes":function(e,t) {
    var op = $(e.target).attr("data-op"); 
    if (op == 'save' && Session.get("userid") == Meteor.userId()) {
        var day = $("#dayNotesTitle").text();
        var content = $("#dayNotesContent").html();
        Meteor.call("updateNotes",day,content,Session.get("challenge"), function(err,res) {
            if (!err) {
                notes[day] = content;
            }
        });
    }
    $('#dayNotes').modal('hide');
}
});

