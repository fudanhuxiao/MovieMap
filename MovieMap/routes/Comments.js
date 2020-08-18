/* Autocomplete for searching */
var mysql=require('mysql');
// var async=require('async'); // Use Sync for DB Search
var MongoClient = require('mongodb').MongoClient;

var db_config = {
	host     : 'cis550projectinstance.ceiky6amhkbp.us-east-1.rds.amazonaws.com',
	user     : 'XYZH',
	password : 'mimashi1234',
	database : 'cis550projectDB'
}

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

function checkUndefined(arg){
	if(arg=void 0){
		return "";
	} else {
		return arg;
	}
}

function getResults(Mid, Comments, db, callback) {
	var results=[];	
	
	/*
	if(-1 == url.indexOf("?")) {
		results.push("Not Found");
		callback(results);
		return;
	}
	
	// Get title of the movie
    //parameters    = url.split("?");
    //console.log("parameters[1]: " + parameters[1]); // for logging
    if((parameters[1]=="") || (parameters[1]==null)){
		results.push("Not Found");
		callback(results);
		return;
    }
    // params   = parameters[1].split("=");
    // var paramsArray = params[1];
    //console.log("paramsArray: " + paramsArray);
    //var categoryKey = decodeURI(paramsArray["title"]); // Obtain adn Decode
    */	
	
    var categoryKey = Mid; // Obtain adn Decode
    if((categoryKey=="") || (categoryKey==null)){
		results.push("Not Found");
		callback(results);
		return;
    }
    console.log("Argument: " + categoryKey); // for logging
    console.log("Comments: " + Comments);
	if(categoryKey==""){
		results.push("Not Found");
		callback(results);
	} else {
		/*
		var query;
		
		if(Comments != ""){
			query = 'insert into Comments VALUES('+categoryKey+', \''+Comments+'\');'
			console.log("query: " + query);
			connection.query(query, function(err, rows, fields) {
				if(err) throw err;
			});
		}
		*/	
		
		// MongoDB
		MongoDBquery = {};
		MongoDBquery[Mid] = categoryKey;
		MongoDBquery[Comments] = Comments;
		console.log("MongoDBquery: " + MongoDBquery);
		
		var cursor = db.collection('comments').insert({Mid:categoryKey,comment:Comments});
		
		// end MongoDB
	
		results = [];
		results.url = "getDetail?mid="+categoryKey;
		console.log("results.url: " + results.url);
		callback(results);
	
	}
	callback
};

function generateResponse(req, res) {
	console.log("Return to getDetail.");
	var url = 'mongodb://cis550project:mimashi1234@ec2-52-20-74-142.compute-1.amazonaws.com:27017/cis550project';
	MongoClient.connect(url, function(err, db) {
		// If there is an error, log the error and render the error page 
		if(err != null) {
			console.log("Connection to server failed.");
			db.close();
			res.render('error', {
				message: "Connection to server failed.",
				error: err
			});
		}
		// If there is no error while connecting, proceed further
		else {
			console.log("Connected correctly to server.");
			getResults(req.body.Mid, req.body.comments, db, function(results) {
				res.redirect(results.url);
			});
		}
	});
	
	// Mysql
	// getResults(req.body.Mid, req.body.comments, function(results) {
	//	res.redirect(results.url);
	// });
}

exports.displayResponse = function(req, res){
	console.log("Call Comments");
	generateResponse(req, res);
};