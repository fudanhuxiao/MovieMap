/**
 * Author: Kaushik Yasaswy
 * Modify: H Kubota
 * Date: Saturday, 26-Sep-15 07:56:18 UTC
 */

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
//var sample = require('./routes/sampleRoute');
//var your_work = require('./routes/yourworkRoute');
var oauth = require('./routes/oauth');
var searchDb = require('./routes/searchFromDb');
var getDetail = require('./routes/getDetail');
var searchPerson = require('./routes/searchPersonInfo');
var bingImgSrch = require('./routes/bingImageSearch');
var comments = require('./routes/Comments');

/* Facebook login */
// Load Module
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
// Key obtained from facebook
var FACEBOOK_APP_ID = '495622180598640';
var FACEBOOK_APP_SECRET = 'e3c0619f08a9e88175df899138731e95';
//var FACEBOOK_APP_ID = '495617120599146';
//var FACEBOOK_APP_SECRET = 'def007e35ef30674da84ba2adc0bd0a7';
//serialize and deserialize
passport.serializeUser(function (profile, done) {
    done(null, profile);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});
// Use passport-facebook
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/oauth/callback",
    //callbackURL: "http://ec2-52-20-74-142.compute-1.amazonaws.com:9000/oauth/callback",
    enableProof: false
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

/* Autocomplete for searching */
var  mysql=require('mysql');
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

//connection.connect();
console.log("Connected To DB");


var app = express();

console.log('CIS450/550 MovieMap');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
app.use(passport.initialize());
app.use(passport.session());

// if you get a request for the sampleResponse page, call the 'displayResponse' function present in the 'sampleRoute' route
//app.get('/sampleResponse', sample.displayResponse);
// for your_work
//app.get('/yourworkResponse', your_work.displayResponse);
// for searching from DB
app.get('/searchDb', searchDb.displayResponse);
//for searching from DB
app.get('/getDetail', getDetail.displayResponse);
//for searching from DB
app.get('/searchPerson', searchPerson.displayResponse);
//for Bing Image Search
app.get('/bingImgSrch', bingImgSrch.displayResponse);
// for comments
app.post('/Comments', comments.displayResponse);

//facebook
//Router Setting
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use('/oauth', oauth);

// Autocomplete Search
app.get('/search',function(req,res){
	connection.query('SELECT title from Movie where title like "%'+req.query.key+'%"', function(err, rows, fields) {
		if (err) throw err;
	    var data=[];
	    for(i=0;i<rows.length;i++) {
	    	data.push(rows[i].title);
	    }
	    res.end(JSON.stringify(data));
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
