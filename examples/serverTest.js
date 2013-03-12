var express = require('express'),
SaikuQueryHelper = require('../lib/saikuQueryHelper.js');

// Replace with your own server credentials
var queryHelper = new SaikuQueryHelper('localhost','8080','bob','dylan');

var app = express();

// WARNING : please note that this server is just an example which doesn't include user authentication, therefore anybody will be able to query your data if hitting the good URL.
// You shouldn't use that in production!
app.get('/',function(req,res){
	if (req.query['queryname'] && req.query['propertyID']) {
		queryHelper.query(req.query['queryname'],true,{PropertyID: req.query['propertyID']}, function(err,result){
			if(err){
				res.send("Error while executing the query : "+err);
				res.end();
			}else{
				res.writeHead(200, {
					'Content-Type': 'application/json'
				});
				res.write(JSON.stringify(result));
				res.end();
			}
		});
	} else {
		res.send("Missing parameter, usage : http://localhost:1789?queryname=weatherLogCubeParam&propertyID=10");
		res.end();
	}	
});

// Launch server
var port = process.env.PORT || 1789;
app.listen(port); // server is running : http://localhost:1789?queryname=weatherLogCubeParam&propertyID=10