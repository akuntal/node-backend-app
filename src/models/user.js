'use strict';
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
bcrypt = require('bcrypt'),
SALT_WORK_FACTOR = 10,
MAX_LOGIN_ATTEMPTS = 3,
LOCK_TIME = 2 * 60 * 60 * 1000;

var userSchema = new Schema({
	name: { type: String, required: true},
	username: { type:String, required:true, unique:true},
	password: { type:String, required:true},
	loginAttempts: { type:Number, required:true, default:0},
	lockUntil: { type:Number}
})

userSchema.pre('save',function(next){
	let user = this;
	if(!user.isModified('password')) return next();

	bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt)=>{
		if(err) return next(err);
		
		bcrypt.hash(user.password, salt, (error, hash)=>{
			if(error) return next(error);

			//overriding password text with hashed one
			user.password = hash;
			next();
		})
	})
})

userSchema.virtual('isLocked').get(function(){
	//check for future lockUntil timestamp
	return !!(this.lockUntil && this.lockUntil> Date.now());
});

userSchema.methods.comparePassword = function(candidatePassword, cb){
	bcrypt.compare(candidatePassword, this.password, (err, isMatch)=>{
		if(err) return cb(err);
		cb(null, isMatch);
	});
}

userSchema.methods.incLoginAttempts = function(cb){
	//if we have previous lock that has expired, restart at 1
	if(this.lockUntil && this.lockUntil < Date.now()){
		return this.update({
			$set:{loginAttempts: 1},
			$unset: {lockUntil: 1}
		}, cb)
	}

	//otherwise we're incrementing 
	var updates = { $inc: { loginAttempts: 1 }};

	//lock the account if we've reached max attempts and it's not locked already
	if(this.loginAttempts+1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked){
		updates.$set = { lockUntil: Date.now() + LOCK_TIME}
	}
	return this.update(updates, cb);
}

//expose enum on the model, and provide an internal convenience reference
var reason = userSchema.statics.failedLogin = {
	NOT_FOUND: 0,
	PASSWORD_INCORRECT: 1,
	MAX_ATTEMPTS: 2
}

userSchema.statics.getAuthenticated = function(username, password, cb){
	this.findOne({username: username}, (err, user)=>{
		if(err) cb(err);

		//make sure user exists
		if(!user){
			return cb(null, null, reason.NOT_FOUND);
		}

		//check if the account is currently locked
		if(user.isLocked){
			//just increment login attempts if account is already locked
			return user.incLoginAttempts((err)=>{
				if(err) cb(err);
				return cb(null, null, reason.MAX_ATTEMPTS)
			})
		}

		//test for matching password
		user.comparePassword(password, (err, isMatch)=>{
			if(err) return cb(err);

			//check if password was a match
			if(isMatch){
				//if there's no lock or failed attempts, just return the user
				if(!this.loginAttempts && !this.lockUntil) return cb(null, user);

				//reset attempts and lock info

				var updates = {
					$set: { loginAttempts: 0},
					$unset: { lockUntil: 1}
				}

				return user.update(updates, (err)=>{
					if(err) return cb(err);
					return cb(null, user);
				})
			}

			//password is incorrect, so increment login attempts before responding
			user.incLoginAttempts((err)=>{
				if(err) return cb(err);
				return cb(null, null, reason.PASSWORD_INCORRECT);
			})
		})
	})
}

var User = mongoose.model('User', userSchema);
module.exports = User;