Router.configure({
    layoutTemplate: 'layout',
    notFoundTemplate: 'notFound',
    loadingTemplate: 'loadingdata'
});


Router.route('/about', function () {
    this.render('about'); 
});


Router.route('/', function () {
	var message = Session.get('displayMessage'); // may be null
    this.render('home', {data: {displayMessage:message} });
});

Router.route('/join', function () {
	if (Meteor.user()) Router.go('/'); // already logged in
    this.render('editprofile');
});

Router.route('/profile', function () {
	// edit your own profile
	if (!Meteor.user()) Router.go('/login'); 
    this.render('editprofile');
});

Router.route('/login', function () {
	if (Meteor.user()) Router.go('/'); // already logged in
    this.render('login');
});

Router.route('/logout', function () {
	Meteor.logout();
	Router.go('/');
});

Router.route('/users/:page?', function () {
	// user list with paging
	var curPage = (this.params.page)?this.params.page:1;
	Session.set('curPage',curPage);
    this.render('allUserData');
});


Router.route('/user/:username', function() {
	// view user profile
	var username = this.params.username;
	var user = Meteor.users.findOne({username:username});
	if (user) {
		this.render('userProfile',{data:{user:user}});
	}
	else {
		this.render('userNotFound');
	}
});

Router.route('/reset-password/:token?', {
	data: function () {
		if (!this.params.token) Router.go('/'); // token is missing in the url
		var token = this.params.token;
		var me = this; // otherwise render functions do not work inside meteor call callback
		Meteor.call("findToken",token, function(err, result) {
			if (result) {
				me.render('resetPassword', {data:{resetToken:token}});
			}
			else {
				me.render('login', {data:{invalidToken:true}});
			}
		}); // end meteor call
	} // end data 
	
});

Router.route('/reset', function () {
	this.render('askForReset');
});

Router.route('/verify-email/:token?', {
	data: function () {
		if (!this.params.token) Router.go('/'); // token is missing in the url
		var token = this.params.token;
		var me = this; // otherwise render functions do not work inside meteor call callback
		Meteor.call("findTokenEmail",token, function(err, result) {
			if (result) {
				Accounts.verifyEmail(token, function(err, result) {
					setDisplayMessage("Thank you for verifying your email.");
					Router.go('/'); // email is verified
				});
			}
			else {
				setDisplayMessage("Email verification token is invalid or expired.");
				Router.go('/');
			}
		}); // end meteor call
	} // end data 
	
});


Router.route('/challenge/:challenge/:username', function() {
// view the challenge sheet
	var username = this.params.username;
	var challenge = this.params.challenge;
	Session.set("challenge",challenge); 
	var user = Meteor.users.findOne({username:username});
	if (user) {
		Session.set("userid",user._id);
		this.render('sheet');
	}
	else {
		this.render('userNotFound', {data: {username:username}});	
	}
});


Router.route('/delete/challenge/:challenge/:userid', function() {
// view the challenge sheet
	var userid = this.params.userid;
	var challenge = this.params.challenge;
	Meteor.call("deleteChallenge",userid,challenge,function(err,result) {
		if (!err) {
			setDisplayMessage("Challenge deleted.");
		}
		else console.log(err);
		Router.go('/');	
	});
});



// server methods used in the process of user registration to avoid duplicate usernames and emails


Router.route( "/validateusername/:name?", function() {
/* a server method to validate username (check if it exists)
	because findUserName call is only available on the server - it checks the usernames case-independently 
	regular Mongo query is case-dependent
	and it's not possible to use async calls with the regular validator.js custom callbacks
*/
	var curname = this.params.name; // current user's name if the user is logged in
  	var params = this.params.query;
  	var username = params["inputUsername"];	  
  	var ret;
  	if (curname == username) { // user is logged in, and it's his own name - no change needed (alternatively both are empty)
  		ret = null; 
  	}
  	else {
		ret = Meteor.call('findUserName',username);  
	}
	if (ret) {
		this.response.statusCode = 418; // user already exists! validation fail: return any 4xx code
		this.response.end( "user already exists" );
	}
	else {
		this.response.statusCode = 200;  //it's ok, return 200
		this.response.end( "user ok");		
	}
	
}, { where: "server" });

Router.route( "/validateemail/:email?", function() {
/* a server method to validate email (we only use 1 email per user)
*/
	var curemail = this.params.email; // current user's email if the user is logged in
  	var params = this.params.query;
  	var email = params["inputEmail"];	  
  	var ret;
  	if (curemail == email) { // user is logged in, and it's his own email
  		ret = null; 
  	}
  	else {
		ret = Meteor.call('findUserEmail',email);  
	}
	if (ret) {
		this.response.statusCode = 418; // user already exists! validation fail: return any 4xx code
		this.response.end( "user already exists" );
	}
	else {
		this.response.statusCode = 200;  //it's ok, return 200
		this.response.end( "user ok");		
	}
	
}, { where: "server" });
