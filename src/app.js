var express = require('express'),
router = express.Router();
var mongoose = require('mongoose');
var User = require('./models/user');

mongoose.connect('mongodb://localhost:27017/users_test');

router.get('/users',(req, res)=>{
	res.send('Users list to send');
})

module.exports = router;

