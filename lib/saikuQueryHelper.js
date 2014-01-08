(function() {
    var http = require('http'),
        querystring = require('querystring'),
        xml2js = require('xml2js'),
        async = require('async');

    module.exports = function SaikuQueryHelper(saiku_host, saiku_port, username, password) {
        var rest_path = "/saiku/rest/saiku";

        // queryname is the name of the query stored in the saiku server (.saiku file)
        // params is a hash containing the parameters to replace in the query
        this.query = function(queryname, refreshCache, params, queryCallback) {
            async.waterfall([

            // Step 1 : auth

            function(callback) {
                console.log('authenticating');
                var post_data = querystring.stringify({
                    'username': username,
                    'password': password
                });
                var options = {
                    hostname: saiku_host,
                    port: saiku_port,
                    path: rest_path + '/session',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': post_data.length
                    }
                };
                var req = http.request(options, function(res) {
                    //STATUS: 200
                    //HEADERS: {"server":"Apache-Coyote/1.1","set-cookie":["JSESSIONID=445F09500EBB6AA5C1A96A747574200A; Path=/saiku"],"content-length":"0","date":"Thu, 07 Mar 2013 18:38:13 GMT"}
                    res.setEncoding('utf8');

                    if (res.statusCode == 200) {
                        //extracting the JSESSIONID
                        var jsessionid = res.headers["set-cookie"][0].split(';')[0].split('=')[1];

                        callback(null, jsessionid);
                    } else {
                        callback("Authentication failed.", null);
                    }
                });

                req.on('error', function(e) {
                    callback(e, null);
                });
                req.write(post_data);
                req.end();
            },

            // Step 2 : reading repository to find request

            function(jsessionid, callback) {
                console.log('reading repo to find MDX query');
                var url = "http://" + saiku_host + ":" + saiku_port + rest_path + '/' + username + '/repository;jsessionid=' + jsessionid;
                var body = "";

                http.get(url, function(res) {
                    res.on('data', function(chunk) {
                        body += chunk;
                    });
                    res.on('end', function() {
                        var jsonBody = JSON.parse(body);
                        var foundQuery = false;
                        for (var i = 0; i < jsonBody.length; i++) {
                            if (jsonBody[i].name == queryname) {
                                foundQuery = true;
                                var xmlQuery = jsonBody[i].xml;

                                //we have the JSESSIONID, and the xml, let's create the query
                                callback(null, jsessionid, xmlQuery);
                            }
                        }

                        if(!foundQuery){
                            callback("Query not found : " + queryname, null);
                        }
                    });
                }).on('error', function(e) {
                    callback(e, null);
                });
            },

            // Step 3 : refresh the cache if specified

            function(jsessionid, xmlQuery, callback) {
                //extract information from the xml
                var parser = new xml2js.Parser();

                console.log('extracting repo information');
                parser.parseString(xmlQuery, function(err, query) {
                    if (err) {
                        callback('Error while parsing xml query', null);
                    } else {
                        var connection = query.Query.$.connection,
                            cube = query.Query.$.cube,
                            catalog = query.Query.$.catalog,
                            schema = query.Query.$.schema;

                        if (refreshCache) {
                            console.log('refreshing cache');
                            var url = "http://" + saiku_host + ":" + saiku_port + rest_path + "/" + username + "/discover/" + connection + "/refresh";
                            http.get(url, function(res) {
                                res.on('end', function() {
                                    callback(null, jsessionid, xmlQuery, connection, cube, catalog, schema);
                                });
                            }).on('error', function(e) {
                                callback(e, null);
                            });
                        } else {
                            callback(null, jsessionid, xmlQuery, connection, cube, catalog, schema);
                        }
                    }
                });
            },

            // Step 4 : create query

            function(jsessionid, xmlQuery, connection, cube, catalog, schema, callback) {
                var timestamp = new Date().getTime();
                var tmpQueryName = queryname + '-' + timestamp;

                console.log('replacing parameters in query');

                //replacing the parameters in the query
                for (var param in params) {
                    xmlQuery = xmlQuery.replace("${" + param + "}", params[param]);
                }

                console.log('declaring query in saiku server');

                var post_data = querystring.stringify({
                    'connection': connection,
                    'cube': cube,
                    'catalog': catalog,
                    'schema': schema,
                    'xml': xmlQuery,
                    'queryname': tmpQueryName
                });

                var options = {
                    hostname: saiku_host,
                    port: saiku_port,
                    path: rest_path + '/' + username + '/query/' + tmpQueryName + ';jsessionid=' + jsessionid,
                    method: 'POST'
                };

                var req = http.request(options, function(res) {
                    res.on('end', function() {
                        if (res.statusCode == 200) {
                            callback(null, jsessionid, tmpQueryName);
                        } else {
                            callback("Failed pushing the query to the saiku server", null);
                        }
                    });
                });

                req.on('error', function(e) {
                    callback(e, null);
                });
                req.write(post_data);
                req.end();
            },

            // Step 5 : executing the newly created query

            function(jsessionid, tmpQueryName, callback) {
                var url = "http://" + saiku_host + ":" + saiku_port + rest_path + "/"+username+"/query/" + tmpQueryName + "/result;jsessionid=" + jsessionid;
                http.get(url, function(res) {
                    res.setEncoding('utf8');
                    var result = "";
                    res.on('data', function(chunk) {
                        result += chunk;
                    });
                    res.on('end', function() {
                        var jsonResult = JSON.parse(result);
                        callback(null, jsonResult);
                    });
                });
            }],
            queryCallback
            );
        }
    }
})();