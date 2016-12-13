Meteor.publish("kuestions", function () {
  return Kuestions.find({});
});
Meteor.publish("answers", function () {
  return Answers.find({});
});
Meteor.publish("kteam", function () {
  return KTeam.find({});
});
Meteor.publish("tests", function () {
  return Tests.find({});
});
Meteor.publish("ranking", function () {
  return Ranking.find({});
});
Meteor.publish("timecounter", function () {
  return TimeCounter.find({});
});
Meteor.publish("results", function () {
  return Results.find({});
});
Meteor.publish("kcode", function(){
  return Kcode.find({});
})
Meteor.publish('files.json.all', function () {
  return Json.find().cursor;
});


if (Meteor.isServer) {
  Meteor.startup(function() {

    // code to run on server at startup
    Answers.allow({
      remove: function(userId, doc) {
        return true;
      }
    });
    KTeam.allow({
      update: function(userId, doc) {
        return true;
      },
      insert: function(userId, doc) {
        return true;
      }
    });

/*    UploadServer.init({
      tmpDir: process.env.PWD + '/KuestionsUploads/tmp',
      uploadDir: process.env.PWD + '/KuestionsUploads/',
      checkCreateDirectories: false,
      finished: function(fileInfo) {
        console.log("fichero subido..." + fileInfo.name);
      },
      cacheTime: 100,
      mimeTypes: {
        "json": "application/json"
      }
    });*/
  });

  var closeAllUserSessions = function(userId) {
    var sessions = _.filter(Meteor.default_server.sessions, function(session) {
      return session.userId == userId;

    });
    _.each(sessions, function(session) {
      session.connectionHandle.close();
    });
  };

  Accounts.onLogin(function(user) {
    var userId = user.user._id;
    var userEmail = user.user.services.google.email;
    var domain = userEmail.split("@")[1];
    if (domain !== "kairosds.com" && domain !== "kairosds.es") {
      console.log(userEmail + "("+domain+") no es de KAIRÓS");
      closeAllUserSessions(userId);
    }
  });

  Meteor.methods({
    recalcResults: function(args) {
      console.log("Recalculando resultado para usuario " + args.userTest);
      // Calc score
      var userTest = args.userTest,
        test = userTest.substr(17),
        kuestionsIDs = Kuestions.find({
          test: test
        }, {
          field: "id"
        }).fetch().map(function(a) {
          return a._id.toString().replace("ObjectID(\"", "").replace("\")", "");
        }),
        r = Answers.find({
          "user": args.userTest
        }, {
          answerID: {
            $in: kuestionsIDs
          }
        }).fetch(),
        idType = (Kuestions.find({
          _id: {
            $type: 2
          }
        }).count() > 0),
        objId = new Meteor.Collection.ObjectID(),
        result = 0;
      //console.log( kuestionsIDs );
      console.log("ANSWER USER+TEST: " + args.userTest);
      Answers.remove({
        "user": args.userTest,
        answerID: {
          $nin: kuestionsIDs
        }
      });
      for (i = 0; i < r.length; i++) {
        var id = r[i].answerID,
          oid, a;
        if (idType) {
          oid = id;
        } else {
          objId._str = id;
          oid = objId;
        }
        a = Kuestions.findOne({
          _id: oid
        }).answers;
        obj = _.find(a, function(obj) {
          return (obj.text === r[i].answerTXT);
        });
        console.log("id:" + oid + " a:" + a + "   |  " + obj.text + " === " + r[i].answerTXT);
        result += parseInt(obj.value);
        console.log(obj.value + " --> " + result);
      }
      // Time
      timeToComplete = 0;
      // Guardamos en result

      // RECALC RANKING
      Meteor.call("calcAllRankings", {}, function(err, response) {
        console.log(response);
      });

      //if ( !Results.find( { "user":args.userTest } ).count() ) {
      var total = Answers.find({
        user: args.userTest
      }).count();
      //Results.update( { "user":args.userTest }, { $set: { "score":result + " de " + total } } );
      console.log("Recalc result: " + result + " de " + total + " " + args.userTest);
      r = Results.update({
        "user": args.userTest
      }, {
        $set: {
          "score": result + " de " + total
        }
      });
      return {
        result: r,
        recalc: "OK"
      };
      //} else {
      //  return "Este test ya lo realizaste y no es posible hacerlo mas de una vez. Si lo superaste nos pondremos en contacto contigo. Muchas gracias!";
      //}
    },

    delUserTest: function(args) {
      var id = args.id,
        user_test = Results.find({
          _id: id
        }).fetch()[0].user;
      var user = user_test.substring(0,17);
      var test = user_test.substring(17);
      Results.remove({
        _id: id
      });
      console.log('Delete results from id ' + id);
      TimeCounter.remove({
        user:user,
        test:test
      });
      console.log('Delete TimeCounter from ' + user + ' to test ' + test);
      var answerListToDel = Answers.find({
        user: user_test
      }).fetch();
      for (var i = 0; i < answerListToDel.length; i++) {
        Answers.remove({
          _id: answerListToDel[i]._id
        });
        console.log("Delete answer " + answerListToDel[i]._id + " from user " + id);
      }
      Answers.remove({
        user: Meteor.userId()
      });
      console.log('Delete Answers from user ' + Meteor.userId());
      return {
        ok: true,
        n: answerListToDel.length
      };
    },

    deleteKcode: function(args) {
      var id = args.id;
      return Kcode.remove({_id:id});
    },

    calcAllRankings: function(args) {
      var res, username, rt, el, test, s, rN;
      var percents = {
        "javascript1": 35,
        "javascript2": 60,
        "polymer": 5,
        "Arquitecto": 100,
        "Testing": 100,
        "design": 100,
        "friki": 100
      };
      var resName = {
        "javascript1": "js",
        "javascript2": "js",
        "polymer": "js",
        "Arquitecto": "qa",
        "Testing": "tg",
        "design": "hc",
        "friki": "fk"
      };

      var u = Results.find({}).fetch();
      var users = Object.keys(_.groupBy(_.pluck(u, 'username')));

      for (var j = 0; j < users.length; j++) {
        username = users[j];
        res = Results.find({
          "username": username
        }).fetch();
        rt = {
          "js": 0,
          "qa": 0,
          "tg": 0,
          "hc": 0,
          "fk": 0
        };
        for (i = 0; i < res.length; i++) {
          el = res[i];
          test = el.user.substr(17);
          s = el.score.split(" de ");
          rN = resName[test];
          rt[rN] += Math.floor(100 * percents[test] * s[0] / s[1], 2) / 100;
        }
        Ranking.upsert({
          username: username
        }, {
          username: username,
          result_js: rt.js.toFixed(2),
          result_qa: rt.qa.toFixed(2),
          result_tg: rt.tg.toFixed(2),
          result_hc: rt.hc.toFixed(2),
          result_fk: rt.fk.toFixed(2)
        });
      }
      return "-> " + users.length;
    },

    generate_code: function(args) {
      var user = args.user;
      var now = new Date().getTime()
      var code = CryptoJS.MD5(now+user+'Kuestions').toString();
      //console.log(user,now,code);
      Kcode.insert({code:code, user:"", volatile: true, talento: Meteor.user().profile.name });
      return code;
    }
  });
}
