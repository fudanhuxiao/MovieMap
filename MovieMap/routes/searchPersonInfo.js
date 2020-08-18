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
	var url   = req.url;
	console.log("URL:"+url);
	// Get a parameter
    parameters    = url.split("?");
    console.log("parameters[1]: " + parameters[1]); // for logging
    if((parameters[1]=="") || (parameters[1]==null)){
		results.push("Not Found");
		callback(results);
		return;
    }
    params   = parameters[1].split("=");
    var paramsArray = params[1];
    var categoryKey = decodeURI(paramsArray); // Obtain adn Decode
    console.log("Argument: " + params); // for logging
	if(categoryKey==""){
		var results=[];
		results.push("Not Found");
		callback(results);
	} else {
		var results=[];
		var query =  'SELECT P.Name, date_format(P.DoB, '+"'%m/%d/%Y'"+') as bdate, P.Profile,\
				M.Mid, M.title, A.CharacterName\
				FROM Person P INNER JOIN Act A ON A.Pid = P.Pid\
				INNER JOIN Movie M ON M.Mid=A.Mid\
				WHERE P.Pid="'+categoryKey+'"\
				ORDER BY M.popularity DESC;'
		if(params[0]=="DirectorId") {
			query =  'SELECT P.Name, date_format(P.DoB, '+"'%m/%d/%Y'"+') as bdate, P.Profile,\
				M.Mid, M.title\
				FROM Person P INNER JOIN Directors D ON D.Pid = P.Pid\
				INNER JOIN Movie M ON M.Mid=D.Mid\
				WHERE P.Pid="'+categoryKey+'"\
				ORDER BY M.popularity DESC;'
		}
		connection.query(query, function(err, rows, fields) {
			  if (err) throw err;
			  if(rows.length==0) {
				  // No Data
				  results.push("Not Found");
				  callback(results);
			  } else {
				  results.push(rows[0].Name);
				  results.push(rows[0].bdate);
				  results.push(rows[0].Profile);
				  // URL for Movie Link
				  var temp = url;
				  var tparam = temp.split('/'[1]);
				  var plink = temp.replace(tparam, "getDetail?mid=");
				  for(i=0; i<rows.length; i++){
					  results.push(rows[i].title);
					  results.push(plink+rows[i].Mid);
					  if(rows[i].CharacterName==void 0) {
						  results.push("-");
					  } else {
						  results.push(rows[i].CharacterName);
					  }
				  }
				  callback(results);
			  }
		});
	}
};

function generateResponse(req, res) {
	getResults(req, function(results) {
			res.render('person.ejs', {results: results});
	});
}

exports.displayResponse = function(req, res){
	//console.log("Argument: " + req.query.typeahead); // for logging
	generateResponse(req, res);
};