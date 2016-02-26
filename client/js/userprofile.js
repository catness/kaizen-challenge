// user profile functions (register, login and edit profile)

Template.editprofile.helpers({
  emailRequired:function() {
    // show email in the template only for the new user OR an existing user who has "emails" field in DB
    var u = Meteor.user();
    return (!u || u.emails); 
  },
  user:function() {
    var u = Meteor.user();
    var username = '';
    var email = '';
    var emailNotVerified = 0; // if user is not logged in, emailNotVerified is false, to avoid showing verification messages
    if (u) {
      //username = u.username;
      if (u.emails) {
        u.email = u.emails[0].address;
        u.emailNotVerified = (u.emails[0].verified)?0:1;
      } 
    }
    else {
      u =  {username:'', email:'', emailNotVerified:0 };
    }
    return u;
  }
})


// options for the form validator
var options = {
  custom: {
    passwordlength: function($el) {
      var value = $el.val();
      var reg = /^\s*$|^\S{6,}$/;  // either an empty string, or a string >= 6 char length
      if (reg.test(value)) {
        return true;
      }
      else {
        return false;        
      }
    }
  },
  errors: {
    userunique: "Username already exists",
    passwordlength: "Password is too short: must be at least 6 characters"
  }  
};


Template.editprofile.onRendered(function () {
  // initialize the form validator
  $('#form-editprofile').validator(
    options
  );
});


Template.editprofile.events({
  // this is used both for edit profile and for register new user
  'submit #form-editprofile' : function(e, t) {
    e.preventDefault();
    var email = (t.find('#inputEmail'))?t.find('#inputEmail').value:'';
    var password = (t.find('#inputPassword'))?t.find('#inputPassword').value:'';
    var username = t.find('#inputUsername').value;
    var name = t.find('#inputRealname').value;
    var homepage = (t.find('#inputHomepage'))?t.find('#inputHomepage').value:'';
    var bio = (t.find('#inputBio'))?t.find('#inputBio').value:'';
    // Trim and validate the input

    var profile = {name:name, homepage:homepage, bio:bio};
    var user = Meteor.user();
    if (user) {
      var userid = user._id;
      var ret = Meteor.call("updateUser", userid, username, password, email, profile, function(err, ret) {
        // later
        Router.go("/");
      });
    }
    else {
      Accounts.createUser({username:username, email:email, password:password,profile:profile}, function(err){
        if (err) {
          // Inform the user that account creation failed
          alert("Account creation failed");
        } else {
          // Success. Account has been created and the user
          // has logged in successfully. 
          var userid = Meteor.userId();
          Router.go("/");
        }

      });
    } 
    return false;
  }, 
  'click #send-verification-email': function(e,t) {
    Meteor.call("sendVerificationEmail", Meteor.user()._id, function(err) {
      $('#send-verification-email').addClass('hidden');
      $('#verification-email-sent').removeClass('hidden');
    });
  }
  });

var login_callback = function(err) {
  if(err) {
    $('#login-failed').removeClass('hidden');  
  }
  else {
    Router.go("/"); 
  }  
}

var login_services = {
  'twitter': Meteor.loginWithTwitter,
  'facebook':Meteor.loginWithFacebook,
  'google':Meteor.loginWithGoogle,
  'github':Meteor.loginWithGithub
};

Template.login.events({
  'submit #form-login' : function(e, t) {
      e.preventDefault();
      var username = t.find('#inputUsername').value,
        password = t.find('#inputPassword').value;

      Meteor.loginWithPassword(username, password, login_callback);
      return false; 
   },
   'click .login-social': function(e,t) {
    // login with an external service
      var service=$(e.target).attr("data-service"); // name of the service
      login_services[service](login_callback);
   }
  });

Template.editprofile.events({
   'click .login-social': function(e,t) {
    // login with an external service
      var service=$(e.target).attr("data-service"); // name of the service
      login_services[service](login_callback);
   }
});


Template.askForReset.events({
  // user asks to reset password: send email with the link
  'submit #recovery-form' : function(e, t) {
    e.preventDefault();
    var email = t.find('#recovery-email').value.trim();
    if (email != '') {
      Session.set('loading', true);
      Accounts.forgotPassword({email: email}, function(err){
        if (err) {
          var message = err["reason"];
          $('#reset-error-message-content').text(message);
          $('#reset-error-message').removeClass('hidden');
        }
        else {
          setDisplayMessage("Email to " + email + " is sent - please check your mailbox.");
          Router.go("/");
        }
        Session.set('loading', false);
      });
    }
    return false; 
  }
});

Template.resetPassword.events({
// the actual password resetting (after clicking on the recovery link and getting the reset token)
  'submit #reset-password' : function(e, t) {
    e.preventDefault();
    var password = t.find('#new-password').value.trim();
    var token = t.find('#reset-token').value;

    if (password.length<6) {
      $('#reset-error-message-content').text("Password is too short.");
      $('#reset-error-message').removeClass('hidden');  
      return false;
    }
    Session.set('loading', true);
    Accounts.resetPassword(token, password, function(err){
      if (err) {
        var message = err["reason"];
        $('#reset-error-message-content').text(message);
        $('#reset-error-message').removeClass('hidden');
      }
      else {
        setDisplayMessage("Success - password reset!");
        Router.go("/");
      }
      Session.set('loading', false);
    });
    
    return false; 
  }
});


Template.userProfile.helpers({
  user: function() {
    var user = this.user;
    user.isEditable = (user._id == Meteor.userId());
    return user;
  },
  challengeExists: function(challenge, userid) {
    var ret = (Tasks.findOne( { $and:[{userid:userid}, {challenges: {$elemMatch: {challenge:challenge }}} ]} ))?true:false;
    return ret;
  }
});


Template.userProfile.events({
  'click .hide-user': function(e) {
    var userid = $(e.target).attr("data-user"); 
    var hide = ($(e.target).attr("data-hide")=='true')?true:false;
    Meteor.call("hideUser",userid,hide);
  },
  'click .delete-user':function(e) {
    var userid = $(e.target).attr("data-user");  
    Meteor.call("deleteUser",userid);
  } 
});