var express = require('express');
var router = express.Router();
var passport = require('passport');
 
// Access to /oauth
router.get('/', passport.authenticate('facebook'), function (req, res, next) {
	console.log('oauth');
    console.log(req, res, next);
});
 
// Access to /oauth/callback (after login)
router.get('/callback',    passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
	var string = encodeURIComponent(req.user.displayName);
	res.redirect('/find?valid=' + string);
});
 
module.exports = router;