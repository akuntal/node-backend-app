var express = require('express'),
router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var User = require('./models/user');

var jsonParser = bodyParser.json()

mongoose.connect('mongodb://alok:alok@ds135812.mlab.com:35812/users_test', (err)=>{
	if(err) throw err;
	console.log("successfully connected to mongodb!!!")	
});


router.get('/users',(req, res)=>{
	User.find({},[],(err,data)=>{
		res.send(data);
	});
	
})

router.post('/user', jsonParser, (req, res)=>{
	if (!req.body) return res.sendStatus(400);
	
	let user = new User(req.body);
	user.save((err)=>{
		if(err)res.send(err);
		res.send(req.body)
	})
})



module.exports = router;

