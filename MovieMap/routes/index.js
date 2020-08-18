var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('homepage');
});

router.get('/references', function(req, res, next) {
	res.render('references');
});

router.get('/find', function(req, res, next) {
	//log
	console.log("find"+req.query.valid); // User Name
	if(req.query.valid){
		// Need login to access
		res.render('find', {results: null});
	}else{
		res.redirect('/oauth');
	}
});

router.get('/test', function(req, res, next) {
	res.render('test', {results: null});
});

router.get('/detailinfo', function(req, res, next) {
	res.render('detailinfo', {results: null});
});

module.exports = router;
