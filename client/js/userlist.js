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
      sort: {"lastLogin":-1} // no need to sort also by name because lastLogin is in secs => different for everyone
    }).fetch();
    return users;
  },
  lastChallenge: function(userid) {
    //var last = Tasks.findOne({userid:userid},{$orderby:{timestamp:-1}}); // doesn't work: orderby is ignored
    var last = Tasks.findOne({userid:userid},{sort:{timestamp:-1},limit:1});
    return last;
  }
})

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
