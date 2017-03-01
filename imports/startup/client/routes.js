FlowRouter.route('/', {
  name: 'Kadmin.show',
  action: function() {
    BlazeLayout.render('adminLayer', {});
  }
});

FlowRouter.route('/k-manage/', {
  name: 'Kmanage.show',
  action: function() {
    BlazeLayout.render('managerAdmin', {});
  }
});

FlowRouter.notFound = {
  name: 'NotFound.show',
  action: function() {
    console.log("no encontrado");
    // TO DO: template notFound
    // BlazeLayout.render('notfound',{});
  }
};