var Bing = require('node-bing-api')({ accKey: "lbbTk1700rey9CPcMhnadWFv3xEchW2xeq8HlAV7PBs" });

function getResults(req, callback) {
	var results=[];
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
		results.push("Not Found");
		callback(results);
	} else {
		Bing.images(categoryKey + " Movie", {top: 48}, function(error, res, body){
			  var myData = JSON.parse(JSON.stringify(body));
			  for (var i=0; i<myData.d.results.length; i++){
				  console.log(JSON.stringify(myData.d.results[i]));
				  results.push(myData.d.results[i]);
			  }
			  callback(results);
		});  	    
	}
};

function generateResponse(req, res) {
	getResults(req, function(results) {
		res.render('bingImage.ejs', {results: results});
	});
}

exports.displayResponse = function(req, res){
	//console.log("Argument: " + req.query.typeahead); // for logging
	generateResponse(req, res);
};