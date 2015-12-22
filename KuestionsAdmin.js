Kuestions = new Mongo.Collection("kuestions");
Answers =   new Mongo.Collection("answers");
Results =   new Mongo.Collection("results");
//Users   =   new Mongo.Collection("users");
KTeam   =   new Mongo.Collection("kteam");
Tests   =   new Mongo.Collection("tests");


if (Meteor.isClient) {
  Session.set( "kuestionsFilter", "{}");
  Session.set( "resultsFilter", "{}");
  Session.set( "db", "Tests" );

  $.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
  };

  var updateFn = function( e ){
    var code = e.keyCode || e.which;
    if(code == 13) {
      var elP = $(event.target.parentElement),
          id = elP.attr("id"),
          field = $(event.target).attr("data-field"),
          value = $(event.target).html(),
          setdb = {};
      id = resolvId(id);
      if ( typeof id == "undefined" ){
        id = elP.parent().parent().parent().parent().attr("id");
        setdb = { answers: getAnswers( elP ) };
      } else {
        setdb[field]=value;
      }
      $(event.target).blur();
      if ( window[Session.get("db")].update({_id:id}, {$set: setdb}) ) {
        $(event.target).html("");
        elP.attr("data-content", "Actualización correcta");
      } else {
        elP.attr("data-content", "Hubo un problema actualizando.");
      }
      elP.popover("show");
      setTimeout( function() { elP.popover("hide"); },1000);
      return false;
    }
  };

  var resolvId = function(id){
    var patt = new RegExp("ObjectID");
    if ( patt.test(id) ) {
      id = id.replace("ObjectID(\"","").replace("\")","");
      oid = new Meteor.Collection.ObjectID();
      oid._str = id;
      id = oid;
    }
    return id;
  };

  var getAnswers = function( elP ) {
    var tr = elP.parent().children(), td, i, j, a = [];
    for ( i=0; i<tr.length; i++ ){
      td = $(tr[i]).children();
      if ( $(td[0]).text() !== "" ) {
        a[i] = { text: $(td[0]).text(), value: $(td[1]).text() };
      }
    }
    return a;
  };

  var selectRow = function () {
    $(event.target.parentElement).parent().children().removeClass("alert alert-success");
    $(event.target.parentElement).addClass("alert alert-success");
  };

  Template.main.events({
    'click a[data-toggle="tab"]': function() {
      setTimeout( function(){
        var db = $("[role=tablist] li.active").text();
        Session.set("db",db);
      }, 100);
    }
  });

  Template.admin_tests.helpers({
    testList: function() {
      // De las kuestions un group by: Object.keys( _.groupBy(_.pluck(Kuestions.find({}).fetch(), 'test')) );
      // ahora tiene su propia tabla
      return Tests.find({}).fetch();
    }
  });
  Template.admin_tests.events({
    'click tr': selectRow,
    'keypress td': updateFn,
    'click .deltest':function(){
      var elP = $(event.target.parentElement).parent(),
          id = elP.attr("id");
      $('#alertModal')
        .modal({ backdrop: 'static', keyboard: false })
        .one('click', '.delsure', function() {
          Tests.remove({_id:id});
          $('#alertModal').modal("hide");
        });
    }
  });

  Template.admin_kuestions.helpers({
    kuestionsList : function () {
      return Kuestions.find({}).fetch();
    },
    kuestionsFieldNames: function(){
      var fields = Kuestions.findOne();
      return ( fields )?Object.keys( fields ):[];
    }
  });
  Template.admin_kuestions.events({
    'click tr': selectRow,
    'keypress td': updateFn
  });

  Template.admin_results.helpers({
    resultsList : function () {
      return Results.find({}).fetch();
    },
    resultsFieldNames: function(){
      var fields = Results.findOne();
      return ( fields )?Object.keys( fields ):[];
    }
  });
  Template.admin_results.events({
    'click tr': selectRow,
    'keypress td': updateFn,
    'click .deluser':function(){
      var elP = $(event.target.parentElement).parent(),
          id = elP.attr("id");
      $('#alertModal')
        .modal({ backdrop: 'static', keyboard: false })
        .one('click', '.delsure', function() {
          var user_test = Results.find({_id:id}).fetch()[0].user;
          Results.remove({_id:id});
          var answerListToDel = Answers.find({user:user_test}).fetch();
          for ( var i=0; i<answerListToDel.length;i++) {
            Answers.remove({_id:answerListToDel[i]._id});  
            console.log( "Delete answer " + answerListToDel[i]._id + " from user "+ id );
          }
          $('#alertModal').modal("hide");
        });
    },
    'click .recalcresult':function(){
      Meteor.call( 
        "recalcResults", 
        {userTest:this.user}, 
        function( err, response ) { 
          if ( err) { console.log( err, response ); 
          } else { 
            console.log( "RECALCULATED" );
          }
        }
      ); 
    },
    'click .showuser': function(){
      Session.set( "answers_id", this._id );
      Session.set( "answers_username", this.username );
      Session.set( "answers_email", this.email );
      Session.set( "answers_score", this.score );
      Session.set( "answers_time", this.time );
      Session.set( "answers_test", this.user.substring(17) );
      Session.set( "answers_testId", this.user );

      $('#showUserModal').modal({ backdrop: 'static', keyboard: false });
    }
  });

  Template.showUserModal.helpers({
    username: function(){
      return Session.get("answers_username");
    },
    id: function(){
      return Session.get("answers_id");
    },
    email: function(){
      return Session.get("answers_email");
    },
    score: function(){
      return Session.get("answers_score");
    },
    time: function(){
      return Session.get("answers_time");
    },
    test:function(){
      return Session.get("answers_test");
    },
    testId: function(){
      return Session.get("answers_testId" );
    },
    answersFieldNames: function(){
      var fields = Answers.findOne();
      return ( fields )?Object.keys( fields ):[];
    },
    userAnswers: function(){
      var a = Answers.find({"test":Session.get( "answers_test"), "user":Session.get("answers_testId")}).fetch(),
          b = Kuestions.find({"test":Session.get( "answers_test")}).fetch(),
          c = [];
      for( var i=0; i<a.length; i++ ) {
        c[i] = {};
        c[i].question = b[i].question || "";
        c[i].answerOK = b[i].answers.map(function(a){ return ( a.value==1 )?a.text:""; } ).join( "" ) || "";
        c[i].answerTXT = a[i].answerTXT || "";
        c[i].correcto = (c[i].answerOK == c[i].answerTXT && c[i].answerOK !== "")?"success":"danger";
      }
      return c;
    }
  });

  Template.admin_team.helpers({
    teamList : function () {
      return KTeam.find().fetch();
    },
    teamFieldNames: function(){
      var fields = KTeam.findOne();
      return ( fields )?Object.keys( fields ):[];
    }
  });
  Template.admin_team.events({
    'click tr': selectRow,
    'keypress td': updateFn
  });

  Template.admin_json.helpers({
    uploaded:function(){
      return {
        finished:function( index,fileInfo,context){
          console.log( "TERMINO" );
          Session.set( "jsonFileName", fileInfo );
        }
      };
    },
    json_filename:function(){
      var jf = Session.get("jsonFileName");
      if ( jf !== "" ) {
        $("#uploadLayer").show();
        $("#loaddbLayer").hide();
      } else {
        $("#uploadLayer").hide();
        $("#loaddbLayer").show();
      }
      return jf;
    }
  });

  Template.insertModal.helpers({
    db: function() {
      return Session.get("db");
    },
    dbTests: function(){
      return ( Session.get("db")=="Tests");
    },
    dbKuestions: function(){
      return ( Session.get("db")=="Kuestions");
    },
    dbTeam: function(){
      return ( Session.get("db")=="Kairos Team");
    }
  });
  Template.insertModal.events({
    'click .save': function(){
      var values = $( "#insertForm" ).serializeObject();
      //console.log( values );
      window[Session.get("db")].insert( values );
      $('[data-dismiss="modal"]').trigger("click");
      $('#insertForm').trigger("reset");
    }
  });

  Template.navbar.helpers({
    showInsert: function() {
      return ( !( Session.get("db") == "Results" || Session.get("db") == "Tests" )  );
    }
  });
  Template.navbar.events({
    'click .insert': function( e ){
    }
  });
}