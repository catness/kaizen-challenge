
Accounts.onLogin( () => {
	// perform housekeeping every time when the user logins
  var userid = Meteor.userId();
  if (!Meteor.user().profile.image) {
    AvatarManager.setUserAvatar(Meteor.user());
  }
  Meteor.call("setLastLogin");
  Meteor.call("getTheme", function(error,theme) {
    if (!error) {
      if (theme) set_theme(theme);
    }
  });
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
    },
      // user's display name 
    userRealname:function() {
      var user = Meteor.user();
      return user.profile.name;
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
        Meteor.call("updateTheme",theme);
      }
    }   
  });
