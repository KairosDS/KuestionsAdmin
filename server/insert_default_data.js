Meteor.startup(function () {
    if ( !Adminusers.find().fetch().length ) {
        Adminusers.insert( {user:'manu.fosela',name:'Mánu'} );
        Adminusers.insert( {user:'alicia.estaban',name:'Alicia Esteban'} );
        Adminusers.insert( {user:'lorena.mata',name:'Lorena Mata'} );
        Adminusers.insert( {user:'elisa.colina',name:'Elisa Colina'} );
    }

    if ( !Kcode.find().fetch().length ) {
        Kcode.insert({"code" : "demotest", "user" : "", "volatile" : false, "talento" : "PRUEBA"});
    }
})