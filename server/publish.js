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
Meteor.publish("testsgroup", function () {
  return TestsGroup.find({});
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