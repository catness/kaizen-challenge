// display list of users with paging
Template.registerHelper('formatDate', function(date) {
  return moment(date).format('YYYY-MM-DD');
});

Template.allUserData.helpers({
  users: function() {
    var totalCount = Meteor.users.find({}).count();
    Session.set('totalCount',totalCount);
    var skipCount = (Session.get("curPage") - 1) * recordsPerPage;
    var users = Meteor.users.find({}, {
      limit: recordsPerPage,
      skip: skipCount,
      sort: {"lastLogin":-1,"profile.name":1}
    }).fetch();
    return users;
  },
  lastChallenge: function(userid) {
    var challenges = Tasks.findOne( {userid:userid} ).challenges;
    var last = challenges.pop();
    return last;
  }
})
// this is how to find the challenges the user participates in
// db.tasks.findOne( {userid:"LhvQT5xH78ytZ4Lqx"}, {"challenges.challenge":1});

var hasMorePages = function() {
  var totalCount = Session.get('totalCount');
  return currentPage() * parseInt(recordsPerPage) < totalCount;
}

var currentPage = function() {
  return parseInt(Router.current().params.page) || 1; 
}

Template.pager.helpers({
  curPage:function() {
    return currentPage();
  },
  totalPages:function() {
    var totalCount = Session.get("totalCount");
    var totalPages = (totalCount <= recordsPerPage)?1: Math.ceil(totalCount/recordsPerPage);
    return totalPages;
  },
  prevPage: function() {
    var previousPage = currentPage() === 1 ? 1 : currentPage() - 1;
    //return Router.routes.listWebsites.path({page: previousPage});
    return "/users/" + previousPage;
  },
  nextPage: function() {
    var nextPage = hasMorePages() ? currentPage() + 1 : currentPage();
    //return Router.routes.listWebsites.path({page: nextPage});
    return  "/users/" + nextPage;
  },
  firstPage: function() {
    //return Router.routes.listWebsites.path({page: 1});  
    return "/users";
  },
  lastPage: function() {
    var totalPages = (Session.get("totalCount") <= recordsPerPage)?1: Math.ceil(Session.get("totalCount")/recordsPerPage);      
//    return Router.routes.listWebsites.path({page: totalPages}); 
    return "/users/" + totalPages;
  },
  prevPageClass: function() {
    return currentPage() <= 1 ? "disabled" : "";
  },
  nextPageClass: function() {
    return hasMorePages() ? "" : "disabled";
  }
});
