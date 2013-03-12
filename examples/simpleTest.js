var SaikuQueryHelper = require('../lib/saikuQueryHelper.js');

var queryHelper = new SaikuQueryHelper('localhost','8080','bob','dylan');
// "weatherLogCubeParam" because our query is saved in saiku-server/tomcat/webapps/saiku/WEB-INF/classes/saiku-repository/weatherLogCubeParam.saiku
queryHelper.query("weatherLogCubeParam",true,{PropertyID: 10}, function(err,result){
	console.log(result);
});
