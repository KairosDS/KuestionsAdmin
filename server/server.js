if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    Answers.allow({
      remove:function(userId,doc){
        return true;
      }
    });
    UploadServer.init({
      tmpDir: process.env.PWD + '/KuestionsUploads/tmp',
      uploadDir: process.env.PWD + '/KuestionsUploads/',
      checkCreateDirectories: false,
      finished: function(fileInfo) {
        console.log("fichero subido..." + fileInfo.name );
      },
      cacheTime: 100,
      mimeTypes: {
          "json": "application/json"
      }
    });
  });

  Meteor.methods({
    recalcResults: function(args){
      console.log( "Recalculando resultado para usuario " + args.userTest );
      // Calc score
      var userTest = args.userTest,
          r = Answers.find({"user":args.userTest}).fetch(),
          idType = ( Kuestions.find( { _id: { $type: 2 } } ).count() > 0 ),
          objId = new Meteor.Collection.ObjectID(), 
          result = 0;
      console.log( "ANSWER USER+TEST: " + args.userTest );
      for ( i=0; i<r.length; i++ ){
        var id = r[i].answerID,
            oid , a;
        if (idType) { oid = id; } else { objId._str = id; oid = objId; }
        a = Kuestions.findOne({_id:oid}).answers;
        obj = _.find( a, function(obj) { return ( obj.text === r[i].answerTXT ); } );
        console.log( "id:" + oid + " a:" + a + "   |  "+obj.text + " === " + r[i].answerTXT );
        result += parseInt( obj.value );
        console.log( obj.value + " --> " + result );
      }
      // Time
      timeToComplete = 0;
      // Guardamos en result

      //if ( !Results.find( { "user":args.userTest } ).count() ) {
        var total = Answers.find({user:args.userTest}).count();
        //Results.update( { "user":args.userTest }, { $set: { "score":result + " de " + total } } );
        console.log( "Recalc result: " + result + " de " + total + " " + args.userTest );  
        r = Results.update( { "user":args.userTest }, { $set: {"score":result + " de " + total} } ); 
        return {result:r, recalc:"OK"};
      //} else {
      //  return "Este test ya lo realizaste y no es posible hacerlo mas de una vez. Si lo superaste nos pondremos en contacto contigo. Muchas gracias!";
      //}
    },
    delUserTest: function( args ) {
      var id = args.id,
          user_test = Results.find({_id:id}).fetch()[0].user;
      Results.remove({_id:id});
      var answerListToDel = Answers.find({user:user_test}).fetch();
      for ( var i=0; i<answerListToDel.length;i++) {
        Answers.remove({_id:answerListToDel[i]._id});  
        console.log( "Delete answer " + answerListToDel[i]._id + " from user "+ id );
      }
      Answers.remove({user:Meteor.userId()});
      return { ok:true, n:answerListToDel.length };
    }
  });
}