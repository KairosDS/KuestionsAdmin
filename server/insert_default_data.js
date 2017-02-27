Meteor.startup(function() {
    if (!Adminusers.find().fetch().length) {
        Adminusers.insert( {user:'manu.fosela',name:'Mánu'} );
        Adminusers.insert( {user:'alicia.estaban',name:'Alicia Esteban'} );
        Adminusers.insert( {user:'lorena.mata',name:'Lorena Mata'} );
        Adminusers.insert( {user:'elisa.colina',name:'Elisa Colina'} );
    }

    if (!Kcode.find().fetch().length) {
        Kcode.insert({"code": "demotest", "user": "", "volatile": false, "talento": "PRUEBA"});
    }

    if (!TestsGroup.find().fetch().length) {
        TestsGroup.insert({ testgroup:"javascript", "name": "js", "img": "img/js.svg", "description": "¿Eres un front-end developer?. ¿Te gusta node? ¿Javascript te pone? ¿Te molan lo web components y Polymer? Estos son tus tests." });
        TestsGroup.insert({ testgroup:"friki", "name": "fk", "img": "img/friki.svg", "description": {"es": "¿Quieres subir nota? ¿Eres un friki y te mola demostrarlo? Este test es para completar alguno de los otros dos. Son preguntas con un cierto toque diferente. ¿Te atreves? ;)"} });
        TestsGroup.insert({ testgroup: "java", "name": "java", "img": "img/java.png", "description": "Con Java empecé y con Java terminaré, aunque entre medias me pongan otros retos yo controlo de Backend en Java. Así que te lo demostraré en mi test" });
        TestsGroup.insert({ testgroup: "arquitecto", "name": "qa", "img": "img/qa.svg", "description": "Si tu perfil es de alguien que sabe de arquitectura tecnológica, de metodologías ágiles, cuidas la calidad, se preocupa por la integración continua, sigue los principios SOLID... estos son tus tests" });
        TestsGroup.insert({ testgroup: "design", "name": "hc", "img": "img/design.svg", "description": "¿Eres un apasionado del diseño web? ¿Responsive y Adaptative es tu obsesion? ¿CSS3 no tiene secretos para ti? ¿HTML5 y tú sois uno? ¡Este es tu test!" });
    }

    if (!Tests.find().fetch().length) {
        Tests.insert({ "title": "Eres un friki de la Programación?", "name": "friki", "QRand": false, "ARand": false, "testgroup": "fk", "percent": "100" });
        Tests.insert({ "title" : "Javascript para Padawans", "name" : "javascript1", "QRand" : false, "ARand" : false, "testgroup": "js", "percent": "30" });
        Tests.insert({ "title" : "Javascript para Jedis", "name" : "javascript2", "QRand" : false, "ARand" : false, "testgroup": "js", "percent": "50" });
        Tests.insert({ "title" : "Javascript para Yoda", "name" : "javascript3", "QRand" : false, "ARand" : false, "testgroup": "js", "percent": "15" });
        Tests.insert({ "title" : "Polymer", "name" : "polymer", "QRand" : false, "ARand" : false, "testgroup": "js", "percent": "5" });
        Tests.insert({ "title" : "HTML/CSS", "name" : "design", "QRand" : false, "ARand" : false, "testgroup": "hc", "percent":"100" });
        Tests.insert({ "title" : "Java", "name" : "java1", "QRand" : false, "ARand" : false, "testgroup": "java", "percent":"100" });
    }
})