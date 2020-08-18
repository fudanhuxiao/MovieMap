/* Autocomplete for searching */
var mysql=require('mysql');
var async=require('async'); // Use Sync for DB Search

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

function getResults(req, callback) {
	if(req.query.typeahead==""){
		var results=[];
		results.push("Not Found");
		callback(results);
	} else {
		//connection.query('SELECT title from Movie where title like "%'+req.query.typeahead+'%"', function(err, rows, fields) {
		//connection.query('SELECT title from Movie where title="'+req.query.typeahead+'";', function(err, rows, fields) {
		var results=[];		
		var attrs = req.query.typeahead.split("MovieId=");
		// Default query (Search a movie from the title (URL does not include "MovieId="))
		var query = 'SELECT mid, date_format(rdate, '+"'%m/%d/%Y'"+') as reldate from Movie where title="'+req.query.typeahead+'";';
		// If the URL include "MovieId=", search with MovieId (Update the query)
		if(attrs.length > 1) {
			var temp_Mid = attrs[1];
			query = 'SELECT mid from Movie where mid="'+temp_Mid+'";';
		}
		
		console.log("Query is "+query);
		connection.query(query, function(err, rows, fields) {
			if (err) throw err;
			if(rows.length==0) {
				results.push("Not Found");
				callback(results);
			} else if (rows.length==1) {
				// Use only the first result of the previous query
				// First Level 1 (expect 10 results)
				connection.query('SELECT CMid from Compare where Mid="'+rows[0].mid+'";', function(err2, rows2, fields2) {
					if (err2) throw err;
					if(rows2.length==0) {
						results.push("Not Found");
						callback(results);
					} else {
						var temp=[];
						temp.push(rows[0].mid); // Level 0
						// Level 1 (10 title)
						for(i=0;i<rows2.length;i++) {
							temp.push(rows2[i].CMid);
						}
						
						// Find Level2
						var cnt=0;
						// Wait until all the results are obtained
						async.map(temp, function(t, done) {
							if(cnt==0) {
								// Level 0
								done(null, t);
							} else {
								// Call Back for searching Mid of Level2
								connection.query(
										'SELECT CMid FROM Compare WHERE Mid="'+ t +'" LIMIT 2;',
										function(err3, rows3, fields3) {
									if (err3) return done(err);
									var temp2=[];
									if(rows3.length==0) {
										temp2.push("Not Found");
										done(null, temp2);	
									} else {
										// Level 1
										temp2.push(t);
										// Level 2
										for(i=0; i<rows3.length; i++) {
											temp2.push(rows3[i].CMid);
										}
										//console.log(cnt+": "+temp2);
										done(null, temp2);
									}
								});
							}
							cnt++;
						}, function(err, titles) {
							  if (err) console.log(err);
							  var temp3=[];
							  temp3.push(titles[0]);
							  for(i=1; i<titles.length; i++){
								  for(j=0; j<titles[i].length; j++){
									  temp3.push(titles[i][j]);
								  }
							  }
							  //for(i=0; i<temp3.length; i++){
							  //	  console.log("Final Result: "+temp3[i]);
							  //}

							  // Convert Mid to Movie Title (Sync)
							  async.map(temp3, function(t, done) {
							  		connection.query('SELECT mid, title from Movie where Mid="'+ t +'";', function(err4, rows4, fields4) {
										if (err4) return done(err);
										if(rows4.length==0) {
											done(null, "Not Found");
										} else {
											// Convert Mid to title (expect 1 result)
											//done(null, rows4[0].title);
											done(null, rows4[0]);
										}
									});			
							  }, function(err, titles) {
								  // Call Back for converting Mid to title
								  if (err) console.log(err);
								  // Insert temp (Search results) to results array
								  for(i=0;i<titles.length;i++) {
									  //console.log(titles[i]);
									  if(titles[i]=="Not Found") {
										  results[0]=titles[i];
									  } else {
											results[i]=titles[i];
									  }
								  }
								  callback(results);
							  });
						});
					}
					
				});
				
			} else { // rows.length >= 2
				results.push("Multiple Results");
				for(i=0; i<rows.length; i++) {
					// Results = Mid
					results.push("MovieId="+rows[i].mid);
					// Results = {Title}+{Release Date}
					results.push(req.query.typeahead+" (Release Date: "+rows[i].reldate+")");
					//console.log("Release Date: " + rows[i].rdate);
				}
				callback(results);
			}
		});

	}
};

function generateResponse(req, res) {
	getResults(req, function(results) {
		if(results[0]!="Multiple Results") {
			res.render('test.ejs', {results: results});
		} else {
			res.render('select.ejs', {results: results});
		}
		
	});
}

exports.displayResponse = function(req, res){
	//console.log("Argument: " + req.query.typeahead); // for logging
	generateResponse(req, res);
};