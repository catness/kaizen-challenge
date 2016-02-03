Accounts.createUser = _.wrap(Accounts.createUser, function(createUser) {
    // this callback is used here only to redirect the user to the main page after creating the account
    var args = _.toArray(arguments).slice(1),
        user = args[0];
        origCallback = args[1];

    var newCallback = function(error) {
        console.log("create user " + user);
        origCallback.call(this, error);
    };

    createUser(user, newCallback);
    Router.go("/");
});

Meteor.autorun(function () {
    // this callback is required to load the user's preferred theme on login
    if (Meteor.userId()) { // on login
        console.log("User logged in : " + Meteor.userId());
        // database on the client may be not ready when the user logs in, so we go to the server
        Meteor.call("getTheme",Meteor.userId(), function(error,theme) {
            if (error) return;
            if (theme) set_theme(theme);
        });
    } else {
        // on logout
        console.log("User logged out");
    }
});


Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

Template.navbar.helpers({
    themes: [
    {theme: "cerulean"},
    {theme: "cosmo"},
    {theme: "cyborg"},
    {theme: "darkly"},
    {theme: "flatly"},
    {theme: "journal"},
    {theme: "lumen"},
    {theme: "paper"},
    {theme: "readable"},
    {theme: "sandstone"},
    {theme: "simplex"},
    {theme: "slate"},
    {theme: "spacelab"},
    {theme: "superhero"},
    {theme: "united"},
    {theme: "yeti"}
    ],
    ifThemeActive:function(theme) {
        var current = Session.get("theme");
        if (theme == current) return 'active';
        return '';
    }
  });


function set_theme(theme) {
    var themePath = "/css/" + theme + ".css";   
    $('#currentTheme').remove();
    $('head').append('<link id="currentTheme" rel="stylesheet" href="' + themePath + '" type="text/css" />'); 
    $('head').append('<link id="currentTheme" rel="stylesheet" href="/css/override.css" type="text/css" />');
    Session.set("theme",theme);
}


  Template.navbar.events({
    "click .theme-link": function(event){
        // save the theme in db in the user's profile
      var theme = $(event.target).attr('data-theme');
      set_theme(theme);
      if (Meteor.userId()) {
        Meteor.call("updateTheme",Meteor.userId(),theme);
      }
    }   
  });


Accounts.ui.config({
    requestPermissions: {},
    extraSignupFields: [{
      fieldName: 'username',
      fieldLabel: 'Username',
      inputType: 'text',
      visible:true,
      validate: function(value, errorFunction) {
          if (!value) {
            errorFunction("Please specify username");
            return false;
          } 
          else if (value.search(/^[a-zA-Z0-9_\-\.]+$/)==-1) {
            errorFunction("Username can contain only alphanumeric characters, dot, dash and underscore.");
            return false;
          }
          else {
            return true;
          }
        }
    }
 ]});

Template.sheet.helpers({
    result:function() {
        // wrapping tasksheet in a special "result" object to distinguish between the case when the user is not logged in
        // and when the database is still loading
        var userid = Session.get("userid");
        if (!userid) {
            console.log("Userid not defined");
            return null;
        }
        if (!Session.get("ready")) {
            console.log("DB not ready");
            return {tasksheet:null};
        }
        var tasksheet = Tasks.findOne({userid:userid});
        if (!tasksheet) {
            return {tasksheet:null};
        }
        else {
            return {tasksheet:tasksheet};
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
    }
});


Template.sheet.events({
    'click .js-checkbox': function(e) {
        // 3 way checkbox : toggles between success checked, error checked, and unchecked (with class=success)
        if (!Meteor.user()) return false;   
        var userid = $("#userid").val();
        if (userid != Meteor.userId()) return false; // this timesheet doesn't belong to the logged user
        var checked = $(e.target).is(":checked")?1:0;
        var id = $(e.target).attr('id');
        var splitted = id.split('_');
        var taskid = splitted[1];
        var dayid = splitted[2];
        console.log(" taskid="+taskid+" dayid="+dayid+" userid="+userid+" checked="+checked);
        var parent = $(e.target).parent().closest('div');
        var classes = parent.attr('class');
        console.log("parent="+parent+ " classes="+classes);

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

        Meteor.call('checkbox', Meteor.userId(), taskid, dayid, checked);
    },
    'click .js-taskname': function(e) {
        // open modal to edit the task name & description
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
        var splitted = $(e.currentTarget).attr('id').split('_');
        var dir = splitted[0]; // up or down
        var taskid = splitted[1];
        if (!Meteor.user()) return false;
        var userid = $("#userid").val();
        if (userid != Meteor.userId()) return false; // this timesheet doesn't belong to the logged user
        Meteor.call('moveTask', Meteor.userId(), taskid, dir);
    },
    'click #js-title': function(e) {
        // open modal to edit the sheet name
        var title = $("#js-title").text();
        $("#maintitle").val(title);
        $("#edittitle").modal('show');
    },
    'click #js-start': function(e) {
        // open modal to change the starting date
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
});


Template.editTask.events({
'submit #edittask': function(e) {
    // update the task name & description
    e.preventDefault();
    if (Meteor.user()) {
        var userid = $("#userid").val();
        if (userid == Meteor.userId()) { // this timesheet belongs to the logged user
            var title = $(e.target).find('[name=title]').val().trim();
            var description = $(e.target).find('[name=description]').val().trim();
            var taskid = $(e.target).find('[name=pos]').val().trim();
            Meteor.call('updateTask', Meteor.userId(), taskid, title, description);
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
        var userid = $("#userid").val();
        if (userid == Meteor.userId()) { // this timesheet belongs to the logged user
            var title = $(e.target).find('[name=title]').val().trim();
            Meteor.call('updateTitle', Meteor.userId(), title);
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
        var userid = $("#userid").val();
        if (userid == Meteor.userId()) { // this timesheet belongs to the logged user
            var start = $(e.target).find('[name=start]').val().trim();
            var date = new Date (Date.parse(start));
            Meteor.call('updateStart', Meteor.userId(), date);
        }
    }
    $("#editstart").modal('hide');
}
});
