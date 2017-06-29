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

router.post('/login', jsonParser, (req, res)=>{
	if(!req.body) res.sendStatus(400);
	
	User.getAuthenticated(req.body.username, req.body.password, (err, user, reason)=>{
		if(err) res.sen(err);
		//login was successfull if we've an user
		if(user){
			//handle login success
			console.log('login success');
			res.send(user);
		}

		// otherwise we can determine why we failed
        var reasons = User.failedLogin;
        switch (reason) {
            case reasons.NOT_FOUND:
            case reasons.PASSWORD_INCORRECT:
                res.sendStatus(401)
                break;
            case reasons.MAX_ATTEMPTS:
                res.send('MAX_ATTEMPTS reached, Account locked');
                break;
        }
	})
})


module.exports = router;

