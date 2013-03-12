Saiku Query Helper
==========

A simple node client for Saiku REST api. 
The aim of this package is to run parameterized MDX queries, while minimizing the boilerplate code.
Parameters in your **.saiku file** should be have the following form :

    ${MyParameter}

## Getting Started
Install the module with: `npm install -g saiku-query-helper`

## Usage
In order to run the examples you need to have a local Saiku server running with default configuration.

http://analytical-labs.com/downloads.php

Here is a straightforward example :

    var SaikuQueryHelper = require('../lib/saikuQueryHelper.js');
    
    var queryHelper = new SaikuQueryHelper('localhost','8080','bob','dylan');
    // "weatherLogCubeParam" because our query is saved in saiku-server/tomcat/webapps/saiku/WEB-INF/classes/saiku-repository/weatherLogCubeParam.saiku
    queryHelper.query("weatherLogCubeParam",true,{PropertyID: 10}, function(err,result){
        console.log(result);
    });


Another example containing a simple web server acting as a Saiku "wrapper" around saiku is also available in the "examples" directory.

This package has been tested with Saiku server 2.4 and might not work with future versions (if Saiku REST api changes in the future).

That's all folks!

## License
Copyright (c) 2013 Fabien Allanic  
Licensed under the MIT license.
