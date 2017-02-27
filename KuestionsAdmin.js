Kuestions = new Mongo.Collection("kuestions");
Answers = new Mongo.Collection("answers");
Results = new Mongo.Collection("results");
Ranking = new Mongo.Collection("ranking");
KTeam = new Mongo.Collection("kteam");
Tests = new Mongo.Collection("tests");
TestsGroup = new Mongo.Collection("testsgroup");
TimeCounter = new Mongo.Collection("timecounter");
Kcode = new Meteor.Collection("kcode");
Adminusers = new Meteor.Collection("adminusers");

Json = new FilesCollection({
  collectionName: 'Json',
  allowClientCode: false, // Disallow remove files from Client
  onBeforeUpload: function (file) {
    // Allow upload files under 10MB, and only in png/jpg/jpeg formats
    if (file.size <= 2097152 && /json/i.test(file.extension)) {
      return true;
    } else {
      return 'Solo se pueden subir archivos JSON, con un tamaño menor o igual a 2MB';
    }
  }
});

if (Meteor.isClient) {
  Meteor.subscribe('answers');
  Meteor.subscribe('kuestions');
  Meteor.subscribe('kteam');
  Meteor.subscribe('tests');
  Meteor.subscribe('testsgroup');
  Meteor.subscribe('ranking');
  Meteor.subscribe('timecounter');
  Meteor.subscribe('results');
  Meteor.subscribe('kcode');

  Meteor.subscribe('files.json.all');

  Session.set("kuestionsFilter", "{}");
  Session.set("resultsFilter", "{}");
  Session.set("db", "TestsGroup");
  Session.set("filter", {});
  Session.set("filterRanking", "");
  Session.set('code_generated', "");

  aDB = {
    "Kairos Team": "KTeam",
    "Kuestions": "Kuestions",
    "TestsGroup": "TestsGroup",
    "Ranking": "Ranking",
    "Results": "Results",
    "KCode": "KCode"
  };

  var firstClickDatePicker = true;
  var dynamicNumberSort = function(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }
    return function(a, b) {
      var result = (parseFloat(a[property]) < parseFloat(b[property])) ? -1 : (parseFloat(a[property]) > parseFloat(b[property])) ? 1 : 0;
      return result * sortOrder;
    };
  };

  $.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
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

  var updateFn = function(e) {
    var code = e.keyCode || e.which;
    if (code == 13) {
      var elP = $(event.target.parentElement),
        id = elP.attr("id"),
        field = $(event.target).attr("data-field"),
        value = $(event.target).html(),
        setdb = {};
      id = resolvId(id);
      if (typeof id == "undefined") {
        // NEXT LINE NEED URGENT REFACTOR!!!!!
        id = elP.parent().parent().parent().parent().attr("id");
        setdb = {
          answers: getAnswers(elP)
        };
      } else {
        setdb[field] = value;
        console.log(field,value);
      }
      $(event.target).blur();
      console.log(id, setdb);
      if (window[Session.get("db")].update({
          _id: id
        }, {
          $set: setdb
        })) {
        //$(event.target).html("");
        elP.attr("data-content", "Actualización correcta");
      } else {
        elP.attr("data-content", "Hubo un problema actualizando.");
      }
      elP.popover("show");
      setTimeout(function() {
        elP.popover("hide");
      }, 1000);
      return false;
    }
  };

  var resolvId = function(id) {
    var patt = new RegExp("ObjectID");
    if (patt.test(id)) {
      id = id.replace("ObjectID(\"", "").replace("\")", "");
      oid = new Meteor.Collection.ObjectID();
      oid._str = id;
      id = oid;
    }
    return id;
  };

  var getAnswers = function(elP) {
    var tr = elP.parent().children(),
      td, i, j, a = [];
    for (i = 0; i < tr.length; i++) {
      td = $(tr[i]).children();
      if ($(td[0]).text() !== "") {
        a[i] = {
          text: $(td[0]).text(),
          value: $(td[1]).text()
        };
      }
    }
    return a;
  };

  var selectRow = function() {
    $(event.target.parentElement).parent().children().removeClass("alert alert-success");
    $(event.target.parentElement).addClass("alert alert-success");
  };

  Template.adminLayer.events({
    'click a[data-toggle="tab"]': function() {
      setTimeout(function() {
        var db = $("[role=tablist] li.active").text();
        console.log("DB: " + db);
        Session.set("db", aDB[db]);
        Session.set("dbName", db);
      }, 100);
    }
  });

  Template.admin_tests.helpers({
    testGroupList: function() {
      // De las kuestions un group by: Object.keys( _.groupBy(_.pluck(Kuestions.find({}).fetch(), 'test')) );
      // ahora tiene su propia tabla
      console.log("tests " + TestsGroup.find({}).fetch().length);
      return TestsGroup.find().fetch();
    }
  });
  Template.admin_tests.events({
    'click tr': selectRow,
    'keypress td': updateFn,
    'click .deltest': function() {
      var elP = $(event.target.parentElement).parent(),
        id = elP.attr("id");
      $('#alertModal')
        .modal({
          backdrop: 'static',
          keyboard: false
        })
        .one('click', '.delsure', function() {
          Tests.remove({
            _id: id
          });
          $('#alertModal').modal("hide");
        });
    }
  });

  Template.admin_kuestions.helpers({
    testsAvailables: function() {
      return Tests.find({}).fetch();
    }
  });
  Template.admin_kuestions.events({
    'click tr': selectRow
  });

/*
  Template.admin_kuestions_by_test.helpers({
    kuestionsList: function() {
      return Kuestions.find({}).fetch();
    },
    kuestionsFieldNames: function() {
      var fields = Kuestions.findOne();
      return (fields) ? Object.keys(fields) : [];
    }
  });
  Template.admin_kuestions_by_test.events({
    'click tr': selectRow,
    'keypress td': updateFn
  });
*/

  Template.table_results.helpers({
    resultsList: function() {
      var condition = Session.get("filter");
      var r = Results.find(condition, {
        sort: {
          date: -1
        }
      }).fetch();
      for (var k in r) {
        r[k].userTest = r[k].user.slice(17);
        r[k].date = new Date(r[k].date).toDateString();
        r[k].time = r[k].time.toString().replace('Elapsed: ','');
      }
      return r;
    },
    resultsFieldNames: function() {
      var fields = Results.findOne();
      if (fields) {
        var keys =  Object.keys(fields);
        keys.shift();
        keys[0] = 'test';
        keys.push('responsable');
        return (fields) ? keys : [];
      }
    }
  });

  Template.admin_results.events({
    'click tr': selectRow,
    'keypress td': updateFn,
    'click .deluser': function() {
      var elP = $(event.target.parentElement).parent(),
        id = elP.attr("id");
      $('#alertModal')
        .modal({
          backdrop: 'static',
          keyboard: false
        })
        .one('click', '.delsure', function() {
          Meteor.call(
            'delUserTest', {
              id: id
            },
            function(err, response) {
              if (err) {
                console.log(err, response);
              } else {
                //console.log(response);
              }
            }
          );
          $('#alertModal').modal("hide");
        });
    },
    'click .recalcresult': function() {
      Meteor.call(
        "recalcResults", {
          userTest: this.user
        },
        function(err, response) {
          if (err) {
            console.log(err, response);
          } else {
            console.log("RECALCULATED");
          }
        }
      );
    },
    'click .showuser': function() {
      Session.set("answers_id", this._id);
      Session.set("answers_username", this.username);
      Session.set("answers_email", this.email);
      Session.set("answers_score", this.score);
      Session.set("answers_time", this.time);
      Session.set("answers_test", this.user.substring(17));
      Session.set("answers_testId", this.user);

      $('#showUserModal').modal({
        backdrop: 'static',
        keyboard: false
      });
    }
  });

  Template.admin_ranking.helpers({
    resultsList: function() {
      var R = Ranking.find({}).fetch();
      for (var k in R) {
        R[k].jsClass = (R[k].result_js > 80) ? "success" : (R[k].result_js > 60) ? "warning" : (R[k].result_js > 0) ? "danger" : "";
        R[k].qaClass = (R[k].result_qa > 80) ? "success" : (R[k].result_qa > 60) ? "warning" : (R[k].result_qa > 0) ? "danger" : "";
        R[k].tgClass = (R[k].result_tg > 80) ? "success" : (R[k].result_tg > 60) ? "warning" : (R[k].result_tg > 0) ? "danger" : "";
        R[k].hcClass = (R[k].result_hc > 80) ? "success" : (R[k].result_hc > 60) ? "warning" : (R[k].result_hc > 0) ? "danger" : "";
        R[k].frClass = (R[k].result_fk > 80) ? "success" : (R[k].result_fk > 60) ? "warning" : (R[k].result_fk > 0) ? "danger" : "";
      }
      if (Session.get("filterRanking") !== "") {
        R.sort(dynamicNumberSort(Session.get("filterRanking")));
      }
      return R;
    },
    resultsFieldNames: function() {
      var fields = Ranking.findOne({});
      return (fields) ? Object.keys(fields) : [];
    }
  });
  Template.admin_ranking.events({
    'click .resultFilter': function(e) {
      var id = e.target.id;
      if (Session.get("filterRanking") === e.target.id) {
        Session.set("filterRanking", "-" + id);
      } else if (Session.get("filterRanking") === ("-" + e.target.id)) {
        Session.set("filterRanking", "");
      } else {
        Session.set("filterRanking", id);
      }
    }
  });

  Template.showUserModal.helpers({
    username: function() {
      return Session.get("answers_username");
    },
    id: function() {
      return Session.get("answers_id");
    },
    email: function() {
      return Session.get("answers_email");
    },
    score: function() {
      return Session.get("answers_score");
    },
    time: function() {
      return Session.get("answers_time");
    },
    test: function() {
      return Session.get("answers_test");
    },
    testId: function() {
      return Session.get("answers_testId");
    },
    answersFieldNames: function() {
      var fields = Answers.findOne();
      return (fields) ? Object.keys(fields) : [];
    },
    userAnswers: function() {
      var a = Answers.find({
        "test": Session.get("answers_test"),
        "user": Session.get("answers_testId")
      }, {
        sort: {
          answerID: 1
        }
      }).fetch();
      var b = Kuestions.find({
        "test": Session.get("answers_test")
      }, {
        sort: {
          _id: 1
        }
      }).fetch();
      var c = [];
      for (var i = 0; i < a.length; i++) {
        c[i] = {};
        b[i] = b[i] || {};
        c[i].question = b[i].question || "";
        b[i].answers = b[i].answers || [""];
        c[i].answerOK = b[i].answers.map(function(a) {
          return (a.value == 1) ? a.text : "";
        }).join("") || "";
        //console.dir(c[i]);
        //console.log( "Compare " + b[i]._id + " with " + a[i].answerID );
        c[i].answerTXT = a[i].answerTXT || "";
        c[i].correcto = (c[i].answerOK == c[i].answerTXT && c[i].answerOK !== "") ? "success" : "";
      }
      return c;
    }
  });

  Template.admin_team.helpers({
    teamList: function() {
      var kt = KTeam.find().fetch();
      for (var k in kt) {
        kt[k].txt_email = (kt[k].alert_email) ? "SI" : "NO";
        kt[k].cls_email = (kt[k].alert_email) ? "btn-success" : "btn-danger";
      }
      return kt;
    },
    teamFieldNames: function() {
      var fields = ["Nombre", "Descripcion", "imagen", "twitter link", "Twitter", "Email", "Alert Email"];
      return fields;
    }
  });
  Template.admin_team.events({
    'click tr': selectRow,
    'keypress td': updateFn,
    'click .btn_alert_email': function(e) {
      var id = e.target.id.replace("btn_alert_email_", "");
      var newVal = (e.target.textContent === "NO") ? "true" : "false";
      //console.log( "content: " + e.target.textContent);
      Meteor.call("updateEmailAlert", {
        id: id,
        val: newVal
      }, function() {});
    }
  });

  Template.admin_json.helpers({
    uploaded: function() {
      return {
        finished: function(index, fileInfo, context) {
          console.log("TERMINO");
          Session.set("jsonFileName", fileInfo);
        }
      };
    },
    json_filename: function() {
      var jf = Session.get("jsonFileName");
      if (jf !== "") {
        $("#uploadLayer").show();
        $("#loaddbLayer").hide();
      } else {
        $("#uploadLayer").hide();
        $("#loaddbLayer").show();
      }
      return jf;
    }
  });

  Template.generate_code.events({
    'click .generate_code': function(e) {
      var id = e.target.id;
      Meteor.call('generate_code',{user:Meteor.userId()}, function(err, response){
        if (err) {
          console.log(err, response);
        } else {
          //console.log('code generated ' + response);
          Session.set('code_generated', response);
          document.querySelector(".copyCodeBtn").style.display = 'block';
        }
      });
    },
    'click .copyCodeBtn': function(e) {
        var selectText = function(objHTML) {
          if (document.selection) {
              var range = document.body.createTextRange();
              range.moveToElementText(objHTML);
              range.select();
          } else if (window.getSelection) {
              var range = document.createRange();
              range.selectNode(objHTML);
              window.getSelection().addRange(range);
          }
        }
        var unSelectText = function(e) {
          if (document.selection) {
             document.selection.empty();
          }  else if (window.getSelection) {
            window.getSelection().removeAllRanges();
          }
        }
        var copycodearea = document.querySelector('.copycodearea');
        selectText(copycodearea);
        try {
          var successful = document.execCommand('copy');
        } catch (err) {
          console.log('Error, no se puede copiar');
        }
        setTimeout(function(){
          unSelectText();
        }, 100);
    }
  });
  Template.generate_code.helpers({
    'code_generated': function(){
      var kcode = Session.get('code_generated');
      var codeStr = (kcode)?document.location.origin + '/?kcode=' + kcode:'';
      return codeStr;
    }
  });

  Template.kcode_list.events({
    'click .delKcode': function(ev) {
      var id = ev.target.id;
      Meteor.call(
        'deleteKcode', {
          id: id
        },
        function(err, response) {
          if (err) {
            console.log(err, response);
          }
        }
      );
    }
  });
  Template.kcode_list.helpers({
    'kcodeFieldNames': function() {
      var fields = ['Link Activo', 'Responsable'];
      return fields;
    },
    'kcodeList': function() {
      var kc = Kcode.find().fetch();
      for(k in kc) {
        kc[k].link = document.location.origin + '/?kcode=' + kc[k].code;
        kc[k].inuse = (kc[k]['user']!=='') ? 'USANDOSE' : '';
        kc[k].inuse_style = (kc[k]['user']!=='') ? 'background:rgba(0,255,0,0.3);' : '';
      }
      return kc;
    }
  });

  Template.insertModal.helpers({
    db: function() {
      return Session.get('dbName');
    },
    dbTests: function() {
      return (Session.get("dbName") == "Tests");
    },
    dbKuestions: function() {
      return (Session.get("dbName") == "Kuestions");
    },
    dbTeam: function() {
      return (Session.get("dbName") == "Kairos Team");
    }
  });
  Template.insertModal.events({
    'click .save': function() {
      var values = $("#insertForm").serializeObject();
      //console.log( values );
      window[Session.get("db")].insert(values);
      $('[data-dismiss="modal"]').trigger("click");
      $('#insertForm').trigger("reset");
    }
  });

  Template.navbar.helpers({
    actions: function() {
      var actions = "";

      if (this.navbar == "results") {
        var users = _.uniq(Results.find({}, {
          sort: {
            username: 1
          },
          fields: {
            username: true
          }
        }).fetch().map(function(x) {
          return x.username;
        }), true);
        var uO = "";
        //console.log(users);
        for (var k in users) {
          uO += "<option value='" + users[k] + "'>" + users[k] + "</option>";
        }
        var tests = Tests.find({}).fetch();
        var tO = "";
        for (k in tests) {
          for (var k2 in tests[k].tests) {
            tO += "<option value='" + tests[k].tests[k2].name + "'>" + tests[k].tests[k2].name + "</option>";
          }
        }
        actions += '<form id="filterForm"><label>Filter by:</label>';
        actions += '<div class="form-control input-daterange input-group" id="datefilter">';
        actions += '<input type="text" class="input-sm form-control datefilter" id="datefilterstart" name="datefilterstart" placeholder="date filter start" />';
        actions += '<span class="input-group-addon">to</span>';
        actions += '<input type="text" class="input-sm form-control datefilter" id="datefilterend" name="datefilterend" placeholder="date filter end" />';
        actions += '</div> ';
        actions += '<select class="form-control" id="userfilter"><option>User Filter</option>' + uO + '</select> ';
        actions += '<select class="form-control" id="testfilter"><option>Test Filter</option>' + tO + '</select> ';
        actions += '<button class="btn btn-info" id="cleanFilter">Clean Filter</button></form>';
      }

      if (this.navbar == "team") {
        actions += '<form id="kteamForm">';
        actions += '<div class="form-group">';
        actions += '<div class="form-group">';
        actions += '<label class="col-sm-1 control-label">Actions: </label>';
        actions += '</div><div class="form-group">';
        actions += '<button class="btn btn-info insert" id="insertMember">Insert Member</button>';
        actions += '</div>';
        actions += '</form>';
        actions += '</div>';
      }

      return actions;
    }
  });
  Template.navbar.rendered = function() {

  };
  Template.navbar.events({
    'click .insert': function(e) {
      $('#insertModal').modal({
        backdrop: 'static',
        keyboard: false
      });
      return false;
    },
    'click #cleanFilter': function() {
      $("#filterForm")[0].reset();
      Session.set("filter", {});
      return false;
    },
    'click #datefilter.input-daterange': function() {
      if (firstClickDatePicker) {
        firstClickDatePicker = false;
        $('#datefilter.input-daterange').datepicker({
          format: "dd/mm/yyyy",
          weekStart: 1,
          clearBtn: true,
          language: "es",
          orientation: "top auto",
          autoclose: true,
          todayHighlight: true
        });
        $("#datefilterstart").trigger("blur");
        $("#datefilterstart").trigger("click");
      }
    },
    'change .datefilter': function(e) {
      var dS = $("#datefilterstart").val();
      var dE = $("#datefilterend").val();
      var filterNow = Session.get("filter");
      if (dS !== "" && dE !== "") {
        dS = dS.split("/");
        dE = dE.split("/");
        var dateStart = new Date(dS[1] + "-" + dS[0] + "-" + dS[2]);
        var dateEnd = new Date(dE[1] + "-" + dE[0] + "-" + dE[2]);
        dateEnd = new Date(dateEnd.setDate(dateEnd.getDate() + 1));
        console.log("datefilter changed " + dateStart + " , " + dateEnd);
        filterNow.date = {
          $gte: dateStart,
          $lt: dateEnd
        };
      } else {
        delete(filterNow.date);
      }
      Session.set("filter", filterNow);
    },
    'change #userfilter': function(e) {
      console.log("userfilter changed " + e.target.value);
      var user = e.target.value;
      var filterNow = Session.get("filter");
      if (user !== "User Filter") {
        filterNow.username = user;
      } else {
        delete(filterNow.username);
      }
      Session.set("filter", filterNow);
    },
    'change #testfilter': function(e) {
      console.log("testfilter changed" + e.target.value);
      var test = e.target.value;
      var filterNow = Session.get("filter");
      if (test !== "Test Filter") {
        filterNow.user = {
          '$regex': test + '$'
        };
      } else {
        delete(filterNow.user);
      }
      Session.set("filter", filterNow);
    }
  });

  Template.uploadJsonForm.onCreated(function () {
    this.currentUpload = new ReactiveVar(false);
  });

  Template.uploadJsonForm.helpers({
    currentUpload: function () {
      return Template.instance().currentUpload.get();
    }
  });

  Template.uploadJsonForm.events({
    'change #fileInput': function (e, template) {
      if (e.currentTarget.files && e.currentTarget.files[0]) {
        // We upload only one file, in case
        // multiple files were selected
        var upload = Json.insert({
          file: e.currentTarget.files[0],
          streams: 'dynamic',
          chunkSize: 'dynamic'
        }, false);

        upload.on('start', function () {
          template.currentUpload.set(this);
        });

        upload.on('end', function (error, fileObj) {
          if (error) {
            alert('Error during upload: ' + error);
          } else {
            alert('File "' + fileObj.name + '" successfully uploaded');
          }
          template.currentUpload.set(false);
        });

        upload.start();
      }
    }
  });

  FlowRouter.route('/', {
    name: 'Kadmin.show',
    action() {
      BlazeLayout.render('adminLayer', {});
    }
  });

  FlowRouter.route('/k-manage/', {
    name: 'Kmanage.show',
    action() {
      BlazeLayout.render('managerBody', {});
    }
  });

  FlowRouter.notFound = {
    // Subscriptions registered here don't have Fast Render support.
    subscriptions: function() {

    },
    action: function() {
      console.log("no encontrado")
    }
};
}