/* Autocomplete for searching */
var mysql=require('mysql');
var async=require('async'); // Use Sync for DB Search
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

function getResults(req, db, callback) {
	var results=[];
	var url   = req.url;
	if(-1 == url.indexOf("?")) {
		results.push("Not Found");
		callback(results);
		return;
	}
	// Get title of the movie
    parameters    = url.split("?");
    console.log("parameters[1]: " + parameters[1]); // for logging
    if((parameters[1]=="") || (parameters[1]==null)){
		results.push("Not Found");
		callback(results);
		return;
    }
    params   = parameters[1].split("=");
    var paramsArray = params[1];
    //console.log("paramsArray: " + paramsArray);
    //var categoryKey = decodeURI(paramsArray["title"]); // Obtain adn Decode
    var categoryKey = decodeURI(paramsArray); // Obtain adn Decode
    console.log("Argument: " + categoryKey); // for logging
	if(categoryKey==""){
		results.push("Not Found");
		callback(results);
	} else {
		var query;
		async.waterfall([
		  // Get Movie Data
		  function(callback) {
			  query = 'SELECT M.title, D.rating, D.trailer, D.revenue, D.HP, D.budget, D.poster\
					FROM Movie M INNER JOIN Details D ON M.Mid = D.Mid\
					WHERE M.Mid="'+categoryKey+'";'
			  connection.query(query, function(err, rows, fields) {
				  if(err) throw err;
				  if(rows.length==0) {
						results.push("Not Found");
						callback(null,results);
				  } else {
						//console.log(rows);
						// Get URL for search the movie title
						link = url.replace("getDetail?mid", "searchDb?typeahead=MovieId")
						// arg 0-3
						results.push(link);
						results.push(rows[0].title);
						results.push(rows[0].rating);
						results.push(rows[0].trailer);
						// arg 4
						// Convert to embeded URL
						if(rows[0].trailer!=="") {
							var idwr = rows[0].trailer.split("watch?v=")[1];
							var id = idwr.split("&")[0];
						    var src = "https://www.youtube.com/embed/" + id;
							results.push(src);
						} else {
							results.push("");
						}
						
						var revn = rows[0].revenue;
						// Add comma to the number
						var revnLoc = String( revn ).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' );
						// arg 5-6
						results.push("$"+revnLoc);
						results.push(rows[0].HP);
						var bdgt = rows[0].budget;
						// Add comma to the number
						var bdgtLoc = String( bdgt ).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' );
						// arg 7-8
						results.push("$"+bdgtLoc);
						results.push(rows[0].poster);
						callback(null,results);
				  }
		      });
		  },
		  // Get Studio Data
	      function(results, callback) {
			  if(results[0]=="Not Found"){
				  callback(null,results);
			  }
			  query = 'SELECT S.name as studio\
					FROM Created_by CB INNER JOIN Studio S ON CB.Sid = S.Sid\
					WHERE CB.Mid="'+categoryKey+'";'
			  // arg 9
			  connection.query(query, function(err, rows, fields) {
				  if (err) throw err;
				  if(rows.length==0) {
					  // No Studio Data
					  results.push("");
					  callback(null,results);
				  } else {
					  results.push(rows[0].studio);
					  callback(null,results);
				  }
			  });
		  },
		  // Get Director Data
	      function(results, callback) {
			  if(results[0]=="Not Found"){
				  callback(null,results);
			  }
			  query = 'SELECT DR.Name as dname, date_format(DR.DoB, '+"'%m/%d/%Y'"+') as ddob,\
			  		DR.Profile as dprofile, DR.Pid as Did\
					FROM Directors DR INNER JOIN Person P ON DR.Pid = P.Pid\
					WHERE DR.Mid="'+categoryKey+'";'
			  connection.query(query, function(err, rows, fields) {
				  if (err) throw err;
				  // arg 10-13
				  if(rows.length==0) {
					  // No Director Data
					  results.push("");
					  results.push("");
					  results.push("");
					  results.push("");
					  callback(null,results);
				  } else {
					  // Director
					  // Name, Birth Date, Picture, URL to search the person
					  var temp = url;
					  var tparam = temp.split('/'[1]);
					  var plink = temp.replace(tparam, "searchPerson?");
					  results.push(rows[0].dname);
					  results.push(rows[0].ddob);
					  results.push(rows[0].dprofile);
					  results.push(plink+"DirectorId="+rows[0].Did);
					  callback(null,results);
				  }
			  });
		  },
		  function(results, callback) {
			  if(results[0]=="Not Found"){
				  callback(null,results);
			  }
			  // Create URL for bing image search
			  var temp = url;
			  var tparam = temp.split('/')[1];
			  var plink = temp.replace(tparam, "bingImgSrch?query=")+results[1];
			  // URL for bind image search
			  // arg 14
			  results.push(plink);
			  callback(null,results);
		  },
		  // Get Actor Data
	      function(results, callback) {
			  if(results[0]=="Not Found"){
				  callback(null,results);
			  }
			  query = 'SELECT P.Name as actor, date_format(P.DoB, '+"'%m/%d/%Y'"+') as bdate, P.Profile, A.Pid as Aid\
					FROM Act A INNER JOIN Person P ON A.Pid = P.Pid\
					WHERE A.Mid="'+categoryKey+'"\
					ORDER BY A.OrderNum ASC\
					LIMIT 14;'
			  // arg 15 -
			  connection.query(query, function(err, rows, fields) {
				  if (err) throw err;
				  if(rows.length==0) {
					  // No Actor Data
					  // Actor
					  results.push("");
					  results.push("");
					  results.push("");
					  results.push("");
					  callback(null,results);
				  } else {
					// Actor
					// Name, Birth Date, Picture, URL to search the person
					var temp = url;
					var tparam = temp.split('/'[1]);
					var plink = temp.replace(tparam, "searchPerson?");
					for(i=0; i < rows.length; i++) {
						results.push(rows[i].actor);
						results.push(rows[i].bdate);
						results.push(rows[i].Profile);
						results.push(plink+"ActorId="+rows[i].Aid);
					}
					callback(null,results);
				  }
			  });
		  },
		  function(results, callback) {
				if(results[0]=="Not Found"){
					callback(null,results);
				}
				
				console.log('MongoDB');
				var cursor = db.collection('comments').find({Mid:categoryKey});
				console.log('cursor: '+cursor);
				results.push("Comments Start here");
				cursor.each(function(err, doc) {
					if (doc != null) {
						//console.log(doc);
						results.push(doc.comment);
					} else {
						results.push(categoryKey);
						callback(null,results);
					}
				});
				
	  		},
		],
		function(err, results) { 
	        // callback
			console.log(results);
	        callback(results);
		});
	}
};

function generateResponse(req, res) {
	console.log("Return to detailinfo.");
	
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
			getResults(req, db, function(results) {
				res.render('detailinfo.ejs', {results: results});
			});
		}
	});
	/* old
	getResults(req, function(results) {
		res.render('detailinfo.ejs', {results: results});
	});
	*/
}

exports.displayResponse = function(req, res){
	generateResponse(req, res);
};