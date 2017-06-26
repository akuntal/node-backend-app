'use strict';
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
bcrypt = require('bcrypt'),
SALT_WORK_FACTOR = 10;

var userSchema = new Schema({
	username:{type:String, required:true, unique:true},
	password:{type:String, required:true}
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

userSchema.methods.comparePassword = function(candidatePassword, cb){
	bcrypt.compare(candidatePassword, this.password, (err, isMatch)=>{
		if(err) return cb(err);
		cb(null, isMatch);
	});
}

var User = mongoose.model('User', userSchema);
module.exports = User;