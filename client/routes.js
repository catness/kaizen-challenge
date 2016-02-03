Router.configure({
    layoutTemplate: 'layout',
    notFoundTemplate: 'notFound'
});


Router.route('/about', function () {
    this.render('about', {
        to:"main"
    });
});

Router.route('/', function() {
	Session.set("userid",Meteor.userId());
    this.render('sheet', {
        to: "main"
    });    
}); 


Router.route('/user/:username?', {
	// show another user's sheet, but do not edit
	data: function() {
		if (Session.get("ready")) {
			var username = this.params.username;
			console.log("username="+username+"=");
			var user = Meteor.users.findOne({username:username});
			if (user) {
				var userid = user._id;
				Session.set("userid",userid);
			}
			else {
				this.render('UserNotFound', {
					to: "main",
					data: {username:username}
				});
				return;
			}
		}
		this.render('sheet', {
        	to: "main"
	    }); 
	}

});